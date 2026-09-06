import React, { useState } from 'react';
import { Mic, MicOff, Volume2, VolumeX, MessageSquare, Send, Sparkles, AlertCircle, Moon, Sun, Play } from 'lucide-react';
import { AlertPayload } from '../types';

interface KaiControlsProps {
  isListening: boolean;
  isUserSpeaking: boolean;
  isSpeaking: boolean;
  isKaiThinking: boolean;
  isMuted: boolean;
  interimTranscript: string;
  micVolume?: number;
  errorMessage?: string | null;
  hasMicPermission?: boolean | null;
  proactiveContext: AlertPayload | null;
  onToggleListening: () => void;
  onToggleMute: () => void;
  onSendTextPrompt: (text: string) => void;
  onQuickPrompt: (text: string) => void;
  onRequestPermission?: () => void;
  isSleepMode?: boolean;
  sleepTimeRemaining?: number;
  onPutKaiToSleep?: (minutes: number) => void;
  onWakeUpKai?: () => void;
}

export const KaiControls: React.FC<KaiControlsProps> = ({
  isListening,
  isUserSpeaking,
  isSpeaking,
  isKaiThinking,
  isMuted,
  interimTranscript,
  micVolume = 0,
  errorMessage,
  hasMicPermission,
  proactiveContext,
  onToggleListening,
  onToggleMute,
  onSendTextPrompt,
  onQuickPrompt,
  onRequestPermission,
  isSleepMode = false,
  sleepTimeRemaining = 0,
  onPutKaiToSleep,
  onWakeUpKai,
}) => {
  const [showTextInput, setShowTextInput] = useState(false);
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [inputText, setInputText] = useState('');

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendTextPrompt(inputText.trim());
    setInputText('');
    setShowTextInput(false);
  };

  const formatSleepTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Determine state display
  const getCompanionState = () => {
    if (isSleepMode) {
      return {
        text: 'Kai is Resting (Sleep Mode)',
        subtext: sleepTimeRemaining > 0 ? `Auto-waking in ${formatSleepTime(sleepTimeRemaining)}` : 'Tap button to wake up Kai',
        bgClass: 'bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 text-indigo-200 shadow-indigo-900/50 shadow-xl ring-4 ring-indigo-500/30',
        icon: <Moon className="w-8 h-8 text-indigo-300 animate-pulse" />,
      };
    }

    if (isSpeaking) {
      return {
        text: 'Kai is Speaking...',
        subtext: 'Listening will resume automatically',
        bgClass: 'bg-gradient-to-tr from-amber-500 to-amber-400 text-white shadow-amber-300/50 shadow-xl ring-4 ring-amber-200 animate-pulse',
        icon: (
          <div className="flex items-end justify-center space-x-1.5 h-10 w-12">
            <div className="h-4 w-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.4s]" />
            <div className="h-9 w-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.2s]" />
            <div className="h-10 w-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.1s]" />
            <div className="h-7 w-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="h-4 w-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.5s]" />
          </div>
        ),
      };
    }

    if (isUserSpeaking || micVolume > 15) {
      return {
        text: "I hear you speaking...",
        subtext: 'Listening to your words',
        bgClass: 'bg-gradient-to-tr from-emerald-600 to-emerald-500 text-white shadow-emerald-400/50 shadow-xl ring-4 ring-emerald-200',
        icon: (
          <div className="flex items-end justify-center space-x-1.5 h-10 w-12">
            <div className="h-6 w-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="h-9 w-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="h-10 w-1.5 bg-white rounded-full animate-bounce" />
            <div className="h-7 w-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.2s]" />
            <div className="h-5 w-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.4s]" />
          </div>
        ),
      };
    }

    if (isKaiThinking) {
      return {
        text: 'Kai is Thinking...',
        subtext: 'Finding the right words for you',
        bgClass: 'bg-gradient-to-tr from-sky-600 to-blue-600 text-white shadow-blue-400/50 shadow-xl ring-4 ring-sky-200',
        icon: (
          <div className="flex items-center justify-center space-x-2 w-12 h-10">
            <div className="w-2.5 h-2.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-2.5 h-2.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-2.5 h-2.5 bg-white rounded-full animate-bounce" />
          </div>
        ),
      };
    }

    if (isListening) {
      return {
        text: 'Hands-Free Active',
        subtext: 'Listening continuously — speak anytime',
        bgClass: 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-blue-500/40 shadow-lg ring-4 ring-blue-200',
        icon: (
          <div className="relative flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-12 w-12 rounded-full bg-white opacity-30"></span>
            <Mic className="w-8 h-8 text-white relative z-10" />
          </div>
        ),
      };
    }

    return {
      text: 'Microphone Paused',
      subtext: 'Hands-free mode is starting...',
      bgClass: 'bg-slate-700 text-white shadow-md ring-2 ring-slate-200 hover:bg-slate-800',
      icon: <MicOff className="w-8 h-8 text-white" />,
    };
  };

  const state = getCompanionState();

  const quickActions = [
    { label: "Today's Schedule", query: "What is my schedule for today?" },
    { label: 'Wedding Memory Photo', query: 'Show me our wedding day memory photo.' },
    { label: 'Caregiver Voice Message', query: 'Can you play my caregiver voice note message?' },
    { label: 'Who is Sarah?', query: 'Who is Sarah?' },
    { label: 'Where Am I?', query: "I'm feeling a bit confused, where am I?" },
    { label: 'Tell me a calming story', query: 'Can you tell me a gentle, calming story?' },
  ];

  // Dynamic scale ring based on live mic volume
  const volumeScale = isListening && !isSleepMode ? 1 + (micVolume / 100) * 0.35 : 1;

  return (
    <div id="kai-interaction-panel" className="flex-shrink-0 w-full bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 flex flex-col items-center relative">
      {/* Sleep Mode Duration Selector Modal */}
      {showSleepModal && (
        <div className="absolute bottom-full mb-2 bg-slate-900 text-white p-4 rounded-3xl shadow-2xl border border-indigo-500/30 z-50 w-80 animate-fade-in text-center space-y-3">
          <div className="flex items-center justify-center space-x-2 text-indigo-300 font-black text-sm">
            <Moon className="w-5 h-5 text-indigo-400" />
            <span>Put Kai to Sleep (Rest Mode)</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Select how long Kai should rest. Listening and check-ins will pause and automatically wake up when timer expires.
          </p>

          <div className="grid grid-cols-3 gap-2 pt-1">
            {[
              { label: '30 Mins', mins: 30 },
              { label: '1 Hour', mins: 60 },
              { label: '2 Hours', mins: 120 },
            ].map((opt) => (
              <button
                key={opt.mins}
                onClick={() => {
                  onPutKaiToSleep?.(opt.mins);
                  setShowSleepModal(false);
                }}
                className="py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow transition active:scale-95"
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowSleepModal(false)}
            className="text-[11px] text-slate-400 hover:text-white underline pt-1 block mx-auto"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Microphone notice or error banner */}
      {errorMessage && !isSleepMode && (
        <div className="w-full max-w-sm mb-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between space-x-2">
          <div className="flex items-center space-x-1.5">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span className="leading-tight">{errorMessage}</span>
          </div>
          {onRequestPermission && (
            <button
              onClick={onRequestPermission}
              className="flex-shrink-0 px-2 py-1 bg-amber-600 text-white text-[10px] font-bold rounded-lg hover:bg-amber-700 transition"
            >
              Allow Mic
            </button>
          )}
        </div>
      )}

      {/* Live Interim Transcript Bubble */}
      {interimTranscript && !isSleepMode && (
        <div className="w-full max-w-sm mb-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs text-emerald-800 animate-fade-in flex items-center justify-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="font-medium italic">"{interimTranscript}..."</span>
        </div>
      )}

      {/* Main Row with Controls and Kai Orb */}
      <div className="flex items-center justify-between w-full max-w-sm px-2">
        {/* Left: Quick Type button */}
        <button
          id="btn-toggle-text-input"
          onClick={() => setShowTextInput(!showTextInput)}
          title="Type a message"
          className={`p-3 rounded-full transition-all ${
            showTextInput
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95'
          }`}
          aria-label="Toggle text input"
        >
          <MessageSquare className="w-5 h-5" />
        </button>

        {/* Center: Main Kai Interactive Voice Orb */}
        <div className="flex flex-col items-center relative">
          {/* Audio Volume Aura Ring */}
          {isListening && !isSleepMode && (
            <div
              className="absolute w-20 h-20 rounded-full border-2 border-blue-400 opacity-60 pointer-events-none transition-transform duration-75"
              style={{ transform: `scale(${volumeScale})` }}
            />
          )}

          <button
            id="kai-main-orb"
            onClick={isSleepMode ? onWakeUpKai : onToggleListening}
            title={isSleepMode ? 'Kai is resting. Tap to wake up now.' : 'Hands-free active. Tap to pause mic.'}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer active:scale-95 ${state.bgClass}`}
            aria-label={state.text}
          >
            {state.icon}
          </button>

          <p className="mt-1.5 text-xs font-bold text-slate-800 tracking-tight text-center">
            {state.text}
          </p>
          <p className="text-[10px] text-slate-500 text-center font-medium">
            {state.subtext}
          </p>

          {/* Wake Up Kai Button when in Sleep Mode */}
          {isSleepMode && (
            <button
              onClick={onWakeUpKai}
              className="mt-2 flex items-center space-x-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md hover:from-emerald-700 hover:to-teal-700 active:scale-95 transition"
            >
              <Sun className="w-4 h-4" />
              <span>Wake Up Kai Now</span>
            </button>
          )}
        </div>

        {/* Right Stack: Sleep Mode Trigger & Mute */}
        <div className="flex flex-col space-y-2 items-center">
          <button
            id="btn-sleep-mode"
            onClick={isSleepMode ? onWakeUpKai : () => setShowSleepModal(!showSleepModal)}
            title={isSleepMode ? 'Wake up Kai' : 'Put Kai to sleep'}
            className={`p-2.5 rounded-full transition-all ${
              isSleepMode
                ? 'bg-indigo-900 text-indigo-200 ring-2 ring-indigo-400 animate-pulse'
                : 'bg-slate-100 text-indigo-600 hover:bg-indigo-50 active:scale-95'
            }`}
            aria-label="Toggle Sleep Mode"
          >
            <Moon className="w-5 h-5" />
          </button>

          <button
            id="btn-toggle-mute"
            onClick={onToggleMute}
            title={isMuted ? 'Unmute voice' : 'Mute voice'}
            className={`p-2.5 rounded-full transition-all ${
              isMuted
                ? 'bg-red-100 text-red-700 ring-2 ring-red-300'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95'
            }`}
            aria-label={isMuted ? 'Unmute Kai voice' : 'Mute Kai voice'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Quick Prompts Carousel */}
      <div className="w-full max-w-sm mt-2.5 flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex-shrink-0 flex items-center">
          <Sparkles className="w-3 h-3 mr-0.5 text-amber-500" /> Prompts:
        </span>
        {quickActions.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onQuickPrompt(item.query)}
            className="flex-shrink-0 text-xs px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-slate-700 rounded-full border border-slate-200 transition-colors font-medium whitespace-nowrap active:scale-95"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Collapsible Text Input for Accessibility / Testing */}
      {showTextInput && (
        <form onSubmit={handleTextSubmit} className="w-full max-w-sm mt-2 flex items-center space-x-2 animate-fade-in">
          <input
            id="kai-text-prompt-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message to Kai..."
            className="flex-grow px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 transition"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );
};

