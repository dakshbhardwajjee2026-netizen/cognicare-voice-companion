import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '15mb' }));

// Lazy initialization of GoogleGenAI client
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    console.log('[Gemini Client] No API Key found in process.env. GEMINI_API_KEY is unset.');
    return null;
  }
  if (!aiClient) {
    console.log('[Gemini Client] Initializing GoogleGenAI with key:', apiKey.slice(0, 8) + '...');
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// System tools declaration
const SHOW_MEMORY_TOOL: FunctionDeclaration = {
  name: 'showMemoryImage',
  description: 'When the user seems confused, forgetful, reminiscing, or asks about a memory/photo/past event, show them a relevant photo from their key memories. Pick the most matching memory title.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      memoryTitle: {
        type: Type.STRING,
        description: 'The title of the memory to show on screen.',
      },
    },
    required: ['memoryTitle'],
  },
};

const PLAY_VOICE_NOTE_TOOL: FunctionDeclaration = {
  name: 'playVoiceNote',
  description: 'Plays the unread audio voice message from the caregiver when the user agrees to listen to it or asks to hear it.',
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

const NAVIGATE_TOOL: FunctionDeclaration = {
  name: 'navigateToPage',
  description: 'Navigates the user to a section such as schedule, memories, music, or call.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      page: {
        type: Type.STRING,
        description: 'Target section: dashboard, schedule, memories, music, call',
      },
    },
    required: ['page'],
  },
};

