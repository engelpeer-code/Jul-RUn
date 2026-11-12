'use strict';
/* Jul Run – Spielablauf, Physik, Eingaben, HUD und Hauptschleife. */

const game = $('game');
let lastResult = null, menuShownAt = 0, reviveT = 0;

/* ---------- Größe und Schnee ---------- */
function layout() {
  const r = game.getBoundingClientRect();
  W = Math.max(1, r.width); H = Math.max(1, r.height);
  dpr = Math.min(2, window.devicePixelRatio || 1);
  cvs.width = Math.round(W * dpr); cvs.height = Math.round(H * dpr);
  scale = Math.min(H / 400, W / 520);
  viewW = W / scale;
  groundLine = Math.round(H - clamp(H * 0.17, 56 * scale, 150 * scale));
  playerX = clamp(viewW * 0.2, 90, 190);
  const n = reduceMotion ? 28 : Math.round(clamp((W * H) / 14000, 40, 110));
  snow = Array.from({ length: n }, () => ({
    x: Math.random() * W, y: Math.random() * H, r: 0.8 + Math.random() * 2.2, s: 0.4 + Math.random() * 0.8, ph: Math.random() * 6.28,
  }));
}
function updateSnow(dt) {
  const base = state === 'run' || state === 'dying' ? run.speed : state === 'menu' ? 90 : 0;
  const wind = (base * 0.35 + 14) * scale, fall = 26 * Math.max(scale, 0.7);
  for (const f of snow) {
    f.y += fall * (0.7 + f.s) * dt;
    f.x -= wind * f.s * dt;
    f.x += Math.sin(tGlobal * 1.3 + f.ph) * 8 * dt;
    if (f.y > H + 4) { f.y = -4; f.x = Math.random() * W; }
    if (f.x < -6) f.x += W + 12;
    if (f.x > W + 6) f.x -= W + 12;
  }
}

/* ---------- Partikel ---------- */
function burst(x, y, n, color, speed, grav, size, life, a0, a1, round) {
  for (let i = 0; i < n; i++) {
    const a = rand(a0 === undefined ? 0 : a0, a1 === undefined ? Math.PI * 2 : a1), sp = speed * rand(0.4, 1);
    parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: grav, size, color, life, max: life, round: !!round });
  }
}
function puff(x, y, n) { burst(x, y + 2, n, SNOW, 110, 260, 3.6, 0.45, Math.PI * 0.12, Math.PI * 0.88, true); }

/* ---------- Steuerung ---------- */
function groundJump() {
  const p = player;
  p.vy = jumpV(); p.grounded = false; p.coyote = 0; p.buffer = 0; p.squash = -0.7;
  p.slideT = 0; p.sliding = false;
  puff(cam + playerX, p.y, 5);
  sfx.jump();
}
function pressJump() {
  if (state !== 'run') return;
  const p = player;
  p.holding = true;
  if (p.rocket > 0) return;
  if (p.grounded || p.coyote > 0) { groundJump(); return; }
  if (p.airJumps > 0) {
    p.airJumps--;
    p.vy = jumpV() * AIR_JUMP_FACTOR; p.squash = -0.5;
    burst(cam + playerX, p.y + 4, 10, '#ffffff', 150, 0, 2.6, 0.35, 0, Math.PI * 2, true);
    sfx.air();
    return;
  }
  p.buffer = BUFFER;
}
function releaseJump() { player.holding = false; }
function pressDown() {
  if (state !== 'run') return;
  const p = player;
  p.downHeld = true;
  if (p.grounded) startSlide();
  else if (p.rocket <= 0) { p.vy = Math.min(p.vy, -700); p.holding = false; p.slideT = SLIDE_TIME; }
}
function releaseDown() { player.downHeld = false; }
function startSlide() {
  const p = player;
  if (!p.sliding) { run.slides++; missionAdd('slides', 1); sfx.slide(); puff(cam + playerX, p.y, 4); }
  p.slideT = SLIDE_TIME;
}

