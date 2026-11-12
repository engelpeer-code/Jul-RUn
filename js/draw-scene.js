'use strict';
/* Jul Run – Szene zeichnen: Himmel, Hintergründe je Gegend, Boden, Hindernisse. */

const cvs = $('stage');
const ctx = cvs.getContext('2d');

const SKY = {
  top: [[38, 52, 110], [8, 12, 34]],
  mid: [[122, 94, 152], [20, 30, 72]],
  hor: [[246, 168, 100], [48, 62, 118]],
};
const HILL = [[96, 108, 166], [28, 38, 82]];
const HILL_TOP = [[214, 222, 244], [96, 110, 158]];
const CITY = [[66, 72, 126], [20, 27, 62]];
const FIR_FAR = [[70, 92, 130], [22, 34, 60]];
const FIR_MID = [[46, 78, 96], [16, 30, 48]];
const PEAK = [[104, 116, 170], [34, 44, 90]];
const NIGHT_TINT = [22, 28, 64];
const SNOW = '#f3f6fc';
const NAVY = '#161d3b';
const COIN = '#f7c548', COIN_DEEP = '#b47d17', COIN_LIGHT = '#fff0b3';
const RED = '#e5322d', RED_DEEP = '#9e1d1a';
const BULBS = ['#ff5d5d', '#ffd24a', '#6fe0a0', '#71b7ff'];

function ell(x, y, rx, ry) {
  ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), 0, 0, Math.PI * 2); ctx.fill();
}
function tri(x0, y0, x1, y1, x2, y2) {
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); ctx.closePath(); ctx.fill();
}
const sx = (wx) => (wx - cam) * scale;
const sy = (h) => groundLine - h * scale;

/* ---------- Himmel ---------- */
function drawSky(n) {
  const g = ctx.createLinearGradient(0, 0, 0, groundLine);
  g.addColorStop(0, mix(SKY.top[0], SKY.top[1], n));
  g.addColorStop(0.55, mix(SKY.mid[0], SKY.mid[1], n));
  g.addColorStop(1, mix(SKY.hor[0], SKY.hor[1], n));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, groundLine + 4);
  const sa = 0.12 + 0.88 * n;
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 80; i++) {
    const x = hash(i * 3 + 1) * W, y = hash(i * 3 + 2) * groundLine * 0.62;
    const tw = 0.55 + 0.45 * Math.sin(tGlobal * (1 + hash(i) * 2) + i);
    ctx.globalAlpha = sa * tw * (0.35 + 0.65 * hash(i * 3 + 3)) * (1 - y / (groundLine * 0.7));
    const s = hash(i * 7) > 0.85 ? 2 : 1.2;
    ctx.fillRect(x, y, s, s);
  }
  ctx.globalAlpha = 1;
  const mr = clamp(20 * scale, 13, 42);
  const mx = W * 0.8, my = groundLine * (0.36 - 0.14 * n);
  const glow = ctx.createRadialGradient(mx, my, mr * 0.6, mx, my, mr * 3.4);
  glow.addColorStop(0, `rgba(255,244,214,${0.16 + 0.22 * n})`);
  glow.addColorStop(1, 'rgba(255,244,214,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(mx - mr * 3.4, my - mr * 3.4, mr * 6.8, mr * 6.8);
  ctx.fillStyle = mix([255, 232, 196], [248, 246, 232], n);
  ell(mx, my, mr, mr);
  ctx.fillStyle = 'rgba(190,180,160,0.35)';
  ell(mx - mr * 0.3, my - mr * 0.2, mr * 0.22, mr * 0.22);
  ell(mx + mr * 0.25, my + mr * 0.3, mr * 0.15, mr * 0.15);
}

/* ---------- Hintergründe ---------- */
function drawHills(n) {
  const off = cam * 0.12, step = 6, pts = [];
  for (let x = 0; x <= W + step; x += step) {
    const wx = off + x / scale;
    pts.push(x, groundLine - (70 + 55 * vnoise(wx / 230) + 22 * vnoise(wx / 70 + 50)) * scale);
  }
  ctx.fillStyle = mix(HILL[0], HILL[1], n);
  ctx.beginPath(); ctx.moveTo(0, groundLine);
  for (let i = 0; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.lineTo(W + step, groundLine); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = mix(HILL_TOP[0], HILL_TOP[1], n);
  ctx.lineWidth = Math.max(1.5, 3 * scale); ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let i = 0; i < pts.length; i += 2) (i ? ctx.lineTo : ctx.moveTo).call(ctx, pts[i], pts[i + 1] + 1);
  ctx.stroke();
}

