import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Sparkles,
  Calendar,
  Image as ImageIcon,
  Phone,
  Heart,
  Settings,
  Brain,
  LogOut,
  UserCheck,
} from 'lucide-react';
import { PatientData, ChatMessage, Memory, AlertPayload, ScheduleEvent, VoiceNote, PatientSettings, AssessmentResult, SpeechSettings, CulturalProfile } from './types';
import { DEMO_PATIENT } from './constants';
import { dataService } from './services/dataService';
import { sendChatMessage } from './services/geminiService';
import { t, getLanguageOption } from './services/i18n';
import { useTTS } from './hooks/useTTS';
import { useSTT } from './hooks/useSTT';
import { unlockAudio } from './utils/audio';
import { useProactiveSystem } from './hooks/useProactiveSystem';
import { useGeolocation } from './hooks/useGeolocation';

import { LoginView } from './components/LoginView';
import { OnboardingWizard } from './components/OnboardingWizard';
import { CompanionDisplay } from './components/CompanionDisplay';
import { ScheduleView } from './components/ScheduleView';
import { MemoriesView } from './components/MemoriesView';
import { CallFamilyView } from './components/CallFamilyView';
import { CognitiveGamesView } from './components/CognitiveGamesView';
import { MusicGamesView } from './components/MusicGamesView';
import { CaregiverDashboardView } from './components/CaregiverDashboardView';
import {
  MemoryBankManager,
  ScheduleManager,
  RecordVoiceNoteView,
  SafeZoneManager,
  HealthInsightsView,
  CulturalProfileManager,
} from './components/CaregiverPages';

