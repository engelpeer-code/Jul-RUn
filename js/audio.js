'use strict';
/* Jul Run – Soundeffekte und Hintergrundmusik (Web Audio, keine Dateien). */

let actx = null, sfxBus = null, musicBus = null, noiseBuf = null;

function audio() {
  if (save.muted) return null;
  if (!actx) {
    try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
    sfxBus = actx.createGain();
    sfxBus.connect(actx.destination);
    musicBus = actx.createGain();
    musicBus.gain.value = 0.55;
    musicBus.connect(actx.destination);
  }
  if (actx.state === 'suspended') actx.resume();
  return actx;
}

function tone(freq, dur, type, vol, slideTo, delay, bus, at) {
  const a = audio(); if (!a) return;
  const t0 = at !== undefined ? at : a.currentTime + (delay || 0);
  const o = a.createOscillator(), g = a.createGain();
  o.type = type || 'square';
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol || 0.05, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(bus || sfxBus);
  o.start(t0); o.stop(t0 + dur + 0.03);
}

function noise(dur, vol, when, bus, highpass) {
  const a = audio(); if (!a) return;
  if (!noiseBuf) {
    const len = Math.floor(a.sampleRate * 0.5);
    noiseBuf = a.createBuffer(1, len, a.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }
  const t0 = when || a.currentTime;
  const src = a.createBufferSource(), g = a.createGain();
  src.buffer = noiseBuf;
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  let node = src;
  if (highpass) {
    const f = a.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = highpass;
    src.connect(f); node = f;
  }
  node.connect(g).connect(bus || sfxBus);
  src.start(t0, Math.random() * 0.3); src.stop(t0 + dur + 0.02);
}

const fx = (fn) => () => { if (save.sfx) fn(); };
const sfx = {
  jump: fx(() => tone(300, 0.14, 'square', 0.035, 620)),
  air: fx(() => tone(480, 0.13, 'square', 0.03, 960)),
  coin: fx(() => { tone(988, 0.07, 'triangle', 0.06); tone(1319, 0.12, 'triangle', 0.06, null, 0.06); }),
  big: fx(() => [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.12, 'triangle', 0.06, null, i * 0.05))),
  crash: fx(() => { tone(220, 0.45, 'sawtooth', 0.06, 50); noise(0.25, 0.09); }),
  shield: fx(() => { tone(880, 0.25, 'sine', 0.08, 220); noise(0.12, 0.04); }),
  stage: fx(() => [523, 659, 784].forEach((f, i) => tone(f, 0.1, 'square', 0.03, null, i * 0.07))),
  buy: fx(() => [659, 880, 1047].forEach((f, i) => tone(f, 0.1, 'triangle', 0.06, null, i * 0.06))),
  nope: fx(() => tone(160, 0.15, 'square', 0.03, 120)),
  slide: fx(() => noise(0.22, 0.05, 0, null, 1800)),
  power: fx(() => [523, 784, 1047, 1568].forEach((f, i) => tone(f, 0.14, 'square', 0.035, null, i * 0.045))),
  present: fx(() => [880, 1109, 1319].forEach((f, i) => tone(f, 0.16, 'triangle', 0.07, null, i * 0.07))),
  mission: fx(() => [784, 988, 1175, 1568, 1976].forEach((f, i) => tone(f, 0.12, 'triangle', 0.05, null, i * 0.06))),
  revive: fx(() => tone(330, 0.5, 'sine', 0.08, 990)),
  bells: fx(() => [1568, 1760, 1568, 2093].forEach((f, i) => tone(f, 0.18, 'sine', 0.04, null, i * 0.11))),
};

/* ---------- Musik: kleine eigene Melodie in C-Dur, 32 Achtel ---------- */
const MELODY = [7, null, 4, 7, 9, 7, 4, null, 5, null, 2, 5, 7, 5, 2, null,
  4, 5, 7, 12, 11, 9, 7, null, 5, 4, 2, 4, 0, null, null, null];
const BASS = [0, 0, 7, 7, 0, 5, 7, 0]; // je halber Takt (4 Achtel)
const music = {
  playing: false, bpm: 104, step: 0, next: 0,
  start() {
    if (this.playing || !save.music) return;
    const a = audio(); if (!a) return;
    this.playing = true;
    this.step = 0;
    this.next = a.currentTime + 0.08;
  },
  stop() { this.playing = false; },
  sync() {
    if (save.music && !save.muted) this.start(); else this.stop();
  },
  tick() {
    if (!this.playing || !actx || save.muted || !save.music) return;
    if (actx.state !== 'running') return;
    const stepDur = 60 / this.bpm / 2;
    if (this.next < actx.currentTime - 0.3) this.next = actx.currentTime + 0.05;
    while (this.next < actx.currentTime + 0.15) {
      const s = this.step % 32, t = this.next;
      const m = MELODY[s];
      if (m !== null) tone(523.25 * Math.pow(2, m / 12), stepDur * 0.9, 'triangle', 0.035, null, 0, musicBus, t);
      if (s % 4 === 0) {
        const b = BASS[(s / 4) | 0];
        tone(130.81 * Math.pow(2, b / 12), stepDur * 1.8, 'square', 0.022, null, 0, musicBus, t);
      } else if (s % 4 === 2) {
        const b = BASS[(s / 4) | 0];
        tone(261.63 * Math.pow(2, b / 12), stepDur * 0.8, 'triangle', 0.018, null, 0, musicBus, t);
      }
      if (s % 2 === 1) noise(0.05, 0.012, t, musicBus, 6000);
      this.step++;
      this.next += stepDur;
    }
  },
};
