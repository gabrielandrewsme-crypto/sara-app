import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { useCallback, useEffect, useRef, useState } from 'react';
import { saraService } from '../services/saraService';

type VoiceState = 'idle' | 'recording' | 'transcribing';

const TARGET_MIME = 'audio/m4a';
const TARGET_FILENAME = 'sara-voice.m4a';

export function useVoiceInput() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [state, setState] = useState<VoiceState>('idle');
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (state === 'idle' && recorderState.isRecording) {
      // recorder reports recording but we believe we're idle — keep state honest
      setState('recording');
    }
  }, [state, recorderState.isRecording]);

  const start = useCallback(async () => {
    setError(null);
    try {
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) {
        setError('Permissão do microfone negada.');
        return false;
      }
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      await recorder.prepareToRecordAsync();
      recorder.record();
      startedRef.current = true;
      setState('recording');
      return true;
    } catch (e: any) {
      setError(e?.message ?? 'Não consegui acessar o microfone.');
      setState('idle');
      return false;
    }
  }, [recorder]);

  const cancel = useCallback(async () => {
    try {
      if (startedRef.current) {
        await recorder.stop();
      }
    } catch {
      // ignore
    } finally {
      startedRef.current = false;
      setState('idle');
    }
  }, [recorder]);

  const stopAndTranscribe = useCallback(async (): Promise<string | null> => {
    if (!startedRef.current) return null;
    try {
      setState('transcribing');
      await recorder.stop();
      startedRef.current = false;
      const uri = recorder.uri;
      if (!uri) {
        throw new Error('Áudio não foi salvo.');
      }
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      if (!base64) {
        throw new Error('Áudio vazio.');
      }
      const text = await saraService.transcribe({
        audioBase64: base64,
        mimeType: TARGET_MIME,
        filename: TARGET_FILENAME,
      });
      setState('idle');
      return text;
    } catch (e: any) {
      setError(e?.message ?? 'Falha ao transcrever.');
      setState('idle');
      return null;
    }
  }, [recorder]);

  return {
    state,
    error,
    start,
    cancel,
    stopAndTranscribe,
  };
}
