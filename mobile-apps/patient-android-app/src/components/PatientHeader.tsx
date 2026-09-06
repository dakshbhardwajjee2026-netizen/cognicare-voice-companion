import React from 'react';
import { Battery, ShieldAlert, PhoneCall, HeartHandshake, Wifi } from 'lucide-react';

interface PatientHeaderProps {
  patientName: string;
  caregiverName: string;
  batteryLevel: number;
  onCallCaregiver: () => void;
  onEmergencySOS: () => void;
}

export const PatientHeader: React.FC<PatientHeaderProps> = ({
  patientName,
  caregiverName,
  batteryLevel,
  onCallCaregiver,
  onEmergencySOS,
}) => {
  return (
    <header className="bg-slate-800/90 border-b border-slate-700 p-4 sticky top-0 z-30 backdrop-blur-md">
      <div className="max-w-lg mx-auto flex items-center justify-between">
        {/* Left: Patient Profile Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-300 font-bold text-lg">
            DK
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">{patientName}</h1>
            <p className="text-xs text-slate-300 flex items-center gap-1 font-medium">
              <HeartHandshake className="w-3.5 h-3.5 text-rose-400" />
              Caregiver: <span className="text-slate-100 font-semibold">{caregiverName}</span>
            </p>
          </div>
        </div>

        {/* Right: Emergency & Status */}
        <div className="flex items-center gap-2">
          {/* Direct Call Button */}
          <button
            onClick={onCallCaregiver}
            className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-semibold py-2 px-3 rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-900/40 border border-emerald-400/40 text-sm transition-all"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Call Sarah</span>
          </button>

          {/* SOS Panic Button */}
          <button
            onClick={onEmergencySOS}
            className="bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold p-2.5 rounded-xl shadow-lg shadow-rose-900/50 border border-rose-400/40 transition-all animate-pulse"
            title="Emergency SOS"
          >
            <ShieldAlert className="w-5 h-5" />
          </button>

          {/* Battery Status */}
          <div className="hidden sm:flex items-center gap-1 text-slate-400 text-xs font-mono bg-slate-900/60 py-1.5 px-2.5 rounded-lg border border-slate-700">
            <Battery className="w-4 h-4 text-emerald-400" />
            <span>{batteryLevel}%</span>
          </div>
        </div>
      </div>
    </header>
  );
};
