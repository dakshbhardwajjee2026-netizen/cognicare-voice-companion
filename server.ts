import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { initDatabase, getAllPatients, getPatientById, savePatient, deletePatient } from './database';

dotenv.config({ path: '.env.local' });
dotenv.config();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

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

// Linguistic Script & Language Detection Engine
function detectSpokenLanguage(prompt: string, fallbackLang = 'en'): { langCode: string; langName: string; isIndic: boolean } {
  const text = (prompt || '').trim();
  const lower = text.toLowerCase();

  // 1. Unicode Script Matching
  if (/[\u0900-\u097F]/.test(text)) {
    const isMarathi = /\b(आहे|नाही|कसा|कशी|कुठे|काय|आम्ही|भीती)\b/.test(text);
    return isMarathi ? { langCode: 'mr', langName: 'Marathi (मराठी)', isIndic: true } : { langCode: 'hi', langName: 'Hindi (हिन्दी)', isIndic: true };
  }
  if (/[\u0980-\u09FF]/.test(text)) {
    const isAssamese = /[\u09F0\u09F1]/.test(text) || text.includes('আপুনি');
    return isAssamese ? { langCode: 'as', langName: 'Assamese (অসমীয়া)', isIndic: true } : { langCode: 'bn', langName: 'Bengali (বাংলা)', isIndic: true };
  }
  if (/[\u0A80-\u0AFF]/.test(text)) return { langCode: 'gu', langName: 'Gujarati (ગુજરાતી)', isIndic: true };
  if (/[\u0A00-\u0A7F]/.test(text)) return { langCode: 'pa', langName: 'Punjabi (ਪੰਜਾਬੀ)', isIndic: true };
  if (/[\u0B80-\u0BFF]/.test(text)) return { langCode: 'ta', langName: 'Tamil (தமிழ்)', isIndic: true };
  if (/[\u0C00-\u0C7F]/.test(text)) return { langCode: 'te', langName: 'Telugu (తెలుగు)', isIndic: true };
  if (/[\u0C80-\u0CFF]/.test(text)) return { langCode: 'kn', langName: 'Kannada (ಕನ್ನಡ)', isIndic: true };
  if (/[\u0D00-\u0D7F]/.test(text)) return { langCode: 'ml', langName: 'Malayalam (മലയാളം)', isIndic: true };
  if (/[\u0B00-\u0B7F]/.test(text)) return { langCode: 'or', langName: 'Odia (ଓଡ଼ିଆ)', isIndic: true };
  if (/[\u0600-\u06FF]/.test(text)) return { langCode: 'ur', langName: 'Urdu (اردو)', isIndic: true };

  // 2. Strict Word-Boundary Token Matching for Romanized / Code-Mixed Speech
  const englishTokens = /\b(who|where|what|when|why|how|please|tell|play|voice|note|message|memory|photo|picture|schedule|daughter|family|friend|time|today|doctor|call|help|feel|feeling|scared|confused|lost|good|safe|right|now|hello|hi|hey|name|am|is|are|you|me|my|mine|i)\b/i;
  const hindiTokens = /\b(kaun|kahan|kidhar|kya|kyun|kaise|mera|meri|mere|mujhe|mujhko|dawa|dawai|beti|beta|namaste|dar|yaad|tasveer|batao|bataiye|chalo|madad|theek|bolo|sunao|chahiye|aayegi|aayega|dekho|kripya|hoon|hai|hain|karta|karte|karti|raho|rahe|kuch|nahi|nahin|ghar|pani|bhookh)\b/i;
  const gujaratiTokens = /\b(kem|cho|majama|bhaai|bhai|ben|tamaru|aaje|mane|thodo|dar|chhokri|chhokro|aavjo|nathi|su|sarasa|kutumb)\b/i;
  const marathiTokens = /\b(kuthe|ahe|kasa|kashi|kay|aamhi|namaskar|kashe|bhiti|ghari|dawa)\b/i;
  const bengaliTokens = /\b(kothay|aachen|bhalo|aami|tumi|ki|naam|kemon|bari)\b/i;

  const hasHindi = hindiTokens.test(lower);
  const hasGujarati = gujaratiTokens.test(lower);
  const hasMarathi = marathiTokens.test(lower);
  const hasBengali = bengaliTokens.test(lower);
  const hasEnglish = englishTokens.test(lower);

  if (hasHindi && !hasEnglish) return { langCode: 'hi', langName: 'Hindi (हिन्दी)', isIndic: true };
  if (hasGujarati) return { langCode: 'gu', langName: 'Gujarati (ગુજરાતી)', isIndic: true };
  if (hasMarathi) return { langCode: 'mr', langName: 'Marathi (मराठी)', isIndic: true };
  if (hasBengali) return { langCode: 'bn', langName: 'Bengali (বাংলা)', isIndic: true };
  if (hasHindi && hasEnglish) return { langCode: 'hi', langName: 'Hindi (Hinglish)', isIndic: true };
  if (hasEnglish) return { langCode: 'en', langName: 'English', isIndic: false };

  // Fallback to active language selection
  const fb = (fallbackLang || 'en').toLowerCase();
  return {
    langCode: fb,
    langName: LANGUAGE_NAME_MAP[fb] || fb.toUpperCase(),
    isIndic: fb !== 'en' && fb !== 'es' && fb !== 'fr' && fb !== 'de' && fb !== 'zh' && fb !== 'ja',
  };
}

