'use strict';
/* Jul Run – Menü: Laden, Aussehen, Aufgaben, Abzeichen, Bestenliste, Einstellungen, Wiederbeleben. */

const OUCH = ['Das Haus stand im Weg.', 'Die Hauswand war härter.', 'Knapp daneben ist auch vorbei.', 'Ein Hindernis zu viel.'];
const CAUSE = { hole: 'Ab ins eiskalte Wasser.', snowman: 'Der Schneemann hat gewonnen.', garland: 'In der Lichterkette hängen geblieben.', gate: 'Das Stadttor war zu niedrig.', tree: 'Die Tanne stand im Weg.' };
let currentTab = 'upgrades';

/* ---------- Aufgaben ---------- */
const missionGoal = (type) => MISSION_TYPES[type].goals[save.mTier[type] || 0];
function nextMissionType() {
  const active = new Set(save.missions.map((m) => m.type));
  const cand = Object.keys(MISSION_TYPES).filter((t) => !active.has(t) && missionGoal(t) !== undefined);
  return cand.length ? pick(cand) : null;
}
function ensureMissions() {
  save.missions = save.missions.filter((m) => missionGoal(m.type) !== undefined);
  while (save.missions.length < 3) {
    const t = nextMissionType();
    if (!t) break;
    save.missions.push({ type: t, prog: 0 });
  }
}
function checkMission(m) {
  const goal = missionGoal(m.type);
  if (goal === undefined || m.prog < goal) return;
  const tier = save.mTier[m.type] || 0, reward = MISSION_REWARDS[Math.min(tier, MISSION_REWARDS.length - 1)];
  save.wallet += reward;
  save.mTier[m.type] = tier + 1;
  save.missionsDone++;
  notice(`Aufgabe geschafft: ${MISSION_TYPES[m.type].text(goal)}  +${reward}`, 'gold');
  sfx.mission();
  const idx = save.missions.indexOf(m);
  save.missions.splice(idx, 1);
  const nt = nextMissionType();
  if (nt) save.missions.splice(idx, 0, { type: nt, prog: 0 });
  if (save.missionsDone >= 10) unlockBadge('mission10');
  persist();
}
function missionAdd(type, n) {
  for (const m of save.missions.slice()) if (m.type === type) { m.prog += n; checkMission(m); }
}
function missionSet(type, v) {
  for (const m of save.missions.slice()) if (m.type === type && v > m.prog) { m.prog = v; checkMission(m); }
}

/* ---------- Abzeichen ---------- */
function unlockBadge(id) {
  if (!id || save.badges.includes(id)) return;
  const b = BADGES.find((x) => x.id === id);
  if (!b) return;
  save.badges.push(id);
  notice(`Neues Abzeichen: ${b.name}`, 'badge');
  persist();
  if (!$('menu').hidden) renderBadges();
}

/* ---------- Menü aufbauen ---------- */
const shopRefs = {};
function buildMenu() {
  const shop = $('shop');
  shop.innerHTML = '';
  for (const u of UPGRADES) {
    const li = document.createElement('li');
    li.className = 'item';
    li.innerHTML =
      `<span class="item-ico" aria-hidden="true"><svg viewBox="0 0 24 24">${u.icon}</svg></span>` +
      `<div class="item-body"><h3>${u.name}</h3><p class="item-desc">${u.desc}</p><span class="item-now"></span>` +
      `<div class="item-meta"><span class="pips"></span>` +
      `<button class="buy" type="button" data-id="${u.id}"><span class="coin-ico" aria-hidden="true"></span><span class="buy-cost"></span></button></div></div>`;
    shop.appendChild(li);
    shopRefs[u.id] = { li, pips: li.querySelector('.pips'), now: li.querySelector('.item-now'), btn: li.querySelector('.buy'), cost: li.querySelector('.buy-cost') };
  }
  shop.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('button[data-id]');
    if (b) buyUpgrade(b.dataset.id);
  });
  $('skins').addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('button[data-skin]');
    if (b) skinAction(b.dataset.skin);
  });
  $('tabs').addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('button[data-tab]');
    if (b) setTab(b.dataset.tab);
  });
  $('tabs').addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const tabs = [...$('tabs').querySelectorAll('button[data-tab]')];
    const i = tabs.findIndex((t) => t.dataset.tab === currentTab);
    const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
    setTab(next.dataset.tab); next.focus();
  });
  $('settings').addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('button[data-set]');
    if (!b) return;
    const k = b.dataset.set;
    save[k] = !save[k];
    persist();
    if (k === 'music') music.sync();
    renderSettings();
    updateShop();
  });
  $('btnPlay').addEventListener('click', () => { if (menuReady()) startRun(); });
  $('btnResume').addEventListener('click', resume);
  $('btnPause').addEventListener('click', () => { if (state === 'run') pause(); else if (state === 'paused') resume(); });
  $('btnSound').addEventListener('click', toggleMute);
  $('btnRevive').addEventListener('click', acceptRevive);
  $('btnNoRevive').addEventListener('click', declineRevive);
  renderSoundBtn();
  setTab(currentTab);
}

