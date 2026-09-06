export type CallState = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';

export interface CallSignal {
  callId: string;
  caller: 'patient' | 'caregiver';
  recipient: 'patient' | 'caregiver';
  type: 'offer' | 'answer' | 'ice-candidate' | 'end' | 'reject';
  payload?: any;
  timestamp: string;
}

export interface VoiceMessage {
  id: string;
  sender: 'patient' | 'caregiver';
  recipient: 'patient' | 'caregiver';
  text: string;
  audioUrl?: string;
  timestamp: string;
  read: boolean;
}

export interface CaregiverRequest {
  id: string;
  title: string;
  description: string;
  scheduledTime: string;
  type: 'medication' | 'hydration' | 'activity' | 'checkin';
  status: 'pending' | 'delivered' | 'completed' | 'dismissed';
  sentAt: string;
}

export interface GameScoreEntry {
  gameId: string;
  gameTitle: string;
  score: number;
  maxScore: number;
  latencyMs: number;
  timestamp: string;
}

export interface PatientTelemetry {
  patientId: string;
  patientName: string;
  cognitiveIndex: number; // 0-100 score
  riskLevel: 'Low' | 'Moderate' | 'Elevated';
  disorientationIndex: number; // 0-100 risk score
  lastActiveTime: string;
  currentLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  geofenceStatus: 'safe' | 'boundary_alert';
  geofenceRadiusMeters: number;
  safeZoneCenter: {
    lat: number;
    lng: number;
  };
  recentGameScores: GameScoreEntry[];
  activeCallState: CallState;
  batteryLevel: number;
  isSleepMode: boolean;
}

export interface PatientProfile {
  name: string;
  honorific: string;
  language: string;
  age: number;
  conditionStage: string;
  caregiverName: string;
  caregiverPhone: string;
}
