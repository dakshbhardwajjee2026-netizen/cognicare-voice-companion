import React, { useState } from 'react';
import {
  User,
  Heart,
  Globe,
  Camera,
  Calendar,
  Sparkles,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Plus,
  Trash2,
  Image as ImageIcon,
  Users,
  Clock,
  MapPin,
  Coffee,
} from 'lucide-react';
import { PatientData, Memory, ScheduleEvent, FamilyMember, CulturalProfile } from '../types';
import { SUPPORTED_LANGUAGES, getLanguageOption, t } from '../services/i18n';
import { dataService } from '../services/dataService';

interface OnboardingWizardProps {
  onComplete: (patientId: string, patientData: PatientData) => void;
  onCancel: () => void;
  initialLanguage?: string;
}

const DEFAULT_PRESET_MEMORIES: Memory[] = [
  {
    title: 'Golden Wedding Anniversary',
    descriptionForKai: 'Celebrated 50 wonderful years of marriage surrounded by children and grandchildren in the flower garden.',
    imagePlaceholderUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80',
  },
  {
    title: 'Family Summer Picnic',
    descriptionForKai: 'A joyful sunny afternoon at the lakeside park with delicious homemade snacks and laughter.',
    imagePlaceholderUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&auto=format&fit=crop&q=80',
  },
  {
    title: 'Ancestral Home & Garden',
    descriptionForKai: 'The peaceful front porch where you loved sipping morning tea and watering the jasmine flowers.',
    imagePlaceholderUrl: 'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?w=800&auto=format&fit=crop&q=80',
  },
];

const DEFAULT_PRESET_FAMILY: FamilyMember[] = [
  {
    name: 'Sarah Miller',
    relationship: 'Daughter / Primary Caregiver',
    descriptionForKai: 'Your caring daughter who lives nearby and visits every afternoon at 2 PM for tea.',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Maria Miller',
    relationship: 'Granddaughter',
    descriptionForKai: 'Your bright granddaughter who loves singing with you and sharing her drawings.',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Michael Miller',
    relationship: 'Son',
    descriptionForKai: 'Your loving son who calls you every Sunday evening to check in.',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  },
];

