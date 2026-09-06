import React, { useState, useEffect } from 'react';
import { PhoneCall, PhoneOff, Mic, MicOff, Send, MessageSquare, Volume2, UserCheck } from 'lucide-react';
import { CallState, VoiceMessage } from '../types';
import { caregiverWsClient } from '../services/websocket';

interface CaregiverCallConsoleProps {
  callState: CallState;
  patientName: string;
  messages: VoiceMessage[];
  onSendMessage: (text: string) => void;
}

export const CaregiverCallConsole: React.FC<CaregiverCallConsoleProps> = ({
  callState,
  patientName,
  messages,
  onSendMessage,
}) => {
  const [textInput, setTextInput] = useState('');
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    let timer: any = null;
    if (callState === 'connected') {
      timer = setInterval(() => setCallDuration((prev) => prev + 1), 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [callState]);

  const handleStartCall = () => {
    caregiverWsClient.sendCallSignal('offer');
  };

  const handleEndCall = () => {
    caregiverWsClient.sendCallSignal('end');
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    onSendMessage(textInput.trim());
    setTextInput('');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Call Console Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl text-center space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            <span>Direct Patient Call Console</span>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            {callState}
          </span>
        </div>

        {callState === 'idle' ? (
          <button
            onClick={handleStartCall}
            className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-emerald-950/60 border border-emerald-400/40 text-lg transition-all"
          >
            <PhoneCall className="w-6 h-6 animate-pulse" />
            <span>Initiate Voice Call with {patientName}</span>
          </button>
        ) : (
          <div className="bg-slate-950/90 border border-emerald-500/40 rounded-2xl p-5 space-y-4">
            <p className="text-xl font-bold text-white">
              {callState === 'calling' ? `Calling ${patientName}...` : callState === 'ringing' ? `Ringing ${patientName}...` : `In Call (${formatDuration(callDuration)})`}
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={handleEndCall}
                className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-900/60 transition-all"
              >
                <PhoneOff className="w-8 h-8" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Voice & Text Messaging Console */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-sky-400" />
          <span>Patient Messaging Feed</span>
        </h3>

        {/* Message Stream */}
        <div className="space-y-3 max-h-60 overflow-y-auto p-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-3 rounded-2xl max-w-[85%] text-sm ${
                msg.sender === 'caregiver'
                  ? 'bg-indigo-600 text-white ml-auto rounded-br-none'
                  : 'bg-slate-800 text-slate-100 mr-auto rounded-bl-none border border-slate-700'
              }`}
            >
              <p className="font-medium">{msg.text}</p>
              <span className="text-[10px] text-slate-300 font-mono block text-right mt-1 opacity-80">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>

        {/* Dispatch Form */}
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type message for Kai to read aloud..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold p-3 rounded-xl flex items-center justify-center transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
