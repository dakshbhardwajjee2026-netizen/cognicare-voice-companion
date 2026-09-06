import React from 'react';
import { Battery, AlertTriangle, ShieldCheck } from 'lucide-react';
import { PatientTelemetry } from '../types';

interface CaregiverHeaderProps {
  telemetry: PatientTelemetry;
}

export const CaregiverHeader: React.FC<CaregiverHeaderProps> = ({ telemetry }) => {
  const patientName = telemetry?.profile?.patientName || 'David Kaka';
  const batteryLevel = telemetry?.batteryLevel ?? 96;
  const isAlert = telemetry?.geofenceStatus === 'boundary_alert';

  return (
    <header className="bg-white/85 backdrop-blur-xl border-b border-slate-200/80 p-3.5 sticky top-0 z-30 shadow-sm">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Caregiver Command Center
            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-mono font-bold py-0.5 px-2 rounded-full border border-emerald-200">
              LIVE
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Monitoring: <span className="text-slate-800 font-semibold">{patientName}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAlert && (
            <div className="bg-rose-50 text-rose-700 text-xs font-bold py-1 px-2.5 rounded-full border border-rose-200 flex items-center gap-1 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Alert</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-slate-600 text-xs font-mono bg-slate-100 py-1 px-2.5 rounded-full border border-slate-200">
            <Battery className="w-3.5 h-3.5 text-emerald-600" />
            <span>{batteryLevel}%</span>
          </div>
        </div>
      </div>
    </header>
  );
};
