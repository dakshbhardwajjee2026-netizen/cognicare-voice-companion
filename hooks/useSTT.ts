import { useState, useEffect, useRef, useCallback } from 'react';
import { getAudioContext, unlockAudio } from '../utils/audio';

interface UseSTTOptions {
  onFinalTranscript?: (transcript: string) => void;
  onInterimTranscript?: (transcript: string) => void;
  continuous?: boolean;
  sttCode?: string;
  isKaiSpeaking?: boolean;
}

// Declare SpeechRecognition types for TypeScript
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export const useSTT = (options: UseSTTOptions = {}) => {
  const { onFinalTranscript, onInterimTranscript, continuous = true, sttCode = 'en-US', isKaiSpeaking = false } = options;

  const [isListening, setIsListening] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [micVolume, setMicVolume] = useState<number>(0);
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const isKaiSpeakingRef = useRef(isKaiSpeaking);
  const userSpeakingTimeoutRef = useRef<any>(null);
  const shouldKeepListeningRef = useRef(false);
  const onFinalTranscriptRef = useRef(onFinalTranscript);
  const onInterimTranscriptRef = useRef(onInterimTranscript);

  useEffect(() => {
    isKaiSpeakingRef.current = isKaiSpeaking;
    if (isKaiSpeaking && recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
    } else if (!isKaiSpeaking && shouldKeepListeningRef.current && recognitionRef.current && !isListeningRef.current) {
      const timer = setTimeout(() => {
        if (shouldKeepListeningRef.current && !isListeningRef.current && !isKaiSpeakingRef.current && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (err: any) {
            if (err.name !== 'InvalidStateError') {
              console.debug('Auto-resume recognition notice:', err);
            }
          }
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isKaiSpeaking]);

  // Audio Stream & Volume Analyser
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    onFinalTranscriptRef.current = onFinalTranscript;
    onInterimTranscriptRef.current = onInterimTranscript;
  }, [onFinalTranscript, onInterimTranscript]);

  // Audio volume analyzer loop
  const startVolumeAnalyser = useCallback((stream: MediaStream) => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!analyserRef.current || !isListeningRef.current) {
          setMicVolume(0);
          return;
        }

        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        // Normalize 0..100
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setMicVolume(normalized);

        animFrameRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (err) {
      console.debug('Could not start mic volume analyser:', err);
    }
  }, []);

  const stopVolumeAnalyser = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    analyserRef.current = null;
    setMicVolume(0);
  }, []);

  // Request microphone permission explicitly via getUserMedia
  const requestMicPermission = useCallback(async (): Promise<boolean> => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return true; // Fallback to SpeechRecognition default
    }

    try {
      unlockAudio();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      setHasMicPermission(true);
      setError(null);
      startVolumeAnalyser(stream);
      return true;
    } catch (err: any) {
      console.warn('Microphone permission request result:', err.name, err.message);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Microphone access is blocked. Please allow microphone in your browser address bar.');
        setHasMicPermission(false);
      } else {
        setError(`Microphone notice: ${err.message || 'Cannot access microphone'}`);
      }
      return false;
    }
  }, [startVolumeAnalyser]);

  // Initialize SpeechRecognition instance
  useEffect(() => {
    const win = typeof window !== 'undefined' ? (window as IWindow) : null;
    const SpeechRecognitionClass = win?.SpeechRecognition || win?.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = sttCode || 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        isListeningRef.current = true;
        setError(null);
      };

      recognition.onresult = (event: any) => {
        // Ignore microphone input while Kai is speaking to prevent self-talking echo loops
        if (isKaiSpeakingRef.current) {
          return;
        }

        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptChunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcriptChunk;
          } else {
            interim += transcriptChunk;
          }
        }

        if (interim) {
          setInterimTranscript(interim);
          setIsUserSpeaking(true);
          onInterimTranscriptRef.current?.(interim);

          if (userSpeakingTimeoutRef.current) {
            clearTimeout(userSpeakingTimeoutRef.current);
          }
          userSpeakingTimeoutRef.current = setTimeout(() => {
            setIsUserSpeaking(false);
          }, 1500);
        }

        if (final && final.trim()) {
          setInterimTranscript('');
          setIsUserSpeaking(false);
          if (userSpeakingTimeoutRef.current) {
            clearTimeout(userSpeakingTimeoutRef.current);
          }
          onFinalTranscriptRef.current?.(final.trim());
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') {
          // Normal silence, keep alive
          return;
        }
        if (event.error === 'aborted') {
          return;
        }

        console.warn('Speech recognition notice:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setError('Microphone permission needed. Tap the Kai orb or allow microphone access in your browser.');
          setHasMicPermission(false);
        } else if (event.error === 'network') {
          setError('Speech recognition network notice. You can also use quick prompts or type below.');
        } else {
          setError(`Speech notice: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        isListeningRef.current = false;
        setIsUserSpeaking(false);
        setInterimTranscript('');

        // If continuous mode is enabled and user hasn't explicitly stopped, resume smoothly (only if Kai is not speaking)
        if (shouldKeepListeningRef.current && !isKaiSpeakingRef.current) {
          setTimeout(() => {
            if (shouldKeepListeningRef.current && !isListeningRef.current && !isKaiSpeakingRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (err: any) {
                // If InvalidStateError (already running), harmless
                if (err.name !== 'InvalidStateError') {
                  console.debug('Restart recognition notice:', err);
                }
              }
            }
          }, 400);
        }
      };

      recognitionRef.current = recognition;
    } catch (err: any) {
      console.error('Failed to setup speech recognition:', err);
      setIsSupported(false);
    }

    return () => {
      shouldKeepListeningRef.current = false;
      stopVolumeAnalyser();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
      if (userSpeakingTimeoutRef.current) {
        clearTimeout(userSpeakingTimeoutRef.current);
      }
    };
  }, [stopVolumeAnalyser]);

  const startListening = useCallback(async () => {
    unlockAudio();

    if (!recognitionRef.current) {
      setError('Speech recognition is not supported in this browser. You can use the buttons or text input.');
      return;
    }

    shouldKeepListeningRef.current = continuous;
    setError(null);

    // Prompt mic permission if needed
    if (hasMicPermission !== true) {
      await requestMicPermission();
    }

    try {
      if (!isListeningRef.current) {
        recognitionRef.current.start();
      }
    } catch (err: any) {
      if (err.name !== 'InvalidStateError') {
        console.warn('Error starting speech recognition:', err);
      }
    }
  }, [continuous, hasMicPermission, requestMicPermission]);

  const stopListening = useCallback(() => {
    shouldKeepListeningRef.current = false;
    stopVolumeAnalyser();
    if (recognitionRef.current && isListeningRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
    isListeningRef.current = false;
    setIsUserSpeaking(false);
    setInterimTranscript('');
  }, [stopVolumeAnalyser]);

  const toggleListening = useCallback(async () => {
    if (isListening) {
      stopListening();
    } else {
      await startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    isUserSpeaking,
    interimTranscript,
    error,
    isSupported,
    micVolume,
    hasMicPermission,
    requestMicPermission,
    startListening,
    stopListening,
    toggleListening,
  };
};

