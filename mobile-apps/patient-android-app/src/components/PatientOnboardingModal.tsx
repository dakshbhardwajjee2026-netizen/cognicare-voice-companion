import React, { useState } from 'react';
import { User, Globe, Image as ImageIcon, Calendar, Server, CheckCircle2, ChevronRight, ChevronLeft, Plus, Trash2, HeartHandshake } from 'lucide-react';
import { CulturalProfile, MemoryItem, ScheduleEventItem } from '../types';
import { getServerUrl, setServerUrl } from '../config';

interface PatientOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProfile: CulturalProfile;
  initialMemories: MemoryItem[];
  initialSchedule: ScheduleEventItem[];
  onComplete: (data: {
    profile: CulturalProfile;
    memories: MemoryItem[];
    schedule: ScheduleEventItem[];
    serverUrl: string;
  }) => void;
}

const PRESET_PHOTOS = [
  {
    title: 'Daughter Sarah Graduation',
    url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&auto=format&fit=crop&q=80',
    category: 'Family' as const,
    desc: 'Sarah graduating with honors in 2012. You were extremely proud of her.'
  },
  {
    title: 'Autumn Garden Vacation',
    url: 'https://images.unsplash.com/photo-1588613254378-011e0c25a1cb?w=600&auto=format&fit=crop&q=80',
    category: 'Travel' as const,
    desc: 'Lush green tea gardens walk on family holiday in autumn.'
  },
  {
    title: 'Courtyard & Mango Tree',
    url: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=600&auto=format&fit=crop&q=80',
    category: 'Family' as const,
    desc: 'The old family ancestral home courtyard where everyone gathered for evening tea.'
  },
  {
    title: 'Mathematics Teaching Days',
    url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&auto=format&fit=crop&q=80',
    category: 'Career' as const,
    desc: 'Beloved high school classroom where you taught algebra and geometry with joy.'
  }
];

