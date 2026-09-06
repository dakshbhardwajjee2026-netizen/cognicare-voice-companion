import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, UserCheck, ShieldCheck } from 'lucide-react';
import { CallState } from '../types';
import { wsClient } from '../services/websocket';

interface PatientCaregiverCallModalProps {
  callState: CallState;
  caregiverName: string;
  onClose: () => void;
}

export const PatientCaregiverCallModal: React.FC<PatientCaregiverCallModalProps> = ({
  callState,
  caregiverName,
  onClose,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    let timer: any = null;
    if (callState === 'connected') {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [callState]);

  if (callState === 'idle') return null;

  const handleAnswer = () => {
    wsClient.sendCallSignal('answer');
  };

  const handleEndCall = () => {
    wsClient.sendCallSignal('end');
    onClose();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center flex flex-col items-center justify-between min-h-[480px]">
        {/* Top Call Info */}
        <div className="flex flex-col items-center mt-4">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 p-1 shadow-xl shadow-emerald-900/40 mb-4 animate-pulse">
            <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center border-2 border-emerald-400 text-3xl font-bold text-emerald-400">
              {caregiverName.charAt(0)}
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white tracking-wide">{caregiverName}</h2>
          <p className="text-sm font-semibold text-emerald-400 mt-1 flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" /> Primary Family Caregiver
          </p>

          <p className="text-xs font-mono text-slate-400 mt-3 uppercase tracking-widest bg-slate-800/80 py-1 px-3 rounded-full border border-slate-700">
            {callState === 'ringing' 
              ? 'Incoming Voice Call...' 
              : callState === 'calling' 
              ? 'Calling Sarah...' 
              : `Connected (${formatDuration(callDuration)})`}
          </p>
        </div>

        {/* Audio Waveform indicator during active call */}
        {callState === 'connected' && (
          <div className="flex items-center gap-1.5 my-6">
            <div className="w-2 h-8 bg-emerald-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-12 bg-emerald-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
            <div className="w-2 h-6 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            <div className="w-2 h-10 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.1s]"></div>
          </div>
        )}

        {/* Bottom Call Controls */}
        <div className="w-full mt-6">
          {callState === 'ringing' ? (
            <div className="flex items-center justify-around w-full">
              {/* Decline Button */}
              <button
                onClick={handleEndCall}
                className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-rose-900/60 transition-all"
              >
                <PhoneOff className="w-8 h-8" />
              </button>

              {/* Answer Button */}
              <button
                onClick={handleAnswer}
                className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-emerald-900/60 transition-all animate-bounce"
              >
                <Phone className="w-8 h-8" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-around w-full">
              {/* Mute Button */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                  isMuted ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>

              {/* End Call Button */}
              <button
                onClick={handleEndCall}
                className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-rose-900/60 transition-all"
              >
                <PhoneOff className="w-8 h-8" />
              </button>

              {/* Speaker Button */}
              <div className="w-14 h-14 rounded-full bg-slate-800 text-emerald-400 border border-slate-700 flex items-center justify-center">
                <Volume2 className="w-6 h-6" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
