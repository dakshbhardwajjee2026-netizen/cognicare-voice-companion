import React from 'react';
import {
  Image,
  Calendar,
  MapPin,
  Activity,
  Mic,
  PhoneCall,
  LogOut,
  Sparkles,
  Volume2,
  Shield,
  Brain,
  Globe,
} from 'lucide-react';
import { PatientData } from '../types';
import { LanguagePicker } from './LanguagePicker';
import { t } from '../services/i18n';

interface CaregiverDashboardProps {
  patientData: PatientData;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  currentLanguage?: string;
  onChangeLanguage?: (langId: string) => void;
}

export const CaregiverDashboardView: React.FC<CaregiverDashboardProps> = ({
  patientData,
  onNavigate,
  onLogout,
  currentLanguage = 'en',
  onChangeLanguage,
}) => {
  const patientName = patientData?.profile?.name || 'Patient';
  const unplayedCount = (patientData?.voiceNotes || []).filter((n) => !n.played).length;

  return (
    <div id="page-caregiver-dashboard" className="min-h-screen bg-stone-100 pb-16">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">{t('caregiverPortal', currentLanguage)}</h1>
          <p className="text-xs text-slate-500 font-medium">{t('monitoring', currentLanguage)} {patientName} (ID: {patientData.id})</p>
        </div>

        <div className="flex items-center space-x-3">
          {onChangeLanguage && (
            <LanguagePicker
              currentLanguage={currentLanguage}
              onChangeLanguage={onChangeLanguage}
              variant="header"
            />
          )}

          <button
            onClick={onLogout}
            className="flex items-center space-x-1 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('signOut', currentLanguage)}</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Status Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">{t('realTimePatientStatus', currentLanguage)}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100 text-center">
              <Shield className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
              <p className="text-xs text-slate-500 font-medium">{t('safeZone', currentLanguage)}</p>
              <p className="text-lg font-bold text-emerald-700">{t('atHome', currentLanguage)}</p>
            </div>

            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100 text-center">
              <Calendar className="w-6 h-6 text-sky-600 mx-auto mb-1" />
              <p className="text-xs text-slate-500 font-medium">{t('nextTask', currentLanguage)}</p>
              <p className="text-lg font-bold text-slate-800">
                {patientData.schedule[0] ? patientData.schedule[0].time : 'None'}
              </p>
            </div>

            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100 text-center">
              <Image className="w-6 h-6 text-blue-600 mx-auto mb-1" />
              <p className="text-xs text-slate-500 font-medium">{t('keyMemories', currentLanguage)}</p>
              <p className="text-lg font-bold text-blue-700">{patientData.memories?.length || 0}</p>
            </div>

            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100 text-center">
              <Volume2 className="w-6 h-6 text-amber-600 mx-auto mb-1" />
              <p className="text-xs text-slate-500 font-medium">{t('voiceNotes', currentLanguage)}</p>
              <p className="text-lg font-bold text-amber-700">
                {unplayedCount > 0 ? `${unplayedCount} ${t('unread', currentLanguage)}` : t('allHeard', currentLanguage)}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">{t('directPatientCareActions', currentLanguage)}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => onNavigate('send-voice-note')}
              className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl shadow-md hover:from-emerald-700 hover:to-teal-700 active:scale-95 transition"
            >
              <div className="flex items-center space-x-3 text-left">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm">{t('sendVoiceNote', currentLanguage)}</p>
                  <p className="text-[11px] text-emerald-100">{t('spokenMessage', currentLanguage)}</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => onNavigate('activities')}
              className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl shadow-md hover:from-purple-700 hover:to-indigo-700 active:scale-95 transition"
            >
              <div className="flex items-center space-x-3 text-left">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm">{t('cognitiveGamesTests', currentLanguage)}</p>
                  <p className="text-[11px] text-purple-100">{t('quizzesSpeechTest', currentLanguage)}</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => onNavigate('companion')}
              className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-sky-600 text-white rounded-2xl shadow-md hover:from-blue-700 hover:to-sky-700 active:scale-95 transition"
            >
              <div className="flex items-center space-x-3 text-left">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm">{t('launchKaiCompanion', currentLanguage)}</p>
                  <p className="text-[11px] text-blue-100">{t('patientView', currentLanguage)}</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          <button
            onClick={() => onNavigate('cultural-profile')}
            className="flex flex-col items-center justify-center p-5 bg-white rounded-3xl shadow-sm border border-stone-200 hover:shadow-md hover:border-purple-300 transition text-center group"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <Globe className="w-6 h-6" />
            </div>
            <span className="font-bold text-slate-800 text-sm">Cultural Profile</span>
            <span className="text-[11px] text-slate-400 mt-0.5">Customs & Honorifics</span>
          </button>

          <button
            onClick={() => onNavigate('activities')}
            className="flex flex-col items-center justify-center p-5 bg-white rounded-3xl shadow-sm border border-purple-200 hover:shadow-md hover:border-purple-400 transition text-center group bg-purple-50/50"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <Brain className="w-6 h-6" />
            </div>
            <span className="font-bold text-slate-800 text-sm">{t('gamesMenu', currentLanguage)}</span>
            <span className="text-[11px] text-purple-700 font-semibold mt-0.5">{t('quizzesTests', currentLanguage)}</span>
          </button>

          <button
            onClick={() => onNavigate('memory-bank')}
            className="flex flex-col items-center justify-center p-5 bg-white rounded-3xl shadow-sm border border-stone-200 hover:shadow-md hover:border-blue-300 transition text-center group"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <Image className="w-6 h-6" />
            </div>
            <span className="font-bold text-slate-800 text-sm">{t('memoryBank', currentLanguage)}</span>
            <span className="text-[11px] text-slate-400 mt-0.5">{t('photosStories', currentLanguage)}</span>
          </button>

          <button
            onClick={() => onNavigate('manage-schedule')}
            className="flex flex-col items-center justify-center p-5 bg-white rounded-3xl shadow-sm border border-stone-200 hover:shadow-md hover:border-sky-300 transition text-center group"
          >
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <Calendar className="w-6 h-6" />
            </div>
            <span className="font-bold text-slate-800 text-sm">{t('schedule', currentLanguage)}</span>
            <span className="text-[11px] text-slate-400 mt-0.5">{t('pillsRoutine', currentLanguage)}</span>
          </button>

          <button
            onClick={() => onNavigate('geofence')}
            className="flex flex-col items-center justify-center p-5 bg-white rounded-3xl shadow-sm border border-stone-200 hover:shadow-md hover:border-purple-300 transition text-center group"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <MapPin className="w-6 h-6" />
            </div>
            <span className="font-bold text-slate-800 text-sm">{t('safeZone', currentLanguage)}</span>
            <span className="text-[11px] text-slate-400 mt-0.5">{t('geofenceRadius', currentLanguage)}</span>
          </button>

          <button
            onClick={() => onNavigate('health-insights')}
            className="flex flex-col items-center justify-center p-5 bg-white rounded-3xl shadow-sm border border-stone-200 hover:shadow-md hover:border-rose-300 transition text-center group"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <Activity className="w-6 h-6" />
            </div>
            <span className="font-bold text-slate-800 text-sm">{t('healthInsights', currentLanguage)}</span>
            <span className="text-[11px] text-slate-400 mt-0.5">{t('scoresSpeed', currentLanguage)}</span>
          </button>
        </div>
      </main>
    </div>
  );
};
