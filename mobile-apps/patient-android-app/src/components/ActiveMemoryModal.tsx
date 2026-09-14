import React from 'react';
import { X, Heart, Calendar, Sparkles } from 'lucide-react';
import { MemoryItem } from '../types';

interface ActiveMemoryModalProps {
  memory: MemoryItem | null;
  onClose: () => void;
}

export const ActiveMemoryModal: React.FC<ActiveMemoryModalProps> = ({ memory, onClose }) => {
  if (!memory) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-sm bg-white/95 border border-slate-200/90 rounded-3xl p-5 shadow-2xl space-y-4">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
            <span>Cherished Memory</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Photo Image */}
        <div className="relative rounded-2xl overflow-hidden shadow-md aspect-square bg-slate-100">
          <img
            src={memory.imageUrl}
            alt={memory.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Memory Details */}
        <div className="space-y-1.5 text-left">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-blue-600">{memory.category}</span>
            <span className="flex items-center gap-1 font-mono">
              <Calendar className="w-3 h-3 text-slate-400" /> {memory.date}
            </span>
          </div>

          <h3 className="text-lg font-bold text-slate-900 leading-snug">{memory.title}</h3>
          <p className="text-xs text-slate-600 leading-relaxed">{memory.description}</p>
        </div>

        {/* Done / Close Button */}
        <button
          onClick={onClose}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl shadow-md text-xs flex items-center justify-center gap-1.5 transition-all"
        >
          <Sparkles className="w-4 h-4" />
          <span>Thank you Kai, that's beautiful</span>
        </button>
      </div>
    </div>
  );
};
