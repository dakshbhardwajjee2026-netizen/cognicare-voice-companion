export type CallState = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';

export interface CaregiverRequest {
  id: string;
  title: string;
  description: string;
  scheduledTime: string;
  type: 'medication' | 'hydration' | 'activity' | 'checkin';
  status: 'pending' | 'delivered' | 'completed' | 'dismissed';
  sentAt: string;
}

export interface VoiceMessage {
  id: string;
  sender: 'patient' | 'caregiver';
  recipient: 'patient' | 'caregiver';
  text: string;
  timestamp: string;
  read: boolean;
}

export interface PatientTelemetry {
  patientId: string;
  patientName: string;
  cognitiveIndex: number;
  riskLevel: 'Low' | 'Moderate' | 'Elevated';
  disorientationIndex: number;
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
  activeCallState: CallState;
  batteryLevel: number;
  isSleepMode: boolean;
}