/* ---------- Rundenablauf ---------- */
function startRun() {
  if (state === 'run' || state === 'dying' || state === 'paused' || state === 'revive') return;
  audio(); music.sync();
  resetRun();
  if (lvl('start')) player.rocket = 999;
  state = 'run';
  $('menu').hidden = true;
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  for (const k in shownHud) shownHud[k] = -1;
  renderShields();
  setState();
  toast('Los!', lvl('start') ? 'Startrakete gezündet' : save.runs < 3 ? 'Leertaste oder Tippen zum Springen' : '');
}

function setState() { game.dataset.state = state; }

function onHit(o) {
  if (run.shields > 0) {
    run.shields--;
    o.ghost = true;
    player.invuln = 1.0;
    shake = 0.25;
    burst(cam + playerX, player.y + 22, 18, '#8fd3ff', 280, 0, 3, 0.6);
    sfx.shield();
    renderShields();
    toast('Schild weg!', run.shields ? `Noch ${run.shields} übrig` : 'Jetzt gut aufpassen');
    return;
  }
  die(o.kind);
}

function die(cause) {
  const p = player;
  state = 'dying'; setState();
  run.deathCause = cause; run.deathT = 0;
  p.holding = false; p.sliding = false; p.chuting = false;
  if (cause === 'hole') { p.vy = -200; p.rotV = -3; }
  else {
    p.vy = 520; p.rotV = -7; p.grounded = false;
    burst(cam + playerX, p.y + 22, 16, RED, 260, 900, 3.2, 0.7);
    burst(cam + playerX, p.y + 10, 10, SNOW, 200, 700, 3.4, 0.6, 0, Math.PI, true);
  }
  shake = 0.45;
  sfx.crash();
}

const reviveCost = () => 50 + 25 * (run.stage - 1);
const canRevive = () => !run.revived && save.wallet + run.coins >= reviveCost();

function acceptRevive() {
  if (state !== 'revive' || 5 - reviveT < 0.6) return;
  const cost = reviveCost(), fromRun = Math.min(run.coins, cost);
  run.coins -= fromRun;
  save.wallet -= cost - fromRun;
  persist();
  run.revived = true;
  const x0 = cam + playerX - 80, x1 = cam + playerX + 460;
  obs = obs.filter((o) => !(o.kind === 'hole' && o.x < x1 && o.x + o.w > x0));
  for (const o of obs) if (o.x < x1 && o.x + o.w > x0) o.ghost = true;
  Object.assign(player, { y: 0, vy: 0, grounded: true, rot: 0, rotV: 0, lie: 0, offX: 0, invuln: 2, airJumps: lvl('double'), inHole: false });
  $('reviveMenu').hidden = true;
  state = 'run'; setState();
  sfx.revive();
  toast('Weiter geht’s!', '');
}
function declineRevive() {
  if (state !== 'revive') return;
  $('reviveMenu').hidden = true;
  endRun();
}

function endRun() {
  const m = Math.floor(run.dist / UNITS_PER_M);
  lastResult = { coins: run.coins, dist: m, record: m > save.best && m > 0 };
  save.wallet += run.coins;
  save.runs++;
  if (lastResult.record) save.best = m;
  save.bestCoins = Math.max(save.bestCoins, run.coins);
  save.top.push({ d: m, c: run.coins, t: Date.now() });
  save.top.sort((a, b) => b.d - a.d);
  save.top = save.top.slice(0, 5);
  missionSet('distRun', m);
  missionSet('coinsRun', run.coins);
  unlockBadge('first');
  if (m >= 1000) unlockBadge('m1000');
  if (m >= 2500) unlockBadge('m2500');
  if (run.coins >= 100) unlockBadge('c100');
  if (run.coins >= 500) unlockBadge('c500');
  persist();
  if (lastResult.record) submitScore();
  showOver();
}

