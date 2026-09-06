import React from 'react';
import { Image as ImageIcon, Heart, Calendar } from 'lucide-react';
import { MemoryItem } from '../types';

interface MemoriesViewProps {
  memories: MemoryItem[];
}

export const MemoriesView: React.FC<MemoriesViewProps> = ({ memories }) => {
  return (
    <div className="bg-white/80 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-rose-500" />
          <span>Family Memories & Photo Album</span>
        </h2>
        <span className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 py-1 px-2.5 rounded-full">
          {memories.length} Photos
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {memories.map((mem) => (
          <div key={mem.id} className="bg-slate-50 border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm flex items-center gap-3 p-3">
            <img src={mem.imageUrl} alt={mem.title} className="w-20 h-20 rounded-xl object-cover shadow-sm shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-100/60 px-2 py-0.5 rounded-md inline-block mb-1">
                {mem.category}
              </span>
              <h3 className="text-sm font-bold text-slate-900 truncate">{mem.title}</h3>
              <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{mem.description}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" /> {mem.date}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
