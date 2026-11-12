'use strict';
/* Jul Run – Männchen, Münzen, Power-ups, Schlitten, Effekte und das Gesamtbild. */

/* ---------- Das rote Männchen (Einheiten, Ursprung an den Füßen) ---------- */
function cEll(c, x, y, rx, ry) {
  c.beginPath(); c.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), 0, 0, Math.PI * 2); c.fill();
}
function limb(c, x, y, a, bend, l1, l2, color, w) {
  const kx = x + Math.sin(a) * l1, ky = y + Math.cos(a) * l1, a2 = a - bend;
  const fx = kx + Math.sin(a2) * l2, fy = ky + Math.cos(a2) * l2;
  c.strokeStyle = color; c.lineWidth = w;
  c.beginPath(); c.moveTo(x, y); c.lineTo(kx, ky); c.lineTo(fx, fy); c.stroke();
  return [fx, fy, a2];
}

function paintHat(c, hat, bob) {
  const hx = 1.5, hy = -38 + bob;
  if (hat === 'hat-bommel') {
    c.fillStyle = '#2f9d63';
    c.beginPath(); c.arc(hx, hy - 4.5, 8.6, Math.PI, 0); c.lineTo(hx + 2, hy - 19); c.closePath(); c.fill();
    c.fillStyle = SNOW;
    c.fillRect(hx - 9, hy - 7, 18, 3);
    cEll(c, hx + 3, hy - 20, 3, 3);
  } else if (hat === 'hat-geweih') {
    c.strokeStyle = '#8a5a3a'; c.lineWidth = 2; c.lineCap = 'round';
    c.beginPath();
    c.moveTo(hx - 3, hy - 7); c.lineTo(hx - 7, hy - 17); c.moveTo(hx - 5, hy - 12); c.lineTo(hx - 10, hy - 13);
    c.moveTo(hx - 6.2, hy - 15); c.lineTo(hx - 3.5, hy - 20);
    c.moveTo(hx + 4, hy - 7); c.lineTo(hx + 8, hy - 17); c.moveTo(hx + 6, hy - 12); c.lineTo(hx + 11, hy - 13);
    c.moveTo(hx + 7.2, hy - 15); c.lineTo(hx + 5, hy - 20);
    c.stroke();
  } else if (hat === 'hat-krone') {
    c.fillStyle = COIN;
    c.beginPath();
    c.moveTo(hx - 7, hy - 6); c.lineTo(hx - 7, hy - 14); c.lineTo(hx - 3.5, hy - 10); c.lineTo(hx, hy - 16);
    c.lineTo(hx + 3.5, hy - 10); c.lineTo(hx + 7, hy - 14); c.lineTo(hx + 7, hy - 6); c.closePath(); c.fill();
    c.fillStyle = RED; cEll(c, hx, hy - 9, 1.4, 1.4);
  }
}

