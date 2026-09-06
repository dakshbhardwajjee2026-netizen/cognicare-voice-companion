import React, { useState, useEffect } from 'react';
import { Sparkles, Brain, Image as ImageIcon, Calendar, PhoneCall } from 'lucide-react';
import { PatientHeader } from './components/PatientHeader';
import { KaiVoiceCompanion } from './components/KaiVoiceCompanion';
import { CognitiveGamesView } from './components/CognitiveGamesView';
import { MemoriesView } from './components/MemoriesView';
import { ScheduleView } from './components/ScheduleView';
import { WhereAmIOrientation } from './components/WhereAmIOrientation';
import { RestfulSleepOverlay } from './components/RestfulSleepOverlay';
import { InactivityGuard } from './components/InactivityGuard';
import { PatientCaregiverCallModal } from './components/PatientCaregiverCallModal';
import { CaregiverRequest, MemoryItem, ScheduleEventItem, CallState } from './types';
import { wsClient } from './services/websocket';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'companion' | 'games' | 'memories' | 'schedule' | 'call'>('companion');
  const [patientName, setPatientName] = useState('David Kaka');
  const [caregiverName, setCaregiverName] = useState('Sarah');
  const [honorific, setHonorific] = useState('Kaka');
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [batteryLevel, setBatteryLevel] = useState(96);
  const [locationAddress, setLocationAddress] = useState('Guwahati Town Center, Assam, India');
  const [isSleepMode, setIsSleepMode] = useState(false);
  const [callState, setCallState] = useState<CallState>('idle');

  const [memories, setMemories] = useState<MemoryItem[]>([
    {
      id: 'mem_1',
      title: 'Daughter Sarah Graduation',
      description: 'Sarah graduating from Guwahati University in 2012.',
      imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&auto=format&fit=crop&q=80',
      date: 'June 2012',
      category: 'Family'
    },
    {
      id: 'mem_2',
      title: 'Tea Garden Vacation in Assam',
      description: 'Family trip to Jorhat tea estates during autumn.',
      imageUrl: 'https://images.unsplash.com/photo-1588613254378-011e0c25a1cb?w=600&auto=format&fit=crop&q=80',
      date: 'October 2018',
      category: 'Travel'
    }
  ]);

  const [schedule, setSchedule] = useState<ScheduleEventItem[]>([
    { id: 'sch_1', title: 'Morning Blood Pressure Medication', time: '08:00 AM', category: 'medication', completed: true },
    { id: 'sch_2', title: 'Garden Walk & Sun Exposure', time: '10:30 AM', category: 'activity', completed: false },
    { id: 'sch_3', title: 'Afternoon Hydration (Warm Water)', time: '02:00 PM', category: 'hydration', completed: false },
    { id: 'sch_4', title: 'Evening Brain Fitness Game', time: '05:00 PM', category: 'activity', completed: false }
  ]);

  useEffect(() => {
    // Initial REST state fetch
    fetch('http://localhost:3001/api/telemetry')
      .then(res => res.json())
      .then(data => {
        if (data.profile?.patientName) setPatientName(data.profile.patientName);
        if (data.profile?.honorific) setHonorific(data.profile.honorific);
        if (data.profile?.language) setCurrentLanguage(data.profile.language);
        if (data.currentLocation?.address) setLocationAddress(data.currentLocation.address);
      }).catch(err => console.log('REST fetch fallback:', err));

    fetch('http://localhost:3001/api/memories')
      .then(res => res.json())
      .then(data => setMemories(data))
      .catch(err => console.log('Memories fetch fallback:', err));

    fetch('http://localhost:3001/api/schedule')
      .then(res => res.json())
      .then(data => setSchedule(data))
      .catch(err => console.log('Schedule fetch fallback:', err));

    // Subscribe to WebSocket events
    const unsubscribe = wsClient.subscribe((event, data) => {
      if (event === 'INIT_STATE') {
        if (data.memories) setMemories(data.memories);
        if (data.schedule) setSchedule(data.schedule);
      } else if (event === 'CALL_SIGNAL') {
        if (data.type === 'offer') setCallState('ringing');
        else if (data.type === 'answer') setCallState('connected');
        else if (data.type === 'end' || data.type === 'reject') setCallState('idle');
      } else if (event === 'PROFILE_UPDATE') {
        if (data.patientName) setPatientName(data.patientName);
        if (data.honorific) setHonorific(data.honorific);
        if (data.language) setCurrentLanguage(data.language);
      } else if (event === 'MEMORIES_UPDATE') {
        setMemories(data);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleCallCaregiver = () => {
    setCallState('calling');
    wsClient.sendCallSignal('offer');
  };

  const handleEmergencySOS = () => {
    alert('🚨 Emergency SOS Dispatched to Sarah! Location: ' + locationAddress);
  };

  const handleScoreSubmit = (gameId: any, gameTitle: string, score: number) => {
    fetch('http://localhost:3001/api/telemetry/game-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId, gameTitle, score, latencyMs: 2000 })
    }).catch(err => console.error('Error submitting score:', err));
  };

  const handleToggleScheduleComplete = (id: string) => {
    setSchedule(prev => prev.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900 flex flex-col justify-between max-w-md mx-auto relative shadow-2xl border-x border-slate-200/80 font-sans">
      {/* Apple Light Header */}
      <PatientHeader
        patientName={patientName}
        caregiverName={caregiverName}
        batteryLevel={batteryLevel}
        currentLanguage={currentLanguage}
        onLanguageChange={(lang) => setCurrentLanguage(lang)}
        onToggleSleep={() => setIsSleepMode(true)}
        onCallCaregiver={handleCallCaregiver}
        onEmergencySOS={handleEmergencySOS}
      />

      {/* Main Tab Content View */}
      <main className="p-4 space-y-4 flex-1 pb-24">
        {activeTab === 'companion' && (
          <>
            <KaiVoiceCompanion patientName={patientName} honorific={honorific} language={currentLanguage} />
            <WhereAmIOrientation locationAddress={locationAddress} honorific={honorific} />
          </>
        )}

        {activeTab === 'games' && (
          <CognitiveGamesView onScoreSubmit={handleScoreSubmit} />
        )}

        {activeTab === 'memories' && (
          <MemoriesView memories={memories} />
        )}

        {activeTab === 'schedule' && (
          <ScheduleView schedule={schedule} onToggleComplete={handleToggleScheduleComplete} />
        )}

        {activeTab === 'call' && (
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-6 shadow-sm text-center space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Call Caregiver Sarah</h2>
            <p className="text-xs text-slate-500">Tap below to initiate an instant HD voice call with your family caregiver.</p>
            <button
              onClick={handleCallCaregiver}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 text-lg transition-all"
            >
              <PhoneCall className="w-6 h-6 animate-pulse" />
              <span>Call Sarah Now</span>
            </button>
          </div>
        )}
      </main>

      {/* Floating Apple iOS Bottom Tab Bar */}
      <nav className="fixed bottom-4 left-4 right-4 z-30 max-w-sm mx-auto bg-white/90 backdrop-blur-2xl border border-slate-200/90 rounded-full p-2 shadow-lg shadow-slate-200/60 flex items-center justify-around">
        <button
          onClick={() => setActiveTab('companion')}
          className={`p-3 rounded-full transition-all flex flex-col items-center gap-0.5 ${
            activeTab === 'companion' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-700'
          }`}
          title="Companion"
        >
          <Sparkles className="w-5 h-5" />
        </button>

        <button
          onClick={() => setActiveTab('games')}
          className={`p-3 rounded-full transition-all flex flex-col items-center gap-0.5 ${
            activeTab === 'games' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-700'
          }`}
          title="Cognitive Games"
        >
          <Brain className="w-5 h-5" />
        </button>

        <button
          onClick={() => setActiveTab('memories')}
          className={`p-3 rounded-full transition-all flex flex-col items-center gap-0.5 ${
            activeTab === 'memories' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-700'
          }`}
          title="Memories"
        >
          <ImageIcon className="w-5 h-5" />
        </button>

        <button
          onClick={() => setActiveTab('schedule')}
          className={`p-3 rounded-full transition-all flex flex-col items-center gap-0.5 ${
            activeTab === 'schedule' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-700'
          }`}
          title="Schedule"
        >
          <Calendar className="w-5 h-5" />
        </button>

        <button
          onClick={() => setActiveTab('call')}
          className={`p-3 rounded-full transition-all flex flex-col items-center gap-0.5 ${
            activeTab === 'call' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-700'
          }`}
          title="Call Caregiver"
        >
          <PhoneCall className="w-5 h-5" />
        </button>
      </nav>

      {/* Sleep Mode & Inactivity Guard Overlays */}
      <RestfulSleepOverlay isSleepMode={isSleepMode} onWakeUp={() => setIsSleepMode(false)} />
      <InactivityGuard patientName={patientName} honorific={honorific} />

      {/* Call Modal */}
      <PatientCaregiverCallModal
        callState={callState}
        caregiverName={caregiverName}
        onClose={() => setCallState('idle')}
      />
    </div>
  );
};
export default App;
