import React from 'react';
import { Calendar as CalendarIcon, Clock, CheckCircle2, Circle, Pill, Droplets, Activity } from 'lucide-react';
import { ScheduleEventItem } from '../types';

interface ScheduleViewProps {
  schedule: ScheduleEventItem[];
  onToggleComplete: (id: string) => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ schedule, onToggleComplete }) => {
  return (
    <div className="bg-white/80 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-indigo-600" />
          <span>Today's Routine Schedule</span>
        </h2>
        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 py-1 px-2.5 rounded-full">
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
      </div>

      <div className="space-y-2.5">
        {schedule.map((item) => (
          <div
            key={item.id}
            onClick={() => onToggleComplete(item.id)}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              item.completed
                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                : 'bg-slate-50 border-slate-200 hover:border-indigo-300 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${
                item.category === 'medication' ? 'bg-amber-100 text-amber-700' : item.category === 'hydration' ? 'bg-sky-100 text-sky-700' : 'bg-purple-100 text-purple-700'
              }`}>
                {item.category === 'medication' ? <Pill className="w-4 h-4" /> : item.category === 'hydration' ? <Droplets className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
              </div>
              <div>
                <h3 className={`text-sm font-bold ${item.completed ? 'line-through opacity-70' : ''}`}>{item.title}</h3>
                <p className="text-xs text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-slate-400" /> {item.time}
                </p>
              </div>
            </div>

            <div>
              {item.completed ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              ) : (
                <Circle className="w-6 h-6 text-slate-300" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
