import React, { useRef, useEffect } from 'react';
import { Volume2, Sparkles, Pause } from 'lucide-react';
import { ChatMessage } from '../types';
import { parseResponse } from '../utils/parser';

interface ConversationHistoryProps {
  history: ChatMessage[];
  onReplayAudio: (text: string) => void;
}

export const ConversationHistory: React.FC<ConversationHistoryProps> = ({
  history,
  onReplayAudio,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [history]);

  const toneColorMap: Record<string, string> = {
    warm: 'bg-amber-100 text-amber-800 border-amber-300',
    gentle: 'bg-sky-100 text-sky-800 border-sky-300',
    reassuring: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    default: 'bg-slate-100 text-slate-800 border-slate-300',
  };

  const renderTurnContent = (text: string) => {
    const parts = parseResponse(text);
    return (
      <>
        {parts.map((part, index) => {
          if (part.type === 'tone') {
            const colorClass = toneColorMap[part.content] || toneColorMap.default;
            return (
              <span
                key={index}
                className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full mr-1.5 border capitalize ${colorClass}`}
              >
                <Sparkles className="w-3 h-3 mr-1" />
                {part.content}
              </span>
            );
          }
          if (part.type === 'pause') {
            return (
              <span
                key={index}
                className="inline-flex items-center mx-1 text-slate-400"
                title="Pause"
              >
                <Pause className="w-3.5 h-3.5 inline" />
              </span>
            );
          }
          if (part.type === 'long_pause') {
            return (
              <span
                key={index}
                className="inline-flex items-center mx-1 text-slate-500 font-bold"
                title="Long Pause"
              >
                <Pause className="w-3.5 h-3.5 inline" />
                <Pause className="w-3.5 h-3.5 inline -ml-1.5" />
              </span>
            );
          }
          return <span key={index}>{part.content} </span>;
        })}
      </>
    );
  };

  return (
    <div
      ref={scrollRef}
      id="conversation-history-container"
      className="flex-grow p-4 space-y-4 overflow-y-auto"
    >
      {history.map((turn) => {
        const isUser = turn.speaker === 'user';
        return (
          <div
            key={turn.id}
            className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center space-x-1.5 mb-1 px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                {isUser ? 'You' : 'Kai Companion'}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                {new Date(turn.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            <div className="relative group max-w-[88%]">
              <div
                className={`rounded-2xl px-4 py-3 text-base leading-relaxed shadow-sm ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white text-slate-800 rounded-tl-none border border-slate-200'
                }`}
              >
                {renderTurnContent(turn.text)}
              </div>

              {!isUser && (
                <button
                  onClick={() => onReplayAudio(turn.text)}
                  className="mt-1 flex items-center text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md transition"
                  title="Replay spoken response"
                  aria-label="Replay spoken audio"
                >
                  <Volume2 className="w-3.5 h-3.5 mr-1" />
                  Listen again
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
