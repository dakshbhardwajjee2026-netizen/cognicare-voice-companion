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

// Mobile device detection helper
const isMobileDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua);
  const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 768;
  return isMobileUA || (isTouch && isSmallScreen);
};

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
  const isRecognitionActiveRef = useRef(false);
  const isStartingRef = useRef(false);
  const isKaiSpeakingRef = useRef(isKaiSpeaking);
  const shouldKeepListeningRef = useRef(false);

  const onFinalTranscriptRef = useRef(onFinalTranscript);
  const onInterimTranscriptRef = useRef(onInterimTranscript);
  const pendingInterimRef = useRef<string>('');
  const silenceTimerRef = useRef<any>(null);
  const userSpeakingTimeoutRef = useRef<any>(null);

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

  // Diagnostic helper to inspect environment & permission context
  const getDiagnosticContext = useCallback(async () => {
    let permState = 'unknown';
    try {
      if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
        const p = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        permState = p.state;
      }
    } catch (e: any) {
      permState = `query_error (${e.message})`;
    }

    const info = {
      origin: typeof window !== 'undefined' ? window.location.origin : 'N/A',
      protocol: typeof window !== 'undefined' ? window.location.protocol : 'N/A',
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'N/A',
      isSecureContext: typeof window !== 'undefined' ? window.isSecureContext : false,
      isIframe: typeof window !== 'undefined' ? window.self !== window.top : false,
      visibilityState: typeof document !== 'undefined' ? document.visibilityState : 'unknown',
      micPermissionState: permState,
      isListening: isListeningRef.current,
      isKaiSpeaking: isKaiSpeakingRef.current,
      isRecognitionActive: isRecognitionActiveRef.current,
    };
    return info;
  }, []);

  // Safe recognition start helper
  const safeStartRecognition = useCallback(async (source = 'unspecified') => {
    if (!recognitionRef.current) {
      console.log(`[STT Diagnostic] safeStartRecognition (${source}): recognition instance is null`);
      return;
    }
    if (isKaiSpeakingRef.current) {
      console.log(`[STT Diagnostic] safeStartRecognition (${source}) BLOCKED: isKaiSpeaking is true`);
      return;
    }
    if (isRecognitionActiveRef.current) {
      console.log(`[STT Diagnostic] safeStartRecognition (${source}) skipped: isRecognitionActive is already true`);
      return;
    }
    if (isStartingRef.current) {
      console.log(`[STT Diagnostic] safeStartRecognition (${source}) skipped: isStarting is already true`);
      return;
    }

    const diag = await getDiagnosticContext();
    console.log(`[STT] START ATTEMPT (trigger: ${source})`, diag);

    isStartingRef.current = true;
    try {
      recognitionRef.current.start();
      console.log(`[STT Diagnostic] recognition.start() call executed synchronously without throwing (trigger: ${source})`);
    } catch (err: any) {
      isStartingRef.current = false;
      console.warn(`[STT Diagnostic] recognition.start() threw exception (trigger: ${source}):`, err.name, err.message);
    }
  }, [getDiagnosticContext]);

  // Safe recognition abort helper
  const safeAbortRecognition = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    pendingInterimRef.current = '';

    if (recognitionRef.current && isRecognitionActiveRef.current) {
      console.log('[STT Diagnostic] recognition aborted because Kai is speaking or stopping');
      try {
        recognitionRef.current.abort();
      } catch (e: any) {
        console.debug('[STT Diagnostic] recognition.abort() notice:', e.message);
      }
    }
  }, []);

  // Handle changes in Kai speaking state
  useEffect(() => {
    isKaiSpeakingRef.current = isKaiSpeaking;

    if (isKaiSpeaking) {
      console.log('[STT Diagnostic] Kai speaking state became TRUE -> aborting recognition');
      safeAbortRecognition();
    } else if (!isKaiSpeaking && shouldKeepListeningRef.current && !isRecognitionActiveRef.current) {
      console.log('[STT Diagnostic] Kai speaking state became FALSE -> scheduling auto-resume in 350ms');
      const timer = setTimeout(() => {
        if (!isKaiSpeakingRef.current && shouldKeepListeningRef.current && !isRecognitionActiveRef.current) {
          console.log('[STT Diagnostic] recognition restarting after Kai finished speaking');
          safeStartRecognition();
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isKaiSpeaking, safeAbortRecognition, safeStartRecognition]);

  // Request microphone permission explicitly via getUserMedia with exhaustive diagnostic logging
  const requestMicPermission = useCallback(async (): Promise<boolean> => {
    console.log('[Microphone Diagnostic] Querying getUserMedia({ audio: true })...');
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      console.warn('[Microphone Diagnostic] navigator.mediaDevices.getUserMedia is NOT available');
      return false;
    }

    try {
      unlockAudio();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const tracks = stream.getAudioTracks();
      console.log('[Microphone Diagnostic] getUserMedia SUCCESS:', {
        trackCount: tracks.length,
        tracks: tracks.map((t, idx) => ({
          index: idx,
          label: t.label,
          id: t.id,
          enabled: t.enabled,
          muted: t.muted,
          readyState: t.readyState,
        })),
      });

      setHasMicPermission(true);
      setError(null);

      if (isMobileDevice()) {
        console.log('[Microphone Diagnostic] Mobile device detected: releasing getUserMedia stream to free hardware mic for SpeechRecognition');
        tracks.forEach((t) => t.stop());
        mediaStreamRef.current = null;
      } else {
        mediaStreamRef.current = stream;
        startVolumeAnalyser(stream);
      }
      return true;
    } catch (err: any) {
      console.error('[Microphone Diagnostic] getUserMedia FAILURE:', {
        name: err.name,
        message: err.message,
        constraint: err.constraint,
      });
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Microphone access is blocked. Please allow microphone in your browser address bar.');
        setHasMicPermission(false);
      } else {
        setError(`Microphone notice: ${err.message || 'Cannot access microphone'}`);
      }
      return false;
    }
  }, [startVolumeAnalyser]);

  // Standalone minimal SpeechRecognition test
  const runMinimalSTTTest = useCallback(() => {
    const win = typeof window !== 'undefined' ? (window as IWindow) : null;
    const SpeechRecognitionClass = win?.SpeechRecognition || win?.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      console.error('[Minimal STT Test] SpeechRecognition not supported in this browser.');
      return;
    }
    console.log('[Minimal STT Test] Creating and starting isolated test instance...');
    try {
      const r = new SpeechRecognitionClass();
      r.lang = 'en-US';
      r.interimResults = true;
      r.onstart = () => console.log('[Minimal STT Test] START');
      r.onaudiostart = () => console.log('[Minimal STT Test] AUDIO START');
      r.onsoundstart = () => console.log('[Minimal STT Test] SOUND START');
      r.onspeechstart = () => console.log('[Minimal STT Test] SPEECH START');
      r.onresult = (e: any) => console.log('[Minimal STT Test] RESULT:', e.results[0]?.[0]?.transcript);
      r.onerror = (e: any) => console.error('[Minimal STT Test] ERROR:', e.error, e.message);
      r.onend = () => console.log('[Minimal STT Test] END');
      r.start();
    } catch (err: any) {
      console.error('[Minimal STT Test] Exception starting standalone instance:', err);
    }
  }, []);

  // Expose diagnostic tools to window object for console testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__runMinimalSTTTest = runMinimalSTTTest;
      (window as any).__checkAudioDiagnostics = async () => {
        const diag = await getDiagnosticContext();
        console.log('[Diagnostics Audit] Environment & Permissions:', diag);
        await requestMicPermission();
      };
      // Run diagnostic environment check once on mount
      getDiagnosticContext().then((diag) => {
        console.log('[STT Diagnostic] Origin & Environment Audit:', diag);
      });
    }
  }, [getDiagnosticContext, requestMicPermission, runMinimalSTTTest]);

  // Handle changes in Kai speaking state
  useEffect(() => {
    isKaiSpeakingRef.current = isKaiSpeaking;

    if (isKaiSpeaking) {
      console.log('[STT Diagnostic] Kai speaking state became TRUE -> aborting recognition');
      safeAbortRecognition();
    } else if (!isKaiSpeaking && shouldKeepListeningRef.current && !isRecognitionActiveRef.current) {
      console.log('[STT Diagnostic] Kai speaking state became FALSE -> scheduling auto-resume in 350ms');
      const timer = setTimeout(() => {
        if (!isKaiSpeakingRef.current && shouldKeepListeningRef.current && !isRecognitionActiveRef.current) {
          safeStartRecognition('kai-speaking-resumed');
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isKaiSpeaking, safeAbortRecognition, safeStartRecognition]);

  // Initialize SpeechRecognition instance
  useEffect(() => {
    const win = typeof window !== 'undefined' ? (window as IWindow) : null;
    const SpeechRecognitionClass = win?.SpeechRecognition || win?.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      console.warn('[STT Diagnostic] SpeechRecognition API is NOT supported in this browser environment');
      setIsSupported(false);
      return;
    }

    try {
      const isMobile = isMobileDevice();
      console.log('[STT Diagnostic] Initializing new SpeechRecognition instance. isMobile:', isMobile, 'lang:', sttCode || 'en-US');
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = !isMobile;
      recognition.interimResults = true;
      recognition.lang = sttCode || 'en-US';
      recognition.maxAlternatives = 1;

      // 1. onstart
      recognition.onstart = () => {
        console.log('[STT Diagnostic] 1. onstart event fired (SpeechRecognition session started)');
        isStartingRef.current = false;
        isRecognitionActiveRef.current = true;
        setIsListening(true);
        isListeningRef.current = true;
        setError(null);
      };

      // 2. onaudiostart
      recognition.onaudiostart = () => {
        console.log('[STT Diagnostic] 2. onaudiostart event fired (Microphone audio capture started)');
      };

      // 3. onaudioend
      recognition.onaudioend = () => {
        console.log('[STT Diagnostic] 3. onaudioend event fired (Microphone audio capture ended)');
      };

      // 4. onsoundstart
      recognition.onsoundstart = () => {
        console.log('[STT Diagnostic] 4. onsoundstart event fired (Sound/noise detected by browser)');
      };

      // 5. onsoundend
      recognition.onsoundend = () => {
        console.log('[STT Diagnostic] 5. onsoundend event fired (Sound/noise stopped)');
      };

      // 6. onspeechstart
      recognition.onspeechstart = () => {
        console.log('[STT Diagnostic] 6. onspeechstart event fired (Human speech detected by browser)');
      };

      // 7. onspeechend
      recognition.onspeechend = () => {
        console.log('[STT Diagnostic] 7. onspeechend event fired (Human speech stopped)');
      };

      // 8. onresult
      recognition.onresult = (event: any) => {
        if (isKaiSpeakingRef.current) {
          console.log('[STT Diagnostic] onresult ignored because isKaiSpeaking is true');
          return;
        }

        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          const transcriptChunk = item[0].transcript;
          const isFinal = item.isFinal;
          const confidence = item[0].confidence;

          console.log(`[STT Diagnostic] 8. onresult item [index ${i}]:`, {
            chunk: transcriptChunk,
            isFinal,
            confidence,
          });

          if (isFinal) {
            final += transcriptChunk;
          } else {
            interim += transcriptChunk;
          }
        }

        console.log('[STT Diagnostic] onresult aggregated:', { final, interim });

        if (final && final.trim()) {
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
          pendingInterimRef.current = '';
          setInterimTranscript('');
          setIsUserSpeaking(false);
          if (userSpeakingTimeoutRef.current) {
            clearTimeout(userSpeakingTimeoutRef.current);
          }
          console.log('[STT Diagnostic] onFinalTranscript invoked with:', final.trim());
          onFinalTranscriptRef.current?.(final.trim());
        } else if (interim && interim.trim()) {
          pendingInterimRef.current = interim;
          setInterimTranscript(interim);
          setIsUserSpeaking(true);
          onInterimTranscriptRef.current?.(interim);

          if (userSpeakingTimeoutRef.current) {
            clearTimeout(userSpeakingTimeoutRef.current);
          }
          userSpeakingTimeoutRef.current = setTimeout(() => {
            setIsUserSpeaking(false);
          }, 1500);

          // Silence Auto-Finalizer
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }
          silenceTimerRef.current = setTimeout(() => {
            const pending = pendingInterimRef.current.trim();
            if (pending && !isKaiSpeakingRef.current) {
              console.log('[STT Diagnostic] Silence timer triggered onFinalTranscript with interim:', pending);
              pendingInterimRef.current = '';
              setInterimTranscript('');
              setIsUserSpeaking(false);
              onFinalTranscriptRef.current?.(pending);
            }
          }, 1200);
        }
      };

      // 9. onerror
      recognition.onerror = (event: any) => {
        isStartingRef.current = false;
        console.error('[STT Diagnostic] 9. onerror event fired:', {
          error: event.error,
          message: event.message,
          type: event.type,
          timeStamp: event.timeStamp,
        });

        // If not-allowed or permission denied, DISABLE auto-restart loop to prevent loop spamming
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          console.warn(`[STT Diagnostic] Recognition error '${event.error}' encountered. Disabling auto-restart loop.`);
          shouldKeepListeningRef.current = false;
          setIsListening(false);
          isListeningRef.current = false;
          setError(`Speech input error: ${event.error}. Please check browser microphone permission.`);
          return;
        }

        if (event.error === 'no-speech' || event.error === 'aborted' || event.error === 'audio-capture') {
          return;
        }
      };

      // 10. onend
      recognition.onend = () => {
        console.log('[STT Diagnostic] 10. onend event fired (SpeechRecognition session ended)', {
          shouldKeepListening: shouldKeepListeningRef.current,
          isKaiSpeaking: isKaiSpeakingRef.current,
          pendingInterim: pendingInterimRef.current,
        });

        isStartingRef.current = false;
        isRecognitionActiveRef.current = false;

        const leftover = pendingInterimRef.current.trim();
        if (leftover && !isKaiSpeakingRef.current) {
          console.log('[STT Diagnostic] onend finalized leftover interim speech:', leftover);
          pendingInterimRef.current = '';
          onFinalTranscriptRef.current?.(leftover);
        }

        setIsUserSpeaking(false);
        setInterimTranscript('');

        if (shouldKeepListeningRef.current && !isKaiSpeakingRef.current) {
          const restartDelay = isMobileDevice() ? 120 : 250;
          console.log(`[STT Diagnostic] onend scheduling auto-restart in ${restartDelay}ms`);
          setTimeout(() => {
            if (shouldKeepListeningRef.current && !isKaiSpeakingRef.current && !isRecognitionActiveRef.current) {
              safeStartRecognition('onend-auto-restart');
            }
          }, restartDelay);
        } else if (!shouldKeepListeningRef.current) {
          setIsListening(false);
          isListeningRef.current = false;
        }
      };

      recognitionRef.current = recognition;
    } catch (err: any) {
      console.error('[STT Diagnostic] Failed to setup speech recognition:', err);
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
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (userSpeakingTimeoutRef.current) {
        clearTimeout(userSpeakingTimeoutRef.current);
      }
    };
  }, [sttCode, stopVolumeAnalyser, safeStartRecognition]);

  const startListening = useCallback(async () => {
    console.log('[STT Diagnostic] startListening() called by user action');
    unlockAudio();

    shouldKeepListeningRef.current = continuous;
    setIsListening(true);
    isListeningRef.current = true;
    setError(null);

    await safeStartRecognition('user-gesture-startListening');
  }, [continuous, safeStartRecognition]);

  const stopListening = useCallback(() => {
    console.log('[STT Diagnostic] stopListening() called by user action');
    shouldKeepListeningRef.current = false;
    stopVolumeAnalyser();
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    pendingInterimRef.current = '';

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    isRecognitionActiveRef.current = false;
    isStartingRef.current = false;
    setIsListening(false);
    isListeningRef.current = false;
    setIsUserSpeaking(false);
    setInterimTranscript('');
  }, [stopVolumeAnalyser]);

  const toggleListening = useCallback(() => {
    console.log('[STT Diagnostic] toggleListening() called (currently isListening:', isListening, ')');
    if (isListening) {
      stopListening();
    } else {
      startListening();
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