// Multi-Category Intelligent NLP Fallback Engine (when AI API is offline or quota exceeded)
function generateLocalFallbackResponse(
  prompt: string,
  patientData: any,
  language = 'en',
  locationInfo?: any
): { text: string; functionCalls?: any[] } {
  const lower = (prompt || '').toLowerCase().trim();
  const name = patientData?.profile?.name || 'friend';
  const cultural = patientData?.culturalProfile || { honorificTitle: 'Ji', ethnicBackground: 'Indian' };
  const honorific = cultural.honorificTitle ? `${name} ${cultural.honorificTitle}` : name;

  const memories = patientData?.memories || [];
  const schedule = patientData?.schedule || [];
  const familyMembers = patientData?.familyMembers || [];
  const familyNames = familyMembers.map((m: any) => m.name).join(', ') || 'Sarah, Maria, Michael';

  // Determine language accurately from input text or selected language
  const { langCode } = detectSpokenLanguage(prompt, language);

  // Helper for regex escaping
  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // 1. Memory Loss, Disorientation, Confusion & Identity Grounding (CRITICAL DEMENTIA INTENT)
  const isMemoryLossOrIdentity = /\b(cannot remember|can't remember|cant remember|don't remember|dont remember|not remember|remember anything|remember nothing|no memory|lost my memory|forget|forgot|forgotten|confused|who am i|my name|who i am|who are you|where am i|lost|help me remember|tell me about me|kuch yaad nahi|kuch bhi yaad|yaad nahi|yad nahin|bhool gaya|bhul gaya|kaun hun|kaun hu|kon hu|kon|naam kya|naam ki|kavaru)\b/i.test(lower);
  if (isMemoryLossOrIdentity) {
    if (langCode === 'hi') {
      return { text: `(tone: reassuring) आप ${honorific} हैं। (pause) मैं आपकी सौम्य साथी काई हूँ। आप अपने घर पर बिल्कुल सुरक्षित हैं। आपका परिवार, जैसे ${familyNames}, आपसे बहुत प्यार करता है और हमेशा आपके साथ है।` };
    }
    if (langCode === 'gu') {
      return { text: `(tone: reassuring) તમે ${honorific} છો। (pause) હું તમારી પ્રેમાળ સાથી કાઈ છું। તમારો પરિવાર, જેમ કે ${familyNames}, તમને ખૂબ પ્રેમ કરે છે અને તમે ઘરમાં સુરક્ષિત છો।` };
    }
    if (langCode === 'mr') {
      return { text: `(tone: reassuring) तुम्ही ${honorific} आहात। (pause) मी तुमची सोबती काई आहे। तुमचे कुटुंब ${familyNames} तुमच्यावर खूप प्रेम करते। तुम्ही घरी सुरक्षित आहात।` };
    }
    if (langCode === 'bn') {
      return { text: `(tone: reassuring) আপনি হলেন ${honorific}। (pause) আমি আপনার সাথী কাই। আপনার পরিবার ${familyNames} আপনাকে খুব ভালোবাসে। আপনি ঘরে নিরাপদ আছেন।` };
    }
    return { text: `(tone: reassuring) You are ${honorific}. (pause) I am Kai, your devoted voice companion. You are completely safe and comfortable at home. Your loving family, including ${familyNames}, loves you deeply and is right by your side.` };
  }

  // 2. Where Am I / Location Intent
  const isWhereAmI = /\b(where am i|location|place|outside|park|kahan|kahan hun|kidhar|kuthe|kothay|yenga|ekkada)\b/i.test(lower);
  if (isWhereAmI) {
    const loc = locationInfo?.locationDetails;
    const placeName = loc ? `${loc.neighborhood}, ${loc.city}` : 'your home safe area';
    const landmarks = loc?.nearbyLandmarks?.length ? loc.nearbyLandmarks.slice(0, 2).join(' and ') : 'the local garden and walkway';

    if (langCode === 'hi') {
      return { text: `(tone: reassuring) ${honorific}, आप अपने घर के पास ${placeName} में बिल्कुल सुरक्षित हैं। (pause) आपके पास ${landmarks} हैं। सब कुछ शांत है।` };
    }
    if (langCode === 'gu') {
      return { text: `(tone: reassuring) ${honorific}, તમે તમારા ઘર નજીક ${placeName} માં બિલકુલ સુરક્ષિત છો। (pause) ચિંતા ના કરશો, બધું શાંત છે।` };
    }
    return { text: `(tone: reassuring) You are right near ${placeName}, ${honorific}. (pause) Nearby you have ${landmarks}. You are completely safe and peaceful.` };
  }

  // 3. JOKES & HUMOR (Out-of-Context Open Domain)
  const isJoke = /\b(joke|chutkula|chutkule|hasao|funny|laugh|hasi|mazak|latifa|hasvaanu|make me laugh)\b/i.test(lower);
  if (isJoke) {
    if (langCode === 'hi') {
      return { text: `(tone: warm) डॉक्टर ने पूछा: कैसी तबीयत है? (pause) मरीज बोला: पहले से ज्यादा लोग देखने आ रहे हैं! (pause) उम्मीद है आपके चेहरे पर मुस्कान आई, ${honorific}।` };
    }
    if (langCode === 'gu') {
      return { text: `(tone: warm) પત્ની: તમે મને ક્યારેય બહાર નથી લઈ જતા! (pause) પતિ: ચાલ આજે ઘરની બહાર ઊભા રહીએ! (pause) સ્મિત કરતા રહો, ${honorific}!` };
    }
    return { text: `(tone: warm) Why don't flowers tell secrets? (pause) Because they have too many petals! (pause) I hope that brought a sweet smile to you, ${honorific}.` };
  }

  // 4. SONGS & LULLABIES (Out-of-Context Open Domain)
  const isSong = /\b(sing|song|songs|gaana|geet|lullaby|lori|kavita|poem|rhyme|sur|dhun|sangeet|gao|sunao)\b/i.test(lower);
  if (isSong) {
    if (langCode === 'hi') {
      return { text: `(tone: warm) "फूल खिले हैं बगिया में, खुशबू बहती हवाओं में। मन में रहे सदा आनंद, शांति बरसे इन राहों में।" (pause) यह प्यारा सा गीत खास आपके लिए, ${honorific}।` };
    }
    if (langCode === 'gu') {
      return { text: `(tone: warm) "મીઠી મધુર પવનની લહેર, સુખ શાંતિ રહે સદા ઘેર। ફૂલો મહેકે આંગણમાં, સ્નેહ ભરેલો દિલમાં।" (pause) આ શાંત ગીત તમારા માટે છે, ${honorific}।` };
    }
    return { text: `(tone: warm) "Gentle breeze and morning sun, peace and joy for everyone. Softly dancing on the trees, rest your heart in gentle peace." (pause) A soothing melody for you, ${honorific}.` };
  }

  // 5. Photos & Memories Intent (Smart Keyword & Title Matching)
  const isPhoto = /\b(photo|picture|photograph|image|pic|memory|memories|tasveer|yaad|chhavi|chitram|padam|dikhao|wedding|marriage|shadi|vivah|lagan|birthday|anniversary|picnic|garden|buddy|bike|summer|reminisce)\b/i.test(lower) || (lower.startsWith('show') && memories.length > 0);
  if (isPhoto && memories.length > 0) {
    let matchedMem = memories.find((m: any) => {
      const titleLower = (m.title || '').toLowerCase();
      const descLower = (m.descriptionForKai || '').toLowerCase();
      const catLower = (m.category || '').toLowerCase();
      const words = titleLower.split(/\s+/).filter((w: string) => w.length > 3);
      return (
        lower.includes(titleLower) ||
        words.some((w: string) => lower.includes(w)) ||
        (lower.includes('wedding') && (titleLower.includes('wedding') || titleLower.includes('marriage') || titleLower.includes('anniversary'))) ||
        (lower.includes('anniversary') && (titleLower.includes('anniversary') || titleLower.includes('wedding'))) ||
        (lower.includes('birthday') && titleLower.includes('birthday')) ||
        (lower.includes('picnic') && (titleLower.includes('picnic') || titleLower.includes('summer'))) ||
        (lower.includes('shadi') && (titleLower.includes('wedding') || titleLower.includes('anniversary'))) ||
        (lower.includes('buddy') && (titleLower.includes('buddy') || descLower.includes('buddy'))) ||
        (lower.includes('garden') && (titleLower.includes('garden') || descLower.includes('garden'))) ||
        (lower.includes('dog') && (titleLower.includes('buddy') || descLower.includes('dog'))) ||
        (lower.includes('bike') && (titleLower.includes('bike') || descLower.includes('bicycle'))) ||
        (lower.includes('lake') && titleLower.includes('lake')) ||
        (lower.includes('trip') && (titleLower.includes('trip') || catLower.includes('vacation')))
      );
    });

    if (!matchedMem) {
      matchedMem = memories[0];
    }

    if (langCode === 'hi') {
      return {
        text: `(tone: warm) ${honorific}, यह रही आपकी खास याद: ${matchedMem.title}। (pause) ${matchedMem.descriptionForKai}`,
        functionCalls: [{ name: 'showMemoryImage', args: { memoryTitle: matchedMem.title } }],
      };
    }
    if (langCode === 'gu') {
      return {
        text: `(tone: warm) ${honorific}, આ રહી તમારી ખાસ યાદ: ${matchedMem.title}। (pause) ${matchedMem.descriptionForKai}`,
        functionCalls: [{ name: 'showMemoryImage', args: { memoryTitle: matchedMem.title } }],
      };
    }
    if (langCode === 'mr') {
      return {
        text: `(tone: warm) ${honorific}, ही घ्या तुमची सुंदर आठवण: ${matchedMem.title}। (pause) ${matchedMem.descriptionForKai}`,
        functionCalls: [{ name: 'showMemoryImage', args: { memoryTitle: matchedMem.title } }],
      };
    }
    return {
      text: `(tone: warm) ${honorific}, here is a cherished photograph: ${matchedMem.title}. (pause) ${matchedMem.descriptionForKai}`,
      functionCalls: [{ name: 'showMemoryImage', args: { memoryTitle: matchedMem.title } }],
    };
  }

  // 6. Family Members & Loved Ones Inquiry Intent (Exact Name & Relationship matched)
  let matchedFamilyMember: any = null;
  // First pass: exact full name or first name match
  for (const m of familyMembers) {
    const memName = (m.name || '').toLowerCase().trim();
    const firstName = memName.split(/\s+/)[0];
    if (
      (memName && lower.includes(memName)) ||
      (firstName && firstName.length > 2 && new RegExp(`\\b${escapeRegExp(firstName)}\\b`, 'i').test(lower))
    ) {
      matchedFamilyMember = m;
      break;
    }
  }

  // Second pass: relationship match if no name matched
  if (!matchedFamilyMember) {
    for (const m of familyMembers) {
      const memRel = (m.relationship || '').toLowerCase().trim();
      const relWords = memRel.split(/[\s/]+/).filter((p: string) => p.length > 2);
      const relRegex = relWords.map((rw: string) => new RegExp(`\\b${escapeRegExp(rw)}\\b`, 'i'));
      if (relRegex.some((rx: RegExp) => rx.test(lower))) {
        matchedFamilyMember = m;
        break;
      }
    }
  }

  // Also check general family/relationship keywords if no specific member matched
  const isGeneralFamily = /\b(family|parivar|kutumb|daughter|beti|son|beta|wife|patni|husband|pati|children|bacche|poti|pota|granddaughter|grandson|dog|pet|caregiver)\b/i.test(lower);

  if (matchedFamilyMember) {
    const mem = matchedFamilyMember;
    if (langCode === 'hi') {
      return { text: `(tone: warm) ${mem.name} आपके ${mem.relationship} हैं। (pause) ${mem.descriptionForKai || `${mem.name} आपसे बहुत प्यार करते हैं और आपका हमेशा ख्याल रखते हैं।`}` };
    }
    if (langCode === 'gu') {
      return { text: `(tone: warm) ${mem.name} તમારા ${mem.relationship} છે। (pause) ${mem.descriptionForKai || `${mem.name} તમને ખૂબ પ્રેમ કરે છે અને તમારી કાળજી રાખે છે।`}` };
    }
    if (langCode === 'mr') {
      return { text: `(tone: warm) ${mem.name} तुमचे ${mem.relationship} आहेत। (pause) ${mem.descriptionForKai || `${mem.name} तुमच्यावर खूप प्रेम करतात।`}` };
    }
    if (langCode === 'bn') {
      return { text: `(tone: warm) ${mem.name} আপনার ${mem.relationship}। (pause) ${mem.descriptionForKai || `${mem.name} আপনাকে খুব ভালোবাসেন।`}` };
    }
    return { text: `(tone: warm) ${mem.name} is your ${mem.relationship}. (pause) ${mem.descriptionForKai || `${mem.name} loves you dearly and is always thinking of you.`}` };
  } else if (isGeneralFamily && familyMembers.length > 0) {
    const membersSummary = familyMembers.map((m: any) => `${m.name} (${m.relationship})`).join(', ');
    if (langCode === 'hi') {
      return { text: `(tone: warm) आपके प्यारे परिवार में ${membersSummary} हैं। (pause) वे सभी आपसे बहुत प्यार करते हैं और हमेशा आपके साथ हैं।` };
    }
    if (langCode === 'gu') {
      return { text: `(tone: warm) તમારા પરિવારમાં ${membersSummary} છે। (pause) તેઓ બધા તમને ખૂબ પ્રેમ કરે છે।` };
    }
    return { text: `(tone: warm) In your loving family, you have ${membersSummary}. (pause) They all cherish you deeply and are always by your side.` };
  }

  // 7. Caregiver Voice Note Intent
  const isVoiceNote = /\b(voice note|voice message|message|sandesh|awaaz|caregiver note|audio message|play voice|listen to message|play message)\b/i.test(lower);
  if (isVoiceNote) {
    if (langCode === 'hi') {
      return {
        text: `(tone: gentle) आपके परिवार का वॉयस मैसेज बजाया जा रहा है, ${honorific}। (pause) कृपया ध्यान से सुनें।`,
        functionCalls: [{ name: 'playVoiceNote', args: {} }],
      };
    }
    if (langCode === 'gu') {
      return {
        text: `(tone: gentle) તમારા પરિવારનો વોઇસ મેસેજ વાગી રહ્યો છે, ${honorific}। (pause) કૃપા કરીને સાંભળો।`,
        functionCalls: [{ name: 'playVoiceNote', args: {} }],
      };
    }
    return {
      text: `(tone: gentle) Playing your family voice message now, ${honorific}. (pause) Please listen closely.`,
      functionCalls: [{ name: 'playVoiceNote', args: {} }],
    };
  }

  // 8. Schedule & Tasks Intent (Smart Activity Matching)
  const isSchedule = /\b(schedule|task|routine|medicine|medication|pill|pills|dawa|dawai|today|aaj|aaje|time|lunch|breakfast|dinner|khana|doctor|walk|afternoon|morning|evening|chai|tea|what next|what to do|kya karna hai)\b/i.test(lower);
  if (isSchedule && schedule.length > 0) {
    let matchedTask = schedule.find((s: any) => {
      const taskLower = (s.task || '').toLowerCase();
      const instLower = (s.instructions || '').toLowerCase();
      return (
        (lower.includes('medicine') || lower.includes('dawa') || lower.includes('pill') || lower.includes('medication')) &&
        (taskLower.includes('med') || taskLower.includes('pill') || instLower.includes('med') || instLower.includes('pill') || instLower.includes('water'))
      ) || (
        (lower.includes('tea') || lower.includes('chai')) &&
        (taskLower.includes('tea') || taskLower.includes('chai') || instLower.includes('tea'))
      ) || (
        (lower.includes('walk') || lower.includes('garden')) &&
        (taskLower.includes('walk') || taskLower.includes('garden'))
      ) || (
        (lower.includes('lunch') || lower.includes('dinner') || lower.includes('breakfast') || lower.includes('khana')) &&
        (taskLower.includes('lunch') || taskLower.includes('dinner') || taskLower.includes('breakfast') || taskLower.includes('meal'))
      );
    });

    if (!matchedTask) {
      matchedTask = schedule[0];
    }

    if (langCode === 'hi') {
      return {
        text: `(tone: warm) आज ${matchedTask.time} बजे आपका यह काम है, ${honorific}: ${matchedTask.task}। ${matchedTask.instructions ? `(${matchedTask.instructions})` : ''}`,
        functionCalls: [{ name: 'navigateToPage', args: { page: 'schedule' } }],
      };
    }
    if (langCode === 'gu') {
      return {
        text: `(tone: warm) આજે ${matchedTask.time} વાગ્યે તમારું આ કામ છે, ${honorific}: ${matchedTask.task}।`,
        functionCalls: [{ name: 'navigateToPage', args: { page: 'schedule' } }],
      };
    }
    return {
      text: `(tone: warm) Today at ${matchedTask.time}, your task is: ${matchedTask.task}${matchedTask.instructions ? ` (${matchedTask.instructions})` : ''}, ${honorific}.`,
      functionCalls: [{ name: 'navigateToPage', args: { page: 'schedule' } }],
    };
  }

  // 9. HALLUCINATIONS, NIGHT FEARS & LONELINESS (Clinical Grounding)
  const isHallucinationOrFear = /\b(scared|darr|dar|ghost|bhoot|someone outside|shadow|strange noise|hearing voices|koi hai|bina koi|dar lag raha|bhiti|bhay|fear|dark|andhera|thief|chor|lonely|alone|akela|miss|sad|udaas|crying|rona|ekla|mon kharap|where is everyone|want to go home|ghar jana|help me)\b/i.test(lower);
  if (isHallucinationOrFear) {
    if (langCode === 'hi') {
      return { text: `(tone: reassuring) मैं आपकी बात समझ रही हूँ, ${honorific}। (pause) आप अपने घर में बिल्कुल सुरक्षित हैं। सब कुछ शांत है और मैं आपके पास हूँ। कोई डर की बात नहीं है।` };
    }
    if (langCode === 'gu') {
      return { text: `(tone: reassuring) ચિંતા ના કરશો ${honorific}। (pause) તમે તમારા ઘરમાં એકદમ સુરક્ષિત છો। દરવાજા બંધ છે અને હું તમારી સાથે જ છું। બધું શાંત છે।` };
    }
    if (langCode === 'mr') {
      return { text: `(tone: reassuring) काळजी करू नका ${honorific}। (pause) तुम्ही तुमच्या घरात पूर्णपणे सुरक्षित आहात। मी तुमच्या सोबत आहे, शांत राहा।` };
    }
    return { text: `(tone: reassuring) I hear you, ${honorific}. (pause) You are completely safe inside your comfortable home. Everything is peaceful and secure, and I am right here with you.` };
  }

  // 10. SOOTHING MICRO-STORIES (Out-of-Context Open Domain)
  const isStory = /\b(story|kahani|katha|vaarta|tell me something|kuch sunao|galpo)\b/i.test(lower);
  if (isStory) {
    if (langCode === 'hi') {
      return { text: `(tone: warm) एक सुनहरी सुबह एक छोटी चिड़िया गुलाब के पौधे पर बैठी और मीठा राग गाने लगी। (pause) धूप की किरणें खिड़की से आईं और पूरा कमरा सुकून से भर गया।` };
    }
    if (langCode === 'gu') {
      return { text: `(tone: warm) એક સુંદર સવારે બગીચામાં મોગરાના ફૂલો ખીલ્યા અને આખી જગ્યા સુગંધથી મહેકી ઊઠી। (pause) મીઠો પવન વહી રહ્યો હતો અને મન શાંત થઈ ગયું।` };
    }
    return { text: `(tone: warm) Once on a bright golden morning, a tiny robin rested on the garden rose bush, singing a peaceful song. (pause) The gentle morning sun warmed the whole porch with comfort.` };
  }

  // 11. GENERAL CONVERSATION, GREETINGS & COMFORT
  if (langCode === 'hi') {
    return { text: `(tone: warm) नमस्ते ${honorific}। (pause) मैं आपकी साथी काई हमेशा आपके साथ हूँ। आपका परिवार ${familyNames} आपसे बहुत प्यार करता है। आप मुझसे यादों, समय या किसी भी बात के बारे में पूछ सकते हैं।` };
  }
  if (langCode === 'gu') {
    return { text: `(tone: warm) નમસ્તે ${honorific}। (pause) હું તમારી સાથે જ છું। તમારો પરિવાર ${familyNames} તમને ખૂબ પ્રેમ કરે છે। આજનો દિવસ ખૂબ શાંત અને સુંદર છે।` };
  }
  if (langCode === 'mr') {
    return { text: `(tone: warm) नमस्कार ${honorific}। (pause) मी तुमच्या सोबत आहे। तुमचे कुटुंब ${familyNames} तुमच्यावर खूप प्रेम करते। सर्व काही छान आणि शांत आहे।` };
  }
  if (langCode === 'bn') {
    return { text: `(tone: warm) নমস্কার ${honorific}। (pause) আমি আপনার সাথে আছি। আপনার পরিবার ${familyNames} আপনাকে খুব ভালোবাসে।` };
  }

  return { text: `(tone: warm) Hello ${honorific}. (pause) I am right here with you. Your loving family, including ${familyNames}, cherishes you. You can ask me about your schedule, memories, family, or anything you wish!` };
}

