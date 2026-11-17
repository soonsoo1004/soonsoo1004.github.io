/* ============================================================
   우진이 구조대 — 오리지널 퍼즐 웹게임
   (규칙·그래픽·음악·스테이지 전부 자체 제작, 비공개 전용)
   ============================================================ */
(() => {
'use strict';

/* ── 상수 ───────────────────────────────────────────── */
const W = 390, H = 620, CELL = 2;
const COLS = Math.ceil(W / CELL), ROWS = Math.ceil(H / CELL);
const MAT = { EMPTY: 0, GRASS: 1, STONE: 2, WOOD: 3, BRICK: 4 };
const GRAV = 780;
const SAFE_FALL = 112;
const WALK = 29;
const DIG_SPEED = 34;
const MINE_SPEED = 40;
const MINE_MAX = 62;
const TAP_R = 52;
const LEM_H = 32;
const TOOL_KEYS = ['bridge', 'dig', 'stop', 'pick', 'umbrella'];

/* ── DOM ────────────────────────────────────────────── */
const $ = (id) => document.getElementById(id);
const cv = $('stageCanvas');
const ctx = cv.getContext('2d');
const wrap = $('stageWrap');
const tcv = document.createElement('canvas');
const tctx = tcv.getContext('2d');

/* ── 사운드 (자체 합성) ─────────────────────────────── */
const Sound = (() => {
  let AC = null, master = null, muted = false;
  let bgmOn = false, bgmTimer = null, nextStep = 0, step = 0;
  const STEP = 0.215;                       // 8분음표 길이
  const MEL = [
    [76,null,79,81, 79,null,76,74, 72,null,74,76, 79,null,81,84],
    [84,null,81,79, 76,null,79,76, 74,76,74,72, 72,null,null,null]
  ];
  const BASS = [48,43,45,41];

  function ensure() {
    if (AC) return AC;
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    AC = new C();
    master = AC.createGain();
    master.gain.value = 0.34;
    master.connect(AC.destination);
    return AC;
  }
  function tone(freq, when, dur, type, gain, detune) {
    if (!AC || muted) return;
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    if (detune) o.detune.value = detune;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.linearRampToValueAtTime(gain == null ? 0.12 : gain, when + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0004, when + dur);
    o.connect(g); g.connect(master);
    o.start(when); o.stop(when + dur + 0.03);
  }
  function noiseHit(when, dur, gain, freq) {
    if (!AC || muted) return;
    const len = Math.max(1, Math.floor(AC.sampleRate * dur));
    const buf = AC.createBuffer(1, len, AC.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = AC.createBufferSource(); src.buffer = buf;
    const f = AC.createBiquadFilter(); f.type = 'bandpass';
    f.frequency.value = freq || 900; f.Q.value = 0.9;
    const g = AC.createGain(); g.gain.value = gain == null ? 0.1 : gain;
    g.gain.exponentialRampToValueAtTime(0.0008, when + dur);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(when);
  }
  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

  function scheduleBgm() {
    if (!AC || !bgmOn) return;
    while (nextStep < AC.currentTime + 0.25) {
      const bar = Math.floor(step / 16) % 2;
      const s = step % 16;
      const n = MEL[bar][s];
      if (n) {
        tone(midi(n), nextStep, 0.26, 'triangle', 0.085);
        tone(midi(n + 12), nextStep, 0.16, 'sine', 0.026, 4);
      }
      if (s % 4 === 0) {
        tone(midi(BASS[(Math.floor(step / 4)) % 4]), nextStep, 0.4, 'sine', 0.075);
      }
      if (s % 2 === 1) noiseHit(nextStep, 0.045, 0.022, 5200);
      nextStep += STEP;
      step++;
    }
  }

  return {
    unlock() {
      if (!ensure()) return;
      if (AC.state === 'suspended') AC.resume();
    },
    startBgm() {
      if (!ensure()) return;
      if (AC.state === 'suspended') AC.resume();
      if (bgmOn) return;
      bgmOn = true; nextStep = AC.currentTime + 0.1;
      clearInterval(bgmTimer);
      bgmTimer = setInterval(scheduleBgm, 40);
      scheduleBgm();
    },
    stopBgm() {
      bgmOn = false; clearInterval(bgmTimer); bgmTimer = null;
    },
    setMuted(v) {
      muted = v;
      if (master) master.gain.value = v ? 0 : 0.34;
      if (muted) noiseHit; // no-op
    },
    isMuted() { return muted; },
    sfx(name) {
      if (!ensure() || muted) return;
      const t = AC.currentTime + 0.01;
      switch (name) {
        case 'tap':   tone(midi(88), t, 0.09, 'triangle', 0.09); break;        case 'tool':  tone(midi(81), t, 0.08, 'triangle', 0.1); tone(midi(88), t + 0.06, 0.1, 'triangle', 0.08); break;
        case 'assign':tone(midi(84), t, 0.1, 'square', 0.055); tone(midi(91), t + 0.05, 0.12, 'triangle', 0.07); break;
        case 'brick': noiseHit(t, 0.09, 0.07, 320); tone(midi(55), t, 0.07, 'square', 0.05); break;
        case 'dig':   noiseHit(t, 0.14, 0.09, 260); break;
        case 'save':  [76, 81, 84, 88].forEach((n, i) => tone(midi(n), t + i * 0.055, 0.24, 'triangle', 0.1)); break;
        case 'gem':   tone(midi(96), t, 0.12, 'sine', 0.1); tone(midi(100), t + 0.07, 0.16, 'sine', 0.08); break;
        case 'lost':  tone(midi(57), t, 0.16, 'sawtooth', 0.05); tone(midi(50), t + 0.12, 0.24, 'sawtooth', 0.045); break;
        case 'win':   [72, 76, 79, 84, 88].forEach((n, i) => tone(midi(n), t + i * 0.1, 0.4, 'triangle', 0.1)); break;
        case 'fail':  [67, 63, 58].forEach((n, i) => tone(midi(n), t + i * 0.16, 0.4, 'triangle', 0.09)); break;
        case 'nope':  tone(midi(72), t, 0.1, 'square', 0.04); tone(midi(68), t + 0.08, 0.12, 'square', 0.04); break;
      }
    }
  };
})();

/* ── 스테이지 ───────────────────────────────────────── */
const DY = 52;    // 디자인 기준(y 480) → 실제 월드 높이 620으로 옮기기
const LEVELS = [
  {
    name: '첫걸음', sub: '길막이', time: 90, total: 8, need: 6, interval: 1.55,
    spawn: { x: 150, y: 388, dir: 1 }, exit: { x: 52, y: 388 },
    tools: { stop: 2 },
    tip: 'STOP 표지로 우진이를 돌려세워요!',
    rects: [{ x: 0, y: 388, w: 248, h: 92, m: MAT.GRASS }],
    ponds: [{ x: 248, y: 428, w: 142, h: 52 }],
    gems: [{ x: 108, y: 366 }],
    deco: [{ t: 'mush', x: 32, y: 388 }, { t: 'clover', x: 84, y: 388 }, { t: 'flower', x: 196, y: 388 }, { t: 'mush', x: 228, y: 388 }, { t: 'rock', x: 18, y: 388 }]
  },
  {
    name: '높은 절벽', sub: '우산 낙하산', time: 90, total: 6, need: 4, interval: 1.5,
    spawn: { x: 108, y: 196, dir: 1 }, exit: { x: 330, y: 400 },
    tools: { umbrella: 6 },
    tip: '떨어지기 전에 우산을 씌워 줘요!',
    rects: [
      { x: 0, y: 196, w: 140, h: 28, m: MAT.GRASS },
      { x: 0, y: 400, w: 390, h: 80, m: MAT.GRASS }
    ],
    ponds: [],
    gems: [{ x: 214, y: 378 }, { x: 282, y: 378 }],
    deco: [{ t: 'mush', x: 40, y: 196 }, { t: 'clover', x: 118, y: 196 }, { t: 'flower', x: 250, y: 400 }, { t: 'rock', x: 300, y: 400 }, { t: 'mush', x: 370, y: 400 }]
  },
  {
    name: '벽돌 다리', sub: '다리 놓기', time: 100, total: 6, need: 4, interval: 1.6,
    spawn: { x: 60, y: 400, dir: 1 }, exit: { x: 330, y: 400 },
    tools: { bridge: 2 },
    tip: '벽돌다리를 골라 낭떠러지 끝에서 톡!',
    rects: [
      { x: 0, y: 400, w: 170, h: 80, m: MAT.GRASS },
      { x: 250, y: 400, w: 140, h: 80, m: MAT.GRASS }
    ],
    ponds: [{ x: 168, y: 442, w: 84, h: 38 }],
    gems: [{ x: 210, y: 384 }],
    deco: [{ t: 'mush', x: 28, y: 400 }, { t: 'clover', x: 120, y: 400 }, { t: 'flower', x: 286, y: 400 }, { t: 'mush', x: 360, y: 400 }]
  },
  {
    name: '땅파기 지름길', sub: '땅파기', time: 100, total: 6, need: 4, interval: 1.5,
    spawn: { x: 60, y: 268, dir: 1 }, exit: { x: 330, y: 380 },
    tools: { dig: 2 },
    tip: '돌바닥 위에서 땅파기! 아래로 쑥 내려가요',
    rects: [
      { x: 0, y: 268, w: 390, h: 24, m: MAT.STONE },
      { x: 0, y: 380, w: 390, h: 100, m: MAT.GRASS }
    ],
    ponds: [],
    gems: [{ x: 196, y: 248 }, { x: 150, y: 362 }],
    deco: [{ t: 'rock', x: 40, y: 268 }, { t: 'rock', x: 300, y: 268 }, { t: 'mush', x: 250, y: 380 }, { t: 'clover', x: 96, y: 380 }]
  },
  {
    name: '종합 구조 작전', sub: '모두 동원', time: 140, total: 6, need: 3, interval: 1.6,
    spawn: { x: 90, y: 150, dir: 1 }, exit: { x: 330, y: 400 },
    tools: { umbrella: 4, bridge: 1, pick: 1, stop: 1 },
    tip: '우산 → 다리 → 곡괭이 순서로!',
    rects: [
      { x: 0, y: 150, w: 120, h: 22, m: MAT.GRASS },
      { x: 0, y: 300, w: 150, h: 22, m: MAT.GRASS },
      { x: 230, y: 300, w: 160, h: 26, m: MAT.STONE },
      { x: 352, y: 216, w: 38, h: 184, m: MAT.STONE },
      { x: 0, y: 400, w: 390, h: 80, m: MAT.GRASS }
    ],
    ponds: [{ x: 150, y: 432, w: 80, h: 48 }],
    gems: [{ x: 190, y: 284 }, { x: 300, y: 380 }],
    deco: [{ t: 'mush', x: 26, y: 150 }, { t: 'clover', x: 100, y: 300 }, { t: 'mush', x: 60, y: 400 }, { t: 'flower', x: 250, y: 400 }, { t: 'rock', x: 372, y: 400 }]
  }
];

// 모든 Y좌표를 실제 월드 높이(620)로 내립니다.
const OLD_H = 480;
for (const L of LEVELS) {
  for (const r of L.rects) {
    const touchesBottom = (r.y + r.h) >= OLD_H - 1;
    r.y += DY;
    if (touchesBottom) r.h = H - r.y;
  }
  (L.ponds || []).forEach((p) => {
    const touchesBottom = (p.y + p.h) >= OLD_H - 1;
    p.y += DY;
    if (touchesBottom) p.h = H - p.y;
  });
  (L.gems || []).forEach((g) => { g.y += DY; });
  (L.deco || []).forEach((d) => { d.y += DY; });
  L.spawn.y += DY;
  L.exit.y += DY;
}

/* ── 상태 ───────────────────────────────────────────── */
let G = null;
let grid = new Uint8Array(COLS * ROWS);
let view = { s: 1, ox: 0, oy: 0, dpr: 1 };
let terrainDirty = true;
let terrainTimer = 0;
let lastHudSec = -1;
let pickStage = 0;
const best = (() => {
  try { return JSON.parse(localStorage.getItem('woojinRescue.v1') || '{}'); } catch (e) { return {}; }
})();

/* ── 그리드 ─────────────────────────────────────────── */
function cellAt(cx, cy) {
  if (cx < 0 || cx >= COLS || cy < 0 || cy >= ROWS) return 0;
  return grid[cy * COLS + cx];
}
function solidCell(cx, cy) {
  if (cx < 0 || cx >= COLS || cy < 0 || cy >= ROWS) return false;
  return grid[cy * COLS + cx] > 0;
}
function buildGrid(level) {
  grid = new Uint8Array(COLS * ROWS);
  for (const r of level.rects) {
    const x0 = Math.round(r.x / CELL), x1 = Math.round((r.x + r.w) / CELL);
    const y0 = Math.round(r.y / CELL), y1 = Math.round((r.y + r.h) / CELL);
    for (let cy = y0; cy < y1; cy++) {
      for (let cx = x0; cx < x1; cx++) {
        if (cx >= 0 && cx < COLS && cy >= 0 && cy < ROWS) grid[cy * COLS + cx] = r.m;
      }
    }
  }
}
function topBetween(px, y0, y1) {
  const cx = Math.floor(px / CELL);
  if (cx < 0 || cx >= COLS) return null;
  const a = Math.max(0, Math.floor(y0 / CELL));
  const b = Math.min(ROWS - 1, Math.floor(y1 / CELL));
  for (let cy = a; cy <= b; cy++) if (grid[cy * COLS + cx]) return cy * CELL;
  return null;
}
function wallTopAt(px, feetY) {
  const cx = Math.floor(px / CELL);
  if (cx < 0 || cx >= COLS) return null;
  const a = Math.max(0, Math.floor((feetY - 26) / CELL));
  const b = Math.min(ROWS - 1, Math.floor((feetY - 8) / CELL));
  for (let cy = a; cy <= b; cy++) {
    if (grid[cy * COLS + cx]) {
      let t = cy;
      while (t > 0 && grid[(t - 1) * COLS + cx]) t--;
      return t * CELL;
    }
  }
  return null;
}
function materialAt(px, py) {
  const cx = Math.floor(px / CELL), cy = Math.floor(py / CELL);
  if (cx < 0 || cx >= COLS || cy < 0 || cy >= ROWS) return 0;
  return grid[cy * COLS + cx];
}
function clearDisc(px, py, r) {
  const cx0 = Math.floor((px - r) / CELL), cx1 = Math.floor((px + r) / CELL);
  const cy0 = Math.floor((py - r) / CELL), cy1 = Math.floor((py + r) / CELL);
  for (let cy = cy0; cy <= cy1; cy++) {
    for (let cx = cx0; cx <= cx1; cx++) {
      if (cx < 0 || cx >= COLS || cy < 0 || cy >= ROWS) continue;
      const dx = cx * CELL + 1 - px, dy = cy * CELL + 1 - py;
      if (dx * dx + dy * dy <= r * r) grid[cy * COLS + cx] = 0;
    }
  }
  terrainDirty = true;
}

/* ── 레벨 로드 ──────────────────────────────────────── */
function loadLevel(i, opts) {
  opts = opts || {};
  const L = LEVELS[i];
  pickStage = i;
  G = {
    stage: i, mode: opts.silent ? 'start' : 'play',
    lems: [], bricks: [], particles: [], texts: [],
    gems: L.gems.map((g) => ({ x: g.x, y: g.y, taken: false, ph: Math.random() * 6.28 })),
    time: L.time, saved: 0, lost: 0, gemsTaken: 0, score: 0, used: 0,
    spawnLeft: L.total, spawnTimer: 0.8, spawned: 0,
    tools: Object.assign({}, L.tools), selected: null, speed: 1, t: 0,
    flash: 0, ended: false
  };
  buildGrid(L);
  terrainDirty = true;
  renderTerrain();
  $('stageName').textContent = L.name;
  $('levelNum').textContent = i + 1;
  $('needNum').textContent = L.need;
  updateHud(true);
  if (!opts.silent) hideOverlays();
  if (!opts.silent) {
    showHint('LEVEL ' + (i + 1) + ' · ' + L.tip);
    Sound.startBgm();
  } else {
    G.mode = 'start';
  }
}

/* ── HUD ────────────────────────────────────────────── */
function updateHud(force) {
  if (!G) return;
  const L = LEVELS[G.stage];
  $('savedNum').textContent = G.saved;
  $('needNum').textContent = L.need;
  const t = Math.max(0, Math.ceil(G.time));
  const sec = t;
  if (force || sec !== lastHudSec) {
    lastHudSec = sec;
    $('timeNum').textContent = String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0');
    $('timeBadge').classList.toggle('warn', sec <= 20 && G.mode === 'play');
  }
  for (const k of TOOL_KEYS) {
    const b = $('c-' + k);
    if (b) b.textContent = G.tools[k] || 0;
    const btn = document.querySelector('.skill[data-tool="' + k + '"]');
    if (btn) {
      btn.classList.toggle('is-off', (G.tools[k] || 0) <= 0);
      btn.classList.toggle('is-on', G.selected === k);
    }
  }
  $('speedBtn').classList.toggle('is-on', G.speed > 1);
}

/* ── 오버레이/토스트 ────────────────────────────────── */
function hideOverlays() {
  ['startScreen', 'pauseScreen', 'clearScreen', 'failScreen'].forEach((id) => $(id).classList.remove('show'));
}
function showOverlay(id) { $(id).classList.add('show'); }
let hintTimer = 0, toastTimer = 0;
function showHint(text) {
  const el = $('hint');
  el.textContent = text;
  el.classList.add('show');
  $('stageName').classList.add('hide');
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => {
    el.classList.remove('show');
    $('stageName').classList.remove('hide');
  }, 3200);
}
function showToast(text) {
  const el = $('toast');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1500);
}

/* ── 레밍 조작 ──────────────────────────────────────── */
function spawnLem() {
  const L = LEVELS[G.stage];
  const lem = {
    x: L.spawn.x + (Math.random() * 4 - 2), y: L.spawn.y,
    dir: L.spawn.dir || 1, state: 'walk', vy: 0, fallFrom: null,
    umb: false, buildLeft: 0, buildT: 0, digFrom: 0, mineLeft: 0,
    anim: Math.random() * 6.28, t: 0, pulse: 0
  };
  G.lems.push(lem);
  G.spawned++;
}

function onGround(lem) {
  return topBetween(lem.x, lem.y, lem.y + 9) !== null;
}

function loseLem(lem, why) {
  lem.state = 'lost';
  lem.t = 0;
  G.lost++;
  Sound.sfx('lost');
  burst(lem.x, lem.y - 8, 10, ['#b9a0d8', '#d9c9ee', '#9c86c4'], 70);
  addText(lem.x, lem.y - 30, why === 'water' ? '풍덩!' : '아야!', '#c46b8f');
}

function saveLem(lem) {
  lem.state = 'saved';
  lem.t = 0;
  G.saved++;
  G.score += 100;
  Sound.sfx('save');
  burst(lem.x, lem.y - 12, 14, ['#ffffff', '#ffe89a', '#9ff0c0', '#ffc2d8'], 110);
  addText(lem.x, lem.y - 34, '+100', '#3dbb86');
  updateHud(true);
  checkEnd();
}

function burst(x, y, n, colors, spd) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = (spd || 90) * (0.3 + Math.random() * 0.8);
    G.particles.push({
      x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30,
      life: 0.5 + Math.random() * 0.5, max: 1, c: colors[i % colors.length],
      r: 1.6 + Math.random() * 2.2
    });
  }
}
function addText(x, y, txt, color) {
  G.texts.push({ x, y, txt, color, life: 1.1 });
}

