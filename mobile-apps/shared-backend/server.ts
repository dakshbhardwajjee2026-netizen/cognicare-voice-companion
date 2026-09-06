import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PatientTelemetry, CaregiverRequest, VoiceMessage, CallSignal, GameScoreEntry } from './types.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Gemini AI Client
const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// In-Memory Real-Time State
let patientTelemetry: PatientTelemetry = {
  patientId: 'patient_david_001',
  patientName: 'David Kaka',
  cognitiveIndex: 82,
  riskLevel: 'Low',
  disorientationIndex: 15,
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
    { gameId: 'mem_match', gameTitle: 'Memory Match', score: 85, maxScore: 100, latencyMs: 2400, timestamp: new Date(Date.now() - 3600000).toISOString() },
    { gameId: 'what_changed', gameTitle: 'What Changed?', score: 90, maxScore: 100, latencyMs: 1900, timestamp: new Date(Date.now() - 1800000).toISOString() },
    { gameId: 'routine_recall', gameTitle: 'Daily Routine Recall', score: 80, maxScore: 100, latencyMs: 3100, timestamp: new Date().toISOString() }
  ],
  activeCallState: 'idle',
  batteryLevel: 94,
  isSleepMode: false
};

let caregiverRequests: CaregiverRequest[] = [
  {
    id: 'req_1',
    title: 'Morning Blood Pressure Medication',
    description: 'Please take 1 tablet of Amlodipine with full glass of water.',
    scheduledTime: '09:00 AM',
    type: 'medication',
    status: 'delivered',
    sentAt: new Date(Date.now() - 7200000).toISOString()
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

// Connected WebSocket Clients
interface ExtendedWebSocket extends WebSocket {
  clientRole?: 'patient' | 'caregiver';
}
const connectedClients = new Set<ExtendedWebSocket>();

function broadcast(event: string, data: any) {
  const payload = JSON.stringify({ event, data, timestamp: new Date().toISOString() });
  connectedClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// WebSocket Connection Manager
wss.on('connection', (ws: ExtendedWebSocket) => {
  connectedClients.add(ws);
  console.log('[WebSocket] Client connected. Total:', connectedClients.size);

  // Send initial state snapshot on connect
  ws.send(JSON.stringify({ event: 'INIT_STATE', data: { telemetry: patientTelemetry, requests: caregiverRequests, messages } }));

  ws.on('message', (messageRaw: string) => {
    try {
      const parsed = JSON.parse(messageRaw.toString());
      const { event, data } = parsed;

      if (event === 'REGISTER_ROLE') {
        ws.clientRole = data.role;
        console.log(`[WebSocket] Client registered as ${data.role}`);
      } else if (event === 'CALL_SIGNAL') {
        console.log(`[WebSocket] Call signal (${data.type}) from ${data.caller} to ${data.recipient}`);
        if (data.type === 'offer') patientTelemetry.activeCallState = 'ringing';
        else if (data.type === 'answer') patientTelemetry.activeCallState = 'connected';
        else if (data.type === 'end' || data.type === 'reject') patientTelemetry.activeCallState = 'idle';

        broadcast('CALL_SIGNAL', data);
        broadcast('TELEMETRY_UPDATE', patientTelemetry);
      } else if (event === 'LOCATION_UPDATE') {
        patientTelemetry.currentLocation = data.location;
        const distanceMeters = calculateDistanceMeters(
          patientTelemetry.currentLocation.lat,
          patientTelemetry.currentLocation.lng,
          patientTelemetry.safeZoneCenter.lat,
          patientTelemetry.safeZoneCenter.lng
        );
        if (distanceMeters > patientTelemetry.geofenceRadiusMeters) {
          patientTelemetry.geofenceStatus = 'boundary_alert';
          broadcast('GEOFENCE_ALERT', { distanceMeters, radius: patientTelemetry.geofenceRadiusMeters, location: patientTelemetry.currentLocation });
        } else {
          patientTelemetry.geofenceStatus = 'safe';
        }
        broadcast('TELEMETRY_UPDATE', patientTelemetry);
      }
    } catch (err) {
      console.error('[WebSocket] Error handling message:', err);
    }
  });

  ws.on('close', () => {
    connectedClients.delete(ws);
    console.log('[WebSocket] Client disconnected.');
  });
});

function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// REST Endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', activeClients: connectedClients.size, timestamp: new Date() });
});

app.get('/api/telemetry', (req, res) => {
  res.json(patientTelemetry);
});

app.post('/api/telemetry/update', (req, res) => {
  const updates = req.body;
  patientTelemetry = { ...patientTelemetry, ...updates, lastActiveTime: new Date().toISOString() };
  broadcast('TELEMETRY_UPDATE', patientTelemetry);
  res.json({ success: true, telemetry: patientTelemetry });
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
  if (patientTelemetry.recentGameScores.length > 20) patientTelemetry.recentGameScores.pop();

  const avgScore = patientTelemetry.recentGameScores.reduce((acc, s) => acc + s.score, 0) / patientTelemetry.recentGameScores.length;
  patientTelemetry.cognitiveIndex = Math.round(avgScore);
  patientTelemetry.riskLevel = patientTelemetry.cognitiveIndex > 75 ? 'Low' : patientTelemetry.cognitiveIndex > 50 ? 'Moderate' : 'Elevated';

  broadcast('TELEMETRY_UPDATE', patientTelemetry);
  res.json({ success: true, telemetry: patientTelemetry });
});

app.get('/api/requests', (req, res) => {
  res.json(caregiverRequests);
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
  const { id } = req.params;
  const target = caregiverRequests.find(r => r.id === id);
  if (target) {
    target.status = 'completed';
    broadcast('REQUEST_COMPLETED', target);
    res.json({ success: true, request: target });
  } else {
    res.status(404).json({ error: 'Request not found' });
  }
});

app.get('/api/messages', (req, res) => {
  res.json(messages);
});

app.post('/api/messages/send', (req, res) => {
  const newMsg: VoiceMessage = {
    id: 'msg_' + Date.now(),
    sender: req.body.sender || 'caregiver',
    recipient: req.body.recipient || 'patient',
    text: req.body.text,
    audioUrl: req.body.audioUrl,
    timestamp: new Date().toISOString(),
    read: false
  };
  messages.push(newMsg);
  broadcast('NEW_MESSAGE', newMsg);
  res.json({ success: true, message: newMsg });
});

app.post('/api/ai/chat', async (req, res) => {
  const { prompt, language = 'English', honorific = 'Kaka' } = req.body;
  try {
    if (!genAI) {
      return res.json({
        response: `Namaste ${honorific}! I am Kai, your voice companion. I am right here with you. Everything is safe.`
      });
    }
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(
      `You are Kai, an empathetic AI voice companion for a dementia patient named David (${honorific}).
Speak in very simple, reassuring, short sentences (1-3 sentences max).
Respond in ${language}.
Patient query: "${prompt}"`
    );
    const response = await result.response;
    const text = response.text() || `Namaste ${honorific}! I am here to help you.`;
    res.json({ response: text });
  } catch (error: any) {
    console.error('[Gemini AI] Error:', error);
    res.json({
      response: `Namaste ${honorific}! I am right here with you. Everything is safe and calm.`
    });
  }
});

server.listen(PORT, () => {
  console.log(`🚀 CogniCare Mobile Sync Backend running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server live on ws://localhost:${PORT}`);
});
