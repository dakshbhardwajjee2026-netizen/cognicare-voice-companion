import React from 'react';
import { Activity, Brain, TrendingUp, AlertCircle, Clock, CheckCircle2, ShieldCheck } from 'lucide-react';
import { PatientTelemetry } from '../types';

interface CognitiveTelemetryDashboardProps {
  telemetry: PatientTelemetry;
}

export const CognitiveTelemetryDashboard: React.FC<CognitiveTelemetryDashboardProps> = ({
  telemetry,
}) => {
  return (
    <div className="space-y-4">
      {/* Primary Cognitive Index Overview Card */}
      <div className="bg-gradient-to-br from-indigo-950/80 via-slate-900 to-purple-950/80 border border-indigo-500/30 rounded-3xl p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm uppercase font-mono font-bold text-indigo-300 tracking-wider">Cognitive Index Status</h2>
            <p className="text-2xl font-extrabold text-white mt-0.5">{telemetry.patientName}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
            telemetry.riskLevel === 'Low' 
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
              : telemetry.riskLevel === 'Moderate'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
          }`}>
            {telemetry.riskLevel} Risk
          </span>
        </div>

        {/* Score & Meter */}
        <div className="grid grid-cols-2 gap-3 bg-slate-900/80 p-4 rounded-2xl border border-indigo-500/20 text-center">
          <div>
            <span className="text-4xl font-extrabold text-emerald-400">{telemetry.cognitiveIndex}</span>
            <span className="text-xs text-slate-400 font-bold"> / 100</span>
            <p className="text-xs text-slate-300 mt-1 font-semibold flex items-center justify-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Overall Index
            </p>
          </div>

          <div className="border-l border-slate-800 pl-3">
            <span className="text-4xl font-extrabold text-sky-400">{telemetry.disorientationIndex}%</span>
            <p className="text-xs text-slate-300 mt-1 font-semibold flex items-center justify-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-sky-400" /> Disorientation Risk
            </p>
          </div>
        </div>
      </div>

      {/* Game Performance & Improvement Metrics */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            <span>Cognitive Games Telemetry</span>
          </h3>
          <span className="text-xs font-mono text-slate-400">{telemetry.recentGameScores.length} Sessions Logged</span>
        </div>

        {/* Game Activity Breakdown List */}
        <div className="space-y-3">
          {telemetry.recentGameScores.map((score, index) => (
            <div
              key={index}
              className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-500/30 flex items-center justify-center text-xl">
                  {score.gameId.includes('match') ? '🧩' : score.gameId.includes('routine') ? '🌅' : '🔍'}
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{score.gameTitle}</h4>
                  <p className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" /> Latency: {score.latencyMs}ms
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-lg font-bold text-emerald-400">{score.score}/{score.maxScore}</span>
                <p className="text-[10px] text-slate-500 font-mono">
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