// o: { phase, pose: 'run'|'air'|'down'|'slide'|'idle', wear, chute, rocket, t }
function paintRunner(c, o) {
  const wear = o.wear || {}, t = o.t || 0;
  const scarfC = wear.scarf ? SKIN[wear.scarf].color : RED_DEEP;
  const shoeC = wear.shoes ? SKIN[wear.shoes].color : null;
  let fA, fB, bA, bB, aF, aB, bob = 0;
  const ph = o.phase || 0;
  c.save();
  c.lineCap = 'round'; c.lineJoin = 'round';
  if (o.pose === 'slide') { c.translate(-2, 1); c.rotate(-1.2); c.translate(0, 0); }
  if (o.pose === 'down') { fA = 0.6; fB = 0.2; bA = -0.4; bB = 0.3; aF = 2.6; aB = -2.4; }
  else if (o.pose === 'slide') { fA = 1.25; fB = 0; bA = 1.05; bB = 0.15; aF = -1.6; aB = -2.2; }
  else if (o.pose === 'air') { fA = 0.9; fB = 1.4; bA = -0.35; bB = 0.8; aF = 2.5; aB = -0.9; }
  else if (o.pose === 'idle') { fA = 0.12; fB = 0.1; bA = -0.12; bB = 0.1; aF = 0.3; aB = -0.3; bob = Math.sin(t * 3) * 0.6; }
  else {
    fA = Math.sin(ph) * 0.85; bA = -fA;
    fB = 0.25 + Math.max(0, Math.cos(ph)) * 1.2;
    bB = 0.25 + Math.max(0, -Math.cos(ph)) * 1.2;
    aF = -Math.sin(ph) * 1.1; aB = -aF;
    bob = -Math.abs(Math.cos(ph)) * 1.6;
  }

  if (o.chute) {
    c.strokeStyle = 'rgba(243,246,252,0.8)'; c.lineWidth = 0.8;
    c.beginPath(); c.moveTo(-1, -30 + bob); c.lineTo(-16, -66); c.moveTo(-1, -30 + bob); c.lineTo(16, -66); c.stroke();
    for (let i = 0; i < 4; i++) {
      c.fillStyle = i % 2 ? SNOW : RED;
      c.beginPath(); c.moveTo(0, -78);
      c.arc(0, -64, 18, Math.PI + (i * Math.PI) / 4, Math.PI + ((i + 1) * Math.PI) / 4);
      c.closePath(); c.fill();
    }
  }
  if (o.rocket) {
    const fl = 8 + Math.sin(t * 40) * 3;
    c.fillStyle = 'rgba(255,138,61,0.9)';
    c.beginPath(); c.moveTo(-6, 0); c.lineTo(0, fl + 6); c.lineTo(6, 0); c.closePath(); c.fill();
    c.fillStyle = '#ffe28a';
    c.beginPath(); c.moveTo(-3, 0); c.lineTo(0, fl); c.lineTo(3, 0); c.closePath(); c.fill();
  }

  const wave = Math.sin(t * 14) * 2;
  c.strokeStyle = scarfC; c.lineWidth = 3.4;
  c.beginPath(); c.moveTo(-1, -30 + bob);
  c.quadraticCurveTo(-8, -31 + bob + wave, -15, -28 + bob - wave);
  c.stroke();

  const backFoot = limb(c, -1, -15 + bob, bA, bB, 8, 8.5, RED_DEEP, 5);
  limb(c, -1, -29 + bob, aB, -0.9, 6, 5.5, RED_DEEP, 4);
  c.fillStyle = RED;
  cEll(c, 0, -22 + bob, 8.5, 10);
  const frontFoot = limb(c, 0, -15 + bob, fA, fB, 8, 8.5, RED, 5);
  if (shoeC) {
    c.fillStyle = shoeC;
    for (const f of [backFoot, frontFoot]) {
      c.save(); c.translate(f[0], f[1]); c.rotate(-f[2]); cEll(c, 1.6, 0.6, 3.6, 2.4); c.restore();
    }
  }
  c.strokeStyle = scarfC; c.lineWidth = 3.2;
  c.beginPath(); c.moveTo(-5, -30 + bob); c.lineTo(5, -30.5 + bob); c.stroke();
  c.fillStyle = RED;
  cEll(c, 1.5, -38 + bob, 8.5, 8.5);
  c.fillStyle = 'rgba(255,255,255,0.22)';
  cEll(c, -1.5, -41.5 + bob, 3, 2.4);
  c.fillStyle = '#ffffff';
  cEll(c, 5.2, -39 + bob, 3, 3.4);
  if (o.pose === 'down') {
    c.strokeStyle = NAVY; c.lineWidth = 1.3;
    c.beginPath();
    c.moveTo(3.8, -40.6 + bob); c.lineTo(6.8, -37.4 + bob);
    c.moveTo(6.8, -40.6 + bob); c.lineTo(3.8, -37.4 + bob);
    c.stroke();
  } else {
    c.fillStyle = NAVY;
    cEll(c, 6.3, -38.6 + bob, 1.6, 1.6);
  }
  paintHat(c, wear.hat, bob);
  limb(c, 1, -29 + bob, aF, -0.9, 6, 5.5, RED, 4);
  c.restore();
}

function playerPose() {
  const p = player;
  if (state === 'dying' || state === 'over' || state === 'revive') return 'down';
  if (state === 'menu') return 'run';
  if (p.sliding) return 'slide';
  return p.grounded && p.rocket <= 0 ? 'run' : 'air';
}

