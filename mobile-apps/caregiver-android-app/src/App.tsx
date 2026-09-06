import React, { useState, useEffect } from 'react';
import { CaregiverHeader } from './components/CaregiverHeader';
import { CognitiveTelemetryDashboard } from './components/CognitiveTelemetryDashboard';
import { CulturalProfileManager } from './components/CulturalProfileManager';
import { MemoryBankManager } from './components/MemoryBankManager';
import { GeofenceRadarMap } from './components/GeofenceRadarMap';
import { RemoteTaskDispatcher } from './components/RemoteTaskDispatcher';
import { CaregiverCallConsole } from './components/CaregiverCallConsole';
import { PatientTelemetry, CaregiverRequest, VoiceMessage, CulturalProfile, MemoryItem } from './types';
import { caregiverWsClient } from './services/websocket';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'telemetry' | 'games' | 'profile' | 'memories' | 'geofence' | 'tasks' | 'calling'>('telemetry');

  const [telemetry, setTelemetry] = useState<PatientTelemetry>({
    patientId: 'patient_david_001',
    profile: {
      language: 'en',
      honorific: 'Kaka',
      patientName: 'David Kaka',
      age: 74,
      profession: 'Retired Mathematics Teacher',
      hobbies: ['Gardening', 'Classical Music'],
      keyMemories: ['Married to Sunita in 1978']
    },
    cognitiveIndex: 85,
    riskLevel: 'Low',
    disorientationIndex: 12,
    lastActiveTime: new Date().toISOString(),
    currentLocation: {
      lat: 26.1445,
      lng: 91.7362,
      address: 'Guwahati Town Center, Assam, India'
    },
    geofenceStatus: 'safe',
    geofenceRadiusMeters: 500,
    safeZoneCenter: {
      lat: 26.1445,
      lng: 91.7362
    },
    recentGameScores: [
      { gameId: 'mem_match', gameTitle: 'Memory Match', score: 90, maxScore: 100, latencyMs: 2100, timestamp: new Date(Date.now() - 7200000).toISOString() },
      { gameId: 'what_changed', gameTitle: 'What Changed?', score: 85, maxScore: 100, latencyMs: 1800, timestamp: new Date(Date.now() - 5400000).toISOString() },
      { gameId: 'mem_tray', gameTitle: 'Memory Tray', score: 80, maxScore: 100, latencyMs: 2600, timestamp: new Date(Date.now() - 3600000).toISOString() },
      { gameId: 'routine_recall', gameTitle: 'Daily Routine Recall', score: 95, maxScore: 100, latencyMs: 1500, timestamp: new Date(Date.now() - 1800000).toISOString() },
      { gameId: 'obj_rec', gameTitle: 'Object Recognition', score: 90, maxScore: 100, latencyMs: 1900, timestamp: new Date().toISOString() }
    ],
    activeCallState: 'idle',
    batteryLevel: 96,
    isSleepMode: false
  });

  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [requests, setRequests] = useState<CaregiverRequest[]>([]);
  const [messages, setMessages] = useState<VoiceMessage[]>([]);

  useEffect(() => {
    // REST API Initial Data Fetch
    fetch('http://localhost:3001/api/telemetry')
      .then(res => res.json())
      .then(data => setTelemetry(data))
      .catch(err => console.log('Telemetry fetch fallback:', err));

    fetch('http://localhost:3001/api/memories')
      .then(res => res.json())
      .then(data => setMemories(data))
      .catch(err => console.log('Memories fetch fallback:', err));

    fetch('http://localhost:3001/api/requests')
      .then(res => res.json())
      .then(data => setRequests(data))
      .catch(err => console.log('Requests fetch fallback:', err));

    fetch('http://localhost:3001/api/messages')
      .then(res => res.json())
      .then(data => setMessages(data))
      .catch(err => console.log('Messages fetch fallback:', err));

    // WebSocket Real-time Subscriptions
    const unsubscribe = caregiverWsClient.subscribe((event, data) => {
      if (event === 'INIT_STATE') {
        if (data.telemetry) setTelemetry(data.telemetry);
        if (data.memories) setMemories(data.memories);
        if (data.requests) setRequests(data.requests);
        if (data.messages) setMessages(data.messages);
      } else if (event === 'TELEMETRY_UPDATE') {
        setTelemetry(data);
      } else if (event === 'CALL_SIGNAL') {
        if (data.type === 'offer') setTelemetry(prev => ({ ...prev, activeCallState: 'calling' }));
        else if (data.type === 'answer') setTelemetry(prev => ({ ...prev, activeCallState: 'connected' }));
        else if (data.type === 'end' || data.type === 'reject') setTelemetry(prev => ({ ...prev, activeCallState: 'idle' }));
      } else if (event === 'NEW_MESSAGE') {
        setMessages(prev => [...prev, data]);
      } else if (event === 'CAREGIVER_REQUEST') {
        setRequests(prev => [data, ...prev]);
      } else if (event === 'MEMORIES_UPDATE') {
        setMemories(data);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSaveProfile = (profile: CulturalProfile) => {
    fetch('http://localhost:3001/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    }).catch(err => console.error('Error saving profile:', err));
  };

  const handleAddMemory = (memory: any) => {
    fetch('http://localhost:3001/api/memories/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(memory)
    }).catch(err => console.error('Error adding memory:', err));
  };

  const handleSendMessage = (text: string) => {
    fetch('http://localhost:3001/api/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender: 'caregiver', recipient: 'patient', text })
    }).catch(err => console.error('Error sending message:', err));
  };

  const handleCreateTask = (task: any) => {
    fetch('http://localhost:3001/api/requests/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task)
    }).catch(err => console.error('Error creating task:', err));
  };

  const handleUpdateRadius = (radius: number) => {
    setTelemetry(prev => ({ ...prev, geofenceRadiusMeters: radius }));
    fetch('http://localhost:3001/api/telemetry/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ geofenceRadiusMeters: radius })
    }).catch(err => console.error('Error updating radius:', err));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900 flex flex-col justify-between max-w-md mx-auto relative shadow-2xl border-x border-slate-200/80 font-sans">
      {/* Header Bar */}
      <CaregiverHeader
        telemetry={telemetry}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Tab Content */}
      <main className="p-4 space-y-4 flex-1 pb-8">
        {activeTab === 'telemetry' && (
          <CognitiveTelemetryDashboard telemetry={telemetry} />
        )}

        {activeTab === 'games' && (
          <CognitiveTelemetryDashboard telemetry={telemetry} />
        )}

        {activeTab === 'profile' && (
          <CulturalProfileManager profile={telemetry.profile} onSaveProfile={handleSaveProfile} />
        )}

        {activeTab === 'memories' && (
          <MemoryBankManager memories={memories} onAddMemory={handleAddMemory} />
        )}

        {activeTab === 'geofence' && (
          <GeofenceRadarMap telemetry={telemetry} onUpdateRadius={handleUpdateRadius} />
        )}

        {activeTab === 'tasks' && (
          <RemoteTaskDispatcher requests={requests} onCreateTask={handleCreateTask} />
        )}

        {activeTab === 'calling' && (
          <CaregiverCallConsole
            callState={telemetry.activeCallState}
            patientName={telemetry.profile?.patientName || 'David Kaka'}
            messages={messages}
            onSendMessage={handleSendMessage}
          />
        )}
      </main>
    </div>
  );
};
export default App;
