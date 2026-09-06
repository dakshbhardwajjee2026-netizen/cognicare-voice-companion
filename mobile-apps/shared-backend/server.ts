import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
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

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const PORT = 3001;
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Gemini AI Client
const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Initial Cultural Profile
let culturalProfile: CulturalProfile = {
  language: 'en',
  honorific: 'Kaka',
  patientName: 'David Kaka',
  age: 74,
  profession: 'Retired Mathematics Teacher',
  hobbies: ['Gardening', 'Classical Music', 'Solving Puzzles'],
  keyMemories: ['Married to Sunita in 1978', 'Taught at Guwahati High School for 32 years']
};

// Initial Memories Bank
let memoriesBank: MemoryItem[] = [
  {
    id: 'mem_1',
    title: 'Daughter Sarah Graduation',
    description: 'Sarah graduating from Guwahati University in 2012.',
    imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&auto=format&fit=crop&q=80',
    date: 'June 2012',
    category: 'Family'
  },
  {
    id: 'mem_2',
    title: 'Tea Garden Vacation in Assam',
    description: 'Family trip to Jorhat tea estates during autumn.',
    imageUrl: 'https://images.unsplash.com/photo-1588613254378-011e0c25a1cb?w=600&auto=format&fit=crop&q=80',
    date: 'October 2018',
    category: 'Travel'
  }
];

// Initial Voice Notes Bank
let voiceNotesBank: VoiceNoteItem[] = [
  {
    id: 'vn_1',
    senderName: 'Sarah (Daughter)',
    message: 'Good morning Papa! Reminding you to take your morning tea and walk in the garden. I love you!',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    played: true
  }
];

// Initial Schedule Events
let scheduleEvents: ScheduleEventItem[] = [
  { id: 'sch_1', title: 'Morning Blood Pressure Medication', time: '08:00 AM', category: 'medication', completed: true },
  { id: 'sch_2', title: 'Garden Walk & Sun Exposure', time: '10:30 AM', category: 'activity', completed: false },
  { id: 'sch_3', title: 'Afternoon Hydration (Warm Water)', time: '02:00 PM', category: 'hydration', completed: false },
  { id: 'sch_4', title: 'Evening Brain Fitness Game', time: '05:00 PM', category: 'activity', completed: false }
];

// In-Memory Real-Time State
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

// WebSocket Clients & Broadcast
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
      console.error('[WebSocket] Error:', err);
    }
  });

  ws.on('close', () => {
    connectedClients.delete(ws);
  });
});

// REST API Endpoints
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

app.post('/api/ai/chat', async (req, res) => {
  const { prompt, language = 'en', honorific = 'Kaka' } = req.body;
  try {
    if (!genAI) {
      return res.json({
        response: `(tone: warm) Hello ${honorific}! I am Kai, your gentle companion. I am right here with you.`
      });
    }
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(
      `You are Kai, an empathetic AI voice companion for a dementia patient named David (${honorific}).
Format: (tone: warm) Speak in very simple, short sentences (1-3 sentences max).
Language: Respond in language code ${language}.
Patient prompt: "${prompt}"`
    );
    const response = await result.response;
    const text = response.text() || `(tone: gentle) Namaste ${honorific}! I am right here by your side.`;
    res.json({ response: text });
  } catch (error: any) {
    res.json({ response: `(tone: gentle) Namaste ${honorific}! Everything is calm and safe.` });
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Mobile Sync Backend running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket Gateway live on ws://localhost:${PORT}`);
});
