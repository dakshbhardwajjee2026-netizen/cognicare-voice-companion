import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env.local' });
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
});

const candidates = [
  'gemini-2.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-3.6-flash'
];

async function bench() {
  for (const m of candidates) {
    const t0 = Date.now();
    try {
      const res = await ai.models.generateContent({
        model: m,
        contents: 'Say one comforting sentence for dementia patient David',
        config: { temperature: 0.7, maxOutputTokens: 60 }
      });
      console.log(`[SPEED] ${m}: ${Date.now() - t0}ms -> "${res.text?.trim()}"`);
    } catch (e: any) {
      console.log(`[FAIL] ${m}: ${Date.now() - t0}ms -> ${e.message?.slice(0, 100)}`);
    }
  }
}

bench();