function drawMountains(n) {
  const off = cam * 0.07, step = 6;
  ctx.save();
  ctx.beginPath(); ctx.moveTo(0, groundLine);
  for (let x = 0; x <= W + step; x += step) {
    const wx = off + x / scale;
    const ridge = 1 - Math.abs(2 * vnoise(wx / 140) - 1);
    ctx.lineTo(x, groundLine - (60 + 120 * ridge * ridge + 18 * vnoise(wx / 40 + 9)) * scale);
  }
  ctx.lineTo(W + step, groundLine); ctx.closePath();
  ctx.fillStyle = mix(PEAK[0], PEAK[1], n);
  ctx.fill();
  ctx.clip();
  ctx.fillStyle = mix([236, 242, 252], [120, 134, 182], n);
  ctx.beginPath(); ctx.moveTo(0, 0);
  for (let x = 0; x <= W + step; x += step * 3) {
    const wx = off + x / scale;
    ctx.lineTo(x, groundLine - (138 + 10 * Math.sin(wx / 9) + 8 * vnoise(wx / 20)) * scale);
  }
  ctx.lineTo(W + step, 0); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawCity(n, f) {
  const seg = 54, off = cam * f;
  const i0 = Math.floor(off / seg) - 1, i1 = Math.ceil((off + viewW) / seg) + 1;
  const body = mix(CITY[0], CITY[1], n), litA = 0.45 + 0.45 * n;
  for (let i = i0; i <= i1; i++) {
    const r1 = hash(i * 7 + 11), r2 = hash(i * 13 + 5), r3 = hash(i * 17 + 3);
    const bwU = seg - 8 - r2 * 12, bhU = 34 + r1 * 70;
    const bx = (i * seg - off) * scale, bw = bwU * scale, top = groundLine - bhU * scale;
    ctx.fillStyle = body;
    ctx.fillRect(bx, top, bw, bhU * scale + 1);
    if (hash(i * 29 + 1) < 0.07) {
      const tw = 14 * scale, tx = bx + bw / 2 - tw / 2, th = 46 * scale;
      ctx.fillRect(tx, top - th, tw, th);
      tri(tx - 2 * scale, top - th, tx + tw / 2, top - th - 32 * scale, tx + tw + 2 * scale, top - th);
      ctx.fillStyle = `rgba(255,214,130,${litA})`;
      ell(tx + tw / 2, top - th + 12 * scale, 3.4 * scale, 3.4 * scale);
    } else if (r3 > 0.42) {
      tri(bx - 2 * scale, top, bx + bw / 2, top - (12 + r2 * 16) * scale, bx + bw + 2 * scale, top);
    }
    const cols = 2 + ((r2 * 2) | 0), rows = Math.max(1, Math.floor((bhU - 14) / 16));
    ctx.fillStyle = `rgba(255,214,130,${litA})`;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (hash(i * 101 + r * 7 + c * 13) < 0.78 - 0.4 * n) continue;
        ctx.fillRect(bx + ((c + 0.5) * bwU / cols - 2) * scale, top + (8 + r * 16) * scale, 4 * scale, 5 * scale);
      }
    }
  }
}

function drawFirs(n, f, seg, minH, maxH, col, seed, density) {
  const off = cam * f;
  const i0 = Math.floor(off / seg) - 2, i1 = Math.ceil((off + viewW) / seg) + 2;
  const c = mix(col[0], col[1], n);
  const snowC = mix([226, 234, 250], [110, 124, 170], n);
  for (let i = i0; i <= i1; i++) {
    if (hash(i * 31 + seed) > density) continue;
    const h = (minH + hash(i * 17 + seed) * (maxH - minH)) * scale;
    const w = h * 0.5;
    const x = (i * seg + hash(i * 5 + seed) * seg * 0.5 - off) * scale;
    for (let k = 0; k < 3; k++) {
      const yb = groundLine - h * k * 0.28, ww = w * (1 - k * 0.22);
      ctx.fillStyle = c;
      tri(x - ww / 2, yb, x, yb - h * 0.5, x + ww / 2, yb);
      ctx.fillStyle = snowC;
      tri(x - ww * 0.16, yb - h * 0.42, x, yb - h * 0.5, x + ww * 0.16, yb - h * 0.42);
    }
  }
}

