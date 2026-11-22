// audio.js — tiny WebAudio bleeps, synthesized in code. No audio files,
// no network. A soft click, a play thump, a surge chime, win/lose phrases.
let ctx = null;
let muted = false;

export function setMuted(m) { muted = m; }
export function isMuted() { return muted; }

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, type = 'sine', gain = 0.08, when = 0) {
  if (muted) return;
  const c = ac();
  if (!c) return;
  const t0 = c.currentTime + when;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(c.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

export const sfx = {
  click() { tone(660, 0.06, 'triangle', 0.05); },
  play() { tone(220, 0.12, 'sine', 0.09); tone(330, 0.1, 'sine', 0.06, 0.05); },
  surge() { tone(523, 0.1, 'triangle', 0.08); tone(784, 0.14, 'triangle', 0.08, 0.07); },
  hurt() { tone(160, 0.16, 'sawtooth', 0.05); },
  heal() { tone(392, 0.12, 'sine', 0.06); tone(523, 0.16, 'sine', 0.06, 0.08); },
  turn() { tone(440, 0.08, 'triangle', 0.05); },
  win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.09, i * 0.11)); },
  lose() { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.25, 'sine', 0.08, i * 0.13)); },
};