function pause() {
  if (state !== 'run') return;
  state = 'paused';
  player.holding = false; player.downHeld = false;
  setState();
  $('pauseInfo').textContent = `${fmt(run.coins)} Münzen und ${fmt(Math.floor(run.dist / UNITS_PER_M))} m bisher.`;
  $('pauseMenu').hidden = false;
  $('btnResume').focus({ preventScroll: true });
}
function resume() {
  if (state !== 'paused') return;
  state = 'run';
  $('pauseMenu').hidden = true;
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  setState();
}

/* ---------- Simulation ---------- */
const comboMult = (n) => (n >= 70 ? 5 : n >= 45 ? 4 : n >= 25 ? 3 : n >= 10 ? 2 : 1);

function stepRun(dt) {
  const p = player, D = diff();
  run.time += dt;
  run.speed = Math.min(D.max, D.start + D.accel * run.time);
  if (run.slow > 0) run.slow -= dt;
  const speed = run.speed * (run.slow > 0 ? 0.6 : 1) * (p.rocket > 0 ? 1.2 : 1);
  const dx = speed * dt;
  cam += dx; run.dist += dx;
  const m = run.dist / UNITS_PER_M;

  const st = 1 + Math.floor(run.time / STAGE_SECS);
  if (st > run.stage) { run.stage = st; toast('Stufe ' + st, 'Es wird schneller!'); sfx.stage(); }
  const reg = regionAt(m);
  if (reg > run.region) {
    run.prevRegion = run.region; run.region = reg; run.regionFade = 0;
    toast(REGIONS[reg].name, 'Neue Gegend erreicht');
    if (REGIONS[reg].badge) unlockBadge(REGIONS[reg].badge);
  }
  if (run.regionFade < 1) run.regionFade = Math.min(1, run.regionFade + dt / 1.5);
  if (save.best > 0 && !run.recordToast && m > save.best) {
    run.recordToast = true;
    toast('Neuer Rekord!', 'Lauf weiter!');
    sfx.stage();
  }
  while (nextSpawn < cam + viewW + 160) spawnChunk();
  if (run.duckHintX > 0 && run.duckHintX < cam + viewW * 0.85) {
    run.duckHintX = -2;
    const touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    toast('Ducken!', touch ? 'Halte den Rutsch-Knopf unten rechts' : 'Halte ↓, um darunter durchzurutschen');
  }
  if (!sleigh && run.time >= run.sleighAt) spawnSleigh();
  stepSleigh(dt, speed);
  stepPresents(dt);

  const wx = cam + playerX, pl = wx - PW / 2, pr = wx + PW / 2;
  if (p.buffer > 0) p.buffer -= dt;
  if (p.invuln > 0) p.invuln -= dt;
  if (p.cane > 0) p.cane -= dt;
  if (p.slideT > 0) p.slideT -= dt;
  p.coyote -= dt;

  if (p.rocket > 0) {
    p.rocket -= dt;
    if (p.rocketBoost > 0 && m >= p.rocketBoost) { p.rocketBoost = 0; p.rocket = 0; }
    p.vy = (190 - p.y) * 4;
    p.y += p.vy * dt;
    p.grounded = false; p.sliding = false; p.chuting = false;
    if (p.rocket <= 0) { p.rocket = 0; p.vy = 0; p.invuln = Math.max(p.invuln, 1); p.airJumps = lvl('double'); }
  } else {
    const prevY = p.y;
    p.vy -= (p.holding && p.vy > 0 ? GRAVITY * HOLD_GRAVITY : GRAVITY) * dt;
    p.chuting = false;
    if (lvl('chute') && p.holding && p.vy < -chuteSpeed()) { p.vy = -chuteSpeed(); p.chuting = true; }
    p.y += p.vy * dt;

    if (p.y < 0 && overHole(pl, pr)) p.inHole = true;
    let support = p.inHole ? -Infinity : overHole(pl, pr) ? -Infinity : 0, onRoof = false;
    for (const o of obs) {
      const t = obsTop(o);
      if (t > 0 && pr > o.x && pl < o.x + o.w && prevY >= t - 0.5 && p.y <= t && t > support) { support = t; onRoof = true; }
    }
    if (p.y <= support) {
      if (!p.grounded) {
        if (p.vy < -350) { p.squash = 0.8; puff(wx, support, 6); }
        if (onRoof) { run.roofs++; missionAdd('roofs', 1); }
        if (p.downHeld || p.slideT > 0) startSlide();
      }
      p.y = support; p.vy = 0; p.grounded = true; p.coyote = COYOTE; p.airJumps = lvl('double');
    } else {
      p.grounded = false;
    }
    if (p.inHole && p.y < -20) {
      if (p.invuln > 0 || p.cane > 0) { p.inHole = false; p.y = 0; p.vy = jumpV(); sfx.air(); }
      else { die('hole'); return; }
    }
    if (p.buffer > 0 && (p.grounded || p.coyote > 0)) groundJump();
  }
  p.sliding = p.grounded && (p.slideT > 0 || p.downHeld);
  p.phase += (p.grounded ? dx : dx * 0.3) / 26;

  // Zusammenstöße
  const ph = p.sliding ? PH_SLIDE : PH;
  const safe = p.invuln > 0 || p.cane > 0 || p.rocket > 0;
  for (const o of obs) {
    if (o.ghost || o.kind === 'hole') continue;
    if (pr <= o.x - (o.oh || 0) - 2 || pl >= o.x + o.w + (o.oh || 0) + 2) continue;
    if (!obsHit(o, pl, pr, p.y, p.y + ph)) continue;
    if (safe) {
      if (p.cane > 0) { o.ghost = true; burst(wx + 10, p.y + 20, 14, '#ff5d7a', 260, 600, 3, 0.6); }
      continue;
    }
    onHit(o);
    if (state !== 'run') return;
    break;
  }

  // Münzen, Power-ups, Geschenke
  const pcy = p.y + ph / 2, mr = p.rocket > 0 ? 260 : magnetR();
  for (const c of coins) {
    if (c.taken) continue;
    const ddx = wx - c.x, ddy = pcy - c.y, dist = Math.hypot(ddx, ddy) || 1;
    if (!c.mag && mr && dist < mr) c.mag = true;
    if (c.mag) { const k = Math.min(1, ((speed + 420) * dt) / dist); c.x += ddx * k; c.y += ddy * k; }
    if (dist < c.r + 16) collect(c);
  }
  for (const u of pickups) {
    if (!u.taken && Math.hypot(wx - u.x, pcy - u.y) < 30) takePower(u);
  }
  for (const g of presents) {
    if (!g.taken && Math.hypot(wx - g.x, pcy - (g.y + 6)) < 26) takePresent(g);
  }
}