const DEFAULT_PRESET_SCHEDULE: ScheduleEvent[] = [
  { time: '08:30', task: 'Morning Health Pills & Warm Water', instructions: 'Take blood pressure medication with breakfast' },
  { time: '09:00', task: 'Gentle Breakfast & Morning News', instructions: 'Oatmeal, fresh fruit, and warm toast' },
  { time: '13:00', task: 'Nutritious Lunch & Rest', instructions: 'Wholesome warm lunch followed by a calm afternoon nap' },
  { time: '16:00', task: 'Afternoon Tea / Masala Chai', instructions: 'Relax on the veranda with tea and memory music' },
  { time: '17:30', task: 'Gentle Garden Walk', instructions: 'Light 15-minute stroll along the safe walkway' },
  { time: '19:30', task: 'Evening Dinner & Family Call', instructions: 'Enjoy dinner and speak with Sarah' },
];

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  onComplete,
  onCancel,
  initialLanguage = 'en',
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createdPatient, setCreatedPatient] = useState<PatientData | null>(null);

  // Step 1: Patient Identity & Caregiver
  const [patientName, setPatientName] = useState('David Miller');
  const [patientAge, setPatientAge] = useState('76');
  const [caregiverName, setCaregiverName] = useState('Sarah Miller');
  const [caregiverEmail, setCaregiverEmail] = useState('sarah.caregiver@example.com');
  const [selectedLanguage, setSelectedLanguage] = useState(initialLanguage);
  const [homeAddress, setHomeAddress] = useState('45 Elmwood Park, Safe Suburb');

  // Step 2: Cultural Background & Identity
  const [ethnicPreset, setEthnicPreset] = useState('Indian / Western Indian');
  const [honorificTitle, setHonorificTitle] = useState('Kaka');
  const [comfortCustoms, setComfortCustoms] = useState(
    'Enjoys warm Masala Chai at 4 PM, morning quiet devotional prayers, and looking at family photographs.'
  );
  const [languageNotes, setLanguageNotes] = useState('Address with warm Indian honorifics like Kaka or Ji.');

  // Step 3: Memory Bank & Family
  const [step3Tab, setStep3Tab] = useState<'memories' | 'family'>('memories');
  const [memories, setMemories] = useState<Memory[]>(DEFAULT_PRESET_MEMORIES);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(DEFAULT_PRESET_FAMILY);
  const [newMemoryTitle, setNewMemoryTitle] = useState('');
  const [newMemoryDesc, setNewMemoryDesc] = useState('');
  const [newMemoryImg, setNewMemoryImg] = useState('');

  // Family Member form state
  const [newFamilyName, setNewFamilyName] = useState('');
  const [newFamilyRel, setNewFamilyRel] = useState('Daughter');
  const [newFamilyDesc, setNewFamilyDesc] = useState('');
  const [newFamilyPhoto, setNewFamilyPhoto] = useState('');

  // Step 4: Schedule Form State
  const [schedule, setSchedule] = useState<ScheduleEvent[]>(DEFAULT_PRESET_SCHEDULE);
  const [newTime, setNewTime] = useState('14:00');
  const [newTask, setNewTask] = useState('');

  const handleAddMemory = () => {
    if (!newMemoryTitle.trim()) return;
    const newMem: Memory = {
      title: newMemoryTitle.trim(),
      descriptionForKai: newMemoryDesc.trim() || 'A cherished family memory.',
      imagePlaceholderUrl:
        newMemoryImg.trim() || 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&auto=format&fit=crop&q=80',
    };
    setMemories([newMem, ...memories]);
    setNewMemoryTitle('');
    setNewMemoryDesc('');
    setNewMemoryImg('');
  };

  const handleRemoveMemory = (index: number) => {
    setMemories(memories.filter((_, i) => i !== index));
  };

  const handleAddFamilyMember = () => {
    if (!newFamilyName.trim()) return;
    const newMember: FamilyMember = {
      name: newFamilyName.trim(),
      relationship: newFamilyRel.trim(),
      descriptionForKai: newFamilyDesc.trim() || `${newFamilyRel} of ${patientName}`,
      photoUrl: newFamilyPhoto.trim() || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
    };
    setFamilyMembers([...familyMembers, newMember]);
    setNewFamilyName('');
    setNewFamilyRel('Daughter');
    setNewFamilyDesc('');
    setNewFamilyPhoto('');
  };

  const handleRemoveFamilyMember = (index: number) => {
    setFamilyMembers(familyMembers.filter((_, i) => i !== index));
  };

  const handleAddScheduleEvent = () => {
    if (!newTask.trim()) return;
    const newEvent: ScheduleEvent = {
      time: newTime,
      task: newTask.trim(),
    };
    const updated = [...schedule, newEvent].sort((a, b) => a.time.localeCompare(b.time));
    setSchedule(updated);
    setNewTask('');
  };

  const handleRemoveScheduleEvent = (index: number) => {
    setSchedule(schedule.filter((_, i) => i !== index));
  };

  const handleCompleteOnboarding = async () => {
    setIsSubmitting(true);
    try {
      const culturalProfile: CulturalProfile = {
        ethnicBackground: ethnicPreset,
        honorificTitle,
        comfortsAndCustoms: comfortCustoms,
        preferredLanguageNotes: languageNotes,
      };

      const customData: Partial<PatientData> = {
        memories,
        familyMembers,
        schedule,
        culturalProfile,
        settings: {
          homeCoordinates: { lat: 37.7749, lng: -122.4194 },
          safeZoneRadius: 250,
        },
      };

      const result = await dataService.createProfile(patientName.trim(), caregiverEmail.trim(), customData);
      setCreatedPatient(result.data);
      setCurrentStep(5);
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
      alert('Error creating patient profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-purple-50/40 to-stone-200 flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200/80 overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-purple-800 to-indigo-900 text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Sparkles className="w-6 h-6 text-purple-300 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">Patient Onboarding Wizard</h1>
              <p className="text-xs text-purple-200 mt-0.5">Setting up Kai Companion & Cloud Memory Bank</p>
            </div>
          </div>

          {/* Progress Pill */}
          {currentStep <= 4 && (
            <div className="flex items-center space-x-1.5 bg-white/15 px-3 py-1.5 rounded-full text-xs font-bold self-start sm:self-auto border border-white/20">
              <span>Step {currentStep} of 4</span>
            </div>
          )}
        </div>

        {/* Step Progress Bar */}
        {currentStep <= 4 && (
          <div className="w-full bg-stone-100 h-2 flex">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`flex-1 h-full transition-all duration-300 ${
                  currentStep >= step ? 'bg-purple-600' : 'bg-stone-200'
                }`}
              />
            ))}
          </div>
        )}

        {/* Main Step Body */}
        <div className="p-6 sm:p-8 flex-grow overflow-y-auto max-h-[65vh]">
          {/* STEP 1: Patient Identity & Language */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-stone-100 pb-3">
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-600" />
                  <span>1. Patient & Caregiver Identity</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter the individual's name and their primary caregiver contact.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Patient Full Name *
                  </label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="e.g. David Miller or Ramesh Patel"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Patient Age
                  </label>
                  <input
                    type="number"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    placeholder="e.g. 76"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Primary Caregiver Name
                  </label>
                  <input
                    type="text"
                    value={caregiverName}
                    onChange={(e) => setCaregiverName(e.target.value)}
                    placeholder="e.g. Sarah Miller (Daughter)"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Caregiver Email (Cloud Backup) *
                  </label>
                  <input
                    type="email"
                    value={caregiverEmail}
                    onChange={(e) => setCaregiverEmail(e.target.value)}
                    placeholder="e.g. sarah.caregiver@example.com"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Primary Preferred Language (25+ Supported)
                </label>
                <div className="relative">
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <option key={lang.id} value={lang.id}>
                        {lang.native} ({lang.name}) • {lang.region}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Home Safe-Zone Address
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={homeAddress}
                    onChange={(e) => setHomeAddress(e.target.value)}
                    placeholder="e.g. 45 Elmwood Park, Peaceful Suburb"
                    className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Cultural Background & Identity */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-stone-100 pb-3">
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-purple-600" />
                  <span>2. Cultural Identity & Respectful Honorific</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure cultural traditions and how Kai should address the patient with respect.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Ethnic / Cultural Tradition
                  </label>
                  <select
                    value={ethnicPreset}
                    onChange={(e) => {
                      setEthnicPreset(e.target.value);
                      if (e.target.value.includes('Gujarati')) setHonorificTitle('Kaka');
                      else if (e.target.value.includes('Hindi')) setHonorificTitle('Ji');
                      else if (e.target.value.includes('Bengali')) setHonorificTitle('Kaku');
                      else if (e.target.value.includes('South')) setHonorificTitle('Uncle');
                      else setHonorificTitle('Grandpa');
                    }}
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    <option value="Gujarati / Western Indian">Gujarati / Western Indian</option>
                    <option value="Hindi / North Indian">Hindi / North Indian</option>
                    <option value="Marathi / Maharashtra">Marathi / Maharashtra</option>
                    <option value="Bengali / Eastern Indian">Bengali / Eastern Indian</option>
                    <option value="Assamese / North-East Indian">Assamese / North-East Indian</option>
                    <option value="Tamil / South Indian">Tamil / South Indian</option>
                    <option value="Telugu / South Indian">Telugu / South Indian</option>
                    <option value="Western / International">Western / International</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Respectful Honorific Title *
                  </label>
                  <input
                    type="text"
                    value={honorificTitle}
                    onChange={(e) => setHonorificTitle(e.target.value)}
                    placeholder="e.g. Kaka, Ji, Uncle, Grandma, Didi"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Kai will address them as: <span className="font-bold text-purple-700">"{patientName} {honorificTitle}"</span>
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Coffee className="w-4 h-4 text-amber-600" />
                  <span>Daily Comfort Foods, Chai Customs & Habits</span>
                </label>
                <textarea
                  rows={2}
                  value={comfortCustoms}
                  onChange={(e) => setComfortCustoms(e.target.value)}
                  placeholder="e.g. Loves hot Masala Chai at 4 PM, evening devotional chants, sitting on the front porch."
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Caregiver Tone & Language Notes for Kai
                </label>
                <input
                  type="text"
                  value={languageNotes}
                  onChange={(e) => setLanguageNotes(e.target.value)}
                  placeholder="e.g. Speak gently in Hindi/English with deep patience and reassurance."
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Memory Bank & Family */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-stone-100 pb-3">
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  <span>3. Memory Bank & Family Circle</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure cherished memory photos and close family members so Kai has full personal context.
                </p>
              </div>

              {/* Subtabs for Memories vs Family */}
              <div className="flex bg-stone-100 p-1 rounded-2xl gap-1">
                <button
                  type="button"
                  onClick={() => setStep3Tab('memories')}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition flex items-center justify-center space-x-1.5 ${
                    step3Tab === 'memories'
                      ? 'bg-white text-purple-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Memory Photos ({memories.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep3Tab('family')}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition flex items-center justify-center space-x-1.5 ${
                    step3Tab === 'family'
                      ? 'bg-white text-purple-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Family Circle ({familyMembers.length})</span>
                </button>
              </div>

              {/* SUBTAB 1: MEMORY PHOTOS */}
              {step3Tab === 'memories' && (
                <div className="space-y-4 animate-fade-in">
                  {/* Add New Memory Box */}
                  <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4 space-y-3">
                    <h3 className="text-xs font-black uppercase text-purple-900 flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-purple-700" />
                      <span>Add New Memory Photo</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        value={newMemoryTitle}
                        onChange={(e) => setNewMemoryTitle(e.target.value)}
                        placeholder="Memory Title (e.g. Golden Anniversary)"
                        className="px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                      <input
                        type="text"
                        value={newMemoryImg}
                        onChange={(e) => setNewMemoryImg(e.target.value)}
                        placeholder="Photo URL (or leave blank for preset)"
                        className="px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>
                    <input
                      type="text"
                      value={newMemoryDesc}
                      onChange={(e) => setNewMemoryDesc(e.target.value)}
                      placeholder="Description for Kai (e.g. 50th wedding celebration in the flower garden)"
                      className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                    <button
                      type="button"
                      onClick={handleAddMemory}
                      disabled={!newMemoryTitle.trim()}
                      className="px-4 py-2 bg-purple-700 text-white rounded-xl text-xs font-black hover:bg-purple-800 disabled:opacity-50 transition shadow-sm"
                    >
                      Add to Memory Bank
                    </button>
                  </div>

                  {/* Memory Cards Grid */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {memories.map((mem, idx) => (
                        <div
                          key={idx}
                          className="bg-stone-50 border border-stone-200 rounded-2xl p-2.5 flex flex-col justify-between relative group"
                        >
                          <img
                            src={mem.imagePlaceholderUrl}
                            alt={mem.title}
                            className="w-full h-24 object-cover rounded-xl mb-2"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&auto=format&fit=crop&q=80';
                            }}
                          />
                          <div>
                            <p className="font-bold text-xs text-slate-900 line-clamp-1">{mem.title}</p>
                            <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{mem.descriptionForKai}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveMemory(idx)}
                            className="mt-2 text-[10px] text-rose-600 font-bold flex items-center justify-end hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SUBTAB 2: FAMILY MEMBERS */}
              {step3Tab === 'family' && (
                <div className="space-y-4 animate-fade-in">
                  {/* Add New Family Member Box */}
                  <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 space-y-3">
                    <h3 className="text-xs font-black uppercase text-indigo-900 flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-indigo-700" />
                      <span>Add Family Member or Caregiver</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        value={newFamilyName}
                        onChange={(e) => setNewFamilyName(e.target.value)}
                        placeholder="Full Name (e.g. Sarah Miller or Aarav)"
                        className="px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                      <select
                        value={newFamilyRel}
                        onChange={(e) => setNewFamilyRel(e.target.value)}
                        className="px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      >
                        <option value="Daughter">Daughter</option>
                        <option value="Son">Son</option>
                        <option value="Wife / Spouse">Wife / Spouse</option>
                        <option value="Husband / Spouse">Husband / Spouse</option>
                        <option value="Granddaughter">Granddaughter</option>
                        <option value="Grandson">Grandson</option>
                        <option value="Sister">Sister</option>
                        <option value="Brother">Brother</option>
                        <option value="Primary Caregiver">Primary Caregiver</option>
                        <option value="Doctor / Nurse">Doctor / Nurse</option>
                        <option value="Neighbor / Friend">Neighbor / Friend</option>
                        <option value="Family Dog / Pet">Family Dog / Pet</option>
                      </select>
                    </div>

                    <input
                      type="text"
                      value={newFamilyDesc}
                      onChange={(e) => setNewFamilyDesc(e.target.value)}
                      placeholder="Context for Kai (e.g. Visits every afternoon at 2 PM with tea, loves singing together)"
                      className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />

                    <div className="flex gap-2.5">
                      <input
                        type="text"
                        value={newFamilyPhoto}
                        onChange={(e) => setNewFamilyPhoto(e.target.value)}
                        placeholder="Photo URL (optional)"
                        className="flex-grow px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                      <button
                        type="button"
                        onClick={handleAddFamilyMember}
                        disabled={!newFamilyName.trim()}
                        className="px-4 py-2 bg-indigo-700 text-white rounded-xl text-xs font-black hover:bg-indigo-800 disabled:opacity-50 transition shadow-sm"
                      >
                        Add Member
                      </button>
                    </div>
                  </div>

                  {/* Family Members List Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                    {familyMembers.map((member, idx) => (
                      <div
                        key={idx}
                        className="bg-stone-50 border border-stone-200 rounded-2xl p-3 flex items-start space-x-3 relative group"
                      >
                        <img
                          src={member.photoUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80'}
                          alt={member.name}
                          className="w-12 h-12 rounded-xl object-cover flex-shrink-0 bg-stone-200"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80';
                          }}
                        />
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-xs text-slate-900 truncate">{member.name}</p>
                            <span className="text-[10px] font-black bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md">
                              {member.relationship}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{member.descriptionForKai}</p>
                          <button
                            type="button"
                            onClick={() => handleRemoveFamilyMember(idx)}
                            className="mt-1.5 text-[10px] text-rose-600 font-bold hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Daily Routine & Medications */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-stone-100 pb-3">
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <span>4. Daily Routine & Medication Schedule</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set up regular times for medication, meals, afternoon tea, and caregiver check-ins.
                </p>
              </div>

              {/* Add Schedule Event Box */}
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 space-y-3">
                <h3 className="text-xs font-black uppercase text-indigo-900 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-indigo-700" />
                  <span>Add Routine Event</span>
                </h3>
                <div className="flex gap-2.5">
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-28 px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                  <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="Task name (e.g. Afternoon Blood Pressure Pill & Chai)"
                    className="flex-grow px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddScheduleEvent}
                  disabled={!newTask.trim()}
                  className="px-4 py-2 bg-indigo-700 text-white rounded-xl text-xs font-black hover:bg-indigo-800 disabled:opacity-50 transition shadow-sm"
                >
                  Add Schedule Event
                </button>
              </div>

              {/* Schedule List */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Configured Routine Events ({schedule.length})
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {schedule.map((evt, idx) => (
                    <div
                      key={idx}
                      className="bg-stone-50 border border-stone-200 rounded-xl p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="px-2 py-1 bg-purple-100 text-purple-900 font-mono font-black text-xs rounded-lg">
                          {evt.time}
                        </span>
                        <div>
                          <p className="font-bold text-xs text-slate-900">{evt.task}</p>
                          {evt.instructions && <p className="text-[11px] text-slate-500">{evt.instructions}</p>}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveScheduleEvent(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Completion & Generated Patient ID */}
          {currentStep === 5 && createdPatient && (
            <div className="text-center py-6 space-y-5 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner border border-emerald-200">
                <CheckCircle className="w-10 h-10" />
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-900">Profile Created & Saved to Cloud DB!</h2>
                <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
                  {createdPatient.profile.name} is now registered. You can use this Patient Access ID to log in on any device.
                </p>
              </div>

              {/* Access ID Card */}
              <div className="bg-gradient-to-br from-purple-900 to-indigo-900 text-white rounded-3xl p-6 max-w-md mx-auto shadow-xl border border-purple-400/30 text-left space-y-3">
                <div className="flex justify-between items-center border-b border-purple-500/30 pb-2">
                  <span className="text-xs uppercase font-black text-purple-200 tracking-wider">Patient Access ID</span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold rounded-md">
                    Cloud Synced
                  </span>
                </div>

                <div className="text-center py-2">
                  <p className="text-4xl font-mono font-black tracking-widest text-white drop-shadow">
                    {createdPatient.id}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-purple-200 pt-2 border-t border-purple-500/30">
                  <div>
                    <span className="text-[10px] text-purple-300 block">Patient Name</span>
                    <span className="font-bold text-white">{createdPatient.profile.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-purple-300 block">Honorific</span>
                    <span className="font-bold text-white">{createdPatient.culturalProfile?.honorificTitle || 'Ji'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-purple-300 block">Memories</span>
                    <span className="font-bold text-white">{createdPatient.memories.length} Photos</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-purple-300 block">Daily Schedule</span>
                    <span className="font-bold text-white">{createdPatient.schedule.length} Events</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onComplete(createdPatient.id, createdPatient)}
                className="w-full max-w-md py-4 bg-purple-700 hover:bg-purple-800 text-white font-black text-base rounded-2xl shadow-xl hover:shadow-2xl transition transform active:scale-98 flex items-center justify-center space-x-2 mx-auto"
              >
                <span>Launch Kai Voice Companion</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        {currentStep <= 4 && (
          <div className="bg-stone-50 border-t border-stone-200 p-4 sm:p-6 flex justify-between items-center">
            {currentStep === 1 ? (
              <button
                type="button"
                onClick={onCancel}
                className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="px-5 py-2.5 bg-white border border-stone-300 text-slate-800 rounded-xl text-xs font-bold flex items-center space-x-1.5 hover:bg-stone-100 transition shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev + 1)}
                disabled={!patientName.trim()}
                className="px-6 py-2.5 bg-purple-700 text-white rounded-xl text-xs font-black flex items-center space-x-1.5 hover:bg-purple-800 disabled:opacity-50 transition shadow-md"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCompleteOnboarding}
                disabled={isSubmitting}
                className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center space-x-1.5 disabled:opacity-50 transition shadow-md"
              >
                {isSubmitting ? (
                  <span>Saving to Cloud Database...</span>
                ) : (
                  <>
                    <span>Finish & Save Profile</span>
                    <CheckCircle className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
