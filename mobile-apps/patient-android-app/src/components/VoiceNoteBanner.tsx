import React from 'react';
import { Volume2, X, Heart, Sparkles } from 'lucide-react';
import { VoiceNoteItem } from '../types';

interface VoiceNoteBannerProps {
  note: VoiceNoteItem | null;
  onPlay: (note: VoiceNoteItem) => void;
  onDismiss: () => void;
}

export const VoiceNoteBanner: React.FC<VoiceNoteBannerProps> = ({
  note,
  onPlay,
  onDismiss
}) => {
  if (!note) return null;

  return (
    <div className="fixed top-20 left-4 right-4 z-40 max-w-sm mx-auto animate-in slide-in-from-top duration-300">
      <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 p-0.5 rounded-3xl shadow-xl shadow-rose-500/20">
        <div className="bg-white/95 backdrop-blur-xl rounded-[22px] p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold">
                <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Voice Note from Family
                </div>
                <div className="text-sm font-bold text-slate-800">{note.senderName}</div>
              </div>
            </div>
            <button
              onClick={onDismiss}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-rose-50/70 border border-rose-100 rounded-xl p-2.5 text-xs text-slate-700 italic">
            "{note.message}"
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPlay(note)}
              className="flex-1 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-rose-500/25 transition-all"
            >
              <Volume2 className="w-4 h-4" /> Play Voice Note
            </button>
            <button
              onClick={onDismiss}
              className="px-3 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 rounded-xl"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
