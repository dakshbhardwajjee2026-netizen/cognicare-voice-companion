import React from 'react';
import { AlertTriangle, Clock, Mic, X, Volume2 } from 'lucide-react';
import { AlertPayload } from '../types';

interface AlertBannerProps {
  alert: AlertPayload | null;
  onClose: () => void;
  onPlaySpeech?: () => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  alert,
  onClose,
  onPlaySpeech,
}) => {
  if (!alert) return null;

  const getStyle = () => {
    switch (alert.type) {
      case 'location':
        return {
          bg: 'bg-red-50 border-red-200 text-red-900',
          icon: <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />,
        };
      case 'schedule':
        return {
          bg: 'bg-sky-50 border-sky-200 text-sky-900',
          icon: <Clock className="w-6 h-6 text-sky-600 flex-shrink-0" />,
        };
      case 'voiceNote':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
          icon: <Mic className="w-6 h-6 text-emerald-600 flex-shrink-0" />,
        };
      default:
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-900',
          icon: <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />,
        };
    }
  };

  const { bg, icon } = getStyle();

  return (
    <div className="flex-shrink-0 w-full px-4 pt-3 pb-1">
      <div
        className={`flex items-center justify-between p-3.5 rounded-2xl border shadow-md animate-fade-in ${bg}`}
      >
        <div className="flex items-center space-x-3 pr-2">
          {icon}
          <div>
            <p className="text-sm font-bold leading-tight">{alert.text}</p>
            {onPlaySpeech && (
              <button
                onClick={onPlaySpeech}
                className="mt-1 flex items-center text-xs font-semibold underline text-slate-700 hover:text-slate-900"
              >
                <Volume2 className="w-3.5 h-3.5 mr-1" />
                Listen to message
              </button>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-black/10 transition flex-shrink-0"
          aria-label="Dismiss alert"
        >
          <X className="w-5 h-5 text-slate-700" />
        </button>
      </div>
    </div>
  );
};
