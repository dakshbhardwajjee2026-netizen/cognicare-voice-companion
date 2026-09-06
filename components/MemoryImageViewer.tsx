import React from 'react';
import { X, Heart, Volume2 } from 'lucide-react';
import { Memory } from '../types';

interface MemoryImageViewerProps {
  memory: Memory | null;
  onClose: () => void;
  onSpeakDescription?: (text: string) => void;
}

export const MemoryImageViewer: React.FC<MemoryImageViewerProps> = ({
  memory,
  onClose,
  onSpeakDescription,
}) => {
  if (!memory) return null;

  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto relative border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 p-2 rounded-full text-slate-700 transition"
          aria-label="Close memory viewer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 text-rose-500 mb-2">
          <Heart className="w-5 h-5 fill-current" />
          <span className="text-xs font-bold uppercase tracking-wider">Cherished Memory</span>
        </div>

        <div className="overflow-hidden rounded-2xl mb-4 bg-slate-100 shadow-inner">
          <img
            src={memory.imagePlaceholderUrl}
            alt={memory.title}
            className="w-full h-64 object-cover hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
            onError={(e) => {
              // Fallback placeholder image if URL fails
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&auto=format&fit=crop&q=80';
            }}
          />
        </div>

        <h2 className="text-2xl font-black text-slate-800 tracking-tight">{memory.title}</h2>
        <p className="text-slate-600 mt-2 text-base leading-relaxed">{memory.descriptionForKai}</p>

        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
          {onSpeakDescription && (
            <button
              onClick={() => onSpeakDescription(`This memory is ${memory.title}. ${memory.descriptionForKai}`)}
              className="flex items-center space-x-1.5 text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-2 rounded-xl"
            >
              <Volume2 className="w-4 h-4" />
              <span>Read Story to Me</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="ml-auto bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-900"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