/* ── 도구 지정 ──────────────────────────────────────── */
function assignTool(tool, lem) {
  if (!lem || G.mode !== 'play') return false;
  if ((G.tools[tool] || 0) <= 0) { Sound.sfx('nope'); return false; }
  if (tool === 'stop') {
    if (lem.state !== 'walk' || !onGround(lem)) { showToast('걷는 우진이에게!'); Sound.sfx('nope'); return false; }
    lem.state = 'block'; lem.pulse = 1;
    burst(lem.x, lem.y - 14, 8, ['#ff9b9b', '#ffffff'], 70);
  } else if (tool === 'umbrella') {
    if (lem.umb) return false;
    lem.umb = true; lem.pulse = 1;
    burst(lem.x, lem.y - 20, 7, ['#ffd08a', '#fff3d0'], 60);
  } else if (tool === 'dig') {
    if (lem.state !== 'walk' || !onGround(lem)) { showToast('땅 위에서만 파요!'); Sound.sfx('nope'); return false; }
    lem.state = 'dig'; lem.digFrom = lem.y; lem.pulse = 1;
    Sound.sfx('dig');
  } else if (tool === 'pick') {
    if (lem.state !== 'walk' || !onGround(lem)) { showToast('땅 위에서만 곡괭이!'); Sound.sfx('nope'); return false; }
    lem.state = 'mine'; lem.mineLeft = MINE_MAX; lem.pulse = 1;
    Sound.sfx('dig');
  } else if (tool === 'bridge') {
    if (lem.state !== 'walk' || !onGround(lem)) { showToast('땅 위에서만 다리를!'); Sound.sfx('nope'); return false; }
    lem.buildLeft = 16; lem.buildT = 0; lem.pulse = 1; lem.crossed = false;
  }
  G.tools[tool]--;
  G.used++;
  Sound.sfx('assign');
  updateHud(true);
  if ((G.tools[tool] || 0) <= 0 && G.selected === tool) selectTool(null);
  return true;
}