function setTab(tab) {
  currentTab = tab;
  for (const b of $('tabs').querySelectorAll('button[data-tab]')) {
    const on = b.dataset.tab === tab;
    b.setAttribute('aria-selected', on ? 'true' : 'false');
    b.tabIndex = on ? 0 : -1;
  }
  for (const p of document.querySelectorAll('.panel')) p.hidden = p.id !== 'tab-' + tab;
  renderTab(tab);
}
function renderTab(tab) {
  ({ upgrades: updateShop, skins: renderSkins, missions: renderMissions, badges: renderBadges, board: renderBoard, settings: renderSettings })[tab]();
}
function renderMenu() {
  $('wallet').textContent = fmt(save.wallet);
  renderTab(currentTab);
}

/* ---------- Upgrades ---------- */
function updateShop() {
  $('wallet').textContent = fmt(save.wallet);
  for (const u of UPGRADES) {
    const r = shopRefs[u.id], l = lvl(u.id), max = u.costs.length;
    r.pips.innerHTML = Array.from({ length: max }, (_, i) => `<i class="${i < l ? 'on' : ''}"></i>`).join('');
    r.now.textContent = l ? 'Aktuell: ' + u.now(l) : 'Noch nicht gekauft';
    r.now.classList.toggle('off', !l);
    if (l >= max) {
      r.btn.className = 'buy maxed';
      r.btn.setAttribute('aria-disabled', 'true');
      r.cost.textContent = 'Max';
      r.btn.setAttribute('aria-label', `${u.name}: höchste Stufe erreicht`);
    } else {
      const c = u.costs[l], ok = save.wallet >= c;
      r.btn.className = 'buy' + (ok ? '' : ' poor');
      r.btn.setAttribute('aria-disabled', ok ? 'false' : 'true');
      r.cost.textContent = fmt(c);
      r.btn.setAttribute('aria-label', `${u.name} Stufe ${l + 1} für ${c} Münzen kaufen` + (ok ? '' : ' (zu wenig Münzen)'));
    }
  }
}
function nope(btn) {
  btn.classList.remove('nope'); void btn.offsetWidth; btn.classList.add('nope');
  sfx.nope();
}
function buyUpgrade(id) {
  const u = UPG[id], l = lvl(id), r = shopRefs[id];
  if (!u || l >= u.costs.length) return;
  const c = u.costs[l];
  if (save.wallet < c) { nope(r.btn); return; }
  save.wallet -= c;
  save.up[id] = l + 1;
  if (save.up[id] >= u.costs.length) unlockBadge('max');
  persist();
  sfx.buy();
  updateShop();
  r.li.classList.remove('bought'); void r.li.offsetWidth; r.li.classList.add('bought');
}

