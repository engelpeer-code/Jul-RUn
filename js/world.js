'use strict';
/* Jul Run – Zustand der Welt, Hindernisse, Münzen, Power-ups und Schlitten. */

let state = 'menu'; // menu | run | paused | dying | revive | over
let W = 1, H = 1, dpr = 1, scale = 1, viewW = 520, groundLine = 300, playerX = 110;
let cam = 0, tGlobal = 0, shake = 0, night = 0.1;
let obs = [], coins = [], pickups = [], presents = [], parts = [], texts = [], snow = [];
let sleigh = null;
let nextSpawn = 0;

const run = {};
const player = {};

function resetRun() {
  Object.assign(run, {
    time: 0, speed: diff().start, dist: 0, coins: 0, stage: 1,
    shields: lvl('shield') + diff().freeShield, deathT: 0,
    combo: 0, mult: 1, maxMult: 1, region: 0, prevRegion: 0, regionFade: 1,
    slow: 0, sleighAt: rand(35, 50), presents: 0, bigs: 0, startCam: cam,
    flagX: save.best > 0 ? cam + playerX + save.best * UNITS_PER_M : -1, recordToast: false,
    revived: false, roofs: 0, slides: 0, powerups: 0, deathCause: '', duckHintX: -1,
  });
  Object.assign(player, {
    y: 0, vy: 0, grounded: true, coyote: 0, buffer: 0, holding: false, airJumps: lvl('double'),
    phase: 0, squash: 0, rot: 0, rotV: 0, offX: 0, lie: 0, invuln: 0,
    slideT: 0, downHeld: false, sliding: false, rocket: 0, rocketBoost: lvl('start') * 100,
    cane: 0, chuting: false, inHole: false,
  });
  obs = []; coins = []; pickups = []; presents = []; texts = []; parts = [];
  sleigh = null;
  nextSpawn = cam + viewW + 80;
}
resetRun();

/* ---------- Hindernisse bauen ---------- */
const WALLS = [[216, 165, 70], [95, 154, 150], [234, 220, 192], [111, 134, 184], [155, 176, 138], [178, 156, 204]];
const ROOFS = [[58, 63, 92], [86, 62, 74], [45, 72, 86]];
const WOOD = [[140, 92, 60], [118, 78, 52], [160, 108, 70]];
const AWNINGS = [['#e5322d', '#f3f6fc'], ['#2f9d63', '#f3f6fc'], ['#3d6fd1', '#f3f6fc'], ['#e5322d', '#f7c548']];

function makeWindows(w, wallH, rowStep) {
  const cols = Math.max(1, Math.floor((w - 12) / 22));
  const rows = Math.max(1, Math.floor((wallH - 28) / rowStep) + 1);
  const cellW = (w - 12) / cols;
  const doorCol = (Math.random() * cols) | 0;
  const wins = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (r === 0 && c === doorCol) continue;
      wins.push({ x: 6 + cellW * (c + 0.5), y: 8 + r * rowStep, lit: Math.random() < 0.55 });
    }
  }
  return { wins, doorX: 6 + cellW * (doorCol + 0.5) };
}

function makeHouse(x, d, style, forceGable) {
  let flat = false, w, wallH, rh;
  if (style === 'stall') {
    w = rand(70, 110); wallH = rand(26, 34); rh = rand(14, 20);
  } else if (style === 'cabin') {
    w = rand(70, 100); wallH = rand(34, 50 + 8 * d); rh = rand(22, 30);
  } else {
    flat = !forceGable && Math.random() < 0.32;
    w = flat ? rand(84, 150 + 40 * d) : rand(62, 100 + 20 * d);
    wallH = flat ? rand(40, 60 + 26 * d) : rand(34, 52 + 16 * d);
    rh = flat ? 0 : rand(18, 26 + 6 * d);
  }
  const win = style === 'stall' ? { wins: [], doorX: -100 } : makeWindows(w, wallH, 24);
  return {
    kind: 'house', style, x, w, wallH, rh, oh: flat ? 0 : 8, flat,
    wall: style === 'cabin' ? pick(WOOD) : pick(WALLS), roofC: pick(ROOFS), awning: pick(AWNINGS),
    wins: win.wins, doorX: win.doorX, wreath: Math.random() < 0.6,
    lights: !flat && Math.random() < 0.5, ghost: false,
  };
}

