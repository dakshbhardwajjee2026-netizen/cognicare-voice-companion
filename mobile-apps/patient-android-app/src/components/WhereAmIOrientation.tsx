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
    <div className="bg-white/80 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-5 shadow-sm text-center space-y-3">
      <button
        onClick={handleSpeakLocation}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-98 text-white font-bold py-3.5 px-5 rounded-2xl flex items-center justify-center gap-2.5 shadow-md shadow-blue-500/20 text-base transition-all"
      >
        <Compass className="w-6 h-6 text-sky-200 animate-spin-slow" />
        <span>Where Am I Right Now?</span>
      </button>

      {showDetails && (
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 text-left animate-fade-in">
          <div className="flex items-start gap-2.5">
            <MapPin className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs uppercase font-mono font-bold text-blue-600 tracking-wider">Current Location</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{locationAddress}</p>
              <p className="text-xs text-emerald-600 font-semibold mt-1">✓ Safe Zone Active (Caregiver Guard On)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
