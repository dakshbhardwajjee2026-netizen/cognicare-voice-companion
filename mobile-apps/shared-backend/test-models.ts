import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env.local' });
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
});

const models = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-flash-latest',
  'gemini-3.6-flash'
];

async function run() {
  console.log('Testing with API key:', apiKey.slice(0, 10));
  for (const m of models) {
    const t0 = Date.now();
    try {
      const res = await ai.models.generateContent({
        model: m,
        contents: 'Say hello in 3 words'
      });
      console.log(`[OK] ${m}: ${Date.now() - t0}ms -> "${res.text?.trim()}"`);
    } catch (err: any) {
      console.log(`[FAIL] ${m}: ${Date.now() - t0}ms -> ${err.message?.slice(0, 80)}`);
    }
  }
}

run();
