import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Mic,
  Square,
  Play,
  Save,
  Shield,
  Heart,
  Calendar,
  Activity,
  Upload,
  CheckCircle2,
  Brain,
  Gauge,
  Sliders,
  Globe,
  Compass,
  Sparkles,
  MapPin,
  Navigation,
  Locate,
  RefreshCw,
  Home,
  AlertCircle,
  ExternalLink,
  Layers,
  Map as MapIcon,
  Crosshair,
} from 'lucide-react';
import { PatientData, Memory, ScheduleEvent, VoiceNote, PatientSettings, SpeechSettings, CulturalProfile } from '../types';
import { LanguagePicker } from './LanguagePicker';
import { t } from '../services/i18n';
import { LocationState, calculateDistanceMeters } from '../hooks/useGeolocation';
import { reverseGeocode, ReverseGeocodeResult } from '../services/locationService';

// Wrapper for caregiver pages
export const CaregiverPageView: React.FC<{
  title: string;
  subtitle?: string;
  onBack: () => void;
  currentLanguage?: string;
  onChangeLanguage?: (langId: string) => void;
  children: React.ReactNode;
}> = ({ title, subtitle, onBack, currentLanguage = 'en', onChangeLanguage, children }) => (
  <div className="min-h-screen bg-stone-100 pb-16">
    <header className="bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="p-2 rounded-xl hover:bg-stone-100 text-slate-700 transition"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">{title}</h1>
          {subtitle && <p className="text-xs text-slate-500 font-medium">{subtitle}</p>}
        </div>
      </div>

      {onChangeLanguage && (
        <LanguagePicker
          currentLanguage={currentLanguage}
          onChangeLanguage={onChangeLanguage}
          variant="header"
        />
      )}
    </header>
    <main className="max-w-3xl mx-auto p-6">{children}</main>
  </div>
);

