import React from 'react';
import { Pill, Droplets, CheckCircle, Clock, BellRing } from 'lucide-react';
import { CaregiverRequest } from '../types';

interface CaregiverTasksPromptProps {
  requests: CaregiverRequest[];
  onCompleteTask: (id: string) => void;
}

export const CaregiverTasksPrompt: React.FC<CaregiverTasksPromptProps> = ({
  requests,
  onCompleteTask,
}) => {
  const pendingRequests = requests.filter((r) => r.status !== 'completed');

  if (pendingRequests.length === 0) return null;

  return (
    <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-3xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-amber-300 font-bold text-lg">
          <BellRing className="w-6 h-6 animate-bounce" />
          <span>Reminder from Sarah</span>
        </div>
        <span className="bg-amber-500/20 text-amber-300 text-xs font-mono font-bold py-1 px-2.5 rounded-full border border-amber-400/30">
          {pendingRequests.length} Pending
        </span>
      </div>

      <div className="space-y-3">
        {pendingRequests.map((req) => (
          <div
            key={req.id}
            className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4 flex flex-col gap-3 shadow-lg"
          >
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 mt-0.5">
                {req.type === 'medication' ? (
                  <Pill className="w-6 h-6" />
                ) : req.type === 'hydration' ? (
                  <Droplets className="w-6 h-6" />
                ) : (
                  <Clock className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white leading-snug">{req.title}</h3>
                <p className="text-sm text-slate-300 mt-1 leading-normal">{req.description}</p>
                <p className="text-xs text-amber-400/80 font-mono mt-1">Scheduled for {req.scheduledTime}</p>
              </div>
            </div>

            {/* Complete Task Button */}
            <button
              onClick={() => onCompleteTask(req.id)}
              className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 border border-emerald-400/40 text-base transition-all"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Mark Done (Tell Sarah)</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
