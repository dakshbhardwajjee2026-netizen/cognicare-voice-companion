import React from 'react';
import { Activity, PhoneCall, MapPin, Send, Battery, ShieldCheck, AlertTriangle } from 'lucide-react';
import { PatientTelemetry } from '../types';

interface CaregiverHeaderProps {
  telemetry: PatientTelemetry;
  activeTab: 'telemetry' | 'calling' | 'geofence' | 'tasks';
  setActiveTab: (tab: 'telemetry' | 'calling' | 'geofence' | 'tasks') => void;
}

export const CaregiverHeader: React.FC<CaregiverHeaderProps> = ({
  telemetry,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="bg-slate-900/95 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-md">
      {/* Top Banner */}
      <div className="max-w-md mx-auto p-4 flex items-center justify-between border-b border-slate-800/80">
        <div>
          <h1 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
            Caregiver Command Center
            <span className="bg-emerald-500/20 text-emerald-300 text-xs font-mono py-0.5 px-2 rounded-full border border-emerald-500/30">
              LIVE
            </span>
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Monitoring: <span className="text-slate-200 font-semibold">{telemetry.patientName}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {telemetry.geofenceStatus === 'boundary_alert' && (
            <div className="bg-rose-500/20 text-rose-300 text-xs font-bold py-1 px-2.5 rounded-full border border-rose-500/40 animate-pulse flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Boundary Alert</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-slate-400 text-xs font-mono bg-slate-800 py-1.5 px-2.5 rounded-lg border border-slate-700">
            <Battery className="w-3.5 h-3.5 text-emerald-400" />
            <span>{telemetry.batteryLevel}%</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-md mx-auto grid grid-cols-4 p-1 bg-slate-950/60">
        <button
          onClick={() => setActiveTab('telemetry')}
          className={`py-2.5 text-xs font-bold flex flex-col items-center gap-1 rounded-xl transition-all ${
            activeTab === 'telemetry' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Telemetry</span>
        </button>

        <button
          onClick={() => setActiveTab('calling')}
          className={`py-2.5 text-xs font-bold flex flex-col items-center gap-1 rounded-xl transition-all ${
            activeTab === 'calling' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <PhoneCall className="w-4 h-4" />
          <span>Call & Chat</span>
        </button>

        <button
          onClick={() => setActiveTab('geofence')}
          className={`py-2.5 text-xs font-bold flex flex-col items-center gap-1 rounded-xl transition-all relative ${
            activeTab === 'geofence' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Geofence</span>
          {telemetry.geofenceStatus === 'boundary_alert' && (
            <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`py-2.5 text-xs font-bold flex flex-col items-center gap-1 rounded-xl transition-all ${
            activeTab === 'tasks' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Tasks</span>
        </button>
      </div>
    </header>
  );
};
