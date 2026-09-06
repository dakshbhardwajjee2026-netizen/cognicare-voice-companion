import { PatientData, Memory, ScheduleEvent, VoiceNote, PatientSettings, FamilyMember, AssessmentResult, SpeechSettings } from '../types';
import { DEMO_PATIENT } from '../constants';

const STORAGE_PREFIX = 'cognicare_patient_';
const ACTIVE_PATIENT_KEY = 'cognicare_active_id';

export const dataService = {
  async getPatientData(id: string): Promise<PatientData | null> {
    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}${id.toUpperCase()}`);
      if (stored) {
        return JSON.parse(stored);
      }
      // If demo ID, populate default demo patient
      if (id.toUpperCase() === 'CGN-DEMO1' || id.toUpperCase() === 'DEMO') {
        await this.savePatientData(DEMO_PATIENT.id, DEMO_PATIENT);
        return DEMO_PATIENT;
      }
      return null;
    } catch (err) {
      console.warn('Error reading patient data from storage:', err);
      return id.toUpperCase() === 'CGN-DEMO1' ? DEMO_PATIENT : null;
    }
  },

  async savePatientData(id: string, data: PatientData): Promise<void> {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${id.toUpperCase()}`, JSON.stringify(data));
      localStorage.setItem(ACTIVE_PATIENT_KEY, id.toUpperCase());
    } catch (err) {
      console.error('Error saving patient data to storage:', err);
    }
  },

  async getActivePatientId(): Promise<string | null> {
    return localStorage.getItem(ACTIVE_PATIENT_KEY) || 'CGN-DEMO1';
  },

  async createProfile(name: string, email: string): Promise<{ id: string; data: PatientData }> {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const id = `CGN-${randomSuffix}`;

    const newPatient: PatientData = {
      id,
      profile: {
        name,
        email,
      },
      memories: [...DEMO_PATIENT.memories],
      schedule: [...DEMO_PATIENT.schedule],
      familyMembers: [...DEMO_PATIENT.familyMembers],
      voiceNotes: [],
      settings: {
        homeCoordinates: { lat: 37.7749, lng: -122.4194 },
        safeZoneRadius: 200,
      },
    };

    await this.savePatientData(id, newPatient);
    return { id, data: newPatient };
  },

  async addMemory(id: string, memory: Memory): Promise<PatientData> {
    const patient = (await this.getPatientData(id)) || DEMO_PATIENT;
    const updated: PatientData = {
      ...patient,
      memories: [memory, ...patient.memories],
    };
    await this.savePatientData(id, updated);
    return updated;
  },

  async addScheduleEvent(id: string, event: ScheduleEvent): Promise<PatientData> {
    const patient = (await this.getPatientData(id)) || DEMO_PATIENT;
    const sortedSchedule = [...patient.schedule, event].sort((a, b) => a.time.localeCompare(b.time));
    const updated: PatientData = {
      ...patient,
      schedule: sortedSchedule,
    };
    await this.savePatientData(id, updated);
    return updated;
  },

  async removeScheduleEvent(id: string, index: number): Promise<PatientData> {
    const patient = (await this.getPatientData(id)) || DEMO_PATIENT;
    const newSchedule = [...patient.schedule];
    newSchedule.splice(index, 1);
    const updated: PatientData = {
      ...patient,
      schedule: newSchedule,
    };
    await this.savePatientData(id, updated);
    return updated;
  },

  async addVoiceNote(id: string, note: VoiceNote): Promise<PatientData> {
    const patient = (await this.getPatientData(id)) || DEMO_PATIENT;
    const updated: PatientData = {
      ...patient,
      voiceNotes: [note, ...patient.voiceNotes],
    };
    await this.savePatientData(id, updated);
    return updated;
  },

  async markVoiceNotePlayed(id: string, noteId: string): Promise<PatientData> {
    const patient = (await this.getPatientData(id)) || DEMO_PATIENT;
    const updated: PatientData = {
      ...patient,
      voiceNotes: patient.voiceNotes.map((n) => (n.id === noteId ? { ...n, played: true } : n)),
    };
    await this.savePatientData(id, updated);
    return updated;
  },

  async updateSettings(id: string, settings: PatientSettings): Promise<PatientData> {
    const patient = (await this.getPatientData(id)) || DEMO_PATIENT;
    const updated: PatientData = {
      ...patient,
      settings,
    };
    await this.savePatientData(id, updated);
    return updated;
  },

  async updateSpeechSettings(id: string, speechSettings: SpeechSettings): Promise<PatientData> {
    const patient = (await this.getPatientData(id)) || DEMO_PATIENT;
    const updated: PatientData = {
      ...patient,
      speechSettings,
    };
    await this.savePatientData(id, updated);
    return updated;
  },

  async saveAssessmentResult(id: string, result: AssessmentResult): Promise<PatientData> {
    const patient = (await this.getPatientData(id)) || DEMO_PATIENT;
    const currentSpeechSettings: SpeechSettings = patient.speechSettings || {
      speechRate: 0.85,
      autoAdjustSpeech: true,
      assessmentHistory: [],
    };

    const newRate = currentSpeechSettings.autoAdjustSpeech
      ? result.recommendedSpeechRate
      : currentSpeechSettings.speechRate;

    const history = currentSpeechSettings.assessmentHistory || [];
    const updatedSpeechSettings: SpeechSettings = {
      ...currentSpeechSettings,
      speechRate: newRate,
      lastAssessment: result,
      assessmentHistory: [result, ...history],
    };

    const updated: PatientData = {
      ...patient,
      speechSettings: updatedSpeechSettings,
    };
    await this.savePatientData(id, updated);
    return updated;
  },

  async updateCulturalProfile(id: string, culturalProfile: import('../types').CulturalProfile): Promise<PatientData> {
    const patient = (await this.getPatientData(id)) || DEMO_PATIENT;
    const updated: PatientData = {
      ...patient,
      culturalProfile,
    };
    await this.savePatientData(id, updated);
    return updated;
  },
};
