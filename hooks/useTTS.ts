import { useRef, useCallback, useState, useEffect } from 'react';
import { cleanTextForSpeech } from '../utils/parser';
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
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const isSpeakingRef = useRef(false);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const watchdogTimerRef = useRef<any>(null);

  useEffect(() => {
    setSpeechRate(initialRate);
  }, [initialRate]);

  // Load and pick optimal calming voice for active language
  const updateVoices = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      setAvailableVoices(voices);

      const prefix = (langId || 'en').split('-')[0].toLowerCase();
      // Prioritize voice matching target language prefix, otherwise fallback
      const preferred =
        voices.find((v) => v.lang.toLowerCase().startsWith(prefix)) ||
        voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Karen') || v.name.includes('Jenny') || v.name.includes('Zira') || v.name.includes('Victoria'))) ||
        voices.find((v) => v.lang.startsWith('en-US')) ||
        voices.find((v) => v.lang.startsWith('en')) ||
        voices[0];
      setSelectedVoice(preferred || null);
    }
  }, [langId]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (watchdogTimerRef.current) {
        clearTimeout(watchdogTimerRef.current);
      }
    };
  }, [updateVoices]);

  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    if (watchdogTimerRef.current) {
      clearTimeout(watchdogTimerRef.current);
      watchdogTimerRef.current = null;
    }
    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
      } catch {
        // ignore
      }
      activeAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    activeUtteranceRef.current = null;
    if (typeof window !== 'undefined') {
      (window as any)._kaiActiveUtterance = null;
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

      // Unlock browser audio context and speech synthesis
      unlockAudio();

      // Stop previous utterance cleanly
      stop();

      // Clean prosody markup: replace (pause) and (long pause) with natural punctuation pauses
      let cleanText = text
        .replace(/\(tone:\s*[^)]+\)/gi, '')
        .replace(/\(long pause\)/gi, '... ')
        .replace(/\(pause\)/gi, ', ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanText) {
        options?.onEnd?.();
        return;
      }

      // Optional gentle chime on start
      if (options?.playChime !== false) {
        playGentleChime('response');
      }

      const effectiveRate = options?.rate || speechRate || 0.85;
      const targetPrefix = (langId || 'en').split('-')[0].toLowerCase();
      const synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
      const voices = synth ? synth.getVoices() : [];

      // Check if browser has a native voice installed for this language
      const nativeVoice = voices.find((v) => v.lang.toLowerCase().startsWith(targetPrefix));

      const finishSpeech = () => {
        if (watchdogTimerRef.current) {
          clearTimeout(watchdogTimerRef.current);
          watchdogTimerRef.current = null;
        }
        if (activeAudioRef.current) {
          activeAudioRef.current = null;
        }
        activeUtteranceRef.current = null;
        if (typeof window !== 'undefined') {
          (window as any)._kaiActiveUtterance = null;
        }
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        options?.onEnd?.();
      };

      // Watchdog timer: automatically release isSpeaking state
      const wordCount = cleanText.split(/\s+/).length;
      const expectedDurationMs = Math.max(4000, (wordCount * 350 + 2000) / effectiveRate);
      watchdogTimerRef.current = setTimeout(() => {
        finishSpeech();
      }, expectedDurationMs);

      // If no native browser voice for this regional language (e.g. Gujarati, Assamese, Manipuri, Bengali, etc.), use /api/tts endpoint
      if (!nativeVoice || !['en', 'hi'].includes(targetPrefix)) {
        try {
          const ttsAudioUrl = `/api/tts?text=${encodeURIComponent(cleanText)}&lang=${encodeURIComponent(langId)}`;
          const audio = new Audio(ttsAudioUrl);
          audio.playbackRate = Math.max(0.75, Math.min(1.2, effectiveRate));
          activeAudioRef.current = audio;

          audio.onplay = () => {
            isSpeakingRef.current = true;
            setIsSpeaking(true);
            options?.onStart?.();
          };

          audio.onended = () => {
            finishSpeech();
          };

          audio.onerror = (e) => {
            console.warn('/api/tts audio playback notice:', e);
            finishSpeech();
          };

          audio.play().catch((err) => {
            console.warn('/api/tts play exception, attempting browser synth fallback:', err);
            if (synth) {
              const utterance = new SpeechSynthesisUtterance(cleanText);
              utterance.rate = effectiveRate;
              utterance.onend = finishSpeech;
              utterance.onerror = finishSpeech;
              synth.speak(utterance);
            } else {
              finishSpeech();
            }
          });
          return;
        } catch (err) {
          console.warn('Audio construction error:', err);
        }
      }

      // Otherwise use Web Speech API for native voices
      if (synth) {
        try {
          if (synth.paused) {
            synth.resume();
          }
        } catch {
          // ignore
        }

        isSpeakingRef.current = true;
        setIsSpeaking(true);
        options?.onStart?.();

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = Math.max(0.5, Math.min(1.2, effectiveRate));
        utterance.pitch = 1.05;
        utterance.volume = 1.0;
        if (nativeVoice) {
          utterance.voice = nativeVoice;
          utterance.lang = nativeVoice.lang;
        }

        activeUtteranceRef.current = utterance;
        (window as any)._kaiActiveUtterance = utterance;

        utterance.onend = () => finishSpeech();
        utterance.onerror = (e) => {
          if (e.error !== 'interrupted' && e.error !== 'canceled') {
            console.warn('TTS utterance notice:', e.error);
            options?.onError?.(e);
          }
          finishSpeech();
        };

        setTimeout(() => {
          try {
            if (synth.paused) {
              synth.resume();
            }
            synth.speak(utterance);
          } catch (err) {
            console.error('Error invoking synth.speak:', err);
            finishSpeech();
          }
        }, 40);
      } else {
        finishSpeech();
      }
    },
    [isMuted, langId, speechRate, stop]
  );

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      if (!prev) {
        stop();
      }
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
    availableVoices,
    setSelectedVoice,
  };
};

