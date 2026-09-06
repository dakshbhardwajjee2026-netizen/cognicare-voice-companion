import React, { useState, useEffect } from 'react';
import { PatientHeader } from './components/PatientHeader';
import { KaiVoiceCompanion } from './components/KaiVoiceCompanion';
import { CaregiverTasksPrompt } from './components/CaregiverTasksPrompt';
import { WhereAmIOrientation } from './components/WhereAmIOrientation';
import { PatientCognitiveCheckin } from './components/PatientCognitiveCheckin';
import { PatientCaregiverCallModal } from './components/PatientCaregiverCallModal';
import { CaregiverRequest, CallState } from './types';
import { wsClient } from './services/websocket';

export const App: React.FC = () => {
  const [patientName, setPatientName] = useState('David Kaka');
  const [caregiverName, setCaregiverName] = useState('Sarah');
  const [honorific, setHonorific] = useState('Kaka');
  const [language, setLanguage] = useState('English');
  const [batteryLevel, setBatteryLevel] = useState(94);
  const [locationAddress, setLocationAddress] = useState('Guwahati Town Center, Assam, India');
  const [callState, setCallState] = useState<CallState>('idle');
  const [requests, setRequests] = useState<CaregiverRequest[]>([]);

  useEffect(() => {
    // Fetch initial REST state
    fetch('http://localhost:3001/api/telemetry')
      .then(res => res.json())
      .then(data => {
        if (data.currentLocation?.address) setLocationAddress(data.currentLocation.address);
        if (data.activeCallState) setCallState(data.activeCallState);
      })
      .catch(err => console.log('REST telemetry fetch fallback:', err));

    fetch('http://localhost:3001/api/requests')
      .then(res => res.json())
      .then(data => setRequests(data))
      .catch(err => console.log('REST requests fetch fallback:', err));

    // Subscribe to WebSocket real-time events
    const unsubscribe = wsClient.subscribe((event, data) => {
      if (event === 'INIT_STATE') {
        setRequests(data.requests || []);
      } else if (event === 'CAREGIVER_REQUEST') {
        setRequests(prev => [data, ...prev]);
        // Kai speaks aloud new caregiver task
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(`David Kaka. New reminder from Sarah: ${data.title}`);
          utterance.rate = 0.85;
          window.speechSynthesis.speak(utterance);
        }
      } else if (event === 'CALL_SIGNAL') {
        if (data.type === 'offer') setCallState('ringing');
        else if (data.type === 'answer') setCallState('connected');
        else if (data.type === 'end' || data.type === 'reject') setCallState('idle');
      } else if (event === 'TELEMETRY_UPDATE') {
        if (data.activeCallState) setCallState(data.activeCallState);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleCallCaregiver = () => {
    setCallState('calling');
    wsClient.sendCallSignal('offer');
  };

  const handleEmergencySOS = () => {
    alert('🚨 Emergency Alert Sent to Sarah! Location: ' + locationAddress);
    wsClient.send('LOCATION_UPDATE', {
      location: { lat: 26.1445, lng: 91.7362, address: 'EMERGENCY: ' + locationAddress }
    });
  };

  const handleCompleteTask = (id: string) => {
    fetch(`http://localhost:3001/api/requests/${id}/complete`, { method: 'POST' })
      .then(() => {
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'completed' } : r));
      })
      .catch(err => console.error('Error completing request:', err));
  };

  const handleScoreSubmit = (gameId: string, gameTitle: string, score: number) => {
    fetch('http://localhost:3001/api/telemetry/game-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId, gameTitle, score, latencyMs: 2200 })
    }).catch(err => console.error('Error submitting game score:', err));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between max-w-md mx-auto relative shadow-2xl border-x border-slate-800">
      {/* Header */}
      <PatientHeader
        patientName={patientName}
        caregiverName={caregiverName}
        batteryLevel={batteryLevel}
        onCallCaregiver={handleCallCaregiver}
        onEmergencySOS={handleEmergencySOS}
      />

      {/* Main Patient Content Area */}
      <main className="p-4 space-y-4 flex-1 pb-8">
        {/* Caregiver Active Task Alerts */}
        <CaregiverTasksPrompt requests={requests} onCompleteTask={handleCompleteTask} />

        {/* Central Kai Voice Companion */}
        <KaiVoiceCompanion patientName={patientName} honorific={honorific} language={language} />

        {/* Where Am I Location Orientation */}
        <WhereAmIOrientation locationAddress={locationAddress} honorific={honorific} />

        {/* Autonomous Cognitive Fitness Games */}
        <PatientCognitiveCheckin onScoreSubmit={handleScoreSubmit} />
      </main>

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
