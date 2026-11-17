/* ══════════════════════════════════════════════════════════════
   도레미 별빛 피아노 · 우진이
   구름 위 피아노 계단 어드벤처 — 오리지널 코드 (외부 음원 0건)
   음악: 저작권 만료 클래식(작은별·환희의 송가·엘리제를 위하여·캐논)을
        Web Audio 피아노 신스로 직접 합성
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var TAU = Math.PI * 2;
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function fmt(n) { try { return n.toLocaleString('ko-KR'); } catch (e) { return String(n); } }

  /* ══════ 곡 데이터 — 퍼블릭 도메인 클래식 직접 채보 ══════ */
  var SONGS = {
    twinkle: {
      name: '작은별', emoji: '⭐', bpm: 100,
      melody: [
        60, 1, 60, 1, 67, 1, 67, 1, 69, 1, 69, 1, 67, 2,
        65, 1, 65, 1, 64, 1, 64, 1, 62, 1, 62, 1, 60, 2,
        67, 1, 67, 1, 65, 1, 65, 1, 64, 1, 64, 1, 62, 2,
        67, 1, 67, 1, 65, 1, 65, 1, 64, 1, 64, 1, 62, 2,
        60, 1, 60, 1, 67, 1, 67, 1, 69, 1, 69, 1, 67, 2,
        65, 1, 65, 1, 64, 1, 64, 1, 62, 1, 62, 1, 60, 2
      ]
    },
    joy: {
      name: '환희의 송가', emoji: '🌅', bpm: 104,
      melody: [
        64, 1, 64, 1, 65, 1, 67, 1, 67, 1, 65, 1, 64, 1, 62, 1,
        60, 1, 60, 1, 62, 1, 64, 1, 64, 1.5, 62, 0.5, 62, 2,
        64, 1, 64, 1, 65, 1, 67, 1, 67, 1, 65, 1, 64, 1, 62, 1,
        60, 1, 60, 1, 62, 1, 64, 1, 62, 1.5, 60, 0.5, 60, 2,
        62, 1, 62, 1, 64, 1, 60, 1, 62, 1, 64, 0.5, 65, 0.5, 64, 1, 60, 1,
        62, 1, 64, 0.5, 65, 0.5, 64, 1, 62, 1, 60, 1, 62, 1, 55, 2,
        64, 1, 64, 1, 65, 1, 67, 1, 67, 1, 65, 1, 64, 1, 62, 1,
        60, 1, 60, 1, 62, 1, 64, 1, 62, 1.5, 60, 0.5, 60, 2
      ]
    },
    elise: {
      name: '엘리제를 위하여', emoji: '🌙', bpm: 92,
      melody: [
        76, 0.5, 75, 0.5, 76, 0.5, 75, 0.5, 76, 0.5, 71, 0.5, 74, 0.5, 72, 0.5, 69, 1.5,
        60, 0.5, 64, 0.5, 69, 0.5, 71, 1,
        64, 0.5, 68, 0.5, 71, 0.5, 72, 1,
        76, 0.5, 75, 0.5, 76, 0.5, 75, 0.5, 76, 0.5, 71, 0.5, 74, 0.5, 72, 0.5, 69, 1.5,
        60, 0.5, 64, 0.5, 69, 0.5, 71, 1,
        64, 0.5, 72, 0.5, 71, 1, 69, 2
      ]
    },
    canon: {
      name: '캐논', emoji: '🌈', bpm: 96,
      melody: [
        78, 1, 76, 1, 74, 1, 73, 1,
        71, 1, 69, 1, 71, 1, 73, 1,
        74, 1, 73, 1, 71, 1, 69, 1,
        67, 1, 66, 1, 67, 1, 64, 1,
        71, 1, 69, 1, 67, 1, 66, 1,
        64, 1, 62, 1, 64, 1, 66, 1,
        67, 1, 66, 1, 67, 1, 69, 1,
        71, 1, 73, 1, 74, 1, 76, 1
      ]
    }
  };

  var SONG_ORDER = ['twinkle', 'joy', 'elise', 'canon'];

  /* ══════ 곡 확장 — 전부 저작권 만료(퍼블릭 도메인) 원곡, 외부 음원 0건 ══════ */
  SONGS.twinkle.stars = 1;
  SONGS.joy.stars = 1;
  SONGS.elise.stars = 2;
  SONGS.canon.stars = 3;

  SONGS.mary = {
    name: '메리의 양', emoji: '🐑', bpm: 112, stars: 1,
    melody: [
      64, 1, 62, 1, 60, 1, 62, 1, 64, 1, 64, 1, 64, 2,
      62, 1, 62, 1, 62, 2, 64, 1, 67, 1, 67, 2,
      64, 1, 62, 1, 60, 1, 62, 1, 64, 1, 64, 1, 64, 1, 64, 1,
      62, 1, 62, 1, 64, 1, 62, 1, 60, 3
    ]
  };

  SONGS.butterfly = {
    name: '나비야', emoji: '🦋', bpm: 108, stars: 1,
    melody: [
      67, 1, 64, 1, 64, 2, 65, 1, 62, 1, 62, 2,
      60, 1, 62, 1, 64, 1, 65, 1, 67, 1, 67, 1, 67, 2,
      67, 1, 64, 1, 64, 2, 65, 1, 62, 1, 62, 2,
      60, 1, 64, 1, 67, 1, 67, 1, 60, 3
    ]
  };

  SONGS.macdonald = {
    name: '농장 노래', emoji: '🐄', bpm: 116, stars: 1,
    melody: [
      67, 1, 67, 1, 67, 1, 62, 1, 64, 1, 64, 1, 62, 2,
      71, 1, 71, 1, 69, 1, 69, 1, 67, 3,
      62, 1, 67, 1, 67, 1, 67, 1, 62, 1, 64, 1, 64, 1, 62, 1,
      71, 1, 71, 1, 69, 1, 69, 1, 67, 3
    ]
  };

  SONGS.london = {
    name: '런던 다리', emoji: '🌉', bpm: 112, stars: 1,
    melody: [
      67, 1, 69, 1, 67, 1, 65, 1, 64, 1, 65, 1, 67, 2,
      62, 1, 64, 1, 65, 2, 64, 1, 65, 1, 67, 2,
      67, 1, 69, 1, 67, 1, 65, 1, 64, 1, 65, 1, 67, 2,
      62, 1, 67, 1, 64, 1, 60, 3
    ]
  };

  SONGS.lullaby = {
    name: '자장가', emoji: '🌙', bpm: 86, stars: 2,
    melody: [
      64, 1, 64, 1, 67, 2, 64, 1, 64, 1, 67, 2,
      64, 1, 67, 1, 72, 1, 71, 1, 69, 1, 69, 1, 67, 2,
      62, 1, 64, 1, 65, 2, 62, 1, 62, 1, 64, 1, 65, 2,
      62, 1, 65, 1, 71, 1, 69, 1, 67, 3
    ]
  };

  SONGS.jingle = {
    name: '징글벨', emoji: '🔔', bpm: 118, stars: 2,
    melody: [
      64, 1, 64, 1, 64, 2, 64, 1, 64, 1, 64, 2,
      64, 1, 67, 1, 60, 1, 62, 1, 64, 4,
      65, 1, 65, 1, 65, 1, 65, 1, 65, 1, 64, 1, 64, 1, 64, 1,
      64, 1, 62, 1, 62, 1, 64, 2, 62, 2, 67, 2
    ]
  };

  SONGS.birthday = {
    name: '생일 축하', emoji: '🎂', bpm: 118, stars: 2,
    melody: [
      67, 0.5, 67, 0.5, 69, 1, 67, 1, 72, 1, 71, 2,
      67, 0.5, 67, 0.5, 69, 1, 67, 1, 74, 1, 72, 2,
      67, 0.5, 67, 0.5, 79, 1, 76, 1, 72, 1, 71, 1, 69, 2,
      65, 0.5, 65, 0.5, 64, 1, 72, 1, 74, 1, 72, 3
    ]
  };

  SONGS.minuet = {
    name: '미뉴에트', emoji: '🎻', bpm: 104, stars: 3,
    melody: [
      74, 1, 67, 1, 69, 1, 71, 1, 72, 1, 74, 1, 67, 2,
      76, 1, 72, 1, 74, 1, 76, 1, 78, 1, 79, 1, 79, 2,
      78, 1, 76, 1, 74, 1, 79, 1, 78, 1, 76, 1,
      74, 1, 76, 1, 78, 1, 74, 3
    ]
  };

  SONG_ORDER = ['twinkle', 'joy', 'mary', 'butterfly', 'macdonald', 'london',
                'lullaby', 'jingle', 'birthday', 'elise', 'minuet', 'canon'];

  /* ══════ 스테이지 (프로 티어) ══════ */
  var STAGES = [
    { name: '첫 걸음', emoji: '🌱' },
    { name: '구름 길', emoji: '☁️' },
    { name: '무지개', emoji: '🌈' },
    { name: '프로', emoji: '👑' },
    { name: '전설', emoji: '⭐' }
  ];


  var LANE_COLORS = [
    { main: '#4d8dff', light: '#dbe9ff', dark: '#1f4fc4' },
    { main: '#a86bff', light: '#ead9ff', dark: '#6a2fc0' },
    { main: '#ff6fbe', light: '#ffe0f1', dark: '#c02f7f' },
    { main: '#ffcf4d', light: '#fff4cc', dark: '#b88100' }
  ];
  var LANE_LABELS = { 3: ['도', '미', '솔'], 4: ['도', '미', '솔', '도'] };

  /* ══════ 캔버스 / 레이아웃 ══════ */
  var cv = document.getElementById('stage');
  var ctx = cv.getContext('2d');
  var W = 0, H = 0, dpr = 1;
  var bg = document.createElement('canvas');
  var bgx = bg.getContext('2d');

  var L = {
    cx: 0, gateY: 0, nearY: 0, farHalf: 34, nearHalf: 180,
    laneRatio: [0, 0, 0, 0], laneX: [0, 0, 0, 0],
    keysTop: 0, fieldLeft: 0, fieldRight: 0
  };

  var appEl = document.getElementById('app');
  var keysEl = document.getElementById('keys');
  var hudScoreEl = document.getElementById('hudScore');
  var heartsEl = document.getElementById('hearts');
  var comboBoxEl = document.getElementById('comboBox');
  var comboNumEl = document.getElementById('comboNum');
  var judgeEl = document.getElementById('judge');
  var scoreNumEl = document.getElementById('scoreNum');
  var progWrapEl = document.getElementById('progWrap');
  var progFillEl = document.getElementById('progFill');
  var progIcoEl = document.getElementById('progIco');
  var songTagEl = document.getElementById('songTag');
  var accNumEl = document.getElementById('accNum');
  var nextRowEl = document.getElementById('nextRow');
  var pathRowEl = document.getElementById('pathRow');
  var pathBarEl = document.getElementById('pathBar');
  var stageTagEl = document.getElementById('stageTag');
  var lapFillEl = document.getElementById('lapFill');
  var bannerEl = document.getElementById('banner');
  var startScreen = document.getElementById('startScreen');
  var overScreen = document.getElementById('overScreen');
  var pauseScreen = document.getElementById('pauseScreen');

  /* ══════ 오디오: Web Audio 피아노 신스 ══════ */
  var actx = null, master = null, noiseBuf = null, muted = false;
  try { muted = localStorage.getItem('woojin_piano_mute') === '1'; } catch (e) { }

  function audioInit() {
    if (actx) {
      if (actx.state === 'suspended') { try { actx.resume(); } catch (e) { } }
      return;
    }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { actx = new AC(); } catch (e) { actx = null; return; }
    var comp = actx.createDynamicsCompressor();
    comp.threshold.value = -15; comp.knee.value = 22; comp.ratio.value = 3.2;
    comp.attack.value = 0.004; comp.release.value = 0.24;
    master = actx.createGain();
    master.gain.value = muted ? 0 : 0.82;
    master.connect(comp);
    comp.connect(actx.destination);
    var len = Math.floor(actx.sampleRate * 0.05);
    noiseBuf = actx.createBuffer(1, len, actx.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  }

  var PARTIALS = [
    [1, 1.0, 1.00, 'triangle'],
    [2.001, 0.40, 0.74, 'sine'],
    [3.002, 0.22, 0.52, 'sine'],
    [4.003, 0.13, 0.38, 'sine'],
    [5.004, 0.075, 0.28, 'sine'],
    [6.005, 0.045, 0.21, 'sine'],
    [7.008, 0.028, 0.16, 'sine']
  ];

  function playPiano(midi, vel) {
    if (!actx || muted) return;
    vel = vel === undefined ? 0.9 : vel;
    var t0 = actx.currentTime + 0.002;
    var f = 440 * Math.pow(2, (midi - 69) / 12);
    var dur = clamp(2.5 - (midi - 55) * 0.03, 0.8, 2.6);
    var out = actx.createGain();
    var filt = actx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = Math.min(11500, 1800 + f * 3.4);
    filt.Q.value = 0.44;
    out.gain.setValueAtTime(0.0001, t0);
    out.gain.linearRampToValueAtTime(0.46 * vel, t0 + 0.006);
    out.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    filt.connect(out);
    out.connect(master);

    for (var i = 0; i < PARTIALS.length; i++) {
      var p = PARTIALS[i];
      var g = actx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(p[1] * 0.36 * vel, t0 + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + Math.max(0.16, dur * p[2]));
      var o = actx.createOscillator();
      o.type = p[3];
      o.frequency.value = f * p[0];
      o.detune.value = (i % 2 ? 4 : -3) + (Math.random() * 4 - 2);
      o.connect(g);
      g.connect(filt);
      o.start(t0);
      o.stop(t0 + dur + 0.06);
    }
    // 해머 어택
    if (noiseBuf) {
      var nsrc = actx.createBufferSource();
      nsrc.buffer = noiseBuf;
      var nf = actx.createBiquadFilter();
      nf.type = 'bandpass';
      nf.frequency.value = 1400 + f * 1.6;
      nf.Q.value = 0.9;
      var ng = actx.createGain();
      ng.gain.setValueAtTime(0.055 * vel, t0);
      ng.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.045);
      nsrc.connect(nf); nf.connect(ng); ng.connect(master);
      nsrc.start(t0);
    }
  }

  function playSparkle(baseMidi) {
    if (!actx || muted) return;
    var seq = [0, 4, 7, 12];
    for (var i = 0; i < seq.length; i++) {
      (function (i) {
        var t0 = actx.currentTime + 0.002 + i * 0.055;
        var f = 440 * Math.pow(2, (baseMidi + seq[i] - 69) / 12);
        var o = actx.createOscillator();
        var g = actx.createGain();
        o.type = 'sine'; o.frequency.value = f * 2;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.linearRampToValueAtTime(0.12, t0 + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5);
        o.connect(g); g.connect(master);
        o.start(t0); o.stop(t0 + 0.55);
      })(i);
    }
  }

  function playThud() {
    if (!actx || muted) return;
    var t0 = actx.currentTime + 0.002;
    var o = actx.createOscillator();
    var g = actx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(240, t0);
    o.frequency.exponentialRampToValueAtTime(120, t0 + 0.16);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(0.16, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + 0.2);
  }

  /* ══════ 이미지 — 동화풍 4포즈 (배경 투명 PNG) ══════ */
  var SPRITE_DEF = {
    run:   { src: 'assets/woojin-run.png',   ax: 0.50 },
    cheer: { src: 'assets/woojin-cheer.png', ax: 0.50 },
    play:  { src: 'assets/woojin-play.png',  ax: 0.335 },
    oops:  { src: 'assets/woojin-oops.png',  ax: 0.50 }
  };
  var spriteSet = {};
  (function () {
    for (var key in SPRITE_DEF) {
      if (!Object.prototype.hasOwnProperty.call(SPRITE_DEF, key)) continue;
      (function (k) {
        var im = new Image();
        var rec = { img: im, ready: false, ax: SPRITE_DEF[k].ax, ar: 0.46 };
        im.onload = function () {
          rec.ready = true;
          if (im.naturalWidth && im.naturalHeight) rec.ar = im.naturalWidth / im.naturalHeight;
        };
        im.src = SPRITE_DEF[k].src;
        spriteSet[k] = rec;
      })(key);
    }
  })();
  var sprite = null, spriteReady = false;

  /* ══════ 게임 상태 ══════ */
  var state = {
    mode: 'menu',          // menu | playing | paused | over
    song: 'twinkle',
    lanes: 4,
    laneMeta: null,
    score: 0, best: 0,
    combo: 0, maxCombo: 0,
    judged: 0, perfect: 0,
    lives: 3,
    fever: false,
    lap: 0,
    lapHits: 0, lapTotal: 1,
    climb: 0,              // 0..1 (계단 오르기)
    climbShown: 0,
    songTime: 0,
    bpm: 100,
    loops: [],
    notes: [],
    chartEnd: 0,
    lastWrong: -9,
    shake: 0,
    flash: 0,
    stepFlash: [],
    wings: [],
    cheer: 0,
    beatPulse: 0,
    feverGlow: 0,
    startedAt: 0,
    pausedAccum: 0,
    charLane: 1.5,         // 몸이 서 있는 계단 레인(실수)
    charTarget: 1.5,
    hop: 0,                // 계단 오르기 점프
    playT: 0,              // 건반 연주 포즈 남은 시간
    cheerT: 0,             // 환호 포즈
    oopsT: 0,              // 아차 포즈
    stage: 1,
    pathLanes: []          // 다음 계단 길
  };
  try { state.best = parseInt(localStorage.getItem('woojin_piano_best') || '0', 10) || 0; } catch (e) { }

  /* ══════ 레인 매핑 ══════ */
  function buildLaneMeta(songId, lanes) {
    var mel = SONGS[songId].melody;
    var set = {}, uniq = [];
    for (var i = 0; i < mel.length; i += 2) {
      var m = mel[i];
      if (!set[m]) { set[m] = 1; uniq.push(m); }
    }
    uniq.sort(function (a, b) { return a - b; });
    var map = {}, groups = [], k;
    for (k = 0; k < lanes; k++) groups.push([]);
    for (var j = 0; j < uniq.length; j++) {
      var lane = Math.min(lanes - 1, Math.floor(j * lanes / uniq.length));
      map[uniq[j]] = lane;
      groups[lane].push(uniq[j]);
    }
    var bases = [];
    for (k = 0; k < lanes; k++) {
      var g = groups[k];
      bases.push(g.length ? g[Math.floor(g.length / 2)] : (55 + k * 4));
    }
    return { map: map, bases: bases, uniq: uniq };
  }

  /* ══════ 차트 생성 (무한 루프 · 점점 빨라짐) ══════ */
  function generateLoop() {
    var s = state, song = SONGS[s.song], meta = s.laneMeta;
    if (!meta) return;
    var beat = 60 / s.bpm;
    var prev = s.loops.length ? s.loops[s.loops.length - 1] : null;
    var startT = prev ? prev.end + beat * 2 : 0.7;
    var acc = 0, total = 0;
    var mel = song.melody;
    for (var i = 0; i < mel.length; i += 2) {
      var midi = mel[i], beats = mel[i + 1];
      s.notes.push({
        t: startT + acc * beat,
        lane: meta.map[midi],
        midi: midi,
        st: 0,           // 0 wait, 1 hit, 2 miss
        lap: s.loops.length,
        hitT: 0, q: '', pop: 0, glow: 0
      });
      acc += beats;
      total++;
    }
    var end = startT + acc * beat;
    s.loops.push({ start: startT, end: end, total: total, beat: beat, bpm: s.bpm });
    s.bpm = Math.min(188, Math.round(s.bpm * 1.07));
    s.chartEnd = end;
  }

  function approachFor(lap) {
    return Math.max(0.98, 1.85 * Math.pow(0.958, lap || 0));
  }

  /* ══════ 레이아웃 ══════ */
  function measure() {
    var hudBottom = hudScoreEl.getBoundingClientRect().bottom;
    var keysRect = keysEl.getBoundingClientRect();
    L.keysTop = keysRect.top;
    L.fieldLeft = keysRect.left;
    L.fieldRight = keysRect.right;
    L.cx = (keysRect.left + keysRect.right) / 2;
    L.nearHalf = (keysRect.width - 20) / 2;
    L.farHalf = Math.max(26, L.nearHalf * 0.19);
    L.gateY = Math.max(hudBottom + 62, H * 0.205);
    L.nearY = keysRect.top - 24;

    var kids = keysEl.children;
    var n = kids.length || state.lanes;
    for (var i = 0; i < 4; i++) {
      if (i < n && kids[i]) {
        var r = kids[i].getBoundingClientRect();
        var c = (r.left + r.right) / 2;
        L.laneX[i] = c;
        L.laneRatio[i] = clamp((c - L.cx) / L.nearHalf, -1, 1);
      } else {
        L.laneX[i] = L.cx;
        L.laneRatio[i] = 0;
      }
    }
  }

  function resize() {
    dpr = Math.min(2.5, window.devicePixelRatio || 1);
    W = appEl.clientWidth || window.innerWidth;
    H = appEl.clientHeight || window.innerHeight;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    cv.style.width = W + 'px';
    cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    measure();
    renderBackground();
  }

  /* ══════ 원근 ══════ */
  function persp(d) {
    d = clamp(d, 0, 1.25);
    var e = Math.pow(clamp(d, 0, 1), 0.74);
    var y = L.gateY + (L.nearY - L.gateY) * e;
    var half = L.farHalf + (L.nearHalf - L.farHalf) * Math.pow(clamp(d, 0, 1), 0.88);
    var sc = 0.15 + 0.85 * Math.pow(clamp(d, 0, 1), 1.15);
    return { y: y, half: half, s: sc };
  }
  function notePos(n, now) {
    var ap = approachFor(n.lap);
    var d = 1 - (n.t - now) / ap;
    var p = persp(d);
    var x = L.cx + (L.laneRatio[n.lane] || 0) * p.half;
    return { x: x, y: p.y, s: p.s, d: d };
  }

  /* ══════ 배경 (정적: 오프스크린 캐시) ══════ */
  function rr(c, x, y, w, h, r) {
    r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  function drawCloud(c, x, y, sc, a, warm) {
    c.save();
    c.globalAlpha = a;
    var g = c.createLinearGradient(0, y - 52 * sc, 0, y + 26 * sc);
    if (warm) {
      g.addColorStop(0, '#fffaf3');
      g.addColorStop(0.5, '#f7ecf8');
      g.addColorStop(1, '#d3bde9');
    } else {
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.55, '#eef1ff');
      g.addColorStop(1, '#c6b9e6');
    }
    c.fillStyle = g;
    var blobs = [[-40, 4, 26], [-14, -10, 34], [16, -4, 30], [42, 6, 22], [0, 12, 30]];
    for (var i = 0; i < blobs.length; i++) {
      c.beginPath();
      c.arc(x + blobs[i][0] * sc, y + blobs[i][1] * sc, blobs[i][2] * sc, 0, TAU);
      c.fill();
    }
    c.restore();
  }

  function drawCastle(c, x, y, w, flip) {
    var s = w / 120;
    c.save();
    c.translate(x, y);
    if (flip) c.scale(-1, 1);

    // 섬 바닥
    var ig = c.createLinearGradient(0, 10 * s, 0, 54 * s);
    ig.addColorStop(0, '#e9f6ff');
    ig.addColorStop(0.45, '#cfe6f7');
    ig.addColorStop(1, '#a7c9e3');
    c.fillStyle = ig;
    c.beginPath();
    c.moveTo(-52 * s, 6 * s);
    c.quadraticCurveTo(-40 * s, 48 * s, 0, 60 * s);
    c.quadraticCurveTo(40 * s, 48 * s, 52 * s, 6 * s);
    c.closePath();
    c.fill();
    // 잔디
    c.fillStyle = '#c9f0d8';
    c.beginPath();
    c.ellipse(0, 6 * s, 52 * s, 12 * s, 0, 0, TAU);
    c.fill();
    c.fillStyle = '#eafbf0';
    c.beginPath();
    c.ellipse(0, 4 * s, 47 * s, 9 * s, 0, 0, TAU);
    c.fill();

    // 성 본체
    function tower(tx, tw, th, roof, roofH) {
      var bg2 = c.createLinearGradient(tx - tw / 2, 0, tx + tw / 2, 0);
      bg2.addColorStop(0, '#ffffff');
      bg2.addColorStop(0.55, '#f4fbff');
      bg2.addColorStop(1, '#d7ecfb');
      c.fillStyle = bg2;
      c.fillRect(tx - tw / 2, 4 * s - th, tw, th);
      // 지붕
      c.fillStyle = roof;
      c.beginPath();
      c.moveTo(tx - tw * 0.72, 4 * s - th);
      c.lineTo(tx, 4 * s - th - roofH);
      c.lineTo(tx + tw * 0.72, 4 * s - th);
      c.closePath();
      c.fill();
      // 창
      c.fillStyle = 'rgba(255, 226, 150, .95)';
      c.beginPath();
      c.arc(tx, 4 * s - th * 0.55, tw * 0.17, 0, TAU);
      c.fill();
      // 깃발
      c.strokeStyle = '#b98f4d';
      c.lineWidth = 1.4 * s;
      c.beginPath();
      c.moveTo(tx, 4 * s - th - roofH);
      c.lineTo(tx, 4 * s - th - roofH - 9 * s);
      c.stroke();
      c.fillStyle = '#ff8fb8';
      c.beginPath();
      c.moveTo(tx, 4 * s - th - roofH - 9 * s);
      c.lineTo(tx + 9 * s, 4 * s - th - roofH - 6.5 * s);
      c.lineTo(tx, 4 * s - th - roofH - 4 * s);
      c.closePath();
      c.fill();
    }

    tower(-26 * s, 20 * s, 34 * s, '#8fb8ea', 18 * s);
    tower(26 * s, 18 * s, 28 * s, '#f0a6c4', 15 * s);
    tower(0, 26 * s, 48 * s, '#7fd8ff', 24 * s);

    // 성문
    c.fillStyle = '#b98f4d';
    c.beginPath();
    c.moveTo(-6 * s, 4 * s);
    c.lineTo(-6 * s, -8 * s);
    c.quadraticCurveTo(0, -14 * s, 6 * s, -8 * s);
    c.lineTo(6 * s, 4 * s);
    c.closePath();
    c.fill();
    c.restore();
  }

  function drawGate(c, cx, cy, w, t) {
    var s = w / 150;
    c.save();
    c.translate(cx, cy);

    // 회전하는 빛줄기
    c.save();
    for (var r = 0; r < 11; r++) {
      var a = t * 0.00016 + r * (TAU / 11);
      c.globalAlpha = 0.07 + 0.05 * Math.sin(t * 0.0013 + r * 1.7);
      c.fillStyle = '#fff6cf';
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(Math.cos(a - 0.055) * 190 * s, Math.sin(a - 0.055) * 190 * s);
      c.lineTo(Math.cos(a + 0.055) * 190 * s, Math.sin(a + 0.055) * 190 * s);
      c.closePath();
      c.fill();
    }
    c.restore();

    // 중심 빛무리
    var core = c.createRadialGradient(0, -18 * s, 4, 0, -18 * s, 95 * s);
    core.addColorStop(0, 'rgba(255, 255, 240, .95)');
    core.addColorStop(0.32, 'rgba(255, 238, 170, .55)');
    core.addColorStop(1, 'rgba(255, 232, 150, 0)');
    c.fillStyle = core;
    c.beginPath();
    c.arc(0, -18 * s, 95 * s, 0, TAU);
    c.fill();

    // 구름섬
    c.save();
    c.fillStyle = 'rgba(255,255,255,.96)';
    for (var i = 0; i < 7; i++) {
      c.beginPath();
      c.arc((-54 + i * 18) * s, (30 + (i % 2) * 6) * s, (15 + (i % 3) * 4) * s, 0, TAU);
      c.fill();
    }
    c.fillStyle = 'rgba(222, 242, 255, .98)';
    c.beginPath();
    c.ellipse(0, 34 * s, 62 * s, 11 * s, 0, 0, TAU);
    c.fill();
    c.restore();

    // 앞 계단 3단
    for (var st = 0; st < 3; st++) {
      var sw = (50 - st * 8) * s, sy = (30 - st * 6) * s, sh = 6 * s;
      c.fillStyle = st % 2 ? '#fffdf2' : '#fff5cf';
      rr(c, -sw / 2, sy - sh, sw, sh, 2 * s);
      c.fill();
      c.strokeStyle = 'rgba(226, 178, 62, .55)';
      c.lineWidth = 1 * s;
      rr(c, -sw / 2, sy - sh, sw, sh, 2 * s);
      c.stroke();
    }

    // 좌우 탑
    function pillar(px, pw, ph) {
      var pg = c.createLinearGradient(px - pw / 2, 0, px + pw / 2, 0);
      pg.addColorStop(0, '#fff9dd');
      pg.addColorStop(0.4, '#ffe28b');
      pg.addColorStop(0.78, '#f0b93f');
      pg.addColorStop(1, '#d99a22');
      c.fillStyle = pg;
      rr(c, px - pw / 2, -ph, pw, ph + 12 * s, 3 * s);
      c.fill();
      // 돔
      c.fillStyle = '#ffeaa4';
      c.beginPath();
      c.ellipse(px, -ph, pw * 0.72, pw * 0.62, 0, Math.PI, 0);
      c.fill();
      // 꼭대기 구
      c.fillStyle = '#fffce8';
      c.beginPath();
      c.arc(px, -ph - pw * 0.6, pw * 0.2, 0, TAU);
      c.fill();
      // 창
      c.fillStyle = 'rgba(140, 96, 16, .5)';
      c.beginPath();
      c.arc(px, -ph * 0.42, pw * 0.2, 0, TAU);
      c.fill();
    }
    pillar(-42 * s, 15 * s, 62 * s);
    pillar(42 * s, 15 * s, 62 * s);

    // 중앙 성문 (아치)
    var gateW = 58 * s, gateH = 74 * s;
    var gg = c.createLinearGradient(-gateW / 2, 0, gateW / 2, 0);
    gg.addColorStop(0, '#fffaea');
    gg.addColorStop(0.35, '#ffe89c');
    gg.addColorStop(0.72, '#f5c14c');
    gg.addColorStop(1, '#dd9c25');
    c.fillStyle = gg;
    c.beginPath();
    c.moveTo(-gateW / 2, 26 * s);
    c.lineTo(-gateW / 2, -gateH + 26 * s);
    c.quadraticCurveTo(0, -gateH - 22 * s, gateW / 2, -gateH + 26 * s);
    c.lineTo(gateW / 2, 26 * s);
    c.closePath();
    c.fill();
    c.strokeStyle = 'rgba(255, 255, 245, .85)';
    c.lineWidth = 2 * s;
    c.stroke();

    // 문 안쪽 (빛나는 통로)
    var inW = 30 * s;
    c.fillStyle = 'rgba(255, 252, 236, .98)';
    c.beginPath();
    c.moveTo(-inW / 2, 26 * s);
    c.lineTo(-inW / 2, -gateH + 40 * s);
    c.quadraticCurveTo(0, -gateH + 4 * s, inW / 2, -gateH + 40 * s);
    c.lineTo(inW / 2, 26 * s);
    c.closePath();
    c.fill();
    var inG = c.createLinearGradient(0, -gateH + 40 * s, 0, 26 * s);
    inG.addColorStop(0, 'rgba(255, 245, 190, .95)');
    inG.addColorStop(1, 'rgba(255, 214, 110, .55)');
    c.fillStyle = inG;
    c.beginPath();
    c.moveTo(-inW / 2, 26 * s);
    c.lineTo(-inW / 2, -gateH + 40 * s);
    c.quadraticCurveTo(0, -gateH + 4 * s, inW / 2, -gateH + 40 * s);
    c.lineTo(inW / 2, 26 * s);
    c.closePath();
    c.fill();

    // 문 안쪽 금빛 창살
    c.save();
    c.strokeStyle = 'rgba(214, 158, 40, .55)';
    c.lineWidth = 1.6 * s;
    for (var mm = -1; mm <= 1; mm++) {
      c.beginPath();
      c.moveTo(mm * inW * 0.3, 24 * s);
      c.lineTo(mm * inW * 0.3, -gateH + 44 * s);
      c.stroke();
    }
    c.beginPath();
    c.moveTo(-inW / 2, -gateH + 62 * s);
    c.lineTo(inW / 2, -gateH + 62 * s);
    c.stroke();
    c.restore();

    // 아치 테두리 장식
    c.strokeStyle = 'rgba(255, 246, 205, .95)';
    c.lineWidth = 2.4 * s;
    c.beginPath();
    c.moveTo(-gateW / 2 + 5 * s, 22 * s);
    c.lineTo(-gateW / 2 + 5 * s, -gateH + 28 * s);
    c.quadraticCurveTo(0, -gateH - 16 * s, gateW / 2 - 5 * s, -gateH + 28 * s);
    c.lineTo(gateW / 2 - 5 * s, 22 * s);
    c.stroke();

    // 왕관 장식 (문 위)
    c.fillStyle = '#fff3b8';
    c.beginPath();
    c.moveTo(-11 * s, -gateH - 18 * s);
    c.lineTo(-11 * s, -gateH - 30 * s);
    c.lineTo(-5 * s, -gateH - 24 * s);
    c.lineTo(0, -gateH - 35 * s);
    c.lineTo(5 * s, -gateH - 24 * s);
    c.lineTo(11 * s, -gateH - 30 * s);
    c.lineTo(11 * s, -gateH - 18 * s);
    c.closePath();
    c.fill();
    c.fillStyle = '#ff9fc4';
    c.beginPath();
    c.arc(0, -gateH - 21 * s, 2.4 * s, 0, TAU);
    c.fill();

    // 반짝임
    for (var k = 0; k < 7; k++) {
      var ang = t * 0.0005 + k * (TAU / 7);
      var rad = (34 + Math.sin(t * 0.0018 + k) * 7) * s;
      var sx = Math.cos(ang) * rad, sy = Math.sin(ang) * rad * 0.55 - 16 * s;
      var al = 0.3 + 0.45 * Math.abs(Math.sin(t * 0.003 + k * 2));
      drawStar(ctx, sx, sy, (1.8 + Math.abs(Math.sin(t * 0.002 + k)) * 2.2) * s, 4, 'rgba(255,255,250,' + al + ')');
    }
    c.restore();
  }

  function drawBalloon(c, x, y, s) {
    c.save();
    c.translate(x, y);
    c.rotate(Math.sin(Date.now() * 0.0006) * 0.05);
    // 줄
    c.strokeStyle = 'rgba(120, 90, 60, .55)';
    c.lineWidth = 1.2 * s;
    c.beginPath();
    c.moveTo(-9 * s, 22 * s); c.lineTo(-6 * s, 38 * s);
    c.moveTo(9 * s, 22 * s); c.lineTo(6 * s, 38 * s);
    c.stroke();
    // 바구니
    c.fillStyle = '#c98a52';
    rr(c, -7 * s, 37 * s, 14 * s, 11 * s, 3 * s);
    c.fill();
    // 기구
    var g = c.createLinearGradient(-22 * s, 0, 22 * s, 0);
    g.addColorStop(0, '#ffb3d1');
    g.addColorStop(0.5, '#ff87b6');
    g.addColorStop(1, '#f26a9d');
    c.fillStyle = g;
    c.beginPath();
    c.ellipse(0, 4 * s, 22 * s, 26 * s, 0, 0, TAU);
    c.fill();
    // 줄무늬
    c.fillStyle = 'rgba(255,255,255,.55)';
    c.beginPath();
    c.ellipse(-7 * s, 4 * s, 5 * s, 25 * s, 0, 0, TAU);
    c.fill();
    c.beginPath();
    c.ellipse(9 * s, 4 * s, 3.5 * s, 24 * s, 0, 0, TAU);
    c.fill();
    // 하이라이트
    c.fillStyle = 'rgba(255,255,255,.5)';
    c.beginPath();
    c.ellipse(-10 * s, -6 * s, 5 * s, 8 * s, 0, 0, TAU);
    c.fill();
    c.restore();
  }

  var starField = [];
  function buildStars() {
    starField = [];
    for (var i = 0; i < 26; i++) {
      starField.push({
        x: Math.random(), y: Math.random() * 0.55,
        r: rnd(0.7, 2.0), ph: rnd(0, TAU), sp: rnd(0.6, 1.8)
      });
    }
  }

  function drawAurora(c, t) {
    var bands = [
      { y: 0.15, amp: 26, h: 58, a: 'rgba(110, 255, 214, .16)' },
      { y: 0.23, amp: 38, h: 72, a: 'rgba(130, 180, 255, .15)' },
      { y: 0.31, amp: 30, h: 62, a: 'rgba(190, 140, 255, .14)' }
    ];
    for (var i = 0; i < bands.length; i++) {
      var b = bands[i];
      var y0 = H * b.y;
      c.save();
      c.beginPath();
      for (var x = -20; x <= W + 20; x += 14) {
        var yy = y0 + Math.sin(x / 105 + i * 1.7 + t * 0.0003) * b.amp;
        if (x === -20) c.moveTo(x, yy); else c.lineTo(x, yy);
      }
      for (var x2 = W + 20; x2 >= -20; x2 -= 14) {
        var yy2 = y0 + b.h + Math.sin(x2 / 130 + i * 2.3 + t * 0.0003) * b.amp * 0.7;
        c.lineTo(x2, yy2);
      }
      c.closePath();
      var g = c.createLinearGradient(0, y0 - b.amp, 0, y0 + b.h + b.amp);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.4, b.a);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g;
      c.fill();
      c.restore();
    }
  }

  function renderBackground() {
    bg.width = Math.round(W * dpr);
    bg.height = Math.round(H * dpr);
    var c = bgx;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, W, H);

    // 밤하늘
    var g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0a0927');
    g.addColorStop(0.15, '#141142');
    g.addColorStop(0.33, '#241c62');
    g.addColorStop(0.52, '#3a2e83');
    g.addColorStop(0.70, '#5a479c');
    g.addColorStop(0.85, '#8a6ab2');
    g.addColorStop(1, '#c6a0c4');
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);

    // 오로라
    drawAurora(c, 0);

    // 별
    for (var i = 0; i < starField.length; i++) {
      var st = starField[i];
      var al = 0.22 + 0.55 * Math.abs(Math.sin(st.ph));
      c.fillStyle = 'rgba(255,255,255,' + al + ')';
      c.beginPath();
      c.arc(st.x * W, st.y * H, st.r, 0, TAU);
      c.fill();
      if (st.r > 1.5) {
        c.strokeStyle = 'rgba(255,255,255,' + (al * 0.5) + ')';
        c.lineWidth = 0.6;
        c.beginPath();
        c.moveTo(st.x * W - st.r * 2.4, st.y * H);
        c.lineTo(st.x * W + st.r * 2.4, st.y * H);
        c.moveTo(st.x * W, st.y * H - st.r * 2.4);
        c.lineTo(st.x * W, st.y * H + st.r * 2.4);
        c.stroke();
      }
    }

    // 성문 뒤 황금 광휘
    var sun = c.createRadialGradient(W * 0.5, L.gateY - 18, 4, W * 0.5, L.gateY - 18, W * 0.72);
    sun.addColorStop(0, 'rgba(255, 253, 236, .92)');
    sun.addColorStop(0.10, 'rgba(255, 243, 190, .34)');
    sun.addColorStop(0.30, 'rgba(255, 228, 165, .10)');
    sun.addColorStop(1, 'rgba(255, 228, 165, 0)');
    c.fillStyle = sun;
    c.fillRect(0, 0, W, H * 0.62);

    // 달빛 구름
    drawCloud(c, W * 0.17, H * 0.11, 1.5, 0.34, true);
    drawCloud(c, W * 0.85, H * 0.085, 1.25, 0.3, true);
    drawCloud(c, W * 0.62, H * 0.20, 0.9, 0.22, true);
    drawCloud(c, W * 0.06, H * 0.31, 1.1, 0.3, false);
    drawCloud(c, W * 0.95, H * 0.36, 1.0, 0.3, false);
    drawCloud(c, W * 0.31, H * 0.40, 0.8, 0.2, false);
    drawCloud(c, W * 0.72, H * 0.455, 0.85, 0.18, false);

    // 떠 있는 동화 성
    drawCastle(c, W * 0.13, H * 0.335, W * 0.33, false);
    drawCastle(c, W * 0.88, H * 0.43, W * 0.32, true);
    drawCastle(c, W * 0.05, H * 0.215, W * 0.19, false);

    // 황금 성문
    drawGate(c, W * 0.5, L.gateY - 4, W * 0.44, 0);

    // 구름 바다 (아래)
    drawCloud(c, W * 0.08, H * 0.80, 1.9, 0.5, true);
    drawCloud(c, W * 0.52, H * 0.88, 2.1, 0.55, true);
    drawCloud(c, W * 0.94, H * 0.76, 1.7, 0.48, true);
    var hz = c.createLinearGradient(0, H * 0.74, 0, H);
    hz.addColorStop(0, 'rgba(214, 180, 214, 0)');
    hz.addColorStop(0.55, 'rgba(226, 200, 228, .18)');
    hz.addColorStop(1, 'rgba(246, 228, 238, .3)');
    c.fillStyle = hz;
    c.fillRect(0, H * 0.74, W, H * 0.26);
  }

  /* ══════ 계단 ══════ */
  var STAIR_N = 15;

  function drawStairs(now) {
    var s = state;
    var lanes = s.lanes || 4;
    var charDepth = lerp(0.9, 0.115, s.climbShown);
    var labels = LANE_LABELS[lanes] || LANE_LABELS[4];

    for (var i = STAIR_N - 1; i >= 0; i--) {
      var dF = 1 - i / STAIR_N;
      var dB = 1 - (i + 1) / STAIR_N;
      var pF = persp(dF), pB = persp(dB);
      var thick = Math.max(3, 21 * pF.s);
      var near = clamp(pF.s, 0.15, 1);
      var keyWB = (pB.half * 2 / lanes) * 0.93;
      var keyWF = (pF.half * 2 / lanes) * 0.93;

      // 단 그림자
      ctx.save();
      ctx.globalAlpha = 0.32 + 0.3 * near;
      ctx.fillStyle = 'rgba(24, 18, 66, .75)';
      ctx.beginPath();
      ctx.moveTo(L.cx - pF.half, pF.y + thick);
      ctx.lineTo(L.cx + pF.half, pF.y + thick);
      ctx.lineTo(L.cx + pF.half * 0.94, pF.y + thick + 14 * pF.s);
      ctx.lineTo(L.cx - pF.half * 0.94, pF.y + thick + 14 * pF.s);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 윗면 (피아노 흰 건반)
      var grd = ctx.createLinearGradient(0, pB.y, 0, pF.y);
      grd.addColorStop(0, '#dfe6ff');
      grd.addColorStop(0.12, '#fbfdff');
      grd.addColorStop(0.72, '#ffffff');
      grd.addColorStop(1, '#e9f1ff');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.moveTo(L.cx - pB.half, pB.y);
      ctx.lineTo(L.cx + pB.half, pB.y);
      ctx.lineTo(L.cx + pF.half, pF.y);
      ctx.lineTo(L.cx - pF.half, pF.y);
      ctx.closePath();
      ctx.fill();

      // 레인별 건반 칸
      for (var ln = 0; ln < lanes; ln++) {
        var ratio = L.laneRatio[ln] || 0;
        var col = LANE_COLORS[ln % 4];
        var xB = L.cx + ratio * pB.half;
        var xF = L.cx + ratio * pF.half;

        var kg = ctx.createLinearGradient(0, pB.y, 0, pF.y);
        kg.addColorStop(0, hexA(col.main, 0.16 + 0.1 * near));
        kg.addColorStop(0.35, hexA(col.light, 0.55));
        kg.addColorStop(1, '#ffffff');
        ctx.fillStyle = kg;
        ctx.beginPath();
        ctx.moveTo(xB - keyWB / 2, pB.y);
        ctx.lineTo(xB + keyWB / 2, pB.y);
        ctx.lineTo(xF + keyWF / 2, pF.y);
        ctx.lineTo(xF - keyWF / 2, pF.y);
        ctx.closePath();
        ctx.fill();

        ctx.save();
        ctx.strokeStyle = hexA(col.main, 0.5 + 0.4 * near);
        ctx.lineWidth = Math.max(0.9, 2 * pF.s);
        ctx.shadowColor = hexA(col.main, .95);
        ctx.shadowBlur = 10 * pF.s;
        ctx.beginPath();
        ctx.moveTo(xB - keyWB / 2, pB.y);
        ctx.lineTo(xB + keyWB / 2, pB.y);
        ctx.lineTo(xF + keyWF / 2, pF.y);
        ctx.lineTo(xF - keyWF / 2, pF.y);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }

      // 검은 건반 (레인 사이, 뒷부분)
      if (lanes > 1) {
        for (var bk = 0; bk < lanes - 1; bk++) {
          var ratioM = ((L.laneRatio[bk] || 0) + (L.laneRatio[bk + 1] || 0)) / 2;
          var bxB = L.cx + ratioM * pB.half;
          var bxF = L.cx + ratioM * pF.half;
          var bwB = (pB.half * 2 / lanes) * 0.30;
          var bwF = (pF.half * 2 / lanes) * 0.30;
          var stop = 0.44;
          var x0 = lerp(bxB, bxF, stop);
          var bww = lerp(bwB, bwF, stop);
          var y0 = pB.y;
          var hgt = (pF.y - pB.y) * stop + thick * 0.35;
          var bgk = ctx.createLinearGradient(0, y0, 0, y0 + hgt);
          bgk.addColorStop(0, '#2a2752');
          bgk.addColorStop(0.6, '#191634');
          bgk.addColorStop(1, '#0e0c22');
          ctx.fillStyle = bgk;
          rr(ctx, x0 - bww / 2, y0, bww, Math.max(1.5, hgt), Math.min(bww * 0.22, 4 * pF.s));
          ctx.fill();
          ctx.strokeStyle = 'rgba(120, 200, 255, ' + (0.22 + 0.3 * near) + ')';
          ctx.lineWidth = Math.max(0.6, 1 * pF.s);
          rr(ctx, x0 - bww / 2, y0, bww, Math.max(1.5, hgt), Math.min(bww * 0.22, 4 * pF.s));
          ctx.stroke();
        }
      }

      // 앞면
      var fg = ctx.createLinearGradient(0, pF.y, 0, pF.y + thick);
      fg.addColorStop(0, '#ffffff');
      fg.addColorStop(0.42, '#eef5ff');
      fg.addColorStop(1, '#c7dcfb');
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.moveTo(L.cx - pF.half, pF.y);
      ctx.lineTo(L.cx + pF.half, pF.y);
      ctx.lineTo(L.cx + pF.half, pF.y + thick);
      ctx.lineTo(L.cx - pF.half, pF.y + thick);
      ctx.closePath();
      ctx.fill();

      // 네온 하늘빛 테두리 (앞 모서리)
      ctx.save();
      ctx.strokeStyle = 'rgba(110, 226, 255,' + (0.6 + 0.35 * near) + ')';
      ctx.lineWidth = Math.max(1.1, 3 * pF.s);
      ctx.shadowColor = 'rgba(90, 215, 255, 1)';
      ctx.shadowBlur = 16 * pF.s;
      ctx.beginPath();
      ctx.moveTo(L.cx - pF.half + 1, pF.y + thick * 0.9);
      ctx.lineTo(L.cx + pF.half - 1, pF.y + thick * 0.9);
      ctx.stroke();
      ctx.restore();

      // 계이름 표시 (가까운 단)
      if (i < 3) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (var l2 = 0; l2 < lanes; l2++) {
          var rr2 = L.laneRatio[l2] || 0;
          var lx = L.cx + rr2 * lerp(pB.half, pF.half, 0.55);
          var ly = lerp(pB.y, pF.y, 0.58);
          var fs = clamp(13 * pF.s + 4, 6, 22);
          ctx.font = '900 ' + fs.toFixed(1) + 'px "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
          ctx.fillStyle = hexA(LANE_COLORS[l2 % 4].dark, 0.55 + 0.35 * near);
          ctx.fillText(labels[l2] || '', lx, ly);
        }
        ctx.restore();
      }

      // 캐릭터 발 밑 계단 하이라이트
      var dh = Math.abs(dF - charDepth);
      if (dh < 0.08) {
        var a = (1 - dh / 0.08);
        var pulse = s.beatPulse * 0.6;
        ctx.save();
        var hg = ctx.createLinearGradient(0, pB.y, 0, pF.y + thick);
        hg.addColorStop(0, 'rgba(120, 240, 255, 0)');
        hg.addColorStop(0.55, 'rgba(150, 240, 255,' + (0.3 + pulse * 0.3) * a + ')');
        hg.addColorStop(1, 'rgba(210, 252, 255,' + (0.6 + pulse * 0.4) * a + ')');
        ctx.fillStyle = hg;
        ctx.beginPath();
        ctx.moveTo(L.cx - pB.half, pB.y);
        ctx.lineTo(L.cx + pB.half, pB.y);
        ctx.lineTo(L.cx + pF.half, pF.y);
        ctx.lineTo(L.cx - pF.half, pF.y);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }

    // 판정 순간 건반 번쩍 (레인별)
    for (var fi = s.stepFlash.length - 1; fi >= 0; fi--) {
      var fl = s.stepFlash[fi];
      var age = (now - fl.t) / 340;
      if (age >= 1) { s.stepFlash.splice(fi, 1); continue; }
      var pf2 = persp(fl.d);
      var col2 = LANE_COLORS[(fl.lane || 0) % 4];
      var rx = L.cx + (L.laneRatio[fl.lane || 0] || 0) * pf2.half;
      var rw = (pf2.half * 2 / lanes) * 0.93;
      ctx.save();
      ctx.globalAlpha = (1 - age) * 0.85;
      var fg2 = ctx.createLinearGradient(0, pf2.y - 26 * pf2.s, 0, pf2.y + 12);
      fg2.addColorStop(0, hexA(col2.main, 0));
      fg2.addColorStop(0.55, hexA(col2.main, 0.75));
      fg2.addColorStop(1, 'rgba(255, 255, 255, .98)');
      ctx.fillStyle = fg2;
      ctx.fillRect(rx - rw / 2, pf2.y - 26 * pf2.s, rw, 26 * pf2.s + 14);
      ctx.shadowColor = hexA(col2.main, 1);
      ctx.shadowBlur = 22;
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      ctx.fillRect(rx - rw / 2, pf2.y + 8, rw, 2);
      ctx.restore();
    }

    // 계단 양옆 하늘빛 라인
    ctx.save();
    var sideG = ctx.createLinearGradient(0, L.gateY, 0, L.nearY);
    sideG.addColorStop(0, 'rgba(180, 250, 255, .25)');
    sideG.addColorStop(1, 'rgba(120, 235, 255, .85)');
    ctx.strokeStyle = sideG;
    ctx.lineWidth = 3;
    ctx.shadowColor = 'rgba(90, 220, 255, .9)';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    for (var k = 0; k <= 20; k++) {
      var d = 1 - k / 20;
      var p = persp(d);
      var x = L.cx - p.half - 3;
      if (k === 0) ctx.moveTo(x, p.y); else ctx.lineTo(x, p.y);
    }
    ctx.stroke();
    ctx.beginPath();
    for (var k2 = 0; k2 <= 20; k2++) {
      var d2 = 1 - k2 / 20;
      var p2 = persp(d2);
      var x2 = L.cx + p2.half + 3;
      if (k2 === 0) ctx.moveTo(x2, p2.y); else ctx.lineTo(x2, p2.y);
    }
    ctx.stroke();
    ctx.restore();

    // 바닥 계단 → 건반 빛기둥
    ctx.save();
    var bg2 = ctx.createLinearGradient(0, L.nearY, 0, L.keysTop);
    bg2.addColorStop(0, 'rgba(200, 250, 255, .5)');
    bg2.addColorStop(1, 'rgba(130, 225, 255, .04)');
    ctx.fillStyle = bg2;
    ctx.beginPath();
    ctx.moveTo(L.cx - L.nearHalf * 0.55, L.nearY);
    ctx.lineTo(L.cx + L.nearHalf * 0.55, L.nearY);
    ctx.lineTo(L.cx + L.nearHalf * 1.02, L.keysTop);
    ctx.lineTo(L.cx - L.nearHalf * 1.02, L.keysTop);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /* ══════ 우진이 (계단 위) ══════ */
  function drawCharacter(now) {
    var s = state;
    var d = lerp(0.9, 0.115, s.climbShown);
    var p = persp(d);
    var h = lerp(100, 232, Math.pow(clamp(d, 0, 1), 0.9));
    var pose = currentPose();
    var rec = spriteSet[pose] || spriteSet.run;
    var ar = rec.ar || 0.46;
    var w = h * ar;

    var beatLen = 60 / (s.bpmNow || 100);
    var bp = s.mode === 'playing' ? ((s.songTime / beatLen) % 1) : ((now / 900) % 1);
    var bob = Math.abs(Math.sin(Math.PI * bp)) * (3 + 9 * p.s);
    var hopP = s.hop > 0 ? Math.sin(clamp(s.hop, 0, 1) * Math.PI) : 0;
    var hop = hopP * (16 + 13 * p.s);
    var sway = s.oopsT > 0 ? Math.sin(now * 0.028) * 3.4 * s.oopsT : 0;
    var tilt = Math.sin(TAU * bp) * 0.05 * (0.5 + p.s) - 0.07 * s.oopsT;

    var baseX = L.cx + laneRatioAt(s.charLane) * p.half;
    var feetY = p.y - 2 - bob - hop;

    // 그림자
    ctx.save();
    ctx.globalAlpha = 0.16 + 0.12 * p.s;
    ctx.fillStyle = 'rgba(40, 100, 165, .6)';
    ctx.beginPath();
    ctx.ellipse(baseX, p.y + 3, Math.max(4, w * 0.34), Math.max(2, 5 * p.s), 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    // 후광
    var cx = baseX + sway;
    var hg = ctx.createRadialGradient(cx, feetY - h * 0.42, 4, cx, feetY - h * 0.42, h * 0.64);
    hg.addColorStop(0, s.fever ? 'rgba(255, 248, 205, .42)' : 'rgba(255,255,255,.26)');
    hg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.arc(cx, feetY - h * 0.42, h * 0.64, 0, TAU);
    ctx.fill();

    // 착지 먼지 링
    if (s.hop > 0.72) {
      var kk = (s.hop - 0.72) / 0.28;
      ctx.save();
      ctx.globalAlpha = 0.5 * kk;
      ctx.strokeStyle = 'rgba(255, 255, 255, .95)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(baseX, p.y + 2, w * (0.3 + 0.5 * (1 - kk)), 6 + 8 * (1 - kk), 0, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(cx, feetY);
    ctx.rotate(tilt);
    if (rec.ready) {
      ctx.imageSmoothingQuality = 'high';
      ctx.shadowColor = 'rgba(24, 70, 130, .34)';
      ctx.shadowBlur = 12 * p.s + 4;
      ctx.shadowOffsetY = 4 * p.s;
      ctx.drawImage(rec.img, -w * rec.ax, -h, w, h);
    } else {
      ctx.fillStyle = '#cfe8ff';
      rr(ctx, -w / 2, -h, w, h, 10);
      ctx.fill();
    }
    ctx.restore();

    // 피버 왕관 + 별빛
    if (s.fever || pose === 'cheer') {
      var cy = feetY - h - 4;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(Math.sin(now * 0.004) * 0.12);
      var cs = Math.max(0.5, 1.0 * p.s);
      ctx.scale(cs, cs);
      ctx.fillStyle = '#ffd84a';
      ctx.shadowColor = 'rgba(255, 210, 60, .95)';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.moveTo(-16, 6);
      ctx.lineTo(-16, -8);
      ctx.lineTo(-8, 0);
      ctx.lineTo(0, -13);
      ctx.lineTo(8, 0);
      ctx.lineTo(16, -8);
      ctx.lineTo(16, 6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ff8ec2';
      ctx.beginPath();
      ctx.arc(0, 2, 3.2, 0, TAU);
      ctx.fill();
      ctx.restore();

      for (var i = 0; i < 5; i++) {
        var a = now * 0.0022 + i * (TAU / 5);
        var rx = cx + Math.cos(a) * (w * 0.6 + 10);
        var ry = feetY - h * 0.55 + Math.sin(a) * 16;
        drawStar(ctx, rx, ry, 4 + Math.sin(a * 2) * 1.6, 5, 'rgba(255, 250, 200, .95)');
      }
    }
  }

  function drawStar(c, x, y, r, points, color) {
    c.save();
    c.fillStyle = color;
    c.beginPath();
    for (var i = 0; i < points * 2; i++) {
      var rad = i % 2 ? r * 0.45 : r;
      var a = -Math.PI / 2 + i * Math.PI / points;
      var px = x + Math.cos(a) * rad;
      var py = y + Math.sin(a) * rad;
      if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.closePath();
    c.fill();
    c.restore();
  }

  /* ══════ 음표 타일 ══════ */
  function drawNoteTile(n, now) {
    var pos = notePos(n, now);
    if (pos.d < -0.06 || pos.d > 1.35) return;
    var col = LANE_COLORS[n.lane % LANE_COLORS.length];
    var r = clamp(15 + 31 * pos.s, 11, 44);
    var y = pos.y, x = pos.x;

    if (n.st === 1) {
      // 맞춤: 위로 튀어오르며 사라짐
      var k = clamp((now - n.hitT) / 0.3, 0, 1);
      if (k >= 1) return;
      ctx.save();
      ctx.globalAlpha = (1 - k) * 0.95;
      ctx.translate(x, y - k * 22);
      ctx.scale(1 + k * 0.7, 1 + k * 0.7);
      ctx.fillStyle = col.light;
      ctx.shadowColor = col.main; ctx.shadowBlur = 22;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.9, 0, TAU); ctx.fill();
      ctx.restore();
      return;
    }
    if (n.st === 2) {
      var k2 = clamp((now - n.hitT) / 0.35, 0, 1);
      if (k2 >= 1) return;
      ctx.save();
      ctx.globalAlpha = (1 - k2) * 0.5;
      ctx.fillStyle = '#9fb8cf';
      ctx.beginPath(); ctx.arc(x, y + k2 * 26, r * 0.85 * (1 - k2 * 0.4), 0, TAU); ctx.fill();
      ctx.restore();
      return;
    }

    // 잔상
    ctx.save();
    for (var g = 3; g >= 1; g--) {
      var gp = notePos(n, now - g * 0.045);
      if (gp.d < 0) continue;
      ctx.globalAlpha = 0.16 + 0.07 * (3 - g);
      ctx.fillStyle = col.main;
      ctx.beginPath();
      ctx.arc(gp.x, gp.y, r * (0.55 + 0.12 * g), 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.translate(x, y);

    // 글로우 링
    var glow = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 2.0);
    glow.addColorStop(0, 'rgba(255,255,255,.55)');
    glow.addColorStop(0.35, hexA(col.main, 0.35));
    glow.addColorStop(1, hexA(col.main, 0));
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(0, 0, r * 2.0, 0, TAU); ctx.fill();

    // 타일 몸통 (진한 네온 + 흰 테두리)
    var bgd = ctx.createLinearGradient(0, -r, 0, r);
    bgd.addColorStop(0, col.main);
    bgd.addColorStop(0.55, col.main);
    bgd.addColorStop(1, col.dark);
    ctx.fillStyle = bgd;
    ctx.shadowColor = hexA(col.main, .95);
    ctx.shadowBlur = 20 * (0.45 + pos.s);
    rr(ctx, -r * 0.86, -r * 0.86, r * 1.72, r * 1.72, r * 0.46);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,1)';
    ctx.lineWidth = Math.max(1.8, 3.4 * pos.s);
    rr(ctx, -r * 0.86, -r * 0.86, r * 1.72, r * 1.72, r * 0.46);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(10, 10, 40, .55)';
    ctx.lineWidth = Math.max(0.9, 1.4 * pos.s);
    rr(ctx, -r * 0.86 - 1, -r * 0.86 - 1, r * 1.72 + 2, r * 1.72 + 2, r * 0.48);
    ctx.stroke();

    // 음표 글리프
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 ' + Math.round(r * 1.2) + 'px "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = hexA(col.dark, .75);
    ctx.shadowBlur = 6;
    ctx.fillText('♪', 0, r * 0.05);
    ctx.restore();
  }

  function hexA(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  /* ══════ 파티클 ══════ */
  var parts = [];
  function burst(x, y, color, count, power) {
    for (var i = 0; i < count; i++) {
      var a = rnd(0, TAU);
      var sp = rnd(60, 240) * (power || 1);
      parts.push({
        x: x, y: y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 60,
        life: rnd(0.45, 0.9), max: 0.9,
        r: rnd(2, 5.5),
        color: color,
        star: Math.random() < 0.45,
        rot: rnd(0, TAU), vr: rnd(-6, 6)
      });
    }
    if (parts.length > 420) parts = parts.slice(parts.length - 420);
  }

  function updateParts(dt) {
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.vy += 520 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.985;
      p.rot += p.vr * dt;
      p.life -= dt;
      if (p.life <= 0) parts.splice(i, 1);
    }
  }

  function drawParts() {
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      var a = clamp(p.life / 0.5, 0, 1);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.star) {
        ctx.beginPath();
        for (var k = 0; k < 8; k++) {
          var rad = k % 2 ? p.r * 0.42 : p.r * 1.5;
          var ang = -Math.PI / 2 + k * Math.PI / 4;
          var px = Math.cos(ang) * rad, py = Math.sin(ang) * rad;
          if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.r * 0.8, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  /* ══════ 천사 날개 · 떠다니는 음표 ══════ */
  function drawWingShape(c, x, y, dir, alpha, sc) {
    c.save();
    c.translate(x, y);
    c.scale(dir * sc, sc);
    c.globalAlpha = alpha;
    for (var i = 0; i < 5; i++) {
      var o = i * 12;
      c.beginPath();
      c.moveTo(0, -34 + o);
      c.quadraticCurveTo(40 + i * 9, -34 + o, 80 + i * 5, 2 + o * 0.5);
      c.quadraticCurveTo(42 + i * 7, 10 + o * 0.5, 0, -4 + o);
      c.closePath();
      c.fillStyle = i % 2 ? 'rgba(255,255,255,.85)' : 'rgba(230,240,255,.9)';
      c.fill();
    }
    c.restore();
  }

  function drawSideWings(now) {
    var a = 0.16 + 0.05 * Math.sin(now * 0.0011);
    drawWingShape(ctx, -14, H * 0.44, 1, a, 1.0);
    drawWingShape(ctx, W + 14, H * 0.57, -1, a, 0.92);
  }

  function drawHitWings(now) {
    for (var i = state.wings.length - 1; i >= 0; i--) {
      var w = state.wings[i];
      var k = (now - w.t) / 520;
      if (k >= 1) { state.wings.splice(i, 1); continue; }
      var al = (1 - k) * 0.85;
      var sc = 0.3 + k * 0.8;
      drawWingShape(ctx, w.x - 15, w.y, 1, al, sc);
      drawWingShape(ctx, w.x + 15, w.y, -1, al, sc);
    }
  }

  var floaters = [], lastFloat = 0;
  function updateFloaters(now, dt) {
    if (now - lastFloat > 560) {
      lastFloat = now;
      var left = Math.random() < 0.5;
      floaters.push({
        x: left ? rnd(4, W * 0.22) : rnd(W * 0.78, W - 4),
        y: H * rnd(0.45, 0.98),
        vy: rnd(-30, -14),
        sway: rnd(0, TAU),
        size: rnd(14, 26),
        rot: rnd(-0.45, 0.45),
        gold: Math.random() < 0.55,
        life: rnd(3.6, 6),
        age: 0
      });
      if (floaters.length > 14) floaters.shift();
    }
    for (var i = floaters.length - 1; i >= 0; i--) {
      var f = floaters[i];
      f.age += dt;
      f.y += f.vy * dt;
      f.x += Math.sin(f.age * 1.7 + f.sway) * 14 * dt;
      if (f.age > f.life) floaters.splice(i, 1);
    }
  }

  function drawFloaters() {
    for (var i = 0; i < floaters.length; i++) {
      var f = floaters[i];
      var a = Math.min(1, f.age * 1.4) * Math.min(1, (f.life - f.age) / 1.3);
      ctx.save();
      ctx.globalAlpha = a * 0.85;
      ctx.translate(f.x, f.y);
      ctx.rotate(f.rot + Math.sin(f.age * 1.2) * 0.14);
      ctx.font = '900 ' + f.size.toFixed(1) + 'px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = f.gold ? '#ffd75e' : '#c8a8ff';
      ctx.shadowColor = f.gold ? 'rgba(255, 200, 60, .95)' : 'rgba(170, 120, 255, .95)';
      ctx.shadowBlur = 14;
      ctx.fillText('\u266a', 0, 0);
      ctx.restore();
    }
  }

  /* ══════ 렌더 루프 ══════ */
  var lastT = 0;
  /* ══════ 계단 방향 헬퍼 ══════ */
  function laneRatioAt(v) {
    var n = state.lanes || 4;
    var i = clamp(Math.floor(v), 0, n - 1);
    var f = clamp(v - i, 0, 1);
    var a = L.laneRatio[i] || 0;
    var b = L.laneRatio[Math.min(n - 1, i + 1)] || 0;
    return a + (b - a) * f;
  }

  function currentPose() {
    var s = state;
    if (s.mode === 'over') return 'oops';
    if (s.oopsT > 0) return 'oops';
    if (s.cheerT > 0) return 'cheer';
    if (s.playT > 0) return 'play';
    return 'run';
  }

  function stageOf(lap) { return Math.min(STAGES.length, 1 + (lap || 0)); }

  function updateStageTag() {
    if (!stageTagEl) return;
    var st = state.stage || 1;
    var info = STAGES[st - 1] || STAGES[0];
    stageTagEl.textContent = 'STAGE ' + st + ' ' + info.emoji;
    stageTagEl.classList.toggle('pro', st >= 4);
  }

  /* 계단 길 — 다가오는 음표들을 잇는 빛의 리본 */
  function drawPathRibbon(now) {
    var s = state;
    if (s.mode !== 'playing') return;
    var pts = [];
    for (var i = 0; i < s.notes.length && pts.length < 10; i++) {
      var n = s.notes[i];
      if (n.st !== 0) continue;
      var pp = notePos(n, now);
      if (pp.d < -0.05 || pp.d > 1.15) continue;
      pts.push({ x: pp.x, y: pp.y, lane: n.lane, sc: pp.s });
    }
    if (pts.length < 2) return;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (var j = 1; j < pts.length; j++) ctx.lineTo(pts[j].x, pts[j].y);
    ctx.strokeStyle = 'rgba(255, 255, 255, .58)';
    ctx.shadowColor = 'rgba(140, 232, 255, .95)';
    ctx.shadowBlur = 18;
    ctx.lineWidth = 9;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(150, 236, 255, .92)';
    ctx.lineWidth = 3.0;
    ctx.setLineDash([5, 8]);
    ctx.stroke();
    ctx.restore();

    for (var m = 0; m < pts.length; m++) {
      var q = pts[m];
      var rad = clamp(5 + 8 * q.sc, 3.5, 13);
      ctx.save();
      ctx.globalAlpha = m === 0 ? 0.95 : 0.4;
      drawStar(ctx, q.x, q.y - rad * 1.6, rad, 4, m === 0 ? '#ffffff' : hexA(LANE_COLORS[q.lane % 4].light, .95));
      ctx.restore();
    }
  }

  /* 매 프레임: 몸 이동·포즈 타이머·스테이지 */
  function updateExtras(dt) {
    var s = state;
    var k = Math.min(1, dt * 11);
    s.charLane += (s.charTarget - s.charLane) * k;
    s.hop = Math.max(0, s.hop - dt * 3.4);
    s.playT = Math.max(0, s.playT - dt);
    s.cheerT = Math.max(0, s.cheerT - dt);
    s.oopsT = Math.max(0, s.oopsT - dt);

    var st = stageOf(s.lap);
    if (st !== s.stage) {
      s.stage = st;
      updateStageTag();
      if (s.mode === 'playing' && st > 1) {
        var info = STAGES[st - 1];
        showBanner('STAGE ' + st + ' · ' + info.name + ' ' + info.emoji);
        s.flash = Math.max(s.flash, 0.4);
        s.cheerT = 1.2;
        playSparkle(74);
      }
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    var dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 0.016;
    lastT = now;

    if (state.mode === 'playing') {
      update(dt, now);
    } else {
      state.beatPulse = Math.max(0, state.beatPulse - dt * 3);
      updateParts(dt);
      updateFloaters(now, dt);
    }
    render(now, dt);
  }

  function update(dt, now) {
    var s = state;
    s.songTime += dt;
    var t = s.songTime;
    s.bpmNow = s.loops.length ? s.loops[Math.min(s.lap, s.loops.length - 1)].bpm : s.bpm;

    // 차트 미리 생성
    var guard = 0;
    while (s.chartEnd - t < 8 && guard++ < 4) generateLoop();

    // 박자 펄스
    var beatLen = 60 / (s.bpmNow || 100);
    s.beatPulse = Math.pow(Math.max(0, 1 - ((t / beatLen) % 1)), 3);

    // 음표 판정·이동
    for (var i = s.notes.length - 1; i >= 0; i--) {
      var n = s.notes[i];
      if (n.st === 0 && t - n.t > 0.27) {
        n.st = 2; n.hitT = t;
        onMiss(n);
      }
      if (n.st !== 0 && t - n.hitT > 0.6) s.notes.splice(i, 1);
      else if (n.st === 0 && t - n.t > 1.4) s.notes.splice(i, 1);
    }

    // 바퀴(랩) 전환
    if (s.lap < s.loops.length) {
      var lp = s.loops[s.lap];
      if (t > lp.end) {
        s.lap++;
        s.lapHits = 0;
        s.lapTotal = s.loops[Math.min(s.lap, s.loops.length - 1)].total;
        s.climb = 0;
        s.climbShown = 0;
        showBanner((s.lap + 1) + '바퀴! 더 빨라져요 🔥');
        s.flash = 0.6;
        playSparkle(72);
      }
    }

    // 진행도
    s.climb = clamp(s.lapHits / Math.max(1, s.lapTotal), 0, 1);
    s.climbShown += (s.climb - s.climbShown) * Math.min(1, dt * 9);

    // 연출 감쇠
    s.shake = Math.max(0, s.shake - dt * 3.2);
    s.flash = Math.max(0, s.flash - dt * 1.6);
    s.cheer = Math.max(0, s.cheer - dt * 3.4);
    s.feverGlow += ((s.fever ? 1 : 0) - s.feverGlow) * Math.min(1, dt * 3);

    updateExtras(dt);
    updateParts(dt);
    updateFloaters(now, dt);
    updateHud();
  }

  function render(now, dt) {
    ctx.clearRect(0, 0, W, H);
    // 배경 캐시
    ctx.save();
    if (state.shake > 0.01) {
      ctx.translate(rnd(-1, 1) * state.shake * 4, rnd(-1, 1) * state.shake * 3);
    }
    ctx.drawImage(bg, 0, 0, W, H);

    // 흘러가는 구름
    var drift = (now * 0.004) % (W + 300) - 150;
    drawCloud(ctx, drift, H * 0.47, 1.15, 0.42);
    drawCloud(ctx, W - drift * 0.8, H * 0.6, 0.95, 0.34);

    // 열기구
    drawBalloon(ctx, W * 0.23 + Math.sin(now * 0.0004) * 8, H * 0.135 + Math.sin(now * 0.0007) * 6, 0.95);

    // 성문 반짝임(동적)
    drawGateSparkle(now);

    // 천사 날개 (배경 장식)
    drawSideWings(now);

    // 피버 무지개
    if (state.feverGlow > 0.02) {
      var a = state.feverGlow * 0.11;
      var rg = ctx.createLinearGradient(0, 0, W, H);
      rg.addColorStop(0, 'rgba(255, 130, 180,' + a + ')');
      rg.addColorStop(0.35, 'rgba(255, 220, 120,' + a * 0.8 + ')');
      rg.addColorStop(0.65, 'rgba(120, 240, 210,' + a + ')');
      rg.addColorStop(1, 'rgba(140, 170, 255,' + a + ')');
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, W, H);
    }

    if (state.mode !== 'menu') {
      drawStairs(now);
      drawPathRibbon(now);
      drawCharacter(now);
      for (var i = 0; i < state.notes.length; i++) drawNoteTile(state.notes[i], state.songTime);
      drawParts();
      drawHitWings(now);
      drawFloaters();
      drawHitGlow(now);
    } else {
      drawStairs(now);
      drawCharacter(now);
      drawFloaters();
    }

    if (state.stage >= 4 && state.mode !== 'menu') {
      var pg = ctx.createLinearGradient(0, 0, 0, H);
      pg.addColorStop(0, 'rgba(255, 222, 140, .13)');
      pg.addColorStop(0.55, 'rgba(255, 222, 140, 0)');
      pg.addColorStop(1, 'rgba(255, 196, 96, .11)');
      ctx.fillStyle = pg;
      ctx.fillRect(0, 0, W, H);
    }

    if (state.flash > 0.01) {
      ctx.fillStyle = 'rgba(255,255,255,' + (state.flash * 0.4) + ')';
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
  }

  function drawGateSparkle(now) {
    for (var i = 0; i < 5; i++) {
      var a = now * 0.0006 + i * 1.7;
      var x = W * 0.5 + Math.cos(a) * W * 0.12;
      var y = L.gateY - 30 + Math.sin(a * 1.3) * 22;
      var al = 0.25 + 0.45 * Math.abs(Math.sin(now * 0.003 + i));
      drawStar(ctx, x, y, 2.4 + Math.abs(Math.sin(now * 0.002 + i)) * 1.6, 4, 'rgba(255,255,255,' + al + ')');
    }
  }

  function drawHitGlow(now) {
    var p = persp(1);
    var y = p.y + 5;
    var half = p.half;

    ctx.save();
    // 금빛 판정선 아래 광
    var g = ctx.createLinearGradient(0, y - 24, 0, y + 20);
    g.addColorStop(0, 'rgba(255, 228, 140, 0)');
    g.addColorStop(0.5, 'rgba(255, 226, 130, .30)');
    g.addColorStop(1, 'rgba(255, 250, 210, .82)');
    ctx.fillStyle = g;
    ctx.fillRect(L.cx - half, y - 24, half * 2, 44);

    // 판정선
    ctx.strokeStyle = 'rgba(255, 228, 126,' + (0.85 + 0.15 * state.beatPulse) + ')';
    ctx.lineWidth = 3.4;
    ctx.shadowColor = 'rgba(255, 205, 80, 1)';
    ctx.shadowBlur = 22;
    ctx.beginPath();
    ctx.moveTo(L.cx - half, y);
    ctx.lineTo(L.cx + half, y);
    ctx.stroke();

    // 흰 하이라이트
    ctx.strokeStyle = 'rgba(255, 255, 250, .9)';
    ctx.lineWidth = 1.1;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(L.cx - half, y - 1.6);
    ctx.lineTo(L.cx + half, y - 1.6);
    ctx.stroke();

    // 양 끝 반짝
    var tw = 0.5 + 0.5 * Math.abs(Math.sin(now * 0.004));
    drawStar(ctx, L.cx - half, y, 4 + 3 * tw, 4, 'rgba(255, 255, 240, .95)');
    drawStar(ctx, L.cx + half, y, 4 + 3 * tw, 4, 'rgba(255, 255, 240, .95)');
    ctx.restore();
  }

  /* ══════ HUD ══════ */
  var hudCache = { score: -1, combo: -1, lives: -1, prog: -1, acc: -1, grade: '', next: '' };

  function gradeOf(acc, score) {
    if (acc >= 95 && score >= 1500) return 'S+';
    if (acc >= 90 && score >= 800) return 'S';
    if (acc >= 82) return 'A';
    if (acc >= 68) return 'B';
    return 'C';
  }

  function updateNext() {
    var s = state;
    if (s.mode !== 'playing') {
      if (hudCache.next !== '') { hudCache.next = ''; if (pathRowEl) pathRowEl.innerHTML = ''; }
      return;
    }
    var pick = [], i;
    for (i = 0; i < s.notes.length && pick.length < 5; i++) {
      if (s.notes[i].st === 0) pick.push(s.notes[i]);
    }
    s.pathLanes = [];
    for (i = 0; i < pick.length; i++) s.pathLanes.push(pick[i].lane);

    // 다음 계단 = 건반 불빛
    var hot = pick.length ? pick[0].lane : -1;
    var warm = pick.length > 1 ? pick[1].lane : -1;
    var kids = keysEl.children;
    for (i = 0; i < kids.length; i++) {
      kids[i].classList.toggle('hot', i === hot);
      kids[i].classList.toggle('warm', i !== hot && i === warm);
    }

    var sig = s.pathLanes.join(',');
    if (sig === hudCache.next) return;
    hudCache.next = sig;
    if (!pathRowEl) return;
    var labels = LANE_LABELS[s.lanes] || LANE_LABELS[4];
    var html = '';
    for (i = 0; i < pick.length; i++) {
      var arrow = '↑';
      if (i > 0) arrow = pick[i].lane > pick[i - 1].lane ? '↗' : (pick[i].lane < pick[i - 1].lane ? '↖' : '↑');
      html += '<span class="path-chip l' + (pick[i].lane % 4) + (i === 0 ? ' first' : '') + '">' +
        '<i>' + arrow + '</i><b>' + (labels[pick[i].lane] || '♪') + '</b></span>';
    }
    pathRowEl.innerHTML = html;
  }

  function updateHud() {
    var s = state;
    if (hudCache.score !== s.score) {
      hudCache.score = s.score;
      scoreNumEl.textContent = fmt(s.score);
    }
    if (hudCache.combo !== s.combo) {
      hudCache.combo = s.combo;
      comboNumEl.textContent = s.combo;
      if (s.combo > 0) {
        comboBoxEl.classList.add('on');
        comboNumEl.classList.remove('bump');
        void comboNumEl.offsetWidth;
        comboNumEl.classList.add('bump');
      } else {
        comboBoxEl.classList.remove('on');
      }
    }
    if (hudCache.lives !== s.lives) {
      hudCache.lives = s.lives;
      var hs = heartsEl.children;
      for (var i = 0; i < hs.length; i++) hs[i].classList.toggle('gone', i >= s.lives);
    }
    var prog = Math.round(s.climbShown * 100);
    if (hudCache.prog !== prog) {
      hudCache.prog = prog;
      progFillEl.style.height = prog + '%';
      progIcoEl.style.bottom = prog + '%';
    }
    // 정밀도
    var acc = s.judged ? Math.round(s.perfect / s.judged * 100) : 100;
    if (hudCache.acc !== acc) {
      hudCache.acc = acc;
      if (accNumEl) accNumEl.textContent = acc;
    }
    // 등급
    var grade = gradeOf(acc, s.score);
    if (hudCache.grade !== grade) {
      hudCache.grade = grade;
      if (songTagEl) songTagEl.textContent = SONGS[s.song].emoji + ' ' + SONGS[s.song].name + ' · ' + grade;
    }
    // 하단 곡 진행 바
    var lp = s.loops[s.lap];
    if (lp && lapFillEl) {
      var pr = clamp((s.songTime - lp.start) / Math.max(0.01, lp.end - lp.start), 0, 1);
      lapFillEl.style.width = (pr * 100).toFixed(1) + '%';
    }
    updateNext();
  }

  function setHeartsBreak(idx) {
    var hs = heartsEl.children;
    if (hs[idx]) {
      hs[idx].classList.add('breaking');
      setTimeout(function () { if (hs[idx]) hs[idx].classList.remove('breaking'); }, 450);
    }
  }

  /* ══════ 판정 ══════ */
  function judgeShow(text, cls) {
    judgeEl.textContent = text;
    judgeEl.className = 'judge ' + cls;
    void judgeEl.offsetWidth;
    judgeEl.classList.add('show');
  }

  function onHit(n, q, dtDelta) {
    var s = state;
    var pts = q === 'PERFECT' ? 100 : q === 'GREAT' ? 70 : 40;
    if (s.fever) pts *= 2;
    s.score += pts;
    s.combo++;
    if (s.combo > s.maxCombo) s.maxCombo = s.combo;
    s.lapHits++;
    s.cheer = 1;

    // 맞춘 계단으로 방향을 틀어 점프·상승
    s.charTarget = n.lane;
    s.hop = 1;
    s.oopsT = 0;
    if (s.fever) s.cheerT = Math.max(s.cheerT, 0.5);
    if (q === 'PERFECT' && s.combo % 5 === 0) s.playT = 0.6;

    if (!s.fever && s.combo >= 10) {
      s.fever = true;
      showBanner('피버 타임! 점수 2배 🌈');
      playSparkle(76);
    }

    var pos = notePos(n, s.songTime);
    burst(pos.x, pos.y, LANE_COLORS[n.lane % 4].main, q === 'PERFECT' ? 18 : 11, q === 'PERFECT' ? 1.25 : 0.95);
    burst(pos.x, pos.y, '#ffffff', 7, 0.75);
    if (q === 'PERFECT') {
      s.wings.push({ x: pos.x, y: pos.y, t: performance.now() });
      if (s.wings.length > 4) s.wings.shift();
    }
    s.judged++;
    if (q === 'PERFECT') s.perfect++;
    s.stepFlash.push({ d: 0.96, lane: n.lane, t: performance.now() });
    if (s.stepFlash.length > 8) s.stepFlash.shift();

    judgeShow(q === 'PERFECT' ? 'Perfect!' : q === 'GREAT' ? 'Great!' : 'Good!', q.toLowerCase());

    hudScoreEl.classList.remove('scored');
    void hudScoreEl.offsetWidth;
    scoreNumEl.classList.add('pop');
    setTimeout(function () { scoreNumEl.classList.remove('pop'); }, 110);

    try { if (navigator.vibrate) navigator.vibrate(10); } catch (e) { }
  }

  function onMiss(n) {
    var s = state;
    s.combo = 0;
    s.judged++;
    if (s.fever) { s.fever = false; }
    s.lives--;
    setHeartsBreak(s.lives);
    judgeShow('Miss', 'miss');
    s.oopsT = 1.15;
    s.hop = 0.35;
    s.shake = 1;
    playThud();
    if (s.lives <= 0) gameOver();
  }

  /* ══════ 터치 입력 ══════ */
  var lastTap = [-9, -9, -9, -9];

  function tapLane(lane, isKeyPress) {
    var s = state;
    if (s.mode !== 'playing') return;
    audioInit();
    var now = s.songTime;
    var best = null, bestAbs = 9;
    for (var i = 0; i < s.notes.length; i++) {
      var n = s.notes[i];
      if (n.st !== 0 || n.lane !== lane) continue;
      var abs = Math.abs(n.t - now);
      if (abs < bestAbs) { bestAbs = abs; best = n; }
    }
    if (best && bestAbs <= 0.24) {
      var q = bestAbs <= 0.085 ? 'PERFECT' : bestAbs <= 0.15 ? 'GREAT' : 'GOOD';
      best.st = 1; best.hitT = now; best.q = q;
      playPiano(best.midi, q === 'PERFECT' ? 1 : 0.85);
      onHit(best, q, now - best.t);
    } else {
      // 빈 건반
      var base = s.laneMeta ? s.laneMeta.bases[lane] : 60;
      playPiano(base, 0.5);
      if (now - s.lastWrong > 0.5) {
        s.lastWrong = now;
        s.combo = 0;
        s.fever = false;
        s.judged++;
        s.lives--;
        setHeartsBreak(s.lives);
        judgeShow('Miss', 'miss');
        s.oopsT = Math.max(s.oopsT, 0.8);
        s.shake = 0.8;
        var p = persp(1);
        burst(L.laneX[lane], p.y, '#ffd0e0', 8, 0.8);
        try { if (navigator.vibrate) navigator.vibrate(10); } catch (e) { }
        if (s.lives <= 0) gameOver();
      }
    }
    updateHud();
  }

  function buildKeys() {
    var lanes = state.lanes;
    keysEl.innerHTML = '';
    var labels = LANE_LABELS[lanes] || LANE_LABELS[4];
    for (var i = 0; i < lanes; i++) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'key';
      b.dataset.lane = String(i);
      b.setAttribute('aria-label', (i + 1) + '번 건반 ' + labels[i]);
      b.innerHTML = '<span class="shine"></span><span class="glyph">♪</span><span class="name">' + labels[i] + '</span>';
      keysEl.appendChild(b);
    }
    bindKeys();
    measure();
  }

  function bindKeys() {
    var kids = keysEl.children;
    for (var i = 0; i < kids.length; i++) {
      (function (el, idx) {
        el.addEventListener('pointerdown', function (e) {
          e.preventDefault();
          pressVisual(el, idx);
          tapLane(idx, true);
        }, { passive: false });
        el.addEventListener('pointerup', function () { el.classList.remove('down'); });
        el.addEventListener('pointercancel', function () { el.classList.remove('down'); });
        el.addEventListener('pointerleave', function () { el.classList.remove('down'); });
        el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      })(kids[i], i);
    }
  }

  function pressVisual(el, idx) {
    el.classList.add('down');
    el.classList.remove('cool');
    var rip = document.createElement('span');
    rip.className = 'ripple';
    el.appendChild(rip);
    setTimeout(function () { if (rip.parentNode) rip.parentNode.removeChild(rip); }, 440);
    clearTimeout(el._dt);
    el._dt = setTimeout(function () { el.classList.remove('down'); }, 110);
  }

  document.addEventListener('keydown', function (e) {
    if (state.mode !== 'playing') return;
    var map = { a: 0, s: 1, d: 2, f: 3, '1': 0, '2': 1, '3': 2, '4': 3, ' ': 0 };
    var k = e.key.toLowerCase();
    if (k in map) {
      e.preventDefault();
      var lane = map[k];
      if (lane < state.lanes) {
        var el = keysEl.children[lane];
        if (el) pressVisual(el, lane);
        tapLane(lane, false);
      }
    }
  });

  /* ══════ 배너 ══════ */
  var bannerTimer = null;
  function showBanner(text) {
    bannerEl.textContent = text;
    bannerEl.classList.remove('show');
    void bannerEl.offsetWidth;
    bannerEl.classList.add('show');
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(function () { bannerEl.classList.remove('show'); }, 1600);
  }

  /* ══════ 게임 시작/종료 ══════ */
  function startGame() {
    var s = state;
    audioInit();
    if (actx && actx.state === 'suspended') { try { actx.resume(); } catch (e) { } }

    s.mode = 'playing';
    s.score = 0; s.combo = 0; s.maxCombo = 0; s.lives = 3;
    s.judged = 0; s.perfect = 0; s.wings = [];
    s.fever = false; s.feverGlow = 0;
    s.lap = 0; s.lapHits = 0; s.climb = 0; s.climbShown = 0;
    s.songTime = 0; s.chartEnd = 0; s.notes = []; s.loops = [];
    s.lastWrong = -9; s.shake = 0; s.flash = 0.4; s.cheer = 0;
    s.stage = 1; s.charLane = (s.lanes - 1) / 2; s.charTarget = (s.lanes - 1) / 2;
    s.hop = 0; s.playT = 0; s.cheerT = 0; s.oopsT = 0; s.pathLanes = [];
    s.bpm = SONGS[s.song].bpm; s.bpmNow = s.bpm;
    s.laneMeta = buildLaneMeta(s.song, s.lanes);
    generateLoop();
    s.lapTotal = s.loops[0].total;
    s.best = s.best || 0;

    hudCache = { score: -1, combo: -1, lives: -1, prog: -1, acc: -1, grade: '', next: '' };
    startScreen.classList.remove('show');
    overScreen.classList.remove('show');
    pauseScreen.classList.remove('show');
    progWrapEl.classList.add('on');
    if (pathBarEl) pathBarEl.classList.add('on');
    updateStageTag();
    comboBoxEl.classList.remove('on');
    judgeEl.className = 'judge';

    var labels = LANE_LABELS[s.lanes];
    songTagEl.textContent = SONGS[s.song].emoji + ' ' + SONGS[s.song].name + ' · ' + gradeOf(100, 0);
    songTagEl.dataset.base = SONGS[s.song].name;
    for (var i = 0; i < heartsEl.children.length; i++) heartsEl.children[i].classList.remove('gone');
    updateHud();
    measure();
    showBanner('출발! 계단을 올라요 ✨');
  }

  function gameOver() {
    var s = state;
    s.mode = 'over';
    progWrapEl.classList.remove('on');
    if (pathBarEl) pathBarEl.classList.remove('on');
    s.cheerT = 0; s.playT = 0;
    s.oopsT = 2.5;
    if (s.score > s.best) {
      s.best = s.score;
      try { localStorage.setItem('woojin_piano_best', String(s.best)); } catch (e) { }
    }
    document.getElementById('overScore').textContent = fmt(s.score);
    document.getElementById('overCombo').textContent = s.maxCombo + '콤보';
    document.getElementById('overBest').textContent = fmt(s.best);
    var title, msg;
    if (s.score >= 3000) { title = '별빛 마스터!'; msg = '구름 성문이 활짝 열렸어요 ✨'; }
    else if (s.score >= 1500) { title = '대단해요!'; msg = '계단을 쭉쭉 올라갔어요 🌈'; }
    else if (s.score >= 600) { title = '잘했어요!'; msg = '다음엔 더 높이 올라가요 ⭐'; }
    else { title = '한 번 더!'; msg = '천천히 눌러도 괜찮아요 🎈'; }
    document.getElementById('overTitle').textContent = title;
    document.getElementById('overMsg').textContent = msg;
    var faceEl = document.querySelector('#overScreen .over-face');
    if (faceEl) faceEl.src = s.score >= 1500 ? 'assets/woojin-cheer.png' : 'assets/woojin-oops.png';
    setTimeout(function () { overScreen.classList.add('show'); }, 420);
  }

  function toMenu() {
    state.mode = 'menu';
    progWrapEl.classList.remove('on');
    if (pathBarEl) pathBarEl.classList.remove('on');
    state.stage = 1;
    updateStageTag();
    comboBoxEl.classList.remove('on');
    overScreen.classList.remove('show');
    pauseScreen.classList.remove('show');
    startScreen.classList.add('show');
    document.getElementById('bestNum').textContent = fmt(state.best);
    state.notes = [];
    state.climb = 0; state.climbShown = 0; state.fever = false;
  }

  function pauseGame() {
    if (state.mode !== 'playing') return;
    state.mode = 'paused';
    pauseScreen.classList.add('show');
  }
  function resumeGame() {
    if (state.mode !== 'paused') return;
    state.mode = 'playing';
    pauseScreen.classList.remove('show');
    lastT = 0;
  }

  /* ══════ UI 바인딩 ══════ */
  function bindUi() {
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('retryBtn').addEventListener('click', function () {
      overScreen.classList.remove('show');
      startGame();
    });
    document.getElementById('menuBtn').addEventListener('click', toMenu);
    document.getElementById('resumeBtn').addEventListener('click', resumeGame);
    document.getElementById('pauseMenuBtn').addEventListener('click', toMenu);
    document.getElementById('pauseBtn').addEventListener('click', pauseGame);

    var muteBtn = document.getElementById('muteToggle');
    if (muteBtn) {
      muteBtn.textContent = muted ? '🔇 소리 켜기' : '🔊 소리 끄기';
      muteBtn.addEventListener('click', function () {
        muted = !muted;
        try { localStorage.setItem('woojin_piano_mute', muted ? '1' : '0'); } catch (e2) { }
        if (master) master.gain.value = muted ? 0 : 0.82;
        muteBtn.textContent = muted ? '🔇 소리 켜기' : '🔊 소리 끄기';
      });
    }

    var songPicker = document.getElementById('songPicker');
    songPicker.addEventListener('click', function (e) {
      var b = e.target.closest('.song');
      if (!b) return;
      var btns = songPicker.querySelectorAll('.song');
      for (var i = 0; i < btns.length; i++) {
        btns[i].classList.remove('is-on');
        btns[i].setAttribute('aria-checked', 'false');
      }
      b.classList.add('is-on');
      b.setAttribute('aria-checked', 'true');
      state.song = b.dataset.song;
      audioInit();
      playPiano(SONGS[state.song].melody[0], 0.7);
    });

    var modePicker = document.getElementById('modePicker');
    modePicker.addEventListener('click', function (e) {
      var b = e.target.closest('.mode-btn');
      if (!b) return;
      var n = parseInt(b.dataset.lanes, 10);
      setLanes(n);
      audioInit();
      playPiano(60, 0.8);
      setTimeout(function () { playPiano(67, 0.7); }, 90);
    });
  }

  function setLanes(n) {
    state.lanes = n;
    var mid = (n - 1) / 2;
    state.charTarget = Math.min(mid, Math.max(0, state.charTarget));
    state.charLane = state.charTarget;
    var btns = document.querySelectorAll('#modePicker .mode-btn');
    for (var i = 0; i < btns.length; i++) {
      var on = parseInt(btns[i].dataset.lanes, 10) === n;
      btns[i].classList.toggle('is-on', on);
      btns[i].setAttribute('aria-checked', on ? 'true' : 'false');
    }
    buildKeys();
  }

  /* ══════ 시작 ══════ */
  function boot() {
    buildStars();
    setLanes(4);
    resize();
    bindUi();
    document.getElementById('bestNum').textContent = fmt(state.best);
    window.addEventListener('resize', function () {
      clearTimeout(window.__rz);
      window.__rz = setTimeout(resize, 120);
    });
    window.addEventListener('orientationchange', function () { setTimeout(resize, 260); });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && state.mode === 'playing') pauseGame();
    });
    requestAnimationFrame(frame);
  }

  // 디버그/E2E 훅
  window.__piano = {
    state: state,
    tap: tapLane,
    pose: currentPose,
    stage: function () { return state.stage; },
    songs: function () { return SONG_ORDER.slice(); },
    sprites: function () {
      var out = {};
      for (var k in spriteSet) out[k] = !!spriteSet[k].ready;
      return out;
    },
    setLanes: setLanes,
    start: startGame,
    toMenu: toMenu,
    nextNote: function (lane) {
      var s = state, best = null;
      for (var i = 0; i < s.notes.length; i++) {
        var n = s.notes[i];
        if (n.st !== 0) continue;
        if (lane !== undefined && n.lane !== lane) continue;
        if (!best || n.t < best.t) best = n;
      }
      return best;
    },
    upcoming: function () {
      var s = state, arr = [];
      for (var i = 0; i < s.notes.length; i++) {
        var n = s.notes[i];
        if (n.st === 0) arr.push({ t: n.t, lane: n.lane, d: n.t - s.songTime });
      }
      arr.sort(function (a, b) { return a.t - b.t; });
      return arr.slice(0, 6);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
