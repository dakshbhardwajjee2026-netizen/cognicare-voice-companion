import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env.local' });
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
});

async function run() {
  try {
    const list = await ai.models.list();
    console.log('Available models:');
    for await (const m of list) {
      if (m.name?.includes('gemini') && m.supportedActions?.includes('generateContent')) {
        console.log(`- ${m.name}`);
      }
    }
  } catch (err: any) {
    console.error('List error:', err.message);
  }
}

run();