function drawMarket(n) {
  const seg = 70, f = 0.55, off = cam * f;
  const i0 = Math.floor(off / seg) - 1, i1 = Math.ceil((off + viewW) / seg) + 1;
  const body = mix([92, 70, 90], [34, 30, 58], n);
  for (let i = i0; i <= i1; i++) {
    const x = (i * seg - off) * scale;
    if (hash(i * 41 + 3) < 0.1) {
      // großer Weihnachtsbaum
      const h = 120 * scale, cx = x + 30 * scale;
      ctx.fillStyle = mix([40, 96, 80], [16, 40, 40], n);
      for (let k = 0; k < 4; k++) tri(cx - (34 - k * 6) * scale, groundLine - k * 26 * scale, cx, groundLine - (k * 26 + 44) * scale, cx + (34 - k * 6) * scale, groundLine - k * 26 * scale);
      ctx.fillStyle = COIN;
      ell(cx, groundLine - h + 2 * scale, 4 * scale, 4 * scale);
      for (let b = 0; b < 12; b++) {
        ctx.fillStyle = BULBS[b % 4];
        ctx.globalAlpha = 0.6 + 0.4 * Math.sin(tGlobal * 3 + b);
        ell(cx + (hash(b + i) - 0.5) * 50 * scale * (1 - b / 14), groundLine - (8 + b * 8) * scale, 1.8 * scale, 1.8 * scale);
      }
      ctx.globalAlpha = 1;
      continue;
    }
    const w = (40 + hash(i * 13) * 14) * scale, h = (22 + hash(i * 7) * 8) * scale;
    ctx.fillStyle = body;
    ctx.fillRect(x, groundLine - h, w, h);
    tri(x - 4 * scale, groundLine - h, x + w / 2, groundLine - h - 14 * scale, x + w + 4 * scale, groundLine - h);
    ctx.fillStyle = `rgba(255,206,120,${0.35 + 0.4 * n})`;
    ctx.fillRect(x + 5 * scale, groundLine - h + 6 * scale, w - 10 * scale, 7 * scale);
  }
}

function drawBackdrop(region, n) {
  switch (REGIONS[region].id) {
    case 'markt': drawHills(n); drawCity(n, 0.3); drawMarket(n); break;
    case 'wald': drawHills(n); drawFirs(n, 0.22, 26, 50, 90, FIR_FAR, 7, 0.8); drawFirs(n, 0.45, 40, 60, 110, FIR_MID, 3, 0.55); break;
    case 'berge': drawMountains(n); drawFirs(n, 0.4, 44, 50, 95, FIR_MID, 11, 0.4); break;
    default: drawHills(n); drawCity(n, 0.38);
  }
}

/* ---------- Boden ---------- */
function drawGround(n) {
  const gy = groundLine;
  const g = ctx.createLinearGradient(0, gy, 0, H);
  g.addColorStop(0, mix([234, 240, 251], [150, 166, 210], n));
  g.addColorStop(1, mix([166, 182, 222], [52, 64, 110], n));
  ctx.fillStyle = g;
  ctx.fillRect(0, gy, W, H - gy);
  ctx.fillStyle = mix([196, 208, 236], [96, 112, 162], n);
  const step = 38, k0 = Math.floor(cam / step);
  for (let k = k0; (k * step - cam) * scale < W + 30; k++) {
    const r = hash(k * 5 + 1), y = gy + (10 + r * 46) * scale;
    if (y < H) ell((k * step - cam) * scale, y, (5 + r * 9) * scale, 1.6 * scale);
  }
  ctx.fillStyle = SNOW;
  ctx.fillRect(0, gy - 1, W, 3 * scale);
  for (const o of obs) if (o.kind === 'hole') drawHole(o, n);
}