function makeObstacle(kind, x, d) {
  switch (kind) {
    case 'house': return makeHouse(x, d, 'town', false);
    case 'stall': return makeHouse(x, d, 'stall', true);
    case 'cabin': return makeHouse(x, d, 'cabin', true);
    case 'tower': {
      const w = rand(70, 90), wallH = rand(140, 165);
      const win = makeWindows(w, wallH, 22);
      return { kind, x, w, wallH, oh: 0, flat: true, wall: pick(WALLS), roofC: pick(ROOFS), wins: win.wins, doorX: win.doorX, ghost: false };
    }
    case 'rock': {
      const w = rand(70, 130), wallH = rand(70, 112);
      return { kind, x, w, wallH, oh: 0, flat: true, seed: (Math.random() * 1000) | 0, ghost: false };
    }
    case 'snowman': return { kind, x, w: 24, h: 34, oh: 0, ghost: false, scarf: pick(['#e5322d', '#2f9d63', '#3d6fd1']) };
    case 'tree': {
      const w = rand(44, 60);
      return { kind, x, w, h: rand(60, 90), oh: 0, ghost: false };
    }
    case 'gate': return { kind, x, w: rand(62, 80), gap: 30, top: rand(108, 124), oh: 0, ghost: false };
    case 'garland': return { kind, x, w: rand(70, 100), lo: 28, oh: 0, ghost: false };
    case 'hole': return { kind, x, w: rand(50, 80 + 30 * d), oh: 0, ghost: false };
    default: return makeHouse(x, d, 'town', false);
  }
}

/* ---------- Kollision ---------- */
function rectHit(ax0, ax1, ay0, ay1, pl, pr, y0, y1) {
  return pr > ax0 && pl < ax1 && y1 > ay0 && y0 < ay1;
}
function roofLineAt(cx, half, baseY, height, xx) {
  return baseY + height * (1 - Math.abs(xx - cx) / half);
}
function triHit(cx, half, baseY, height, pl, pr, y0) {
  const a = Math.max(pl, cx - half), b = Math.min(pr, cx + half);
  if (a >= b) return false;
  return y0 < roofLineAt(cx, half, baseY, height, clamp(cx, a, b)) - 3;
}
function obsTop(o) {
  if (o.ghost) return -1;
  if ((o.kind === 'house' && o.flat) || o.kind === 'tower' || o.kind === 'rock') return o.wallH;
  if (o.kind === 'gate') return o.top;
  return -1;
}
function obsHit(o, pl, pr, y0, y1) {
  switch (o.kind) {
    case 'house':
      if (o.flat) return rectHit(o.x, o.x + o.w, 0, o.wallH - 1, pl, pr, y0, y1);
      if (rectHit(o.x, o.x + o.w, 0, o.wallH, pl, pr, y0, y1)) return true;
      return triHit(o.x + o.w / 2, o.w / 2 + o.oh, o.wallH, o.rh, pl, pr, y0);
    case 'tower': case 'rock':
      return rectHit(o.x, o.x + o.w, 0, o.wallH - 1, pl, pr, y0, y1);
    case 'snowman':
      return rectHit(o.x + 3, o.x + o.w - 3, 0, o.h, pl, pr, y0, y1);
    case 'tree': {
      const cx = o.x + o.w / 2;
      if (rectHit(cx - 4, cx + 4, 0, 12, pl, pr, y0, y1)) return true;
      return triHit(cx, o.w / 2, 12, o.h, pl, pr, y0);
    }
    case 'gate': return rectHit(o.x, o.x + o.w, o.gap, o.top - 1, pl, pr, y0, y1);
    case 'garland': return rectHit(o.x + 6, o.x + o.w - 6, o.lo, o.lo + 8, pl, pr, y0, y1);
    default: return false;
  }
}
function overHole(pl, pr) {
  for (const o of obs) if (o.kind === 'hole' && pl > o.x + 2 && pr < o.x + o.w - 2) return true;
  return false;
}
// Höhe, auf der etwas an Stelle x liegen bleibt (für Geschenke)
function surfaceAt(x) {
  let s = -Infinity, hole = false;
  for (const o of obs) {
    if (o.kind === 'hole') { if (x > o.x + 2 && x < o.x + o.w - 2) hole = true; continue; }
    if (o.ghost || x < o.x - (o.oh || 0) || x > o.x + o.w + (o.oh || 0)) continue;
    const t = obsTop(o);
    if (t > 0) s = Math.max(s, t);
    else if (o.kind === 'house') s = Math.max(s, roofLineAt(o.x + o.w / 2, o.w / 2 + o.oh, o.wallH, o.rh, x));
  }
  return hole ? s : Math.max(s, 0);
}