function collect(c) {
  c.taken = true;
  run.combo++;
  const mult = comboMult(run.combo);
  if (mult > run.mult) {
    texts.push({ x: cam + playerX, y: player.y + 60, txt: 'Combo ×' + mult, life: 1, max: 1, big: true, color: '#ff8a3d' });
    missionSet('combo', mult);
    if (mult >= 5) unlockBadge('combo5');
  }
  run.mult = mult;
  run.maxMult = Math.max(run.maxMult, mult);
  const v = (c.big ? 10 : 1) * coinValue() * mult;
  if (c.big) { run.bigs++; missionAdd('bigcoins', 1); if (run.bigs >= 10) unlockBadge('lucky'); }
  run.coins += v;
  texts.push({ x: c.x, y: c.y + 10, txt: '+' + v, life: 0.8, max: 0.8, big: c.big });
  burst(c.x, c.y, c.big ? 16 : 6, COIN, c.big ? 230 : 140, 0, c.big ? 3 : 2.2, 0.45);
  if (c.big) sfx.big(); else sfx.coin();
  pop($('coinPill'));
}

function takePower(u) {
  u.taken = true;
  const p = player, info = POWERUPS[u.kind];
  run.powerups++;
  missionAdd('powerups', 1);
  sfx.power();
  burst(u.x, u.y, 18, info.color, 240, 0, 3, 0.6);
  if (u.kind === 'rocket') p.rocket = powerDur('rocket');
  else if (u.kind === 'cane') p.cane = powerDur('cane');
  else if (u.kind === 'flake') run.slow = powerDur('flake');
  else for (const c of coins) if (!c.taken && c.x > cam && c.x < cam + viewW + 400) { c.big = true; c.r = 12; }
  toast(info.name, { rocket: 'Ab über die Dächer!', cane: 'Nichts kann dich aufhalten', rain: 'Alle Münzen werden Glückstaler', flake: 'Alles läuft langsamer' }[u.kind]);
}

