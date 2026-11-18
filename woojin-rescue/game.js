/* ============================================================
   별빛 구조대 — 오리지널 3D 퍼즐 웹게임
   (그래픽·음악·스테이지 전부 자체 제작, 외부 요청 0건)
   · 캔버스 2D 위에 직접 구현한 원근 투영 3D 렌더러
   · 스테이지마다 다른 3D 배경 5종 + 다른 멜로디 5곡
   ============================================================ */
(() => {
'use strict';

/* ── 상수 ───────────────────────────────────────────── */
const W = 390, H = 620, CELL = 2;
const COLS = Math.ceil(W / CELL), ROWS = Math.ceil(H / CELL);
const MAT = { EMPTY: 0, GRASS: 1, STONE: 2, WOOD: 3, BRICK: 4 };
const GRAV = 780;
const WALK = 29;
const DIG_SPEED = 34;
const MINE_SPEED = 40;
const MINE_MAX = 62;
const TAP_R = 56;
const LEM_H = 30;
const DEPTH = 76;                       // 지형 3D 두께
const TOOL_KEYS = ['bridge', 'dig', 'stop', 'pick'];

/* ── DOM ────────────────────────────────────────────── */
const $ = (id) => document.getElementById(id);
const cv = $('stageCanvas');
const ctx = cv.getContext('2d');
const wrap = $('stageWrap');
const tcv = document.createElement('canvas');   // 지형 캐시
const tctx = tcv.getContext('2d');
const bgcv = document.createElement('canvas');  // 배경 캐시
const bgx = bgcv.getContext('2d');

/* ============================================================
   1. 사운드 — 스테이지별 5곡 자체 합성
   ============================================================ */
const Sound = (() => {
  let AC = null, master = null, analyser = null, buf = null;
  let muted = false, bgmOn = false, bgmTimer = null, nextStep = 0, step = 0, track = 0;
  let bgmGain = null;

  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
  const parse = (s) => s.trim().split(/\s+/).map((t) => (t === '.' || t === '-' ? null : parseInt(t, 10)));

  // 5곡: 조성·템포·음색·리듬이 모두 다르다.
  const TRACKS = [
    { // 1 · 초원 — 밝은 장조, 통통 튀는 3잇단 느낌
      name: '햇살 언덕', bpm: 116, wave: 'triangle', hat: 5400, hatGain: 0.020, arp: [60, 64, 67, 72],
      lead: parse(`76 . 79 81 79 . 76 74 72 . 74 76 79 . 81 84
                   84 . 81 79 76 . 79 76 74 76 74 72 72 . . .
                   72 . 74 76 79 . 76 74 72 . 69 72 74 . 76 79
                   76 . 74 72 69 . 72 74 76 . 79 76 72 . . .`),
      bass: parse('48 . . . 43 . . . 45 . . . 41 . . .'),
      pads: [64, 67, 69, 62]
    },
    { // 2 · 사막 노을 — 단조 펜타토닉, 느긋하고 따뜻한 사인
      name: '노을 협곡', bpm: 94, wave: 'sine', hat: 4200, hatGain: 0.014, arp: [62, 65, 69, 74],
      lead: parse(`74 . . 72 69 . 67 . 69 . 72 74 77 . 74 .
                   72 . . 69 67 . 65 . 67 . 69 72 74 . 69 .
                   65 . 67 69 72 . 74 77 79 . 77 74 72 . 69 .
                   67 . 69 72 74 . 72 69 67 . 65 62 . . .`),
      bass: parse('38 . . . 41 . . . 43 . . . 36 . . .'),
      pads: [62, 65, 69, 62]
    },
    { // 3 · 별밤 성 — 왈츠풍 3박, 오르골 같은 트라이앵글
      name: '별밤 성', bpm: 102, wave: 'triangle', hat: 3600, hatGain: 0.010, arp: [69, 72, 76, 81],
      lead: parse(`81 . . 84 . . 88 . . 86 . . 84 . . .
                   81 . . 79 . . 76 . . 79 . . 81 . . .
                   76 . . 79 . . 83 . . 81 . . 79 . . .
                   76 . 79 81 . 84 81 . 79 76 . 72 . . .`),
      bass: parse('45 . . 45 . . 40 . . 43 . . 45 . . .'),
      pads: [57, 60, 64, 60]
    },
    { // 4 · 하늘 정원 — 경쾌한 사각파, 구름 위 산책
      name: '구름 정원', bpm: 124, wave: 'square', hat: 6200, hatGain: 0.016, arp: [65, 69, 72, 77],
      lead: parse(`77 . 79 81 79 77 74 . 77 . 81 84 81 79 77 .
                   74 . 77 79 77 74 72 . 69 . 72 74 77 . 76 .
                   72 . 74 77 79 . 81 . 79 77 74 72 69 . 67 .
                   69 . 72 74 77 . 79 77 74 . 72 69 65 . . .`),
      bass: parse('41 . . . 45 . . . 43 . . . 36 . . .'),
      pads: [65, 69, 72, 77]
    },
    { // 5 · 네온 정거장 — 빠른 아르페지오 신스
      name: '네온 정거장', bpm: 136, wave: 'square', hat: 7000, hatGain: 0.018, arp: [64, 67, 71, 76, 79, 76, 71, 67],
      lead: parse(`64 . 67 71 76 . 79 76 71 . 74 71 67 . 64 .
                   62 . 67 71 74 . 76 74 71 . 67 64 62 . . .
                   64 . 67 71 76 . 83 79 76 . 71 74 76 . 79 .
                   83 . 79 76 74 . 71 67 64 . 62 64 67 . . .`),
      bass: parse('40 . 40 . 38 . 38 . 35 . 35 . 36 . 36 .'),
      pads: [64, 67, 71, 74]
    }
  ];

  function ensure() {
    if (AC) return AC;
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    AC = new C();
    master = AC.createGain();
    master.gain.value = 0.36;
    analyser = AC.createAnalyser();
    analyser.fftSize = 2048;
    buf = new Float32Array(analyser.fftSize);
    master.connect(analyser);
    analyser.connect(AC.destination);
    return AC;
  }

  function tone(freq, when, dur, type, gain, bus) {
    if (!AC || muted) return;
    const target = bus || master;
    if (!target) return;
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.linearRampToValueAtTime(gain == null ? 0.12 : gain, when + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0004, when + dur);
    o.connect(g); g.connect(target);
    o.start(when); o.stop(when + dur + 0.03);
  }

  function noiseHit(when, dur, gain, freq, bus) {
    if (!AC || muted) return;
    const target = bus || master;
    const len = Math.max(1, Math.floor(AC.sampleRate * dur));
    const b = AC.createBuffer(1, len, AC.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = AC.createBufferSource(); src.buffer = b;
    const f = AC.createBiquadFilter(); f.type = 'bandpass';
    f.frequency.value = freq || 900; f.Q.value = 0.9;
    const g = AC.createGain(); g.gain.value = gain == null ? 0.1 : gain;
    g.gain.exponentialRampToValueAtTime(0.0008, when + dur);
    src.connect(f); f.connect(g); g.connect(target);
    src.start(when);
  }

  function scheduleBgm() {
    if (!AC || !bgmOn) return;
    const T = TRACKS[track];
    const stepDur = 60 / T.bpm / 4;
    while (nextStep < AC.currentTime + 0.24) {
      const i = step % 64;
      const n = T.lead[i];
      if (n != null) {
        tone(midi(n), nextStep, stepDur * 1.9, T.wave, 0.088, bgmGain);
        tone(midi(n + 12), nextStep, stepDur * 1.05, 'sine', 0.020, bgmGain);
      }
      if (i % 4 === 0) {
        tone(midi(T.bass[(Math.floor(i / 4)) % T.bass.length]), nextStep, stepDur * 3.4, 'sine', 0.080, bgmGain);
      }
      if (i % 8 === 0) {
        const p = T.pads[(Math.floor(i / 16)) % T.pads.length];
        tone(midi(p), nextStep, stepDur * 7.2, 'sine', 0.020, bgmGain);
        tone(midi(p + 7), nextStep, stepDur * 7.2, 'sine', 0.014, bgmGain);
      }
      if (T.hat && i % 2 === 1) noiseHit(nextStep, 0.038, T.hatGain, T.hat, bgmGain);
      if (T.arp && i % 2 === 0) {
        tone(midi(T.arp[(i / 2) % T.arp.length]), nextStep, stepDur * 0.8, 'sine', 0.012, bgmGain);
      }
      nextStep += stepDur;
      step++;
    }
  }

  return {
    unlock() {
      if (!ensure()) return;
      if (AC.state === 'suspended') AC.resume();
    },
    setTrack(i) {
      track = Math.max(0, Math.min(TRACKS.length - 1, i | 0));
      if (bgmOn) { step = 0; nextStep = AC ? AC.currentTime + 0.08 : 0; }
    },
    trackName() { return TRACKS[track].name; },
    trackCount() { return TRACKS.length; },
    startBgm() {
      if (!ensure()) return;
      if (AC.state === 'suspended') AC.resume();
      if (bgmOn) return;
      if (!bgmGain) {
        bgmGain = AC.createGain();
        bgmGain.gain.value = 1;
        bgmGain.connect(master);
      }
      bgmOn = true;
      step = 0;
      nextStep = AC.currentTime + 0.08;
      clearInterval(bgmTimer);
      bgmTimer = setInterval(scheduleBgm, 40);
      scheduleBgm();
    },
    stopBgm() {
      if (!bgmOn && !bgmGain) return;
      bgmOn = false;
      clearInterval(bgmTimer); bgmTimer = null;
      if (bgmGain && AC) {
        const g = bgmGain;
        bgmGain = null;
        try {
          g.gain.cancelScheduledValues(AC.currentTime);
          g.gain.setValueAtTime(g.gain.value, AC.currentTime);
          g.gain.linearRampToValueAtTime(0.0001, AC.currentTime + 0.02);
        } catch (e) {}
        setTimeout(() => { try { g.disconnect(); } catch (e) {} }, 120);
      }
    },
    setMuted(v) {
      muted = !!v;
      if (master) master.gain.value = muted ? 0 : 0.36;
    },
    isMuted() { return muted; },
    rms() {
      if (!AC || !analyser) return 0;
      analyser.getFloatTimeDomainData(buf);
      let s = 0;
      for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
      return Math.round(Math.sqrt(s / buf.length) * 10000) / 10000;
    },
    state() { return { ok: !!AC, state: AC ? AC.state : 'none', bgm: bgmOn, track: TRACKS[track].name, muted }; },
    sfx(name) {
      if (!ensure() || muted) return;
      const t = AC.currentTime + 0.01;
      switch (name) {
        case 'tap':   tone(midi(88), t, 0.09, 'triangle', 0.09); break;
        case 'tool':  tone(midi(81), t, 0.08, 'triangle', 0.1); tone(midi(88), t + 0.06, 0.1, 'triangle', 0.08); break;
        case 'assign':tone(midi(84), t, 0.1, 'square', 0.05); tone(midi(91), t + 0.05, 0.12, 'triangle', 0.07); break;
        case 'brick': noiseHit(t, 0.09, 0.07, 320); tone(midi(55), t, 0.07, 'square', 0.05); break;
        case 'dig':   noiseHit(t, 0.14, 0.09, 260); break;
        case 'save':  [76, 81, 84, 88].forEach((n, i) => tone(midi(n), t + i * 0.055, 0.24, 'triangle', 0.1)); break;
        case 'gem':   tone(midi(96), t, 0.12, 'sine', 0.1); tone(midi(100), t + 0.07, 0.16, 'sine', 0.08); break;
        case 'land':  noiseHit(t, 0.08, 0.05, 520); break;
        case 'lost':  tone(midi(57), t, 0.16, 'sawtooth', 0.05); tone(midi(50), t + 0.12, 0.24, 'sawtooth', 0.045); break;
        case 'win':   [72, 76, 79, 84, 88].forEach((n, i) => tone(midi(n), t + i * 0.1, 0.4, 'triangle', 0.1)); break;
        case 'fail':  [67, 63, 58].forEach((n, i) => tone(midi(n), t + i * 0.16, 0.4, 'triangle', 0.09)); break;
        case 'nope':  tone(midi(72), t, 0.1, 'square', 0.04); tone(midi(68), t + 0.08, 0.12, 'square', 0.04); break;
      }
    }
  };
})();

/* ============================================================
   2. 3D 원근 투영 카메라
   ============================================================ */
const CAM = { yaw: 0.105, pitch: 0.315, dist: 760, f: 820 };
const CY = Math.cos(CAM.yaw), SY = Math.sin(CAM.yaw);
const CP = Math.cos(CAM.pitch), SP = Math.sin(CAM.pitch);
let FIT = { k: 1, ox: 0, oy: 0 };

function rawProj(x, y, z) {
  const px = x - W / 2, py = y - H / 2, pz = (z || 0) + CAM.dist;
  const x1 = px * CY - pz * SY;
  const z1 = px * SY + pz * CY;
  const y2 = py * CP - z1 * SP;
  const z2 = Math.max(60, py * SP + z1 * CP);
  const s = CAM.f / z2;
  return { X: x1 * s, Y: y2 * s, s };
}
function proj(x, y, z) {
  const r = rawProj(x, y, z);
  return { x: FIT.ox + r.X * FIT.k, y: FIT.oy + r.Y * FIT.k, s: r.s * FIT.k };
}
function computeFit() {
  // 앞면(z=0) 폭을 화면에 꽉 채우고, 아래(발밑)를 기준으로 살짝 당겨 3D 디오라마가 크게 보이게 한다.
  let mnx = 1e9, mxx = -1e9, mny = 1e9, mxy = -1e9;
  for (const x of [0, W]) {
    for (const y of [0, H]) {
      const r = rawProj(x, y, 0);
      if (r.X < mnx) mnx = r.X;
      if (r.X > mxx) mxx = r.X;
      if (r.Y < mny) mny = r.Y;
      if (r.Y > mxy) mxy = r.Y;
    }
  }
  const pad = 3;
  const zoom = 1.14;
  const k = Math.min((W - pad * 2) / (mxx - mnx), (H - pad * 2) / (mxy - mny)) * zoom;
  FIT.k = k;
  FIT.ox = pad + (W - pad * 2 - (mxx - mnx) * k) / 2 - mnx * k;
  FIT.oy = (H - pad) - mxy * k;         // 발밑을 화면 아래에 붙인다
}

/* ============================================================
   3. 스테이지 — 배경 테마 5종
   ============================================================ */
const THEMES = [
  { // 초원 언덕
    key: 'meadow', sky: ['#8fd0f5', '#c7e9ff', '#eef8ff', '#fdf2f7'], sun: '#fff6c4',
    grass: '#6cc24f', grass2: '#8fd96c', grassEdge: '#4a9c3d',
    dirt: '#c58a56', dirt2: '#ab7444', dirtDark: '#8d5f34',
    stone: '#a7a2c2', stoneTop: '#c8c4de', stoneDark: '#847ea6',
    fog: 'rgba(210,235,255,0.55)', accent: '#ffd166'
  },
  { // 노을 협곡
    key: 'desert', sky: ['#4a2f6b', '#b5496a', '#f08a5d', '#ffc98a'], sun: '#ffe6a8',
    grass: '#d9a05c', grass2: '#f0bb78', grassEdge: '#b57c3f',
    dirt: '#b06a45', dirt2: '#96553a', dirtDark: '#7a4230',
    stone: '#b98a6a', stoneTop: '#d8ab86', stoneDark: '#94664b',
    fog: 'rgba(255,190,150,0.35)', accent: '#ff8f5e'
  },
  { // 별밤 성
    key: 'night', sky: ['#141a44', '#243066', '#3b4a8c', '#6a6fb0'], sun: '#f2f0d8',
    grass: '#4f8f6a', grass2: '#6fb389', grassEdge: '#376751',
    dirt: '#6a5570', dirt2: '#57465e', dirtDark: '#453650',
    stone: '#7c83ab', stoneTop: '#a3a9cc', stoneDark: '#5d6389',
    fog: 'rgba(90,110,190,0.30)', accent: '#b9a7ff'
  },
  { // 구름 정원
    key: 'sky', sky: ['#ffc2dd', '#d8c7ff', '#bfe6ff', '#e9fbff'], sun: '#fffaf0',
    grass: '#8fdcb0', grass2: '#b3f0cd', grassEdge: '#63bd8b',
    dirt: '#d3bde8', dirt2: '#bfa7da', dirtDark: '#a68cc4',
    stone: '#c2cfe9', stoneTop: '#d6e2f6', stoneDark: '#9daccb',
    fog: 'rgba(255,235,250,0.55)', accent: '#ffb3d1'
  },
  { // 네온 정거장
    key: 'neon', sky: ['#080a1e', '#131a3e', '#22235c', '#3b2a6b'], sun: '#9cf0ff',
    grass: '#3f6f9c', grass2: '#5e94c4', grassEdge: '#2c4f74',
    dirt: '#2f3a5e', dirt2: '#26304e', dirtDark: '#1b2338',
    stone: '#3d4a72', stoneTop: '#5f6f9f', stoneDark: '#2a3357',
    fog: 'rgba(80,140,255,0.28)', accent: '#66f7ff'
  }
];

/* ── 스테이지 정의 ─────────────────────────────────── */
const DY = 52;    // 디자인 기준(y 480) → 월드 높이 620
const LEVELS = [
  { // 1 · 길막기
    name: '첫걸음', sub: '길막이', time: 90, total: 8, need: 6, interval: 1.55, theme: 0,
    spawn: { x: 150, y: 388, dir: 1 }, exit: { x: 52, y: 388 },
    tools: { stop: 2 },
    tip: 'STOP 표지로 꼬마를 돌려세워요!',
    rects: [{ x: 0, y: 388, w: 248, h: 92, m: MAT.GRASS }],
    ponds: [{ x: 248, y: 428, w: 142, h: 52 }],
    gems: [{ x: 108, y: 366 }],
    deco: [{ t: 'mush', x: 32, y: 388 }, { t: 'clover', x: 84, y: 388 }, { t: 'flower', x: 196, y: 388 }, { t: 'mush', x: 228, y: 388 }, { t: 'rock', x: 18, y: 388 }]
  },
  { // 2 · 높은 절벽 — 우산 없이 안전 착지
    name: '높은 절벽', sub: '안전 착지', time: 90, total: 6, need: 4, interval: 1.5, theme: 1,
    spawn: { x: 52, y: 196, dir: 1 }, exit: { x: 48, y: 400 },
    tools: { stop: 1 },
    tip: '높은 데서 떨어져도 이제 안 다쳐요. 물만 조심!',
    rects: [
      { x: 0, y: 196, w: 172, h: 26, m: MAT.GRASS },
      { x: 0, y: 400, w: 196, h: 80, m: MAT.GRASS },
      { x: 312, y: 400, w: 78, h: 80, m: MAT.GRASS },
      { x: 236, y: 300, w: 154, h: 22, m: MAT.STONE }
    ],
    ponds: [{ x: 196, y: 428, w: 116, h: 52 }],
    gems: [{ x: 120, y: 372 }, { x: 300, y: 278 }],
    deco: [{ t: 'mush', x: 36, y: 196 }, { t: 'cactus', x: 120, y: 196 }, { t: 'rock', x: 330, y: 400 }, { t: 'rock', x: 168, y: 400 }]
  },
  { // 3 · 벽돌 다리
    name: '벽돌 다리', sub: '다리 놓기', time: 100, total: 6, need: 4, interval: 1.6, theme: 2,
    spawn: { x: 60, y: 400, dir: 1 }, exit: { x: 330, y: 400 },
    tools: { bridge: 2 },
    tip: '벽돌다리를 골라 낭떠러지 끝에서 톡!',
    rects: [
      { x: 0, y: 400, w: 170, h: 80, m: MAT.GRASS },
      { x: 250, y: 400, w: 140, h: 80, m: MAT.GRASS }
    ],
    ponds: [{ x: 168, y: 442, w: 84, h: 38 }],
    gems: [{ x: 210, y: 384 }],
    deco: [{ t: 'mush', x: 28, y: 400 }, { t: 'clover', x: 120, y: 400 }, { t: 'flower', x: 286, y: 400 }, { t: 'torch', x: 250, y: 400 }, { t: 'torch', x: 380, y: 400 }]
  },
  { // 4 · 땅파기
    name: '땅파기 지름길', sub: '땅파기', time: 100, total: 6, need: 4, interval: 1.5, theme: 3,
    spawn: { x: 60, y: 268, dir: 1 }, exit: { x: 330, y: 380 },
    tools: { dig: 2 },
    tip: '돌바닥 위에서 땅파기! 아래로 쑥 내려가요',
    rects: [
      { x: 0, y: 268, w: 390, h: 24, m: MAT.STONE },
      { x: 0, y: 380, w: 390, h: 100, m: MAT.GRASS }
    ],
    ponds: [],
    gems: [{ x: 196, y: 248 }, { x: 150, y: 362 }],
    deco: [{ t: 'cloudtree', x: 40, y: 380 }, { t: 'cloudtree', x: 300, y: 380 }, { t: 'flower', x: 250, y: 380 }, { t: 'clover', x: 96, y: 380 }]
  },
  { // 5 · 종합
    name: '종합 구조 작전', sub: '모두 동원', time: 140, total: 6, need: 3, interval: 1.6, theme: 4,
    spawn: { x: 90, y: 150, dir: 1 }, exit: { x: 330, y: 400 },
    tools: { bridge: 1, pick: 1, stop: 1 },
    tip: '다리 → 곡괭이 → 길막이 순서로!',
    rects: [
      { x: 0, y: 150, w: 120, h: 22, m: MAT.GRASS },
      { x: 0, y: 300, w: 150, h: 22, m: MAT.GRASS },
      { x: 250, y: 300, w: 140, h: 26, m: MAT.STONE },
      { x: 352, y: 216, w: 38, h: 184, m: MAT.STONE },
      { x: 0, y: 400, w: 172, h: 80, m: MAT.GRASS },
      { x: 250, y: 400, w: 140, h: 80, m: MAT.GRASS }
    ],
    ponds: [{ x: 172, y: 408, w: 78, h: 72 }],
    gems: [{ x: 190, y: 284 }, { x: 300, y: 380 }],
    deco: [{ t: 'neon', x: 26, y: 150 }, { t: 'neon', x: 100, y: 300 }, { t: 'neon', x: 260, y: 400 }, { t: 'neon', x: 372, y: 400 }]
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
let runs = [];
let view = { s: 1, ox: 0, oy: 0, dpr: 1 };
let terrainDirty = true;
let terrainTimer = 0;
let lastHudSec = -1;
let pickStage = 0;
let bgKey = '';
const best = (() => {
  try { return JSON.parse(localStorage.getItem('starlightRescue.v2') || localStorage.getItem('woojinRescue.v1') || '{}'); } catch (e) { return {}; }
})();

/* ── 그리드 ─────────────────────────────────────────── */
function cellAt(cx, cy) {
  if (cx < 0 || cx >= COLS || cy < 0 || cy >= ROWS) return 0;
  return grid[cy * COLS + cx];
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
    flash: 0, ended: false, fx: []
  };
  clearTimeout(overlayTimer);
  buildGrid(L);
  terrainDirty = true;
  computeFit();
  renderTerrain();
  paintBackground(true);
  $('stageName').textContent = L.name;
  $('levelNum').textContent = i + 1;
  $('needNum').textContent = L.need;
  Signal.forStage(i);
  updateHud(true);
  if (!opts.silent) hideOverlays();
  if (!opts.silent) {
    showHint('LEVEL ' + (i + 1) + ' · ' + L.tip);
    Sound.setTrack(i);
    Sound.startBgm();
  } else {
    G.mode = 'start';
  }
}

// 배경·음악 전환(테스트에서 읽을 수 있게 기록)
const Signal = {
  theme: 0, track: 0,
  forStage(i) {
    Signal.theme = LEVELS[i].theme;
    Signal.track = i;
  }
};

/* ── HUD ────────────────────────────────────────────── */
function updateHud(force) {
  if (!G) return;
  const L = LEVELS[G.stage];
  $('savedNum').textContent = G.saved;
  $('needNum').textContent = L.need;
  const t = Math.max(0, Math.ceil(G.time));
  if (force || t !== lastHudSec) {
    lastHudSec = t;
    $('timeNum').textContent = String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
    $('timeBadge').classList.toggle('warn', t <= 20 && G.mode === 'play');
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
let hintTimer = 0, toastTimer = 0, overlayTimer = 0;
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

/* ── 꼬마 조작 ──────────────────────────────────────── */
function spawnLem() {
  const L = LEVELS[G.stage];
  const lem = {
    x: L.spawn.x + (Math.random() * 4 - 2), y: L.spawn.y,
    dir: L.spawn.dir || 1, state: 'walk', vy: 0, fallFrom: null,
    buildLeft: 0, buildT: 0, digFrom: 0, mineLeft: 0,
    anim: Math.random() * 6.28, t: 0, pulse: 0, squash: 0, hop: 0
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
    if (lem.state !== 'walk' || !onGround(lem)) { showToast('걷는 꼬마에게!'); Sound.sfx('nope'); return false; }
    lem.state = 'block'; lem.pulse = 1;
    burst(lem.x, lem.y - 14, 8, ['#ff9b9b', '#ffffff'], 70);
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

  G.time -= dt;
  if (G.time <= 0) { G.time = 0; updateHud(true); return fail('시간이 다 됐어요'); }

  if (G.spawnLeft > 0) {
    G.spawnTimer -= dt;
    if (G.spawnTimer <= 0) {
      spawnLem();
      G.spawnLeft--;
      G.spawnTimer += L.interval;
    }
  }

  for (const lem of G.lems) stepLem(lem, dt);
  G.lems = G.lems.filter((l) => !((l.state === 'saved' || l.state === 'lost') && l.t > 0.75));

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

  for (const p of G.particles) {
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.vy += 220 * dt; p.life -= dt;
  }
  G.particles = G.particles.filter((p) => p.life > 0);
  for (const t of G.texts) { t.y -= 26 * dt; t.life -= dt; }
  G.texts = G.texts.filter((t) => t.life > 0);

  if (!G.ended) {
    const alive = G.lems.some((l) => l.state === 'walk' || l.state === 'fall' || l.state === 'dig' || l.state === 'mine' || l.state === 'block');
    if (!alive && G.spawnLeft <= 0) {
      if (G.saved >= L.need) win();
      else fail('꼬마를 조금 더 구해 볼까요?');
    }
  }
  updateHud();
}

function stepLem(lem, dt) {
  const L = LEVELS[G.stage];
  lem.t += dt;
  if (lem.pulse > 0) lem.pulse = Math.max(0, lem.pulse - dt * 2.2);
  if (lem.squash > 0) lem.squash = Math.max(0, lem.squash - dt * 3.4);

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
      if (lem.buildLeft > 0 && lem.state === 'walk') {
        const feetMat = materialAt(lem.x, lem.y + 2);
        const onBrick = feetMat === MAT.BRICK;
        if (!lem.crossed && topBetween(lem.x, lem.y + 18, lem.y + 130) === null) lem.crossed = true;
        if (lem.crossed && feetMat && !onBrick) {
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
      if (lem.vy > 760) lem.vy = 760;
      lem.y += lem.vy * dt;
      const g = topBetween(lem.x, prevY + 1, lem.y + 3);
      if (g !== null) {
        const drop = (lem.fallFrom == null ? 0 : g - lem.fallFrom);
        lem.y = g; lem.vy = 0;
        lem.fallFrom = null;
        lem.state = 'walk';
        // 우산 없이도 안전 착지 — 충격은 부드러운 먼지와 몸놀림으로 흡수
        if (drop > 40) {
          lem.squash = Math.min(1, drop / 260);
          burst(lem.x, lem.y - 2, 6, ['rgba(255,255,255,.9)', THEMES[L.theme].grass2], 60);
          Sound.sfx('land');
        }
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
      const st = MINE_SPEED * dt;
      clearDisc(lem.x + lem.dir * 5, lem.y + 4, 8);
      lem.x += lem.dir * st * 0.75;
      lem.y += st;
      clearDisc(lem.x, lem.y + 4, 8);
      lem.mineLeft -= st;
      if (Math.random() < 0.4) burst(lem.x + lem.dir * 6, lem.y - 2, 1, ['#b7b0cf', '#8f87ab'], 50);
      const below = topBetween(lem.x, lem.y + 4, lem.y + 16);
      const fwd = topBetween(lem.x + lem.dir * 9, lem.y - 2, lem.y + 14);
      if (lem.mineLeft <= 0 || (below === null && fwd === null)) {
        lem.state = 'fall'; lem.vy = 0; lem.fallFrom = lem.y;
      }
      break;
    }
    case 'block': lem.anim += dt * 2; break;
    case 'saved':
    case 'lost': break;
  }

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
  if (G.score > (best[key] || 0)) {
    best[key] = G.score;
    try { localStorage.setItem('starlightRescue.v2', JSON.stringify(best)); } catch (e) {}
  }
  $('clearSaved').textContent = G.saved + '/' + LEVELS[G.stage].total;
  $('clearGems').textContent = G.gemsTaken;
  $('clearScore').textContent = G.score;
  $('nextBtn').textContent = G.stage >= LEVELS.length - 1 ? '처음부터 다시' : '다음 스테이지';
  clearTimeout(overlayTimer);
  overlayTimer = setTimeout(() => {
    if (G && G.mode === 'clear') showOverlay('clearScreen');
    renderStageList();
  }, 550);
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

/* ============================================================
   4. 배경 — 스테이지별 3D 풍경 (정적 레이어 캐시)
   ============================================================ */
function rnd(seed) {
  let s = seed * 9301 + 49297;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

function paintBackground(force) {
  if (!G) return;
  const th = THEMES[LEVELS[G.stage].theme];
  const key = th.key + '|' + bgcv.width + 'x' + bgcv.height;
  if (!force && key === bgKey) return;
  bgKey = key;
  bgx.setTransform(1, 0, 0, 1, 0, 0);
  bgx.clearRect(0, 0, bgcv.width, bgcv.height);
  applyWorld(bgx);
  const c = bgx;
  // 하늘
  const g = c.createLinearGradient(0, -200, 0, H + 120);
  g.addColorStop(0, th.sky[0]);
  g.addColorStop(0.4, th.sky[1]);
  g.addColorStop(0.75, th.sky[2]);
  g.addColorStop(1, th.sky[3]);
  c.fillStyle = g;
  c.fillRect(-160, -160, W + 320, H + 320);

  if (th.key === 'meadow') bgMeadow(c, th);
  else if (th.key === 'desert') bgDesert(c, th);
  else if (th.key === 'night') bgNight(c, th);
  else if (th.key === 'sky') bgSkyGarden(c, th);
  else bgNeon(c, th);
}

function ridge(c, baseY, amp, color, step, seed, alpha) {
  const r = rnd(seed);
  c.save();
  c.globalAlpha = alpha == null ? 1 : alpha;
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(-60, H + 40);
  let y = baseY;
  for (let x = -60; x <= W + 60; x += step) {
    y = baseY + Math.sin(x * 0.011 + seed) * amp * 0.5 + (r() - 0.5) * amp * 0.7;
    c.lineTo(x, y);
  }
  c.lineTo(W + 60, H + 40);
  c.closePath();
  c.fill();
  c.restore();
}

function bgMeadow(c, th) {
  // 해
  const sx = W * 0.78, sy = 96, sr = 30;
  const gg = c.createRadialGradient(sx, sy, sr * 0.2, sx, sy, sr * 4);
  gg.addColorStop(0, 'rgba(255,250,205,.95)');
  gg.addColorStop(0.3, 'rgba(255,244,180,.45)');
  gg.addColorStop(1, 'rgba(255,244,180,0)');
  c.fillStyle = gg; c.beginPath(); c.arc(sx, sy, sr * 4, 0, 6.3); c.fill();
  c.fillStyle = '#fffbe0'; c.beginPath(); c.arc(sx, sy, sr, 0, 6.3); c.fill();
  // 원경 산맥 3겹
  ridge(c, 250, 60, 'rgba(150,196,226,.55)', 18, 3);
  ridge(c, 310, 44, 'rgba(132,190,168,.55)', 16, 7);
  ridge(c, 372, 34, 'rgba(110,180,132,.6)', 14, 11);
  // 구름
  const r = rnd(21);
  for (let i = 0; i < 7; i++) {
    const x = 30 + r() * (W - 60), y = 70 + r() * 190, s = 0.7 + r() * 0.8;
    cloud(c, x, y, s, 'rgba(255,255,255,.92)');
  }
}

function bgDesert(c, th) {
  // 큰 노을 해
  const sx = W * 0.62, sy = 300, sr = 54;
  const gg = c.createRadialGradient(sx, sy, sr * 0.3, sx, sy, sr * 3.4);
  gg.addColorStop(0, 'rgba(255,232,170,.95)');
  gg.addColorStop(0.35, 'rgba(255,180,110,.5)');
  gg.addColorStop(1, 'rgba(255,150,90,0)');
  c.fillStyle = gg; c.beginPath(); c.arc(sx, sy, sr * 3.4, 0, 6.3); c.fill();
  c.fillStyle = '#ffe9b0'; c.beginPath(); c.arc(sx, sy, sr, 0, 6.3); c.fill();
  // 메사(협곡) 실루엣 — 3D 원근으로 3단
  const layers = [
    { y: 300, col: 'rgba(120,66,102,.55)', w: 1.0, h: 62 },
    { y: 348, col: 'rgba(96,52,86,.62)', w: 1.16, h: 54 },
    { y: 400, col: 'rgba(74,40,70,.72)', w: 1.32, h: 48 }
  ];
  layers.forEach((L, li) => {
    const r = rnd(40 + li * 7);
    c.fillStyle = L.col;
    let x = -40;
    while (x < W + 40) {
      const w = (26 + r() * 54) * L.w;
      const hh = L.h * (0.5 + r() * 0.9);
      const top = L.y - hh;
      c.beginPath();
      c.moveTo(x, L.y + 40);
      c.lineTo(x + w * 0.06, top + 8);
      c.lineTo(x + w * 0.2, top);
      c.lineTo(x + w * 0.8, top + 2);
      c.lineTo(x + w * 0.94, top + 10);
      c.lineTo(x + w, L.y + 40);
      c.closePath(); c.fill();
      // 층리
      c.fillStyle = 'rgba(255,190,140,.12)';
      c.fillRect(x + 2, top + hh * 0.4, w - 4, 2.2);
      c.fillRect(x + 2, top + hh * 0.68, w - 4, 1.6);
      c.fillStyle = L.col;
      x += w + 6 + r() * 26;
    }
  });
  // 모래 먼지
  const r2 = rnd(77);
  for (let i = 0; i < 60; i++) {
    c.fillStyle = 'rgba(255,220,180,' + (0.1 + r2() * 0.3).toFixed(2) + ')';
    c.beginPath(); c.arc(r2() * W, 260 + r2() * 300, 0.7 + r2() * 1.5, 0, 6.3); c.fill();
  }
}

function bgNight(c, th) {
  // 별
  const r = rnd(5);
  for (let i = 0; i < 130; i++) {
    const x = r() * W, y = r() * (H * 0.72), s = r();
    c.fillStyle = 'rgba(' + (220 + s * 35 | 0) + ',' + (225 + s * 30 | 0) + ',255,' + (0.35 + s * 0.6).toFixed(2) + ')';
    c.beginPath(); c.arc(x, y, 0.45 + s * 1.25, 0, 6.3); c.fill();
    if (s > 0.93) {
      c.strokeStyle = 'rgba(220,235,255,.5)'; c.lineWidth = 0.8;
      c.beginPath(); c.moveTo(x - 3, y); c.lineTo(x + 3, y); c.moveTo(x, y - 3); c.lineTo(x, y + 3); c.stroke();
    }
  }
  // 달
  const mx = W * 0.74, my = 104, mr = 26;
  const mg = c.createRadialGradient(mx, my, mr * 0.4, mx, my, mr * 3.2);
  mg.addColorStop(0, 'rgba(240,240,215,.55)');
  mg.addColorStop(1, 'rgba(240,240,215,0)');
  c.fillStyle = mg; c.beginPath(); c.arc(mx, my, mr * 3.2, 0, 6.3); c.fill();
  c.fillStyle = '#f4f2dc'; c.beginPath(); c.arc(mx, my, mr, 0, 6.3); c.fill();
  c.fillStyle = 'rgba(205,205,180,.5)';
  c.beginPath(); c.arc(mx - 7, my - 6, 4.5, 0, 6.3); c.arc(mx + 6, my + 5, 3.4, 0, 6.3); c.arc(mx + 2, my - 11, 2.2, 0, 6.3); c.fill();
  // 성 실루엣 (원근 3단)
  tower(c, 40, 470, 46, 150, 'rgba(30,36,74,.92)', 2);
  tower(c, 300, 470, 54, 190, 'rgba(30,36,74,.92)', 1);
  tower(c, 150, 470, 34, 120, 'rgba(36,44,88,.9)', 1);
  tower(c, 250, 470, 24, 92, 'rgba(42,50,96,.9)', 0);
  // 성벽
  c.fillStyle = 'rgba(28,34,70,.92)';
  c.fillRect(-20, 430, W + 40, 60);
  // 지평선 안개
  const fg = c.createLinearGradient(0, 380, 0, H);
  fg.addColorStop(0, 'rgba(90,110,190,0)');
  fg.addColorStop(1, 'rgba(70,90,170,.35)');
  c.fillStyle = fg; c.fillRect(-20, 380, W + 40, H - 360);
  // 별똥별
  c.strokeStyle = 'rgba(200,220,255,.55)'; c.lineWidth = 1.6;
  c.beginPath(); c.moveTo(60, 150); c.lineTo(96, 178); c.stroke();
}

function tower(c, x, baseY, w, h, col, lit) {
  c.fillStyle = col;
  c.fillRect(x - w / 2, baseY - h, w, h);
  c.beginPath();
  c.moveTo(x - w / 2 - 4, baseY - h);
  c.lineTo(x, baseY - h - 26);
  c.lineTo(x + w / 2 + 4, baseY - h);
  c.closePath(); c.fill();
  c.fillRect(x - w / 2 - 3, baseY - h - 4, w + 6, 6);
  if (lit) {
    c.fillStyle = 'rgba(255,214,130,.85)';
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 2; j++) {
        if ((i + j + lit) % 3 === 0) continue;
        c.fillRect(x - w * 0.28 + j * w * 0.42, baseY - h + 16 + i * 26, 5, 8);
      }
    }
  }
}

function bgSkyGarden(c, th) {
  // 무지개
  const rb = ['#ffb3d1', '#ffc98a', '#ffef9a', '#a8e6b0', '#9ad6f5', '#c3b5f5'];
  c.save();
  c.globalAlpha = 0.35;
  c.lineWidth = 13;
  for (let i = 0; i < rb.length; i++) {
    c.strokeStyle = rb[i];
    c.beginPath(); c.arc(W * 0.4, 520, 300 - i * 13, Math.PI * 1.04, Math.PI * 1.96); c.stroke();
  }
  c.restore();
  // 해
  const sx = W * 0.2, sy = 110, sr = 26;
  const gg = c.createRadialGradient(sx, sy, sr * 0.3, sx, sy, sr * 3.6);
  gg.addColorStop(0, 'rgba(255,255,240,.95)');
  gg.addColorStop(1, 'rgba(255,240,255,0)');
  c.fillStyle = gg; c.beginPath(); c.arc(sx, sy, sr * 3.6, 0, 6.3); c.fill();
  c.fillStyle = '#fffdf5'; c.beginPath(); c.arc(sx, sy, sr, 0, 6.3); c.fill();
  // 떠 있는 섬 3개 (원근 크기)
  island(c, 90, 300, 1.0);
  island(c, 292, 236, 0.66);
  island(c, 210, 400, 1.25);
  // 구름바다
  const r = rnd(33);
  for (let i = 0; i < 16; i++) {
    const x = r() * (W + 80) - 40, y = 430 + r() * 210, s = 0.8 + r() * 1.5;
    cloud(c, x, y, s, 'rgba(255,255,255,.92)');
  }
  const fg = c.createLinearGradient(0, 420, 0, H);
  fg.addColorStop(0, 'rgba(255,255,255,0)');
  fg.addColorStop(1, 'rgba(255,255,255,.85)');
  c.fillStyle = fg; c.fillRect(-20, 420, W + 40, H - 400);
}

function island(c, x, y, s) {
  c.save();
  c.translate(x, y); c.scale(s, s);
  c.fillStyle = 'rgba(160,210,180,.9)';
  c.beginPath(); c.ellipse(0, 0, 48, 12, 0, 0, 6.3); c.fill();
  c.fillStyle = 'rgba(120,170,150,.55)';
  c.beginPath();
  c.moveTo(-44, 4); c.lineTo(0, 40); c.lineTo(44, 4);
  c.quadraticCurveTo(0, 18, -44, 4);
  c.fill();
  c.fillStyle = 'rgba(168,232,192,.95)';
  c.beginPath(); c.ellipse(0, -2, 48, 11, 0, 0, 6.3); c.fill();
  // 나무
  c.fillStyle = '#8a6a4f'; c.fillRect(-2, -22, 4, 20);
  c.fillStyle = 'rgba(120,220,160,.95)';
  c.beginPath(); c.arc(0, -28, 13, 0, 6.3); c.arc(-10, -22, 8, 0, 6.3); c.arc(10, -22, 8, 0, 6.3); c.fill();
  c.restore();
}

function bgNeon(c, th) {
  // 성운
  const ng = c.createRadialGradient(W * 0.3, 200, 20, W * 0.35, 240, 320);
  ng.addColorStop(0, 'rgba(120,80,220,.55)');
  ng.addColorStop(0.5, 'rgba(60,50,160,.3)');
  ng.addColorStop(1, 'rgba(20,20,60,0)');
  c.fillStyle = ng; c.fillRect(-40, -40, W + 80, H + 80);
  // 별
  const r = rnd(9);
  for (let i = 0; i < 150; i++) {
    const x = r() * W, y = r() * H, s = r();
    c.fillStyle = 'rgba(' + (200 + s * 55 | 0) + ',' + (220 + s * 30 | 0) + ',255,' + (0.25 + s * 0.7).toFixed(2) + ')';
    c.beginPath(); c.arc(x, y, 0.4 + s * 1.1, 0, 6.3); c.fill();
  }
  // 행성 + 고리
  const px = W * 0.76, py = 150, pr = 40;
  const pg = c.createRadialGradient(px - 12, py - 14, pr * 0.2, px, py, pr);
  pg.addColorStop(0, '#7fe8ff');
  pg.addColorStop(0.55, '#4a86d8');
  pg.addColorStop(1, '#24306b');
  c.fillStyle = pg; c.beginPath(); c.arc(px, py, pr, 0, 6.3); c.fill();
  c.save();
  c.translate(px, py); c.rotate(-0.42);
  c.strokeStyle = 'rgba(150,220,255,.6)'; c.lineWidth = 4;
  c.beginPath(); c.ellipse(0, 0, pr * 1.7, pr * 0.42, 0, 0, 6.3); c.stroke();
  c.strokeStyle = 'rgba(110,180,255,.4)'; c.lineWidth = 2;
  c.beginPath(); c.ellipse(0, 0, pr * 2.0, pr * 0.52, 0, 0, 6.3); c.stroke();
  c.restore();
  // 정거장 구조물
  c.strokeStyle = 'rgba(120,200,255,.35)'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(0, 330); c.lineTo(W, 300); c.stroke();
  c.beginPath(); c.moveTo(0, 352); c.lineTo(W, 322); c.stroke();
  for (let i = 0; i < 6; i++) {
    const x = 20 + i * 68;
    c.strokeStyle = 'rgba(120,200,255,.22)';
    c.beginPath(); c.moveTo(x, 300 - (x / W) * 30); c.lineTo(x, 400); c.stroke();
  }
  // 네온 지평선
  const hz = c.createLinearGradient(0, 400, 0, H);
  hz.addColorStop(0, 'rgba(40,220,255,.35)');
  hz.addColorStop(0.16, 'rgba(40,180,255,.06)');
  hz.addColorStop(1, 'rgba(10,10,30,0)');
  c.fillStyle = hz; c.fillRect(-20, 400, W + 40, H - 390);
}

function cloud(c, x, y, s, col) {
  c.fillStyle = col;
  c.beginPath();
  c.ellipse(x, y, 30 * s, 13 * s, 0, 0, 6.3);
  c.ellipse(x + 22 * s, y + 4 * s, 19 * s, 10 * s, 0, 0, 6.3);
  c.ellipse(x - 21 * s, y + 4 * s, 16 * s, 9 * s, 0, 0, 6.3);
  c.ellipse(x + 4 * s, y - 9 * s, 16 * s, 11 * s, 0, 0, 6.3);
  c.fill();
}

/* ── 배경 애니메이션 (가벼운 레이어) ─────────────────── */
function drawBgFx() {
  if (!G) return;
  const th = THEMES[LEVELS[G.stage].theme];
  const tm = G.t + (G.flow || 0);
  if (th.key === 'night') {
    for (let i = 0; i < 9; i++) {
      const a = 0.25 + 0.55 * Math.abs(Math.sin(tm * 1.1 + i * 1.7));
      const x = ((i * 137) % 370) + 8, y = ((i * 91) % 330) + 14;
      ctx.fillStyle = 'rgba(230,240,255,' + a.toFixed(2) + ')';
      ctx.beginPath(); ctx.arc(x, y, 1.1, 0, 6.3); ctx.fill();
    }
  } else if (th.key === 'neon') {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = 'rgba(90,240,255,.5)'; ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const yy = ((tm * 26 + i * 46) % (H + 60)) - 30;
      ctx.beginPath(); ctx.moveTo(-10, yy); ctx.lineTo(W + 10, yy - 26); ctx.stroke();
    }
    ctx.restore();
  } else if (th.key === 'meadow' || th.key === 'sky') {
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = th.key === 'meadow' ? 'rgba(255,255,255,.8)' : 'rgba(255,255,255,.95)';
    for (let i = 0; i < 3; i++) {
      const x = ((tm * (7 + i * 3) + i * 140) % (W + 120)) - 60;
      cloud(ctx, x, 60 + i * 46, 0.45 + i * 0.12, ctx.fillStyle);
    }
    ctx.restore();
  } else if (th.key === 'desert') {
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = 'rgba(255,210,160,.6)';
    for (let i = 0; i < 4; i++) {
      const x = ((tm * (10 + i * 4) + i * 120) % (W + 140)) - 70;
      ctx.beginPath(); ctx.ellipse(x, 330 + i * 30, 46, 7, 0, 0, 6.3); ctx.fill();
    }
    ctx.restore();
  }
  // 반딧불/빛입자 (모든 테마 공통, 아주 가볍게)
  ctx.save();
  for (let i = 0; i < 14; i++) {
    const px = ((i * 73 + tm * (5 + (i % 4))) % (W + 40)) - 20;
    const py = 140 + ((i * 97) % 420) + Math.sin(tm * 0.8 + i) * 8;
    const a = 0.12 + 0.3 * Math.abs(Math.sin(tm * 1.4 + i * 1.1));
    ctx.fillStyle = 'rgba(255,255,235,' + a.toFixed(2) + ')';
    ctx.beginPath(); ctx.arc(px, py, 1.2, 0, 6.3); ctx.fill();
  }
  ctx.restore();
}

/* ============================================================
   5. 3D 지형 렌더
   ============================================================ */
function resize() {
  const r = wrap.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  cv.width = Math.max(1, Math.round(r.width * dpr));
  cv.height = Math.max(1, Math.round(r.height * dpr));
  const s = Math.min(r.width / W, r.height / H);
  view = { s, dpr, ox: (r.width - W * s) / 2, oy: r.height - H * s > 0 ? r.height - H * s : 0 };
  if (view.oy === 0 && H * s < r.height) view.oy = 0;
  tcv.width = cv.width; tcv.height = cv.height;
  bgcv.width = cv.width; bgcv.height = cv.height;
  computeFit();
  terrainDirty = true;
  renderTerrain();
  paintBackground(true);
}

function applyWorld(c) {
  const d = view.s * view.dpr;
  c.setTransform(d, 0, 0, d, view.ox * view.dpr, view.oy * view.dpr);
}

function pal() { return THEMES[LEVELS[G.stage].theme]; }

function quad(c, pts, fill) {
  c.beginPath();
  c.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) c.lineTo(pts[i].x, pts[i].y);
  c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); }
}

function exposedAt(x, y0, y1) {
  const cx = Math.floor(x / CELL);
  if (cx < 0 || cx >= COLS) return true;
  const a = Math.floor(y0 / CELL), b = Math.ceil(y1 / CELL);
  for (let cy = a; cy < b; cy++) if (grid[cy * COLS + cx]) return false;
  return true;
}

function buildRuns() {
  // 같은 재질·같은 높이의 연속 열을 하나의 덩어리로 합쳐 이음매 없이 그린다.
  runs = [];
  const open = new Map();
  for (let cx = 0; cx < COLS; cx++) {
    const here = new Set();
    let cy = 0;
    while (cy < ROWS) {
      const m = grid[cy * COLS + cx];
      if (!m) { cy++; continue; }
      let cy2 = cy;
      while (cy2 + 1 < ROWS && grid[(cy2 + 1) * COLS + cx] === m) cy2++;
      const top = (cy === 0) || !grid[(cy - 1) * COLS + cx];
      const key = m + '|' + cy + '|' + (cy2 + 1) + '|' + (top ? 1 : 0);
      here.add(key);
      const r = open.get(key);
      if (r && r.x1 === cx * CELL) {
        r.x1 = (cx + 1) * CELL;
      } else {
        const nr = {
          x0: cx * CELL, x1: (cx + 1) * CELL,
          y0: cy * CELL, y1: (cy2 + 1) * CELL, m, top, left: false, right: false
        };
        open.set(key, nr);
        runs.push(nr);
      }
      cy = cy2 + 1;
    }
    for (const k of Array.from(open.keys())) if (!here.has(k)) open.delete(k);
  }
  for (const r of runs) {
    r.left = exposedAt(r.x0 - 1, r.y0, r.y1);
    r.right = exposedAt(r.x1, r.y0, r.y1);
  }
}

function renderTerrain() {
  if (!G) return;
  const P = pal();
  buildRuns();
  tctx.setTransform(1, 0, 0, 1, 0, 0);
  tctx.clearRect(0, 0, tcv.width, tcv.height);
  applyWorld(tctx);
  const c = tctx;

  // ── 물(연못): 지면에 놓인 3D 수면
  for (const p of LEVELS[G.stage].ponds) {
    const pd = Math.max(20, Math.min(DEPTH, p.h * 0.8));
    const wy = p.y + 3;
    // 뒤쪽 어두운 벽
    quad(c, [proj(p.x, wy, pd), proj(p.x + p.w, wy, pd), proj(p.x + p.w, wy + 30, pd), proj(p.x, wy + 30, pd)], 'rgba(22,52,84,.9)');
    // 웅덩이 물기둥: 아래로 갈수록 진한 물색
    const wf = c.createLinearGradient(0, proj(p.x, wy, 0).y, 0, proj(p.x, wy + 30, 0).y);
    wf.addColorStop(0, 'rgba(126,206,244,.98)');
    wf.addColorStop(0.5, 'rgba(72,164,214,.98)');
    wf.addColorStop(1, 'rgba(44,122,176,.98)');
    quad(c, [proj(p.x, wy, 0), proj(p.x + p.w, wy, 0), proj(p.x + p.w, wy + 30, 0), proj(p.x, wy + 30, 0)], wf);
    // 수면
    const a = proj(p.x, wy, pd), b = proj(p.x + p.w, wy, pd), d2 = proj(p.x + p.w, wy, 0), e2 = proj(p.x, wy, 0);
    const g = c.createLinearGradient(0, a.y, 0, e2.y);
    g.addColorStop(0, 'rgba(120,198,238,.97)');
    g.addColorStop(0.55, 'rgba(80,170,220,.97)');
    g.addColorStop(1, 'rgba(58,146,200,.97)');
    quad(c, [a, b, d2, e2], g);
    // 물결
    c.save();
    c.beginPath(); c.moveTo(e2.x, e2.y); c.lineTo(d2.x, d2.y); c.lineTo(b.x, b.y); c.lineTo(a.x, a.y); c.closePath(); c.clip();
    const tm = G.t;
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1.5;
    for (let k2 = 1; k2 <= 3; k2++) {
      const yy = wy + k2 * (pd / 4);
      c.beginPath();
      for (let xx = 0; xx <= 1.0001; xx += 0.1) {
        const pt = proj(p.x + 3 + xx * (p.w - 6), yy + Math.sin(xx * 8 + tm * 2.2 + k2) * 1.3, Math.max(0, pd - k2 * pd * 0.14));
        if (xx === 0) c.moveTo(pt.x, pt.y); else c.lineTo(pt.x, pt.y);
      }
      c.stroke();
    }
    c.restore();
    // 물가 하이라이트
    const l1 = proj(p.x, wy, 0), l2 = proj(p.x + p.w, wy, 0);
    c.strokeStyle = 'rgba(255,255,255,.65)'; c.lineWidth = 1.8;
    c.beginPath(); c.moveTo(l1.x, l1.y); c.lineTo(l2.x, l2.y); c.stroke();
  }

  // ── 지형 블록 3D
  for (const r of runs) {
    let body, body2, dark, side, topc, topc2;
    if (r.m === MAT.GRASS) {
      body = P.dirt; body2 = P.dirt2; dark = P.dirtDark; side = P.dirt2;
      topc = P.grass; topc2 = P.grass2;
    } else if (r.m === MAT.STONE) {
      body = P.stone; body2 = P.stoneDark; dark = P.stoneDark; side = P.stoneDark;
      topc = P.stoneTop; topc2 = P.stoneTop;
    } else {
      body = '#c08a5c'; body2 = '#a06f45'; dark = '#8a5c38'; side = '#a06f45';
      topc = '#d8a97e'; topc2 = '#e6c096';
    }
    const x0 = r.x0, x1 = r.x1 + 0.45, y0 = r.y0, y1 = r.y1;
    const z0 = 0, z1 = DEPTH;

    // 옆면(깊이) — 열린 쪽만
    if (r.right) {
      const pts = [proj(x1, y0, z0), proj(x1, y0, z1), proj(x1, y1, z1), proj(x1, y1, z0)];
      quad(c, pts, dark);
      c.save(); quad(c, pts); c.clip();
      c.fillStyle = 'rgba(0,0,0,.14)';
      c.fillRect(0, 0, W + 40, H + 40);
      c.restore();
    } else if (r.left) {
      const pts = [proj(x0, y0, z0), proj(x0, y0, z1), proj(x0, y1, z1), proj(x0, y1, z0)];
      quad(c, pts, side);
      c.save(); quad(c, pts); c.clip();
      c.fillStyle = 'rgba(0,0,0,.12)';
      c.fillRect(0, 0, W + 40, H + 40);
      c.restore();
    }

    // 윗면(바닥면) — 노출된 경우
    if (r.top) {
      const t1 = proj(x0, y0, z0), t2 = proj(x1, y0, z0), t3 = proj(x1, y0, z1), t4 = proj(x0, y0, z1);
      const tg = c.createLinearGradient(0, t1.y, 0, t4.y);
      tg.addColorStop(0, topc2);
      tg.addColorStop(1, topc);
      quad(c, [t1, t2, t3, t4], tg);
      // 윗면 결
      c.save();
      c.beginPath(); c.moveTo(t1.x, t1.y); c.lineTo(t2.x, t2.y); c.lineTo(t3.x, t3.y); c.lineTo(t4.x, t4.y); c.closePath(); c.clip();
      c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = 1;
      for (let k = 1; k < 4; k++) {
        const zz = (DEPTH / 4) * k;
        const q1 = proj(x0, y0, zz), q2 = proj(x1, y0, zz);
        c.beginPath(); c.moveTo(q1.x, q1.y); c.lineTo(q2.x, q2.y); c.stroke();
      }
      c.restore();
    }

    // 정면
    const f1 = proj(x0, y0, 0), f2 = proj(x1, y0, 0), f3 = proj(x1, y1, 0), f4 = proj(x0, y1, 0);
    const fg = c.createLinearGradient(0, f1.y, 0, f3.y);
    fg.addColorStop(0, body);
    fg.addColorStop(0.55, body2);
    fg.addColorStop(1, dark);
    quad(c, [f1, f2, f3, f4], fg);

    c.save();
    c.beginPath(); c.moveTo(f1.x, f1.y); c.lineTo(f2.x, f2.y); c.lineTo(f3.x, f3.y); c.lineTo(f4.x, f4.y); c.closePath(); c.clip();

    // 정면 텍스처
    if (r.m === MAT.GRASS) {
      for (let yy = Math.ceil(y0 / 23) * 23; yy < y1; yy += 23) {
        const l1 = proj(x0, yy, 0), l2 = proj(x1, yy, 0);
        c.strokeStyle = 'rgba(120,78,42,' + (0.13 + ((yy / 23) % 2) * 0.04).toFixed(2) + ')';
        c.lineWidth = 1.3;
        c.beginPath(); c.moveTo(l1.x, l1.y); c.lineTo(l2.x, l2.y); c.stroke();
      }
      // 조약돌
      const hs = ((r.x0 * 19) + (r.y0 * 53)) % 17;
      if (hs === 0) {
        const sp = proj(x0 + 1, y0 + 24, 0);
        c.fillStyle = 'rgba(255,240,220,.32)';
        c.beginPath(); c.ellipse(sp.x, sp.y, 2.4, 1.7, 0, 0, 6.3); c.fill();
      }
      // 잔디 띠(정면 상단)
      const g1 = proj(x0, y0, 0), g2 = proj(x1, y0, 0), g3 = proj(x1, y0 + 8, 0), g4 = proj(x0, y0 + 8, 0);
      quad(c, [g1, g2, g3, g4], topc);
      const g5 = proj(x0, y0 + 6, 0), g6 = proj(x1, y0 + 6, 0), g7 = proj(x1, y0 + 9.5, 0), g8 = proj(x0, y0 + 9.5, 0);
      quad(c, [g5, g6, g7, g8], P.grassEdge);
      // 풀잎
      if (((r.x0 / CELL) % 3) === 0) {
        const gp = proj(r.x0 + 1, y0 + 6, 0);
        c.strokeStyle = P.grass2; c.lineWidth = 1.2;
        c.beginPath(); c.moveTo(gp.x, gp.y); c.lineTo(gp.x + 1, gp.y - 3); c.stroke();
      }
    } else if (r.m === MAT.STONE) {
      for (let yy = Math.ceil(y0 / 13) * 13; yy < y1; yy += 13) {
        const l1 = proj(x0, yy, 0), l2 = proj(x1, yy, 0);
        c.strokeStyle = 'rgba(40,38,70,.14)'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(l1.x, l1.y); c.lineTo(l2.x, l2.y); c.stroke();
        if (((yy / 13) | 0) % 2 === 0) {
          const m1 = proj(x0 + 1, yy + 6, 0), m2 = proj(x1, yy + 6, 0);
          c.strokeStyle = 'rgba(40,38,70,.09)';
          c.beginPath(); c.moveTo(m1.x, m1.y); c.lineTo(m2.x, m2.y); c.stroke();
        }
      }
      if (r.top) {
        const g1 = proj(x0, y0, 0), g2 = proj(x1, y0, 0), g3 = proj(x1, y0 + 3.5, 0), g4 = proj(x0, y0 + 3.5, 0);
        quad(c, [g1, g2, g3, g4], 'rgba(255,255,255,.45)');
      }
    } else {
      // 벽돌
      for (let yy = Math.ceil(y0 / 11) * 11; yy < y1; yy += 11) {
        const l1 = proj(x0, yy, 0), l2 = proj(x1, yy, 0);
        c.strokeStyle = 'rgba(120,80,50,.35)'; c.lineWidth = 1.1;
        c.beginPath(); c.moveTo(l1.x, l1.y); c.lineTo(l2.x, l2.y); c.stroke();
      }
    }
    // 좌우 음영
    if (r.left) {
      const s1 = proj(x0, y0, 0), s2 = proj(x0, y1, 0);
      c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(s1.x, s1.y); c.lineTo(s2.x, s2.y); c.stroke();
    }
    if (r.right) {
      const s1 = proj(x1, y0, 0), s2 = proj(x1, y1, 0);
      c.strokeStyle = 'rgba(0,0,0,.22)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(s1.x, s1.y); c.lineTo(s2.x, s2.y); c.stroke();
    }
    c.restore();
  }
  terrainTimer = 0;
}

/* ============================================================
   6. 오브젝트 그리기
   ============================================================ */
function drawDeco() {
  const L = LEVELS[G.stage];
  const tm = G.t;
  for (const d of L.deco) {
    const base = proj(d.x, d.y, DEPTH * 0.42);
    const sc = base.s / (view.s || 1);
    ctx.save();
    ctx.translate(base.x, base.y);
    ctx.scale(sc * FIT.k * 1.0, sc * FIT.k * 1.0);
    // 그림자
    ctx.fillStyle = 'rgba(0,0,0,.16)';
    ctx.beginPath(); ctx.ellipse(0, 1, 7, 2.6, 0, 0, 6.3); ctx.fill();
    if (d.t === 'mush') {
      ctx.fillStyle = '#f7f2e6'; ctx.fillRect(-1.6, -8, 3.2, 8);
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
    } else if (d.t === 'cactus') {
      ctx.fillStyle = '#4f9d63';
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-3, -26, 6, 26, 3) : ctx.rect(-3, -26, 6, 26); ctx.fill();
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-10, -20, 8, 5, 2.5) : ctx.rect(-10, -20, 8, 5); ctx.fill();
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-10, -20, 5, 14, 2.5) : ctx.rect(-10, -20, 5, 14); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(-2, -24, 1.4, 20);
    } else if (d.t === 'torch') {
      ctx.fillStyle = '#6b5540'; ctx.fillRect(-1.6, -20, 3.2, 20);
      const fl = 1 + Math.sin(tm * 7 + d.x) * 0.15;
      const gg = ctx.createRadialGradient(0, -24, 1, 0, -24, 16 * fl);
      gg.addColorStop(0, 'rgba(255,235,150,.9)');
      gg.addColorStop(0.4, 'rgba(255,170,80,.45)');
      gg.addColorStop(1, 'rgba(255,150,60,0)');
      ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(0, -24, 16 * fl, 0, 6.3); ctx.fill();
      ctx.fillStyle = '#ffd27a';
      ctx.beginPath(); ctx.ellipse(0, -24, 3 * fl, 6 * fl, 0, 0, 6.3); ctx.fill();
    } else if (d.t === 'cloudtree') {
      ctx.fillStyle = '#a58363'; ctx.fillRect(-2, -16, 4, 16);
      const gg = ctx.createRadialGradient(0, -24, 2, 0, -24, 16);
      gg.addColorStop(0, 'rgba(200,255,225,.95)');
      gg.addColorStop(1, 'rgba(150,235,190,.6)');
      ctx.fillStyle = gg;
      ctx.beginPath(); ctx.arc(0, -26, 12, 0, 6.3); ctx.arc(-8, -20, 8, 0, 6.3); ctx.arc(8, -20, 8, 0, 6.3); ctx.fill();
    } else if (d.t === 'neon') {
      ctx.strokeStyle = 'rgba(110,240,255,.85)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -18); ctx.stroke();
      const gg = ctx.createRadialGradient(0, -22, 1, 0, -22, 12);
      gg.addColorStop(0, 'rgba(150,250,255,.9)');
      gg.addColorStop(1, 'rgba(80,180,255,0)');
      ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(0, -22, 12, 0, 6.3); ctx.fill();
      ctx.fillStyle = '#d8fbff'; ctx.beginPath(); ctx.arc(0, -22, 2.6, 0, 6.3); ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(150,160,190,.8)';
      ctx.beginPath(); ctx.ellipse(0, -2, 4.6, 3, 0.2, 0, 6.3); ctx.fill();
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
    const bob = Math.sin(tm * 2.4 + g.ph) * 3;
    const p = proj(g.x, g.y + bob, 0);
    const s = p.s * 1.0;
    // 바닥 그림자
    const sh = proj(g.x, g.y, 0);
    ctx.fillStyle = 'rgba(40,60,100,.18)';
    ctx.beginPath(); ctx.ellipse(sh.x, sh.y + 2, 8 * s, 2.6 * s, 0, 0, 6.3); ctx.fill();
    ctx.save();
    ctx.translate(p.x, p.y);
    const gl = ctx.createRadialGradient(0, 0, 1, 0, 0, 16 * s);
    gl.addColorStop(0, 'rgba(150,225,255,.55)');
    gl.addColorStop(1, 'rgba(150,225,255,0)');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, 0, 16 * s, 0, 6.3); ctx.fill();
    // 3D 다이아: 위/좌/우 면
    const top = { x: 0, y: -10 * s }, rt = { x: 7 * s, y: -2 * s }, bt = { x: 0, y: 9 * s }, lt = { x: -7 * s, y: -2 * s };
    const mid = { x: 0, y: -3 * s };
    quad(ctx, [top, rt, mid], '#9ee6ff');
    quad(ctx, [top, lt, mid], '#d8f7ff');
    quad(ctx, [rt, bt, mid], '#4fb6de');
    quad(ctx, [lt, bt, mid], '#79cdec');
    ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(top.x, top.y); ctx.lineTo(mid.x, mid.y); ctx.lineTo(bt.x, bt.y); ctx.stroke();
    // 반짝임
    const sp = 0.5 + 0.5 * Math.sin(tm * 3.4 + g.ph);
    ctx.globalAlpha = sp;
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(-9 * s, -12 * s); ctx.lineTo(-4 * s, -12 * s); ctx.moveTo(-6.5 * s, -14.5 * s); ctx.lineTo(-6.5 * s, -9.5 * s); ctx.stroke();
    ctx.restore();
  }
}

function drawSpawnDoor() {
  const L = LEVELS[G.stage];
  const p = proj(L.spawn.x, L.spawn.y, DEPTH * 0.18);
  const s = p.s;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(s, s);
  // 바닥 그림자
  ctx.fillStyle = 'rgba(20,20,40,.22)';
  ctx.beginPath(); ctx.ellipse(0, 0, 23, 7, 0, 0, 6.3); ctx.fill();
  // 3D 아치: 뒤쪽 테두리
  ctx.fillStyle = '#6d4f3f';
  ctx.beginPath(); ctx.moveTo(-21, 0); ctx.lineTo(-21, -26); ctx.quadraticCurveTo(0, -52, 21, -26); ctx.lineTo(21, 0); ctx.closePath(); ctx.fill();
  // 안쪽 어두운 굴
  const ig = ctx.createLinearGradient(0, -40, 0, 0);
  ig.addColorStop(0, '#2a1c28');
  ig.addColorStop(1, '#4a3547');
  ctx.fillStyle = ig;
  ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-14, -22); ctx.quadraticCurveTo(0, -42, 14, -22); ctx.lineTo(14, 0); ctx.closePath(); ctx.fill();
  // 앞쪽 테두리(밝은 돌)
  ctx.fillStyle = '#a3816a';
  ctx.beginPath(); ctx.moveTo(-23, 0); ctx.lineTo(-23, -27); ctx.quadraticCurveTo(0, -55, 23, -27); ctx.lineTo(23, 0);
  ctx.lineTo(17, 0); ctx.lineTo(17, -24); ctx.quadraticCurveTo(0, -47, -17, -24); ctx.lineTo(-17, 0); ctx.closePath(); ctx.fill();
  // 이끼
  ctx.fillStyle = THEMES[L.theme].grass;
  ctx.beginPath(); ctx.ellipse(-15, -40, 7, 3, -0.3, 0, 6.3); ctx.fill();
  ctx.beginPath(); ctx.ellipse(16, -36, 6, 2.6, 0.2, 0, 6.3); ctx.fill();
  ctx.restore();
}

