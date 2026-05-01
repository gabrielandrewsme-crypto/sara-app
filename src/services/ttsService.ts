import {
  AudioPlayer,
  createAudioPlayer,
  setAudioModeAsync,
} from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import * as Speech from 'expo-speech';
import { saraService } from './saraService';

export type SaraVoice = 'nova' | 'shimmer' | 'alloy';

export const SARA_VOICE_OPTIONS: {
  id: SaraVoice;
  label: string;
  hint: string;
}[] = [
  { id: 'nova', label: 'Nova', hint: 'Calma e amigável' },
  { id: 'shimmer', label: 'Shimmer', hint: 'Suave' },
  { id: 'alloy', label: 'Alloy', hint: 'Neutra' },
];

const SAMPLE_TEXT =
  'Oi, eu sou a Sara. Vou te ajudar a organizar seu dia.';

let activePlayer: AudioPlayer | null = null;
let activeSubscription: { remove: () => void } | null = null;
let sessionCounter = 0;

function stopActivePlayer() {
  if (activeSubscription) {
    try {
      activeSubscription.remove();
    } catch {
      // ignore
    }
    activeSubscription = null;
  }
  if (activePlayer) {
    try {
      activePlayer.pause();
    } catch {
      // ignore
    }
    try {
      activePlayer.release();
    } catch {
      // ignore
    }
    activePlayer = null;
  }
}

async function playBase64Audio(
  base64: string,
  mimeType: string,
  onDone?: () => void,
): Promise<void> {
  const ext = mimeType.includes('mpeg') ? 'mp3' : 'mp3';
  const path = `${FileSystem.cacheDirectory}sara_tts_${Date.now()}.${ext}`;
  await FileSystem.writeAsStringAsync(path, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  await setAudioModeAsync({ playsInSilentMode: true });

  stopActivePlayer();
  const session = ++sessionCounter;

  const player = createAudioPlayer(path);
  activePlayer = player;

  let finished = false;
  const finish = () => {
    if (finished) return;
    if (sessionCounter !== session) return;
    finished = true;
    onDone?.();
  };

  const sub = player.addListener(
    'playbackStatusUpdate',
    (status: { didJustFinish?: boolean }) => {
      if (status?.didJustFinish) {
        finish();
      }
    },
  );
  activeSubscription = sub;

  try {
    player.play();
  } catch (e) {
    finish();
    throw e;
  }
}

function speakWithDevice(text: string, onDone?: () => void) {
  Speech.stop();
  Speech.speak(text, {
    language: 'pt-BR',
    rate: 1.0,
    pitch: 1.0,
    onDone,
    onStopped: onDone,
    onError: onDone,
  });
}

export const ttsService = {
  async speak(
    text: string,
    options: {
      voice?: SaraVoice;
      onDone?: () => void;
      /** When true, throws instead of falling back to the device TTS. */
      strict?: boolean;
    } = {},
  ): Promise<void> {
    if (!text) {
      options.onDone?.();
      return;
    }
    const voice: SaraVoice = options.voice ?? 'nova';

    Speech.stop();
    stopActivePlayer();
    sessionCounter++;

    try {
      const { audioBase64, mimeType } = await saraService.synthesizeSpeech(
        text,
        voice,
      );
      await playBase64Audio(audioBase64, mimeType, options.onDone);
    } catch (e) {
      if (options.strict) {
        throw e;
      }
      // Lenient mode: fall back to on-device TTS so the user always hears
      // something if OpenAI is unreachable. Used in voice mode where uptime
      // matters more than fidelity.
      console.warn('[tts] OpenAI TTS failed, falling back to device:', e);
      speakWithDevice(text, options.onDone);
    }
  },

  stop() {
    Speech.stop();
    stopActivePlayer();
    sessionCounter++;
  },

  /** Strict by design: previewing a voice must not silently fall back. */
  speakSample(voice: SaraVoice, onDone?: () => void) {
    return this.speak(SAMPLE_TEXT, { voice, onDone, strict: true });
  },

  async isSpeaking(): Promise<boolean> {
    if (activePlayer) return true;
    try {
      return await Speech.isSpeakingAsync();
    } catch {
      return false;
    }
  },
};
