// Pleasant Web Audio Ringtone Generator for Physical Phones
let ringAudioCtx: AudioContext | null = null;
let ringInterval: any = null;

export function startRingtone(): void {
  try {
    stopRingtone();
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    ringAudioCtx = new AudioCtx();

    const playDualTone = () => {
      if (!ringAudioCtx || ringAudioCtx.state === 'closed') return;
      if (ringAudioCtx.state === 'suspended') {
        ringAudioCtx.resume();
      }

      const now = ringAudioCtx.currentTime;
      const osc1 = ringAudioCtx.createOscillator();
      const osc2 = ringAudioCtx.createOscillator();
      const gain = ringAudioCtx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(440, now);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(480, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.1);
      gain.gain.setValueAtTime(0.3, now + 1.8);
      gain.gain.linearRampToValueAtTime(0, now + 2.0);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ringAudioCtx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 2.0);
      osc2.stop(now + 2.0);
    };

    playDualTone();
    ringInterval = setInterval(playDualTone, 3500);
  } catch (e) {
    console.warn('[Ringtone] AudioContext error:', e);
  }
}

export function stopRingtone(): void {
  if (ringInterval) {
    clearInterval(ringInterval);
    ringInterval = null;
  }
  if (ringAudioCtx) {
    try {
      ringAudioCtx.close();
    } catch {}
    ringAudioCtx = null;
  }
}