function drawExitDoor() {
  const L = LEVELS[G.stage];
  const tm = G.t;
  const p = proj(L.exit.x, L.exit.y, DEPTH * 0.18);
  const s = p.s;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(s, s);
  // 빛무리
  const glow = ctx.createRadialGradient(0, -22, 3, 0, -22, 52);
  glow.addColorStop(0, 'rgba(170,255,205,.5)');
  glow.addColorStop(1, 'rgba(170,255,205,0)');
  ctx.fillStyle = glow; ctx.fillRect(-56, -78, 112, 84);
  // 바닥 그림자
  ctx.fillStyle = 'rgba(20,30,30,.2)';
  ctx.beginPath(); ctx.ellipse(0, 1, 25, 7.5, 0, 0, 6.3); ctx.fill();
  // 3D 아치 뒤판
  ctx.fillStyle = '#4f7a3e';
  ctx.beginPath(); ctx.moveTo(-22, 0); ctx.lineTo(-22, -26); ctx.quadraticCurveTo(0, -52, 22, -26); ctx.lineTo(22, 0); ctx.closePath(); ctx.fill();
  // 문 안쪽 빛(뒤로 들어가는 원근)
  const ig = ctx.createLinearGradient(0, -44, 0, 0);
  ig.addColorStop(0, '#f2fff4');
  ig.addColorStop(0.5, '#a8f5c0');
  ig.addColorStop(1, '#4fc880');
  ctx.fillStyle = ig;
  ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-14, -22); ctx.quadraticCurveTo(0, -44, 14, -22); ctx.lineTo(14, 0); ctx.closePath(); ctx.fill();
  // 빛줄기
  ctx.save();
  ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-14, -22); ctx.quadraticCurveTo(0, -44, 14, -22); ctx.lineTo(14, 0); ctx.closePath(); ctx.clip();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 3; i++) {
    const ox = Math.sin(tm * 1.6 + i * 2) * 8;
    ctx.fillRect(-16 + ox + i * 11, -46, 3, 48);
  }
  ctx.restore();
  // 앞 테두리
  ctx.strokeStyle = '#8fd06a'; ctx.lineWidth = 3.4;
  ctx.beginPath(); ctx.moveTo(-20, 0); ctx.lineTo(-20, -25); ctx.quadraticCurveTo(0, -49, 20, -25); ctx.lineTo(20, 0); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(-18, -24); ctx.quadraticCurveTo(0, -46, 18, -24); ctx.lineTo(18, 0); ctx.stroke();
  // 화살표
  ctx.fillStyle = 'rgba(255,255,255,.9)';
  ctx.beginPath(); ctx.moveTo(-5, -16); ctx.lineTo(5, -8); ctx.lineTo(-5, 0); ctx.closePath(); ctx.fill();
  // 간판
  ctx.fillStyle = '#f0c98a';
  ctx.beginPath(); (ctx.roundRect ? ctx.roundRect(-23, -64, 46, 14, 4) : ctx.rect(-23, -64, 46, 14)); ctx.fill();
  ctx.strokeStyle = '#c79a5c'; ctx.lineWidth = 1.6; ctx.stroke();
  ctx.fillStyle = '#3f6a2e';
  ctx.font = '800 9px system-ui, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('EXIT', 0, -57);
  ctx.restore();
}