function selectTool(tool) {
  if (tool && (G.tools[tool] || 0) <= 0) { Sound.sfx('nope'); showToast('도구가 남지 않았어요'); return; }
  G.selected = G.selected === tool ? null : tool;
  if (G.selected) Sound.sfx('tool');
  updateHud(true);
}

function placeBrick(x, y, w, h) {
  const cx0 = Math.round(x / CELL), cx1 = Math.round((x + w) / CELL);
  const cy0 = Math.round(y / CELL), cy1 = Math.round((y + h) / CELL);
  for (let cy = cy0; cy < cy1; cy++) {
    for (let cx = cx0; cx < cx1; cx++) {
      if (cx >= 0 && cx < COLS && cy >= 0 && cy < ROWS) grid[cy * COLS + cx] = MAT.BRICK;
    }
  }
  G.bricks.push({ x, y, w, h });
  terrainDirty = true;
  Sound.sfx('brick');
  burst(x + w / 2, y + h / 2, 4, ['#d8a373', '#f0c9a0'], 50);
}

/* ── 업데이트 ───────────────────────────────────────── */
function update(dt) {
  if (!G || G.mode !== 'play') return;
  const L = LEVELS[G.stage];
  G.t += dt;

  // 타이머
  G.time -= dt;
  if (G.time <= 0) { G.time = 0; updateHud(true); return fail('시간이 다 됐어요'); }

  // 생성
  if (G.spawnLeft > 0) {
    G.spawnTimer -= dt;
    if (G.spawnTimer <= 0) {
      spawnLem();
      G.spawnLeft--;
      G.spawnTimer += L.interval;
    }
  }

  // 레밍
  for (const lem of G.lems) {
    stepLem(lem, dt);
  }

  // 정리
  G.lems = G.lems.filter((l) => !((l.state === 'saved' || l.state === 'lost') && l.t > 0.75));

  // 보석
  for (const g of G.gems) {
    if (g.taken) continue;
    g.ph += dt * 2;
    for (const lem of G.lems) {
      if (lem.state === 'saved' || lem.state === 'lost') continue;
      if (Math.abs(g.x - lem.x) < 15 && Math.abs(g.y - (lem.y - 14)) < 21) {
        g.taken = true; G.gemsTaken++; G.score += 250;
        Sound.sfx('gem');
        burst(g.x, g.y, 10, ['#8fd8ff', '#ffffff', '#c9b8f5'], 90);
        addText(g.x, g.y - 8, '+250', '#4a9fd8');
        break;
      }
    }
  }

  // 파티클
  for (const p of G.particles) {
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.vy += 220 * dt; p.life -= dt;
  }
  G.particles = G.particles.filter((p) => p.life > 0);
  for (const t of G.texts) { t.y -= 26 * dt; t.life -= dt; }
  G.texts = G.texts.filter((t) => t.life > 0);

  // 종료 판정
  if (!G.ended) {
    const alive = G.lems.some((l) => l.state === 'walk' || l.state === 'fall' || l.state === 'dig' || l.state === 'mine' || l.state === 'build');
    if (!alive && G.spawnLeft <= 0) {
      if (G.saved >= L.need) win();
      else fail('우진이를 조금 더 구해 볼까요?');
    }
  }
  updateHud();
}

