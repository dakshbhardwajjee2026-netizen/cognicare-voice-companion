import express, { Request, Response } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import {
  PatientTelemetry,
  CaregiverRequest,
  VoiceMessage,
  GameScoreEntry,
  CulturalProfile,
  MemoryItem,
  VoiceNoteItem,
  ScheduleEventItem
} from './types.js';

// Load env files
dotenv.config({ path: '.env' });
dotenv.config({ path: '../../.env.local' });
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' }));

const PORT = 3001;
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Google GenAI Client
const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  if (!apiKey) return null;
  if (!aiClient) {
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

console.log('[Gemini Client] API Key configured:', !!apiKey, apiKey ? apiKey.slice(0, 8) + '...' : 'NONE');

// In-Memory State
let culturalProfile: CulturalProfile = {
  language: 'en',
  honorific: 'Kaka',
  patientName: 'David',
  age: 74,
  profession: 'Retired Mathematics Teacher',
  hobbies: ['Gardening', 'Classical Music', 'Solving Puzzles'],
  keyMemories: ['Married to Sunita in 1978', 'Taught at Guwahati High School for 32 years']
};

let memoriesBank: MemoryItem[] = [
  {
    id: 'mem_1',
    title: 'Daughter Sarah Graduation',
    description: 'Sarah graduating from Guwahati University in 2012 with honors.',
    imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&auto=format&fit=crop&q=80',
    date: 'June 2012',
    category: 'Family'
  },
  {
    id: 'mem_2',
    title: 'Tea Garden Vacation in Jorhat',
    description: 'Family holiday walking through lush Jorhat tea estates in autumn.',
    imageUrl: 'https://images.unsplash.com/photo-1588613254378-011e0c25a1cb?w=600&auto=format&fit=crop&q=80',
    date: 'October 2018',
    category: 'Travel'
  }
];

let voiceNotesBank: VoiceNoteItem[] = [
  {
    id: 'vn_1',
    senderName: 'Sarah (Daughter)',
    message: 'Good morning Papa! Reminding you to take your morning tea and walk in the garden. I love you!',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    played: true
  }
];

let scheduleEvents: ScheduleEventItem[] = [
  { id: 'sch_1', title: 'Morning Blood Pressure Medication', time: '08:00 AM', category: 'medication', completed: true },
  { id: 'sch_2', title: 'Garden Walk & Sun Exposure', time: '10:30 AM', category: 'activity', completed: false },
  { id: 'sch_3', title: 'Afternoon Hydration (Warm Lemon Water)', time: '02:00 PM', category: 'hydration', completed: false },
  { id: 'sch_4', title: 'Evening Brain Fitness Game', time: '05:00 PM', category: 'activity', completed: false }
];

let patientTelemetry: PatientTelemetry = {
  patientId: 'patient_david_001',
  profile: culturalProfile,
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
};

let caregiverRequests: CaregiverRequest[] = [
  {
    id: 'req_1',
    title: 'Morning Blood Pressure Medication',
    description: 'Please take 1 tablet of Amlodipine with full glass of water.',
    scheduledTime: '08:00 AM',
    type: 'medication',
    status: 'completed',
    sentAt: new Date(Date.now() - 14400000).toISOString()
  },
  {
    id: 'req_2',
    title: 'Afternoon Hydration Check',
    description: 'Drink 250ml of warm lemon water.',
    scheduledTime: '02:00 PM',
    type: 'hydration',
    status: 'pending',
    sentAt: new Date(Date.now() - 1800000).toISOString()
  }
];

let messages: VoiceMessage[] = [
  {
    id: 'msg_1',
    sender: 'caregiver',
    recipient: 'patient',
    text: 'Good morning David Kaka! I left your fresh fruits on the table. Have a wonderful day!',
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    read: true
  },
  {
    id: 'msg_2',
    sender: 'patient',
    recipient: 'caregiver',
    text: 'Thank you Sarah bitia! Kai helped me recall my morning routine today.',
    timestamp: new Date(Date.now() - 10800000).toISOString(),
    read: true
  }
];

// Fallback intelligent responder when Gemini API key is not configured or offline
function generateLocalFallbackResponse(
  prompt: string,
  profile: CulturalProfile,
  language = 'en',
  locationAddress = 'Guwahati Town Center, Assam'
): { text: string } {
  const lower = prompt.toLowerCase();
  const name = profile.patientName || 'David';
  const honorific = profile.honorific && !name.includes(profile.honorific) ? `${name} ${profile.honorific}` : name;
  const langCode = (language || 'en').toLowerCase();

  const isHindi = langCode === 'hi' || /[\u0900-\u097F]/.test(prompt) || lower.includes('kahan') || lower.includes('yaad') || lower.includes('kaun');
  const isAssamese = langCode === 'as';
  const isManipuri = langCode === 'mn' || langCode === 'mni';
  const isBengali = langCode === 'bn' || /[\u0980-\u09FF]/.test(prompt);

  // 1. Where Am I Intent
  if (lower.includes('where am i') || lower.includes('kahan') || lower.includes('location') || lower.includes('place') || lower.includes('outside')) {
    if (isHindi) {
      return { text: `(tone: reassuring) ${honorific}, आप ${locationAddress} में बिल्कुल सुरक्षित हैं। (pause) आपका परिवार पास ही है और सब कुछ शांत है।` };
    }
    if (isAssamese) {
      return { text: `(tone: reassuring) আপুনি ${locationAddress}ত সম্পূৰ্ণ সুৰক্ষিতভাৱে আছে, ${honorific}। (pause) সকলো শান্তি আৰু নিৰাপদ।` };
    }
    return { text: `(tone: reassuring) You are right at ${locationAddress}, ${honorific}. (pause) You are safe and your family is nearby.` };
  }

  // 2. Identity / Confusion Intent
  if (lower.includes('who am i') || lower.includes('kaun') || lower.includes('my name') || lower.includes('forget') || lower.includes('confused')) {
    if (isHindi) {
      return { text: `(tone: reassuring) आप ${honorific} हैं। (pause) मैं आपकी स्नेही साथी काई हूँ। आप अपने घर पर सुरक्षित हैं और आपकी बेटी सारा आपसे बहुत प्यार करती है।` };
    }
    return { text: `(tone: reassuring) You are ${honorific}, a respected retired mathematics teacher. (pause) I am Kai, your devoted companion. You are completely safe.` };
  }

  // 3. Memories / Photo Intent
  if (lower.includes('photo') || lower.includes('memory') || lower.includes('tasveer') || lower.includes('picture') || lower.includes('daughter') || lower.includes('sarah')) {
    return {
      text: isHindi
        ? `(tone: warm) ${honorific}, यह रही सारा के ग्रेजुएशन की प्यारी तस्वीर। (pause) सारा आपसे बहुत प्यार करती है।`
        : `(tone: warm) Here is a cherished photograph of Sarah's graduation, ${honorific}. (pause) It brings back such joyful memories.`
    };
  }

  // 4. Caregiver Voice Note Intent
  if (lower.includes('message') || lower.includes('voice') || lower.includes('note') || lower.includes('sandesh')) {
    return {
      text: isHindi
        ? `(tone: gentle) सारा का वॉयस मैसेज बजाया जा रहा है, ${honorific}। (pause) कृपया ध्यान से सुनें।`
        : `(tone: gentle) Playing Sarah's voice note for you now, ${honorific}. (pause) She sends her love.`
    };
  }

  // 5. Schedule / Routine Intent
  if (lower.includes('schedule') || lower.includes('routine') || lower.includes('dawa') || lower.includes('medicine') || lower.includes('time') || lower.includes('today')) {
    return {
      text: isHindi
        ? `(tone: warm) आज की दिनचर्या में सारा ने आपका बीपी दवा और गार्डन वॉक तय किया है, ${honorific}।`
        : `(tone: warm) Today on your schedule, you have your gentle garden walk and morning tea, ${honorific}.`
    };
  }

  // Default Greeting
  if (isHindi) {
    return { text: `(tone: warm) नमस्ते ${honorific}! (pause) मैं आपकी साथी काई हूँ। मैं आपको ध्यान से सुन रही हूँ। आप जो भी कहना चाहें, निःसंकोच कहें।` };
  }
  if (isAssamese) {
    return { text: `(tone: warm) নমস্কাৰ ${honorific}! (pause) মই আপোনাৰ সংগী কাই। মই আপোনাৰ ওচৰতেই আছোঁ।` };
  }
  return { text: `(tone: warm) Hello ${honorific}! (pause) I am Kai, your gentle voice companion. I am right here by your side. How can I brighten your day?` };
}

// Universal Multilingual TTS Audio Stream Endpoint
app.get('/api/tts', async (req: Request, res: Response) => {
  const text = req.query.text as string;
  const lang = (req.query.lang as string) || 'en';

  if (!text) {
    return res.status(400).send('Text parameter is required');
  }

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
    as: 'as', mni: 'mni', bn: 'bn', hi: 'hi', ta: 'ta', te: 'te',
    kn: 'kn', ml: 'ml', mr: 'mr', gu: 'gu', pa: 'pa', ur: 'ur', en: 'en'
  };
  const targetLang = langMap[lang.toLowerCase()] || lang.split('-')[0].toLowerCase() || 'en';

  try {
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(clean.slice(0, 200))}&tl=${targetLang}&client=tw-ob`;
    const response = await fetch(ttsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      const fallbackUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(clean.slice(0, 200))}&tl=en&client=tw-ob`;
      const fallbackRes = await fetch(fallbackUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      const buffer = await fallbackRes.arrayBuffer();
      res.setHeader('Content-Type', 'audio/mpeg');
      return res.send(Buffer.from(buffer));
    }

    const buffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    return res.send(Buffer.from(buffer));
  } catch (err: any) {
    console.error('[TTS Stream] Error:', err.message);
    res.status(500).json({ error: 'TTS audio streaming failed' });
  }
});