function drawBricks() {
  if (!G) return;
  for (const b of G.bricks) {
    const x0 = b.x, x1 = b.x + b.w, y0 = b.y, y1 = b.y + b.h;
    // 윗면
    quad(ctx, [proj(x0, y0, 0), proj(x1, y0, 0), proj(x1, y0, DEPTH), proj(x0, y0, DEPTH)], '#d8a97e');
    // 옆면
    quad(ctx, [proj(x1, y0, 0), proj(x1, y0, DEPTH), proj(x1, y1, DEPTH), proj(x1, y1, 0)], '#a06f45');
    // 정면
    quad(ctx, [proj(x0, y0, 0), proj(x1, y0, 0), proj(x1, y1, 0), proj(x0, y1, 0)], '#c08a5c');
    const m1 = proj(x0 + b.w * 0.5, y0 + 1, 0), m2 = proj(x0 + b.w * 0.5, y1 - 1, 0);
    ctx.strokeStyle = 'rgba(140,96,60,.5)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(m1.x, m1.y); ctx.lineTo(m2.x, m2.y); ctx.stroke();
  }
}

const IMG = {};
function loadSprites(cb) {
  const list = {
    run: 'assets/star-run.png', pick: 'assets/star-pick.png', stop: 'assets/star-stop.png',
    cheer: 'assets/star-cheer.png', oops: 'assets/star-oops.png'
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
  else if (lem.state === 'fall') { src = IMG.oops; }
  else if (lem.state === 'dig' || lem.state === 'mine') { src = IMG.pick; h = LEM_H + 2; bob = Math.sin(tm * 18) * 1.1; }
  else if (lem.state === 'walk') { bob = Math.abs(Math.sin(tm * 9)) * -1.6; }

  const p = proj(lem.x, lem.y, 0);
  const sq = 1 - lem.squash * 0.22;
  const w = h * (src.width && src.height ? src.width / src.height : 0.5);
  const scl = p.s;
  ctx.save();
  ctx.globalAlpha = alpha;
  // 3D 접지 그림자
  ctx.fillStyle = 'rgba(30,30,60,.2)';
  ctx.beginPath();
  ctx.ellipse(p.x + 1.5, p.y + 1, 8 * scl, 3 * scl, 0, 0, 6.3);
  ctx.fill();
  ctx.translate(p.x, p.y + bob * scl);
  ctx.scale(scl, scl);
  if (lem.pulse > 0) {
    ctx.save();
    ctx.globalAlpha = lem.pulse * 0.7;
    ctx.strokeStyle = '#ffe07a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, -h / 2, h * 0.55 + (1 - lem.pulse) * 10, 0, 6.3); ctx.stroke();
    ctx.restore();
  }
  ctx.scale(lem.dir < 0 ? -1 : 1, sq);
  if (src.complete && src.naturalWidth) {
    ctx.drawImage(src, -w / 2, -h, w, h);
  } else {
    ctx.fillStyle = '#7ab7f0';
    ctx.beginPath(); (ctx.roundRect ? ctx.roundRect(-5, -h, 10, h, 4) : ctx.rect(-5, -h, 10, h)); ctx.fill();
  }
  ctx.restore();
}

function drawParticles() {
  if (!G) return;
  for (const p of G.particles) {
    const q = proj(p.x, p.y, 0);
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
    ctx.fillStyle = p.c;
    ctx.beginPath();
    ctx.arc(q.x, q.y, p.r * q.s, 0, 6.3);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const t of G.texts) {
    const q = proj(t.x, t.y, 0);
    ctx.globalAlpha = Math.max(0, Math.min(1, t.life));
    ctx.font = '800 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3.4;
    ctx.strokeStyle = 'rgba(255,255,255,.9)';
    ctx.strokeText(t.txt, q.x, q.y);
    ctx.fillStyle = t.color;
    ctx.fillText(t.txt, q.x, q.y);
  }
  ctx.globalAlpha = 1;
}

function render() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, cv.width, cv.height);
  if (!G) return;

  // 배경
  ctx.fillStyle = pal().sky[0];
  ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.drawImage(bgcv, 0, 0);
  applyWorld(ctx);
  drawBgFx();

  // 지형+물
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(tcv, 0, 0);
  applyWorld(ctx);

  // 오브젝트 (뒤 → 앞)
  drawDeco();
  drawGems();
  drawSpawnDoor();
  drawExitDoor();
  drawBricks();
  const sorted = G.lems.slice().sort((a, b) => a.y - b.y);
  for (const lem of sorted) drawLem(lem);
  drawParticles();

  // 비네트 — 캔버스 전체(레터박스 포함)에 부드럽게
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const dcx = (view.ox + W / 2 * view.s) * view.dpr;
  const dcy = (view.oy + H * 0.56 * view.s) * view.dpr;
  const dr = H * 1.08 * view.s * view.dpr;
  const vg = ctx.createRadialGradient(dcx, dcy, dr * 0.34, dcx, dcy, dr);
  vg.addColorStop(0, 'rgba(30,26,60,0)');
  vg.addColorStop(1, 'rgba(30,26,60,.20)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, cv.width, cv.height);
}