function stepLem(lem, dt) {
  const L = LEVELS[G.stage];
  lem.t += dt;
  if (lem.pulse > 0) lem.pulse = Math.max(0, lem.pulse - dt * 2.2);

  // 물/절벽
  if (lem.state !== 'saved' && lem.state !== 'lost') {
    for (const p of L.ponds) {
      if (lem.x > p.x - 2 && lem.x < p.x + p.w + 2 && lem.y > p.y + 2) {
        loseLem(lem, 'water');
        return;
      }
    }
    if (lem.y > H + 26) { loseLem(lem, 'fall'); return; }
  }

  switch (lem.state) {
    case 'walk': {
      // 길막이 앞에서 돌아서기
      for (const o of G.lems) {
        if (o === lem || o.state !== 'block') continue;
        if (Math.abs(o.y - lem.y) > 26) continue;
        const d = (o.x - lem.x) * lem.dir;
        if (d > -1 && d < 15) { lem.dir *= -1; lem.x -= 1; break; }
      }
      const sp = WALK * dt;
      const aheadX = lem.x + lem.dir * 4;
      const wt = wallTopAt(aheadX, lem.y);
      if (wt !== null && lem.y - wt > 8) {
        lem.dir *= -1;
      } else {
        lem.x += lem.dir * sp;
        if (lem.x < 2) { lem.x = 2; lem.dir = 1; }
        if (lem.x > W - 2) { lem.x = W - 2; lem.dir = -1; }
        const g = topBetween(lem.x + lem.dir * 4, lem.y - 9, lem.y + 9);
        if (g !== null && Math.abs(g - lem.y) <= 8) lem.y = g;
        else { lem.state = 'fall'; lem.vy = 0; lem.fallFrom = lem.y; }
      }
      // 벽돌 다리 쌓기
      if (lem.buildLeft > 0 && lem.state === 'walk') {
        const feetMat = materialAt(lem.x, lem.y + 2);
        const aheadMat = materialAt(lem.x + lem.dir * 16, lem.y + 2);
        const onBrick = feetMat === MAT.BRICK;
        if (!lem.crossed && topBetween(lem.x, lem.y + 18, lem.y + 130) === null) lem.crossed = true;
        if (lem.crossed && feetMat && feetMat !== MAT.BRICK) {
          lem.buildLeft = 0;
          showToast('다리 완성!');
        } else {
          lem.buildT -= dt;
          const gapAhead = topBetween(lem.x + lem.dir * 12, lem.y - 2, lem.y + 14) === null;
          if (lem.buildT <= 0 || gapAhead) {
            lem.buildT = 0.3;
            lem.buildLeft--;
            placeBrick(lem.dir > 0 ? lem.x : lem.x - 20, lem.y, 20, 11);
            if (lem.buildLeft <= 0) showToast('다리 완성!');
          }
        }
      }
      break;
    }
    case 'fall': {
      const prevY = lem.y;
      lem.vy += GRAV * dt;
      const maxV = lem.umb ? 62 : 760;
      if (lem.vy > maxV) lem.vy = maxV;
      lem.y += lem.vy * dt;
      const g = topBetween(lem.x, prevY + 1, lem.y + 3);
      if (g !== null) {
        lem.y = g; lem.vy = 0;
        const drop = (lem.fallFrom == null ? 0 : lem.fallFrom - g);
        lem.fallFrom = null;
        if (drop > SAFE_FALL && !lem.umb) { loseLem(lem, 'fall'); return; }
        lem.state = 'walk';
        if (lem.umb) burst(lem.x, lem.y - 4, 5, ['#ffffff', '#ffe9c4'], 50);
      }
      break;
    }
    case 'dig': {
      const cy0 = Math.floor((lem.y - 2) / CELL), cy1 = Math.floor((lem.y + 5) / CELL);
      const cx0 = Math.floor((lem.x - 9) / CELL), cx1 = Math.floor((lem.x + 9) / CELL);
      for (let cy = cy0; cy <= cy1; cy++) {
        for (let cx = cx0; cx <= cx1; cx++) {
          if (cx >= 0 && cx < COLS && cy >= 0 && cy < ROWS) grid[cy * COLS + cx] = 0;
        }
      }
      terrainDirty = true;
      if (Math.random() < 0.35) burst(lem.x + (Math.random() * 14 - 7), lem.y - 4, 1, ['#c08a58', '#8e6440'], 40);
      lem.y += DIG_SPEED * dt;
      if (lem.y - lem.digFrom > 40) { lem.state = 'walk'; break; }
      if (topBetween(lem.x, lem.y, lem.y + 10) === null) {
        lem.state = 'fall'; lem.vy = 0; lem.fallFrom = lem.y;
      }
      break;
    }
    case 'mine': {
      const step = MINE_SPEED * dt;
      clearDisc(lem.x + lem.dir * 5, lem.y + 4, 8);
      lem.x += lem.dir * step * 0.75;
      lem.y += step;
      clearDisc(lem.x, lem.y + 4, 8);
      lem.mineLeft -= step;
      if (Math.random() < 0.4) burst(lem.x + lem.dir * 6, lem.y - 2, 1, ['#b7b0cf', '#8f87ab'], 50);
      const below = topBetween(lem.x, lem.y + 4, lem.y + 16);
      const fwd = topBetween(lem.x + lem.dir * 9, lem.y - 2, lem.y + 14);
      if (lem.mineLeft <= 0 || (below === null && fwd === null)) {
        lem.state = 'fall'; lem.vy = 0; lem.fallFrom = lem.y;
      }
      break;
    }
    case 'block': {
      lem.anim += dt * 2;
      break;
    }
    case 'saved':
    case 'lost': {
      break;
    }
  }

  // 출구 도달
  if (lem.state === 'walk' || lem.state === 'fall') {
    if (Math.abs(lem.x - L.exit.x) < 13 && Math.abs(lem.y - L.exit.y) < 7) saveLem(lem);
  }
}

function checkEnd() {
  if (!G || G.ended) return;
  if (G.saved >= LEVELS[G.stage].need) win();
}

function win() {
  if (G.ended) return;
  G.ended = true;
  G.mode = 'clear';
  G.score += Math.max(0, Math.round(G.time)) * 2;
  Sound.sfx('win');
  Sound.stopBgm();
  const key = 's' + G.stage;
  const prev = best[key] || 0;
  if (G.score > prev) { best[key] = G.score; try { localStorage.setItem('woojinRescue.v1', JSON.stringify(best)); } catch (e) {} }
  $('clearSaved').textContent = G.saved + '/' + LEVELS[G.stage].total;
  $('clearGems').textContent = G.gemsTaken;
  $('clearScore').textContent = G.score;
  $('nextBtn').textContent = G.stage >= LEVELS.length - 1 ? '처음부터 다시' : '다음 스테이지';
  setTimeout(() => showOverlay('clearScreen'), 550);
  setTimeout(() => { renderStageList(); }, 600);
}