// Fallback intelligent responder when Gemini API key is not configured or offline
// Optional Sarvam AI Integration for Indian Languages
async function trySarvamAIResponse(prompt: string, patientName: string, userLang: string): Promise<{ text: string } | null> {
  const sarvamKey = process.env.SARVAM_API_KEY;
  if (!sarvamKey) return null;

  try {
    const res = await fetch('https://api.sarvam.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': sarvamKey,
      },
      body: JSON.stringify({
        model: 'sarvam-m-2b',
        messages: [
          {
            role: 'system',
            content: `You are Kai, a loving, patient AI companion for ${patientName}. Reply warmly in 1-2 short sentences in ${userLang} or Hinglish with prosody tags like (tone: warm) and (pause).`,
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (text) return { text };
    }
  } catch (err: any) {
    console.warn('[Sarvam AI] Failed:', err.message);
  }
  return null;
}

// Fallback intelligent responder when AI APIs hit rate limit or are offline
// Fallback intelligent responder when AI APIs hit rate limit or are offline
function generateLocalFallbackResponse(
  prompt: string,
  patientData: any,
  language = 'en',
  locationInfo?: any
): { text: string; functionCalls?: any[] } {
  const lower = prompt.toLowerCase();
  const name = patientData?.profile?.name || 'friend';
  const cultural = patientData?.culturalProfile || { honorificTitle: 'Kaka', ethnicBackground: 'Indian' };
  const honorific = cultural.honorificTitle ? `${name} ${cultural.honorificTitle}` : name;

  const memories = patientData?.memories || [];
  const schedule = patientData?.schedule || [];
  const unplayedNote = (patientData?.voiceNotes || []).find((n: any) => !n.played);
  const familyMembers = patientData?.familyMembers || [];

  const langCode = (language || 'en').toLowerCase();
  const isHindi = langCode === 'hi' || /[\u0900-\u097F]/.test(prompt) || lower.includes('mujhe') || lower.includes('yaad') || lower.includes('kaun') || lower.includes('hai') || lower.includes('kahan');
  const isAssamese = langCode === 'as';
  const isManipuri = langCode === 'mni';
  const isBengali = langCode === 'bn' || /[\u0980-\u09FF]/.test(prompt);

  // Location / Where Am I Intent
  if (lower.includes('where am i') || lower.includes('kahan') || lower.includes('kahan hun') || lower.includes('place') || lower.includes('location') || lower.includes('outside') || lower.includes('park')) {
    const loc = locationInfo?.locationDetails;
    const placeName = loc ? `${loc.neighborhood}, ${loc.city}` : 'your home safe area';
    const landmarks = loc?.nearbyLandmarks?.length ? loc.nearbyLandmarks.slice(0, 2).join(' and ') : 'the local garden and walkway';

    if (isHindi) {
      return {
        text: `(tone: reassuring) ${honorific}, आप अपने घर के पास ${placeName} में बिल्कुल सुरक्षित हैं। (pause) आपके पास ${landmarks} हैं। सब कुछ शांत है।`,
      };
    }
    return {
      text: `(tone: reassuring) You are right near ${placeName}, ${honorific}. (pause) Nearby you have ${landmarks}. You are completely safe and peaceful.`,
    };
  }

  // 1. Identity & Confusion / Memory Loss Intent
  if (
    lower.includes('kaun') ||
    lower.includes('kon') ||
    lower.includes('who am i') ||
    lower.includes('my name') ||
    lower.includes('yad nahin') ||
    lower.includes('yaad nahi') ||
    lower.includes('kuch yad') ||
    lower.includes('forget') ||
    lower.includes('confused')
  ) {
    const familyNames = familyMembers.map((m: any) => m.name).join(', ') || 'Maria and Sarah';
    if (isHindi) {
      return {
        text: `(tone: reassuring) आप ${honorific} हैं। (pause) मैं आपकी सौम्य साथी काई हूँ। आप अपने घर पर बिल्कुल सुरक्षित हैं। आपका परिवार, जैसे ${familyNames}, आपसे बहुत प्यार करता है।`,
      };
    }
    if (isAssamese) {
      return {
        text: `(tone: reassuring) আপুনি হ'ল ${honorific}। (pause) মই আপোনাৰ সংগী কাই। আপুনি ঘৰতে সুৰক্ষিতভাৱে আছোঁ।`,
      };
    }
    if (isManipuri) {
      return {
        text: `(tone: reassuring) নহাগী মিমিং ${honorific} নি। (pause) ঐনা নহাংগী ইবুংঙো কাইনি। নহা য়ুমদা অশেংবা লৈরি।`,
      };
    }
    return {
      text: `(tone: reassuring) You are ${honorific}. (pause) I am Kai, your devoted voice companion. You are completely safe at home. Your family, including ${familyNames}, loves you very much.`,
    };
  }

  // 2. Photos & Memories Intent
  if (lower.includes('yaad') || lower.includes('yad') || lower.includes('photo') || lower.includes('tasveer') || lower.includes('picture') || lower.includes('memory') || lower.includes('wedding')) {
    if (memories.length > 0) {
      const topMem = memories[0];
      return {
        text: isHindi
          ? `(tone: warm) ${honorific}, यह रही आपकी एक प्यारी याद: ${topMem.title}। (pause) ${topMem.descriptionForKai}`
          : `(tone: warm) ${honorific}, here is a cherished memory photograph: ${topMem.title}. (pause) ${topMem.descriptionForKai}`,
        functionCalls: [{ name: 'showMemoryImage', args: { memoryTitle: topMem.title } }],
      };
    }
  }

  // 3. Caregiver Voice Note Intent
  if (lower.includes('sandesh') || lower.includes('awaaz') || lower.includes('voice') || lower.includes('note') || lower.includes('message') || lower.includes('caregiver')) {
    return {
      text: isHindi
        ? `(tone: gentle) आपके केयरगिवर का वॉयस मैसेज बजाया जा रहा है, ${honorific}। (pause) कृपया ध्यान से सुनें।`
        : `(tone: gentle) Playing your caregiver voice message now, ${honorific}. (pause) Please listen closely.`,
      functionCalls: [{ name: 'playVoiceNote', args: {} }],
    };
  }

  // 4. Schedule & Tasks Intent
  if (lower.includes('kaam') || lower.includes('schedule') || lower.includes('dawa') || lower.includes('routine') || lower.includes('today')) {
    if (schedule.length > 0) {
      const firstTask = schedule[0];
      return {
        text: isHindi
          ? `(tone: warm) आज ${firstTask.time} बजे आपका यह काम है, ${honorific}: ${firstTask.task}।`
          : `(tone: warm) Today at ${firstTask.time}, your task is: ${firstTask.task}, ${honorific}.`,
        functionCalls: [{ name: 'navigateToPage', args: { page: 'schedule' } }],
      };
    }
  }

  if (isHindi) {
    return {
      text: `(tone: warm) नमस्ते ${honorific}। (pause) मैं आपकी साथी काई हूँ। आप जो भी कहना चाहें, मैं आपको ध्यान से सुन रही हूँ। सब कुछ सुरक्षित व शांत है।`,
    };
  }

  return {
    text: `(tone: warm) Hello ${honorific}. (pause) I am right here by your side. Everything is safe and peaceful.`,
  };
}

// API Health
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Universal Multilingual TTS Audio Stream Endpoint
app.get('/api/tts', async (req: Request, res: Response) => {
  const text = req.query.text as string;
  const lang = (req.query.lang as string) || 'en';

  if (!text) {
    return res.status(400).send('Text parameter is required');
  }

  // Clean prosody tags like (tone: warm), (pause), etc.
  const clean = text
    .replace(/\(tone:\s*[^)]+\)/gi, '')
    .replace(/\(long pause\)/gi, '... ')
    .replace(/\(pause\)/gi, ', ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!clean) {
    return res.status(400).send('No readable text after cleaning');
  }

  const langMap: Record<string, string> = {
    as: 'as',
    mni: 'mni',
    bn: 'bn',
    brx: 'hi',
    kha: 'en',
    lus: 'en',
    nag: 'bn',
    ne: 'ne',
    trp: 'bn',
    hi: 'hi',
    ta: 'ta',
    te: 'te',
    kn: 'kn',
    ml: 'ml',
    mr: 'mr',
    gu: 'gu',
    pa: 'pa',
    or: 'or',
    ur: 'ur',
    en: 'en',
    es: 'es',
    fr: 'fr',
    de: 'de',
    zh: 'zh-CN',
    ja: 'ja',
  };

  const targetLang = langMap[lang.toLowerCase()] || lang.split('-')[0].toLowerCase() || 'hi';

  try {
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
      clean.slice(0, 200)
    )}&tl=${targetLang}&client=tw-ob`;

    const response = await fetch(ttsUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      const fallbackUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
        clean.slice(0, 200)
      )}&tl=hi&client=tw-ob`;
      const fallbackRes = await fetch(fallbackUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
      });
      const buffer = await fallbackRes.arrayBuffer();
      res.setHeader('Content-Type', 'audio/mpeg');
      return res.send(Buffer.from(buffer));
    }

    const buffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    return res.send(Buffer.from(buffer));
  } catch (err: any) {
    console.error('TTS endpoint error:', err.message);
    res.status(500).json({ error: 'TTS generation failed' });
  }
});

