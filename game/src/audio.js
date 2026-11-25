// All sound in Sizzle Rush is synthesised with WebAudio: short oscillator
// blips and filtered noise, no audio files. The context is created lazily
// on the first user gesture, so a quiet first load never throws.

let ctx = null;
let muted = false;
let musicTimer = null;
let musicStep = 0;

function audio() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  } catch {
    ctx = null;
  }
  return ctx;
}

export function unlockAudio() {
  const c = audio();
  if (c && c.state === 'suspended') c.resume().catch(() => {});
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

function blip(freq, dur, type, vol, slideTo) {
  if (muted) return;
  const c = audio();
  if (!c) return;
  try {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, c.currentTime);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + dur);
    gain.gain.setValueAtTime(vol || 0.12, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    osc.connect(gain).connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + dur);
  } catch {
    // Sound is garnish; a failure here must never break the game.
  }
}

function noiseBurst(dur, vol, freq) {
  if (muted) return;
  const c = audio();
  if (!c) return;
  try {
    const len = Math.floor(c.sampleRate * dur);
    const buffer = c.createBuffer(1, len, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buffer;
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq || 1800;
    const gain = c.createGain();
    gain.gain.value = vol || 0.08;
    src.connect(filter).connect(gain).connect(c.destination);
    src.start();
  } catch {
    // Ignore audio failures.
  }
}

export const sfx = {
  pickup() { blip(520, 0.08, 'triangle', 0.12, 760); },
  place() { blip(220, 0.1, 'triangle', 0.14, 160); },
  chop() { noiseBurst(0.06, 0.1, 2400); },
  sizzle() { noiseBurst(0.35, 0.05, 3200); },
  ding() { blip(880, 0.35, 'sine', 0.14); setTimeout(() => blip(1320, 0.4, 'sine', 0.1), 90); },
  error() { blip(160, 0.18, 'square', 0.07, 110); },
  tick() { blip(980, 0.05, 'square', 0.05); },
  coin() { blip(990, 0.09, 'sine', 0.12, 1480); },
  burn() { noiseBurst(0.25, 0.09, 700); blip(120, 0.3, 'sawtooth', 0.06, 70); },
};

// A tiny cheerful loop: bass note + pluck, four steps, started on first play.
const BASS = [130.8, 98, 110, 146.8];
const PLUCK = [523.25, 659.25, 783.99, 659.25];

export function startMusic() {
  if (musicTimer || muted) return;
  musicTimer = setInterval(() => {
    if (muted) return;
    const i = musicStep % 4;
    blip(BASS[i], 0.42, 'triangle', 0.05);
    blip(PLUCK[i], 0.18, 'sine', 0.04);
    musicStep += 1;
  }, 430);
}

export function stopMusic() {
  if (musicTimer) clearInterval(musicTimer);
  musicTimer = null;
}