/* ---------- Münzen und Power-ups ---------- */
function addCoin(x, y) {
  const big = Math.random() < luckChance(lvl('luck'));
  coins.push({ x, y, r: big ? 12 : 8, big, ph: Math.random() * 6.28, mag: false, taken: false });
}
function coinLine(x, y, n, sp) {
  for (let i = 0; i < n; i++) addCoin(x + i * sp, y);
}
function coinArc(x0, x1, top) {
  const n = clamp(Math.round((x1 - x0) / 26), 4, 10);
  const base = Math.max(24, top * 0.55), peak = Math.min(top + 34, 150);
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    addCoin(x0 + (x1 - x0) * t, base + (peak - base) * Math.sin(Math.PI * t));
  }
}
function obsHeight(o) {
  switch (o.kind) {
    case 'house': return o.wallH + o.rh;
    case 'tree': return 12 + o.h;
    case 'snowman': return o.h;
    case 'garland': return o.lo + 8;
    case 'gate': return o.top;
    case 'hole': return 0;
    default: return o.wallH;
  }
}
function coinsFor(row) {
  const r = Math.random();
  if (r < 0.15) return;
  const first = row[0], last = row[row.length - 1];
  const top = obsTop(first);
  if (row.length === 1 && top > 0 && r < 0.6) {
    const n = Math.max(2, Math.floor((first.w - 16) / 24));
    coinLine(first.x + (first.w - (n - 1) * 24) / 2, top + 18, n, 24);
    return;
  }
  if (row.length === 1 && (first.kind === 'garland' || first.kind === 'gate') && r < 0.7) {
    coinLine(first.x - 10, 10, Math.max(3, Math.round((first.w + 20) / 24)), 24);
    return;
  }
  if (first.kind === 'tower' || first.kind === 'rock' || first.kind === 'gate') return;
  const x0 = first.x - (first.oh || 0) - 26, x1 = last.x + last.w + (last.oh || 0) + 26;
  coinArc(x0, x1, Math.max(...row.map(obsHeight)));
}

function addPickup(x, y) {
  const weights = Object.fromEntries(Object.entries(POWERUPS).map(([k, p]) => [k, p.weight]));
  pickups.push({ x, y, kind: pickWeighted(weights), ph: Math.random() * 6.28, taken: false });
}

/* ---------- Welt nachliefern ---------- */
function spawnChunk() {
  const d = Math.min(1, run.time / 90);
  const reg = REGIONS[run.region];
  const weights = Object.assign({}, reg.weights);
  if (weights.tower && lvl('double') < 1) weights.tower = 0;
  const kind = pickWeighted(weights);
  const row = [makeObstacle(kind, nextSpawn, d)];
  const first = row[0];
  if (first.kind === 'house' && first.flat && Math.random() < 0.15 + 0.3 * d) {
    row.push(makeHouse(first.x + first.w, d, 'town', Math.random() < 0.6));
  } else if (first.kind === 'stall' && Math.random() < 0.4) {
    row.push(makeHouse(first.x + first.w + 16, d, 'stall', true));
  }
  for (const o of row) obs.push(o);
  if ((first.kind === 'garland' || first.kind === 'gate') && run.duckHintX === -1 && save.runs < 6) run.duckHintX = first.x;
  coinsFor(row);
  const last = row[row.length - 1];
  const end = last.x + last.w + (last.oh || 0);
  const gap = run.speed * rand(0.75, 1.3) + rand(90, 210) - 50 * d;
  const rr = Math.random();
  const pChance = 0.06 + 0.02 * lvl('power');
  if (rr < pChance) {
    addPickup(end + gap * 0.45, rand(30, 70));
  } else if (rr < 0.5) {
    coinLine(end + gap * 0.28, 18, clamp(Math.floor((gap * 0.4) / 24), 3, 6), 24);
  } else if (rr < 0.62) {
    coinLine(end + gap * 0.32, 172, 3, 26); // hoch: nur mit gehaltenem Sprung oder Doppelsprung
  }
  nextSpawn = end + gap + 8;
}

/* ---------- Schlitten ---------- */
function spawnSleigh() {
  sleigh = { x: cam - 140, y: 205, drops: 5, dropT: 0 };
  run.sleighAt = run.time + rand(55, 85);
  sfx.bells();
  toast('Der Schlitten kommt!', 'Fang die Geschenke');
}
function stepSleigh(dt, speed) {
  if (!sleigh) return;
  sleigh.x += (speed + 260) * dt;
  sleigh.y = 205 + Math.sin(tGlobal * 3) * 6;
  sleigh.dropT -= dt;
  if (sleigh.drops > 0 && sleigh.dropT <= 0 && sleigh.x > cam + playerX + 140 && sleigh.x < cam + viewW - 40) {
    presents.push({ x: sleigh.x - 30, y: sleigh.y - 12, vy: 60, landed: false, color: pick(['#e5322d', '#2f9d63', '#3d6fd1', '#b65fd6']) });
    sleigh.drops--;
    sleigh.dropT = 0.34;
  }
  if (sleigh.x > cam + viewW + 220) sleigh = null;
}
function stepPresents(dt) {
  for (const p of presents) {
    if (p.landed) continue;
    p.vy -= GRAVITY * 0.45 * dt;
    p.y += p.vy * dt;
    const s = surfaceAt(p.x);
    if (Number.isFinite(s) && p.y <= s) { p.y = s; p.landed = true; }
  }
  presents = presents.filter((p) => !p.taken && p.y > -60 && p.x > cam - 60);
}
