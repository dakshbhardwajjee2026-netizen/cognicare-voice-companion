export interface Memory {
  title: string;
  descriptionForKai: string;
  imageToGenerate?: string;
  imagePlaceholderUrl: string;
}

export interface ScheduleEvent {
  time: string; // "HH:MM"
  task: string;
  instructions?: string;
  message?: string;
}

export interface FamilyMember {
  name: string;
  relationship: string;
  descriptionForKai: string;
  photoUrl?: string;
}

export interface VoiceNote {
  id: string;
  audioData: string; // base64 or blob URL
  message?: string;
  timestamp: number;
  played: boolean;
  senderName?: string;
}

export interface GameResult {
  gameId: string;
  gameName: string;
  difficulty: number;
  score: number;
  maxScore: number;
  accuracy: number; // 0.0 - 1.0
  responseTimeSec: number;
  mistakes: number;
  attempts: number;
  hintsUsed: number;
  completed: boolean;
  timestamp: number;
}

export interface AssessmentResult {
  id: string;
  timestamp: number;
  cognitiveScore: number; // 0 - 100
  cognitiveLevel: 'High' | 'Mild Impairment' | 'Moderate Impairment';
  speechClarityScore: number; // 0 - 100
  speechImpairmentLevel: 'Clear' | 'Mild Hesitation' | 'Moderate Impairment';
  recommendedSpeechRate: number; // e.g. 0.70, 0.80, 0.92
  notes: string;
}

export interface SpeechSettings {
  speechRate: number; // 0.65 to 1.0
  autoAdjustSpeech: boolean;
  lastAssessment?: AssessmentResult | null;
  assessmentHistory?: AssessmentResult[];
}

export interface PatientSettings {
  homeCoordinates: { lat: number; lng: number } | null;
  safeZoneRadius: number; // in meters
}

export interface PatientProfile {
  name: string;
  email: string;
}

export interface CulturalProfile {
  ethnicBackground: string;
  honorificTitle: string;
  comfortsAndCustoms?: string;
  preferredLanguageNotes?: string;
}

export interface PatientData {
  id: string;
  profile: PatientProfile;
  memories: Memory[];
  schedule: ScheduleEvent[];
  settings: PatientSettings;
  familyMembers: FamilyMember[];
  voiceNotes: VoiceNote[];
  speechSettings?: SpeechSettings;
  culturalProfile?: CulturalProfile;
}

export interface ParsedPart {
  type: 'tone' | 'pause' | 'long_pause' | 'text';
  content: string;
}

export interface ChatMessage {
  id: string;
  speaker: 'user' | 'kai';
  text: string;
  timestamp: number;
  isFinal?: boolean;
}

export interface AlertPayload {
  text: string;
  speech: string;
  type: 'location' | 'schedule' | 'voiceNote';
}

export type CompanionStatus = 'idle' | 'listening' | 'user_speaking' | 'thinking' | 'speaking' | 'error';