/* ---------- Aussehen ---------- */
function paintPreview(canvas, wear) {
  const c = canvas.getContext('2d'), size = canvas.clientWidth || 64, ratio = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = size * ratio; canvas.height = size * ratio;
  c.setTransform(ratio, 0, 0, ratio, 0, 0);
  c.clearRect(0, 0, size, size);
  const k = size / 64;
  c.translate(size / 2 + 2 * k, size - 6 * k);
  c.scale(k * 1.05, k * 1.05);
  paintRunner(c, { phase: 0.9, pose: 'run', wear, t: 0.3 });
}
function renderSkins() {
  $('wallet').textContent = fmt(save.wallet);
  const list = $('skins');
  list.innerHTML = '';
  for (const s of SKINS) {
    const owned = save.owned.includes(s.id), worn = save.wear[s.slot] === s.id;
    const li = document.createElement('li');
    li.className = 'skin' + (worn ? ' worn' : '');
    const btnLabel = worn ? 'Ablegen' : owned ? 'Anziehen' : `<span class="coin-ico" aria-hidden="true"></span>${fmt(s.cost)}`;
    const cls = worn ? 'buy worn-btn' : owned ? 'buy own-btn' : 'buy' + (save.wallet >= s.cost ? '' : ' poor');
    const aria = worn ? `${s.name} ablegen` : owned ? `${s.name} anziehen` : `${s.name} für ${s.cost} Münzen kaufen`;
    li.innerHTML = `<canvas class="skin-prev" aria-hidden="true"></canvas><div class="skin-body"><span class="skin-slot">${SLOT_NAMES[s.slot]}</span><h3>${s.name}</h3>` +
      `<button type="button" class="${cls}" data-skin="${s.id}" aria-label="${aria}">${btnLabel}</button></div>`;
    list.appendChild(li);
    const wear = Object.assign({}, save.wear, { [s.slot]: s.id });
    paintPreview(li.querySelector('canvas'), wear);
  }
  paintPreview($('outfitPrev'), save.wear);
}
function skinAction(id) {
  const s = SKIN[id];
  if (!s) return;
  if (save.wear[s.slot] === id) save.wear[s.slot] = '';
  else if (save.owned.includes(id)) save.wear[s.slot] = id;
  else {
    if (save.wallet < s.cost) { nope($('skins').querySelector(`[data-skin="${id}"]`)); return; }
    save.wallet -= s.cost;
    save.owned.push(id);
    save.wear[s.slot] = id;
    unlockBadge('stylish');
    sfx.buy();
  }
  persist();
  renderSkins();
  const b = $('skins').querySelector(`[data-skin="${id}"]`);
  if (b) b.focus({ preventScroll: true });
}

/* ---------- Aufgaben und Abzeichen ---------- */
function renderMissions() {
  $('wallet').textContent = fmt(save.wallet);
  const list = $('missions');
  list.innerHTML = '';
  if (!save.missions.length) {
    list.innerHTML = '<li class="mission done-all">Alle Aufgaben geschafft. Stark!</li>';
    return;
  }
  for (const m of save.missions) {
    const def = MISSION_TYPES[m.type], goal = missionGoal(m.type), tier = save.mTier[m.type] || 0;
    const prog = Math.min(goal, Math.floor(m.prog));
    const li = document.createElement('li');
    li.className = 'mission';
    li.innerHTML = `<div class="mission-top"><h3></h3><span class="reward"><span class="coin-ico" aria-hidden="true"></span>+${MISSION_REWARDS[Math.min(tier, 4)]}</span></div>` +
      `<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="${goal}" aria-valuenow="${prog}"><i style="width:${(prog / goal) * 100}%"></i></div>` +
      `<span class="mission-prog">${fmt(prog)} / ${fmt(goal)}${def.perRun ? ' · in einer Runde' : ''}</span>`;
    li.querySelector('h3').textContent = def.text(goal);
    list.appendChild(li);
  }
  $('missionsDone').textContent = `${fmt(save.missionsDone)} Aufgaben geschafft`;
}
function renderBadges() {
  const list = $('badges');
  list.innerHTML = '';
  for (const b of BADGES) {
    const got = save.badges.includes(b.id);
    const li = document.createElement('li');
    li.className = 'badge-item' + (got ? ' got' : '');
    li.innerHTML = `<span class="medal" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 2h8l-2 6h-4z"/><circle cx="12" cy="14" r="6"/><path d="M12 11l1 2 2 .3-1.5 1.4.4 2.1-1.9-1-1.9 1 .4-2.1L9 13.3l2-.3z"/></svg></span>` +
      `<div><h3>${b.name}</h3><p>${b.desc}</p></div>`;
    li.setAttribute('aria-label', `${b.name}: ${got ? 'erreicht' : 'noch offen'}. ${b.desc}`);
    list.appendChild(li);
  }
  $('badgeCount').textContent = `${save.badges.length} von ${BADGES.length} Abzeichen`;
}

