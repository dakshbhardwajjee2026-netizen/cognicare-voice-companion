import React, { useState, useEffect } from 'react';
import { Heart, UserPlus, LogIn, KeyRound, Sparkles, UserCheck, ArrowRight } from 'lucide-react';
import { PatientData } from '../types';
import { LanguagePicker } from './LanguagePicker';
import { t } from '../services/i18n';
import { dataService } from '../services/dataService';

interface LoginViewProps {
  onLogin: (id: string, data: PatientData) => void;
  onProfileCreated?: (id: string) => void;
  onOpenOnboarding?: () => void;
  getPatientData: (id: string) => Promise<PatientData | null>;
  createProfile: (name: string, email: string) => Promise<{ id: string; data: PatientData }>;
  currentLanguage?: string;
  onChangeLanguage?: (langId: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLogin,
  onOpenOnboarding,
  getPatientData,
  createProfile,
  currentLanguage = 'en',
  onChangeLanguage,
}) => {
  const [patientIdInput, setPatientIdInput] = useState('CGN-DEMO1');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [registeredPatients, setRegisteredPatients] = useState<PatientData[]>([]);

  useEffect(() => {
    dataService.getAllPatients().then((list) => {
      if (list && list.length > 0) {
        setRegisteredPatients(list);
      }
    });
  }, []);

  const handleLogin = async (e?: React.FormEvent, overrideId?: string) => {
    if (e) e.preventDefault();
    setError('');
    setIsLoading(true);
    const id = (overrideId || patientIdInput).trim().toUpperCase();

    try {
      let data = await getPatientData(id);

      // If demo ID or not found on first time, auto-create demo profile
      if (!data && (id === 'CGN-DEMO1' || id === 'DEMO')) {
        const created = await createProfile('David Miller', 'caregiver@example.com');
        data = created.data;
      }

      setIsLoading(false);
      if (data) {
        onLogin(data.id, data);
      } else {
        setError('Patient ID not found. Please verify the ID or create a new profile.');
      }
    } catch (err) {
      setIsLoading(false);
      setError('An error occurred while loading profile.');
    }
  };

  return (
    <div id="page-login" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-100 via-purple-50/30 to-stone-200 p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 border border-stone-200/90">
        {/* Language Selector at Login */}
        {onChangeLanguage && (
          <div className="flex justify-between items-center border-b border-stone-100 pb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Language</span>
            <LanguagePicker
              currentLanguage={currentLanguage}
              onChangeLanguage={onChangeLanguage}
              variant="compact"
            />
          </div>
        )}

        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-gradient-to-tr from-purple-700 to-indigo-800 rounded-3xl mx-auto flex items-center justify-center shadow-lg text-white">
            <Heart className="w-8 h-8 fill-current" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{t('appName', currentLanguage)}</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">{t('appSubtitle', currentLanguage)}</p>
        </div>

        {/* Multi-User Quick Switcher (Registered Accounts in Cloud DB) */}
        {registeredPatients.length > 0 && (
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
              Select Registered Patient (Multi-User Cloud DB)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
              {registeredPatients.map((pat) => (
                <button
                  key={pat.id}
                  type="button"
                  onClick={() => handleLogin(undefined, pat.id)}
                  disabled={isLoading}
                  className="p-3 rounded-2xl border border-purple-100 bg-purple-50/50 hover:bg-purple-100/70 text-left transition flex items-center justify-between group shadow-sm active:scale-98"
                >
                  <div className="truncate">
                    <p className="font-black text-xs text-slate-900 truncate flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                      <span>{pat.profile?.name || 'Friend'}</span>
                    </p>
                    <span className="font-mono text-[10px] font-bold text-purple-700 bg-purple-200/60 px-1.5 py-0.5 rounded">
                      {pat.id}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-purple-400 group-hover:text-purple-700 group-hover:translate-x-0.5 transition" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sign In via Access ID */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="patient-id-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Or Sign In with Patient Access ID
            </label>
            <div className="relative">
              <KeyRound className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                id="patient-id-input"
                type="text"
                value={patientIdInput}
                onChange={(e) => setPatientIdInput(e.target.value)}
                placeholder="e.g. CGN-DEMO1 or CGN-4892"
                className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-600 font-mono uppercase font-bold text-slate-900"
                disabled={isLoading}
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-600 font-bold text-center bg-red-50 p-2.5 rounded-xl border border-red-200">{error}</p>}

          <button
            type="submit"
            className="w-full flex items-center justify-center space-x-2 bg-purple-700 text-white py-3.5 rounded-2xl font-black hover:bg-purple-800 shadow-lg active:scale-98 transition disabled:opacity-50"
            disabled={isLoading}
          >
            <LogIn className="w-5 h-5" />
            <span>{isLoading ? t('connecting', currentLanguage) : t('signInTitle', currentLanguage)}</span>
          </button>

          {/* Prominent Onboarding Wizard Launch Button */}
          <button
            type="button"
            onClick={onOpenOnboarding}
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-700 text-white hover:from-emerald-700 hover:to-teal-800 py-3.5 rounded-2xl font-black shadow-md active:scale-98 transition"
            disabled={isLoading}
          >
            <Sparkles className="w-4 h-4 text-emerald-200 animate-pulse" />
            <span>Start First-Time Patient Onboarding Wizard</span>
          </button>
        </form>
      </div>
    </div>
  );
};