// API Health
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Patient Profile Database Endpoints (MongoDB Atlas & Persistent Local Sync)
app.get('/api/patients', async (req: Request, res: Response) => {
  try {
    const patients = await getAllPatients();
    res.json(patients);
  } catch (err: any) {
    console.error('Failed to get patients:', err);
    res.status(500).json({ error: 'Failed to retrieve patients' });
  }
});

app.get('/api/patients/:id', async (req: Request, res: Response) => {
  try {
    const patient = await getPatientById(req.params.id as string);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.json(patient);
  } catch (err: any) {
    console.error('Failed to get patient:', err);
    res.status(500).json({ error: 'Failed to retrieve patient' });
  }
});

app.post('/api/patients', async (req: Request, res: Response) => {
  try {
    const patientData = req.body;
    if (!patientData || !patientData.id || !patientData.profile?.name) {
      return res.status(400).json({ error: 'Valid patient data with ID and name is required' });
    }
    const saved = await savePatient(patientData);
    res.json(saved);
  } catch (err: any) {
    console.error('Failed to save patient:', err);
    res.status(500).json({ error: 'Failed to save patient' });
  }
});

app.delete('/api/patients/:id', async (req: Request, res: Response) => {
  try {
    const success = await deletePatient(req.params.id as string);
    res.json({ success });
  } catch (err: any) {
    console.error('Failed to delete patient:', err);
    res.status(500).json({ error: 'Failed to delete patient' });
  }
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
    // Split clean text into chunks <= 180 characters along sentence/word boundaries
    const chunks: string[] = [];
    let remaining = clean;
    while (remaining.length > 0) {
      if (remaining.length <= 180) {
        chunks.push(remaining);
        break;
      }
      let splitIndex = -1;
      const candidates = ['. ', '! ', '? ', ', ', '; ', ' '];
      for (const cand of candidates) {
        const idx = remaining.lastIndexOf(cand, 180);
        if (idx > 30) {
          splitIndex = idx + cand.length;
          break;
        }
      }
      if (splitIndex === -1) {
        splitIndex = 180;
      }
      chunks.push(remaining.slice(0, splitIndex).trim());
      remaining = remaining.slice(splitIndex).trim();
    }

    const audioBuffers: Buffer[] = [];
    for (const chunk of chunks) {
      if (!chunk) continue;
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
        chunk
      )}&tl=${targetLang}&client=tw-ob`;

      try {
        const response = await fetch(ttsUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        });
        if (response.ok) {
          const ab = await response.arrayBuffer();
          audioBuffers.push(Buffer.from(ab));
        } else {
          // Fallback to Hindi if targetLang fails
          const fallbackUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
            chunk
          )}&tl=hi&client=tw-ob`;
          const fbRes = await fetch(fallbackUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            },
          });
          if (fbRes.ok) {
            const fbAb = await fbRes.arrayBuffer();
            audioBuffers.push(Buffer.from(fbAb));
          }
        }
      } catch (err: any) {
        console.warn('TTS chunk fetch notice:', err.message);
      }
    }

    if (audioBuffers.length > 0) {
      const combined = Buffer.concat(audioBuffers);
      res.setHeader('Content-Type', 'audio/mpeg');
      return res.send(combined);
    }

    res.status(500).json({ error: 'TTS audio synthesis failed' });
  } catch (err: any) {
    console.error('TTS endpoint error:', err.message);
    res.status(500).json({ error: 'TTS generation failed' });
  }
});