/* ---------- Einstellungen ---------- */
function renderSettings() {
  for (const b of $('settings').querySelectorAll('button[data-set]')) {
    const on = !!save[b.dataset.set];
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.querySelector('.state').textContent = on ? 'An' : 'Aus';
  }
}
const SOUND_ON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5v5h4l5 4v-13l-5 4z"/><path d="M16.5 9a4 4 0 0 1 0 6M19 6.5a7.5 7.5 0 0 1 0 11"/></svg>';
const SOUND_OFF = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5v5h4l5 4v-13l-5 4z"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5"/></svg>';
function renderSoundBtn() {
  const b = $('btnSound');
  b.innerHTML = save.muted ? SOUND_OFF : SOUND_ON;
  b.setAttribute('aria-label', save.muted ? 'Ton einschalten' : 'Ton ausschalten');
}
function toggleMute() {
  save.muted = !save.muted;
  persist();
  renderSoundBtn();
  music.sync();
}

/* ---------- Bestenliste ---------- */
const board = { db: null, user: null, myId: null, rows: null, status: 'off', writing: false, readOnly: false, synced: false };
async function initBoard() {
  renderBoard();
  if (!(window.claude && typeof window.claude.use === 'function')) return;
  let db = null, user = null;
  try { [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]); } catch (e) { return; }
  if (!db) return;
  board.db = db; board.user = user; board.status = 'loading';
  renderBoard();
  board.myId = user ? await user.id() : null;
  const timer = setTimeout(() => { if (board.status === 'loading') { board.status = 'slow'; renderBoard(); } }, 10000);
  db.collection('scores').orderBy('best', 'desc').limit(10).onSnapshot((snap) => {
    if (!snap.metadata.fromCache) clearTimeout(timer);
    board.rows = snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
    board.status = 'ready';
    renderBoard();
    if (!board.synced && !snap.metadata.fromCache) { board.synced = true; submitScore(); }
  }, () => { clearTimeout(timer); board.status = 'error'; renderBoard(); });
}
async function submitScore() {
  if (!board.db || !board.myId || board.writing || board.readOnly || save.best <= 0) return;
  board.writing = true;
  try {
    const ref = board.db.doc('scores/' + board.myId);
    const snap = await ref.get();
    const cur = snap.exists ? snap.data() : null;
    if (!cur || (cur.best || 0) < save.best) {
      await ref.set({ best: save.best, coins: save.bestCoins, hat: save.wear.hat || '', at: new Date().toISOString() });
    }
  } catch (e) {
    if (e && e.code === 'invalid_argument') { board.readOnly = true; renderBoard(); }
  }
  board.writing = false;
}
async function renderBoard() {
  const local = $('boardLocal');
  local.innerHTML = save.top.length
    ? save.top.map((t, i) => `<li><span class="rank">${i + 1}</span><span class="who">${t.t ? new Date(t.t).toLocaleDateString('de-DE') : 'Lauf'}</span><span class="val">${fmt(t.d)} m</span><span class="sub"><span class="coin-ico" aria-hidden="true"></span>${fmt(t.c)}</span></li>`).join('')
    : '<li class="empty">Noch keine Läufe. Deine besten fünf erscheinen hier.</li>';
  const shared = $('boardShared'), note = $('boardNote');
  if (!board.db) {
    shared.hidden = true;
    note.textContent = 'Eine gemeinsame Bestenliste gibt es, wenn das Spiel als geteilte Seite in Claude läuft.';
    return;
  }
  shared.hidden = false;
  if (board.status === 'loading') { note.textContent = 'Gemeinsame Bestenliste wird geladen …'; return; }
  if (board.status === 'slow' || board.status === 'error') { note.textContent = 'Die gemeinsame Bestenliste ist gerade nicht erreichbar. Deine Läufe zählen trotzdem.'; return; }
  const rows = board.rows || [];
  note.textContent = board.readOnly
    ? 'Du kannst die Liste sehen, aber mit Nur-Ansehen-Zugriff wird dein Rekord nicht eingetragen.'
    : 'Alle, mit denen du diese Seite teilst, landen hier mit ihrem Rekord. Er wird nach jeder Runde automatisch eingetragen.';
  const list = $('boardSharedList');
  if (!rows.length) { list.innerHTML = '<li class="empty">Noch keine Einträge. Lauf eine Runde und sei die Nummer 1.</li>'; return; }
  const ps = board.user ? await board.user.profiles(rows.map((r) => r.id)) : {};
  list.innerHTML = '';
  rows.forEach((r, i) => {
    const p = ps[r.id] || {};
    const li = document.createElement('li');
    if (r.id === board.myId) li.className = 'me';
    li.innerHTML = `<span class="rank">${i + 1}</span><span class="who">${p.avatarUrl ? '<img alt="">' : ''}<span class="name"></span></span><span class="val">${fmt(Math.floor(Number(r.best) || 0))} m</span><span class="sub"><span class="coin-ico" aria-hidden="true"></span>${fmt(Math.floor(Number(r.coins) || 0))}</span>`;
    if (p.avatarUrl) li.querySelector('img').src = p.avatarUrl;
    li.querySelector('.name').textContent = (p.name || 'Jemand') + (r.id === board.myId ? ' (du)' : '');
    list.appendChild(li);
  });
}

