import React from 'react';
import { Heart, Sparkles, Volume2, Image as ImageIcon } from 'lucide-react';
import { Memory, PatientData } from '../types';
import { t } from '../services/i18n';

interface MemoriesViewProps {
  patientData: PatientData;
  onSelectMemory: (memory: Memory) => void;
  onSpeakStory: (text: string) => void;
  currentLanguage?: string;
}

export const MemoriesView: React.FC<MemoriesViewProps> = ({
  patientData,
  onSelectMemory,
  onSpeakStory,
  currentLanguage = 'en',
}) => {
  const memories = patientData.memories || [];
  const patientName = patientData.profile?.name || 'David';

  return (
    <div id="page-memories" className="flex flex-col h-full bg-stone-50 pb-20 overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 p-6 sticky top-0 z-10 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">{t('memoryBank', currentLanguage)}</h1>
          <p className="text-sm text-slate-500 font-medium">{t('photosStories', currentLanguage)} - {patientName}</p>
        </div>
        <div className="flex items-center space-x-1.5 bg-rose-50 text-rose-700 px-3 py-1.5 rounded-full text-xs font-bold">
          <Heart className="w-4 h-4 fill-current text-rose-500" />
          <span>{memories.length} {t('keyMemories', currentLanguage)}</span>
        </div>
      </div>

      <div className="p-6 max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        {memories.map((mem, idx) => (
          <div
            key={idx}
            className="bg-white rounded-3xl overflow-hidden border border-stone-200 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all flex flex-col group cursor-pointer"
            onClick={() => onSelectMemory(mem)}
          >
            <div className="relative h-52 bg-slate-100 overflow-hidden">
              <img
                src={mem.imagePlaceholderUrl}
                alt={mem.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&auto=format&fit=crop&q=80';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <h3 className="absolute bottom-3 left-4 right-4 text-xl font-black text-white drop-shadow-md">
                {mem.title}
              </h3>
            </div>

            <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                {mem.descriptionForKai}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectMemory(mem);
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>View Full Photo</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSpeakStory(`(tone: warm) Let me tell you about ${mem.title}. (pause) ${mem.descriptionForKai}`);
                  }}
                  className="flex items-center space-x-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-xl text-xs font-bold transition"
                  aria-label={`Listen to story: ${mem.title}`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Tell Story</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