function drawHole(o, n) {
  const x = sx(o.x), w = o.w * scale;
  if (x > W || x + w < 0) return;
  ctx.fillStyle = mix([34, 70, 128], [12, 26, 60], n);
  ctx.fillRect(x, groundLine - 1, w, H - groundLine + 1);
  ctx.fillStyle = 'rgba(160,210,255,0.35)';
  for (let i = 0; i < 3; i++) {
    const yy = groundLine + (12 + i * 14) * scale;
    ctx.fillRect(x + w * (0.2 + 0.2 * Math.sin(tGlobal * 2 + i)), yy, w * 0.3, 1.5 * scale);
  }
  ctx.fillStyle = '#dff0ff';
  ctx.fillRect(x - 3 * scale, groundLine - 2 * scale, 6 * scale, 6 * scale);
  ctx.fillRect(x + w - 3 * scale, groundLine - 2 * scale, 6 * scale, 6 * scale);
}

/* ---------- Hindernisse ---------- */
function drawWindows(o, x, n) {
  const s = scale, gy = groundLine;
  const frame = mix(o.wall, [30, 34, 70], 0.55), dark = mix([52, 60, 98], [20, 24, 50], n);
  for (const win of o.wins) {
    const wx = x + (win.x - 5) * s, wy = gy - (win.y + 12) * s;
    if (win.lit && n > 0.15) {
      ctx.fillStyle = `rgba(255,214,120,${0.28 * n})`;
      ctx.fillRect(wx - 3 * s, wy - 3 * s, 16 * s, 18 * s);
    }
    ctx.fillStyle = win.lit ? '#ffd77a' : dark;
    ctx.fillRect(wx, wy, 10 * s, 12 * s);
    ctx.fillStyle = frame;
    ctx.fillRect(wx + 4.5 * s, wy, s, 12 * s);
    ctx.fillRect(wx, wy + 5.5 * s, 10 * s, s);
    ctx.fillStyle = SNOW;
    ctx.fillRect(wx - s, wy + 12 * s, 12 * s, 1.8 * s);
  }
}

