import dotenv from 'dotenv';
dotenv.config();

export interface SarvamComprehensionResult {
  detectedLanguage: string; // e.g. 'hi', 'en', 'gu', 'mr', 'bn', 'as', 'ta', 'te'
  languageName: string;
  isIndic: boolean;
  isCodeMixed: boolean;
  intent: 'WHERE_AM_I' | 'WHO_AM_I' | 'PHOTO_MEMORY' | 'MEDICATION' | 'SCHEDULE' | 'CALL_CAREGIVER' | 'GENERAL_COMFORT' | 'UNKNOWN';
  memoryQuery?: string;
  confidence: number;
  source: 'sarvam-ai' | 'ai-semantic' | 'heuristic';
  sarvamDirectReply?: string;
}

export const LANGUAGE_NAME_MAP: Record<string, string> = {
  hi: 'Hindi',
  en: 'English',
  gu: 'Gujarati',
  mr: 'Marathi',
  bn: 'Bengali',
  as: 'Assamese',
  ta: 'Tamil',
  te: 'Telugu',
  kn: 'Kannada',
  ml: 'Malayalam',
  pa: 'Punjabi',
  ur: 'Urdu',
  mn: 'Manipuri',
  mni: 'Manipuri',
};

/**
 * 1. Sarvam AI Dedicated Indic API Caller
 * Uses Sarvam AI (sarvam-m-2b) to comprehend regional text, code-mixed speech, and extract intent.
 */
async function callSarvamAI(prompt: string, patientName: string, honorific: string): Promise<SarvamComprehensionResult | null> {
  const sarvamKey = process.env.SARVAM_API_KEY;
  if (!sarvamKey) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const systemPrompt = `You are Sarvam AI Indic Language Comprehension Engine for a dementia patient named ${patientName} (${honorific}).
Analyze the user's input and respond ONLY with a strict JSON object with these keys:
{
  "detectedLanguage": "hi" | "en" | "gu" | "mr" | "bn" | "as" | "ta" | "te" | "kn" | "ml" | "pa",
  "isCodeMixed": true/false (true if Hinglish or mixed with English),
  "intent": "WHERE_AM_I" | "WHO_AM_I" | "PHOTO_MEMORY" | "MEDICATION" | "SCHEDULE" | "CALL_CAREGIVER" | "GENERAL_COMFORT",
  "memoryQuery": string (if asking for photos or family memories, else empty),
  "comfortReply": string (warm 1-2 sentence comforting reply in the detected language with prosody tags like (tone: warm) and (pause))
}`;

    const res = await fetch('https://api.sarvam.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': sarvamKey,
      },
      body: JSON.stringify({
        model: 'sarvam-m-2b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      if (content) {
        try {
          const parsed = JSON.parse(content);
          const langCode = (parsed.detectedLanguage || 'hi').toLowerCase();
          return {
            detectedLanguage: langCode,
            languageName: LANGUAGE_NAME_MAP[langCode] || langCode.toUpperCase(),
            isIndic: langCode !== 'en',
            isCodeMixed: Boolean(parsed.isCodeMixed),
            intent: parsed.intent || 'GENERAL_COMFORT',
            memoryQuery: parsed.memoryQuery,
            confidence: 0.95,
            source: 'sarvam-ai',
            sarvamDirectReply: parsed.comfortReply
          };
        } catch {
          // If JSON parse fails but text exists, return raw text
          return {
            detectedLanguage: 'hi',
            languageName: 'Hindi',
            isIndic: true,
            isCodeMixed: false,
            intent: 'GENERAL_COMFORT',
            confidence: 0.85,
            source: 'sarvam-ai',
            sarvamDirectReply: content
          };
        }
      }
    }
  } catch (err: any) {
    console.warn('[Sarvam AI Service] Notice:', err.message);
  }
  return null;
}

/**
 * 2. High-Speed AI Semantic Comprehension
 * Employs Gemini Flash-Lite to perform deep semantic categorization, code-mixed language detection,
 * and clinical intent extraction with sub-second latency.
 */
