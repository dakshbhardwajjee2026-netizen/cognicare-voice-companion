import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Sparkles } from 'lucide-react';

interface KaiVoiceCompanionProps {
  patientName: string;
  honorific: string;
  language: string;
}

export const KaiVoiceCompanion: React.FC<KaiVoiceCompanionProps> = ({
  patientName,
  honorific,
  language,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userSpeech, setUserSpeech] = useState('');
  const [kaiResponse, setKaiResponse] = useState(`Namaste ${honorific}! I am Kai, your companion. Tap the orb or speak anytime.`);
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Web Speech API if supported
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setUserSpeech(transcript);
        handleSendToKai(transcript);
      };

      recognitionRef.current = recognition;
    }
  }, [honorific, language]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser environment. Using demo prompts.');
      handleSendToKai("How are you today Kai?");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Error starting STT:', err);
      }
    }
  };

  const handleSendToKai = async (query: string) => {
    try {
      setIsSpeaking(true);
      const res = await fetch('http://localhost:3001/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: query, language, honorific })
      });
      const data = await res.json();
      const text = data.response || `Namaste ${honorific}! I am right here with you.`;
      setKaiResponse(text);
      speakText(text);
    } catch (err) {
      console.error('Error calling Kai backend:', err);
      const text = `Namaste ${honorific}! I am right here with you. Everything is safe.`;
      setKaiResponse(text);
      speakText(text);
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85; // Slow, clear rate for dementia patients
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsSpeaking(false);
    }
  };

  return (
    <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 shadow-2xl text-center flex flex-col items-center">
      {/* Kai Glowing Orb */}
      <div className="relative my-4 cursor-pointer" onClick={toggleListening}>
        <div className={`w-36 h-36 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl border-4 ${
          isSpeaking 
            ? 'bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 border-amber-300 scale-105 shadow-amber-500/50 animate-pulse' 
            : isListening 
            ? 'bg-gradient-to-tr from-cyan-500 via-teal-500 to-emerald-400 border-cyan-300 scale-105 shadow-cyan-500/50 animate-pulse-ring' 
            : 'bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 border-purple-400 shadow-purple-600/40 hover:scale-105'
        }`}>
          {isSpeaking ? (
            <Volume2 className="w-16 h-16 text-white animate-bounce" />
          ) : isListening ? (
            <Mic className="w-16 h-16 text-white animate-pulse" />
          ) : (
            <Sparkles className="w-16 h-16 text-white/90" />
          )}
        </div>
      </div>

      {/* Orb Status Label */}
      <div className="mb-4">
        <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
          isSpeaking 
            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
            : isListening 
            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
        }`}>
          {isSpeaking ? 'Kai is Speaking...' : isListening ? 'Kai is Listening...' : 'Tap Orb to Speak'}
        </span>
      </div>

      {/* Kai Response Box */}
      <div className="w-full bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 shadow-inner min-h-[100px] flex items-center justify-center">
        <p className="text-lg sm:text-xl font-medium text-slate-100 leading-relaxed text-center">
          "{kaiResponse}"
        </p>
      </div>

      {/* Patient Speech Transcript */}
      {userSpeech && (
        <p className="mt-3 text-xs text-slate-400 font-medium italic">
          You said: "{userSpeech}"
        </p>
      )}
    </div>
  );
};
