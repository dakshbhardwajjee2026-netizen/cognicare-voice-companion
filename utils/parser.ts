import { ParsedPart } from '../types';

export const parseResponse = (text: string): ParsedPart[] => {
  if (!text) return [];
  const regex = /(\([^)]+\))/g;
  const parts = text.split(regex).filter(Boolean);
  return parts.reduce((acc: ParsedPart[], part: string) => {
    const trimmed = part.trim();
    if (trimmed.startsWith('(tone:')) {
      const content = trimmed.replace(/[()]/g, '').split(':')[1]?.trim() || 'warm';
      acc.push({ type: 'tone', content });
    } else if (trimmed === '(pause)') {
      acc.push({ type: 'pause', content: '' });
    } else if (trimmed === '(long pause)') {
      acc.push({ type: 'long_pause', content: '' });
    } else {
      const content = part.replace(/[()]/g, '').trim();
      if (content) {
        acc.push({ type: 'text', content: part });
      }
    }
    return acc;
  }, []);
};

export interface SpeechSegment {
  type: 'text' | 'pause';
  text?: string;
  pauseMs?: number;
}

export const getSpeechSegments = (text: string): SpeechSegment[] => {
  if (!text) return [];
  const parsed = parseResponse(text);
  const segments: SpeechSegment[] = [];

  for (const part of parsed) {
    if (part.type === 'text') {
      // Clean any remnant bracketed metadata like (tone: warm)
      const clean = part.content.replace(/\([^)]+\)/g, '').trim();
      if (clean) {
        segments.push({ type: 'text', text: clean });
      }
    } else if (part.type === 'pause') {
      segments.push({ type: 'pause', pauseMs: 400 });
    } else if (part.type === 'long_pause') {
      segments.push({ type: 'pause', pauseMs: 800 });
    }
  }

  // If no segments created but text existed, fallback to basic clean string
  if (segments.length === 0 && text.trim()) {
    const clean = text.replace(/\([^)]+\)/g, '').trim();
    if (clean) {
      segments.push({ type: 'text', text: clean });
    }
  }

  return segments;
};

export const cleanTextForSpeech = (text: string): string => {
  if (!text) return '';
  return text.replace(/\([^)]+\)/g, '').replace(/\s+/g, ' ').trim();
};