const LANGUAGE_NAME_MAP: Record<string, string> = {
  hi: 'Hindi (हिन्दी)',
  en: 'English',
  gu: 'Gujarati (ગુજરાતી)',
  mr: 'Marathi (मराठी)',
  bn: 'Bengali (বাংলা)',
  as: 'Assamese (অসমীয়া)',
  mni: 'Manipuri / Meitei (মৈতৈলোন্)',
  brx: 'Bodo (बर\')',
  kha: 'Khasi (Ka Ktien Khasi)',
  lus: 'Mizo (Mizo ṭawng)',
  nag: 'Nagamese (নাগামী)',
  ne: 'Nepali (नेपाली)',
  trp: 'Kokborok (कॉकबरॉक)',
  ta: 'Tamil (தமிழ்)',
  te: 'Telugu (తెలుగు)',
  kn: 'Kannada (ಕನ್ನಡ)',
  ml: 'Malayalam (മലയാളം)',
  pa: 'Punjabi (ਪੰਜਾਬੀ)',
  or: 'Odia (ଓଡ଼ିଆ)',
  ur: 'Urdu (اردو)',
  es: 'Spanish (Español)',
  fr: 'French (Français)',
  de: 'German (Deutsch)',
  zh: 'Mandarin Chinese (中文)',
  ja: 'Japanese (日本語)',
};

