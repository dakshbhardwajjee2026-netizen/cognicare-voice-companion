// Web Audio API helper for browser audio unlocking, gentle chimes, and volume analysis

let audioCtx: AudioContext | null = null;

export const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

// Unlock browser audio upon first user gesture
export const unlockAudio = () => {
  const ctx = getAudioContext();
  if (ctx) {
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    // Play a tiny inaudible buffer to unlock iOS / Chrome audio policy
    try {
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    } catch {
      // ignore
    }
  }

  // Also unlock SpeechSynthesis if supported
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.resume();
    } catch {
      // ignore
    }
  }
};

// Play a gentle, soothing pentatonic chime when Kai awakens or responds
export const playGentleChime = (type: 'wake' | 'response' | 'alert' = 'response') => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes =
      type === 'wake'
        ? [523.25, 659.25] // C5 -> E5
        : type === 'alert'
        ? [440, 554.37, 659.25] // A4 -> C#5 -> E5
        : [587.33, 783.99]; // D5 -> G5 gentle warm tone

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.12);

      gain.gain.setValueAtTime(0.001, now + index * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.06, now + index * 0.12 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.12 + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + index * 0.12);
      osc.stop(now + index * 0.12 + 0.55);
    });
  } catch (err) {
    // Audio chime is optional, gracefully ignore if blocked
    console.debug('Audio chime notice:', err);
  }
};
