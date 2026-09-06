import React, { useState } from 'react';
import { Send, Pill, Droplets, Clock, CheckCircle2, PlusCircle } from 'lucide-react';
import { CaregiverRequest } from '../types';

interface RemoteTaskDispatcherProps {
  requests: CaregiverRequest[];
  onCreateTask: (task: { title: string; description: string; scheduledTime: string; type: 'medication' | 'hydration' | 'activity' }) => void;
}

export const RemoteTaskDispatcher: React.FC<RemoteTaskDispatcherProps> = ({
  requests,
  onCreateTask,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledTime, setScheduledTime] = useState('Immediate');
  const [type, setType] = useState<'medication' | 'hydration' | 'activity'>('medication');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    onCreateTask({ title: title.trim(), description: description.trim(), scheduledTime, type });
    setTitle('');
    setDescription('');
  };

  return (
    <div className="space-y-4">
      {/* Dispatch New Task Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-indigo-400" />
          <span>Dispatch Remote Care Task</span>
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Task Type</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('medication')}
                className={`py-2 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1 border transition-all ${
                  type === 'medication' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                <Pill className="w-3.5 h-3.5" /> Medicine
              </button>
              <button
                type="button"
                onClick={() => setType('hydration')}
                className={`py-2 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1 border transition-all ${
                  type === 'hydration' ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                <Droplets className="w-3.5 h-3.5" /> Hydration
              </button>
              <button
                type="button"
                onClick={() => setType('activity')}
                className={`py-2 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1 border transition-all ${
                  type === 'activity' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                <Clock className="w-3.5 h-3.5" /> Activity
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Afternoon Blood Pressure Tablet"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Instructions for Kai to Speak</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Take 1 tablet with warm glass of water from the blue box."
              rows={2}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
            ></textarea>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/60 transition-all text-sm"
          >
            <Send className="w-4 h-4" />
            <span>Send Task to David's Phone</span>
          </button>
        </form>
      </div>

      {/* Dispatched Requests History */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
        <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">Dispatched Tasks History</h3>
        <div className="space-y-2.5">
          {requests.map((req) => (
            <div key={req.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white text-sm">{req.title}</h4>
                <p className="text-xs text-slate-400 mt-0.5">{req.description}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono border ${
                req.status === 'completed'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                {req.status === 'completed' ? '✓ Completed' : 'Pending'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
