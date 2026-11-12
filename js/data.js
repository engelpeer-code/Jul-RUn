'use strict';
/* Jul Run – Spieldaten, Spielstand und Hilfsfunktionen.
   Alle Skripte teilen sich den globalen Gültigkeitsbereich (klassische <script>-Dateien). */

/* ---------- Spielwerte (Welt-Einheiten: 30 Einheiten = 1 m) ---------- */
const GRAVITY = 2400;
const HOLD_GRAVITY = 0.72;   // weniger Schwerkraft, solange die Sprungtaste gehalten wird
const JUMP_V = 760;
const AIR_JUMP_FACTOR = 0.9;
const STAGE_SECS = 15;
const UNITS_PER_M = 30;
const PW = 20, PH = 42, PH_SLIDE = 20;
const COYOTE = 0.09, BUFFER = 0.12, SLIDE_TIME = 0.6;

const DIFFS = {
  normal: { start: 330, accel: 6.5, max: 880, freeShield: 0 },
  easy: { start: 260, accel: 4, max: 640, freeShield: 1 },
};

/* ---------- Upgrades ---------- */
const UPGRADES = [
  { id: 'jump', name: 'Sprungkraft', desc: 'Höher springen, länger fliegen.',
    costs: [25, 60, 130, 260, 480], now: (l) => `+${l * 6} % Kraft`,
    icon: '<path d="M12 19V5"/><path d="M6 11l6-6 6 6"/><path d="M5 21h14"/>' },
  { id: 'double', name: 'Doppelsprung', desc: 'Noch ein Sprung in der Luft. Stufe 2 gibt einen dritten.',
    costs: [80, 450], now: (l) => `${l + 1} Sprünge`,
    icon: '<path d="M6 12l6-6 6 6"/><path d="M6 19l6-6 6 6"/>' },
  { id: 'magnet', name: 'Münzmagnet', desc: 'Zieht Münzen in deiner Nähe an.',
    costs: [35, 80, 170, 330, 600], now: (l) => `${2 + l} m Reichweite`,
    icon: '<path d="M6 4v8a6 6 0 0 0 12 0V4"/><path d="M3.5 4h5M15.5 4h5"/>' },
  { id: 'value', name: 'Münzwert', desc: 'Jede Münze zählt mehr.',
    costs: [100, 300, 800], now: (l) => `×${l + 1} pro Münze`,
    icon: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v4c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 10v4c0 1.7 3.1 3 7 3s7-1.3 7-3v-4"/><path d="M5 14v4c0 1.7 3.1 3 7 3s7-1.3 7-3v-4"/>' },
  { id: 'shield', name: 'Schutzschild', desc: 'Jeder Schild fängt einen Zusammenstoß ab.',
    costs: [120, 350, 900], now: (l) => `${l} pro Runde`,
    icon: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/>' },
  { id: 'luck', name: 'Glückstaler', desc: 'Mehr große Taler, die zehnfach zählen.',
    costs: [45, 110, 240, 450, 800], now: (l) => `${(luckChance(l) * 100).toFixed(1).replace('.', ',')} % je Münze`,
    icon: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>' },
  { id: 'start', name: 'Startrakete', desc: 'Die Runde beginnt mit einem Raketenflug.',
    costs: [150, 400, 900], now: (l) => `${l * 100} m Flug`,
    icon: '<path d="M12 3c3 2 4 5 4 9l-4 4-4-4c0-4 1-7 4-9z"/><path d="M9 17l-2 4M15 17l2 4M12 17v4"/>' },
  { id: 'chute', name: 'Fallschirm', desc: 'Sprung halten lässt dich langsam herabgleiten.',
    costs: [90, 220, 450], now: (l) => `−${l * 25} % Fallgeschwindigkeit`,
    icon: '<path d="M3 11a9 7 0 0 1 18 0z"/><path d="M3 11l9 9 9-9M12 11v9"/>' },
  { id: 'power', name: 'Power-up-Profi', desc: 'Power-ups tauchen öfter auf und halten länger.',
    costs: [70, 180, 380, 700], now: (l) => `+${l * 25} % Dauer`,
    icon: '<path d="M13 2L5 14h6l-1 8 8-12h-6z"/>' },
];
const UPG = Object.fromEntries(UPGRADES.map((u) => [u.id, u]));

/* ---------- Power-ups ---------- */
const POWERUPS = {
  rocket: { name: 'Raketenstiefel', dur: 4, color: '#ff8a3d', weight: 1 },
  cane: { name: 'Zuckerstange', dur: 6, color: '#ff5d7a', weight: 1.2 },
  rain: { name: 'Münzregen', dur: 0, color: '#f7c548', weight: 1 },
  flake: { name: 'Schneeflocke', dur: 5, color: '#8fd3ff', weight: 1 },
};

/* ---------- Aussehen ---------- */
const SKINS = [
  { id: 'hat-bommel', slot: 'hat', name: 'Bommelmütze', cost: 150 },
  { id: 'hat-geweih', slot: 'hat', name: 'Rentiergeweih', cost: 300 },
  { id: 'hat-krone', slot: 'hat', name: 'Krone', cost: 900 },
  { id: 'scarf-white', slot: 'scarf', name: 'Weißer Schal', cost: 60, color: '#f3f6fc' },
  { id: 'scarf-green', slot: 'scarf', name: 'Grüner Schal', cost: 60, color: '#2f9d63' },
  { id: 'scarf-gold', slot: 'scarf', name: 'Goldener Schal', cost: 250, color: '#f7c548' },
  { id: 'shoes-boots', slot: 'shoes', name: 'Winterstiefel', cost: 120, color: '#6b4a3a' },
  { id: 'shoes-gold', slot: 'shoes', name: 'Goldene Schuhe', cost: 400, color: '#f7c548' },
];
const SKIN = Object.fromEntries(SKINS.map((s) => [s.id, s]));
const SLOT_NAMES = { hat: 'Kopf', scarf: 'Schal', shoes: 'Schuhe' };

/* ---------- Aufgaben ---------- */
const MISSION_TYPES = {
  coinsRun: { goals: [30, 60, 120, 200, 350], text: (n) => `Sammle ${n} Münzen in einer Runde`, perRun: true },
  distRun: { goals: [300, 600, 1000, 1500, 2500], text: (n) => `Laufe ${n} m in einer Runde`, perRun: true },
  roofs: { goals: [5, 12, 25, 50], text: (n) => `Lande ${n}-mal auf Flachdächern` },
  powerups: { goals: [3, 8, 15, 30], text: (n) => `Sammle ${n} Power-ups` },
  slides: { goals: [5, 15, 30, 60], text: (n) => `Rutsche ${n}-mal` },
  combo: { goals: [2, 3, 4, 5], text: (n) => `Erreiche Combo ×${n}`, perRun: true },
  presents: { goals: [3, 10, 25], text: (n) => `Fang ${n} Geschenke vom Schlitten` },
  bigcoins: { goals: [3, 10, 25, 50], text: (n) => `Sammle ${n} Glückstaler` },
};
const MISSION_REWARDS = [40, 80, 140, 220, 320];

/* ---------- Abzeichen ---------- */
const BADGES = [
  { id: 'first', name: 'Erster Lauf', desc: 'Beende deine erste Runde.' },
  { id: 'm1000', name: 'Kilometerläufer', desc: 'Laufe 1.000 m in einer Runde.' },
  { id: 'm2500', name: 'Ausdauer', desc: 'Laufe 2.500 m in einer Runde.' },
  { id: 'c100', name: 'Sparschwein', desc: 'Sammle 100 Münzen in einer Runde.' },
  { id: 'c500', name: 'Goldrausch', desc: 'Sammle 500 Münzen in einer Runde.' },
  { id: 'lucky', name: 'Glückspilz', desc: 'Sammle 10 Glückstaler in einer Runde.' },
  { id: 'combo5', name: 'Combo-König', desc: 'Erreiche Combo ×5.' },
  { id: 'market', name: 'Marktbesuch', desc: 'Erreiche den Weihnachtsmarkt.' },
  { id: 'forest', name: 'Waldläufer', desc: 'Erreiche den Winterwald.' },
  { id: 'mountain', name: 'Gipfelstürmer', desc: 'Erreiche die Berge.' },
  { id: 'sleigh', name: 'Geschenkefänger', desc: 'Fang 5 Geschenke in einer Runde.' },
  { id: 'max', name: 'Voll ausgebaut', desc: 'Bring ein Upgrade auf die höchste Stufe.' },
  { id: 'stylish', name: 'Schick', desc: 'Kauf dein erstes Aussehen.' },
  { id: 'mission10', name: 'Fleißig', desc: 'Schaffe 10 Aufgaben.' },
];

/* ---------- Gegenden ---------- */
const REGIONS = [
  { id: 'altstadt', name: 'Altstadt', from: 0, badge: null,
    weights: { house: 6, garland: 1.2, snowman: 1, tower: 0.9 } },
  { id: 'markt', name: 'Weihnachtsmarkt', from: 600, badge: 'market',
    weights: { stall: 4, house: 2, gate: 1.4, garland: 2, snowman: 0.6, tower: 0.5 } },
  { id: 'wald', name: 'Winterwald', from: 1300, badge: 'forest',
    weights: { tree: 4, cabin: 2, snowman: 1.5, hole: 1.5, garland: 0.5 } },
  { id: 'berge', name: 'Berge', from: 2200, badge: 'mountain',
    weights: { cabin: 2, rock: 2.5, hole: 2.5, tree: 1.5, snowman: 1 } },
];
function regionAt(m) {
  let r = 0;
  for (let i = 0; i < REGIONS.length; i++) if (m >= REGIONS[i].from) r = i;
  return r;
}

/* ---------- Spielstand (bleibt im Browser gespeichert) ---------- */
const SAVE_KEY = 'jul-run-save-v1';
const defaultSave = () => ({
  wallet: 0, best: 0, bestCoins: 0, runs: 0,
  muted: false, music: true, sfx: true, easy: false,
  up: Object.fromEntries(UPGRADES.map((u) => [u.id, 0])),
  owned: [], wear: { hat: '', scarf: '', shoes: '' },
  missions: [], mTier: {}, missionsDone: 0,
  badges: [], top: [],
});
let save = defaultSave();

function applySave(d) {
  if (!d || typeof d !== 'object') return;
  const s = defaultSave();
  for (const k of ['wallet', 'best', 'bestCoins', 'runs', 'missionsDone']) {
    if (Number.isFinite(d[k])) s[k] = Math.max(0, Math.floor(d[k]));
  }
  for (const k of ['muted', 'easy']) s[k] = !!d[k];
  for (const k of ['music', 'sfx']) if (typeof d[k] === 'boolean') s[k] = d[k];
  if (d.up && typeof d.up === 'object') {
    for (const u of UPGRADES) {
      const v = d.up[u.id];
      if (Number.isFinite(v)) s.up[u.id] = clamp(Math.floor(v), 0, u.costs.length);
    }
  }
  if (Array.isArray(d.owned)) s.owned = d.owned.filter((id) => SKIN[id]);
  if (d.wear && typeof d.wear === 'object') {
    for (const slot of Object.keys(s.wear)) {
      const id = d.wear[slot];
      if (id && SKIN[id] && SKIN[id].slot === slot && s.owned.includes(id)) s.wear[slot] = id;
    }
  }
  if (Array.isArray(d.missions)) {
    s.missions = d.missions
      .filter((m) => m && MISSION_TYPES[m.type])
      .slice(0, 3)
      .map((m) => ({ type: m.type, prog: Number.isFinite(m.prog) ? Math.max(0, m.prog) : 0 }));
  }
  if (d.mTier && typeof d.mTier === 'object') {
    for (const t of Object.keys(MISSION_TYPES)) if (Number.isFinite(d.mTier[t])) s.mTier[t] = Math.max(0, Math.floor(d.mTier[t]));
  }
  if (Array.isArray(d.badges)) s.badges = d.badges.filter((id) => BADGES.some((b) => b.id === id));
  if (Array.isArray(d.top)) {
    s.top = d.top
      .filter((t) => t && Number.isFinite(t.d) && Number.isFinite(t.c))
      .slice(0, 5)
      .map((t) => ({ d: Math.floor(t.d), c: Math.floor(t.c), t: Number.isFinite(t.t) ? t.t : 0 }));
  }
  save = s;
}
function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) applySave(JSON.parse(raw));
  } catch (e) { /* Speicher nicht verfügbar: Spiel läuft trotzdem */ }
}
function persist() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* ignorieren */ }
}

