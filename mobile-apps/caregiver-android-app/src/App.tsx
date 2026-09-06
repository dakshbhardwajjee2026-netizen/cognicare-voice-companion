import React, { useState, useEffect } from 'react';
import { CaregiverHeader } from './components/CaregiverHeader';
import { CognitiveTelemetryDashboard } from './components/CognitiveTelemetryDashboard';
import { CaregiverCallConsole } from './components/CaregiverCallConsole';
import { GeofenceRadarMap } from './components/GeofenceRadarMap';
import { RemoteTaskDispatcher } from './components/RemoteTaskDispatcher';
import { PatientTelemetry, CaregiverRequest, VoiceMessage, CallState } from './types';
import { caregiverWsClient } from './services/websocket';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'telemetry' | 'calling' | 'geofence' | 'tasks'>('telemetry');
  const [telemetry, setTelemetry] = useState<PatientTelemetry>({
    patientId: 'patient_david_001',
    patientName: 'David Kaka',
    cognitiveIndex: 82,
    riskLevel: 'Low',
    disorientationIndex: 15,
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
      { gameId: 'mem_match', gameTitle: 'Memory Match', score: 85, maxScore: 100, latencyMs: 2400, timestamp: new Date(Date.now() - 3600000).toISOString() },
      { gameId: 'what_changed', gameTitle: 'What Changed?', score: 90, maxScore: 100, latencyMs: 1900, timestamp: new Date(Date.now() - 1800000).toISOString() },
      { gameId: 'routine_recall', gameTitle: 'Daily Routine Recall', score: 80, maxScore: 100, latencyMs: 3100, timestamp: new Date().toISOString() }
    ],
    activeCallState: 'idle',
    batteryLevel: 94,
    isSleepMode: false
  });

  const [requests, setRequests] = useState<CaregiverRequest[]>([]);
  const [messages, setMessages] = useState<VoiceMessage[]>([]);

  useEffect(() => {
    // Initial REST Data Load
    fetch('http://localhost:3001/api/telemetry')
      .then(res => res.json())
      .then(data => setTelemetry(data))
      .catch(err => console.log('Caregiver REST fetch fallback:', err));

    fetch('http://localhost:3001/api/requests')
      .then(res => res.json())
      .then(data => setRequests(data))
      .catch(err => console.log('Caregiver REST requests fetch fallback:', err));

    fetch('http://localhost:3001/api/messages')
      .then(res => res.json())
      .then(data => setMessages(data))
      .catch(err => console.log('Caregiver REST messages fetch fallback:', err));

    // WebSocket Real-time Subscriptions
    const unsubscribe = caregiverWsClient.subscribe((event, data) => {
      if (event === 'INIT_STATE') {
        if (data.telemetry) setTelemetry(data.telemetry);
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
      } else if (event === 'REQUEST_COMPLETED') {
        setRequests(prev => prev.map(r => r.id === data.id ? { ...r, status: 'completed' } : r));
      } else if (event === 'GEOFENCE_ALERT') {
        setTelemetry(prev => ({ ...prev, geofenceStatus: 'boundary_alert' }));
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSendMessage = (text: string) => {
    fetch('http://localhost:3001/api/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender: 'caregiver', recipient: 'patient', text })
    }).catch(err => console.error('Error sending caregiver message:', err));
  };

  const handleCreateTask = (task: { title: string; description: string; scheduledTime: string; type: 'medication' | 'hydration' | 'activity' }) => {
    fetch('http://localhost:3001/api/requests/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task)
    }).catch(err => console.error('Error creating caregiver task:', err));
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between max-w-md mx-auto relative shadow-2xl border-x border-slate-800">
      {/* Caregiver Command Header */}
      <CaregiverHeader
        telemetry={telemetry}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="p-4 space-y-4 flex-1 pb-8">
        {activeTab === 'telemetry' && (
          <CognitiveTelemetryDashboard telemetry={telemetry} />
        )}

        {activeTab === 'calling' && (
          <CaregiverCallConsole
            callState={telemetry.activeCallState}
            patientName={telemetry.patientName}
            messages={messages}
            onSendMessage={handleSendMessage}
          />
        )}

        {activeTab === 'geofence' && (
          <GeofenceRadarMap
            telemetry={telemetry}
            onUpdateRadius={handleUpdateRadius}
          />
        )}

        {activeTab === 'tasks' && (
          <RemoteTaskDispatcher
            requests={requests}
            onCreateTask={handleCreateTask}
          />
        )}
      </main>
    </div>
  );
};
export default App;