// Gemini Chat Endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  const { prompt, patientData, history, language, locationInfo } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const userLang = language || 'en';
  const detected = detectSpokenLanguage(prompt, userLang);
  const targetLangName = detected.langName;
  const activeLangCode = detected.langCode;
  const patientName = patientData?.profile?.name || 'the user';

  // 1. Try Sarvam AI first if key exists for Indic speech
  const sarvamRes = await trySarvamAIResponse(prompt, patientName, activeLangCode);
  if (sarvamRes) {
    return res.json(sarvamRes);
  }

  const ai = getAIClient();

  // If no AI client available, use smart local fallback
  if (!ai) {
    const fallback = generateLocalFallbackResponse(prompt, patientData, activeLangCode, locationInfo);
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

MANDATORY BREVITY RULE FOR DEMENTIA PATIENTS:
- ABSOLUTE LIMIT: 1 to 2 SHORT SENTENCES (UNDER 25-30 WORDS TOTAL).
- NEVER output long paragraphs, numbered lists, or 10 lines of text. Dementia individuals need short, easily digestible phrases.

MANDATORY MULTILINGUAL & TRANSLITERATION INSTRUCTIONS:
- Detected Spoken Language: ${targetLangName} (Language Code: ${activeLangCode})
- Patient's Spoken Input: "${prompt}"
- CRITICAL REQUIREMENT: You MUST speak and respond strictly in ${targetLangName} matching the patient's current language.
- If the patient speaks in English, reply in gentle English.
- If the patient speaks in Hindi / Hinglish, reply in warm natural Hindi (Devanagari script).
- If the patient speaks in Gujarati, Marathi, Bengali, Assamese, Tamil, Telugu, etc., reply in that specific language.
- Always address the patient respectfully using their cultural honorific (e.g. "${patientName} ${culturalProfile.honorificTitle || ''}").

OPEN-DOMAIN & EMOTIONAL ADAPTABILITY:
1. JOKES & HUMOR: If the user asks for a joke or to make them laugh, tell a sweet, short, clean 1-sentence joke in their language.
2. SONGS & LULLABIES: If the user asks you to sing or for music, provide a gentle 2-line soothing rhyming verse.
3. HALLUCINATIONS, NIGHT FEARS & SENSORY CONFUSION: Never argue or say "that is not real". Gently validate their feeling and anchor them in safety (e.g. "(tone: reassuring) I am right here with you, ${patientName}. You are completely safe in your cozy home, and everything is peaceful.").
4. GENERAL CURIOSITY: Answer general questions (weather, nature, simple facts) warmly and directly in 1 short sentence.

CRITICAL PERSONAL CONTEXT & IDENTITY RULES:
1. FAMILY MEMBERS: When the user asks about family members (e.g. "Who is Maria?", "Who is Sarah?", "Who is Buddy?", "Tell me about my daughter", "Who is my son?", "Who is my wife?"), check the Family Members list in the PATIENT PROFILE. Identify them warmly and describe their relationship and role in 1-2 comforting sentences.
2. MEMORIES & PHOTOS: When the user asks to see a photo or mentions a memory (e.g. "Show my wedding photo", "Show Buddy", "Show my garden"), call the \`showMemoryImage\` tool with the matching memoryTitle from Key Memories, and briefly describe the photograph warmly in 1-2 sentences.
3. SCHEDULE & MEDICATIONS: When the user asks what they need to do, about medicine, tea, or lunch, check Today's Schedule and answer directly in 1 short sentence.

${culturalContext}

${locationContext}

CORE PERSONALITY & TOOL GUIDELINES:
1. Speak with extraordinary warmth, patience, clarity, and kindness.
2. Use prosody markup in your text response to guide speech rhythm:
   - (tone: warm) -> general comfort, jokes, stories
   - (tone: gentle) -> reminders, songs
   - (tone: reassuring) -> confusion, fear, hallucinations
   - (pause) -> natural conversational pause
3. ALWAYS provide spoken text in your response even when calling a function tool!
4. When the user asks where they are, what is outside, or about nearby places, USE THE REAL-TIME GPS SURROUNDINGS & LANDMARKS PROVIDED ABOVE to give accurate, comforting, location-aware answers!
5. You have access to tools:
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

    // Primary high-speed active models
    const modelsToTry = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-flash-latest',
    ];

    let response: any = null;
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        response = await Promise.race([
          ai.models.generateContent({
            model: modelName,
            contents,
            config: {
              systemInstruction,
              temperature: 0.7,
              tools: [{ functionDeclarations: [SHOW_MEMORY_TOOL, PLAY_VOICE_NOTE_TOOL, NAVIGATE_TOOL] }],
            },
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('AI generation timeout')), 7500)),
        ]);
        if (response) break;
      } catch (err: any) {
        console.warn(`Model ${modelName} notice: ${err.message}.`);
        lastError = err;
      }
    }

    if (!response) {
      // Immediate intelligent fallback so pitch never hangs
      const fallback = generateLocalFallbackResponse(prompt, patientData, activeLangCode, locationInfo);
      return res.json(fallback);
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
  // Initialize Cloud MongoDB Atlas or Persistent File Storage
  await initDatabase();

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
