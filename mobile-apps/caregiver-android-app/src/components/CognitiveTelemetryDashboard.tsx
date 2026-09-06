import React from 'react';
import { Activity, Brain, TrendingUp, AlertCircle, Clock } from 'lucide-react';
import { PatientTelemetry } from '../types';

interface CognitiveTelemetryDashboardProps {
  telemetry: PatientTelemetry;
}

export const CognitiveTelemetryDashboard: React.FC<CognitiveTelemetryDashboardProps> = ({
  telemetry,
}) => {
  return (
    <div className="space-y-4">
      {/* Primary Apple Health Card */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs uppercase font-mono font-bold text-blue-600 tracking-wider">Cognitive Index Status</h2>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{telemetry.profile?.patientName || 'David Kaka'}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
            telemetry.riskLevel === 'Low'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : telemetry.riskLevel === 'Moderate'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}>
            {telemetry.riskLevel} Risk
          </span>
        </div>

        {/* Meters */}
        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-center">
          <div>
            <span className="text-4xl font-extrabold text-emerald-600">{telemetry.cognitiveIndex}</span>
            <span className="text-xs text-slate-400 font-bold"> / 100</span>
            <p className="text-xs text-slate-600 mt-1 font-semibold flex items-center justify-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Overall Index
            </p>
          </div>

          <div className="border-l border-slate-200 pl-3">
            <span className="text-4xl font-extrabold text-blue-600">{telemetry.disorientationIndex}%</span>
            <p className="text-xs text-slate-600 mt-1 font-semibold flex items-center justify-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-blue-600" /> Disorientation Risk
            </p>
          </div>
        </div>
      </div>

      {/* Game Scores Activity Log */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <span>Recent Sessions</span>
          </h3>
          <span className="text-xs font-mono text-slate-500 font-semibold">{telemetry.recentGameScores.length} Logged</span>
        </div>

        <div className="space-y-2.5">
          {telemetry.recentGameScores.map((score, index) => (
            <div key={index} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-lg">
                  {score.gameId.includes('match') ? '🧩' : score.gameId.includes('changed') ? '🔍' : score.gameId.includes('tray') ? '🍱' : score.gameId.includes('routine') ? '🌅' : '🎙️'}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">{score.gameTitle}</h4>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" /> Latency: {score.latencyMs}ms
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-bold text-emerald-600">{score.score}/{score.maxScore}</span>
                <p className="text-[10px] text-slate-400 font-mono">
                  {new Date(score.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
