import React from 'react';
import { MapPin, Sliders, Compass } from 'lucide-react';
import { PatientTelemetry } from '../types';

interface GeofenceRadarMapProps {
  telemetry: PatientTelemetry;
  onUpdateRadius: (radius: number) => void;
}

export const GeofenceRadarMap: React.FC<GeofenceRadarMapProps> = ({
  telemetry,
  onUpdateRadius,
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600" />
            <span>Live Geofence Radar</span>
          </h2>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono border ${
            telemetry.geofenceStatus === 'safe'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
          }`}>
            {telemetry.geofenceStatus === 'safe' ? 'INSIDE SAFE ZONE' : 'BOUNDARY BREACH ALERT'}
          </span>
        </div>

        {/* Visual Map Canvas */}
        <div className="relative w-full h-64 bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden flex items-center justify-center p-4">
          <div className="absolute w-56 h-56 rounded-full border border-emerald-500/20 animate-ping"></div>
          <div className="absolute w-44 h-44 rounded-full border border-emerald-500/30"></div>
          <div className="absolute w-32 h-32 rounded-full border-2 border-emerald-500/50 bg-emerald-500/10 flex items-center justify-center">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center shadow-lg text-xs font-bold text-white">
                DK
              </div>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping"></span>
            </div>
          </div>

          <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur-md border border-slate-200 p-2.5 rounded-xl flex items-center gap-2 shadow-sm">
            <Compass className="w-4 h-4 text-emerald-600 shrink-0" />
            <p className="text-xs text-slate-800 font-semibold truncate">
              {telemetry.currentLocation?.address || 'Guwahati Town Center, Assam'}
            </p>
          </div>
        </div>

        {/* Radius Slider */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-700 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-blue-600" /> Safe Zone Boundary Radius
            </span>
            <span className="text-emerald-700 font-mono font-bold">{telemetry.geofenceRadiusMeters} meters</span>
          </div>

          <input
            type="range"
            min="100"
            max="2000"
            step="100"
            value={telemetry.geofenceRadiusMeters}
            onChange={(e) => onUpdateRadius(Number(e.target.value))}
            className="w-full accent-blue-600 bg-slate-200 h-2 rounded-lg cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