function drawDoor(o, x, n) {
  const s = scale, gy = groundLine, dx = x + (o.doorX - 5.5) * s;
  ctx.fillStyle = mix([96, 62, 50], [44, 30, 34], n * 0.5);
  ctx.fillRect(dx, gy - 19 * s, 11 * s, 19 * s);
  ctx.fillStyle = COIN;
  ell(dx + 8.5 * s, gy - 9 * s, 0.9 * s, 0.9 * s);
  if (o.wreath) {
    ctx.strokeStyle = '#2f8f5b'; ctx.lineWidth = 1.8 * s;
    ctx.beginPath(); ctx.arc(dx + 5.5 * s, gy - 13 * s, 3.2 * s, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = RED;
    ell(dx + 5.5 * s, gy - 10 * s, 1.3 * s, 1.1 * s);
  }
}

function drawStringLights(x0, x1, y, n, alpha) {
  const s = scale, count = Math.max(4, Math.round((x1 - x0) / (9 * s)));
  ctx.strokeStyle = 'rgba(20,24,50,0.6)'; ctx.lineWidth = Math.max(0.6, 0.8 * s);
  ctx.beginPath();
  const pts = [];
  for (let i = 0; i <= count; i++) {
    const t = i / count, px = x0 + (x1 - x0) * t;
    const py = y + (1.5 + 2.6 * Math.abs(Math.sin((t * count * Math.PI) / 2))) * s;
    pts.push(px, py);
    (i ? ctx.lineTo : ctx.moveTo).call(ctx, px, py);
  }
  ctx.stroke();
  for (let i = 0; i < pts.length; i += 2) {
    const on = 0.55 + 0.45 * Math.sin(tGlobal * 3 + i * 0.85);
    ctx.fillStyle = BULBS[(i / 2) % 4];
    if (n > 0.2) { ctx.globalAlpha = alpha * 0.25 * n * on; ell(pts[i], pts[i + 1], 4 * s, 4 * s); }
    ctx.globalAlpha = alpha * (0.6 + 0.4 * on);
    ell(pts[i], pts[i + 1], 1.7 * s, 1.7 * s);
  }
  ctx.globalAlpha = alpha;
}

function drawGableRoof(o, x, w, by, n, tint) {
  const s = scale, bl = x - o.oh * s, br = x + w + o.oh * s;
  const ax = x + w / 2, ay = by - o.rh * s, half = (o.w / 2 + o.oh) * s;
  if (o.style === 'stall') {
    ctx.save();
    ctx.beginPath(); ctx.moveTo(bl, by); ctx.lineTo(ax, ay); ctx.lineTo(br, by); ctx.closePath(); ctx.clip();
    const stripe = 8 * s;
    for (let i = 0, xx = bl; xx < br; i++, xx += stripe) {
      ctx.fillStyle = o.awning[i % 2];
      ctx.fillRect(xx, ay, stripe, by - ay);
    }
    ctx.restore();
  } else {
    ctx.fillStyle = mix(o.roofC, NIGHT_TINT, tint * 0.6);
    tri(bl, by, ax, ay, br, by);
  }
  ctx.fillStyle = SNOW;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(ax - half * 0.4, ay + o.rh * s * 0.4);
  ctx.quadraticCurveTo(ax, ay + o.rh * s * 0.62, ax + half * 0.4, ay + o.rh * s * 0.4);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = SNOW; ctx.lineWidth = 4.5 * s; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(bl + s, by - s); ctx.lineTo(ax, ay); ctx.lineTo(br - s, by - s); ctx.stroke();
  if (o.lights || o.style === 'stall') drawStringLights(bl, br, by, n, o.ghost ? 0.3 : 1);
}

function drawHouse(o, n) {
  const s = scale, gy = groundLine, x = sx(o.x), w = o.w * s, wh = o.wallH * s;
  const tint = n * 0.45;
  if (o.style === 'stall') {
    ctx.fillStyle = mix([140, 92, 60], NIGHT_TINT, tint);
    ctx.fillRect(x, gy - wh, w, wh);
    ctx.fillStyle = `rgba(255,206,120,${0.75 + 0.2 * n})`;
    ctx.fillRect(x + 6 * s, gy - wh + 5 * s, w - 12 * s, 9 * s);
    ctx.fillStyle = mix([96, 62, 40], NIGHT_TINT, tint);
    ctx.fillRect(x + 4 * s, gy - wh + 14 * s, w - 8 * s, 3 * s);
    ctx.fillStyle = 'rgba(40,24,20,0.35)';
    for (let i = 0; i < 4; i++) ell(x + (14 + i * ((o.w - 28) / 3)) * s, gy - wh + 11 * s, 2.2 * s, 2.2 * s);
  } else {
    ctx.fillStyle = mix(o.wall, NIGHT_TINT, tint);
    ctx.fillRect(x, gy - wh, w, wh);
    if (o.style === 'cabin') {
      ctx.fillStyle = 'rgba(40,20,10,0.25)';
      for (let yy = 6; yy < o.wallH; yy += 6) ctx.fillRect(x, gy - yy * s, w, 1.2 * s);
    }
    ctx.fillStyle = 'rgba(20,24,56,0.16)';
    ctx.fillRect(x + w - 6 * s, gy - wh, 6 * s, wh);
    drawWindows(o, x, n);
    drawDoor(o, x, n);
  }
  if (o.flat) {
    ctx.fillStyle = mix(o.roofC, NIGHT_TINT, tint * 0.6);
    ctx.fillRect(x - 3 * s, gy - wh, w + 6 * s, 6 * s);
    drawSnowCap(x - 5 * s, gy - wh, w + 10 * s);
  } else {
    drawGableRoof(o, x, w, gy - wh, n, tint);
  }
}

function drawSnowCap(x, y, w) {
  ctx.fillStyle = SNOW;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y - 4 * scale, w, 6 * scale, 3 * scale); else ctx.rect(x, y - 4 * scale, w, 6 * scale);
  ctx.fill();
}

