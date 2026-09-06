import { PatientData, ChatMessage } from '../types';

export interface GeminiResponse {
  text: string;
  functionCalls?: Array<{
    name: string;
    args: Record<string, any>;
  }>;
}

export const sendChatMessage = async (
  prompt: string,
  patientData: PatientData | null,
  history: ChatMessage[],
  language?: string,
  locationInfo?: any
): Promise<GeminiResponse> => {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        patientData,
        language: language || 'en',
        locationInfo: locationInfo || null,
        history: history.map((m) => ({
          speaker: m.speaker,
          text: m.text,
        })),
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn('API returned non-OK status:', response.status, errText);
      throw new Error(`API error: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error contacting /api/chat endpoint:', error);
    // Return friendly reassurance if network fails
    const name = patientData?.profile?.name || 'there';
    return {
      text: `(tone: reassuring) I am right here with you, ${name}. (pause) I heard you clearly. Everything is calm and safe.`,
    };
  }
};
