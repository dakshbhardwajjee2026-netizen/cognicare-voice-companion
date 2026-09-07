import { useRef, useCallback, useState, useEffect } from 'react';
import { unlockAudio, playGentleChime } from '../utils/audio';

export interface UseTTSOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
  playChime?: boolean;
  rate?: number;
}

export const useTTS = (initialRate = 0.85, langId = 'en') => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(initialRate);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const isSpeakingRef = useRef(false);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const watchdogTimerRef = useRef<any>(null);

  useEffect(() => {
    setSpeechRate(initialRate);
  }, [initialRate]);

  // Load voices when available
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const prefix = (langId || 'en').split('-')[0].toLowerCase();
        const preferred =
          voices.find((v) => v.lang.toLowerCase().startsWith(prefix)) ||
          voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Jenny'))) ||
          voices.find((v) => v.lang.startsWith('en')) ||
          voices[0];
        setSelectedVoice(preferred || null);
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      window.speechSynthesis.cancel();
      if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
    };
  }, [langId]);

  const stop = useCallback(() => {
    if (watchdogTimerRef.current) {
      clearTimeout(watchdogTimerRef.current);
      watchdogTimerRef.current = null;
    }
    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
      } catch {}
      activeAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    isSpeakingRef.current = false;
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string, options?: UseTTSOptions): void => {
      if (!text || isMuted) {
        options?.onEnd?.();
        return;
      }

      unlockAudio();
      stop();

      // Clean prosody markers for audio synthesis
      const cleanText = text
        .replace(/\(tone:\s*[^)]+\)/gi, '')
        .replace(/\(long pause\)/gi, '... ')
        .replace(/\(pause\)/gi, ', ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanText) {
        options?.onEnd?.();
        return;
      }

      if (options?.playChime !== false) {
        playGentleChime('response');
      }

      isSpeakingRef.current = true;
      setIsSpeaking(true);
      options?.onStart?.();

      const finishSpeech = () => {
        if (watchdogTimerRef.current) {
          clearTimeout(watchdogTimerRef.current);
          watchdogTimerRef.current = null;
        }
        if (activeAudioRef.current) {
          activeAudioRef.current = null;
        }
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        options?.onEnd?.();
      };

      const targetPrefix = (langId || 'en').split('-')[0].toLowerCase();
      const synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
      const voices = synth ? synth.getVoices() : [];
      const nativeVoice = voices.find((v) => v.lang.toLowerCase().startsWith(targetPrefix));

      // 1. Try Native Browser SpeechSynthesis if voice exists
      if (synth && nativeVoice) {
        try {
          const utterance = new SpeechSynthesisUtterance(cleanText);
          utterance.voice = nativeVoice;
          utterance.rate = options?.rate || speechRate || 0.85;
          utterance.pitch = 1.0;
          utterance.lang = nativeVoice.lang || 'en-US';

          utterance.onend = finishSpeech;
          utterance.onerror = (e) => {
            console.warn('Native speech error, fallback to audio streaming:', e);
            fallbackToStream(cleanText, finishSpeech);
          };

          watchdogTimerRef.current = setTimeout(finishSpeech, Math.max(8000, cleanText.length * 120));
          synth.speak(utterance);
          return;
        } catch (e) {
          console.warn('SpeechSynthesis invocation failed:', e);
        }
      }

      // 2. Universal Streaming Audio Fallback via /api/tts
      fallbackToStream(cleanText, finishSpeech);
    },
    [isMuted, langId, speechRate, stop]
  );

  const fallbackToStream = (text: string, onDone: () => void) => {
    try {
      const streamUrl = `http://localhost:3001/api/tts?text=${encodeURIComponent(text.slice(0, 250))}&lang=${encodeURIComponent(langId || 'en')}`;
      const audio = new Audio(streamUrl);
      activeAudioRef.current = audio;

      audio.onended = onDone;
      audio.onerror = (err) => {
        console.warn('TTS streaming playback notice:', err);
        // Fallback to basic synth if all else fails
        if ('speechSynthesis' in window) {
          const basic = new SpeechSynthesisUtterance(text);
          basic.rate = 0.85;
          basic.onend = onDone;
          basic.onerror = onDone;
          window.speechSynthesis.speak(basic);
        } else {
          onDone();
        }
      };

      audio.play().catch((playErr) => {
        console.warn('Audio play notice:', playErr);
        onDone();
      });

      watchdogTimerRef.current = setTimeout(onDone, Math.max(8000, text.length * 120));
    } catch {
      onDone();
    }
  };

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      if (!prev) stop();
      return !prev;
    });
  }, [stop]);

  return {
    speak,
    stop,
    isSpeaking,
    isMuted,
    toggleMute,
    speechRate,
    setSpeechRate,
    selectedVoice,
  };
};