function drawTower(o, n) {
  const s = scale, gy = groundLine, x = sx(o.x), w = o.w * s, wh = o.wallH * s;
  ctx.fillStyle = mix(o.wall, NIGHT_TINT, n * 0.5);
  ctx.fillRect(x, gy - wh, w, wh);
  ctx.fillStyle = 'rgba(20,24,56,0.2)';
  ctx.fillRect(x + w - 8 * s, gy - wh, 8 * s, wh);
  drawWindows(o, x, n);
  drawDoor(o, x, n);
  ctx.fillStyle = mix(o.roofC, NIGHT_TINT, n * 0.3);
  ctx.fillRect(x - 3 * s, gy - wh, w + 6 * s, 7 * s);
  ctx.fillRect(x + w * 0.7, gy - wh - 16 * s, 2 * s, 16 * s);
  ctx.fillStyle = RED;
  ell(x + w * 0.7 + s, gy - wh - 17 * s, 2 * s, 2 * s);
  drawSnowCap(x - 5 * s, gy - wh, w + 10 * s);
}

function drawRock(o, n) {
  const s = scale, gy = groundLine, x = sx(o.x), w = o.w * s, top = gy - o.wallH * s;
  ctx.fillStyle = mix([112, 120, 150], [44, 50, 80], n);
  const j1 = (hash(o.seed) - 0.5) * 10 * s, j2 = (hash(o.seed + 1) - 0.5) * 10 * s;
  ctx.beginPath();
  ctx.moveTo(x - 8 * s, gy);
  ctx.lineTo(x - 3 * s + j1, gy - o.wallH * s * 0.5);
  ctx.lineTo(x, top);
  ctx.lineTo(x + w, top);
  ctx.lineTo(x + w + 3 * s + j2, gy - o.wallH * s * 0.5);
  ctx.lineTo(x + w + 8 * s, gy);
  ctx.closePath(); ctx.fill();
  ctx.fillRect(x, top, w, o.wallH * s);
  ctx.fillStyle = 'rgba(20,24,56,0.18)';
  ctx.fillRect(x + w * 0.62, top + 6 * s, w * 0.38, o.wallH * s - 6 * s);
  drawSnowCap(x - 4 * s, top, w + 8 * s);
}

function drawSnowman(o, n) {
  const s = scale, gy = groundLine, cx = sx(o.x + o.w / 2);
  const body = mix([246, 249, 255], [176, 190, 226], n);
  ctx.fillStyle = body;
  ell(cx, gy - 9 * s, 11 * s, 9 * s);
  ell(cx, gy - 22 * s, 8 * s, 7 * s);
  ell(cx, gy - 31 * s, 5.5 * s, 5.5 * s);
  ctx.fillStyle = o.scarf;
  ctx.fillRect(cx - 6 * s, gy - 27 * s, 12 * s, 2.5 * s);
  ctx.fillStyle = NAVY;
  ctx.fillRect(cx - 5 * s, gy - 38 * s, 10 * s, 2 * s);
  ctx.fillRect(cx - 3.5 * s, gy - 44 * s, 7 * s, 6 * s);
  ell(cx - 2 * s, gy - 32 * s, 0.9 * s, 0.9 * s);
  ell(cx + 2 * s, gy - 32 * s, 0.9 * s, 0.9 * s);
  ctx.fillStyle = '#f08a2c';
  tri(cx, gy - 30.5 * s, cx - 6 * s, gy - 29.5 * s, cx, gy - 29 * s);
}

function drawTree(o, n) {
  const s = scale, gy = groundLine, cx = sx(o.x + o.w / 2), h = o.h * s, w = o.w * s;
  ctx.fillStyle = mix([96, 62, 40], [40, 28, 30], n);
  ctx.fillRect(cx - 4 * s, gy - 12 * s, 8 * s, 12 * s);
  const green = mix([46, 112, 84], [18, 48, 46], n);
  for (let k = 0; k < 3; k++) {
    const yb = gy - 12 * s - h * k * 0.3, ww = w * (1 - k * 0.24);
    ctx.fillStyle = green;
    tri(cx - ww / 2, yb, cx, yb - h * (k === 2 ? 0.4 : 0.48), cx + ww / 2, yb);
    ctx.fillStyle = SNOW;
    tri(cx - ww / 2, yb, cx - ww * 0.32, yb - 3 * s, cx - ww * 0.1, yb);
  }
}