export const App: React.FC = () => {
  // Authentication & Patient State
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Active language state
  const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
    return localStorage.getItem('cognicare_language') || 'en';
  });

  const handleLanguageChange = (langId: string) => {
    setCurrentLanguage(langId);
    localStorage.setItem('cognicare_language', langId);
  };

  const currentLanguageRef = useRef<string>(currentLanguage);
  useEffect(() => {
    currentLanguageRef.current = currentLanguage;
  }, [currentLanguage]);

  const activeLangOption = getLanguageOption(currentLanguage);
  const sttCode = activeLangOption?.sttCode || 'en-US';

  // Active view: 'companion', 'schedule', 'memories', 'call', 'activities', 'caregiver', 'memory-bank', 'manage-schedule', 'send-voice-note', 'geofence', 'health-insights'
  const [activeTab, setActiveTab] = useState<string>('companion');

  // Conversation history
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [isKaiThinking, setIsKaiThinking] = useState(false);
  const [activeMemoryModal, setActiveMemoryModal] = useState<Memory | null>(null);

  const historyRef = useRef<ChatMessage[]>([]);
  const patientDataRef = useRef<PatientData | null>(null);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    patientDataRef.current = patientData;
  }, [patientData]);

  // Load initial active patient profile on mount (always start at Login/Onboarding for demos)
  useEffect(() => {
    setIsLoading(false);
  }, []);

  // Voice output (TTS) with dynamic adaptive speech rate & target language
  const currentRate = patientData?.speechSettings?.speechRate || 0.85;
  const { speak, stop: stopSpeaking, isSpeaking, isMuted, toggleMute, speechRate, setSpeechRate } = useTTS(currentRate, currentLanguage);

  // Sleep Mode state & Auto-Wake timer
  const [isSleepMode, setIsSleepMode] = useState(false);
  const [sleepUntilTimestamp, setSleepUntilTimestamp] = useState<number | null>(null);
  const [sleepTimeRemaining, setSleepTimeRemaining] = useState<number>(0);
  const lastUserActivityRef = useRef<number>(Date.now());
  const memoryRecallIndexRef = useRef<number>(0);

  // Intelligent User Activity Tracker (resets timer on clicks, touches, keyboard, and scroll)
  useEffect(() => {
    const handleInteraction = () => {
      lastUserActivityRef.current = Date.now();
    };
    window.addEventListener('pointerdown', handleInteraction, { passive: true });
    window.addEventListener('touchstart', handleInteraction, { passive: true });
    window.addEventListener('keydown', handleInteraction, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  // Handle user speech prompt
  const handleUserMessage = useCallback(
    async (userText: string) => {
      console.log('[App.tsx Diagnostic] handleUserMessage invoked with:', userText);
      const currentPatient = patientDataRef.current || patientData || DEMO_PATIENT;
      if (!userText || !userText.trim()) return;

      lastUserActivityRef.current = Date.now();
      const trimmed = userText.trim();

      // If Kai is speaking, interrupt Kai immediately
      stopSpeaking();

      // Add user message to history
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        speaker: 'user',
        text: trimmed,
        timestamp: Date.now(),
        isFinal: true,
      };

      const updatedHistory = [...historyRef.current, userMsg];
      setHistory(updatedHistory);
      setIsKaiThinking(true);

      try {
        const response = await sendChatMessage(
          trimmed,
          currentPatient,
          updatedHistory,
          currentLanguageRef.current,
          locationStateRef.current
        );

        const kaiMsg: ChatMessage = {
          id: `kai-${Date.now()}`,
          speaker: 'kai',
          text: response.text,
          timestamp: Date.now(),
          isFinal: true,
        };

        setHistory((prev) => [...prev, kaiMsg]);
        setIsKaiThinking(false);

        let shouldSkipDefaultSpeak = false;

        // Handle tool calls from Gemini
        if (response.functionCalls && response.functionCalls.length > 0) {
          for (const call of response.functionCalls) {
            if (call.name === 'showMemoryImage') {
              const targetTitle = (call.args?.memoryTitle || '').toLowerCase().trim();
              let foundMem: any = null;
              if (targetTitle && currentPatient.memories) {
                foundMem = currentPatient.memories.find(
                  (m) =>
                    m.title.toLowerCase().includes(targetTitle) ||
                    targetTitle.includes(m.title.toLowerCase()) ||
                    m.title.toLowerCase().split(/\s+/).some((w: string) => w.length > 3 && targetTitle.includes(w))
                );
              }
              if (!foundMem && currentPatient.memories && currentPatient.memories.length > 0) {
                foundMem = currentPatient.memories[0];
              }
              if (foundMem) {
                setActiveMemoryModal(foundMem);
              }
            } else if (call.name === 'playVoiceNote') {
              const notes = currentPatient.voiceNotes || [];
              const unplayed = notes.find((n) => !n.played) || notes[0];
              if (unplayed) {
                await dataService.markVoiceNotePlayed(currentPatient.id, unplayed.id);
                setPatientData((prev) =>
                  prev ? { ...prev, voiceNotes: prev.voiceNotes.map((n) => (n.id === unplayed.id ? { ...n, played: true } : n)) } : null
                );

                const sender = unplayed.senderName || 'your caregiver';
                const rawMsg = ((unplayed as any).message || (unplayed as any).text || '').trim();
                const isGenericPlaceholder = !rawMsg || 
                  /^(a\s+)?voice\s+(message|note|recording(\s+message)?)$/i.test(rawMsg);

                const audioSrc = unplayed.audioData || (unplayed as any).audioUrl;
                const hasValidAudio = audioSrc && typeof audioSrc === 'string' && audioSrc.length > 50 && (audioSrc.startsWith('data:audio') || audioSrc.startsWith('blob:') || audioSrc.startsWith('http'));

                const speechText = hasValidAudio
                  ? `(tone: gentle) Playing voice message from ${sender}.`
                  : !isGenericPlaceholder
                  ? `(tone: gentle) Message from ${sender}: (pause) "${rawMsg}"`
                  : `(tone: gentle) Here is a voice message from ${sender}.`;

                if (hasValidAudio) {
                  try {
                    const audio = new Audio(audioSrc);
                    audio.onerror = () => {
                      speak(speechText);
                    };
                    const playPromise = audio.play();
                    if (playPromise !== undefined) {
                      playPromise.catch((e) => {
                        console.warn('Audio playback error, speaking message text:', e);
                        speak(speechText);
                      });
                    }
                  } catch (e) {
                    speak(speechText);
                  }
                } else {
                  speak(speechText);
                }
                shouldSkipDefaultSpeak = true;
              } else {
                speak(`(tone: gentle) You have no new voice messages right now, ${currentPatient.profile.name || 'David'}.`);
                shouldSkipDefaultSpeak = true;
              }
            } else if (call.name === 'navigateToPage' && call.args?.page) {
              const targetPage = call.args.page;
              if (['dashboard', 'schedule', 'memories', 'music', 'call'].includes(targetPage)) {
                setActiveTab(targetPage === 'dashboard' ? 'companion' : targetPage === 'music' ? 'activities' : targetPage);
              }
            }
          }
        }

        // Speak Kai's response with prosody if not playing a voice note directly
        if (!shouldSkipDefaultSpeak) {
          speak(response.text);
        }
      } catch (err) {
        console.error('Error handling user message:', err);
        setIsKaiThinking(false);
        const fallbackText = `(tone: reassuring) I am right here by your side, ${currentPatient.profile.name}. Everything is safe and peaceful.`;
        setHistory((prev) => [
          ...prev,
          {
            id: `kai-${Date.now()}`,
            speaker: 'kai',
            text: fallbackText,
            timestamp: Date.now(),
            isFinal: true,
          },
        ]);
        speak(fallbackText);
      }
    },
    [speak, stopSpeaking]
  );

  // Speech Recognition (STT) bound dynamically to current language STT code
  const {
    isListening,
    isUserSpeaking,
    interimTranscript,
    error: sttError,
    micVolume,
    hasMicPermission,
    requestMicPermission,
    startListening,
    stopListening,
    toggleListening,
  } = useSTT({
    sttCode,
    isKaiSpeaking: isSpeaking || isKaiThinking,
    onFinalTranscript: (final) => {
      console.log('[App.tsx Diagnostic] onFinalTranscript received:', final, { isSpeaking, isKaiThinking, isSleepMode });
      if (!isSpeaking && !isKaiThinking && !isSleepMode) {
        lastUserActivityRef.current = Date.now();
        handleUserMessage(final);
      } else {
        console.warn('[App.tsx Diagnostic] Ignored final transcript due to active state:', { isSpeaking, isKaiThinking, isSleepMode });
      }
    },
  });

  // Start listening seamlessly on first user interaction or when active
  useEffect(() => {
    if (!patientData || isSleepMode || isListening) return;

    const handleFirstGesture = async () => {
      console.log('[App.tsx Diagnostic] User first gesture detected. Unlocking audio and requesting mic permission...');
      unlockAudio();
      try {
        const granted = await requestMicPermission();
        console.log('[App.tsx Diagnostic] First gesture mic permission result:', granted);
      } catch (err) {
        console.warn('[App.tsx Diagnostic] requestMicPermission error on first gesture:', err);
      }
      if (!isSleepMode) {
        startListening();
      }
    };

    window.addEventListener('pointerdown', handleFirstGesture, { once: true });
    window.addEventListener('touchstart', handleFirstGesture, { once: true });
    window.addEventListener('keydown', handleFirstGesture, { once: true });

    return () => {
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
  }, [patientData, isSleepMode, isListening, startListening]);

  // Wake Up Kai action handler
  const handleWakeUpKai = useCallback(
    (isAutoWake: boolean = false) => {
      setIsSleepMode(false);
      setSleepUntilTimestamp(null);
      setSleepTimeRemaining(0);
      lastUserActivityRef.current = Date.now();
      startListening();

      const patientName = patientDataRef.current?.profile?.name || 'friend';
      const greetingText = isAutoWake
        ? `(tone: warm) Good day ${patientName}! Kai is back awake to keep you company. How are you feeling right now?`
        : `(tone: warm) Welcome back, ${patientName}! Kai is awake and ready to chat anytime.`;

      setHistory((prev) => [
        ...prev,
        {
          id: `kai-wake-${Date.now()}`,
          speaker: 'kai',
          text: greetingText,
          timestamp: Date.now(),
          isFinal: true,
        },
      ]);
      speak(greetingText);
    },
    [startListening, speak]
  );

  // Put Kai to Sleep action handler
  const handlePutKaiToSleep = useCallback(
    (minutes: number) => {
      stopSpeaking();
      stopListening();
      const targetTimestamp = Date.now() + minutes * 60 * 1000;
      setIsSleepMode(true);
      setSleepUntilTimestamp(targetTimestamp);
      setSleepTimeRemaining(minutes * 60);

      const sleepNotice = `(tone: gentle) Sleep mode activated. Kai will rest for ${minutes} minutes and automatically wake up. Rest well.`;
      setHistory((prev) => [
        ...prev,
        {
          id: `kai-sleep-${Date.now()}`,
          speaker: 'kai',
          text: sleepNotice,
          timestamp: Date.now(),
          isFinal: true,
        },
      ]);
      speak(sleepNotice);
    },
    [stopSpeaking, stopListening, speak]
  );

  // Sleep countdown timer & auto-wake trigger
  useEffect(() => {
    if (!isSleepMode || !sleepUntilTimestamp) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diffSeconds = Math.max(0, Math.ceil((sleepUntilTimestamp - now) / 1000));
      setSleepTimeRemaining(diffSeconds);

      if (diffSeconds <= 0) {
        clearInterval(interval);
        handleWakeUpKai(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isSleepMode, sleepUntilTimestamp, handleWakeUpKai]);

  // Helper to generate 1-line gist + engaging CST memory recall question
  const generateMemoryRecallPrompt = (patientName: string, mem: any, langCode = 'en') => {
    const title = (mem.title || '').trim();
    const titleLower = title.toLowerCase();

    if (langCode === 'hi') {
      if (titleLower.includes('birthday') || titleLower.includes('janamdin')) {
        return `(tone: warm) ${patientName}, मैं आपकी इस प्यारी तस्वीर को देख रही थी: ${title}। (pause) क्या आपको याद है कि उस दिन आपके साथ खुशियाँ मनाने कौन आया था?`;
      }
      if (titleLower.includes('wedding') || titleLower.includes('anniversary') || titleLower.includes('shadi')) {
        return `(tone: warm) ${patientName}, देखिए यह कितनी सुंदर याद है: ${title}। (pause) क्या आपको याद है यह कितना खास और खुशियों भरा दिन था?`;
      }
      return `(tone: warm) ${patientName}, मैं आपकी यह खूबसूरत याद देख रही थी: ${title}। (pause) क्या यह तस्वीर आपके मन में सुखद यादें लाती है?`;
    }

    if (titleLower.includes('birthday')) {
      return `(tone: warm) ${patientName}, I was just looking at this happy photo from your ${title}. (pause) Do you remember who helped you celebrate and blow out the candles?`;
    }
    if (titleLower.includes('wedding') || titleLower.includes('anniversary')) {
      return `(tone: warm) ${patientName}, look at this wonderful photograph from ${title}. (pause) Do you remember the beautiful moments and music from that special day?`;
    }
    if (titleLower.includes('garden') || titleLower.includes('spring')) {
      return `(tone: warm) ${patientName}, here is a peaceful photo of ${title}. (pause) Do you remember the flowers you loved to tend in the morning?`;
    }
    if (titleLower.includes('buddy') || titleLower.includes('dog') || titleLower.includes('pet')) {
      return `(tone: warm) ${patientName}, here is a delightful photo with ${title}. (pause) Do you remember how much joy Buddy brought to your walks?`;
    }
    return `(tone: warm) ${patientName}, I was just admiring this cherished memory: ${title}. (pause) ${mem.descriptionForKai || ''} Does this bring back happy thoughts for you?`;
  };

  // Intelligent Proactive Inactivity Monitor (90 seconds of true idle time)
  useEffect(() => {
    if (!patientData || isSleepMode) return;

    const checkInterval = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastUserActivityRef.current;
      const INACTIVITY_THRESHOLD = 90 * 1000; // 90 seconds of genuine quiet/inactivity

      if (timeSinceLastActivity >= INACTIVITY_THRESHOLD && !isSpeaking && !isKaiThinking && !isUserSpeaking) {
        lastUserActivityRef.current = Date.now();
        const patientName = patientDataRef.current?.profile?.name || 'friend';
        const memories = patientDataRef.current?.memories || [];

        let checkInText = `(tone: gentle) Hello ${patientName}, just checking in on you. (pause) Are you feeling comfortable and alright?`;
        if (memories.length > 0) {
          const mem = memories[memoryRecallIndexRef.current % memories.length];
          memoryRecallIndexRef.current += 1;
          setActiveMemoryModal(mem);
          checkInText = generateMemoryRecallPrompt(patientName, mem, currentLanguageRef.current);
        }

        setHistory((prev) => [
          ...prev,
          {
            id: `kai-recall-${Date.now()}`,
            speaker: 'kai',
            text: checkInText,
            timestamp: Date.now(),
            isFinal: true,
          },
        ]);
        speak(checkInText);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(checkInterval);
  }, [patientData, isSleepMode, isSpeaking, isKaiThinking, isUserSpeaking, speak]);

  // Geolocation & Safety Zone
  const locationState = useGeolocation(patientData?.settings);
  const locationStateRef = useRef(locationState);
  useEffect(() => {
    locationStateRef.current = locationState;
  }, [locationState]);

  // Proactive scheduled alerts and memory recalling
  const { activeAlert, dismissAlert } = useProactiveSystem(patientData, {
    onTriggerAlert: (alert) => {
      // If it's a memory recall alert, automatically pop up the memory photo
      if (alert.type === 'memory' && alert.memory) {
        setActiveMemoryModal(alert.memory);
      }
      // Add proactive alert to chat history
      setHistory((prev) => [
        ...prev,
        {
          id: `kai-proactive-${Date.now()}`,
          speaker: 'kai',
          text: alert.speech,
          timestamp: Date.now(),
          isFinal: true,
        },
      ]);
      // Speak proactive alert gently
      speak(alert.speech);
    },
  });

  // Replay audio from turn
  const handleReplayAudio = (text: string) => {
    stopSpeaking();
    speak(text);
  };

  // Auth login handlers
  const handleLogin = (id: string, data: PatientData) => {
    setPatientData(data);
    setActiveTab('companion');
    setHistory([
      {
        id: `init-${Date.now()}`,
        speaker: 'kai',
        text: `(tone: warm) Welcome back, ${data.profile.name}. (pause) It is wonderful to spend time with you. How can I assist you today?`,
        timestamp: Date.now(),
        isFinal: true,
      },
    ]);
  };

  const handleLogout = () => {
    stopSpeaking();
    stopListening();
    setPatientData(null);
    setActiveTab('companion');
  };

  // Caregiver mutation actions
  const handleAddMemory = async (memory: Memory) => {
    if (!patientData) return;
    const updated = await dataService.addMemory(patientData.id, memory);
    setPatientData(updated);
  };

  const handleAddScheduleEvent = async (event: ScheduleEvent) => {
    if (!patientData) return;
    const updated = await dataService.addScheduleEvent(patientData.id, event);
    setPatientData(updated);
  };

  const handleRemoveScheduleEvent = async (index: number) => {
    if (!patientData) return;
    const updated = await dataService.removeScheduleEvent(patientData.id, index);
    setPatientData(updated);
  };

  const handleSaveVoiceNote = async (note: VoiceNote) => {
    if (!patientData) return;
    const updated = await dataService.addVoiceNote(patientData.id, note);
    setPatientData(updated);
  };

  const handleUpdateSettings = async (settings: PatientSettings) => {
    if (!patientData) return;
    const updated = await dataService.updateSettings(patientData.id, settings);
    setPatientData(updated);
  };

  const handleMarkVoiceNotePlayed = async (noteId: string) => {
    if (!patientData) return;
    const updated = await dataService.markVoiceNotePlayed(patientData.id, noteId);
    setPatientData(updated);
  };

  const handleSaveAssessment = async (result: AssessmentResult) => {
    if (!patientData) return;
    const updated = await dataService.saveAssessmentResult(patientData.id, result);
    setPatientData(updated);
    if (updated.speechSettings?.speechRate) {
      setSpeechRate(updated.speechSettings.speechRate);
    }
  };

  const handleUpdateSpeechSettings = async (settings: SpeechSettings) => {
    if (!patientData) return;
    const updated = await dataService.updateSpeechSettings(patientData.id, settings);
    setPatientData(updated);
    if (updated.speechSettings?.speechRate) {
      setSpeechRate(updated.speechSettings.speechRate);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-700">{t('connecting', currentLanguage)}</p>
        </div>
      </div>
    );
  }

  if (!patientData) {
    if (isOnboardingOpen) {
      return (
        <OnboardingWizard
          initialLanguage={currentLanguage}
          onComplete={(id, data) => {
            setIsOnboardingOpen(false);
            handleLogin(id, data);
          }}
          onCancel={() => setIsOnboardingOpen(false)}
        />
      );
    }

    return (
      <LoginView
        onLogin={handleLogin}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        getPatientData={dataService.getPatientData.bind(dataService)}
        createProfile={dataService.createProfile.bind(dataService)}
        currentLanguage={currentLanguage}
        onChangeLanguage={handleLanguageChange}
      />
    );
  }

  // Caregiver subpages routing
  if (activeTab === 'caregiver') {
    return (
      <CaregiverDashboardView
        patientData={patientData}
        onNavigate={(page) => setActiveTab(page)}
        onLogout={handleLogout}
        currentLanguage={currentLanguage}
        onChangeLanguage={handleLanguageChange}
      />
    );
  }

  if (activeTab === 'memory-bank') {
    return (
      <MemoryBankManager
        patientData={patientData}
        onAddMemory={handleAddMemory}
        onBack={() => setActiveTab('caregiver')}
        currentLanguage={currentLanguage}
        onChangeLanguage={handleLanguageChange}
      />
    );
  }

  if (activeTab === 'manage-schedule') {
    return (
      <ScheduleManager
        patientData={patientData}
        onAddEvent={handleAddScheduleEvent}
        onRemoveEvent={handleRemoveScheduleEvent}
        onBack={() => setActiveTab('caregiver')}
        currentLanguage={currentLanguage}
        onChangeLanguage={handleLanguageChange}
      />
    );
  }

  if (activeTab === 'send-voice-note') {
    return (
      <RecordVoiceNoteView
        patientData={patientData}
        onSaveVoiceNote={handleSaveVoiceNote}
        onBack={() => setActiveTab('caregiver')}
        currentLanguage={currentLanguage}
        onChangeLanguage={handleLanguageChange}
      />
    );
  }

  if (activeTab === 'geofence') {
    return (
      <SafeZoneManager
        patientData={patientData}
        locationState={locationState}
        onUpdateSettings={handleUpdateSettings}
        onBack={() => setActiveTab('caregiver')}
        currentLanguage={currentLanguage}
        onChangeLanguage={handleLanguageChange}
      />
    );
  }

  const handleUpdateCulturalProfile = async (profile: CulturalProfile) => {
    if (!patientData) return;
    const updated = await dataService.updateCulturalProfile(patientData.id, profile);
    setPatientData(updated);
  };

  if (activeTab === 'health-insights') {
    return (
      <HealthInsightsView
        patientData={patientData}
        onUpdateSpeechSettings={handleUpdateSpeechSettings}
        onBack={() => setActiveTab('caregiver')}
        currentLanguage={currentLanguage}
        onChangeLanguage={handleLanguageChange}
      />
    );
  }

  if (activeTab === 'cultural-profile') {
    return (
      <CulturalProfileManager
        patientData={patientData}
        onUpdateCulturalProfile={handleUpdateCulturalProfile}
        onBack={() => setActiveTab('caregiver')}
        currentLanguage={currentLanguage}
        onChangeLanguage={handleLanguageChange}
      />
    );
  }

  return (
    <div id="cognicare-app-root" className="flex flex-col h-screen w-full max-w-lg mx-auto bg-stone-100 shadow-2xl relative overflow-hidden font-sans border-x border-stone-300">
      {/* Top Main View Content */}
      <div className="flex-grow overflow-hidden flex flex-col">
        {activeTab === 'companion' && (
          <CompanionDisplay
            patientData={patientData}
            history={history}
            isListening={isListening}
            isUserSpeaking={isUserSpeaking}
            isSpeaking={isSpeaking}
            isKaiThinking={isKaiThinking}
            isMuted={isMuted}
            interimTranscript={interimTranscript}
            micVolume={micVolume}
            errorMessage={sttError}
            hasMicPermission={hasMicPermission}
            activeAlert={activeAlert}
            activeMemoryModal={activeMemoryModal}
            onToggleListening={toggleListening}
            onToggleMute={toggleMute}
            onSendPrompt={handleUserMessage}
            onReplayAudio={handleReplayAudio}
            onDismissAlert={dismissAlert}
            onCloseMemoryModal={() => setActiveMemoryModal(null)}
            onOpenCaregiverPortal={() => setActiveTab('caregiver')}
            onRequestPermission={requestMicPermission}
            currentLanguage={currentLanguage}
            onChangeLanguage={handleLanguageChange}
            isSleepMode={isSleepMode}
            sleepTimeRemaining={sleepTimeRemaining}
            onPutKaiToSleep={handlePutKaiToSleep}
            onWakeUpKai={() => handleWakeUpKai(false)}
          />
        )}

        {activeTab === 'schedule' && (
          <ScheduleView
            patientData={patientData}
            onSpeak={speak}
            onBack={() => setActiveTab('companion')}
            currentLanguage={currentLanguage}
          />
        )}

        {activeTab === 'memories' && (
          <MemoriesView
            patientData={patientData}
            onSelectMemory={(mem) => setActiveMemoryModal(mem)}
            onSpeakStory={speak}
            currentLanguage={currentLanguage}
          />
        )}

        {activeTab === 'call' && (
          <CallFamilyView
            patientData={patientData}
            onSpeak={speak}
            onMarkVoiceNotePlayed={handleMarkVoiceNotePlayed}
            currentLanguage={currentLanguage}
          />
        )}

        {activeTab === 'activities' && (
          <CognitiveGamesView
            patientData={patientData}
            onSpeak={speak}
            onSaveAssessment={handleSaveAssessment}
            currentSpeechRate={speechRate}
            currentLanguage={currentLanguage}
          />
        )}
      </div>

      {/* Bottom Sticky Navigation Bar */}
      <nav id="main-navigation-bar" className="flex-shrink-0 bg-white border-t border-stone-200 px-2 py-2 flex items-center justify-around z-20 shadow-lg">
        <button
          id="nav-tab-companion"
          onClick={() => setActiveTab('companion')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition ${
            activeTab === 'companion'
              ? 'text-blue-600 bg-blue-50 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">{t('navKaiVoice', currentLanguage)}</span>
        </button>

        <button
          id="nav-tab-schedule"
          onClick={() => setActiveTab('schedule')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition ${
            activeTab === 'schedule'
              ? 'text-sky-600 bg-sky-50 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">{t('navSchedule', currentLanguage)}</span>
        </button>

        <button
          id="nav-tab-memories"
          onClick={() => setActiveTab('memories')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition ${
            activeTab === 'memories'
              ? 'text-rose-600 bg-rose-50 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ImageIcon className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">{t('navMemories', currentLanguage)}</span>
        </button>

        <button
          id="nav-tab-family"
          onClick={() => setActiveTab('call')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition ${
            activeTab === 'call'
              ? 'text-emerald-600 bg-emerald-50 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Phone className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">{t('navFamily', currentLanguage)}</span>
        </button>

        <button
          id="nav-tab-activities"
          onClick={() => setActiveTab('activities')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition ${
            activeTab === 'activities'
              ? 'text-purple-600 bg-purple-50 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Brain className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">{t('navActivities', currentLanguage)}</span>
        </button>

        <button
          id="nav-tab-caregiver"
          onClick={() => setActiveTab('caregiver')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition ${
            activeTab === 'caregiver'
              ? 'text-slate-900 bg-slate-100 font-bold'
              : 'text-slate-400 hover:text-slate-700'
          }`}
          title="Caregiver Portal"
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">{t('navCaregiver', currentLanguage)}</span>
        </button>
      </nav>
    </div>
  );
};
