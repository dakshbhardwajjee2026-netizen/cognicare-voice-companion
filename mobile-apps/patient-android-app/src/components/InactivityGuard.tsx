import React, { useState, useEffect } from 'react';
import { HeartHandshake, Check, Coffee } from 'lucide-react';

interface InactivityGuardProps {
  patientName: string;
  honorific: string;
}

export const InactivityGuard: React.FC<InactivityGuardProps> = ({ patientName, honorific }) => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // 15-minute inactivity trigger (15 * 60 * 1000 = 900,000ms, set to 60s for live demo visibility)
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 60000);

    return () => clearTimeout(timer);
  }, []);

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-40 bg-white/95 border border-blue-200/90 rounded-3xl p-5 shadow-2xl backdrop-blur-xl animate-fade-in max-w-sm mx-auto">
      <div className="flex items-start gap-3">
        <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 shrink-0">
          <HeartHandshake className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">Checking in on you, {patientName}</h3>
          <p className="text-xs text-slate-600 mt-1">Are you doing okay? Would you like a glass of warm water?</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4">
        <button
          onClick={() => setShowPrompt(false)}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1 shadow-sm"
        >
          <Check className="w-4 h-4" /> I am okay!
        </button>
        <button
          onClick={() => setShowPrompt(false)}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1 border border-slate-200"
        >
          <Coffee className="w-4 h-4 text-amber-600" /> Bring Water
        </button>
      </div>
    </div>
  );
};