// Gemini Chat Endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  const { prompt, patientData, history, language, locationInfo } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const userLang = language || 'en';
  const patientName = patientData?.profile?.name || 'the user';

  // 1. Try Sarvam AI first if key exists
  const sarvamRes = await trySarvamAIResponse(prompt, patientName, userLang);
  if (sarvamRes) {
    return res.json(sarvamRes);
  }

  const ai = getAIClient();

  // If no AI client available, use smart local fallback
  if (!ai) {
    const fallback = generateLocalFallbackResponse(prompt, patientData, userLang, locationInfo);
    return res.json(fallback);
  }

  try {
    const memoriesList = (patientData?.memories || [])
      .map((m: any) => `- "${m.title}": ${m.descriptionForKai}`)
      .join('\n');

    const familyList = (patientData?.familyMembers || [])
      .map((m: any) => `- ${m.name} (${m.relationship}): ${m.descriptionForKai}`)
      .join('\n');

    const scheduleList = (patientData?.schedule || [])
      .map((s: any) => `- At ${s.time}: ${s.task} (${s.instructions || ''})`)
      .join('\n');

    const unplayedNote = (patientData?.voiceNotes || []).some((n: any) => !n.played);

    const culturalProfile = patientData?.culturalProfile || {
      ethnicBackground: 'Gujarati / Western Indian',
      honorificTitle: 'Kaka',
      comfortsAndCustoms: 'Enjoys warm Masala Chai at 4 PM, morning devotional bhajan music, and afternoon garden walks.',
      preferredLanguageNotes: 'Use warm Indian family honorifics like Kaka or Ji.',
    };

    const culturalContext = `
CULTURAL & ETHNIC PROFILE (Caregiver Configured):
- Ethnic & Cultural Background: ${culturalProfile.ethnicBackground || 'Indian'}
- Respectful Honorific Title: Address patient as "${patientName} ${culturalProfile.honorificTitle || ''}" (or ${culturalProfile.honorificTitle || 'Ji'})
- Daily Habits, Comfort Foods & Customs: ${culturalProfile.comfortsAndCustoms || 'Masala Chai and gentle music'}
- Caregiver Tone Guidance: ${culturalProfile.preferredLanguageNotes || 'Speak with warm respect'}
`;

    const locDetails = locationInfo?.locationDetails;
    const locationContext = locDetails
      ? `
REAL-TIME GPS LOCATION & NEARBY SURROUNDINGS:
- Full Address: ${locDetails.formattedAddress}
- Neighborhood / Suburb: ${locDetails.neighborhood}
- City & State: ${locDetails.city}, ${locDetails.state}
- Nearby Landmarks & Streets: ${locDetails.nearbyLandmarks?.join(', ') || 'Neighborhood garden'}
- Safe Zone Status: ${locationInfo?.isSafe ? 'INSIDE Safe Zone' : 'OUTSIDE Safe Zone'}
`
      : `
REAL-TIME GPS LOCATION:
- Status: Home Safe Area (${patientData?.settings?.homeCoordinates?.lat || '37.77'}, ${patientData?.settings?.homeCoordinates?.lng || '-122.41'})
`;

    const systemInstruction = `You are Kai, a serene, patient, and loving AI voice companion specifically designed for individuals needing gentle cognitive and memory support.

MANDATORY MULTILINGUAL & TRANSLITERATION INSTRUCTIONS:
- Preferred Language Code: ${userLang}
- Patient's Spoken Input: "${prompt}"
- CRITICAL REQUIREMENT: You MUST speak and respond strictly in the language of the patient's input "${prompt}" or in the preferred language (${userLang}).
- Always address the patient respectfully using their cultural honorific (e.g. "${patientName} ${culturalProfile.honorificTitle || ''}").

${culturalContext}

${locationContext}

CORE PERSONALITY & TOOL GUIDELINES:
1. Speak with extraordinary warmth, patience, clarity, and kindness.
2. Keep sentences short, comforting, and easy to understand (1 to 3 short sentences).
3. Use prosody markup in your text response to guide speech rhythm:
   - (tone: warm)
   - (tone: gentle)
   - (tone: reassuring)
   - (pause) -> natural pause
4. ALWAYS provide spoken text in your response even when calling a function tool!
5. When the user asks where they are, what is outside, or about nearby places, USE THE REAL-TIME GPS SURROUNDINGS & LANDMARKS PROVIDED ABOVE to give accurate, comforting, location-aware answers!
6. You have access to tools:
   - showMemoryImage: Call this when the user asks about photos, memories, past events, or reminiscing.
   - playVoiceNote: Call this when the user asks to hear audio/voice messages from family/caregiver.
   - navigateToPage: Call this to navigate to schedule, memories, music, or call sections.

PATIENT PROFILE:
- Name: ${patientName}
- Key Memories:
${memoriesList || 'None recorded yet.'}
- Family Members:
${familyList || 'None recorded yet.'}
- Today's Schedule:
${scheduleList || 'No scheduled events.'}
- Unplayed Voice Message: ${unplayedNote ? 'YES, there is an unplayed voice message from the caregiver waiting.' : 'None'}

Always address ${patientName} ${culturalProfile.honorificTitle || ''} gently and supportively in their preferred language.`;

    // Build chat contents including recent conversation context
    const contents: any[] = [];
    if (Array.isArray(history) && history.length > 0) {
      for (const item of history.slice(-6)) {
        if (item.speaker === 'user') {
          contents.push({ role: 'user', parts: [{ text: item.text }] });
        } else if (item.speaker === 'kai') {
          contents.push({ role: 'model', parts: [{ text: item.text }] });
        }
      }
    }
    contents.push({ role: 'user', parts: [{ text: prompt }] });

    // Comprehensive list of models to cycle through on rate limits
    const modelsToTry = [
      'gemini-3.6-flash',
      'gemini-3.7-flash',
      'gemini-3.8-flash',
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-flash-latest',
      'gemini-flash-lite-latest',
    ];

    let response: any = null;
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction,
            temperature: 0.7,
            tools: [{ functionDeclarations: [SHOW_MEMORY_TOOL, PLAY_VOICE_NOTE_TOOL, NAVIGATE_TOOL] }],
          },
        });
        if (response) break;
      } catch (err: any) {
        console.warn(`Model ${modelName} failed or rate limited: ${err.message}. Trying next model...`);
        lastError = err;
      }
    }

    if (!response) {
      throw lastError || new Error('All Gemini models failed');
    }

    let replyText = response.text || '';
    const functionCalls = response.functionCalls || [];

    // Synthesize text if model only returned tool calls without text
    if (!replyText.trim() && functionCalls.length > 0) {
      const callName = functionCalls[0].name;
      const langLower = (userLang || 'en').toLowerCase();
      const isHindi = langLower === 'hi' || /[\u0900-\u097F]/.test(prompt) || prompt.toLowerCase().includes('mujhe');

      if (callName === 'showMemoryImage') {
        const memTitle = functionCalls[0].args?.memoryTitle || 'photograph';
        if (isHindi) {
          replyText = `(tone: warm) यह रही आपकी याद की खास तस्वीर: ${memTitle}। (pause) इसे देखकर मुझे बहुत खुशी हुई, ${patientName}।`;
        } else {
          replyText = `(tone: warm) Here is that special memory photo of ${memTitle} for you, ${patientName}. (pause) It brings back such wonderful moments.`;
        }
      } else if (callName === 'playVoiceNote') {
        if (isHindi) {
          replyText = `(tone: gentle) आपके केयरगिवर का संदेश सुनाया जा रहा है, ${patientName}। (pause) कृपया ध्यान से सुनें।`;
        } else {
          replyText = `(tone: gentle) Playing the voice message from your family now, ${patientName}. (pause) Please listen closely.`;
        }
      } else if (callName === 'navigateToPage') {
        if (isHindi) {
          replyText = `(tone: warm) मैं आपको उस सेक्शन में ले जा रही हूँ, ${patientName}।`;
        } else {
          replyText = `(tone: warm) Navigating to that section for you now, ${patientName}.`;
        }
      }
    }

    res.json({
      text: replyText || `(tone: warm) I am right here with you, ${patientName}. (pause) How can I assist you today?`,
      functionCalls: functionCalls.length > 0 ? functionCalls : undefined,
    });
  } catch (error: any) {
    console.error('Error generating Gemini response:', error);
    // Graceful fallback on API error
    const fallback = generateLocalFallbackResponse(prompt, patientData, userLang);
    res.json(fallback);
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CogniCare Companion Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