function fail(msg) {
  if (G.ended) return;
  G.ended = true;
  G.mode = 'fail';
  Sound.sfx('fail');
  Sound.stopBgm();
  $('failMsg').textContent = msg || '다시 한 번 해 볼까요?';
  $('failTitle').textContent = G.time <= 0 ? '시간 초과!' : '조금 아쉬워요';
  showOverlay('failScreen');
}

/* ── 렌더 ───────────────────────────────────────────── */
function resize() {
  const r = wrap.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  cv.width = Math.max(1, Math.round(r.width * dpr));
  cv.height = Math.max(1, Math.round(r.height * dpr));
  const s = Math.min(r.width / W, r.height / H);
  view = {
    s, dpr,
    ox: (r.width - W * s) / 2,
    oy: r.height - H * s > 0 ? r.height - H * s : 0
  };
  if (view.oy === 0 && H * s < r.height) view.oy = 0;
  tcv.width = cv.width; tcv.height = cv.height;
  terrainDirty = true;
  renderTerrain();
}

function applyWorld(c) {
  const d = view.s * view.dpr;
  c.setTransform(d, 0, 0, d, view.ox * view.dpr, view.oy * view.dpr);
}

const COL = {
  grassTop: '#6fc255', grassTop2: '#8fd86d', grassEdge: '#4fa544',
  dirt: '#c58a56', dirt2: '#b17a48', dirtDark: '#9c6839',
  stone: '#a9a4c4', stoneTop: '#c6c2de', stoneDark: '#8d87ab',
  brick: '#c08a5c', brickDark: '#a06f45', brickLite: '#d8a97e'
};

function renderTerrain() {
  if (!G) return;
  tctx.setTransform(1, 0, 0, 1, 0, 0);
  tctx.clearRect(0, 0, tcv.width, tcv.height);
  applyWorld(tctx);
  for (let cx = 0; cx < COLS; cx++) {
    let cy = 0;
    while (cy < ROWS) {
      const m = grid[cy * COLS + cx];
      if (m) {
        let cy2 = cy;
        while (cy2 + 1 < ROWS && grid[(cy2 + 1) * COLS + cx]) cy2++;
        const y0 = cy * CELL, y1 = (cy2 + 1) * CELL;
        const x = cx * CELL;
        const exposedTop = (cy === 0) || !grid[(cy - 1) * COLS + cx];
        const leftOpen = cx === 0 || !grid[cy * COLS + cx - 1];
        const rightOpen = cx === COLS - 1 || !grid[cy * COLS + cx + 1];

        if (m === MAT.GRASS) {
          // 흙 본체
          tctx.fillStyle = COL.dirt;
          tctx.fillRect(x, y0, CELL + 0.6, y1 - y0);
          // 흙결(가로 줄무늬)
          for (let r = cy; r <= cy2; r++) {
            if (((r * CELL) % 26) < 2) {
              tctx.fillStyle = 'rgba(140,92,54,.22)';
              tctx.fillRect(x, r * CELL, CELL + 0.6, 1.6);
            }
          }
          // 조약돌
          const hsh = (cx * 37 + cy * 53) % 41;
          if (hsh === 0) {
            tctx.fillStyle = 'rgba(255,240,220,.35)';
            tctx.beginPath();
            tctx.ellipse(x + 1, y0 + 18 + (cx % 5) * 4, 2.2, 1.6, 0, 0, 6.3);
            tctx.fill();
          }
          // 절벽면 음영
          if (leftOpen) {
            tctx.fillStyle = 'rgba(120,76,44,.28)';
            tctx.fillRect(x, y0 + 8, 1.6, y1 - y0 - 8);
          }
          if (rightOpen) {
            tctx.fillStyle = 'rgba(120,76,44,.2)';
            tctx.fillRect(x + CELL - 1.6, y0 + 8, 1.6, y1 - y0 - 8);
          }
          // 잔디
          if (exposedTop) {
            tctx.fillStyle = COL.grassTop;
            tctx.fillRect(x, y0, CELL + 0.6, 8);
            tctx.fillStyle = COL.grassTop2;
            tctx.fillRect(x, y0, CELL + 0.6, 2.6);
            tctx.fillStyle = COL.grassEdge;
            tctx.fillRect(x, y0 + 8, CELL + 0.6, 1.6);
            if ((cx % 5) === 0) {
              tctx.fillRect(x - 0.4, y0 + 9.4, 2, 2.4);
            }
            if ((cx % 11) === 3) {
              tctx.fillStyle = COL.grassTop2;
              tctx.fillRect(x + 0.4, y0 - 1.6, 1.2, 2);
            }
          }
        } else if (m === MAT.STONE) {
          tctx.fillStyle = COL.stone;
          tctx.fillRect(x, y0, CELL + 0.6, y1 - y0);
          for (let r = cy; r <= cy2; r++) {
            if (((r * CELL + (cx % 3) * 7) % 22) < 2) {
              tctx.fillStyle = 'rgba(110,104,140,.18)';
              tctx.fillRect(x, r * CELL, CELL + 0.6, 1.4);
            }
          }
          if (exposedTop) {
            tctx.fillStyle = COL.stoneTop;
            tctx.fillRect(x, y0, CELL + 0.6, 4);
            tctx.fillStyle = 'rgba(255,255,255,.55)';
            tctx.fillRect(x, y0, CELL + 0.6, 1.4);
          }
          if (leftOpen) {
            tctx.fillStyle = 'rgba(90,84,120,.25)';
            tctx.fillRect(x, y0 + 3, 1.6, y1 - y0 - 3);
          }
          if (rightOpen) {
            tctx.fillStyle = 'rgba(90,84,120,.2)';
            tctx.fillRect(x + CELL - 1.6, y0 + 3, 1.6, y1 - y0 - 3);
          }
        } else {
          tctx.fillStyle = COL.brick;
          tctx.fillRect(x, y0, CELL + 0.6, y1 - y0);
        }
        cy = cy2 + 1;
      } else cy++;
    }
  }
  terrainTimer = 0;
}

function roundRect(c, x, y, w, h, r) {
  let tl = r, tr = r, br = r, bl = r;
  if (Array.isArray(r)) { tl = r[0]; tr = r[1]; br = r[2]; bl = r[3]; }
  c.beginPath();
  c.moveTo(x + tl, y);
  c.lineTo(x + w - tr, y); c.quadraticCurveTo(x + w, y, x + w, y + tr);
  c.lineTo(x + w, y + h - br); c.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
  c.lineTo(x + bl, y + h); c.quadraticCurveTo(x, y + h, x, y + h - bl);
  c.lineTo(x, y + tl); c.quadraticCurveTo(x, y, x + tl, y);
  c.closePath();
}

const cloudSeed = [0.12, 0.42, 0.72, 0.9];