// 1. Memory Bank Management
export const MemoryBankManager: React.FC<{
  patientData: PatientData;
  onAddMemory: (memory: Memory) => void;
  onBack: () => void;
  currentLanguage?: string;
  onChangeLanguage?: (langId: string) => void;
}> = ({ patientData, onAddMemory, onBack, currentLanguage = 'en', onChangeLanguage }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const samplePhotoPresets = [
    {
      title: 'Gardening in the Spring',
      url: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb22509?w=800&auto=format&fit=crop&q=80',
    },
    {
      title: 'Family Summer Cabin',
      url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop&q=80',
    },
    {
      title: 'Classic Vintage Car',
      url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop&q=80',
    },
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    onAddMemory({
      title: title.trim(),
      descriptionForKai: description.trim(),
      imagePlaceholderUrl:
        imageUrl.trim() ||
        'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&auto=format&fit=crop&q=80',
    });

    setTitle('');
    setDescription('');
    setImageUrl('');
    setShowAddForm(false);
  };

  return (
    <CaregiverPageView
      title={t('memoryBank', currentLanguage)}
      subtitle={t('photosStories', currentLanguage)}
      onBack={onBack}
      currentLanguage={currentLanguage}
      onChangeLanguage={onChangeLanguage}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-sm font-bold text-slate-700">
            Current Memories ({patientData.memories?.length || 0})
          </p>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddForm ? 'Cancel' : 'Add New Memory'}</span>
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 border border-blue-200 shadow-md space-y-4 animate-fade-in">
            <h3 className="text-base font-black text-slate-800">Add Cherished Memory</h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Memory Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Our Trip to the Grand Canyon"
                className="w-full px-4 py-2.5 bg-stone-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Story Description (for Kai's voice)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what happened, who was there, and special details Kai should gently remind David of..."
                rows={3}
                className="w-full px-4 py-2.5 bg-stone-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Photo URL
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                className="w-full px-4 py-2.5 bg-stone-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-[11px] text-slate-500 font-semibold">Or pick a sample photo:</span>
                {samplePhotoPresets.map((preset, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setImageUrl(preset.url)}
                    className="text-[11px] bg-stone-100 hover:bg-stone-200 text-slate-700 px-2 py-0.5 rounded-lg font-medium"
                  >
                    {preset.title}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 shadow-md transition"
            >
              Save Memory for Kai
            </button>
          </form>
        )}

        <div className="space-y-4">
          {(patientData.memories || []).map((mem, idx) => (
            <div key={idx} className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm flex items-center space-x-4">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0">
                <img
                  src={mem.imagePlaceholderUrl}
                  alt={mem.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&auto=format&fit=crop&q=80';
                  }}
                />
              </div>
              <div className="flex-grow">
                <h4 className="font-bold text-slate-900 text-base">{mem.title}</h4>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">{mem.descriptionForKai}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </CaregiverPageView>
  );
};

// 2. Schedule Manager
export const ScheduleManager: React.FC<{
  patientData: PatientData;
  onAddEvent: (event: ScheduleEvent) => void;
  onRemoveEvent: (index: number) => void;
  onBack: () => void;
  currentLanguage?: string;
  onChangeLanguage?: (langId: string) => void;
}> = ({ patientData, onAddEvent, onRemoveEvent, onBack, currentLanguage = 'en', onChangeLanguage }) => {
  const [time, setTime] = useState('10:00');
  const [task, setTask] = useState('');
  const [instructions, setInstructions] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    onAddEvent({
      time,
      task: task.trim(),
      instructions: instructions.trim() || undefined,
      message: `Good day, ${patientData.profile?.name || 'David'}. It is ${time}, time for ${task.trim()}.`,
    });

    setTask('');
    setInstructions('');
  };

  return (
    <CaregiverPageView
      title={t('schedule', currentLanguage)}
      subtitle={t('pillsRoutine', currentLanguage)}
      onBack={onBack}
      currentLanguage={currentLanguage}
      onChangeLanguage={onChangeLanguage}
    >
      <div className="space-y-6">
        <form onSubmit={handleAdd} className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4">
          <h3 className="text-base font-black text-slate-800">Add Reminder</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-2.5 bg-stone-50 border border-slate-300 rounded-xl text-sm font-mono font-bold"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Task / Medication</label>
              <input
                type="text"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="e.g. Afternoon Blood Pressure Pill"
                className="w-full px-4 py-2.5 bg-stone-50 border border-slate-300 rounded-xl text-sm text-slate-800"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Instructions</label>
            <input
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Take with a glass of water after lunch"
              className="w-full px-4 py-2.5 bg-stone-50 border border-slate-300 rounded-xl text-sm text-slate-800"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 shadow-md transition"
          >
            Add to Patient Schedule
          </button>
        </form>

        <div className="space-y-3">
          {(patientData.schedule || []).map((item, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="px-3 py-1 bg-sky-100 text-sky-800 text-xs font-bold rounded-full font-mono">
                  {item.time}
                </span>
                <div>
                  <p className="font-bold text-slate-900 text-sm">{item.task}</p>
                  {item.instructions && <p className="text-xs text-slate-500">{item.instructions}</p>}
                </div>
              </div>

              <button
                onClick={() => onRemoveEvent(idx)}
                className="p-2 text-slate-400 hover:text-rose-600 rounded-lg transition"
                title="Remove task"
                aria-label="Remove task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </CaregiverPageView>
  );
};

// 3. Record Voice Note for Patient
export const RecordVoiceNoteView: React.FC<{
  patientData: PatientData;
  onSaveVoiceNote: (note: VoiceNote) => void;
  onBack: () => void;
  currentLanguage?: string;
  onChangeLanguage?: (langId: string) => void;
}> = ({ patientData, onSaveVoiceNote, onBack, currentLanguage = 'en', onChangeLanguage }) => {
  const [sender, setSender] = useState('Sarah (Daughter)');
  const [messagePrompt, setMessagePrompt] = useState(
    'Hi Dad! Just wanted to send you lots of love today. Remember I am stopping by this afternoon at 2 PM for tea!'
  );
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          setRecordedAudioUrl(reader.result as string);
        };
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to access microphone for recording:', err);
      alert('Microphone access is required to record audio notes. Please allow microphone permission.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handlePlayPreview = () => {
    if (!recordedAudioUrl) return;
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
    }
    const audio = new Audio(recordedAudioUrl);
    audioPreviewRef.current = audio;
    setIsPlayingPreview(true);
    audio.play();
    audio.onended = () => setIsPlayingPreview(false);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messagePrompt.trim() && !recordedAudioUrl) return;

    const newNote: VoiceNote = {
      id: `vn-${Date.now()}`,
      audioData: recordedAudioUrl || '',
      message: messagePrompt.trim() || 'Voice recording message',
      timestamp: Date.now(),
      played: false,
      senderName: sender.trim() || 'Caregiver',
    };

    onSaveVoiceNote(newNote);
    setSavedSuccess(true);
    setTimeout(() => {
      onBack();
    }, 1500);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <CaregiverPageView
      title={t('sendVoiceNote', currentLanguage)}
      subtitle={`${t('spokenMessage', currentLanguage)} - ${patientData.profile?.name || 'David'}`}
      onBack={onBack}
      currentLanguage={currentLanguage}
      onChangeLanguage={onChangeLanguage}
    >
      <form onSubmit={handleSend} className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Sender Name & Relationship
          </label>
          <input
            type="text"
            value={sender}
            onChange={(e) => setSender(e.target.value)}
            className="w-full px-4 py-2.5 bg-stone-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-800"
            required
          />
        </div>

        {/* Audio Recording Section */}
        <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center">
              <Mic className="w-4 h-4 mr-1.5 text-emerald-600" />
              Record Spoken Voice Note
            </span>
            {isRecording && (
              <span className="text-xs font-mono font-bold text-rose-600 animate-pulse">
                🔴 Recording: {formatTime(recordingTime)}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!isRecording ? (
              <button
                type="button"
                onClick={startRecording}
                className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition cursor-pointer"
              >
                <Mic className="w-4 h-4" />
                <span>{recordedAudioUrl ? 'Re-record Audio' : 'Start Microphone Recording'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm animate-pulse transition cursor-pointer"
              >
                <Square className="w-4 h-4" />
                <span>Stop Recording ({formatTime(recordingTime)})</span>
              </button>
            )}

            {recordedAudioUrl && !isRecording && (
              <button
                type="button"
                onClick={handlePlayPreview}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{isPlayingPreview ? 'Playing Preview...' : 'Listen to Recording'}</span>
              </button>
            )}
          </div>

          {recordedAudioUrl && (
            <p className="text-xs text-emerald-700 font-bold flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" /> Audio recorded successfully! Ready to send to Kai.
            </p>
          )}
        </div>

        {/* Text Transcript Box */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Spoken Message Text / Transcript
          </label>
          <textarea
            value={messagePrompt}
            onChange={(e) => setMessagePrompt(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 bg-stone-50 border border-slate-300 rounded-xl text-sm text-slate-800 leading-relaxed"
            placeholder="Type your warm message or transcript..."
          />
        </div>

        {savedSuccess ? (
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 font-bold text-center flex items-center justify-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Voice note sent to Kai! Redirecting...</span>
          </div>
        ) : (
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-3.5 rounded-xl hover:from-emerald-700 hover:to-teal-700 shadow-md transition"
          >
            Send Message to Patient's Kai Companion
          </button>
        )}
      </form>
    </CaregiverPageView>
  );
};

// 4. Safe Zone Geofence
export const SafeZoneManager: React.FC<{
  patientData: PatientData;
  locationState?: LocationState;
  onUpdateSettings: (settings: PatientSettings) => void;
  onBack: () => void;
  currentLanguage?: string;
  onChangeLanguage?: (langId: string) => void;
}> = ({ patientData, locationState, onUpdateSettings, onBack, currentLanguage = 'en', onChangeLanguage }) => {
  const patientName = patientData.profile?.name || 'David';
  const defaultHome = patientData.settings?.homeCoordinates || locationState?.coords || { lat: 26.1445, lng: 91.7362 };
  
  const [radius, setRadius] = useState<number>(patientData.settings?.safeZoneRadius || 250);
  const [homeCoords, setHomeCoords] = useState<{ lat: number; lng: number }>(defaultHome);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>(locationState?.coords || defaultHome);
  const [locationDetails, setLocationDetails] = useState<ReverseGeocodeResult | null>(locationState?.locationDetails || null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [mapMode, setMapMode] = useState<'map' | 'radar'>('map');
  const [saved, setSaved] = useState<boolean>(false);
  const [showCoordInputs, setShowCoordInputs] = useState<boolean>(false);

  // Sync with locationState prop
  useEffect(() => {
    if (locationState?.coords) {
      setCurrentCoords(locationState.coords);
    }
    if (locationState?.locationDetails) {
      setLocationDetails(locationState.locationDetails);
    } else if (currentCoords) {
      reverseGeocode(currentCoords.lat, currentCoords.lng).then((res) => {
        if (res) setLocationDetails(res);
      });
    }
  }, [locationState?.coords, locationState?.locationDetails]);

  const distanceFromHome = calculateDistanceMeters(
    currentCoords.lat,
    currentCoords.lng,
    homeCoords.lat,
    homeCoords.lng
  );
  const isInsideSafeZone = distanceFromHome <= radius;

  const handleRefreshGPS = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCurrentCoords(coords);
        const details = await reverseGeocode(coords.lat, coords.lng);
        if (details) setLocationDetails(details);
        setIsLocating(false);
      },
      (err) => {
        console.warn('Location refresh notice:', err.message);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSetCurrentAsHome = () => {
    setHomeCoords({ ...currentCoords });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ...patientData.settings,
      homeCoordinates: homeCoords,
      safeZoneRadius: radius,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // Compute OpenStreetMap bounding box around home coordinates
  const degSpan = Math.max(0.003, (radius / 111320) * 3.2);
  const minLng = (homeCoords.lng - degSpan).toFixed(6);
  const maxLng = (homeCoords.lng + degSpan).toFixed(6);
  const minLat = (homeCoords.lat - degSpan * 0.7).toFixed(6);
  const maxLat = (homeCoords.lat + degSpan * 0.7).toFixed(6);
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik&marker=${homeCoords.lat}%2C${homeCoords.lng}`;

  return (
    <CaregiverPageView
      title={t('safeZone', currentLanguage)}
      subtitle={t('geofenceRadius', currentLanguage)}
      onBack={onBack}
      currentLanguage={currentLanguage}
      onChangeLanguage={onChangeLanguage}
    >
      <form onSubmit={handleSave} className="space-y-6">
        {/* Status Header Banner */}
        <div className="flex items-center justify-between bg-white rounded-3xl p-5 border border-stone-200 shadow-sm">
          <div className="flex items-center space-x-3.5">
            <div className={`p-3 rounded-2xl ${isInsideSafeZone ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-slate-800 text-base">Safe Zone Geofence</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  isInsideSafeZone ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800 animate-pulse'
                }`}>
                  {isInsideSafeZone ? '✓ SAFE INSIDE BOUNDARY' : '⚠️ BOUNDARY ALERT'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitoring live GPS coordinates of {patientName}.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefreshGPS}
            disabled={isLocating}
            className="flex items-center space-x-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-2 rounded-xl border border-purple-200 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Locating...' : 'Refresh GPS'}</span>
          </button>
        </div>

        {/* 1. VISUAL GEOFENCE MAP WINDOW */}
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
          {/* Map Top Bar */}
          <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Live Geofence Radar & Map
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setMapMode('map')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition ${
                  mapMode === 'map' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <MapIcon className="w-3 h-3" />
                <span>Street Map</span>
              </button>
              <button
                type="button"
                onClick={() => setMapMode('radar')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition ${
                  mapMode === 'radar' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Crosshair className="w-3 h-3" />
                <span>Radar Scan</span>
              </button>
            </div>
          </div>

          {/* Map Body Canvas */}
          <div className="relative w-full h-80 sm:h-96 bg-slate-950 overflow-hidden flex items-center justify-center">
            {mapMode === 'map' ? (
              <>
                {/* Live OpenStreetMap Iframe */}
                <iframe
                  title="Geofence Live Map"
                  src={osmUrl}
                  className="w-full h-full border-0 filter contrast-[1.05]"
                  loading="lazy"
                />

                {/* Visual Safe Zone Circle Overlay on Map */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div
                    style={{
                      width: `${Math.min(280, Math.max(90, (radius / 1000) * 260))}px`,
                      height: `${Math.min(280, Math.max(90, (radius / 1000) * 260))}px`,
                    }}
                    className="rounded-full border-2 border-emerald-500/80 bg-emerald-500/20 shadow-[0_0_25px_rgba(16,185,129,0.35)] flex items-center justify-center transition-all duration-300 relative"
                  >
                    <div className="absolute -top-3 bg-emerald-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                      {radius}m Radius
                    </div>
                    {/* Center Home Base Marker */}
                    <div className="relative flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center shadow-lg text-white">
                        <Home className="w-4 h-4" />
                      </div>
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping"></span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* High-Tech Radar View */
              <div className="relative w-full h-full bg-slate-950 flex items-center justify-center">
                {/* Radar Grid Lines */}
                <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
                <div className="absolute w-full h-px bg-emerald-500/20"></div>
                <div className="absolute h-full w-px bg-emerald-500/20"></div>

                {/* Outer Ring */}
                <div className="absolute w-72 h-72 rounded-full border border-emerald-500/20 flex items-center justify-center">
                  <span className="absolute top-2 text-[10px] text-emerald-600 font-mono">1000m</span>
                </div>
                {/* Mid Ring */}
                <div className="absolute w-52 h-52 rounded-full border border-emerald-500/30 flex items-center justify-center">
                  <span className="absolute top-2 text-[10px] text-emerald-500 font-mono">500m</span>
                </div>
                {/* Inner Ring */}
                <div className="absolute w-32 h-32 rounded-full border border-emerald-500/40 flex items-center justify-center">
                  <span className="absolute top-2 text-[10px] text-emerald-400 font-mono">250m</span>
                </div>

                {/* Dynamic Configured Safe Zone Ring */}
                <div
                  style={{
                    width: `${Math.min(270, Math.max(70, (radius / 1000) * 260))}px`,
                    height: `${Math.min(270, Math.max(70, (radius / 1000) * 260))}px`,
                  }}
                  className="absolute rounded-full border-2 border-dashed border-emerald-400 bg-emerald-500/15 shadow-[0_0_20px_rgba(52,211,153,0.3)] flex items-center justify-center transition-all duration-300"
                >
                  <span className="absolute -top-3.5 bg-emerald-600 text-white text-[10px] font-mono px-2 py-0.5 rounded-full">
                    Zone: {radius}m
                  </span>
                </div>

                {/* Center Home Marker */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center shadow-lg text-white">
                    <Home className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-white bg-slate-900/80 px-2 py-0.5 rounded mt-1">
                    Home Base
                  </span>
                </div>

                {/* Patient Live Pin (if away from home) */}
                {distanceFromHome > 15 && (
                  <div className="absolute top-12 right-16 z-10 flex flex-col items-center animate-bounce">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center shadow-lg text-white">
                      <Compass className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-bold text-indigo-200 bg-slate-900/90 px-1.5 py-0.5 rounded mt-0.5">
                      {patientName} ({distanceFromHome}m)
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Quick Floating Actions over Map */}
            <div className="absolute top-3 right-3 flex flex-col space-y-2 z-10">
              <a
                href={`https://www.google.com/maps?q=${currentCoords.lat},${currentCoords.lng}`}
                target="_blank"
                rel="noreferrer"
                className="bg-white/95 backdrop-blur-md text-slate-700 hover:text-slate-900 p-2 rounded-xl shadow-md border border-slate-200 text-xs font-semibold flex items-center space-x-1"
                title="Open in Google Maps"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Google Maps</span>
              </a>
            </div>
          </div>

          {/* 2. CURRENT LOCATION AND AREA DISPLAY (BOTTOM OF MAP WINDOW) */}
          <div className="p-5 bg-gradient-to-b from-stone-50 to-white border-t border-stone-200 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-start space-x-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl mt-0.5 flex-shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2 flex-wrap">
                    <h3 className="font-extrabold text-slate-900 text-sm">
                      {locationDetails?.neighborhood || 'Home Safe Zone'}
                    </h3>
                    {locationDetails?.city && (
                      <span className="px-2 py-0.5 rounded-md bg-stone-200 text-slate-700 text-[11px] font-semibold">
                        {locationDetails.city}{locationDetails.state ? `, ${locationDetails.state}` : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {locationDetails?.formattedAddress || `Latitude: ${currentCoords.lat.toFixed(4)}, Longitude: ${currentCoords.lng.toFixed(4)}`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSetCurrentAsHome}
                className="self-start sm:self-center flex items-center space-x-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl border border-emerald-300 shadow-sm transition"
              >
                <Home className="w-3.5 h-3.5 text-emerald-600" />
                <span>Set as Home Center</span>
              </button>
            </div>

            {/* Landmarks & Physical Surroundings */}
            {locationDetails?.nearbyLandmarks && locationDetails.nearbyLandmarks.length > 0 && (
              <div className="pt-2 border-t border-stone-200/80">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Surrounding Landmarks & Area Context
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {locationDetails.nearbyLandmarks.map((lm, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-slate-700 text-xs font-medium shadow-xs"
                    >
                      {lm}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Real-Time GPS Telemetry Strip */}
            <div className="pt-2 border-t border-stone-200/80 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-stone-200">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Current Coordinates</span>
                <span className="font-mono font-bold text-slate-800">
                  {currentCoords.lat.toFixed(5)}°, {currentCoords.lng.toFixed(5)}°
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-stone-200">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Distance to Home Base</span>
                <span className="font-bold text-slate-800">
                  {distanceFromHome} meters ({Math.round(distanceFromHome * 3.28084)} ft)
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-stone-200">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Boundary Verification</span>
                <span className={`font-bold ${isInsideSafeZone ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {isInsideSafeZone ? `✓ Inside ${radius}m Zone` : `⚠️ Outside by ${distanceFromHome - radius}m`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. GEOFENCE RADIUS SLIDER */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Safe Zone Radius Boundary
            </label>
            <span className="text-sm font-black text-purple-700 font-mono bg-purple-50 px-3 py-1 rounded-xl border border-purple-100">
              {radius} meters ({Math.round(radius * 3.28084)} ft)
            </span>
          </div>

          <input
            type="range"
            min="50"
            max="1500"
            step="25"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="w-full h-2.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
          />

          {/* Quick preset chips */}
          <div className="flex flex-wrap gap-2 pt-1">
            {[
              { label: '50m (Home Only)', val: 50 },
              { label: '150m (Street)', val: 150 },
              { label: '250m (Standard)', val: 250 },
              { label: '500m (Neighborhood)', val: 500 },
              { label: '1000m (Community)', val: 1000 },
            ].map((preset) => (
              <button
                key={preset.val}
                type="button"
                onClick={() => setRadius(preset.val)}
                className={`text-xs px-3 py-1.5 rounded-xl font-medium border transition ${
                  radius === preset.val
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                    : 'bg-stone-50 text-slate-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4. HOME BASE COORDINATES OVERRIDE (OPTIONAL) */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Home Base Center Point
              </p>
              <p className="text-xs text-slate-500">
                Center coordinate from which safe radius is measured.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCoordInputs(!showCoordInputs)}
              className="text-xs text-purple-600 font-semibold hover:underline"
            >
              {showCoordInputs ? 'Hide Coordinates' : 'Manual Coordinates'}
            </button>
          </div>

          {showCoordInputs && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Home Latitude
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={homeCoords.lat}
                  onChange={(e) => setHomeCoords({ ...homeCoords, lat: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Home Longitude
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={homeCoords.lng}
                  onChange={(e) => setHomeCoords({ ...homeCoords, lng: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {saved && (
          <div className="flex items-center space-x-2 text-xs text-emerald-800 font-bold justify-center bg-emerald-50 border border-emerald-200 p-3 rounded-2xl shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Safe Zone configuration and map coordinates saved successfully!</span>
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold py-3.5 rounded-2xl hover:from-purple-700 hover:to-indigo-700 shadow-md transition active:scale-[0.99]"
        >
          Save Safe Zone Configuration
        </button>
      </form>
    </CaregiverPageView>
  );
};

// 5. Health & Mood Insights
export const HealthInsightsView: React.FC<{
  patientData: PatientData;
  onUpdateSpeechSettings?: (speechSettings: SpeechSettings) => void;
  onBack: () => void;
  currentLanguage?: string;
  onChangeLanguage?: (langId: string) => void;
}> = ({ patientData, onUpdateSpeechSettings, onBack, currentLanguage = 'en', onChangeLanguage }) => {
  const patientName = patientData.profile?.name || 'David';
  const speechSettings = patientData.speechSettings || {
    speechRate: 0.85,
    autoAdjustSpeech: true,
    lastAssessment: null,
    assessmentHistory: [],
  };

  const [customRate, setCustomRate] = useState<number>(speechSettings.speechRate);
  const [autoAdjust, setAutoAdjust] = useState<boolean>(speechSettings.autoAdjustSpeech);

  const handleRateChange = (newRate: number) => {
    setCustomRate(newRate);
    if (onUpdateSpeechSettings) {
      onUpdateSpeechSettings({
        ...speechSettings,
        speechRate: newRate,
        autoAdjustSpeech: autoAdjust,
      });
    }
  };

  const handleAutoToggle = (val: boolean) => {
    setAutoAdjust(val);
    if (onUpdateSpeechSettings) {
      onUpdateSpeechSettings({
        ...speechSettings,
        autoAdjustSpeech: val,
      });
    }
  };

  const lastAsm = speechSettings.lastAssessment;

  return (
    <CaregiverPageView
      title={t('healthInsights', currentLanguage)}
      subtitle={`${t('scoresSpeed', currentLanguage)} - ${patientName}`}
      onBack={onBack}
      currentLanguage={currentLanguage}
      onChangeLanguage={onChangeLanguage}
    >
      <div className="space-y-6">
        {/* Metric Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm text-center">
            <Brain className="w-6 h-6 text-purple-600 mx-auto mb-1" />
            <p className="text-xs text-slate-500 font-medium">Cognitive Level Score</p>
            <p className="text-2xl font-black text-purple-900">
              {lastAsm ? `${lastAsm.cognitiveScore}/100` : '88/100'}
            </p>
            <p className="text-[10px] text-purple-700 font-bold mt-0.5">
              {lastAsm ? lastAsm.cognitiveLevel : 'High Cognition'}
            </p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm text-center">
            <Activity className="w-6 h-6 text-indigo-600 mx-auto mb-1" />
            <p className="text-xs text-slate-500 font-medium">Speech Impairment Index</p>
            <p className="text-2xl font-black text-indigo-900">
              {lastAsm ? `${lastAsm.speechClarityScore}%` : '92%'}
            </p>
            <p className="text-[10px] text-indigo-700 font-bold mt-0.5">
              {lastAsm ? lastAsm.speechImpairmentLevel : 'Clear Articulation'}
            </p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm text-center">
            <Gauge className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
            <p className="text-xs text-slate-500 font-medium">Kai Voice Speech Speed</p>
            <p className="text-2xl font-black text-emerald-800">{customRate.toFixed(2)}x</p>
            <p className="text-[10px] text-emerald-600 font-bold mt-0.5">
              {autoAdjust ? 'Auto-calibrated' : 'Manual speed locked'}
            </p>
          </div>
        </div>

        {/* Kai Speech Speed Adjustment Control */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-stone-100 pb-3">
            <div>
              <h3 className="text-base font-black text-slate-800 flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-purple-600" />
                <span>Kai Voice Cadence & Speed Tuning</span>
              </h3>
              <p className="text-xs text-slate-500">
                Adjust how fast or slowly Kai speaks to match {patientName}'s listening processing speed.
              </p>
            </div>

            <label className="flex items-center space-x-2 cursor-pointer bg-stone-100 px-3 py-1.5 rounded-xl">
              <input
                type="checkbox"
                checked={autoAdjust}
                onChange={(e) => handleAutoToggle(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded"
              />
              <span className="text-xs font-bold text-slate-700">Auto-Tune Speed</span>
            </label>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>Very Slow & Gentle (0.65x)</span>
              <span>Balanced (0.85x)</span>
              <span>Normal Rate (1.00x)</span>
            </div>

            <input
              type="range"
              min="0.60"
              max="1.10"
              step="0.05"
              value={customRate}
              onChange={(e) => handleRateChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
          </div>
        </div>

        {/* Assessment Log History */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4">
          <h3 className="text-base font-black text-slate-800">Clinical Screening & Assessment Log</h3>
          <div className="space-y-3">
            {(speechSettings.assessmentHistory && speechSettings.assessmentHistory.length > 0
              ? speechSettings.assessmentHistory
              : [
                  {
                    id: 'asm-demo-1',
                    timestamp: Date.now() - 86400000 * 2,
                    cognitiveScore: 88,
                    cognitiveLevel: 'High',
                    speechClarityScore: 92,
                    speechImpairmentLevel: 'Clear',
                    recommendedSpeechRate: 0.85,
                    notes: 'Initial clinical screening completed smoothly. Good recall & speech articulation.',
                  },
                ]
            ).map((log, i) => (
              <div key={i} className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800">
                    Test Date: {new Date(log.timestamp).toLocaleDateString()}
                  </span>
                  <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 font-extrabold rounded-full">
                    Speech Rate: {log.recommendedSpeechRate}x
                  </span>
                </div>
                <p className="text-slate-600">
                  <span className="font-bold text-slate-700">Cognitive Score:</span> {log.cognitiveScore}/100 ({log.cognitiveLevel}) |{' '}
                  <span className="font-bold text-slate-700">Speech Clarity:</span> {log.speechClarityScore}% ({log.speechImpairmentLevel})
                </p>
                <p className="text-slate-500 italic">{log.notes}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CaregiverPageView>
  );
};

// 6. Cultural & Ethnic Profile Manager
export const CulturalProfileManager: React.FC<{
  patientData: PatientData;
  onUpdateCulturalProfile: (profile: CulturalProfile) => void;
  onBack: () => void;
  currentLanguage?: string;
  onChangeLanguage?: (langId: string) => void;
}> = ({ patientData, onUpdateCulturalProfile, onBack, currentLanguage = 'en', onChangeLanguage }) => {
  const existing = patientData.culturalProfile || {
    ethnicBackground: 'Gujarati / Western Indian',
    honorificTitle: 'Kaka',
    comfortsAndCustoms: 'Enjoys warm Masala Chai at 4 PM, morning devotional songs, and gentle garden walks.',
    preferredLanguageNotes: 'Use warm Indian family honorifics like Kaka or Ji.',
  };

  const [ethnicBackground, setEthnicBackground] = useState(existing.ethnicBackground);
  const [honorificTitle, setHonorificTitle] = useState(existing.honorificTitle);
  const [comfortsAndCustoms, setComfortsAndCustoms] = useState(existing.comfortsAndCustoms || '');
  const [preferredLanguageNotes, setPreferredLanguageNotes] = useState(existing.preferredLanguageNotes || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const ethnicPresets = [
    'Gujarati / Western Indian',
    'Assamese / North-Eastern Indian',
    'Manipuri / Meiteilon',
    'Bengali / Eastern Indian',
    'Hindi Belt / North Indian',
    'South Indian (Tamil/Telugu/Kannada/Malayalam)',
    'Punjabi / North-West Indian',
    'Western / International',
    'Hispanic / Latino',
    'East Asian',
  ];

  const honorificPresets = ['Kaka', 'Ji', 'Dada', 'Uncle', 'Aaji', 'Auntie', 'Beta', 'Ayya', 'Kaki'];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCulturalProfile({
      ethnicBackground: ethnicBackground.trim(),
      honorificTitle: honorificTitle.trim(),
      comfortsAndCustoms: comfortsAndCustoms.trim(),
      preferredLanguageNotes: preferredLanguageNotes.trim(),
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <CaregiverPageView
      title="Cultural & Ethnic Profile"
      subtitle={`Personalized Cultural Context - ${patientData.profile?.name || 'Patient'}`}
      onBack={onBack}
      currentLanguage={currentLanguage}
      onChangeLanguage={onChangeLanguage}
    >
      <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-6">
        <div className="flex items-center space-x-3 bg-purple-50 border border-purple-200 p-4 rounded-2xl">
          <Globe className="w-8 h-8 text-purple-600 flex-shrink-0" />
          <div>
            <p className="font-bold text-purple-900 text-sm">Cultural & Regional Identity Engine</p>
            <p className="text-xs text-purple-700">
              Kai uses this cultural context to address {patientData.profile?.name || 'the patient'} with authentic honorifics, comfort foods, and regional customs.
            </p>
          </div>
        </div>

        {/* Ethnic Background Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Ethnic & Cultural Background
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
            {ethnicPresets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setEthnicBackground(preset)}
                className={`p-3 rounded-xl border text-left font-bold text-xs transition ${
                  ethnicBackground === preset
                    ? 'bg-purple-100 border-purple-400 text-purple-900 shadow-sm'
                    : 'bg-stone-50 border-stone-200 text-slate-700 hover:bg-stone-100'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={ethnicBackground}
            onChange={(e) => setEthnicBackground(e.target.value)}
            placeholder="Or type custom ethnic background..."
            className="w-full px-4 py-2.5 bg-stone-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
            required
          />
        </div>

        {/* Cultural Honorific Title */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Respectful Honorific / Title (How Kai Addresses Patient)
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {honorificPresets.map((title) => (
              <button
                key={title}
                type="button"
                onClick={() => setHonorificTitle(title)}
                className={`px-3 py-1.5 rounded-xl border font-bold text-xs transition ${
                  honorificTitle === title
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-stone-100 text-slate-700 hover:bg-stone-200 border-stone-200'
                }`}
              >
                {title}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={honorificTitle}
            onChange={(e) => setHonorificTitle(e.target.value)}
            placeholder="e.g. Kaka, Ji, Uncle, Dada, Aaji"
            className="w-full px-4 py-2.5 bg-stone-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
            required
          />
        </div>

        {/* Cultural Customs & Comfort Foods */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Customs, Comfort Foods & Daily Habits
          </label>
          <textarea
            value={comfortsAndCustoms}
            onChange={(e) => setComfortsAndCustoms(e.target.value)}
            rows={3}
            placeholder="e.g. Enjoys warm Masala Chai at 4 PM, listening to old Kishore Kumar songs, and morning garden walks..."
            className="w-full px-4 py-3 bg-stone-50 border border-slate-300 rounded-xl text-xs text-slate-800 leading-relaxed"
          />
        </div>

        {/* Language & Dialect Instructions */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Caregiver Notes for Kai's Dialect & Tone
          </label>
          <input
            type="text"
            value={preferredLanguageNotes}
            onChange={(e) => setPreferredLanguageNotes(e.target.value)}
            placeholder="e.g. Speak with gentle respect, use family terms like Beta or Ji..."
            className="w-full px-4 py-2.5 bg-stone-50 border border-slate-300 rounded-xl text-xs text-slate-800"
          />
        </div>

        {savedSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-bold text-center flex items-center justify-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Cultural Profile saved! Kai is now attuned to these cultural settings.</span>
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3.5 rounded-xl hover:from-purple-700 hover:to-indigo-700 shadow-md transition text-xs"
        >
          Save Cultural Profile for Kai
        </button>
      </form>
    </CaregiverPageView>
  );
};

