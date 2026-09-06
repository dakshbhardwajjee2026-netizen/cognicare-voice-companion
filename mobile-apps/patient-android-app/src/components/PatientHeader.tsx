import React from 'react';
import { Battery, ShieldAlert, Moon, Globe, PhoneCall, Heart } from 'lucide-react';

interface PatientHeaderProps {
  patientName: string;
  caregiverName: string;
  batteryLevel: number;
  currentLanguage: string;
  onLanguageChange: (lang: string) => void;
  onToggleSleep: () => void;
  onCallCaregiver: () => void;
  onEmergencySOS: () => void;
}

const LANGUAGES = [
  { id: 'en', label: 'English' },
  { id: 'hi', label: 'हिंदी (Hindi)' },
  { id: 'as', label: 'অসমীয়া (Assamese)' },
  { id: 'mn', label: 'মৈতৈলোন্ (Manipuri)' },
  { id: 'bn', label: 'বাংলা (Bengali)' },
  { id: 'gu', label: 'ગુજરાતી (Gujarati)' },
  { id: 'mr', label: 'मराठी (Marathi)' },
  { id: 'ta', label: 'தமிழ் (Tamil)' },
  { id: 'te', label: 'తెలుగు (Telugu)' }
];

export const PatientHeader: React.FC<PatientHeaderProps> = ({
  patientName,
  caregiverName,
  batteryLevel,
  currentLanguage,
  onLanguageChange,
  onToggleSleep,
  onCallCaregiver,
  onEmergencySOS,
}) => {
  return (
    <header className="bg-white/85 backdrop-blur-xl border-b border-slate-200/80 p-3.5 sticky top-0 z-30 shadow-sm">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Left: Patient Profile Avatar */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 p-0.5 shadow-md shadow-blue-500/20">
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center font-extrabold text-blue-600 text-base">
              DK
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">{patientName}</h1>
            <p className="text-xs text-slate-500 flex items-center gap-1 font-medium">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              Caregiver: <span className="text-slate-800 font-semibold">{caregiverName}</span>
            </p>
          </div>
        </div>

        {/* Right: Controls & Status */}
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="relative flex items-center bg-slate-100/90 border border-slate-200 rounded-full px-2 py-1">
            <Globe className="w-3.5 h-3.5 text-slate-500 mr-1" />
            <select
              value={currentLanguage}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              {LANGUAGES.map((l) => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>
          </div>

          {/* Sleep Toggle */}
          <button
            onClick={onToggleSleep}
            className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all border border-slate-200/80"
            title="Restful Sleep Mode"
          >
            <Moon className="w-4 h-4" />
          </button>

          {/* SOS Panic Button */}
          <button
            onClick={onEmergencySOS}
            className="p-2 rounded-full bg-rose-500 hover:bg-rose-600 active:scale-95 text-white shadow-md shadow-rose-500/30 transition-all"
            title="Emergency SOS"
          >
            <ShieldAlert className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