/* ---------- Menüs zeigen ---------- */
function showStartMenu() {
  state = 'menu'; setState();
  $('menuEyebrow').hidden = true;
  $('menuTitle').innerHTML = '<span class="logo-jul">Jul</span> Run';
  $('menuSub').textContent = 'Spring über die Häuser, sammle Münzen und kauf dir Upgrades. Je länger du läufst, desto schneller wird es.';
  $('results').hidden = true;
  $('btnPlayLabel').textContent = 'Los geht’s';
  renderMenu();
  $('menu').hidden = false;
  menuShownAt = performance.now();
}
function canAffordSomething() {
  return UPGRADES.some((u) => lvl(u.id) < u.costs.length && save.wallet >= u.costs[lvl(u.id)]);
}
function showOver() {
  state = 'over'; setState();
  $('menuEyebrow').hidden = false;
  $('menuTitle').textContent = 'Autsch!';
  $('menuSub').textContent = canAffordSomething() ? 'Du hast genug Münzen für ein Upgrade.' : CAUSE[run.deathCause] || pick(OUCH);
  $('results').hidden = false;
  $('resCoins').textContent = '+' + fmt(lastResult.coins);
  $('resDist').textContent = fmt(lastResult.dist) + ' m';
  $('resBest').textContent = fmt(save.best) + ' m';
  $('resRecord').hidden = !lastResult.record;
  $('btnPlayLabel').textContent = 'Nochmal laufen';
  renderMenu();
  $('menu').hidden = false;
  $('menu').scrollTop = 0;
  menuShownAt = performance.now();
  $('btnPlay').focus({ preventScroll: true });
}
function showRevive() {
  state = 'revive'; setState();
  reviveT = 5;
  const cost = reviveCost();
  $('reviveCost').textContent = fmt(cost);
  $('reviveInfo').textContent = `Einmal pro Runde kannst du für ${fmt(cost)} Münzen weiterlaufen. Du hast ${fmt(save.wallet + run.coins)}.`;
  $('reviveMenu').hidden = false;
  $('btnRevive').focus({ preventScroll: true });
}