function takePresent(g) {
  g.taken = true;
  const v = 8 * coinValue();
  run.coins += v;
  run.presents++;
  missionAdd('presents', 1);
  if (run.presents >= 5) unlockBadge('sleigh');
  texts.push({ x: g.x, y: g.y + 20, txt: '+' + v, life: 0.9, max: 0.9, big: true });
  burst(g.x, g.y + 6, 14, g.color, 200, 300, 3, 0.6);
  sfx.present();
  pop($('coinPill'));
}

function stepDying(dt) {
  const p = player;
  run.deathT += dt;
  run.speed = Math.max(0, run.speed - 2600 * dt);
  cam += run.speed * dt;
  if (run.deathCause === 'hole') {
    p.vy -= GRAVITY * dt; p.y += p.vy * dt; p.rot += p.rotV * dt;
  } else if (!p.grounded) {
    p.vy -= GRAVITY * dt; p.y += p.vy * dt; p.offX -= 110 * dt; p.rot += p.rotV * dt;
    if (p.y <= 0 && p.vy < 0) { p.y = 0; p.vy = 0; p.grounded = true; puff(cam + playerX + p.offX, 0, 9); }
  } else {
    p.lie = Math.min(1, p.lie + dt * 8);
    const target = -Math.PI / 2 + Math.round((p.rot + Math.PI / 2) / (Math.PI * 2)) * Math.PI * 2;
    p.rot += (target - p.rot) * Math.min(1, dt * 12);
  }
  if (run.deathT > 1.0) {
    if (canRevive()) showRevive(); else endRun();
  }
}

function update(dt) {
  tGlobal += dt;
  updateSnow(dt);
  music.bpm = state === 'run' ? Math.min(184, 112 + 8 * (run.stage - 1)) : 100;
  if (state === 'paused') return;
  if (state === 'run') {
    const n = Math.max(1, Math.ceil(dt / (1 / 120)));
    for (let i = 0; i < n && state === 'run'; i++) stepRun(dt / n);
    for (const c of coins) {
      if (!c.taken && !c.missed && c.y < 165 && c.x < cam + playerX - 30) {
        c.missed = true;
        if (run.combo > 0) { run.combo = 0; run.mult = 1; }
      }
    }
    coins = coins.filter((c) => !c.taken && c.x > cam - 80);
    pickups = pickups.filter((u) => !u.taken && u.x > cam - 80);
    obs = obs.filter((o) => o.x + o.w + (o.oh || 0) > cam - 60);
  } else if (state === 'dying') {
    stepDying(dt);
  } else if (state === 'revive') {
    reviveT -= dt;
    $('reviveBar').style.width = Math.max(0, (reviveT / 5) * 100) + '%';
    if (reviveT <= 0) declineRevive();
  } else if (state === 'menu') {
    cam += 90 * dt;
    player.phase += (150 * dt) / 26;
    player.y = 0; player.grounded = true;
  }
  for (const q of parts) { q.life -= dt; q.vy -= q.g * dt; q.x += q.vx * dt; q.y += q.vy * dt; }
  parts = parts.filter((q) => q.life > 0);
  for (const t of texts) { t.life -= dt; t.y += 46 * dt; }
  texts = texts.filter((t) => t.life > 0);
  player.squash += (0 - player.squash) * Math.min(1, dt * 10);
  shake = Math.max(0, shake - dt);
  const nightTarget = state === 'menu' ? 0.1 : Math.min(1, run.time / 100);
  night += (nightTarget - night) * Math.min(1, dt * 1.5);
  if (state === 'run' || state === 'dying') updateHUD();
}

