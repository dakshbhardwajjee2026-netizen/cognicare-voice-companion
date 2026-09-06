import React from 'react';
import { Activity, Brain, User, Image as ImageIcon, MapPin, Send, PhoneCall, Battery, AlertTriangle } from 'lucide-react';
import { PatientTelemetry } from '../types';

interface CaregiverHeaderProps {
  telemetry: PatientTelemetry;
  activeTab: 'telemetry' | 'games' | 'profile' | 'memories' | 'geofence' | 'tasks' | 'calling';
  setActiveTab: (tab: 'telemetry' | 'games' | 'profile' | 'memories' | 'geofence' | 'tasks' | 'calling') => void;
}

export const CaregiverHeader: React.FC<CaregiverHeaderProps> = ({
  telemetry,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="bg-white/85 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-30 shadow-sm">
      {/* Top Title Banner */}
      <div className="max-w-md mx-auto p-3.5 flex items-center justify-between border-b border-slate-100">
        <div>
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
            Caregiver Command Center
            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-mono font-bold py-0.5 px-2 rounded-full border border-emerald-200">
              LIVE
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Patient: <span className="text-slate-800 font-semibold">{telemetry.profile?.patientName || 'David Kaka'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {telemetry.geofenceStatus === 'boundary_alert' && (
            <div className="bg-rose-50 text-rose-700 text-xs font-bold py-1 px-2.5 rounded-full border border-rose-200 flex items-center gap-1 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Boundary Alert</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-slate-600 text-xs font-mono bg-slate-100 py-1 px-2 rounded-lg border border-slate-200">
            <Battery className="w-3.5 h-3.5 text-emerald-600" />
            <span>{telemetry.batteryLevel}%</span>
          </div>
        </div>
      </div>

      {/* iOS Segmented Control Bar */}
      <div className="max-w-md mx-auto p-2 bg-slate-100/90 overflow-x-auto flex gap-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('telemetry')}
          className={`py-2 px-3 text-xs font-bold rounded-xl whitespace-nowrap flex items-center gap-1.5 transition-all ${
            activeTab === 'telemetry' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Activity className="w-3.5 h-3.5" /> Telemetry
        </button>

        <button
          onClick={() => setActiveTab('games')}
          className={`py-2 px-3 text-xs font-bold rounded-xl whitespace-nowrap flex items-center gap-1.5 transition-all ${
            activeTab === 'games' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Brain className="w-3.5 h-3.5" /> 5 Games Analytics
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`py-2 px-3 text-xs font-bold rounded-xl whitespace-nowrap flex items-center gap-1.5 transition-all ${
            activeTab === 'profile' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <User className="w-3.5 h-3.5" /> Cultural Profile
        </button>

        <button
          onClick={() => setActiveTab('memories')}
          className={`py-2 px-3 text-xs font-bold rounded-xl whitespace-nowrap flex items-center gap-1.5 transition-all ${
            activeTab === 'memories' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" /> Memory Bank
        </button>

        <button
          onClick={() => setActiveTab('geofence')}
          className={`py-2 px-3 text-xs font-bold rounded-xl whitespace-nowrap flex items-center gap-1.5 transition-all ${
            activeTab === 'geofence' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" /> Geofence
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`py-2 px-3 text-xs font-bold rounded-xl whitespace-nowrap flex items-center gap-1.5 transition-all ${
            activeTab === 'tasks' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Send className="w-3.5 h-3.5" /> Tasks
        </button>

        <button
          onClick={() => setActiveTab('calling')}
          className={`py-2 px-3 text-xs font-bold rounded-xl whitespace-nowrap flex items-center gap-1.5 transition-all ${
            activeTab === 'calling' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <PhoneCall className="w-3.5 h-3.5" /> Call & Chat
        </button>
      </div>
    </header>
  );
};