/* ============================================================
   7. 입력
   ============================================================ */
function pickLem(sx, sy) {
  let bestLem = null, bestD = TAP_R;
  for (const lem of G.lems) {
    if (lem.state === 'saved' || lem.state === 'lost') continue;
    const p = proj(lem.x, lem.y - LEM_H * 0.5, 0);
    const d = Math.hypot(p.x - sx, p.y - sy);
    if (d < bestD) { bestD = d; bestLem = lem; }
  }
  return bestLem;
}

function canvasPoint(ev) {
  const r = cv.getBoundingClientRect();
  const cx = ev.clientX - r.left, cy = ev.clientY - r.top;
  return { x: (cx - view.ox) / view.s, y: (cy - view.oy) / view.s };
}

function onPointer(ev) {
  if (!G || G.mode !== 'play') return;
  ev.preventDefault();
  const p = canvasPoint(ev);
  const lem = pickLem(p.x, p.y);
  if (!lem) {
    if (G.selected) showToast('꼬마를 톡!');
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
  if (!m) Sound.startBgm();
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
const API = {
  snap() {
    const L = LEVELS[G ? G.stage : 0];
    return {
      mode: G ? G.mode : null, stage: G ? G.stage : null, theme: LEVELS[G ? G.stage : 0].theme,
      saved: G ? G.saved : 0, lost: G ? G.lost : 0, need: L.need, total: L.total,
      time: G ? Math.round(G.time * 10) / 10 : 0,
      gems: G ? G.gemsTaken : 0, score: G ? G.score : 0,
      tools: G ? Object.assign({}, G.tools) : {}, selected: G ? G.selected : null,
      spawned: G ? G.spawned : 0, waiting: G ? G.spawnLeft : 0,
      speed: G ? G.speed : 1,
      lems: G ? G.lems.map((l) => ({ x: Math.round(l.x * 10) / 10, y: Math.round(l.y * 10) / 10, s: l.state, dir: l.dir })) : []
    };
  },
  project(x, y) {
    const r = cv.getBoundingClientRect();
    const p = proj(x, y, 0);
    return { x: r.left + view.ox + p.x * view.s, y: r.top + view.oy + p.y * view.s };
  },
  bricks() { return G ? G.bricks.map((b) => [Math.round(b.x), Math.round(b.y), b.w]) : []; },
  stage(i) { startLevel(i); },
  select(t) { selectTool(t); },
  reset() { startLevel(G.stage); },
  rms() { return Sound.rms(); },
  audio() { return Sound.state(); },
  trackName() { return Sound.trackName(); },
  trackCount() { return Sound.trackCount(); },
  themeKey() { return THEMES[LEVELS[G.stage].theme].key; },
  camera() { return { yaw: CAM.yaw, pitch: CAM.pitch, depth: DEPTH, k: FIT.k }; }
};
window.__starlight = API;
window.__woojin = API;
})();