function drawGate(o, n) {
  const s = scale, gy = groundLine, x = sx(o.x), w = o.w * s;
  const stone = mix([176, 160, 140], [70, 66, 84], n);
  ctx.fillStyle = mix([110, 100, 96], [36, 36, 56], n);
  ctx.fillRect(x - 10 * s, gy - o.gap * s - 2, 10 * s, o.gap * s + 2);
  ctx.fillRect(x + w, gy - o.gap * s - 2, 10 * s, o.gap * s + 2);
  ctx.fillStyle = stone;
  ctx.fillRect(x, gy - o.top * s, w, (o.top - o.gap) * s);
  ctx.fillStyle = 'rgba(30,24,40,0.25)';
  for (let r = 0; r < (o.top - o.gap) / 10; r++) {
    const yy = gy - (o.gap + r * 10) * s;
    ctx.fillRect(x, yy, w, s);
    for (let c = (r % 2) * 10; c < o.w; c += 20) ctx.fillRect(x + c * s, yy - 10 * s, s, 10 * s);
  }
  ctx.fillStyle = '#ffd77a';
  ctx.fillRect(x + w / 2 - 6 * s, gy - (o.top - 22) * s, 12 * s, 12 * s);
  ctx.font = `${Math.round(9 * s)}px Bungee, "Arial Black", sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = RED;
  ctx.fillRect(x + 4 * s, gy - (o.gap + 10) * s, w - 8 * s, 8 * s);
  ctx.fillStyle = SNOW;
  ctx.fillText('↓', x + w / 2, gy - (o.gap + 6) * s);
  drawSnowCap(x - 4 * s, gy - o.top * s, w + 8 * s);
}

function drawGarland(o, n) {
  const s = scale, gy = groundLine, x = sx(o.x), w = o.w * s;
  ctx.fillStyle = mix([60, 66, 100], [24, 28, 52], n);
  ctx.fillRect(x + 2 * s, gy - (o.lo + 34) * s, 3 * s, (o.lo + 34) * s);
  ctx.fillRect(x + w - 5 * s, gy - (o.lo + 34) * s, 3 * s, (o.lo + 34) * s);
  ctx.fillStyle = '#ffd77a';
  ell(x + 3.5 * s, gy - (o.lo + 36) * s, 3.4 * s, 3.4 * s);
  ell(x + w - 3.5 * s, gy - (o.lo + 36) * s, 3.4 * s, 3.4 * s);
  ctx.strokeStyle = '#2f8f5b'; ctx.lineWidth = 4 * s; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x + 6 * s, gy - (o.lo + 8) * s);
  ctx.quadraticCurveTo(x + w / 2, gy - (o.lo - 2) * s, x + w - 6 * s, gy - (o.lo + 8) * s);
  ctx.stroke();
  for (let i = 1; i < 9; i++) {
    const t = i / 9, xx = x + 6 * s + (w - 12 * s) * t;
    const yy = gy - (o.lo + 8 - 10 * 4 * t * (1 - t) * 0.9) * s;
    ctx.fillStyle = BULBS[i % 4];
    ctx.globalAlpha = (o.ghost ? 0.3 : 1) * (0.6 + 0.4 * Math.sin(tGlobal * 4 + i));
    ell(xx, yy + 2 * s, 2 * s, 2 * s);
  }
  ctx.globalAlpha = o.ghost ? 0.3 : 1;
}

function drawObstacle(o, n) {
  const x0 = sx(o.x - (o.oh || 0) - 12), x1 = sx(o.x + o.w + (o.oh || 0) + 12);
  if (x0 > W || x1 < 0 || o.kind === 'hole') return;
  ctx.save();
  if (o.ghost) ctx.globalAlpha = 0.3;
  switch (o.kind) {
    case 'house': drawHouse(o, n); break;
    case 'tower': drawTower(o, n); break;
    case 'rock': drawRock(o, n); break;
    case 'snowman': drawSnowman(o, n); break;
    case 'tree': drawTree(o, n); break;
    case 'gate': drawGate(o, n); break;
    case 'garland': drawGarland(o, n); break;
  }
  ctx.restore();
}
