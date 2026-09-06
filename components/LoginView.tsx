import React, { useState } from 'react';
import { Heart, UserPlus, LogIn, KeyRound } from 'lucide-react';
import { PatientData } from '../types';
import { LanguagePicker } from './LanguagePicker';
import { t } from '../services/i18n';

interface LoginViewProps {
  onLogin: (id: string, data: PatientData) => void;
  onProfileCreated?: (id: string) => void;
  getPatientData: (id: string) => Promise<PatientData | null>;
  createProfile: (name: string, email: string) => Promise<{ id: string; data: PatientData }>;
  currentLanguage?: string;
  onChangeLanguage?: (langId: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLogin,
  onProfileCreated,
  getPatientData,
  createProfile,
  currentLanguage = 'en',
  onChangeLanguage,
}) => {
  const [view, setView] = useState<'login' | 'create' | 'showId'>('login');
  const [patientIdInput, setPatientIdInput] = useState('CGN-DEMO1');
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [newlyCreatedId, setNewlyCreatedId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const id = patientIdInput.trim().toUpperCase();

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || !emailInput.trim()) {
      setError('Please fill in both name and email.');
      return;
    }
    setIsLoading(true);
    try {
      const { id, data } = await createProfile(nameInput.trim(), emailInput.trim());
      setIsLoading(false);
      setNewlyCreatedId(id);
      onProfileCreated?.(id);
      setView('showId');
    } catch (err) {
      setIsLoading(false);
      setError('Failed to create profile. Please try again.');
    }
  };

  const proceedToDashboard = async () => {
    setIsLoading(true);
    const data = await getPatientData(newlyCreatedId);
    setIsLoading(false);
    if (data) {
      onLogin(newlyCreatedId, data);
    }
  };

  return (
    <div id="page-login" className="min-h-screen flex items-center justify-center bg-stone-100 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 space-y-6 border border-stone-200">
        {/* Language Selector at Login */}
        {onChangeLanguage && (
          <div className="flex justify-end">
            <LanguagePicker
              currentLanguage={currentLanguage}
              onChangeLanguage={onChangeLanguage}
              variant="compact"
            />
          </div>
        )}

        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg text-white">
            <Heart className="w-7 h-7 fill-current" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">{t('appName', currentLanguage)}</h1>
          <p className="text-sm text-slate-500 font-medium">{t('appSubtitle', currentLanguage)}</p>
        </div>

        {view === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="patient-id-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t('patientAccessId', currentLanguage)}
              </label>
              <div className="relative">
                <KeyRound className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
                <input
                  id="patient-id-input"
                  type="text"
                  value={patientIdInput}
                  onChange={(e) => setPatientIdInput(e.target.value)}
                  placeholder="e.g. CGN-DEMO1"
                  className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase font-bold text-slate-800"
                  disabled={isLoading}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Default demo profile ready: CGN-DEMO1</p>
            </div>

            {error && <p className="text-xs text-red-600 font-medium text-center bg-red-50 p-2 rounded-lg">{error}</p>}

            <button
              type="submit"
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 shadow-md active:scale-95 transition disabled:opacity-50"
              disabled={isLoading}
            >
              <LogIn className="w-5 h-5" />
              <span>{isLoading ? t('connecting', currentLanguage) : t('signInTitle', currentLanguage)}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setView('create');
                setError('');
              }}
              className="w-full flex items-center justify-center space-x-2 text-slate-700 bg-slate-100 hover:bg-slate-200 py-3 rounded-xl font-semibold transition"
              disabled={isLoading}
            >
              <UserPlus className="w-4 h-4" />
              <span>{t('createProfile', currentLanguage)}</span>
            </button>
          </form>
        )}

        {view === 'create' && (
          <form onSubmit={handleCreate} className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800 text-center">New Patient Profile</h2>

            <div>
              <label htmlFor="create-name-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Patient Full Name
              </label>
              <input
                id="create-name-input"
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="e.g. David Miller"
                className="w-full px-4 py-3 bg-stone-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="create-email-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Caregiver Email
              </label>
              <input
                id="create-email-input"
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="e.g. sarah@example.com"
                className="w-full px-4 py-3 bg-stone-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                required
                disabled={isLoading}
              />
            </div>

            {error && <p className="text-xs text-red-600 font-medium text-center bg-red-50 p-2 rounded-lg">{error}</p>}

            <button
              type="submit"
              className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold hover:bg-emerald-700 shadow-md transition disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Profile...' : 'Save & Generate ID'}
            </button>

            <button
              type="button"
              onClick={() => {
                setView('login');
                setError('');
              }}
              className="w-full text-slate-600 hover:text-slate-800 py-2 text-sm font-semibold text-center"
            >
              Back to Login
            </button>
          </form>
        )}

        {view === 'showId' && (
          <div className="text-center space-y-4">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800">
              <h2 className="text-base font-bold">Profile Created Successfully!</h2>
              <p className="text-xs mt-1">Please save your Patient ID to sign in from any device.</p>
            </div>

            <div className="bg-stone-100 p-4 rounded-2xl border border-stone-300">
              <p className="text-xs text-slate-500 uppercase font-semibold">Your Patient ID</p>
              <p className="text-3xl font-black text-slate-900 tracking-widest font-mono mt-1">{newlyCreatedId}</p>
            </div>

            <button
              onClick={proceedToDashboard}
              className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 shadow-md transition"
              disabled={isLoading}
            >
              Continue to Caregiver Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
