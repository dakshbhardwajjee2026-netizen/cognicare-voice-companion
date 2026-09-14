import { PatientData, Memory, ScheduleEvent, VoiceNote, PatientSettings, FamilyMember, AssessmentResult, SpeechSettings } from '../types';
import { DEMO_PATIENT } from '../constants';

const STORAGE_PREFIX = 'cognicare_patient_';
const ACTIVE_PATIENT_KEY = 'cognicare_active_id';

export const dataService = {
  async getAllPatients(): Promise<PatientData[]> {
    try {
      const res = await fetch('/api/patients');
      if (res.ok) {
        const patients = await res.json();
        if (Array.isArray(patients) && patients.length > 0) {
          return patients;
        }
      }
    } catch (e) {
      console.warn('API fetch patients notice, reading local storage:', e);
    }
    // Fallback: list from local storage
    const list: PatientData[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
          const item = localStorage.getItem(key);
          if (item) list.push(JSON.parse(item));
        }
      }
    } catch {
      // ignore
    }
    return list.length > 0 ? list : [DEMO_PATIENT];
  },

  async getPatientData(id: string): Promise<PatientData | null> {
    const normId = (id || '').trim().toUpperCase();
    try {
      const res = await fetch(`/api/patients/${normId}`);
      if (res.ok) {
        const data = await res.json();
        if (data) {
          localStorage.setItem(`${STORAGE_PREFIX}${normId}`, JSON.stringify(data));
          return data;
        }
      }
    } catch (e) {
      console.warn('API getPatientData notice, falling back to local:', e);
    }

    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}${normId}`);
      if (stored) {
        return JSON.parse(stored);
      }
      if (normId === 'CGN-DEMO1' || normId === 'DEMO') {
        await this.savePatientData(DEMO_PATIENT.id, DEMO_PATIENT);
        return DEMO_PATIENT;
      }
      return null;
    } catch (err) {
      console.warn('Error reading patient data from storage:', err);
      return normId === 'CGN-DEMO1' ? DEMO_PATIENT : null;
    }
  },

  async savePatientData(id: string, data: PatientData): Promise<void> {
    const normId = id.trim().toUpperCase();
    const cleanData = { ...data, id: normId };

    // Update local cache immediately
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${normId}`, JSON.stringify(cleanData));
      localStorage.setItem(ACTIVE_PATIENT_KEY, normId);
    } catch (err) {
      console.error('Error saving patient data to storage:', err);
    }

    // Sync to Cloud MongoDB Atlas / Server DB
    try {
      await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanData),
      });
    } catch (err) {
      console.warn('Error syncing patient to server database:', err);
    }
  },

  async getActivePatientId(): Promise<string | null> {
    return localStorage.getItem(ACTIVE_PATIENT_KEY) || null;
  },

  async createProfile(name: string, email: string, customData?: Partial<PatientData>): Promise<{ id: string; data: PatientData }> {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const id = `CGN-${randomSuffix}`;

    const newPatient: PatientData = {
      id,
      profile: {
        name,
        email,
      },
      memories: customData?.memories || [...DEMO_PATIENT.memories],
      schedule: customData?.schedule || [...DEMO_PATIENT.schedule],
      familyMembers: customData?.familyMembers || [...DEMO_PATIENT.familyMembers],
      voiceNotes: [],
      settings: customData?.settings || {
        homeCoordinates: { lat: 37.7749, lng: -122.4194 },
        safeZoneRadius: 200,
      },
      culturalProfile: customData?.culturalProfile || {
        ethnicBackground: 'Indian / Regional',
        honorificTitle: 'Ji',
        comfortsAndCustoms: 'Warm Masala Chai at 4 PM, morning quiet prayers, family walks.',
        preferredLanguageNotes: 'Speak with warm respect and gentle patience.',
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