/* ---------- HUD ---------- */
const shownHud = { coins: -1, dist: -1, stage: -1, speed: -1, combo: -1, region: -1 };
function pop(el) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
function updateHUD() {
  if (run.coins !== shownHud.coins) { $('hudCoins').textContent = fmt(run.coins); shownHud.coins = run.coins; }
  const m = Math.floor(run.dist / UNITS_PER_M);
  if (m !== shownHud.dist) { $('hudDist').textContent = fmt(m); shownHud.dist = m; if (m % 25 === 0) missionSet('distRun', m); }
  if (run.stage !== shownHud.stage || run.region !== shownHud.region) {
    $('hudStage').textContent = `Stufe ${run.stage} · ${REGIONS[run.region].name}`;
    shownHud.stage = run.stage; shownHud.region = run.region;
  }
  const D = diff(), sp = Math.round(((run.speed - D.start) / (D.max - D.start)) * 100);
  if (sp !== shownHud.speed) { $('hudSpeed').style.width = Math.max(4, sp) + '%'; shownHud.speed = sp; }
  const comboKey = run.combo * 10 + run.mult;
  if (comboKey !== shownHud.combo) {
    const el = $('hudCombo');
    el.hidden = run.combo < 3;
    el.textContent = `Combo ${run.combo}` + (run.mult > 1 ? ` · ×${run.mult}` : '');
    el.classList.toggle('hot', run.mult > 1);
    shownHud.combo = comboKey;
  }
  const p = player, pw = [];
  if (p.rocket > 0 && p.rocket < 900) pw.push(['rocket', p.rocket / powerDur('rocket')]);
  if (p.rocket >= 900) pw.push(['rocket', 1 - run.dist / UNITS_PER_M / Math.max(1, p.rocketBoost)]);
  if (p.cane > 0) pw.push(['cane', p.cane / powerDur('cane')]);
  if (run.slow > 0) pw.push(['flake', run.slow / powerDur('flake')]);
  const box = $('hudPowers');
  const key = pw.map((x) => x[0]).join();
  if (box.dataset.key !== key) {
    box.dataset.key = key;
    box.innerHTML = pw.map(([k]) => `<span class="power-chip" style="--c:${POWERUPS[k].color}"><b>${POWERUPS[k].name}</b><i><u data-k="${k}"></u></i></span>`).join('');
  }
  for (const [k, f] of pw) { const u = box.querySelector(`u[data-k="${k}"]`); if (u) u.style.width = clamp(f, 0, 1) * 100 + '%'; }
}
function renderShields() {
  const total = lvl('shield') + diff().freeShield;
  let html = '';
  for (let i = 0; i < total; i++) {
    html += `<svg viewBox="0 0 24 24" class="${i < run.shields ? 'on' : ''}" aria-hidden="true"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/></svg>`;
  }
  $('hudShields').innerHTML = html;
  $('hudShields').setAttribute('aria-label', `${run.shields} von ${total} Schutzschilden`);
}
function toast(big, small) {
  const el = $('toast');
  $('toastBig').textContent = big;
  $('toastSmall').textContent = small || '';
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
}
function notice(text, kind) {
  const box = $('notices');
  const el = document.createElement('div');
  el.className = 'notice' + (kind ? ' ' + kind : '');
  el.textContent = text;
  box.appendChild(el);
  while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => el.remove(), 3200);
}

/* ---------- Eingaben ---------- */
const JUMP_KEYS = new Set(['Space', 'ArrowUp', 'KeyW']);
const DOWN_KEYS = new Set(['ArrowDown', 'KeyS']);
const onButton = (e) => !!(e.target && e.target.closest && e.target.closest('button, input, a'));
const menuReady = () => performance.now() - menuShownAt > 450;

