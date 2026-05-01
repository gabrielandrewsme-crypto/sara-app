import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SaraSphere, SphereState } from '../components/SaraSphere';
import { useSaraDispatcher } from '../hooks/useSaraDispatcher';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { formatSeconds, useVoiceLimits } from '../hooks/useVoiceLimits';
import { AppStackParamList } from '../navigation/types';
import { saraService } from '../services/saraService';
import { ttsService } from '../services/ttsService';
import { theme } from '../styles/theme';
import { SaraMessage } from '../types/sara';

type Props = NativeStackScreenProps<AppStackParamList, 'VoiceMode'>;

const STATUS_LABEL: Record<SphereState, string> = {
  idle: 'Toque na esfera para começar',
  listening: 'Ouvindo…',
  processing: 'Pensando…',
  responding: 'Respondendo…',
};

const AUTO_RESTART_DELAY_MS = 600;
const RESPONDING_FALLBACK_MS = 12000;

export function VoiceModeScreen({ navigation }: Props) {
  const limits = useVoiceLimits();
  const voice = useVoiceInput();
  const dispatch = useSaraDispatcher();

  const [state, setState] = useState<SphereState>('idle');
  const [hint, setHint] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [recordElapsed, setRecordElapsed] = useState(0);
  const [history, setHistory] = useState<SaraMessage[]>([]);

  const recordStartRef = useRef<number | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const respondingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closingRef = useRef(false);
  const turnRef = useRef(0);

  const stopRecordTimer = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const clearScheduledTimers = useCallback(() => {
    if (respondingTimerRef.current) {
      clearTimeout(respondingTimerRef.current);
      respondingTimerRef.current = null;
    }
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }, []);

  const goBack = useCallback(() => {
    closingRef.current = true;
    stopRecordTimer();
    clearScheduledTimers();
    ttsService.stop();
    voice.cancel();
    navigation.goBack();
  }, [navigation, stopRecordTimer, clearScheduledTimers, voice]);

  useEffect(() => {
    return () => {
      closingRef.current = true;
      stopRecordTimer();
      clearScheduledTimers();
      ttsService.stop();
      voice.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startListening = useCallback(async () => {
    if (closingRef.current) return;
    if (limits.monthlyRemainingSec <= 0 && !limits.isPremium) {
      Alert.alert(
        'Limite mensal atingido',
        'Você usou seus 40 minutos do mês. O contador zera no próximo mês.',
      );
      goBack();
      return;
    }
    setErrorMsg(null);
    setHint(null);
    const ok = await voice.start();
    if (!ok) {
      setState('idle');
      return;
    }
    recordStartRef.current = Date.now();
    setRecordElapsed(0);
    setState('listening');

    stopRecordTimer();
    tickRef.current = setInterval(() => {
      if (!recordStartRef.current) return;
      const elapsed = (Date.now() - recordStartRef.current) / 1000;
      setRecordElapsed(elapsed);
      if (elapsed >= limits.perInteractionLimitSec) {
        // auto-stop when per-interaction cap is reached
        stopAndProcess(true);
      }
    }, 250);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limits.monthlyRemainingSec, limits.isPremium, limits.perInteractionLimitSec, voice, stopRecordTimer, goBack]);

  const stopAndProcess = useCallback(
    async (auto = false) => {
      if (closingRef.current) return;
      stopRecordTimer();
      const startedAt = recordStartRef.current;
      recordStartRef.current = null;
      const recordedSec = startedAt ? (Date.now() - startedAt) / 1000 : 0;

      setState('processing');
      try {
        const text = await voice.stopAndTranscribe();
        if (recordedSec > 0) {
          await limits.recordSession(recordedSec);
        }
        if (!text) {
          setHint(auto ? 'Tempo máximo atingido sem fala detectada.' : 'Não captei nada.');
          scheduleRestart();
          return;
        }

        const nextHistory: SaraMessage[] = [
          ...history,
          { role: 'user', content: text },
        ];

        const action = await saraService.chat(nextHistory);
        const result = await dispatch(action);

        const reply = action.response || 'Ok.';
        const finalHistory: SaraMessage[] = [
          ...nextHistory,
          { role: 'assistant', content: reply },
        ];
        setHistory(finalHistory);
        setHint(
          result.ok
            ? result.summary ?? null
            : result.error
              ? `Não consegui executar: ${result.error}`
              : null,
        );
        setState('responding');

        const turn = ++turnRef.current;
        let consumed = false;
        const restartOnce = () => {
          if (consumed || closingRef.current) return;
          if (turnRef.current !== turn) return; // user interrupted, stale callback
          consumed = true;
          scheduleRestart();
        };

        ttsService.speak(reply, { onDone: restartOnce });

        // Fallback in case TTS never fires onDone (silent device, error)
        respondingTimerRef.current = setTimeout(restartOnce, RESPONDING_FALLBACK_MS);
      } catch (e: any) {
        setErrorMsg(e?.message ?? 'Algo deu errado.');
        setState('idle');
        scheduleRestart(2000);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [voice, limits, history, dispatch, stopRecordTimer],
  );

  const scheduleRestart = useCallback(
    (delay = AUTO_RESTART_DELAY_MS) => {
      clearScheduledTimers();
      restartTimerRef.current = setTimeout(() => {
        if (closingRef.current) return;
        if (!limits.isPremium && limits.monthlyRemainingSec <= 0) {
          setState('idle');
          return;
        }
        startListening();
      }, delay);
    },
    [clearScheduledTimers, limits.isPremium, limits.monthlyRemainingSec, startListening],
  );

  function onSpherePress() {
    if (state === 'idle') {
      startListening();
    } else if (state === 'listening') {
      stopAndProcess(false);
    } else if (state === 'responding') {
      // interrupt Sara talking and start listening immediately
      turnRef.current++;
      ttsService.stop();
      clearScheduledTimers();
      setHint(null);
      startListening();
    }
    // processing: ignore taps (request in flight)
  }

  const showWarning =
    !limits.isPremium && limits.monthlyPercent >= 80 && limits.monthlyPercent < 100;
  const showBlock =
    !limits.isPremium && limits.monthlyRemainingSec <= 0;

  return (
    <View style={styles.container}>
      <Pressable
        onPress={goBack}
        hitSlop={16}
        style={styles.closeButton}
      >
        <Text style={styles.closeText}>✕</Text>
      </Pressable>

      <View style={styles.header}>
        <Text style={styles.statusLabel}>{STATUS_LABEL[state]}</Text>
        {state === 'listening' ? (
          <Text style={styles.timer}>
            {formatSeconds(recordElapsed)} /{' '}
            {formatSeconds(limits.perInteractionLimitSec)}
          </Text>
        ) : null}
      </View>

      <View style={styles.sphereWrapper}>
        <Pressable
          onPress={onSpherePress}
          disabled={state === 'processing' || showBlock}
          hitSlop={32}
        >
          <SaraSphere state={state} size={220} />
        </Pressable>
      </View>

      <View style={styles.bottom}>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
        {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}

        {showWarning ? (
          <Text style={styles.warning}>
            Atenção: você já usou {limits.monthlyPercent}% dos 40 min mensais.
          </Text>
        ) : null}
        {showBlock ? (
          <Text style={styles.error}>
            Limite mensal atingido. Volte no próximo mês ou faça upgrade.
          </Text>
        ) : null}

        <Text style={styles.usage}>
          {limits.isPremium
            ? 'Premium · sem limite mensal'
            : `${formatSeconds(limits.monthlyUsedSec)} de ${formatSeconds(limits.monthlyLimitSec)} este mês`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
  },
  closeButton: {
    position: 'absolute',
    top: theme.spacing.xl,
    right: theme.spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeText: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  header: {
    paddingTop: theme.spacing.xxl + theme.spacing.lg,
    alignItems: 'center',
  },
  statusLabel: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  timer: {
    color: theme.colors.textMuted,
    fontSize: 14,
    marginTop: theme.spacing.xs,
    fontVariant: ['tabular-nums'],
  },
  sphereWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottom: {
    paddingBottom: theme.spacing.xxl,
    alignItems: 'center',
  },
  hint: {
    color: theme.colors.primary,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  warning: {
    color: '#FFB020',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  error: {
    color: theme.colors.danger,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  usage: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: theme.spacing.sm,
  },
});
