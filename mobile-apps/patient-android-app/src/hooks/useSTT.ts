import { useState, useEffect, useRef } from 'react';

interface UseSTTOptions {
  sttCode?: string;
  isKaiSpeaking: boolean;
  onFinalTranscript: (transcript: string) => void;
}

export function useSTT({ sttCode = 'en-US', isKaiSpeaking, onFinalTranscript }: UseSTTOptions) {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Web Speech API not supported in browser environment');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = sttCode;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => {
      setIsListening(false);
      // Auto-restart continuous listening if not speaking
      if (!isKaiSpeaking) {
        try { recognition.start(); } catch (e) {}
      }
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setInterimTranscript(interim);
      if (final.trim() && !isKaiSpeaking) {
        onFinalTranscript(final.trim());
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (e) {}

    return () => {
      try { recognition.stop(); } catch (e) {}
    };
  }, [sttCode]);

  // Mic Echo Suppression: Pause listening while Kai speaks
  useEffect(() => {
    if (!recognitionRef.current) return;
    if (isKaiSpeaking) {
      try { recognitionRef.current.stop(); } catch (e) {}
    } else {
      try { recognitionRef.current.start(); } catch (e) {}
    }
  }, [isKaiSpeaking]);

  return {
    isListening,
    interimTranscript,
  };
}
