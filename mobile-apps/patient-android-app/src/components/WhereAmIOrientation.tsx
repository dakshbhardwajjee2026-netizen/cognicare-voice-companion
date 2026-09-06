import React, { useState } from 'react';
import { MapPin, Compass, Navigation } from 'lucide-react';

interface WhereAmIOrientationProps {
  locationAddress: string;
  honorific: string;
}

export const WhereAmIOrientation: React.FC<WhereAmIOrientationProps> = ({
  locationAddress,
  honorific,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const handleSpeakLocation = () => {
    setShowDetails(true);
    const speech = `Namaste ${honorific}. You are safe. You are currently at ${locationAddress}. Your family is close by.`;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(speech);
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-5 shadow-xl text-center space-y-3">
      <button
        onClick={handleSpeakLocation}
        className="w-full bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 active:scale-98 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-indigo-950/60 border border-sky-400/30 text-lg transition-all"
      >
        <Compass className="w-7 h-7 text-sky-200 animate-spin-slow" />
        <span>Where Am I Right Now?</span>
      </button>

      {showDetails && (
        <div className="bg-sky-950/60 border border-sky-500/40 rounded-2xl p-4 text-left animate-fade-in">
          <div className="flex items-start gap-2.5">
            <MapPin className="w-5 h-5 text-sky-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs uppercase font-mono font-bold text-sky-300 tracking-wider">Your Current Location</p>
              <p className="text-base font-semibold text-slate-100 mt-0.5">{locationAddress}</p>
              <p className="text-xs text-emerald-400 font-medium mt-1">✓ Safe Zone Active (Caregiver Monitoring Enabled)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