function drawSky() {
  const cw = cv.width, chh = cv.height;
  const g = ctx.createLinearGradient(0, 0, 0, view.oy * view.dpr + 380 * view.s * view.dpr);
  g.addColorStop(0, '#9ed7f9');
  g.addColorStop(0.42, '#cdeaff');
  g.addColorStop(0.78, '#eaf6ff');
  g.addColorStop(1, '#fdf2f7');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cw, chh);

  // 해
  const sunX = cw * 0.8, sunY = chh * 0.1, sr = Math.min(cw, chh) * 0.055;
  const sun = ctx.createRadialGradient(sunX, sunY, sr * 0.4, sunX, sunY, sr * 4.2);
  sun.addColorStop(0, 'rgba(255,248,196,.95)');
  sun.addColorStop(0.28, 'rgba(255,240,170,.5)');
  sun.addColorStop(1, 'rgba(255,240,170,0)');
  ctx.fillStyle = sun;
  ctx.beginPath(); ctx.arc(sunX, sunY, sr * 4.2, 0, 6.3); ctx.fill();
  ctx.fillStyle = 'rgba(255,252,220,.98)';
  ctx.beginPath(); ctx.arc(sunX, sunY, sr, 0, 6.3); ctx.fill();

  // 구름 (캔버스 전체)
  const tm = G ? G.t : 0;
  ctx.fillStyle = 'rgba(255,255,255,.9)';
  for (let i = 0; i < 7; i++) {
    const seed = cloudSeed[i % cloudSeed.length];
    const cw2 = cw * (0.16 + (i % 3) * 0.07);
    const cx = ((seed * (cw + cw2 * 2) + tm * (2.6 + i * 0.7)) % (cw + cw2 * 2)) - cw2;
    const cy = chh * (0.08 + (i * 0.093) % 0.5) + Math.sin(tm * 0.3 + i) * 3;
    const sc = (0.7 + (i % 3) * 0.22) * (cw / 390);
    ctx.beginPath();
    ctx.ellipse(cx, cy, 30 * sc, 13 * sc, 0, 0, 6.3);
    ctx.ellipse(cx + 22 * sc, cy + 4 * sc, 19 * sc, 10 * sc, 0, 0, 6.3);
    ctx.ellipse(cx - 20 * sc, cy + 4 * sc, 16 * sc, 9 * sc, 0, 0, 6.3);
    ctx.fill();
  }

  // 은은한 무지개
  ctx.save();
  applyWorld(ctx);
  const rb = ['#ff9fae', '#ffc06a', '#ffe97a', '#9ce49a', '#8fd0f2', '#b9a9f0'];
  ctx.globalAlpha = 0.2;
  ctx.lineWidth = 12;
  for (let i = 0; i < rb.length; i++) {
    ctx.strokeStyle = rb[i];
    ctx.beginPath();
    ctx.arc(W * 0.44, H - 30, 392 - i * 12, Math.PI * 1.02, Math.PI * 1.98);
    ctx.stroke();
  }
  ctx.restore();

  // 먼 언덕 (땅 바로 위)
  applyWorld(ctx);
  ctx.fillStyle = '#c3e9b8';
  ctx.beginPath();
  ctx.moveTo(-30, H);
  ctx.quadraticCurveTo(60, H - 260, 190, H);
  ctx.quadraticCurveTo(300, H - 220, 420, H);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(150,214,160,.5)';
  ctx.beginPath();
  ctx.moveTo(-30, H);
  ctx.quadraticCurveTo(130, H - 150, 280, H);
  ctx.closePath();
  ctx.fill();

  // 먼 산맥
  ctx.fillStyle = 'rgba(150,192,220,.5)';
  ctx.beginPath();
  ctx.moveTo(-20, H);
  ctx.lineTo(24, H - 196);
  ctx.lineTo(66, H - 150);
  ctx.lineTo(116, H - 214);
  ctx.lineTo(168, H - 148);
  ctx.lineTo(226, H - 206);
  ctx.lineTo(286, H - 152);
  ctx.lineTo(336, H - 190);
  ctx.lineTo(410, H);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  ctx.beginPath();
  ctx.moveTo(24, H - 196); ctx.lineTo(41, H - 169); ctx.lineTo(7, H - 169); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(116, H - 214); ctx.lineTo(134, H - 186); ctx.lineTo(98, H - 186); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(226, H - 206); ctx.lineTo(243, H - 179); ctx.lineTo(209, H - 179); ctx.closePath(); ctx.fill();

  // 새
  ctx.strokeStyle = 'rgba(110,130,170,.45)';
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 3; i++) {
    const bx = 60 + i * 34 + Math.sin(tm * 0.6 + i) * 6;
    const by = H - 330 - i * 22 + Math.cos(tm * 0.5 + i) * 4;
    ctx.beginPath();
    ctx.arc(bx, by, 5, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(bx + 9, by, 5, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  }
}

function drawPonds() {
  const L = LEVELS[G.stage];
  for (const p of L.ponds) {
    const g = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
    g.addColorStop(0, '#9fe3f7');
    g.addColorStop(1, '#63bfe0');
    ctx.fillStyle = g;
    roundRect(ctx, p.x, p.y, p.w, p.h, [10, 10, 8, 8]);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    roundRect(ctx, p.x, p.y, p.w, p.h, [10, 10, 8, 8]);
    ctx.clip();
    const tm = G ? G.t : 0;
    ctx.strokeStyle = 'rgba(255,255,255,.65)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const yy = p.y + 8 + i * 11;
      ctx.beginPath();
      for (let x = p.x + 4; x < p.x + p.w - 4; x += 6) {
        const y = yy + Math.sin((x * 0.14) + tm * 2.4 + i) * 2.2;
        x === p.x + 4 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawDeco() {
  const L = LEVELS[G.stage];
  const tm = G ? G.t : 0;
  for (const d of L.deco) {
    ctx.save();
    ctx.translate(d.x, d.y);
    if (d.t === 'mush') {
      ctx.fillStyle = '#f7f2e6';
      ctx.fillRect(-1.6, -8, 3.2, 8);
      ctx.fillStyle = '#ff7d7d';
      ctx.beginPath(); ctx.ellipse(0, -8, 7, 5, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      ctx.beginPath(); ctx.arc(-2.4, -9.6, 1.3, 0, 6.3); ctx.arc(2.4, -10, 1, 0, 6.3); ctx.fill();
    } else if (d.t === 'clover') {
      ctx.fillStyle = '#5fbf72';
      for (let i = 0; i < 3; i++) {
        const a = -Math.PI / 2 + i * 2.1;
        ctx.beginPath(); ctx.ellipse(Math.cos(a) * 2.6, -3 + Math.sin(a) * 2.6, 3, 3, 0, 0, 6.3); ctx.fill();
      }
      ctx.strokeStyle = '#4aa35d'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(0, -1); ctx.lineTo(0, 0.5); ctx.stroke();
    } else if (d.t === 'flower') {
      ctx.strokeStyle = '#5fbf72'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -7); ctx.stroke();
      ctx.fillStyle = '#ffd166';
      for (let i = 0; i < 5; i++) {
        const a = i * 1.256 + tm * 0.2;
        ctx.beginPath(); ctx.arc(Math.cos(a) * 3, -9 + Math.sin(a) * 3, 2.1, 0, 6.3); ctx.fill();
      }
      ctx.fillStyle = '#fff3c4';
      ctx.beginPath(); ctx.arc(0, -9, 1.8, 0, 6.3); ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(150,160,190,.75)';
      ctx.beginPath(); ctx.ellipse(0, -2, 4.5, 3, 0.2, 0, 6.3); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.45)';
      ctx.beginPath(); ctx.ellipse(-1, -3.2, 2, 1.2, 0.2, 0, 6.3); ctx.fill();
    }
    ctx.restore();
  }
}

function drawGems() {
  if (!G) return;
  const tm = G.t;
  for (const g of G.gems) {
    if (g.taken) continue;
    const bob = Math.sin(tm * 2.4 + g.ph) * 2.4;
    const x = g.x, y = g.y + bob;
    ctx.save();
    ctx.translate(x, y);
    const gl = ctx.createRadialGradient(0, 0, 1, 0, 0, 15);
    gl.addColorStop(0, 'rgba(150,220,255,.5)');
    gl.addColorStop(1, 'rgba(150,220,255,0)');
    ctx.fillStyle = gl;
    ctx.beginPath(); ctx.arc(0, 0, 15, 0, 6.3); ctx.fill();
    ctx.fillStyle = '#7fd7f7';
    ctx.beginPath();
    ctx.moveTo(0, -9); ctx.lineTo(6.5, -1); ctx.lineTo(0, 8); ctx.lineTo(-6.5, -1);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.75)';
    ctx.beginPath();
    ctx.moveTo(0, -9); ctx.lineTo(3, -1); ctx.lineTo(0, 2); ctx.lineTo(-3, -1);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}

function drawSpawnDoor() {
  const L = LEVELS[G.stage];
  const x = L.spawn.x, y = L.spawn.y;
  ctx.save();
  ctx.translate(x, y);
  // 동굴
  ctx.fillStyle = 'rgba(90,70,80,.22)';
  ctx.beginPath(); ctx.ellipse(0, -2, 27, 8, 0, 0, 6.3); ctx.fill();
  roundRect(ctx, -22, -40, 44, 41, [22, 22, 4, 4]);
  ctx.fillStyle = '#8e6a4e';
  ctx.fill();
  roundRect(ctx, -17, -35, 34, 36, [17, 17, 3, 3]);
  ctx.fillStyle = '#4b3948';
  ctx.fill();
  const g = ctx.createLinearGradient(0, -34, 0, 0);
  g.addColorStop(0, 'rgba(60,40,60,.95)');
  g.addColorStop(1, 'rgba(120,86,110,.6)');
  roundRect(ctx, -15, -32, 30, 32, [15, 15, 2, 2]);
  ctx.fillStyle = g; ctx.fill();
  // 이끼
  ctx.fillStyle = '#7fc06a';
  ctx.beginPath(); ctx.ellipse(-18, -38, 8, 3.4, -0.2, 0, 6.3); ctx.fill();
  ctx.beginPath(); ctx.ellipse(16, -36, 7, 3, 0.15, 0, 6.3); ctx.fill();
  ctx.restore();
}

function drawExitDoor() {
  const L = LEVELS[G.stage];
  const x = L.exit.x, y = L.exit.y;
  const tm = G ? G.t : 0;
  ctx.save();
  ctx.translate(x, y);

  // 바닥 그림자
  ctx.fillStyle = 'rgba(90,70,80,.22)';
  ctx.beginPath(); ctx.ellipse(0, -1, 28, 8, 0, 0, 6.3); ctx.fill();

  // 초록 빛무리
  const glow = ctx.createRadialGradient(0, -22, 3, 0, -22, 46);
  glow.addColorStop(0, 'rgba(160,255,200,.55)');
  glow.addColorStop(1, 'rgba(160,255,200,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(-50, -70, 100, 76);

  // 아치 돌
  roundRect(ctx, -21, -44, 42, 45, [21, 21, 3, 3]);
  ctx.fillStyle = '#8dc46a'; ctx.fill();
  roundRect(ctx, -21, -44, 42, 45, [21, 21, 3, 3]);
  ctx.strokeStyle = '#6ea94f'; ctx.lineWidth = 2.4; ctx.stroke();

  // 문 안쪽 빛
  roundRect(ctx, -15, -38, 30, 38, [15, 15, 2, 2]);
  const ig = ctx.createLinearGradient(0, -38, 0, 0);
  ig.addColorStop(0, '#e8ffe9');
  ig.addColorStop(0.5, '#a8f5c0');
  ig.addColorStop(1, '#5fd98c');
  ctx.fillStyle = ig; ctx.fill();

  // 빛줄기
  ctx.save();
  roundRect(ctx, -15, -38, 30, 38, [15, 15, 2, 2]); ctx.clip();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 3; i++) {
    const ox = Math.sin(tm * 1.6 + i * 2) * 10;
    ctx.fillRect(-18 + ox + i * 12, -38, 3.4, 40);
  }
  ctx.restore();

  // 자물쇠 대신 화살표
  ctx.fillStyle = 'rgba(255,255,255,.85)';
  ctx.beginPath();
  ctx.moveTo(-5, -12); ctx.lineTo(5, -4); ctx.lineTo(-5, 4);
  ctx.closePath(); ctx.fill();

  // 간판
  roundRect(ctx, -22, -58, 44, 14, 4);
  ctx.fillStyle = '#f0c98a'; ctx.fill();
  ctx.strokeStyle = '#c79a5c'; ctx.lineWidth = 1.6; ctx.stroke();
  ctx.fillStyle = '#4d7c3a';
  ctx.font = '800 9px system-ui, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('EXIT', 0, -50.5);
  ctx.restore();
}

function drawBricks() {
  if (!G) return;
  for (const b of G.bricks) {
    roundRect(ctx, b.x, b.y, b.w, b.h, 2.2);
    ctx.fillStyle = COL.brick; ctx.fill();
    ctx.strokeStyle = COL.brickDark; ctx.lineWidth = 1.1; ctx.stroke();
    ctx.fillStyle = COL.brickLite;
    ctx.fillRect(b.x + 1.4, b.y + 1.4, b.w - 2.8, 2.2);
    ctx.fillStyle = 'rgba(150,100,60,.35)';
    ctx.fillRect(b.x + b.w * 0.5 - 0.5, b.y + 3.4, 1, b.h - 4.6);
  }
}

const IMG = {};
function loadSprites(cb) {
  const list = {
    run: 'assets/woojin-run.png', umbrella: 'assets/woojin-umbrella.png',
    pick: 'assets/woojin-pick.png', stop: 'assets/woojin-stop.png',
    cheer: 'assets/woojin-cheer.png', oops: 'assets/woojin-oops.png'
  };
  let left = Object.keys(list).length;
  for (const k in list) {
    const im = new Image();
    im.onload = () => { if (--left === 0) cb(); };
    im.onerror = () => { if (--left === 0) cb(); };
    im.src = list[k];
    IMG[k] = im;
  }
}

function drawLem(lem) {
  const tm = lem.t;
  let src = IMG.run;
  let h = LEM_H;
  let bob = 0, alpha = 1;
  if (lem.state === 'saved') { src = IMG.cheer; h = LEM_H + 4; alpha = Math.max(0, 1 - lem.t / 0.75); }
  else if (lem.state === 'lost') { src = IMG.oops; h = LEM_H; alpha = Math.max(0, 1 - lem.t / 0.75); }
  else if (lem.state === 'block') { src = IMG.stop; h = LEM_H + 2; }
  else if (lem.state === 'fall' && lem.umb) { src = IMG.umbrella; h = LEM_H + 12; }
  else if (lem.state === 'fall') { src = IMG.oops; }
  else if (lem.state === 'dig' || lem.state === 'mine') { src = IMG.pick; h = LEM_H + 2; bob = Math.sin(tm * 18) * 1.1; }
  else if (lem.state === 'walk') { bob = Math.abs(Math.sin(tm * 9)) * -1.6; }

  const w = h * (src.width && src.height ? src.width / src.height : 0.5);
  ctx.save();
  ctx.globalAlpha = alpha;
  // 그림자
  ctx.fillStyle = 'rgba(80,60,90,.18)';
  ctx.beginPath();
  ctx.ellipse(lem.x, lem.y + 1, 7, 2.6, 0, 0, 6.3);
  ctx.fill();

  ctx.translate(lem.x, lem.y + bob);
  // 지정 반짝임
  if (lem.pulse > 0) {
    ctx.save();
    ctx.globalAlpha = lem.pulse * 0.7;
    ctx.strokeStyle = '#ffe07a';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, -h / 2, h * 0.55 + (1 - lem.pulse) * 10, 0, 6.3); ctx.stroke();
    ctx.restore();
  }
  if (lem.dir < 0) ctx.scale(-1, 1);
  if (src.complete && src.naturalWidth) {
    ctx.drawImage(src, -w / 2, -h, w, h);
  } else {
    ctx.fillStyle = '#7ab7f0';
    roundRect(ctx, -5, -h, 10, h, 4); ctx.fill();
  }
  ctx.restore();

  // 도구 소품
  if (lem.umb && lem.state !== 'fall') {
    ctx.save();
    ctx.translate(lem.x, lem.y);
    const open = 0.7;
    ctx.translate(0, -h - 2);
    ctx.scale(open, open);
    ctx.fillStyle = '#ff9a4d';
    ctx.beginPath(); ctx.ellipse(0, 0, 13, 7, 0, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = '#e07a2c'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-13, 0); ctx.quadraticCurveTo(0, -14, 13, 0); ctx.stroke();
    ctx.strokeStyle = '#8a6a4f'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 7); ctx.stroke();
    ctx.restore();
  }
}

function drawParticles() {
  if (!G) return;
  for (const p of G.particles) {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
    ctx.fillStyle = p.c;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, 6.3);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const t of G.texts) {
    ctx.globalAlpha = Math.max(0, Math.min(1, t.life));
    ctx.font = '800 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255,255,255,.85)';
    ctx.strokeText(t.txt, t.x, t.y);
    ctx.fillStyle = t.color;
    ctx.fillText(t.txt, t.x, t.y);
  }
  ctx.globalAlpha = 1;
}

