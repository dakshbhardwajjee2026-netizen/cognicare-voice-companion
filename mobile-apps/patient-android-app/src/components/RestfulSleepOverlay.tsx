import React, { useState, useEffect } from 'react';
import { Moon, Sun, BellOff, ShieldCheck } from 'lucide-react';

interface RestfulSleepOverlayProps {
  isSleepMode: boolean;
  onWakeUp: () => void;
}

export const RestfulSleepOverlay: React.FC<RestfulSleepOverlayProps> = ({ isSleepMode, onWakeUp }) => {
  const [secondsRemaining, setSecondsRemaining] = useState(8 * 3600); // 8 hours

  useEffect(() => {
    let interval: any = null;
    if (isSleepMode) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSleepMode]);

  if (!isSleepMode) return null;

  const hours = Math.floor(secondsRemaining / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl flex flex-col items-center justify-between p-6 text-center text-slate-100">
      <div className="mt-12 space-y-2">
        <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
          <Moon className="w-10 h-10 animate-pulse" />
        </div>
        <h2 className="text-2xl font-bold text-amber-200 tracking-tight">Restful Night Sleep</h2>
        <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
          <BellOff className="w-3.5 h-3.5 text-amber-400" /> Non-essential alerts silenced • Safety guard active
        </p>
      </div>

      {/* Auto-wake countdown */}
      <div className="bg-slate-900/80 border border-amber-500/20 p-6 rounded-3xl w-full max-w-xs shadow-2xl">
        <p className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">Auto-Wake Countdown</p>
        <p className="text-5xl font-extrabold text-white mt-2 font-mono">
          {hours}h {minutes}m
        </p>
      </div>

      {/* Wake button */}
      <button
        onClick={onWakeUp}
        className="mb-8 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold py-3.5 px-8 rounded-full shadow-lg shadow-amber-500/30 flex items-center gap-2 text-base transition-all"
      >
        <Sun className="w-5 h-5" />
        <span>Wake Up Early</span>
      </button>
    </div>
  );
};
