import React from 'react';
import { MapPin, ShieldCheck, AlertTriangle, Compass, Sliders } from 'lucide-react';
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
      {/* Map Radar Visualizer Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-400" />
            <span>Live Geofence Radar</span>
          </h2>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono border ${
            telemetry.geofenceStatus === 'safe'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
          }`}>
            {telemetry.geofenceStatus === 'safe' ? 'INSIDE SAFE ZONE' : 'BOUNDARY BREACH ALERT'}
          </span>
        </div>

        {/* Visual Map Representation */}
        <div className="relative w-full h-64 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center p-4">
          {/* Concentric Radar Circles */}
          <div className="absolute w-56 h-56 rounded-full border border-emerald-500/20 animate-ping"></div>
          <div className="absolute w-44 h-44 rounded-full border border-emerald-500/30"></div>
          <div className="absolute w-32 h-32 rounded-full border-2 border-emerald-500/50 bg-emerald-500/10 flex items-center justify-center">
            {/* Patient Marker */}
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-lg text-xs font-bold text-slate-950">
                DK
              </div>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-300 rounded-full animate-ping"></span>
            </div>
          </div>

          <div className="absolute bottom-3 left-3 right-3 bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="text-xs text-slate-200 truncate font-mono">
              {telemetry.currentLocation.address}
            </p>
          </div>
        </div>

        {/* Safe Zone Control Slider */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-300 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" /> Safe Zone Boundary Radius
            </span>
            <span className="text-emerald-400 font-mono font-bold">{telemetry.geofenceRadiusMeters} meters</span>
          </div>

          <input
            type="range"
            min="100"
            max="2000"
            step="100"
            value={telemetry.geofenceRadiusMeters}
            onChange={(e) => onUpdateRadius(Number(e.target.value))}
            className="w-full accent-indigo-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