function render() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, cv.width, cv.height);
  // 배경(캔버스 전체)
  const bg = ctx.createLinearGradient(0, 0, 0, cv.height);
  bg.addColorStop(0, '#bfe6ff');
  bg.addColorStop(1, '#ffeef4');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, cv.width, cv.height);

  if (!G) return;

  drawSky();
  drawPonds();
  // 땅
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(tcv, 0, 0);
  applyWorld(ctx);

  drawDeco();
  drawGems();
  drawSpawnDoor();
  drawExitDoor();
  drawBricks();

  const sorted = G.lems.slice().sort((a, b) => a.y - b.y);
  for (const lem of sorted) drawLem(lem);
  drawParticles();

  // 부드러운 비네트
  const vg = ctx.createRadialGradient(W / 2, H * 0.55, H * 0.28, W / 2, H * 0.55, H * 0.95);
  vg.addColorStop(0, 'rgba(60,50,90,0)');
  vg.addColorStop(1, 'rgba(60,50,90,.16)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
}

/* ── 입력 ──────────────────────────────────────────── */
function pickLem(wx, wy) {
  let bestLem = null, bestD = TAP_R;
  for (const lem of G.lems) {
    if (lem.state === 'saved' || lem.state === 'lost') continue;
    const cy = lem.y - LEM_H * 0.55;
    const d = Math.hypot(lem.x - wx, cy - wy);
    if (d < bestD) { bestD = d; bestLem = lem; }
  }
  return bestLem;
}