// Kai AI Chat Endpoint
app.post('/api/ai/chat', async (req: Request, res: Response) => {
  const { prompt, language = 'en', honorific = 'Kaka', history = [] } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const ai = getAIClient();
  if (!ai) {
    const fallback = generateLocalFallbackResponse(prompt, culturalProfile, language, patientTelemetry.currentLocation.address);
    return res.json({ response: fallback.text });
  }

  try {
    const patientName = culturalProfile.patientName || 'David';
    const displayHonorific = honorific && !patientName.includes(honorific) ? `${patientName} ${honorific}` : patientName;

    const memoriesList = memoriesBank.map((m) => `- "${m.title}": ${m.description} (${m.date})`).join('\n');
    const scheduleList = scheduleEvents.map((s) => `- At ${s.time}: ${s.title} (${s.completed ? 'Completed' : 'Pending'})`).join('\n');

    const systemInstruction = `You are Kai, a loving, empathetic, and gentle AI voice companion designed for a dementia patient named ${displayHonorific}.
CULTURAL & ETHNIC PROFILE:
- Respectful Honorific: Address patient respectfully as "${displayHonorific}".
- Profession / Background: ${culturalProfile.profession}.
- Hobbies: ${culturalProfile.hobbies.join(', ')}.
- Key Memories: ${culturalProfile.keyMemories.join(', ')}.
- Current GPS Location: ${patientTelemetry.currentLocation.address}.
- Safe Zone Status: ${patientTelemetry.geofenceStatus === 'safe' ? 'INSIDE safe home zone' : 'BOUNDARY ALERT'}.

MEMORIES AVAILABLE:
${memoriesList}

TODAY'S SCHEDULE:
${scheduleList}

MANDATORY RULES:
1. Speak in very simple, comforting, short sentences (1 to 3 sentences maximum).
2. Respond strictly in the language code '${language}' or the language the user speaks.
3. Use prosody tags at start: (tone: warm) or (tone: gentle) or (tone: reassuring).
4. If the user asks where they are, reassure them that they are at ${patientTelemetry.currentLocation.address} and completely safe.
5. If the user asks about photos or memories, reminisce warmly about Sarah or Jorhat tea gardens.`;

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

    const modelsToTry = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-2.5-pro'
    ];

    let replyText = '';
    for (const modelName of modelsToTry) {
      try {
        const result = await ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });
        if (result && result.text) {
          replyText = result.text;
          break;
        }
      } catch (mErr: any) {
        console.warn(`[Gemini] Model ${modelName} attempt: ${mErr.message}. Trying next...`);
      }
    }

    if (!replyText) {
      const fallback = generateLocalFallbackResponse(prompt, culturalProfile, language, patientTelemetry.currentLocation.address);
      replyText = fallback.text;
    }

    res.json({ response: replyText });
  } catch (error: any) {
    console.warn('[Gemini AI] Switching to local fallback:', error.message);
    const fallback = generateLocalFallbackResponse(prompt, culturalProfile, language, patientTelemetry.currentLocation.address);
    res.json({ response: fallback.text });
  }
});