export const PatientOnboardingModal: React.FC<PatientOnboardingModalProps> = ({
  isOpen,
  onClose,
  initialProfile,
  initialMemories,
  initialSchedule,
  onComplete
}) => {
  const [step, setStep] = useState(1);
  const [serverUrlState, setServerUrlState] = useState(getServerUrl());
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');

  // Step 1 & 2: Profile
  const [patientName, setPatientName] = useState(initialProfile.patientName || 'David Kaka');
  const [honorific, setHonorific] = useState(initialProfile.honorific || 'Kaka');
  const [age, setAge] = useState(initialProfile.age || 74);
  const [profession, setProfession] = useState(initialProfile.profession || 'Retired Mathematics Teacher');
  const [language, setLanguage] = useState(initialProfile.language || 'en');
  const [hobbiesInput, setHobbiesInput] = useState((initialProfile.hobbies || ['Gardening', 'Classical Music', 'Solving Puzzles']).join(', '));

  // Step 3: Memories
  const [memories, setMemories] = useState<MemoryItem[]>(
    initialMemories && initialMemories.length > 0 ? initialMemories : PRESET_PHOTOS.map((p, idx) => ({
      id: 'mem_' + (idx + 1),
      title: p.title,
      description: p.desc,
      imageUrl: p.url,
      date: 'Cherished Era',
      category: p.category
    }))
  );
  const [newMemTitle, setNewMemTitle] = useState('');
  const [newMemDesc, setNewMemDesc] = useState('');
  const [newMemUrl, setNewMemUrl] = useState('');

  // Step 4: Schedule
  const [schedule, setSchedule] = useState<ScheduleEventItem[]>(
    initialSchedule && initialSchedule.length > 0 ? initialSchedule : [
      { id: 'sch_1', title: 'Morning Blood Pressure Medication', time: '08:00 AM', category: 'medication', completed: true },
      { id: 'sch_2', title: 'Gentle Garden Walk & Fresh Air', time: '10:30 AM', category: 'activity', completed: false },
      { id: 'sch_3', title: 'Afternoon Hydration (Warm Lemon Water)', time: '02:00 PM', category: 'hydration', completed: false },
      { id: 'sch_4', title: 'Evening Brain Fitness Memory Match', time: '05:00 PM', category: 'activity', completed: false }
    ]
  );
  const [newSchTitle, setNewSchTitle] = useState('');
  const [newSchTime, setNewSchTime] = useState('09:00 AM');
  const [newSchCategory, setNewSchCategory] = useState<'medication' | 'hydration' | 'activity' | 'meal'>('medication');

  const [testError, setTestError] = useState<string>('');

  if (!isOpen) return null;

  const handleTestConnection = async (targetUrl?: string) => {
    setTestStatus('testing');
    setTestError('');
    const testTarget = (targetUrl || serverUrlState).trim().replace(/\/$/, '');
    
    // Use standard AbortController with 8s timeout compatible with all WebView versions
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(`${testTarget}/api/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setTestStatus('success');
        setTestError('');
      } else {
        setTestStatus('failed');
        setTestError(`Server returned HTTP ${res.status}`);
      }
    } catch (e: any) {
      clearTimeout(timeoutId);
      setTestStatus('failed');
      const msg = e?.name === 'AbortError' ? 'Connection timed out (8s)' : (e?.message || 'Network request failed');
      setTestError(msg);
    }
  };

  const handleAddMemory = () => {
    if (!newMemTitle.trim()) return;
    const newItem: MemoryItem = {
      id: 'mem_' + Date.now(),
      title: newMemTitle.trim(),
      description: newMemDesc.trim() || 'A cherished personal family memory.',
      imageUrl: newMemUrl.trim() || PRESET_PHOTOS[Math.floor(Math.random() * PRESET_PHOTOS.length)].url,
      date: 'Recent',
      category: 'Family'
    };
    setMemories([newItem, ...memories]);
    setNewMemTitle('');
    setNewMemDesc('');
    setNewMemUrl('');
  };

  const handleDeleteMemory = (id: string) => {
    setMemories(memories.filter(m => m.id !== id));
  };

  const handleAddSchedule = () => {
    if (!newSchTitle.trim()) return;
    const item: ScheduleEventItem = {
      id: 'sch_' + Date.now(),
      title: newSchTitle.trim(),
      time: newSchTime,
      category: newSchCategory,
      completed: false
    };
    setSchedule([...schedule, item]);
    setNewSchTitle('');
  };

  const handleDeleteSchedule = (id: string) => {
    setSchedule(schedule.filter(s => s.id !== id));
  };

  const handleFinish = () => {
    setServerUrl(serverUrlState);
    const updatedProfile: CulturalProfile = {
      patientName,
      honorific,
      age: Number(age) || 74,
      profession,
      language,
      hobbies: hobbiesInput.split(',').map(s => s.trim()).filter(Boolean),
      keyMemories: memories.map(m => m.title)
    };

    onComplete({
      profile: updatedProfile,
      memories,
      schedule,
      serverUrl: serverUrlState
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 text-white flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold tracking-wider uppercase text-blue-200">Personalized Setup</div>
            <h2 className="text-xl font-bold">Patient Onboarding & Context</h2>
          </div>
          <div className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full">
            Step {step} of 5
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 h-1.5 flex">
          <div
            className="bg-blue-600 h-full transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-base">
                <User className="w-5 h-5" />
                <span>Patient Identity & Respectful Honorific</span>
              </div>
              <p className="text-xs text-slate-500">
                Kai will address the patient warmly and respectfully using these custom preferences.
              </p>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Patient Name</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 text-sm font-medium"
                  placeholder="e.g. David, Ramesh, John"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Honorific / Title</label>
                  <select
                    value={honorific}
                    onChange={(e) => setHonorific(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 text-sm font-medium"
                  >
                    <option value="Kaka">Kaka (Elder Uncle)</option>
                    <option value="Uncle">Uncle</option>
                    <option value="Aunty">Aunty</option>
                    <option value="Grandpa">Grandpa</option>
                    <option value="Dada">Dada / Dadaji</option>
                    <option value="Bapu">Bapu</option>
                    <option value="">None (First Name only)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Former Profession / Life Story</label>
                <input
                  type="text"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 text-sm font-medium"
                  placeholder="e.g. High School Mathematics Teacher, Banker, Artist"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Favorite Hobbies & Topics (Comma separated)</label>
                <input
                  type="text"
                  value={hobbiesInput}
                  onChange={(e) => setHobbiesInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 text-sm font-medium"
                  placeholder="Gardening, Classical Music, Solving Puzzles"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-base">
                <Globe className="w-5 h-5" />
                <span>Primary Language & Multilingual Intelligence</span>
              </div>
              <p className="text-xs text-slate-500">
                Kai speaks with natural native accents and dynamically switches languages midway if the patient changes.
              </p>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Primary Spoken Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800 text-sm font-medium"
                >
                  <option value="en">English (Warm & Clear)</option>
                  <option value="hi">Hindi (हिंदी - Respectful Aap/Namaste)</option>
                  <option value="gu">Gujarati (ગુજરાતી - Kem Chho / Kaka)</option>
                  <option value="mr">Marathi (मराठी - Namaskar / Kaka)</option>
                  <option value="bn">Bengali (বাংলা - Nomoshkar)</option>
                  <option value="ta">Tamil (தமிழ் - Vanakkam)</option>
                  <option value="te">Telugu (తెలుగు - Namaskaram)</option>
                </select>
              </div>

              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-xs space-y-2 text-indigo-900">
                <div className="font-bold flex items-center gap-1.5 text-indigo-800">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  <span>Dynamic Real-Time Language Switching</span>
                </div>
                <p>
                  Powered by Sarvam AI and Google Gemini semantic analysis. Even if English is selected, if {patientName} speaks in Hindi or Gujarati, Kai automatically comprehends and responds in that language seamlessly.
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-600 font-bold text-base">
                  <ImageIcon className="w-5 h-5" />
                  <span>Memory Bank Builder</span>
                </div>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {memories.length} Memories
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Photos and memories Kai uses when David Kaka asks: "Show me my daughter" or feels disoriented.
              </p>

              {/* Add New Memory */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
                <div className="text-xs font-bold text-slate-700">Add New Anchor Memory:</div>
                <input
                  type="text"
                  placeholder="Memory Title (e.g. Daughter Sarah Graduation)"
                  value={newMemTitle}
                  onChange={(e) => setNewMemTitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Emotional Anchor Story (e.g. Sarah graduating with honors in 2012)"
                  value={newMemDesc}
                  onChange={(e) => setNewMemDesc(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Image URL (optional)"
                    value={newMemUrl}
                    onChange={(e) => setNewMemUrl(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={handleAddMemory}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-1.5 rounded-lg flex items-center gap-1 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              </div>

              {/* Memory List */}
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {memories.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 p-2 bg-white border border-slate-200 rounded-xl shadow-xs">
                    <img src={m.imageUrl} alt={m.title} className="w-12 h-12 rounded-lg object-cover bg-slate-100" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-800 truncate">{m.title}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">{m.description}</div>
                    </div>
                    <button
                      onClick={() => handleDeleteMemory(m.id)}
                      className="text-slate-400 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-base">
                  <Calendar className="w-5 h-5" />
                  <span>Daily Routine & Medication Schedule</span>
                </div>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {schedule.length} Events
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Routines Kai helps David Kaka remember through voice prompts.
              </p>

              {/* Add New Schedule */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
                <div className="text-xs font-bold text-slate-700">Add Schedule Item:</div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Event Title (e.g. Heart Pill)"
                    value={newSchTitle}
                    onChange={(e) => setNewSchTitle(e.target.value)}
                    className="col-span-2 px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Time (e.g. 08:30 AM)"
                    value={newSchTime}
                    onChange={(e) => setNewSchTime(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                  <select
                    value={newSchCategory}
                    onChange={(e) => setNewSchCategory(e.target.value as any)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="medication">Medication</option>
                    <option value="hydration">Hydration</option>
                    <option value="activity">Activity</option>
                    <option value="meal">Meal</option>
                  </select>
                </div>
                <button
                  onClick={handleAddSchedule}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 rounded-lg flex items-center justify-center gap-1 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Schedule Item
                </button>
              </div>

              {/* Schedule List */}
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {schedule.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl shadow-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {s.time}
                      </span>
                      <span className="text-xs font-semibold text-slate-800">{s.title}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteSchedule(s.id)}
                      className="text-slate-400 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-base">
                <Server className="w-5 h-5" />
                <span>Backend Server & Mobile Sync</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Connect via Global Cloud (recommended: works everywhere over 4G/5G mobile data or Wi-Fi) or Local Home Wi-Fi.
              </p>

              {/* 1-Tap Quick Select Presets */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const cloudUrl = 'https://spirituality-lace-rooms-used.trycloudflare.com';
                    setServerUrlState(cloudUrl);
                    handleTestConnection(cloudUrl);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    serverUrlState.includes('trycloudflare.com')
                      ? 'border-blue-500 bg-blue-50/80 ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold text-xs text-blue-700 flex items-center gap-1">
                    🌐 Global Cloud
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 font-medium">4G / 5G & Any Wi-Fi</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const lanUrl = 'http://192.168.29.104:3001';
                    setServerUrlState(lanUrl);
                    handleTestConnection(lanUrl);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    serverUrlState.includes('192.168.29.104')
                      ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold text-xs text-emerald-700 flex items-center gap-1">
                    🏠 Local Wi-Fi
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 font-medium">Same Home Router</div>
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Shared Backend Server URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={serverUrlState}
                    onChange={(e) => {
                      setServerUrlState(e.target.value);
                      setTestStatus('idle');
                      setTestError('');
                    }}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="https://spirituality-lace-rooms-used.trycloudflare.com"
                  />
                  <button
                    onClick={() => handleTestConnection()}
                    disabled={testStatus === 'testing'}
                    className={`px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
                      testStatus === 'testing'
                        ? 'bg-slate-300 text-slate-600'
                        : testStatus === 'success'
                        ? 'bg-emerald-600 text-white'
                        : testStatus === 'failed'
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-800 text-white hover:bg-slate-700'
                    }`}
                  >
                    {testStatus === 'testing' ? 'Testing...' : testStatus === 'success' ? '✓ Connected' : testStatus === 'failed' ? '✗ Retry' : 'Test Ping'}
                  </button>
                </div>
                {testStatus === 'success' && (
                  <p className="text-xs text-emerald-600 mt-1.5 font-medium flex items-center gap-1">
                    ✓ Successfully verified connection to backend!
                  </p>
                )}
                {testStatus === 'failed' && (
                  <div className="mt-1.5 p-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
                    <p>Could not reach backend: {testError || 'Connection refused or timed out'}.</p>
                    <p className="text-[11px] text-rose-600 mt-0.5">Tip: Tap <strong>[🌐 Global Cloud]</strong> above to connect over cellular data/any Wi-Fi without firewall issues.</p>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-1.5 text-slate-600">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-blue-600" />
                  <span>Ready for Real-Time Mobile Testing:</span>
                </div>
                <p>• <strong>Patient Name:</strong> {patientName} ({honorific})</p>
                <p>• <strong>Primary Language:</strong> {language.toUpperCase()}</p>
                <p>• <strong>Memory Bank:</strong> {memories.length} photos ready for Kai</p>
                <p>• <strong>Daily Schedule:</strong> {schedule.length} routine items ready</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1 shadow-md shadow-blue-500/20 transition-all"
            >
              Next Step <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1 shadow-md shadow-emerald-500/20 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" /> Complete Setup & Sync
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