function canvasPoint(ev) {
  const r = cv.getBoundingClientRect();
  const cx = (ev.clientX - r.left);
  const cy = (ev.clientY - r.top);
  return { x: (cx - view.ox) / view.s, y: (cy - view.oy) / view.s, cx, cy };
}

function onPointer(ev) {
  if (!G) return;
  if (G.mode !== 'play') return;
  ev.preventDefault();
  const p = canvasPoint(ev);
  const lem = pickLem(p.x, p.y);
  if (!lem) {
    if (G.selected) showToast('우진이를 톡!');
    return;
  }
  if (!G.selected) {
    Sound.sfx('tap');
    showToast('아래에서 도구를 먼저 골라요');
    return;
  }
  assignTool(G.selected, lem);
}

cv.addEventListener('pointerdown', onPointer, { passive: false });

document.querySelectorAll('.skill').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (!G || G.mode !== 'play') return;
    Sound.unlock();
    selectTool(btn.dataset.tool);
  });
});

$('speedBtn').addEventListener('click', () => {
  if (!G) return;
  G.speed = G.speed > 1 ? 1 : 2;
  Sound.sfx('tap');
  updateHud(true);
  showToast(G.speed > 1 ? '2배속!' : '보통 속도');
});

$('muteBtn').addEventListener('click', () => {
  const m = !Sound.isMuted();
  Sound.setMuted(m);
  $('muteBtn').classList.toggle('is-off', m);
  if (!m) { Sound.startBgm(); }
});

$('pauseBtn').addEventListener('click', () => {
  if (!G || (G.mode !== 'play' && G.mode !== 'pause')) return;
  if (G.mode === 'play') {
    G.mode = 'pause';
    showOverlay('pauseScreen');
    Sound.stopBgm();
  } else {
    G.mode = 'play';
    hideOverlays();
    Sound.startBgm();
  }
  updateHud(true);
});

$('resumeBtn').addEventListener('click', () => {
  if (!G) return;
  G.mode = 'play';
  hideOverlays();
  Sound.startBgm();
  updateHud(true);
});

$('resetBtn').addEventListener('click', () => { startLevel(G.stage); });
$('retryBtn').addEventListener('click', () => { startLevel(G.stage); });
$('menuBtn').addEventListener('click', () => { toMenu(); });
$('failMenuBtn').addEventListener('click', () => { toMenu(); });
$('clearMenuBtn').addEventListener('click', () => { toMenu(); });

$('nextBtn').addEventListener('click', () => {
  const n = G.stage + 1;
  if (n >= LEVELS.length) { toMenu(); return; }
  startLevel(n);
});

$('startBtn').addEventListener('click', () => {
  Sound.unlock();
  startLevel(pickStage);
});

function startLevel(i) {
  Sound.unlock();
  loadLevel(i);
  Sound.startBgm();
  updateHud(true);
}

function toMenu() {
  if (G) { G.mode = 'start'; G.ended = true; }
  Sound.stopBgm();
  renderStageList();
  hideOverlays();
  showOverlay('startScreen');
}

function renderStageList() {
  const wrapEl = $('stageList');
  wrapEl.innerHTML = '';
  LEVELS.forEach((L, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'stage-item' + (i === pickStage ? ' is-on' : '');
    const star = best['s' + i] ? ' ★' : '';
    b.innerHTML = '<span class="num">' + (i + 1) + '</span><span class="nm">' + L.name +
      '<small>' + L.sub + star + '</small></span>';
    b.addEventListener('click', () => {
      pickStage = i;
      renderStageList();
      Sound.sfx('tap');
    });
    wrapEl.appendChild(b);
  });
}

/* ── 루프 ──────────────────────────────────────────── */
let prev = 0;
let rafId = 0;
function loop(ts) {
  rafId = requestAnimationFrame(loop);
  if (!prev) prev = ts;
  let dt = (ts - prev) / 1000;
  prev = ts;
  if (dt > 0.05) dt = 0.05;
  if (G && G.mode === 'play') update(dt * G.speed);
  if (terrainDirty && G) {
    terrainTimer += dt;
    if (terrainTimer > 0.06) renderTerrain();
  }
  if (G) G.flow = (G.flow || 0) + dt;
  render();
}

/* ── 시작 ──────────────────────────────────────────── */
function boot() {
  loadLevel(pickStage, { silent: true });
  renderStageList();
  showOverlay('startScreen');
  resize();
  new ResizeObserver(() => resize()).observe(wrap);
  window.addEventListener('orientationchange', () => setTimeout(resize, 220));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && G && G.mode === 'play') {
      G.mode = 'pause';
      showOverlay('pauseScreen');
      Sound.stopBgm();
    }
  });
  requestAnimationFrame(loop);
}

loadSprites(() => { boot(); });

/* ── 테스트용 읽기 전용 API ────────────────────────── */
window.__woojin = {
  snap() {
    const L = LEVELS[G ? G.stage : 0];
    return {
      mode: G ? G.mode : null, stage: G ? G.stage : null,
      saved: G ? G.saved : 0, lost: G ? G.lost : 0, need: L.need, total: L.total,
      time: G ? Math.round(G.time * 10) / 10 : 0,
      gems: G ? G.gemsTaken : 0, score: G ? G.score : 0,
      tools: G ? Object.assign({}, G.tools) : {}, selected: G ? G.selected : null,
      spawned: G ? G.spawned : 0, waiting: G ? G.spawnLeft : 0,
      speed: G ? G.speed : 1,
      lems: G ? G.lems.map((l) => ({ x: Math.round(l.x * 10) / 10, y: Math.round(l.y * 10) / 10, s: l.state, dir: l.dir, umb: l.umb })) : []
    };
  },
  project(x, y) {
    const r = cv.getBoundingClientRect();
    return { x: r.left + view.ox + x * view.s, y: r.top + view.oy + y * view.s };
  },
  bricks() { return G ? G.bricks.map(b => [Math.round(b.x), Math.round(b.y), b.w]) : []; },
  stage(i) { startLevel(i); },
  select(t) { selectTool(t); },
  reset() { startLevel(G.stage); }
};
})();