/* ---------- Werte aus Upgrades ---------- */
const lvl = (id) => save.up[id] || 0;
const diff = () => (save.easy ? DIFFS.easy : DIFFS.normal);
const jumpV = () => JUMP_V * (1 + 0.06 * lvl('jump'));
const magnetR = () => (lvl('magnet') ? 60 + 30 * lvl('magnet') : 0);
const coinValue = () => 1 + lvl('value');
const powerDur = (kind) => POWERUPS[kind].dur * (1 + 0.25 * lvl('power'));
const chuteSpeed = () => [0, 300, 220, 150][lvl('chute')];
function luckChance(l) { return 0.006 + 0.009 * l; }

/* ---------- Hilfsfunktionen ---------- */
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[(Math.random() * arr.length) | 0];
function pickWeighted(weights) {
  const entries = Object.entries(weights).filter(([, w]) => w > 0);
  let total = 0;
  for (const [, w] of entries) total += w;
  let r = Math.random() * total;
  for (const [k, w] of entries) { r -= w; if (r <= 0) return k; }
  return entries[entries.length - 1][0];
}
const nf = new Intl.NumberFormat('de-DE');
const fmt = (n) => nf.format(n);
function mix(a, b, t) {
  return `rgb(${(a[0] + (b[0] - a[0]) * t) | 0},${(a[1] + (b[1] - a[1]) * t) | 0},${(a[2] + (b[2] - a[2]) * t) | 0})`;
}
function hash(i) {
  let x = Math.imul(i | 0, 0x9e3779b1) ^ 0x85ebca6b;
  x ^= x >>> 15; x = Math.imul(x, 0x2c1b3c6d);
  x ^= x >>> 12; x = Math.imul(x, 0x297a2d39);
  x ^= x >>> 15;
  return (x >>> 0) / 4294967296;
}
function vnoise(t) {
  const i = Math.floor(t), f = t - i, u = f * f * (3 - 2 * f);
  return hash(i) * (1 - u) + hash(i + 1) * u;
}
const $ = (id) => document.getElementById(id);
const reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
