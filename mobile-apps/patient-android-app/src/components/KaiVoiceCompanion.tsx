import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, Mic, Volume2, Send, Loader2, AlertCircle } from 'lucide-react';
import { useTTS } from '../hooks/useTTS';
import { useSTT } from '../hooks/useSTT';
import { unlockAudio } from '../utils/audio';

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
  const [isKaiThinking, setIsKaiThinking] = useState(false);
  const [kaiResponse, setKaiResponse] = useState(
    `Hello ${patientName}! I am Kai, your gentle voice companion. I am right here with you.`
  );
  const [lastUserSpeech, setLastUserSpeech] = useState('');
  const [typedInput, setTypedInput] = useState('');
  const conversationHistoryRef = useRef<Array<{ speaker: string; text: string }>>([]);

  // TTS Engine (Native + Universal Streaming Fallback via /api/tts)
  const { speak, stop: stopSpeaking, isSpeaking, speechRate } = useTTS(0.85, language);

  // Send query to Kai AI Backend
  const handleSendToKai = useCallback(
    async (query: string) => {
      if (!query || !query.trim()) return;
      const trimmed = query.trim();

      unlockAudio();
      stopSpeaking();

      setLastUserSpeech(trimmed);
      setTypedInput('');
      setIsKaiThinking(true);

      // Record in history
      conversationHistoryRef.current.push({ speaker: 'user', text: trimmed });

      try {
        const res = await fetch('http://localhost:3001/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: trimmed,
            language,
            honorific,
            history: conversationHistoryRef.current.slice(-6),
          }),
        });

        const data = await res.json();
        const rawText = data.response || `Namaste ${honorific}! I am right here by your side. Everything is safe and peaceful.`;

        // Record response
        conversationHistoryRef.current.push({ speaker: 'kai', text: rawText });

        setKaiResponse(rawText);
        setIsKaiThinking(false);

        // Speak aloud via TTS engine
        speak(rawText);
      } catch (err) {
        console.error('Kai Chat API Error:', err);
        setIsKaiThinking(false);
        const fallbackText = `Namaste ${honorific}! I am right here with you. You are completely safe and loved.`;
        setKaiResponse(fallbackText);
        speak(fallbackText);
      }
    },
    [honorific, language, speak, stopSpeaking]
  );

  // STT Hook (Continuous Hands-Free)
  const sttCode = language === 'hi' ? 'hi-IN' : language === 'as' ? 'as-IN' : language === 'bn' ? 'bn-IN' : 'en-US';
  const { isListening, interimTranscript, error: sttError, toggleListening, startListening } = useSTT({
    sttCode,
    isKaiSpeaking: isSpeaking,
    onFinalTranscript: (final) => {
      if (!isSpeaking && !isKaiThinking) {
        handleSendToKai(final);
      }
    },
  });

  const handleOrbClick = () => {
    unlockAudio();
    if (isSpeaking) {
      stopSpeaking();
    } else {
      startListening();
      // Also provide friendly test prompt if clicked directly
      if (!lastUserSpeech) {
        handleSendToKai('Hello Kai, how are you today?');
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typedInput.trim()) {
      handleSendToKai(typedInput);
    }
  };

  return (
    <div className="bg-white/85 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-5 shadow-sm shadow-slate-200/50 text-center flex flex-col items-center space-y-3">
      {/* Siri-style Glowing Voice Orb */}
      <div className="relative my-2 cursor-pointer select-none" onClick={handleOrbClick}>
        <div
          className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl border-4 border-white ${
            isSpeaking
              ? 'bg-gradient-to-tr from-amber-400 via-orange-500 to-yellow-400 shadow-amber-500/40 scale-105 animate-pulse'
              : isKaiThinking
              ? 'bg-gradient-to-tr from-purple-500 via-indigo-500 to-pink-500 shadow-purple-500/40 scale-105 animate-spin-slow'
              : isListening
              ? 'bg-gradient-to-tr from-sky-400 via-blue-500 to-indigo-600 shadow-blue-500/40 scale-105 animate-pulse'
              : 'bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-blue-600/30'
          }`}
        >
          {isSpeaking ? (
            <Volume2 className="w-14 h-14 text-white animate-bounce" />
          ) : isKaiThinking ? (
            <Loader2 className="w-14 h-14 text-white animate-spin" />
          ) : (
            <Sparkles className="w-14 h-14 text-white/90 animate-pulse" />
          )}
        </div>
      </div>

      {/* Live Status Badge */}
      <div>
        <span
          className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
            isSpeaking
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : isKaiThinking
              ? 'bg-purple-50 text-purple-700 border-purple-200'
              : isListening
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-blue-50 text-blue-700 border-blue-200'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-current animate-ping"></span>
          {isSpeaking
            ? 'Kai is Speaking Aloud...'
            : isKaiThinking
            ? 'Kai is Thinking...'
            : isListening
            ? 'Continuous Hands-Free (Listening)'
            : 'Tap Orb to Talk'}
        </span>
      </div>

      {/* Response Card */}
      <div className="w-full bg-slate-50/90 border border-slate-200/80 rounded-2xl p-4 shadow-inner min-h-[85px] flex items-center justify-center">
        <p className="text-base sm:text-lg font-medium text-slate-800 leading-relaxed text-center">
          "{kaiResponse.replace(/\([^)]*\)/g, '').trim()}"
        </p>
      </div>

      {/* Quick Action Suggestion Chips */}
      <div className="w-full flex flex-wrap gap-1.5 justify-center py-1">
        <button
          onClick={() => handleSendToKai('Hello Kai, how are you today?')}
          className="text-xs bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-semibold py-1.5 px-3 rounded-full border border-slate-200 transition-all"
        >
          👋 "How are you Kai?"
        </button>
        <button
          onClick={() => handleSendToKai('Where am I right now?')}
          className="text-xs bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-semibold py-1.5 px-3 rounded-full border border-slate-200 transition-all"
        >
          📍 "Where am I?"
        </button>
        <button
          onClick={() => handleSendToKai('Who am I and where is my family?')}
          className="text-xs bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-semibold py-1.5 px-3 rounded-full border border-slate-200 transition-all"
        >
          ❤️ "Who am I?"
        </button>
        <button
          onClick={() => handleSendToKai('Show me a photograph of my daughter Sarah')}
          className="text-xs bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-semibold py-1.5 px-3 rounded-full border border-slate-200 transition-all"
        >
          🖼️ "Show Sarah photo"
        </button>
      </div>

      {/* Text / Question Input Bar */}
      <form onSubmit={handleFormSubmit} className="w-full flex gap-2 pt-1">
        <input
          type="text"
          value={typedInput}
          onChange={(e) => setTypedInput(e.target.value)}
          placeholder="Type or speak anything to Kai..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold px-4 py-2.5 rounded-xl shadow-md text-xs flex items-center justify-center transition-all"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Transcript & Error Notice */}
      {interimTranscript && (
        <p className="text-xs text-blue-600 font-medium italic animate-pulse">
          Listening: "{interimTranscript}"
        </p>
      )}

      {lastUserSpeech && !interimTranscript && (
        <p className="text-[11px] text-slate-500 font-medium italic">
          You asked: "{lastUserSpeech}"
        </p>
      )}

      {sttError && (
        <p className="text-[11px] text-amber-600 font-medium flex items-center justify-center gap-1">
          <AlertCircle className="w-3 h-3" /> {sttError}
        </p>
      )}
    </div>
  );
};