function drawPlayer() {
  const p = player;
  const px = (playerX + p.offX) * scale, py = groundLine - p.y * scale;
  ctx.save();
  ctx.translate(px, py);
  ctx.scale(scale, scale);
  const active = state === 'run' || state === 'paused';
  if (active && p.invuln > 0 && Math.floor(p.invuln * 16) % 2 === 0) ctx.globalAlpha = 0.4;
  if (active && run.shields > 0) {
    ctx.save();
    ctx.strokeStyle = 'rgba(143,211,255,0.6)'; ctx.fillStyle = 'rgba(143,211,255,0.1)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, p.sliding ? -12 : -23, 30 + Math.sin(tGlobal * 4) * 1.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  if (active && p.cane > 0) {
    ctx.save();
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    ctx.lineDashOffset = -tGlobal * 40;
    ctx.strokeStyle = '#ff5d7a';
    ctx.beginPath(); ctx.arc(0, -22, 27, 0, Math.PI * 2); ctx.stroke();
    ctx.lineDashOffset = -tGlobal * 40 + 5;
    ctx.strokeStyle = SNOW;
    ctx.beginPath(); ctx.arc(0, -22, 27, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  if (p.lie) ctx.translate(0, 12 * p.lie);
  ctx.translate(0, -22); ctx.rotate(p.rot); ctx.translate(0, 22);
  ctx.scale(1 + p.squash * 0.14, 1 - p.squash * 0.14);
  paintRunner(ctx, {
    phase: p.phase, pose: playerPose(), wear: save.wear, t: tGlobal,
    chute: active && p.chuting, rocket: active && p.rocket > 0,
  });
  ctx.restore();
}

/* ---------- Münzen, Power-ups, Geschenke ---------- */
function drawStar(cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  ctx.closePath(); ctx.fill();
}

function drawCoins() {
  for (const c of coins) {
    const x = sx(c.x), y = sy(c.y);
    if (x < -30 || x > W + 30) continue;
    const r = c.r * scale, spin = Math.abs(Math.cos(tGlobal * 3 + c.ph)), rx = Math.max(r * 0.16, r * spin);
    if (c.big) {
      const gl = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 2.4);
      gl.addColorStop(0, 'rgba(255,220,120,0.45)'); gl.addColorStop(1, 'rgba(255,220,120,0)');
      ctx.fillStyle = gl; ctx.fillRect(x - r * 2.4, y - r * 2.4, r * 4.8, r * 4.8);
    }
    ctx.fillStyle = COIN_DEEP; ell(x, y, rx, r);
    ctx.fillStyle = COIN; ell(x, y, rx * 0.8, r * 0.8);
    if (spin > 0.35) { ctx.fillStyle = COIN_LIGHT; ell(x - rx * 0.28, y - r * 0.32, rx * 0.2, r * 0.2); }
    if (c.big && spin > 0.3) {
      ctx.save(); ctx.translate(x, y); ctx.scale(spin, 1);
      ctx.fillStyle = COIN_DEEP; drawStar(0, 0, r * 0.5);
      ctx.restore();
    }
  }
}

function paintPowerIcon(c, kind, r) {
  c.lineCap = 'round'; c.lineJoin = 'round';
  if (kind === 'rocket') {
    c.fillStyle = SNOW;
    c.beginPath(); c.moveTo(0, -r * 0.7); c.quadraticCurveTo(r * 0.45, -r * 0.2, r * 0.3, r * 0.35); c.lineTo(-r * 0.3, r * 0.35); c.quadraticCurveTo(-r * 0.45, -r * 0.2, 0, -r * 0.7); c.fill();
    c.fillStyle = '#ffe28a';
    c.beginPath(); c.moveTo(-r * 0.2, r * 0.38); c.lineTo(0, r * 0.75); c.lineTo(r * 0.2, r * 0.38); c.fill();
  } else if (kind === 'cane') {
    c.lineWidth = r * 0.28;
    c.strokeStyle = SNOW;
    c.beginPath(); c.moveTo(r * 0.15, r * 0.65); c.lineTo(r * 0.15, -r * 0.2); c.arc(-r * 0.15, -r * 0.2, r * 0.3, 0, Math.PI, true); c.stroke();
    c.strokeStyle = '#d61f45'; c.setLineDash([r * 0.18, r * 0.18]);
    c.stroke(); c.setLineDash([]);
  } else if (kind === 'rain') {
    for (const [dx, dy] of [[-0.3, 0.2], [0.3, 0.2], [0, -0.25]]) {
      c.fillStyle = COIN_DEEP; cEll(c, dx * r, dy * r, r * 0.3, r * 0.3);
      c.fillStyle = COIN; cEll(c, dx * r, dy * r, r * 0.22, r * 0.22);
    }
  } else {
    c.strokeStyle = SNOW; c.lineWidth = r * 0.14;
    c.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      c.moveTo(0, 0); c.lineTo(Math.cos(a) * r * 0.65, Math.sin(a) * r * 0.65);
    }
    c.stroke();
  }
}

