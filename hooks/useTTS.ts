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
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const isSpeakingRef = useRef(false);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const watchdogTimerRef = useRef<any>(null);

  useEffect(() => {
    setSpeechRate(initialRate);
  }, [initialRate]);

  // Load and pick optimal calming voice for active language (for fallback)
  const updateVoices = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      setAvailableVoices(voices);

      const prefix = (langId || 'en').split('-')[0].toLowerCase();
      const preferred =
        voices.find((v) => v.lang.toLowerCase().startsWith(prefix)) ||
        voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Jenny') || v.name.includes('Zira'))) ||
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
        try {
          window.speechSynthesis.cancel();
        } catch {
          // ignore
        }
      }
      if (watchdogTimerRef.current) {
        clearTimeout(watchdogTimerRef.current);
      }
    };
  }, [updateVoices]);

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

      // Unlock browser audio context
      unlockAudio();

      // Clean prosody markup
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

      // Stop previous utterance
      stop();

      // Optional gentle chime on start
      if (options?.playChime !== false) {
        playGentleChime('response');
      }

      const effectiveRate = options?.rate || speechRate || 0.85;

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

      // Watchdog timer: automatically release isSpeaking state if playback stalls
      const wordCount = cleanText.split(/\s+/).length;
      const expectedDurationMs = Math.max(6000, (wordCount * 550 + 4000) / effectiveRate);
      watchdogTimerRef.current = setTimeout(finishSpeech, expectedDurationMs);

      // Detect script language from actual text content to avoid reading Indic text with English voices
      let effectiveLang = (langId || 'en').split('-')[0].toLowerCase();
      if (/[\u0900-\u097F]/.test(cleanText)) {
        effectiveLang = 'hi'; // Devanagari Hindi / Marathi
      } else if (/[\u0980-\u09FF]/.test(cleanText)) {
        effectiveLang = 'bn'; // Bengali / Assamese
      } else if (/[\u0A80-\u0AFF]/.test(cleanText)) {
        effectiveLang = 'gu'; // Gujarati
      } else if (/[\u0A00-\u0A7F]/.test(cleanText)) {
        effectiveLang = 'pa'; // Gurmukhi Punjabi
      } else if (/[\u0B80-\u0BFF]/.test(cleanText)) {
        effectiveLang = 'ta'; // Tamil
      } else if (/[\u0C00-\u0C7F]/.test(cleanText)) {
        effectiveLang = 'te'; // Telugu
      } else if (/[\u0C80-\u0CFF]/.test(cleanText)) {
        effectiveLang = 'kn'; // Kannada
      } else if (/[\u0D00-\u0D7F]/.test(cleanText)) {
        effectiveLang = 'ml'; // Malayalam
      } else if (/[\u0B00-\u0B7F]/.test(cleanText)) {
        effectiveLang = 'or'; // Odia
      } else if (/[\u0600-\u06FF]/.test(cleanText)) {
        effectiveLang = 'ur'; // Urdu
      }

      console.log(`[TTS] Speaking text (effectiveLang: ${effectiveLang}, requested: ${langId}):`, cleanText.slice(0, 60));

      // 1. Direct Web Speech API (Only if genuine matching native voice for target script exists)
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const synth = window.speechSynthesis;
        try {
          if (synth.paused) {
            synth.resume();
          }
        } catch {
          // ignore
        }

        const voices = synth.getVoices() || [];
        const matchingVoice =
          voices.find((v) => v.lang.toLowerCase().startsWith(effectiveLang) && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('David') || v.name.includes('Zira') || v.name.includes('Jenny') || v.name.includes('Samantha'))) ||
          voices.find((v) => v.lang.toLowerCase().startsWith(effectiveLang));

        // For pure English text without Indic characters, or if a dedicated native browser voice exists:
        const hasIndicScript = /[\u0900-\u0D7F\u0600-\u06FF\u4E00-\u9FFF]/.test(cleanText);
        if (matchingVoice || (effectiveLang === 'en' && !hasIndicScript)) {
          const voice = matchingVoice || voices.find((v) => v.lang.startsWith('en')) || voices[0] || null;

          const utterance = new SpeechSynthesisUtterance(cleanText);
          utterance.rate = Math.max(0.7, Math.min(1.15, effectiveRate));
          utterance.pitch = 1.0;
          utterance.volume = 1.0;

          if (voice) {
            utterance.voice = voice;
            utterance.lang = voice.lang;
          }

          activeUtteranceRef.current = utterance;
          (window as any)._kaiActiveUtterance = utterance;

          utterance.onstart = () => {
            isSpeakingRef.current = true;
            setIsSpeaking(true);
            options?.onStart?.();
          };

          utterance.onend = () => {
            finishSpeech();
          };

          utterance.onerror = (e) => {
            if (e.error !== 'interrupted' && e.error !== 'canceled') {
              console.warn('Utterance notice:', e.error);
            }
            finishSpeech();
          };

          try {
            synth.speak(utterance);
            return;
          } catch (err) {
            console.warn('Synth speak error, falling back to audio stream:', err);
          }
        }
      }

      // 2. Fallback: Streaming audio from server /api/tts endpoint (High quality neural Google Translate TTS)
      try {
        console.log(`[TTS] Routing to neural streaming /api/tts for lang '${effectiveLang}'`);
        const ttsAudioUrl = `/api/tts?text=${encodeURIComponent(cleanText)}&lang=${encodeURIComponent(effectiveLang)}`;
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

        audio.onerror = () => {
          finishSpeech();
        };

        audio.play().catch(() => {
          finishSpeech();
        });
      } catch {
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