window.addEventListener('keydown', (e) => {
  if (JUMP_KEYS.has(e.code)) {
    if (state === 'run') { e.preventDefault(); if (!e.repeat) pressJump(); }
    else if ((state === 'menu' || state === 'over') && !onButton(e)) { e.preventDefault(); if (!e.repeat && menuReady()) startRun(); }
    else if (state === 'paused' && !onButton(e)) { e.preventDefault(); resume(); }
    return;
  }
  if (DOWN_KEYS.has(e.code)) { if (state === 'run') { e.preventDefault(); if (!e.repeat) pressDown(); } return; }
  if (e.code === 'Enter' && (state === 'menu' || state === 'over') && !onButton(e) && menuReady()) { e.preventDefault(); startRun(); return; }
  if (e.code === 'KeyP' || e.code === 'Escape') {
    if (state === 'run') pause(); else if (state === 'paused') resume(); else if (state === 'revive' && e.code === 'Escape') declineRevive();
    return;
  }
  if (e.code === 'KeyM' && !e.repeat && !onButton(e)) toggleMute();
});
window.addEventListener('keyup', (e) => {
  if (JUMP_KEYS.has(e.code)) releaseJump();
  if (DOWN_KEYS.has(e.code)) releaseDown();
});
game.addEventListener('pointerdown', (e) => {
  if (onButton(e) || (e.target.closest && e.target.closest('.overlay'))) return;
  if (state !== 'run') return;
  e.preventDefault();
  pressJump();
});
window.addEventListener('pointerup', releaseJump);
window.addEventListener('pointercancel', releaseJump);
cvs.addEventListener('contextmenu', (e) => e.preventDefault());
const slideBtn = $('btnSlide');
slideBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); pressDown(); });
for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) slideBtn.addEventListener(ev, releaseDown);
document.addEventListener('pointerdown', () => { if (!save.muted && save.music) { audio(); music.sync(); } }, { once: true });

/* ---------- Gamepad ---------- */
let padPrev = {};
function pollGamepad() {
  const list = navigator.getGamepads ? navigator.getGamepads() : [];
  let gp = null;
  for (const g of list) if (g && g.connected) { gp = g; break; }
  if (!gp) { padPrev = {}; return; }
  const b = (i) => !!(gp.buttons[i] && gp.buttons[i].pressed);
  const ay = gp.axes[1] || 0;
  const cur = { a: b(0) || b(12) || ay < -0.6, down: b(13) || b(1) || ay > 0.6, start: b(9) };
  const edge = (k) => cur[k] && !padPrev[k];
  if (state === 'run') {
    if (edge('a')) pressJump();
    if (!cur.a && padPrev.a) releaseJump();
    if (edge('down')) pressDown();
    if (!cur.down && padPrev.down) releaseDown();
    if (edge('start')) pause();
  } else if (state === 'paused') {
    if (edge('start') || edge('a')) resume();
  } else if (state === 'menu' || state === 'over') {
    if ((edge('a') || edge('start')) && menuReady()) startRun();
  } else if (state === 'revive') {
    if (edge('a')) acceptRevive();
    if (edge('down')) declineRevive();
  }
  padPrev = cur;
}

/* ---------- Hauptschleife und Start ---------- */
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  pollGamepad();
  update(dt);
  render();
  music.tick();
  requestAnimationFrame(frame);
}

window.addEventListener('blur', pause);
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
window.addEventListener('resize', layout);

function boot(data) {
  loadSave();
  if (data && data.save) applySave(data.save);
  layout();
  ensureMissions();
  buildMenu();
  showStartMenu();
  initBoard();
  requestAnimationFrame((t) => { last = t; frame(t); });
}
const hot = window.claude && window.claude.hot;
try { if (hot && hot.snapshot) hot.snapshot(() => ({ save })); } catch (e) { /* optional */ }
if (hot && hot.ready) hot.ready(boot); else boot((hot && hot.data) || {});
