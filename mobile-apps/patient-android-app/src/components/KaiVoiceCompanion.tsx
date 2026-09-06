import React, { useState, useEffect } from 'react';
import { Sparkles, Mic, Volume2, ShieldCheck } from 'lucide-react';
import { useSTT } from '../hooks/useSTT';

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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [kaiResponse, setKaiResponse] = useState(`Namaste ${honorific}! I am Kai, your gentle companion. Speak naturally anytime.`);
  const [lastUserText, setLastUserText] = useState('');

  const handleSendToKai = async (query: string) => {
    setLastUserText(query);
    try {
      setIsSpeaking(true);
      const res = await fetch('http://localhost:3001/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: query, language, honorific })
      });
      const data = await res.json();
      const text = data.response || `(tone: warm) Namaste ${honorific}! I am right here with you.`;
      setKaiResponse(text);
      speakText(text);
    } catch (err) {
      console.error('Error calling Kai AI backend:', err);
      const text = `(tone: gentle) Namaste ${honorific}! I am right here by your side. Everything is calm and safe.`;
      setKaiResponse(text);
      speakText(text);
    }
  };

  const { isListening, interimTranscript } = useSTT({
    sttCode: language === 'hi' ? 'hi-IN' : 'en-US',
    isKaiSpeaking: isSpeaking,
    onFinalTranscript: (final) => {
      handleSendToKai(final);
    }
  });

  const speakText = (rawText: string) => {
    // Strip prosody markers like (tone: warm) for clean speech synthesis
    const cleanText = rawText.replace(/\([^)]*\)/g, '').trim();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.85; // Dementia friendly slow, comforting rate
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsSpeaking(false);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-6 shadow-sm shadow-slate-200/50 text-center flex flex-col items-center">
      {/* Siri-style Apple Glowing Orb */}
      <div className="relative my-3 cursor-pointer" onClick={() => handleSendToKai("How are you today Kai?")}>
        <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl border-4 border-white ${
          isSpeaking 
            ? 'bg-gradient-to-tr from-amber-400 via-orange-500 to-yellow-400 shadow-amber-500/40 scale-105 animate-pulse' 
            : isListening 
            ? 'bg-gradient-to-tr from-sky-400 via-blue-500 to-indigo-600 shadow-blue-500/40 scale-105 animate-pulse' 
            : 'bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-blue-600/30'
        }`}>
          {isSpeaking ? (
            <Volume2 className="w-14 h-14 text-white animate-bounce" />
          ) : (
            <Sparkles className="w-14 h-14 text-white/90 animate-pulse" />
          )}
        </div>
      </div>

      {/* Hands-Free Status Badge */}
      <div className="mb-4">
        <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
          isSpeaking
            ? 'bg-amber-50 text-amber-700 border-amber-200'
            : isListening
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-blue-50 text-blue-700 border-blue-200'
        }`}>
          <span className="w-2 h-2 rounded-full bg-current animate-ping"></span>
          {isSpeaking ? 'Kai is Speaking...' : isListening ? 'Continuous Hands-Free Listening' : 'Tap Orb to Speak'}
        </span>
      </div>

      {/* Response Card */}
      <div className="w-full bg-slate-50/90 border border-slate-200/80 rounded-2xl p-5 shadow-inner min-h-[90px] flex items-center justify-center">
        <p className="text-base sm:text-lg font-medium text-slate-800 leading-relaxed text-center">
          "{kaiResponse.replace(/\([^)]*\)/g, '').trim()}"
        </p>
      </div>

      {/* Transcripts */}
      {(interimTranscript || lastUserText) && (
        <p className="mt-2.5 text-xs text-slate-500 font-medium italic">
          {interimTranscript ? `Listening: "${interimTranscript}"` : `You said: "${lastUserText}"`}
        </p>
      )}
    </div>
  );
};
