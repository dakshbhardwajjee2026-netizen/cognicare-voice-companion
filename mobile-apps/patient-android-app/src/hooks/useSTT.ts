import { useState, useEffect, useRef, useCallback } from 'react';
import { getAudioContext, unlockAudio } from '../utils/audio';

interface UseSTTOptions {
  onFinalTranscript?: (transcript: string) => void;
  onInterimTranscript?: (transcript: string) => void;
  continuous?: boolean;
  sttCode?: string;
  isKaiSpeaking?: boolean;
}

export const useSTT = (options: UseSTTOptions = {}) => {
  const { onFinalTranscript, onInterimTranscript, continuous = true, sttCode = 'en-US', isKaiSpeaking = false } = options;

  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const isKaiSpeakingRef = useRef(isKaiSpeaking);
  const shouldKeepListeningRef = useRef(true);
  const onFinalTranscriptRef = useRef(onFinalTranscript);
  const onInterimTranscriptRef = useRef(onInterimTranscript);

  useEffect(() => {
    onFinalTranscriptRef.current = onFinalTranscript;
    onInterimTranscriptRef.current = onInterimTranscript;
  }, [onFinalTranscript, onInterimTranscript]);

  useEffect(() => {
    isKaiSpeakingRef.current = isKaiSpeaking;
    if (isKaiSpeaking && recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    } else if (!isKaiSpeaking && shouldKeepListeningRef.current && recognitionRef.current && !isListeningRef.current) {
      const timer = setTimeout(() => {
        if (shouldKeepListeningRef.current && !isListeningRef.current && !isKaiSpeakingRef.current && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (err: any) {
            if (err.name !== 'InvalidStateError') {
              console.debug('Recognition auto-resume notice:', err);
            }
          }
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isKaiSpeaking]);

  const requestMicPermission = useCallback(async (): Promise<boolean> => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return true;
    }
    try {
      unlockAudio();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasMicPermission(true);
      setError(null);
      return true;
    } catch (err: any) {
      console.warn('Microphone permission notice:', err.name, err.message);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Microphone access blocked. Click the lock icon in the address bar to allow.');
        setHasMicPermission(false);
      }
      return false;
    }
  }, []);

  const startListening = useCallback(async () => {
    unlockAudio();
    shouldKeepListeningRef.current = true;
    setError(null);

    await requestMicPermission();

    if (!recognitionRef.current) return;

    if (isListeningRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }

    try {
      recognitionRef.current.start();
    } catch (err: any) {
      if (err.name !== 'InvalidStateError') {
        console.warn('SpeechRecognition start error:', err);
      }
    }
  }, [requestMicPermission]);

  const stopListening = useCallback(() => {
    shouldKeepListeningRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    isListeningRef.current = false;
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = sttCode;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      isListeningRef.current = true;
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      let finalStr = '';
      let interimStr = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          finalStr += item[0].transcript;
        } else {
          interimStr += item[0].transcript;
        }
      }

      setInterimTranscript(interimStr);
      onInterimTranscriptRef.current?.(interimStr);

      if (finalStr.trim()) {
        setInterimTranscript('');
        onFinalTranscriptRef.current?.(finalStr.trim());
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') return;
      if (event.error === 'aborted') return;
      console.warn('Speech recognition event notice:', event.error);
    };

    recognition.onend = () => {
      isListeningRef.current = false;
      setIsListening(false);

      if (shouldKeepListeningRef.current && !isKaiSpeakingRef.current) {
        setTimeout(() => {
          if (shouldKeepListeningRef.current && !isListeningRef.current && !isKaiSpeakingRef.current) {
            try {
              recognition.start();
            } catch {}
          }
        }, 300);
      }
    };

    recognitionRef.current = recognition;

    // Auto-start continuous listening on load
    startListening();

    return () => {
      shouldKeepListeningRef.current = false;
      try {
        recognition.abort();
      } catch {}
    };
  }, [continuous, startListening, sttCode]);

  return {
    isListening,
    interimTranscript,
    error,
    hasMicPermission,
    startListening,
    stopListening,
    toggleListening,
    requestMicPermission,
  };
};
