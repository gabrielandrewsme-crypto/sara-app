import * as Speech from 'expo-speech';

type SpeakOptions = {
  language?: string;
  rate?: number;
  pitch?: number;
  onDone?: () => void;
};

/**
 * On-device TTS via expo-speech. Caller is responsible for gating on
 * `isPremium` — this module deliberately doesn't know about plans so
 * it stays a thin shim around expo-speech.
 */
export const ttsService = {
  speak(text: string, options: SpeakOptions = {}) {
    if (!text) return;
    Speech.stop();
    Speech.speak(text, {
      language: options.language ?? 'pt-BR',
      rate: options.rate ?? 1.0,
      pitch: options.pitch ?? 1.0,
      onDone: options.onDone,
      onStopped: options.onDone,
      onError: options.onDone,
    });
  },
  stop() {
    Speech.stop();
  },
  async isSpeaking(): Promise<boolean> {
    try {
      return await Speech.isSpeakingAsync();
    } catch {
      return false;
    }
  },
};