function drawPickups() {
  for (const p of pickups) {
    const x = sx(p.x), y = sy(p.y + Math.sin(tGlobal * 3 + p.ph) * 4);
    if (x < -40 || x > W + 40) continue;
    const r = 13 * scale, col = POWERUPS[p.kind].color;
    const gl = ctx.createRadialGradient(x, y, r * 0.4, x, y, r * 2.2);
    gl.addColorStop(0, col + '88'); gl.addColorStop(1, col + '00');
    ctx.fillStyle = gl; ctx.fillRect(x - r * 2.2, y - r * 2.2, r * 4.4, r * 4.4);
    ctx.fillStyle = col; ell(x, y, r, r);
    ctx.strokeStyle = SNOW; ctx.lineWidth = 2 * scale;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.save(); ctx.translate(x, y); paintPowerIcon(ctx, p.kind, r); ctx.restore();
  }
}

function drawPresents() {
  for (const p of presents) {
    const x = sx(p.x), y = sy(p.y), s = scale;
    if (x < -30 || x > W + 30) continue;
    ctx.fillStyle = p.color;
    ctx.fillRect(x - 8 * s, y - 13 * s, 16 * s, 13 * s);
    ctx.fillStyle = COIN;
    ctx.fillRect(x - 1.5 * s, y - 13 * s, 3 * s, 13 * s);
    ctx.fillRect(x - 8 * s, y - 8 * s, 16 * s, 3 * s);
    ell(x - 3 * s, y - 15 * s, 3 * s, 2 * s);
    ell(x + 3 * s, y - 15 * s, 3 * s, 2 * s);
  }
}

function drawSleigh() {
  if (!sleigh) return;
  const x = sx(sleigh.x), y = sy(sleigh.y), s = scale;
  ctx.save();
  ctx.translate(x, y); ctx.scale(s, s);
  const brown = '#8a5a3a';
  for (const dx of [64, 40]) {
    const leg = Math.sin(tGlobal * 12 + dx) * 0.6;
    ctx.fillStyle = brown;
    cEll(ctx, dx, -6, 10, 5);
    cEll(ctx, dx + 10, -13, 4, 3.5);
    ctx.strokeStyle = brown; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(dx - 6, -3); ctx.lineTo(dx - 6 + Math.sin(leg) * 6, 6);
    ctx.moveTo(dx + 6, -3); ctx.lineTo(dx + 6 - Math.sin(leg) * 6, 6);
    ctx.moveTo(dx + 9, -15); ctx.lineTo(dx + 7, -22); ctx.moveTo(dx + 12, -15); ctx.lineTo(dx + 14, -22);
    ctx.stroke();
    ctx.fillStyle = dx === 64 ? RED : NAVY; cEll(ctx, dx + 14, -13, 1.4, 1.4);
  }
  ctx.strokeStyle = 'rgba(247,197,72,0.8)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(14, -8); ctx.lineTo(62, -10); ctx.stroke();
  ctx.fillStyle = RED;
  ctx.beginPath(); ctx.moveTo(-18, -18); ctx.lineTo(16, -14); ctx.lineTo(16, 0); ctx.lineTo(-14, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#7a4a2e'; cEll(ctx, -6, -20, 9, 7);
  ctx.strokeStyle = COIN; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-20, 4); ctx.lineTo(18, 4); ctx.quadraticCurveTo(24, 4, 22, -2); ctx.stroke();
  ctx.restore();
}

