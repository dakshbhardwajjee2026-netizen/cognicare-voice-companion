import React, { useState } from 'react';
import { Send, Pill, Droplets, Clock, PlusCircle } from 'lucide-react';
import { CaregiverRequest } from '../types';

interface RemoteTaskDispatcherProps {
  requests: CaregiverRequest[];
  onCreateTask: (task: { title: string; description: string; scheduledTime: string; type: 'medication' | 'hydration' | 'activity' }) => void;
}

export const RemoteTaskDispatcher: React.FC<RemoteTaskDispatcherProps> = ({ requests, onCreateTask }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'medication' | 'hydration' | 'activity'>('medication');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    onCreateTask({ title: title.trim(), description: description.trim(), scheduledTime: 'Immediate', type });
    setTitle('');
    setDescription('');
  };

  return (
    <div className="space-y-4">
      {/* Dispatch Form */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-3">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-blue-600" />
          <span>Dispatch Remote Care Task</span>
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setType('medication')}
              className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 border transition-all ${
                type === 'medication' ? 'bg-amber-50 text-amber-700 border-amber-300' : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
            >
              <Pill className="w-3.5 h-3.5" /> Medicine
            </button>
            <button
              type="button"
              onClick={() => setType('hydration')}
              className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 border transition-all ${
                type === 'hydration' ? 'bg-sky-50 text-sky-700 border-sky-300' : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
            >
              <Droplets className="w-3.5 h-3.5" /> Hydration
            </button>
            <button
              type="button"
              onClick={() => setType('activity')}
              className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 border transition-all ${
                type === 'activity' ? 'bg-purple-50 text-purple-700 border-purple-300' : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" /> Activity
            </button>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Afternoon BP Medication"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Instructions for Kai to Speak Aloud</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Take 1 tablet with warm glass of water."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 text-xs transition-all"
          >
            <Send className="w-4 h-4" /> Send Task to David's Phone
          </button>
        </form>
      </div>
    </div>
  );
};
