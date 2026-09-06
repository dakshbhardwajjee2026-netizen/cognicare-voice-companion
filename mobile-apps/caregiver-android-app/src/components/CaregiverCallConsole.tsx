import React, { useState, useEffect } from 'react';
import { PhoneCall, PhoneOff, Mic, MicOff, Send, MessageSquare, UserCheck } from 'lucide-react';
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
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-5 shadow-sm text-center space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-900 font-bold">
            <UserCheck className="w-5 h-5 text-blue-600" />
            <span>Direct Patient Call Console</span>
          </div>
          <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
            {callState}
          </span>
        </div>

        {callState === 'idle' ? (
          <button
            onClick={handleStartCall}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-5 rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 text-base transition-all"
          >
            <PhoneCall className="w-5 h-5 animate-pulse" />
            <span>Initiate Voice Call with {patientName}</span>
          </button>
        ) : (
          <div className="bg-slate-50 border border-blue-200 rounded-2xl p-5 space-y-4">
            <p className="text-lg font-bold text-slate-900">
              {callState === 'calling' ? `Calling ${patientName}...` : callState === 'ringing' ? `Ringing ${patientName}...` : `In Call (${formatDuration(callDuration)})`}
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={handleEndCall}
                className="w-16 h-16 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/30 transition-all"
              >
                <PhoneOff className="w-8 h-8" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Messaging Console */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-3">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          <span>Patient Messages Stream</span>
        </h3>

        <div className="space-y-2.5 max-h-56 overflow-y-auto p-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-3 rounded-2xl max-w-[85%] text-xs ${
                msg.sender === 'caregiver'
                  ? 'bg-blue-600 text-white ml-auto rounded-br-none shadow-sm'
                  : 'bg-slate-100 text-slate-900 mr-auto rounded-bl-none border border-slate-200'
              }`}
            >
              <p className="font-semibold">{msg.text}</p>
              <span className="text-[10px] text-slate-300 font-mono block text-right mt-1 opacity-90">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSend} className="flex gap-2 pt-2">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type message for Kai to read aloud..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold p-2.5 rounded-xl shadow-md transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