// WebSocket Gateway
interface ExtendedWebSocket extends WebSocket {
  clientRole?: 'patient' | 'caregiver';
}
const connectedClients = new Set<ExtendedWebSocket>();

function broadcast(event: string, data: any) {
  const payload = JSON.stringify({ event, data, timestamp: new Date().toISOString() });
  connectedClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

wss.on('connection', (ws: ExtendedWebSocket) => {
  connectedClients.add(ws);
  ws.send(JSON.stringify({
    event: 'INIT_STATE',
    data: {
      telemetry: patientTelemetry,
      profile: culturalProfile,
      memories: memoriesBank,
      voiceNotes: voiceNotesBank,
      schedule: scheduleEvents,
      requests: caregiverRequests,
      messages
    }
  }));

  ws.on('message', (messageRaw: string) => {
    try {
      const parsed = JSON.parse(messageRaw.toString());
      const { event, data } = parsed;

      if (event === 'REGISTER_ROLE') {
        ws.clientRole = data.role;
      } else if (event === 'CALL_SIGNAL') {
        if (data.type === 'offer') patientTelemetry.activeCallState = 'ringing';
        else if (data.type === 'answer') patientTelemetry.activeCallState = 'connected';
        else if (data.type === 'end' || data.type === 'reject') patientTelemetry.activeCallState = 'idle';

        broadcast('CALL_SIGNAL', data);
        broadcast('TELEMETRY_UPDATE', patientTelemetry);
      } else if (event === 'LOCATION_UPDATE') {
        patientTelemetry.currentLocation = data.location;
        broadcast('TELEMETRY_UPDATE', patientTelemetry);
      }
    } catch (err) {
      console.error('[WebSocket] Message Error:', err);
    }
  });

  ws.on('close', () => {
    connectedClients.delete(ws);
  });
});

// REST Endpoints for Caregiver Management
app.get('/api/health', (req, res) => res.json({ status: 'ok', activeClients: connectedClients.size }));
app.get('/api/telemetry', (req, res) => res.json(patientTelemetry));
app.get('/api/memories', (req, res) => res.json(memoriesBank));
app.get('/api/schedule', (req, res) => res.json(scheduleEvents));
app.get('/api/requests', (req, res) => res.json(caregiverRequests));
app.get('/api/messages', (req, res) => res.json(messages));

app.post('/api/profile/update', (req, res) => {
  culturalProfile = { ...culturalProfile, ...req.body };
  patientTelemetry.profile = culturalProfile;
  broadcast('PROFILE_UPDATE', culturalProfile);
  broadcast('TELEMETRY_UPDATE', patientTelemetry);
  res.json({ success: true, profile: culturalProfile });
});

app.post('/api/memories/add', (req, res) => {
  const newItem: MemoryItem = {
    id: 'mem_' + Date.now(),
    title: req.body.title,
    description: req.body.description,
    imageUrl: req.body.imageUrl || 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&auto=format&fit=crop&q=80',
    date: req.body.date || 'Recent',
    category: req.body.category || 'Family'
  };
  memoriesBank.unshift(newItem);
  broadcast('MEMORIES_UPDATE', memoriesBank);
  res.json({ success: true, memory: newItem });
});

app.post('/api/telemetry/game-score', (req, res) => {
  const scoreEntry: GameScoreEntry = {
    gameId: req.body.gameId,
    gameTitle: req.body.gameTitle,
    score: req.body.score,
    maxScore: req.body.maxScore || 100,
    latencyMs: req.body.latencyMs || 2000,
    timestamp: new Date().toISOString()
  };
  patientTelemetry.recentGameScores.unshift(scoreEntry);
  if (patientTelemetry.recentGameScores.length > 25) patientTelemetry.recentGameScores.pop();

  const avgScore = patientTelemetry.recentGameScores.reduce((acc, s) => acc + s.score, 0) / patientTelemetry.recentGameScores.length;
  patientTelemetry.cognitiveIndex = Math.round(avgScore);
  patientTelemetry.riskLevel = patientTelemetry.cognitiveIndex > 80 ? 'Low' : patientTelemetry.cognitiveIndex > 60 ? 'Moderate' : 'Elevated';

  broadcast('TELEMETRY_UPDATE', patientTelemetry);
  res.json({ success: true, telemetry: patientTelemetry });
});

app.post('/api/requests/create', (req, res) => {
  const newReq: CaregiverRequest = {
    id: 'req_' + Date.now(),
    title: req.body.title,
    description: req.body.description,
    scheduledTime: req.body.scheduledTime || 'Immediate',
    type: req.body.type || 'medication',
    status: 'delivered',
    sentAt: new Date().toISOString()
  };
  caregiverRequests.unshift(newReq);
  broadcast('CAREGIVER_REQUEST', newReq);
  res.json({ success: true, request: newReq });
});

app.post('/api/requests/:id/complete', (req, res) => {
  const target = caregiverRequests.find((r) => r.id === req.params.id);
  if (target) {
    target.status = 'completed';
    broadcast('REQUEST_COMPLETED', target);
    res.json({ success: true, request: target });
  } else {
    res.status(404).json({ error: 'Request not found' });
  }
});

app.post('/api/messages/send', (req, res) => {
  const newMsg: VoiceMessage = {
    id: 'msg_' + Date.now(),
    sender: req.body.sender || 'caregiver',
    recipient: req.body.recipient || 'patient',
    text: req.body.text,
    timestamp: new Date().toISOString(),
    read: false
  };
  messages.push(newMsg);
  broadcast('NEW_MESSAGE', newMsg);
  res.json({ success: true, message: newMsg });
});

server.listen(PORT, () => {
  console.log(`🚀 CogniCare Shared Mobile Backend running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket Gateway live on ws://localhost:${PORT}`);
});
