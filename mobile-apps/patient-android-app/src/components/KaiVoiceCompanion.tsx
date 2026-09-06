import React, { useState } from 'react';
import { Sparkles, Mic, Volume2, Send, MessageSquare } from 'lucide-react';
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
  const [kaiResponse, setKaiResponse] = useState(`(tone: warm) Namaste ${honorific}! I am Kai, your gentle voice companion. I am right here by your side.`);
  const [lastUserText, setLastUserText] = useState('');
  const [typedInput, setTypedInput] = useState('');

  const handleSendToKai = async (query: string) => {
    if (!query || !query.trim()) return;
    const trimmed = query.trim();
    setLastUserText(trimmed);
    setTypedInput('');
    try {
      setIsSpeaking(true);
      const res = await fetch('http://localhost:3001/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: trimmed, language, honorific })
      });
      const data = await res.json();
      const text = data.response || `(tone: warm) Namaste ${honorific}! I am right here with you. Everything is calm and safe.`;
      setKaiResponse(text);
      speakText(text);
    } catch (err) {
      console.error('Error calling Kai AI backend:', err);
      const text = `(tone: gentle) Namaste ${honorific}! I am right here by your side. Everything is peaceful and safe.`;
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
    const cleanText = rawText.replace(/\([^)]*\)/g, '').trim();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.85;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsSpeaking(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typedInput.trim()) {
      handleSendToKai(typedInput);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-5 shadow-sm shadow-slate-200/50 text-center flex flex-col items-center space-y-3">
      {/* Siri-style Glowing Voice Orb */}
      <div
        className="relative my-2 cursor-pointer"
        onClick={() => handleSendToKai("How are you today Kai?")}
      >
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

      {/* Listening Status Badge */}
      <div>
        <span className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
          isSpeaking
            ? 'bg-amber-50 text-amber-700 border-amber-200'
            : isListening
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-blue-50 text-blue-700 border-blue-200'
        }`}>
          <span className="w-2 h-2 rounded-full bg-current animate-ping"></span>
          {isSpeaking ? 'Kai is Speaking...' : isListening ? 'Listening (Speak Anytime)' : 'Tap Orb or Type Below'}
        </span>
      </div>

      {/* Response Card */}
      <div className="w-full bg-slate-50/90 border border-slate-200/80 rounded-2xl p-4 shadow-inner min-h-[80px] flex items-center justify-center">
        <p className="text-base font-medium text-slate-800 leading-relaxed text-center">
          "{kaiResponse.replace(/\([^)]*\)/g, '').trim()}"
        </p>
      </div>

      {/* Quick Suggestion Chips */}
      <div className="w-full flex flex-wrap gap-1.5 justify-center py-1">
        <button
          onClick={() => handleSendToKai("How are you today Kai?")}
          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-1 px-2.5 rounded-full border border-slate-200"
        >
          👋 "How are you Kai?"
        </button>
        <button
          onClick={() => handleSendToKai("Where am I right now?")}
          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-1 px-2.5 rounded-full border border-slate-200"
        >
          📍 "Where am I?"
        </button>
        <button
          onClick={() => handleSendToKai("Tell me a comforting story")}
          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-1 px-2.5 rounded-full border border-slate-200"
        >
          ✨ "Comfort story"
        </button>
      </div>

      {/* Text Input Bar */}
      <form onSubmit={handleFormSubmit} className="w-full flex gap-2 pt-1">
        <input
          type="text"
          value={typedInput}
          onChange={(e) => setTypedInput(e.target.value)}
          placeholder="Type or speak to Kai..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold p-2 px-3.5 rounded-xl shadow-sm text-xs flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Transcript Log */}
      {(interimTranscript || lastUserText) && (
        <p className="text-[11px] text-slate-500 font-medium italic">
          {interimTranscript ? `Listening: "${interimTranscript}"` : `You asked: "${lastUserText}"`}
        </p>
      )}
    </div>
  );
};