async function callSemanticAIComprehension(aiClient: any, prompt: string, fallbackLang = 'en'): Promise<SarvamComprehensionResult | null> {
  if (!aiClient) return null;

  try {
    const comprehensionInstruction = `You are CogniCare's Indic & Multilingual Comprehension Engine for a dementia companion.
Analyze the patient's speech: "${prompt}".
User's previous turn locale: "${fallbackLang}".

Rules:
- If the patient speaks in English (e.g. "Kai, please play Sarah voice message for me" or "Where is my daughter Sarah?"), detectedLanguage MUST be "en", even if previous turn was Hindi or Gujarati!
- If the patient speaks in Gujarati (e.g. "KEM chhokri", "kem cho", "mane dar lage che"), detectedLanguage MUST be "gu".
- If the patient speaks in Hindi or Hinglish (e.g. "namaste kai", "meri beti kab aayegi", "muje bhook lagi hai"), detectedLanguage MUST be "hi".
- If the patient speaks in Marathi (e.g. "namaskar kai", "mala bhiti vatate"), detectedLanguage MUST be "mr".

Extract:
1. detectedLanguage: "en" | "hi" | "gu" | "mr" | "bn" | "as" | "ta" | "te" | "kn" | "ml" | "pa"
2. isCodeMixed: boolean
3. intent: "WHERE_AM_I" | "WHO_AM_I" | "PHOTO_MEMORY" | "MEDICATION" | "SCHEDULE" | "CALL_CAREGIVER" | "GENERAL_COMFORT"
4. memoryQuery: string

Respond ONLY in valid JSON matching this schema:
{"detectedLanguage": "lang_code", "isCodeMixed": false, "intent": "INTENT", "memoryQuery": ""}`;

    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Semantic timeout (1800ms)')), 1800));
    const generatePromise = aiClient.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: [{ role: 'user', parts: [{ text: comprehensionInstruction }] }],
      config: {
        temperature: 0.1,
        responseMimeType: 'application/json',
        maxOutputTokens: 90
      }
    });

    const result: any = await Promise.race([generatePromise, timeoutPromise]);
    if (result?.text) {
      const parsed = JSON.parse(result.text.trim());
      const langCode = (parsed.detectedLanguage || 'en').toLowerCase();
      return {
        detectedLanguage: langCode,
        languageName: LANGUAGE_NAME_MAP[langCode] || langCode.toUpperCase(),
        isIndic: langCode !== 'en',
        isCodeMixed: Boolean(parsed.isCodeMixed),
        intent: parsed.intent || 'GENERAL_COMFORT',
        memoryQuery: parsed.memoryQuery,
        confidence: 0.95,
        source: 'ai-semantic'
      };
    }
  } catch (err: any) {
    console.warn('[Semantic AI Comprehension] Notice:', err.message);
  }
  return null;
}

/**
 * 3. Smart Linguistic Heuristic (Offline Zero-Downtime Fallback)
 * Handles phonetic patterns, Indic Unicode ranges, and common colloquial expressions.
 */
