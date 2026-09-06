import React from 'react';
import { Clock, CheckCircle2, Circle, Bell, Volume2, ShieldCheck } from 'lucide-react';
import { ScheduleEvent, PatientData } from '../types';
import { t } from '../services/i18n';

interface ScheduleViewProps {
  patientData: PatientData;
  onSpeak: (text: string) => void;
  onBack: () => void;
  currentLanguage?: string;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  patientData,
  onSpeak,
  onBack,
  currentLanguage = 'en',
}) => {
  const [completed, setCompleted] = React.useState<Record<number, boolean>>({});

  const toggleComplete = (idx: number) => {
    setCompleted((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const schedule = patientData.schedule || [];
  const patientName = patientData.profile?.name || 'David';

  return (
    <div id="page-schedule" className="flex flex-col h-full bg-stone-50 pb-20 overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 p-6 sticky top-0 z-10 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">{t('schedule', currentLanguage)}</h1>
          <p className="text-sm text-slate-500 font-medium">{t('pillsRoutine', currentLanguage)} - {patientName}</p>
        </div>
        <button
          onClick={() =>
            onSpeak(
              `(tone: reassuring) Here is your daily plan for today, ${patientName}. You have ${schedule.length} gentle reminders prepared by your family.`
            )
          }
          className="flex items-center space-x-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 px-3.5 py-2 rounded-xl text-xs font-bold transition"
        >
          <Volume2 className="w-4 h-4" />
          <span>Read Aloud</span>
        </button>
      </div>

      <div className="p-6 max-w-2xl mx-auto w-full space-y-4">
        {schedule.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl p-8 border border-stone-200">
            <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <p className="text-lg font-bold text-slate-700">No scheduled events right now</p>
            <p className="text-sm text-slate-500 mt-1">Enjoy a calm and peaceful moment of rest.</p>
          </div>
        ) : (
          schedule.map((item, idx) => {
            const isDone = completed[idx];
            return (
              <div
                key={idx}
                className={`p-5 rounded-3xl border transition-all ${
                  isDone
                    ? 'bg-stone-100/80 border-stone-200 opacity-60'
                    : 'bg-white border-stone-200 shadow-sm hover:shadow-md hover:border-blue-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => toggleComplete(idx)}
                      className="p-1 text-slate-400 hover:text-emerald-600 transition"
                      aria-label="Toggle task completed"
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-7 h-7 text-emerald-600 fill-emerald-100" />
                      ) : (
                        <Circle className="w-7 h-7 text-slate-300 hover:text-emerald-500" />
                      )}
                    </button>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-0.5 bg-sky-100 text-sky-800 text-xs font-bold rounded-full font-mono">
                          {item.time}
                        </span>
                        <h3 className={`text-lg font-bold ${isDone ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                          {item.task}
                        </h3>
                      </div>
                      {item.instructions && (
                        <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{item.instructions}</p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      onSpeak(
                        `(tone: gentle) At ${item.time}, ${item.task}. (pause) ${item.instructions || item.message || ''}`
                      )
                    }
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition ml-2 flex-shrink-0"
                    title="Have Kai speak this reminder"
                    aria-label="Speak reminder"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
