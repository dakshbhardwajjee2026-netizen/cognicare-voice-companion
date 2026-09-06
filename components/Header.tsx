import React, { useState, useEffect } from 'react';
import { ShieldCheck, Heart, Radio } from 'lucide-react';
import { LanguagePicker } from './LanguagePicker';
import { t } from '../services/i18n';

interface HeaderProps {
  patientName?: string;
  isListening?: boolean;
  currentLanguage?: string;
  onChangeLanguage?: (langId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  patientName,
  isListening,
  currentLanguage = 'en',
  onChangeLanguage,
}) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = time.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const dateString = time.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="flex-shrink-0 pt-6 pb-3 px-6 bg-gradient-to-b from-[#F0ECE1] to-[#F8F5F0] border-b border-stone-200/80">
      <div className="flex justify-between items-center mb-1.5">
        <div className="flex items-center space-x-1.5 bg-emerald-100/90 text-emerald-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>{t('safeAtHome', currentLanguage)}</span>
        </div>

        {/* Top Permanent Language Selector Dropdown */}
        {onChangeLanguage && (
          <LanguagePicker
            currentLanguage={currentLanguage}
            onChangeLanguage={onChangeLanguage}
            variant="header"
          />
        )}
      </div>

      <div className="text-center my-1">
        <p className="text-5xl font-black tracking-tight text-slate-900 drop-shadow-sm font-mono">
          {timeString}
        </p>
        <p className="text-sm font-semibold text-slate-600 mt-0.5">
          {dateString} • {patientName ? `${t('appName', currentLanguage)} - ${patientName}` : t('appName', currentLanguage)}
        </p>
      </div>
    </header>
  );
};