function heuristicLinguisticComprehension(prompt: string, fallbackLang = 'en'): SarvamComprehensionResult {
  const text = (prompt || '').trim();
  const lower = text.toLowerCase();

  // Unicode Script Detection
  if (/[\u0A80-\u0AFF]/.test(text)) {
    return { detectedLanguage: 'gu', languageName: 'Gujarati', isIndic: true, isCodeMixed: false, intent: 'GENERAL_COMFORT', confidence: 0.95, source: 'heuristic' };
  }
  if (/[\u0900-\u097F]/.test(text)) {
    const isMarathi = lower.includes('आहे') || lower.includes('नाही') || lower.includes('कसा');
    return {
      detectedLanguage: isMarathi ? 'mr' : 'hi',
      languageName: isMarathi ? 'Marathi' : 'Hindi',
      isIndic: true,
      isCodeMixed: false,
      intent: lower.includes('कहाँ') || lower.includes('कुठे') ? 'WHERE_AM_I' : lower.includes('दवा') || lower.includes('औषध') ? 'MEDICATION' : lower.includes('तस्वीर') || lower.includes('फोटो') ? 'PHOTO_MEMORY' : 'GENERAL_COMFORT',
      confidence: 0.95,
      source: 'heuristic'
    };
  }
  if (/[\u0980-\u09FF]/.test(text)) {
    const isAssamese = /[\u09F0\u09F1]/.test(text) || lower.includes('আপুনি');
    return {
      detectedLanguage: isAssamese ? 'as' : 'bn',
      languageName: isAssamese ? 'Assamese' : 'Bengali',
      isIndic: true,
      isCodeMixed: false,
      intent: 'GENERAL_COMFORT',
      confidence: 0.95,
      source: 'heuristic'
    };
  }
  if (/[\u0B80-\u0BFF]/.test(text)) {
    return { detectedLanguage: 'ta', languageName: 'Tamil', isIndic: true, isCodeMixed: false, intent: 'GENERAL_COMFORT', confidence: 0.95, source: 'heuristic' };
  }
  if (/[\u0C00-\u0C7F]/.test(text)) {
    return { detectedLanguage: 'te', languageName: 'Telugu', isIndic: true, isCodeMixed: false, intent: 'GENERAL_COMFORT', confidence: 0.95, source: 'heuristic' };
  }

  // Broad Colloquial & Phonetic Hinglish / Indic Phrases
  const gujaratiPatterns = /\b(kem|cho|majama|bhaai|bhai|ben|tamaru|aaje|mane|thodo|dar|chhokri|chhokro|aavjo|nathi|su|sarasa)\b/i;
  const marathiPatterns = /\b(kuthe|ahe|kasa|kay|aamhi|namaskar|kashi|kashe)\b/i;
  const bengaliPatterns = /\b(kothay|aachen|bhalo|aami|tumi|ki)\b/i;
  const hindiPatterns = /\b(kahan|kaun|kya|kyun|kaise|mera|meri|mere|ghar|dawa|dawai|beti|beta|namaste|dar|yaad|tasveer|batao|bataiye|chalo|madad|theek|bolo|sunao|chahiye|kidhar|aayegi|aayega|dekho|muje|kripya|hoon|hai|hain)\b/i;

  let intent: SarvamComprehensionResult['intent'] = 'GENERAL_COMFORT';
  if (lower.includes('where am i') || lower.includes('kahan') || lower.includes('kuthe') || lower.includes('location') || lower.includes('place')) {
    intent = 'WHERE_AM_I';
  } else if (lower.includes('who am i') || lower.includes('kaun') || lower.includes('my name') || lower.includes('confused')) {
    intent = 'WHO_AM_I';
  } else if (lower.includes('photo') || lower.includes('picture') || lower.includes('tasveer') || (lower.includes('memory') && !lower.includes('message'))) {
    intent = 'PHOTO_MEMORY';
  } else if (lower.includes('medicine') || lower.includes('dawa') || lower.includes('dawai') || lower.includes('pill') || lower.includes('time')) {
    intent = 'MEDICATION';
  } else if (lower.includes('schedule') || lower.includes('today') || lower.includes('plan')) {
    intent = 'SCHEDULE';
  } else if (lower.includes('message') || lower.includes('voice note') || lower.includes('voice message') || lower.includes('call') || lower.includes('phone') || lower.includes('doctor')) {
    intent = 'CALL_CAREGIVER';
  }

  // Detect clean English independent of fallback
  const commonEnglish = /\b(please|play|voice|message|photo|picture|where|what|who|how|can|could|would|you|me|my|daughter|family|friend|time|schedule|today|doctor|call|help|feel|feeling|scared|confused|lost|good|safe|right|now|hello|hi)\b/i;
  const hasIndicTokens = gujaratiPatterns.test(lower) || marathiPatterns.test(lower) || bengaliPatterns.test(lower) || hindiPatterns.test(lower);

  if (commonEnglish.test(lower) && !hasIndicTokens) {
    return {
      detectedLanguage: 'en',
      languageName: 'English',
      isIndic: false,
      isCodeMixed: false,
      intent,
      confidence: 0.95,
      source: 'heuristic'
    };
  }

  if (gujaratiPatterns.test(lower)) {
    return {
      detectedLanguage: 'gu',
      languageName: 'Gujarati',
      isIndic: true,
      isCodeMixed: /[a-zA-Z]/.test(text) && !/[\u0A80-\u0AFF]/.test(text),
      intent,
      confidence: 0.90,
      source: 'heuristic'
    };
  }
  if (marathiPatterns.test(lower)) {
    return {
      detectedLanguage: 'mr',
      languageName: 'Marathi',
      isIndic: true,
      isCodeMixed: false,
      intent,
      confidence: 0.90,
      source: 'heuristic'
    };
  }
  if (bengaliPatterns.test(lower)) {
    return {
      detectedLanguage: 'bn',
      languageName: 'Bengali',
      isIndic: true,
      isCodeMixed: false,
      intent,
      confidence: 0.90,
      source: 'heuristic'
    };
  }
  if (hindiPatterns.test(lower)) {
    return {
      detectedLanguage: 'hi',
      languageName: 'Hindi (Hinglish)',
      isIndic: true,
      isCodeMixed: true,
      intent,
      confidence: 0.85,
      source: 'heuristic'
    };
  }


  // Check fallback or default to English
  const isFallbackIndic = fallbackLang && fallbackLang !== 'en';
  return {
    detectedLanguage: isFallbackIndic ? fallbackLang : 'en',
    languageName: LANGUAGE_NAME_MAP[fallbackLang] || (isFallbackIndic ? fallbackLang.toUpperCase() : 'English'),
    isIndic: isFallbackIndic,
    isCodeMixed: false,
    intent,
    confidence: 0.80,
    source: 'heuristic'
  };
}

/**
 * 🌟 Master Language Comprehension Pipeline
 * Orchestrates Sarvam AI -> AI Semantic Comprehension -> Heuristic Engine
 */
export async function comprehendLanguageAndIntent(
  prompt: string,
  aiClient: any,
  patientName = 'David',
  honorific = 'Kaka',
  fallbackLang = 'en'
): Promise<SarvamComprehensionResult> {
  // Tier 1: Dedicated Sarvam AI Engine (if key configured)
  const sarvamRes = await callSarvamAI(prompt, patientName, honorific);
  if (sarvamRes) {
    console.log(`[Language Engine] Comprehended via Sarvam AI: ${sarvamRes.languageName} (Intent: ${sarvamRes.intent})`);
    return sarvamRes;
  }

  // Tier 2: AI Semantic Comprehension Engine (sub-second zero-downtime)
  const semanticRes = await callSemanticAIComprehension(aiClient, prompt, fallbackLang);
  if (semanticRes) {
    console.log(`[Language Engine] Comprehended via AI Semantic: ${semanticRes.languageName} (Intent: ${semanticRes.intent})`);
    return semanticRes;
  }

  // Tier 3: Resilient Linguistic Heuristic
  const heuristicRes = heuristicLinguisticComprehension(prompt, fallbackLang);
  console.log(`[Language Engine] Comprehended via Linguistic Heuristic: ${heuristicRes.languageName} (Intent: ${heuristicRes.intent})`);
  return heuristicRes;
}