function drawFlag() {
  if (run.flagX < 0 || state === 'menu') return;
  const x = sx(run.flagX), s = scale;
  if (x < -60 || x > W + 60) return;
  ctx.fillStyle = '#c9d3ee';
  ctx.fillRect(x - s, groundLine - 64 * s, 2.5 * s, 64 * s);
  ctx.fillStyle = COIN;
  ctx.beginPath(); ctx.moveTo(x + s, groundLine - 64 * s); ctx.lineTo(x + 44 * s, groundLine - 56 * s); ctx.lineTo(x + s, groundLine - 46 * s); ctx.closePath(); ctx.fill();
  ctx.fillStyle = NAVY;
  ctx.font = `${Math.max(8, Math.round(7 * s))}px Bungee, "Arial Black", sans-serif`;
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('REKORD', x + 4 * s, groundLine - 56 * s);
}

/* ---------- Effekte ---------- */
function drawParticles() {
  for (const q of parts) {
    const x = sx(q.x), y = sy(q.y), sz = q.size * scale;
    ctx.globalAlpha = Math.max(0, q.life / q.max);
    ctx.fillStyle = q.color;
    if (q.round) ell(x, y, sz / 2, sz / 2); else ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz);
  }
  ctx.globalAlpha = 1;
}

function drawTexts() {
  if (!texts.length) return;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  for (const t of texts) {
    const size = Math.max(12, (t.big ? 20 : 14) * scale);
    ctx.font = `${Math.round(size)}px Bungee, "Arial Black", sans-serif`;
    const x = sx(t.x), y = sy(t.y);
    ctx.globalAlpha = Math.min(1, (t.life / t.max) * 1.6);
    ctx.lineWidth = Math.max(2, 3 * scale);
    ctx.strokeStyle = 'rgba(22,29,59,0.9)';
    ctx.strokeText(t.txt, x, y);
    ctx.fillStyle = t.color || COIN;
    ctx.fillText(t.txt, x, y);
  }
  ctx.globalAlpha = 1;
}

function drawSpeedLines() {
  if (state !== 'run' || reduceMotion) return;
  const boost = player.rocket > 0 ? 0.6 : 0;
  const a = Math.max(boost, (run.speed - 520) / (diff().max - 520));
  if (a <= 0) return;
  ctx.strokeStyle = `rgba(255,255,255,${0.26 * Math.min(1, a)})`;
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 7; i++) {
    const y = groundLine - (30 + hash(i * 9 + 2) * 170) * scale;
    const len = (50 + hash(i * 9 + 4) * 90) * scale, span = W + len * 2;
    const x = W + len - ((tGlobal * Math.max(run.speed, 500) * scale * 1.6 + hash(i * 9 + 7) * span) % span);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.stroke();
  }
}

function drawSnow() {
  ctx.fillStyle = 'rgba(255,255,255,0.82)';
  ctx.beginPath();
  for (const f of snow) { ctx.moveTo(f.x + f.r, f.y); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); }
  ctx.fill();
}

/* ---------- Gesamtbild ---------- */
function render() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawSky(night);
  ctx.save();
  if (shake > 0 && !reduceMotion) ctx.translate((Math.random() - 0.5) * shake * 24, (Math.random() - 0.5) * shake * 24);
  const region = state === 'menu' ? 0 : run.region;
  if (state !== 'menu' && run.regionFade < 1) {
    drawBackdrop(run.prevRegion, night);
    ctx.globalAlpha = run.regionFade;
    drawBackdrop(region, night);
    ctx.globalAlpha = 1;
  } else {
    drawBackdrop(region, night);
  }
  drawSleigh();
  drawGround(night);
  drawFlag();
  for (const o of obs) drawObstacle(o, night);
  drawPresents();
  drawCoins();
  drawPickups();
  drawSpeedLines();
  drawParticles();
  drawPlayer();
  drawTexts();
  ctx.restore();
  drawSnow();
  if (run.slow > 0 && state === 'run') {
    ctx.fillStyle = `rgba(143,211,255,${0.1 * Math.min(1, run.slow)})`;
    ctx.fillRect(0, 0, W, H);
  }
}
