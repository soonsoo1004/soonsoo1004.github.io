/* ══════════════════════════════════════════════════════════════
   도레미 별빛 피아노 · 우진이
   세 가지 놀이
     ① 리듬 건반 모드 — 떨어지는 도·레·미·솔 타일을 박자에 맞춰 연주
     ② 천국의 계단 모드 — 오르기 / 방향전환 두 버튼으로 끝없이 오르기
     ③ 믹스 모드 — 피아노 70 : 계단 30
   음악: 저작권 만료 클래식·전래동요만 Web Audio 피아노 신스로 직접 합성
   외부 음원 0건 · 외부 라이브러리 0건
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var TAU = Math.PI * 2;
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function fmt(n) { try { return n.toLocaleString('ko-KR'); } catch (e) { return String(n); } }
  function hexA(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  function hash(n) {
    var x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  /* ══════ 곡 — 전부 퍼블릭 도메인(작곡자 사망 70년 경과·전래동요) ══════ */
  var SONGS = {
    twinkle: {
      name: '작은별', emoji: '⭐', bpm: 100, stars: 1,
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
      name: '환희의 송가', emoji: '🌅', bpm: 104, stars: 1,
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
    mary: {
      name: '메리의 양', emoji: '🐑', bpm: 112, stars: 1,
      melody: [
        64, 1, 62, 1, 60, 1, 62, 1, 64, 1, 64, 1, 64, 2,
        62, 1, 62, 1, 62, 2, 64, 1, 67, 1, 67, 2,
        64, 1, 62, 1, 60, 1, 62, 1, 64, 1, 64, 1, 64, 1, 64, 1,
        62, 1, 62, 1, 64, 1, 62, 1, 60, 3
      ]
    },
    butterfly: {
      name: '나비야', emoji: '🦋', bpm: 108, stars: 1,
      melody: [
        67, 1, 64, 1, 64, 2, 65, 1, 62, 1, 62, 2,
        60, 1, 62, 1, 64, 1, 65, 1, 67, 1, 67, 1, 67, 2,
        67, 1, 64, 1, 64, 2, 65, 1, 62, 1, 62, 2,
        60, 1, 64, 1, 67, 1, 67, 1, 60, 3
      ]
    },
    macdonald: {
      name: '농장 노래', emoji: '🐄', bpm: 116, stars: 1,
      melody: [
        67, 1, 67, 1, 67, 1, 62, 1, 64, 1, 64, 1, 62, 2,
        71, 1, 71, 1, 69, 1, 69, 1, 67, 3,
        62, 1, 67, 1, 67, 1, 67, 1, 62, 1, 64, 1, 64, 1, 62, 1,
        71, 1, 71, 1, 69, 1, 69, 1, 67, 3
      ]
    },
    london: {
      name: '런던 다리', emoji: '🌉', bpm: 112, stars: 1,
      melody: [
        67, 1, 69, 1, 67, 1, 65, 1, 64, 1, 65, 1, 67, 2,
        62, 1, 64, 1, 65, 2, 64, 1, 65, 1, 67, 2,
        67, 1, 69, 1, 67, 1, 65, 1, 64, 1, 65, 1, 67, 2,
        62, 1, 67, 1, 64, 1, 60, 3
      ]
    },
    lullaby: {
      name: '자장가', emoji: '🌙', bpm: 86, stars: 2,
      melody: [
        64, 1, 64, 1, 67, 2, 64, 1, 64, 1, 67, 2,
        64, 1, 67, 1, 72, 1, 71, 1, 69, 1, 69, 1, 67, 2,
        62, 1, 64, 1, 65, 2, 62, 1, 62, 1, 64, 1, 65, 2,
        62, 1, 65, 1, 71, 1, 69, 1, 67, 3
      ]
    },
    jingle: {
      name: '징글벨', emoji: '🔔', bpm: 118, stars: 2,
      melody: [
        64, 1, 64, 1, 64, 2, 64, 1, 64, 1, 64, 2,
        64, 1, 67, 1, 60, 1, 62, 1, 64, 4,
        65, 1, 65, 1, 65, 1, 65, 1, 65, 1, 64, 1, 64, 1, 64, 1,
        64, 1, 62, 1, 62, 1, 64, 2, 62, 2, 67, 2
      ]
    },
    birthday: {
      name: '생일 축하', emoji: '🎂', bpm: 118, stars: 2,
      melody: [
        67, 0.5, 67, 0.5, 69, 1, 67, 1, 72, 1, 71, 2,
        67, 0.5, 67, 0.5, 69, 1, 67, 1, 74, 1, 72, 2,
        67, 0.5, 67, 0.5, 79, 1, 76, 1, 72, 1, 71, 1, 69, 2,
        65, 0.5, 65, 0.5, 64, 1, 72, 1, 74, 1, 72, 3
      ]
    },
    elise: {
      name: '엘리제를 위하여', emoji: '🌷', bpm: 92, stars: 2,
      melody: [
        76, 0.5, 75, 0.5, 76, 0.5, 75, 0.5, 76, 0.5, 71, 0.5, 74, 0.5, 72, 0.5, 69, 1.5,
        60, 0.5, 64, 0.5, 69, 0.5, 71, 1,
        64, 0.5, 68, 0.5, 71, 0.5, 72, 1,
        76, 0.5, 75, 0.5, 76, 0.5, 75, 0.5, 76, 0.5, 71, 0.5, 74, 0.5, 72, 0.5, 69, 1.5,
        60, 0.5, 64, 0.5, 69, 0.5, 71, 1,
        64, 0.5, 72, 0.5, 71, 1, 69, 2
      ]
    },
    minuet: {
      name: '미뉴에트', emoji: '🎻', bpm: 104, stars: 3,
      melody: [
        74, 1, 67, 1, 69, 1, 71, 1, 72, 1, 74, 1, 67, 2,
        76, 1, 72, 1, 74, 1, 76, 1, 78, 1, 79, 1, 79, 2,
        78, 1, 76, 1, 74, 1, 79, 1, 78, 1, 76, 1,
        74, 1, 76, 1, 78, 1, 74, 3
      ]
    },
    canon: {
      name: '캐논', emoji: '🌈', bpm: 96, stars: 3,
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

  var SONG_ORDER = ['twinkle', 'joy', 'mary', 'butterfly', 'macdonald', 'london',
                    'lullaby', 'jingle', 'birthday', 'elise', 'minuet', 'canon'];

  var STAGES = [
    { name: '첫 걸음', emoji: '🌱' },
    { name: '구름 길', emoji: '☁️' },
    { name: '무지개', emoji: '🌈' },
    { name: '밤하늘', emoji: '🌙' },
    { name: '별의 바다', emoji: '🌠' }
  ];

  /* ══════ 무대 색 — 다섯 가지 동화 배경 ══════ */
  var PALETTES = [
    {
      name: '첫 걸음', emoji: '🌱', night: 0,
      sky: ['#7ec8f5', '#b6e6ff', '#f3f8ff', '#ffe6d2'],
      sun: '255,246,200', sunY: 0.20, cloud: '255,255,255',
      island: '#bfe4d4', islandFar: '#a9d8c8', sea: '238,250,255',
      stepTop: ['#fffaf0', '#ffe7c4'], stepFront: ['#e8cba2', '#c49a68'],
      grass: '#8ad8a0', edge: 'rgba(255,248,222,.95)',
      castle: ['rgba(255,248,238,.92)', 'rgba(244,206,196,.95)', 'rgba(158,196,240,.85)'],
      laneGlow: '150,225,255'
    },
    {
      name: '구름 길', emoji: '☁️', night: 0,
      sky: ['#46b0ee', '#8bd6ff', '#d9f2ff', '#fffbf2'],
      sun: '255,255,235', sunY: 0.14, cloud: '255,255,255',
      island: '#a9dcef', islandFar: '#93cfe6', sea: '236,250,255',
      stepTop: ['#ffffff', '#e7f2ff'], stepFront: ['#cbdcee', '#8fa8c6'],
      grass: '#8ee0b0', edge: 'rgba(255,255,255,.95)',
      castle: ['rgba(255,255,255,.92)', 'rgba(214,236,255,.95)', 'rgba(150,200,240,.8)'],
      laneGlow: '140,220,255'
    },
    {
      name: '무지개', emoji: '🌈', night: 0,
      sky: ['#5470d8', '#9182ea', '#f0a0d4', '#ffcb96'],
      sun: '255,232,170', sunY: 0.26, cloud: '255,240,250',
      island: '#c9a9d9', islandFar: '#b394c9', sea: '253,230,240',
      stepTop: ['#fff3e8', '#ffd7bd'], stepFront: ['#e7b393', '#bd8264'],
      grass: '#93d3a0', edge: 'rgba(255,244,226,.95)',
      castle: ['rgba(255,236,228,.86)', 'rgba(242,182,186,.9)', 'rgba(196,164,232,.8)'],
      laneGlow: '255,190,220'
    },
    {
      name: '밤하늘', emoji: '🌙', night: 1,
      sky: ['#0a0f34', '#1a2867', '#3b4d96', '#7373c2'],
      sun: '255,243,196', sunY: 0.16, cloud: '214,222,255',
      island: '#3e4c86', islandFar: '#334074', sea: '#5a68a8',
      stepTop: ['#eef2ff', '#c8d2f2'], stepFront: ['#8f9cd0', '#6b7ab5'],
      grass: '#7fb6a8', edge: 'rgba(232,240,255,.9)',
      castle: ['rgba(116,136,200,.42)', 'rgba(148,128,198,.46)', 'rgba(216,228,255,.62)'],
      laneGlow: '170,200,255'
    },
    {
      name: '별의 바다', emoji: '🌠', night: 2,
      sky: ['#04030d', '#130a30', '#2a1259', '#4d2070'],
      sun: '255,226,180', sunY: 0.13, cloud: '206,180,255',
      island: '#3a2266', islandFar: '#2c1a52', sea: '#3d2466',
      stepTop: ['#f4e9ff', '#cdb0f0'], stepFront: ['#8a63c0', '#5c3a94'],
      grass: '#9a7ad0', edge: 'rgba(240,225,255,.9)',
      castle: ['rgba(126,98,190,.34)', 'rgba(152,112,220,.38)', 'rgba(230,210,255,.55)'],
      laneGlow: '215,170,255'
    }
  ];
  function palOf(stage) { return PALETTES[(((stage - 1) % PALETTES.length) + PALETTES.length) % PALETTES.length]; }

  /* ══════ 오디오 ══════ */
  var actx = null, master = null, musGain = null, noiseBuf = null, muted = false;
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
    master.gain.value = muted ? 0.0001 : 0.82;
    master.connect(comp);
    comp.connect(actx.destination);
    musGain = actx.createGain();
    musGain.gain.value = 0.0001;
    musGain.connect(master);
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

  /* 한 음을 특정 시각·목적지로 합성한다 (즉시 연주/예약 연주 공용) */
  function voice(midi, vel, when, dest, peak) {
    if (!actx || !dest) return;
    var t0 = Math.max(actx.currentTime, when || actx.currentTime);
    var f = 440 * Math.pow(2, (midi - 69) / 12);
    var dur = clamp(2.5 - (midi - 55) * 0.03, 0.8, 2.6);
    var out = actx.createGain();
    var filt = actx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = Math.min(11500, 1800 + f * 3.4);
    filt.Q.value = 0.44;
    out.gain.setValueAtTime(0.0001, t0);
    out.gain.linearRampToValueAtTime(peak * vel, t0 + 0.006);
    out.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    filt.connect(out);
    out.connect(dest);
    for (var i = 0; i < PARTIALS.length; i++) {
      var p = PARTIALS[i];
      var g = actx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(p[1] * 0.36 * vel * (peak / 0.46), t0 + 0.004);
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
      nsrc.connect(nf); nf.connect(ng); ng.connect(dest);
      nsrc.start(t0);
    }
  }

  function playPiano(midi, vel) {
    if (!actx || muted) return;
    voice(midi, vel === undefined ? 0.9 : vel, actx.currentTime + 0.002, master, 0.46);
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
        o.type = 'sine';
        o.frequency.value = f * 2;
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
    o.frequency.exponentialRampToValueAtTime(110, t0 + 0.16);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(0.15, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + 0.2);
  }

  /* 계단 한 칸 — 짧은 나무 마림바 소리 */
  var BLIP = [0, 2, 4, 7, 9];
  function playBlip(step) {
    if (!actx || muted) return;
    var t0 = actx.currentTime + 0.002;
    var midi = 72 + BLIP[step % BLIP.length] + (Math.floor(step / BLIP.length) % 2) * 12;
    var f = 440 * Math.pow(2, (midi - 69) / 12);
    var o = actx.createOscillator();
    var g = actx.createGain();
    o.type = 'triangle';
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(0.11, t0 + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + 0.24);
  }

  /* 소리 즉시 정지 — 일시정지·홈 복귀 시 잔류음 제거 */
  function audioPanic() {
    if (!actx || !master) return;
    try {
      var t = actx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      master.gain.linearRampToValueAtTime(0.0001, t + 0.04);
    } catch (e) { }
  }
  function audioRestore() {
    if (!actx || !master) return;
    try {
      var t = actx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      master.gain.linearRampToValueAtTime(muted ? 0.0001 : 0.82, t + 0.1);
    } catch (e) { }
  }

  /* ══════ 배경 음악 — 스테이지 곡을 낮게 반복 (천국의 계단 모드) ══════ */
  var MUS = { on: false, timer: null, ptr: 0, nextAt: 0, song: null, beat: 0.5 };

  function musicStart(songId, tempoMul) {
    if (!actx) return;
    musicStop();
    if (!musGain) return;
    var mel = melodyOf(songId);
    if (!mel || !mel.length) return;
    MUS.on = true;
    MUS.song = songId;
    MUS.ptr = 0;
    MUS.beat = 60 / SONGS[songId].bpm / (tempoMul || 1);
    MUS.nextAt = actx.currentTime + 0.2;
    try {
      musGain.gain.cancelScheduledValues(actx.currentTime);
      musGain.gain.setValueAtTime(Math.max(0.0001, musGain.gain.value), actx.currentTime);
      musGain.gain.linearRampToValueAtTime(0.34, actx.currentTime + 0.5);
    } catch (e) { }
    MUS.timer = setInterval(musicTick, 40);
  }

  function musicTick() {
    if (!MUS.on || !actx || !musGain) return;
    var mel = melodyOf(MUS.song);
    if (!mel || !mel.length) return;
    var ahead = actx.currentTime + 0.4;
    var guard = 0;
    while (MUS.nextAt < ahead && guard++ < 16) {
      var n = mel[MUS.ptr % mel.length];
      voice(n.midi, 0.62, MUS.nextAt, musGain, 0.46);
      MUS.nextAt += n.beats * MUS.beat;
      MUS.ptr++;
    }
  }

  function musicStop() {
    MUS.on = false;
    if (MUS.timer) { clearInterval(MUS.timer); MUS.timer = null; }
    if (musGain && actx) {
      try {
        var t = actx.currentTime;
        musGain.gain.cancelScheduledValues(t);
        musGain.gain.setValueAtTime(musGain.gain.value, t);
        musGain.gain.linearRampToValueAtTime(0.0001, t + 0.08);
      } catch (e) { }
    }
  }

  /* ══════ 캔버스 · 화면 요소 ══════ */
  var cv = document.getElementById('stage');
  var ctx = cv.getContext('2d');
  var app = document.getElementById('app');
  var W = 0, H = 0, dpr = 1;
  var bg = document.createElement('canvas');
  var bgx = bg.getContext('2d');
  var bgKey = '';

  var el = {
    pauseBtn: document.getElementById('pauseBtn'),
    hudScore: document.getElementById('hudScore'),
    scoreNum: document.getElementById('scoreNum'),
    hearts: document.getElementById('hearts'),
    floorBadge: document.getElementById('floorBadge'),
    floorNum: document.getElementById('floorNum'),
    stageBadge: document.getElementById('stageBadge'),
    songTag: document.getElementById('songTag'),
    accTag: document.getElementById('accTag'),
    accNum: document.getElementById('accNum'),
    timeGauge: document.getElementById('timeGauge'),
    timeFill: document.getElementById('timeFill'),
    songProg: document.getElementById('songProg'),
    songProgFill: document.getElementById('songProgFill'),
    comboBox: document.getElementById('comboBox'),
    comboNum: document.getElementById('comboNum'),
    judge: document.getElementById('judge'),
    banner: document.getElementById('banner'),
    mixControls: document.getElementById('mixControls'),
    rhythmControls: document.getElementById('rhythmControls'),
    stairsControls: document.getElementById('stairsControls'),
    gauge: document.getElementById('gauge'),
    gaugeFill: document.getElementById('gaugeFill'),
    btnTurn: document.getElementById('btnTurn'),
    btnStTurn: document.getElementById('btnStTurn'),
    btnStUp: document.getElementById('btnStUp'),
    rkeys: [
      document.getElementById('rkey0'), document.getElementById('rkey1'),
      document.getElementById('rkey2'), document.getElementById('rkey3')
    ],
    mkeys: [
      document.getElementById('key0'), document.getElementById('key1'),
      document.getElementById('key2'), document.getElementById('key3')
    ],
    homeScreen: document.getElementById('homeScreen'),
    overScreen: document.getElementById('overScreen'),
    pauseScreen: document.getElementById('pauseScreen'),
    modeRhythm: document.getElementById('modeRhythm'),
    modeStairs: document.getElementById('modeStairs'),
    modeMix: document.getElementById('modeMix'),
    bestRhythm: document.getElementById('bestRhythm'),
    bestStairs: document.getElementById('bestStairs'),
    bestSummary: document.getElementById('bestSummary'),
    songPicker: document.getElementById('songPicker'),
    overTitle: document.getElementById('overTitle'),
    overMsg: document.getElementById('overMsg'),
    overScore: document.getElementById('overScore'),
    overCombo: document.getElementById('overCombo'),
    overStage: document.getElementById('overStage'),
    overRecLbl: document.getElementById('overRecLbl'),
    overBest: document.getElementById('overBest'),
    overBestLine: document.getElementById('overBestLine'),
    overFace: document.querySelector('#overScreen .over-face'),
    retryBtn: document.getElementById('retryBtn'),
    menuBtn: document.getElementById('menuBtn'),
    resumeBtn: document.getElementById('resumeBtn'),
    muteToggle: document.getElementById('muteToggle'),
    pauseMenuBtn: document.getElementById('pauseMenuBtn'),
    pauseMsg: document.getElementById('pauseMsg')
  };

  /* ══════ 이미지 — 동화풍 4포즈 ══════ */
  var SPRITE_DEF = {
    run:   { src: 'assets/woojin-run.png',   ax: 0.50 },
    cheer: { src: 'assets/woojin-cheer.png', ax: 0.50 },
    play:  { src: 'assets/woojin-play.png',  ax: 0.335 },
    oops:  { src: 'assets/woojin-oops.png',  ax: 0.50 }
  };
  var sprites = {};
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
        sprites[k] = rec;
      })(key);
    }
  })();

  function drawSprite(poseKey, x, yBase, h, now, opt) {
    opt = opt || {};
    var rec = sprites[poseKey] || sprites.run;
    var w = h * (rec.ar || 0.46);
    var bob = opt.bob === undefined ? Math.sin(now * 0.004) * 2 : opt.bob;
    ctx.save();
    ctx.globalAlpha = opt.alpha === undefined ? 1 : opt.alpha;
    ctx.translate(x, yBase);
    if (opt.rot) ctx.rotate(opt.rot);
    if (opt.drop) ctx.translate(0, opt.drop);
    ctx.translate(0, bob);
    if (rec.ready) {
      ctx.imageSmoothingQuality = 'high';
      ctx.shadowColor = 'rgba(24, 70, 130, .32)';
      ctx.shadowBlur = Math.max(4, h * 0.09);
      ctx.shadowOffsetY = h * 0.035;
      ctx.drawImage(rec.img, -w * rec.ax, -h, w, h);
    } else {
      ctx.fillStyle = '#cfe8ff';
      rr(ctx, -w / 2, -h, w, h, 10);
      ctx.fill();
    }
    ctx.restore();
    return { w: w, h: h };
  }

  /* ══════ 그리기 도구 ══════ */
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

  function drawCloud(c, x, y, sc, a, warm) {
    c.save();
    c.translate(x, y);
    c.scale(sc, sc);
    c.globalAlpha = a;
    var g = c.createLinearGradient(0, -34, 0, 30);
    if (warm) { g.addColorStop(0, 'rgba(255,252,240,.98)'); g.addColorStop(1, 'rgba(255,226,214,.9)'); }
    else { g.addColorStop(0, 'rgba(255,255,255,.98)'); g.addColorStop(1, 'rgba(226,244,255,.9)'); }
    c.fillStyle = g;
    var blobs = [[-46, 4, 22], [-20, -10, 28], [12, -14, 26], [40, 2, 20], [6, 8, 24], [-24, 10, 20]];
    for (var i = 0; i < blobs.length; i++) {
      c.beginPath();
      c.arc(blobs[i][0], blobs[i][1], blobs[i][2], 0, TAU);
      c.fill();
    }
    c.restore();
  }

  function drawIsland(c, x, y, w, hgt, near) {
    c.save();
    c.translate(x, y);
    var g = c.createLinearGradient(0, -hgt, 0, hgt * 0.6);
    g.addColorStop(0, near ? 'rgba(178,226,206,.95)' : 'rgba(160,208,214,.75)');
    g.addColorStop(1, near ? 'rgba(126,190,178,.9)' : 'rgba(120,170,190,.6)');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(-w / 2, 0);
    c.quadraticCurveTo(-w * 0.36, -hgt, 0, -hgt);
    c.quadraticCurveTo(w * 0.36, -hgt, w / 2, 0);
    c.quadraticCurveTo(w * 0.16, hgt * 0.7, 0, hgt * 0.88);
    c.quadraticCurveTo(-w * 0.16, hgt * 0.7, -w / 2, 0);
    c.closePath();
    c.fill();
    c.strokeStyle = 'rgba(255,255,255,.35)';
    c.lineWidth = 1.2;
    c.stroke();
    c.restore();
  }

  function drawCastle(c, x, y, w, flip, col) {
    var s = w / 150;
    col = col || ['rgba(255,246,236,.9)', 'rgba(240,196,186,.95)', 'rgba(160,190,235,.85)'];
    c.save();
    c.translate(x, y);
    if (flip) c.scale(-1, 1);
    c.fillStyle = col[0];
    c.beginPath();
    c.moveTo(-62 * s, 18 * s);
    c.lineTo(-62 * s, -34 * s);
    c.lineTo(-40 * s, -34 * s);
    c.lineTo(-40 * s, -52 * s);
    c.lineTo(-22 * s, -52 * s);
    c.lineTo(-22 * s, -34 * s);
    c.lineTo(22 * s, -34 * s);
    c.lineTo(22 * s, -52 * s);
    c.lineTo(40 * s, -52 * s);
    c.lineTo(40 * s, -34 * s);
    c.lineTo(62 * s, -34 * s);
    c.lineTo(62 * s, 18 * s);
    c.closePath();
    c.fill();
    c.fillStyle = col[1];
    c.beginPath();
    c.ellipse(0, -52 * s, 26 * s, 10 * s, 0, Math.PI, 0);
    c.fill();
    c.fillStyle = col[2];
    for (var i = -1; i <= 1; i++) {
      c.beginPath();
      c.arc(i * 24 * s, -12 * s, 5 * s, 0, TAU);
      c.fill();
    }
    c.restore();
  }

  function drawBalloon(c, x, y, s, now) {
    c.save();
    c.translate(x, y);
    c.rotate(Math.sin((now || 0) * 0.0006) * 0.05);
    c.strokeStyle = 'rgba(120, 90, 60, .5)';
    c.lineWidth = 1.2 * s;
    c.beginPath();
    c.moveTo(-9 * s, 22 * s); c.lineTo(-6 * s, 38 * s);
    c.moveTo(9 * s, 22 * s); c.lineTo(6 * s, 38 * s);
    c.stroke();
    c.fillStyle = '#c98a52';
    rr(c, -7 * s, 37 * s, 14 * s, 11 * s, 3 * s);
    c.fill();
    var g = c.createLinearGradient(-22 * s, 0, 22 * s, 0);
    g.addColorStop(0, '#ffb3d1');
    g.addColorStop(0.5, '#ff87b6');
    g.addColorStop(1, '#f26a9d');
    c.fillStyle = g;
    c.beginPath();
    c.ellipse(0, 4 * s, 22 * s, 26 * s, 0, 0, TAU);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,.55)';
    c.beginPath();
    c.ellipse(-7 * s, 4 * s, 5 * s, 25 * s, 0, 0, TAU);
    c.fill();
    c.restore();
  }

  var starField = [];
  function buildStars() {
    starField = [];
    for (var i = 0; i < 40; i++) {
      starField.push({
        x: Math.random(), y: Math.random() * 0.62,
        r: rnd(0.7, 2.1), ph: rnd(0, TAU), sp: rnd(0.6, 1.8)
      });
    }
  }

  /* 배경 — 스테이지 색으로 한 번 그려 두고 매 프레임 사용 */
  function paintBg(stage, force) {
    var pal = palOf(stage);
    var key = stage + '|' + W + 'x' + H + '|' + dpr;
    if (!force && key === bgKey) return;
    bgKey = key;
    bg.width = Math.max(1, Math.round(W * dpr));
    bg.height = Math.max(1, Math.round(H * dpr));
    var c = bgx;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, W, H);

    var g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, pal.sky[0]);
    g.addColorStop(0.42, pal.sky[1]);
    g.addColorStop(0.74, pal.sky[2]);
    g.addColorStop(1, pal.sky[3]);
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);

    // 해 / 달
    var sy = H * pal.sunY;
    var rad = Math.min(W, H) * 0.14;
    var sg = c.createRadialGradient(W * 0.5, sy, 2, W * 0.5, sy, rad * 2.4);
    sg.addColorStop(0, 'rgba(' + pal.sun + ',.95)');
    sg.addColorStop(0.32, 'rgba(' + pal.sun + ',.42)');
    sg.addColorStop(1, 'rgba(' + pal.sun + ',0)');
    c.fillStyle = sg;
    c.fillRect(0, 0, W, H * 0.62);
    c.fillStyle = 'rgba(' + pal.sun + ',.92)';
    c.beginPath();
    c.arc(W * 0.5, sy, rad * 0.66, 0, TAU);
    c.fill();

    // 반짝이 — 밤/우주
    if (pal.night) {
      for (var i = 0; i < starField.length; i++) {
        var st = starField[i];
        var al = (pal.night === 2 ? 0.35 : 0.22) + 0.55 * Math.abs(Math.sin(st.ph));
        c.fillStyle = 'rgba(255,255,255,' + al.toFixed(3) + ')';
        c.beginPath();
        c.arc(st.x * W, st.y * H, st.r, 0, TAU);
        c.fill();
      }
    }

    // 먼 섬들
    var hz = H * 0.70;
    drawIsland(c, W * 0.16, hz - 6, W * 0.46, H * 0.055, false);
    drawIsland(c, W * 0.85, hz + 4, W * 0.42, H * 0.05, false);
    drawIsland(c, W * 0.52, hz - 16, W * 0.22, H * 0.03, false);

    // 구름 바다
    drawCloud(c, W * 0.10, hz + 16, 1.9, 0.5, true);
    drawCloud(c, W * 0.55, hz + 26, 2.2, 0.55, true);
    drawCloud(c, W * 0.94, hz + 8, 1.8, 0.48, true);
    var hzg = c.createLinearGradient(0, hz - H * 0.02, 0, H);
    hzg.addColorStop(0, hexA(pal.sea, 0));
    hzg.addColorStop(1, hexA(pal.sea, 0.55));
    c.fillStyle = hzg;
    c.fillRect(0, hz - H * 0.02, W, H);

    // 동화 성 — 좌우 위쪽
    drawCastle(c, W * 0.13, H * 0.30, W * 0.30, false, pal.castle);
    drawCastle(c, W * 0.87, H * 0.36, W * 0.26, true, pal.castle);
    drawCastle(c, W * 0.05, H * 0.19, W * 0.17, false, pal.castle);
  }

  function renderBg(now) {
    ctx.drawImage(bg, 0, 0, W, H);
    var pal = palOf(S.stage);
    var drift = (now * 0.012) % (W + 420) - 210;
    drawCloud(ctx, drift, H * 0.115, 1.15, pal.night ? 0.2 : 0.3);
    drawCloud(ctx, W - drift * 0.75, H * 0.20, 0.9, pal.night ? 0.16 : 0.24);
    drawCloud(ctx, drift * 0.6 + W * 0.3, H * 0.055, 0.7, 0.2);
    if (pal.night) {
      for (var i = 0; i < starField.length; i += 3) {
        var st = starField[i];
        var al = 0.2 + 0.6 * Math.abs(Math.sin(now * 0.0012 * st.sp + st.ph));
        ctx.fillStyle = 'rgba(255,255,255,' + al.toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(st.x * W, st.y * H, st.r * 1.2, 0, TAU);
        ctx.fill();
      }
    }
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

  /* ══════ 상태 ══════ */
  var S = {
    screen: 'home',
    mode: 'rhythm',
    startSong: 'twinkle',
    stage: 1,
    song: 'twinkle',
    score: 0, combo: 0, maxCombo: 0, hearts: 3, floor: 0,
    perfect: 0, judged: 0,
    fever: false, shake: 0, flash: 0,
    hopT: 0, fallT: 0, oopsT: 0, cheerT: 0, playT: 0,
    elapsed: 0,
    best: { rhythm: 0, stairs: 0, mix: 0 },
    bestFloor: 0
  };
  try {
    S.best.rhythm = parseInt(localStorage.getItem('woojin_piano_best_rhythm') || '0', 10) || 0;
    S.best.stairs = parseInt(localStorage.getItem('woojin_piano_best_stairs') || '0', 10) || 0;
    S.best.mix = parseInt(localStorage.getItem('woojin_piano_best_mix') || '0', 10) || 0;
    S.bestFloor = parseInt(localStorage.getItem('woojin_piano_best_floor') || '0', 10) || 0;
  } catch (e) { }

  var L = { cx: 0, nearY: 0, fieldBottom: 0, laneX: 0, laneW: 0, laneTop: 0, hitY: 0, stageY: 0 };

  var LANES = [
    { syl: '도', midi: 60, rgb: '86,158,240', hex: '#569ef0' },
    { syl: '레', midi: 62, rgb: '86,206,196', hex: '#56cec4' },
    { syl: '미', midi: 64, rgb: '240,180,90', hex: '#f0b45a' },
    { syl: '솔', midi: 67, rgb: '186,140,232', hex: '#ba8ce8' }
  ];
  function laneOfPitch(midi) {
    var pc = ((midi % 12) + 12) % 12, best = 0, bd = 99;
    for (var i = 0; i < LANES.length; i++) {
      var d = Math.abs(pc - (LANES[i].midi % 12));
      if (d > 6) d = 12 - d;
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }

  var MEL = {};
  function melodyOf(id) {
    if (MEL[id]) return MEL[id];
    var flat = SONGS[id].melody, out = [];
    for (var i = 0; i < flat.length; i += 2) out.push({ midi: flat[i], beats: flat[i + 1] });
    MEL[id] = out;
    return out;
  }
  function songAt(stage) { return SONG_ORDER[(stage - 1) % SONG_ORDER.length]; }
  var SOLFA = ['도', '도♯', '레', '레♯', '미', '파', '파♯', '솔', '솔♯', '라', '라♯', '시'];
  function noteNameOf(m) { return SOLFA[((m % 12) + 12) % 12]; }

  /* ══════ 레이아웃 ══════ */
  function activeControls() {
    if (S.mode === 'rhythm') return el.rhythmControls;
    if (S.mode === 'stairs') return el.stairsControls;
    return el.mixControls;
  }
  function measure() {
    var ctrlEl = activeControls();
    var r = null;
    if (ctrlEl && ctrlEl.offsetParent !== null) r = ctrlEl.getBoundingClientRect();
    if (!r || r.height < 20) {
      r = { top: H - (S.mode === 'stairs' ? 118 : (S.mode === 'rhythm' ? 130 : 176)) };
    }
    L.fieldBottom = r.top;
    L.nearY = L.fieldBottom - 66;
    L.cx = W / 2;
    var hudB = el.hudScore.getBoundingClientRect().bottom || 56;
    L.laneTop = hudB + 52;
    L.laneX = 12;
    L.laneW = (W - 24) / 4;
    L.hitY = L.fieldBottom - 104;
    if (L.hitY - L.laneTop < 210) L.hitY = Math.min(L.fieldBottom - 60, L.laneTop + 210);
    L.stageY = L.fieldBottom - 4;
  }

  function resize() {
    dpr = Math.min(2.5, window.devicePixelRatio || 1);
    W = app.clientWidth || window.innerWidth;
    H = app.clientHeight || window.innerHeight;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    cv.style.width = W + 'px';
    cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    measure();
    paintBg(S.stage, true);
  }

  /* ══════ 화면 전환 ══════ */
  function setScreen(s) {
    S.screen = s;
    app.setAttribute('data-screen', s);
  }
  function setMode(m) {
    S.mode = m;
    app.setAttribute('data-mode', m);
  }

  /* ══════ HUD ══════ */
  var hudCache = {};
  function updateHud() {
    if (hudCache.score !== S.score) {
      hudCache.score = S.score;
      el.scoreNum.textContent = fmt(S.score);
      el.scoreNum.classList.remove('pop');
      void el.scoreNum.offsetWidth;
      el.scoreNum.classList.add('pop');
    }
    if (hudCache.combo !== S.combo) {
      hudCache.combo = S.combo;
      el.comboNum.textContent = S.combo;
      el.comboBox.classList.toggle('on', S.combo > 0);
      el.comboNum.classList.remove('bump');
      void el.comboNum.offsetWidth;
      el.comboNum.classList.add('bump');
    }
    if (hudCache.hearts !== S.hearts) {
      hudCache.hearts = S.hearts;
      var hs = el.hearts.children;
      for (var i = 0; i < hs.length; i++) hs[i].classList.toggle('gone', i >= S.hearts);
    }
    var acc = S.judged ? Math.round(S.perfect / S.judged * 100) : 100;
    if (hudCache.acc !== acc) { hudCache.acc = acc; el.accNum.textContent = acc; }
    if (hudCache.stage !== S.stage || hudCache.song !== S.song) {
      hudCache.stage = S.stage;
      hudCache.song = S.song;
      var info = STAGES[Math.min(STAGES.length, S.stage) - 1];
      el.stageBadge.textContent = 'STAGE ' + S.stage + ' ' + info.emoji;
      el.stageBadge.classList.toggle('pro', S.stage >= 4);
      el.songTag.textContent = SONGS[S.song].emoji + ' ' + SONGS[S.song].name;
    }
    if (S.mode === 'stairs') {
      var fl = Math.max(S.floor || 0, ST.floor);
      if (hudCache.floor !== fl) { hudCache.floor = fl; el.floorNum.textContent = fl; }
      var pct = clamp(ST.time / ST.timeMax, 0, 1) * 100;
      if (Math.abs(pct - (hudCache.time || -1)) > 0.4) {
        hudCache.time = pct;
        el.timeFill.style.width = pct.toFixed(1) + '%';
        el.timeGauge.classList.toggle('low', pct < 30);
        el.timeGauge.classList.toggle('warn', pct >= 30 && pct < 58);
      }
    }
    if (S.mode === 'rhythm') {
      var pr = clamp(RH.t / Math.max(0.1, RH.endT), 0, 1) * 100;
      if (Math.abs(pr - (hudCache.prog || -1)) > 0.6) {
        hudCache.prog = pr;
        el.songProgFill.style.width = pr.toFixed(1) + '%';
      }
    }
    if (S.mode === 'mix') {
      var gp = clamp(MX.timeLeft / Math.max(0.01, MX.timeLimit), 0, 1) * 100;
      if (Math.abs(gp - (hudCache.gauge || -1)) > 0.6) {
        hudCache.gauge = gp;
        el.gaugeFill.style.width = gp.toFixed(1) + '%';
        el.gauge.classList.toggle('low', gp < 30);
      }
    }
  }

  /* 버튼 불빛 — 지금 눌러야 하는 곳 */
  function hintKeys(list) {
    for (var i = 0; i < el.rkeys.length; i++) {
      if (el.rkeys[i]) el.rkeys[i].classList.toggle('hint', list.indexOf('r' + i) >= 0);
      if (el.mkeys[i]) el.mkeys[i].classList.toggle('hint', list.indexOf('m' + i) >= 0);
    }
    if (el.btnTurn) el.btnTurn.classList.toggle('hint', list.indexOf('turn') >= 0);
    if (el.btnStTurn) el.btnStTurn.classList.toggle('hint', list.indexOf('sturn') >= 0);
    if (el.btnStUp) el.btnStUp.classList.toggle('hint', list.indexOf('sup') >= 0);
  }

  var bannerTimer = null;
  function showBanner(text) {
    el.banner.textContent = text;
    el.banner.classList.remove('show');
    void el.banner.offsetWidth;
    el.banner.classList.add('show');
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(function () { el.banner.classList.remove('show'); }, 1500);
  }
  function judgeShow(text, cls) {
    el.judge.textContent = text;
    el.judge.className = 'judge ' + cls;
    void el.judge.offsetWidth;
    el.judge.classList.add('show');
  }
  function vibrate(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { } }

  /* ══════════════════════════════════════════════════════════
     ① 리듬 건반 모드 — 떨어지는 타일을 박자에 맞춰
     ══════════════════════════════════════════════════════════ */
  var RH = {
    t: 0, notes: [], ptr: 0, endT: 1, approach: 1.6, beatSec: 0.6,
    keyFx: [0, 0, 0, 0], clearT: 0
  };

  function rhythmBuild(songId) {
    var mel = melodyOf(songId);
    var faster = Math.pow(1.06, S.stage - 1);
    var beatSec = (60 / SONGS[songId].bpm) / faster;
    var out = [], t = 1.3;
    for (var i = 0; i < mel.length; i++) {
      out.push({ t: t, lane: laneOfPitch(mel[i].midi), midi: mel[i].midi, hit: 0, burstT: 0 });
      t += mel[i].beats * beatSec;
    }
    RH.notes = out;
    RH.ptr = 0;
    RH.t = 0;
    RH.endT = t + 1.0;
    RH.beatSec = beatSec;
    RH.approach = clamp(1.6 - (S.stage - 1) * 0.08, 0.75, 1.6);
    RH.keyFx = [0, 0, 0, 0];
    RH.clearT = 0;
  }

  function rhythmStart() {
    S.stage = 1; S.song = S.startSong;
    rhythmBuild(S.song);
    paintBg(S.stage, true);
    updateHud();
    showBanner('리듬 건반! 내려오는 건반을 톡톡 🎹');
  }

  function rhythmPress(lane) {
    if (S.screen !== 'play') return;
    audioInit();
    RH.keyFx[lane] = 1;
    var n = RH.notes[RH.ptr];
    if (!n) return;
    var dt = n.t - RH.t;
    if (dt > 0.5) return;               // 아직 멀었다 — 벌점 없음
    if (dt < -0.5) return;
    if (n.lane !== lane) { rhythmMiss(true); return; }
    rhythmHit(n, Math.abs(dt));
  }

  function rhythmHit(n, adt) {
    var perfect = adt <= 0.22;
    n.hit = perfect ? 2 : 1;
    RH.ptr++;
    playPiano(n.midi, 1);
    S.combo++;
    if (S.combo > S.maxCombo) S.maxCombo = S.combo;
    S.judged++;
    if (perfect) S.perfect++;
    var pts = (perfect ? 120 : 70) + Math.min(S.combo, 25) * 3;
    S.score += Math.round(pts * (S.fever ? 2 : 1));
    if (!S.fever && S.combo >= 10) {
      S.fever = true;
      S.cheerT = 1.1;
      showBanner('피버 타임! 점수 2배 🌈');
      playSparkle(76);
    }
    var x = L.laneX + L.laneW * (n.lane + 0.5);
    burst(x, L.hitY, LANES[n.lane].hex, perfect ? 16 : 9, 1);
    burst(x, L.hitY, '#ffffff', 6, 0.7);
    judgeShow(perfect ? 'Perfect!' : 'Good!', perfect ? 'perfect' : 'great');
    vibrate(perfect ? 12 : 8);
    updateHud();
  }

  function rhythmMiss(wrong) {
    var n = RH.notes[RH.ptr];
    if (!n) return;
    n.hit = -1;
    RH.ptr++;
    S.combo = 0;
    S.fever = false;
    S.hearts--;
    S.judged++;
    S.shake = 0.7;
    playThud();
    judgeShow(wrong ? '아차!' : '놓쳤어요', 'miss');
    vibrate([12, 40, 18]);
    var x = L.laneX + L.laneW * (n.lane + 0.5);
    burst(x, L.hitY, '#ff9ec4', 14, 1.1);
    updateHud();
    if (S.hearts <= 0) gameOver();
  }

  function rhythmUpdate(dt) {
    RH.t += dt;
    for (var i = 0; i < 4; i++) RH.keyFx[i] = Math.max(0, RH.keyFx[i] - dt * 4);
    var n = RH.notes[RH.ptr];
    if (n && RH.t - n.t > 0.5) {
      rhythmMiss(false);
      if (S.screen !== 'play') return;
    }
    // 마지막 음까지 처리되면 잠깐 뒤 다음 판으로
    if (S.screen === 'play') {
      var lastNote = RH.notes[RH.notes.length - 1];
      var allDone = RH.ptr >= RH.notes.length;
      var deadline = allDone ? lastNote.t + 0.55 : RH.endT;
      if (RH.t > deadline) rhythmStageClear();
    }
    // 다음에 칠 건반 불빛
    var nx = RH.notes[RH.ptr];
    hintKeys(nx ? ['r' + nx.lane] : []);
    updateHud();
  }

  function rhythmStageClear() {
    S.stage++;
    S.song = songAt(S.stage);
    S.score += 400 + S.stage * 120;
    S.flash = 0.5;
    S.cheerT = 1.4;
    S.hearts = Math.min(3, S.hearts + 1);
    playSparkle(72 + (S.stage % 5) * 2);
    rhythmBuild(S.song);
    paintBg(S.stage, true);
    showBanner('STAGE ' + S.stage + ' · ' + SONGS[S.song].name + ' ' + STAGES[Math.min(S.stage, 5) - 1].emoji);
    hudCache.stage = -1; hudCache.song = '';
    updateHud();
  }

  /* 리듬 화면 그리기 */
  function rhythmRender(now) {
    var top = L.laneTop, hit = L.hitY, w = L.laneW, x0 = L.laneX;
    var pal = palOf(S.stage);

    // 레인 바탕
    for (var i = 0; i < 4; i++) {
      var lx = x0 + i * w;
      var g = ctx.createLinearGradient(0, top, 0, hit);
      g.addColorStop(0, 'rgba(10, 26, 62, .30)');
      g.addColorStop(0.55, 'rgba(12, 30, 70, .16)');
      g.addColorStop(1, 'rgba(' + LANES[i].rgb + ', .22)');
      ctx.fillStyle = g;
      ctx.fillRect(lx + 2, top, w - 4, hit - top);
      // 좌우 구분선
      if (i > 0) {
        ctx.strokeStyle = 'rgba(255,255,255,.16)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(lx, top + 4);
        ctx.lineTo(lx, hit);
        ctx.stroke();
      }
      // 바닥 빛
      var lg = ctx.createRadialGradient(lx + w / 2, hit, 2, lx + w / 2, hit, w * 0.9);
      lg.addColorStop(0, 'rgba(' + LANES[i].rgb + ', .42)');
      lg.addColorStop(1, 'rgba(' + LANES[i].rgb + ', 0)');
      ctx.fillStyle = lg;
      ctx.fillRect(lx, hit - w * 0.8, w, w * 0.9);
    }

    // 좌우 테두리
    ctx.strokeStyle = 'rgba(255,255,255,.22)';
    ctx.lineWidth = 2;
    rr(ctx, x0, top, w * 4, hit - top, 14);
    ctx.stroke();

    // 레인 이름은 하단 건반에 있으므로 생략 — 대신 레인 사이 구분선만

    // 다음 타일 유도선 + 타일 (레인 안쪽만 그리기)
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0, top, w * 4, (hit - top) + 34);
    ctx.clip();

    var nx = RH.notes[RH.ptr];
    if (nx) {
      var nxX = x0 + w * (nx.lane + 0.5);
      var ny = hit - ((nx.t - RH.t) / RH.approach) * (hit - top);
      ny = clamp(ny, top - 20, hit);
      var beam = ctx.createLinearGradient(0, ny, 0, hit);
      beam.addColorStop(0, 'rgba(' + LANES[nx.lane].rgb + ', .30)');
      beam.addColorStop(1, 'rgba(' + LANES[nx.lane].rgb + ', 0)');
      ctx.fillStyle = beam;
      ctx.fillRect(nxX - w * 0.30, ny, w * 0.60, Math.max(0, hit - ny));
    }

    // 타일
    var last = RH.notes.length;
    for (var k = Math.max(0, RH.ptr - 2); k < last; k++) {
      var n = RH.notes[k];
      var dy = n.t - RH.t;
      if (dy > RH.approach + 0.2) break;
      if (dy < -0.5) continue;
      var y = hit - (dy / RH.approach) * (hit - top);
      var alpha = 1;
      if (n.hit === -1) alpha = clamp(1 + dy / 0.5, 0, 0.4);
      if (dy < 0) alpha *= clamp(1 + dy / 0.2, 0, 1);
      if (n.hit > 0) continue;
      drawRhythmTile(x0 + w * (n.lane + 0.5), y, w, n, alpha);
    }
    ctx.restore();

    // 판정선
    ctx.save();
    ctx.shadowColor = 'rgba(180,240,255,.95)';
    ctx.shadowBlur = 16;
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    rr(ctx, x0 + 3, hit - 2.5, w * 4 - 6, 5, 3);
    ctx.fill();
    ctx.restore();
    for (var j = 0; j < 4; j++) {
      var cx2 = x0 + w * (j + 0.5);
      var fx = RH.keyFx[j];
      ctx.save();
      ctx.globalAlpha = 0.5 + 0.5 * (1 - fx);
      ctx.fillStyle = 'rgba(' + LANES[j].rgb + ', .95)';
      ctx.shadowColor = 'rgba(' + LANES[j].rgb + ', .95)';
      ctx.shadowBlur = 10 + 18 * fx;
      ctx.beginPath();
      ctx.ellipse(cx2, hit, w * (0.16 + 0.1 * fx), 6 + 3 * fx, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    // 무대 위 우진이
    var stageH = Math.max(52, Math.min(104, L.fieldBottom - hit - 6));
    var pose = S.cheerT > 0 ? 'cheer' : (S.oopsT > 0 ? 'oops' : 'play');
    var bob = S.screen === 'play' ? Math.sin(now * 0.005) * 2.4 : 0;
    var sx = W / 2, sy = L.fieldBottom + 2;
    var glow = ctx.createRadialGradient(sx, sy - stageH * 0.35, 4, sx, sy - stageH * 0.35, stageH * 0.95);
    glow.addColorStop(0, 'rgba(255,255,235,.34)');
    glow.addColorStop(1, 'rgba(255,255,235,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(sx, sy - stageH * 0.35, stageH * 0.95, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(12,28,66,.20)';
    rr(ctx, sx - stageH * 0.5, sy - 8, stageH, 10, 6);
    ctx.fill();
    drawSprite(pose, sx, sy, stageH, now, { bob: bob });

    // 흐르는 음표
    for (var m = 0; m < 3; m++) {
      var ph = ((now * 0.00035) + m * 0.33) % 1;
      ctx.save();
      ctx.globalAlpha = (1 - ph) * 0.5;
      ctx.fillStyle = '#fffbe6';
      ctx.font = '900 ' + Math.round(14 + m * 3) + 'px ' + '"Apple SD Gothic Neo", sans-serif';
      ctx.fillText('♪', sx + Math.sin(ph * 6 + m) * 40 + (m - 1) * 26, sy - stageH * 0.5 - ph * 70);
      ctx.restore();
    }
  }

  function drawRhythmTile(x, y, laneW, n, alpha) {
    var w = laneW * 0.86, h = clamp(laneW * 0.66, 34, 62);
    var rgb = LANES[n.lane].rgb;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = 'rgba(' + rgb + ', .95)';
    ctx.shadowBlur = 16;
    var g = ctx.createLinearGradient(0, y - h / 2, 0, y + h / 2);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.55, 'rgba(' + rgb + ', .30)');
    g.addColorStop(1, 'rgba(' + rgb + ', .72)');
    ctx.fillStyle = g;
    rr(ctx, x - w / 2, y - h / 2, w, h, 10);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,.92)';
    ctx.lineWidth = 2;
    rr(ctx, x - w / 2, y - h / 2, w, h, 10);
    ctx.stroke();
    // 검은 건반
    ctx.fillStyle = 'rgba(24,22,52,.86)';
    rr(ctx, x - w * 0.16, y - h / 2 + 2, w * 0.32, h * 0.42, 3);
    ctx.fill();
    // 계이름
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 ' + Math.round(h * 0.5) + 'px "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
    ctx.fillStyle = '#1d3f6b';
    ctx.fillText(LANES[n.lane].syl, x, y + h * 0.26);
    ctx.restore();
  }

  /* ══════════════════════════════════════════════════════════
     ② 천국의 계단 모드 — 오르기 / 방향전환
     ══════════════════════════════════════════════════════════ */
  var ST = {
    steps: [], charIdx: 0, dir: 1, sinceTurn: 0, wx: 0,
    time: 100, timeMax: 100, drain: 7.0, floor: 0,
    hopT: 0, fallT: 0, over: false, timer: null
  };

  function stairsPush() {
    var turn = false;
    if (ST.steps.length > 2) {
      ST.sinceTurn++;
      var chance = clamp(0.24 + (S.stage - 1) * 0.025, 0.24, 0.42);
      if (ST.sinceTurn >= 5) turn = true;
      else if (ST.sinceTurn >= 2 && Math.random() < chance) turn = true;
      if (turn) { ST.dir = -ST.dir; ST.sinceTurn = 0; }
    }
    ST.wx += ST.dir;
    ST.steps.push({ k: ST.steps.length, dir: ST.dir, turn: turn, wx: ST.wx, fx: 0 });
  }

  function stairsReset() {
    ST.steps = [{ k: 0, dir: 1, turn: false, wx: 0, fx: 0 }];
    ST.dir = 1; ST.sinceTurn = 0; ST.wx = 0; ST.charIdx = 0; ST.floor = 0;
    ST.hopT = 0; ST.fallT = 0; ST.over = false;
    ST.cam = 0;
    for (var i = 0; i < 14; i++) stairsPush();
    ST.timeMax = 100;
    ST.time = 100;
    ST.drain = 7.0;
  }

  function stairsStart() {
    stairsReset();
    S.stage = 1; S.song = S.startSong;
    paintBg(S.stage, true);
    musicStart(S.song, 1);
    updateHud();
    showBanner('계단을 올라요! ⬆ / 꺾이면 ↺');
  }

  function stairsPress(action) {
    if (S.screen !== 'play' || ST.over) return;
    audioInit();
    var next = ST.steps[ST.charIdx + 1];
    if (!next) return;
    var need = next.turn ? 'turn' : 'up';
    if (action !== need) { stairsFall('step'); return; }

    ST.charIdx++;
    ST.floor = ST.charIdx;
    S.floor = ST.floor;
    ST.hopT = 1;
    next.fx = 1;
    stairsPush();
    S.combo++;
    if (S.combo > S.maxCombo) S.maxCombo = S.combo;
    S.score += 10 + Math.min(S.combo, 30) + (S.stage - 1) * 2 + (next.turn ? 6 : 0);
    ST.time = Math.min(ST.timeMax, ST.time + (next.turn ? 3.6 : 2.7) + Math.min(S.combo, 20) * 0.05);
    playBlip(S.combo);
    var p = pathScreen(ST, ST.charIdx);
    burst(p.x, p.y - 6, next.turn ? '#ff9ed8' : '#9fe6ff', next.turn ? 12 : 6, 0.8);
    if (S.combo > 0 && S.combo % 10 === 0) {
      S.cheerT = 0.9;
      playSparkle(74 + (S.combo % 5) * 2);
      judgeShow(S.combo + ' 콤보!', 'perfect');
    }
    if (ST.floor > 0 && ST.floor % 18 === 0) stairsStage();
    updateHud();
  }

  function stairsStage() {
    S.stage++;
    S.song = songAt(S.stage);
    S.score += 120 * S.stage;
    S.flash = 0.5;
    S.cheerT = 1.4;
    ST.timeMax = Math.min(100, ST.timeMax + 6);
    ST.time = ST.timeMax;
    ST.drain = 7.0 + (S.stage - 1) * 0.55;
    paintBg(S.stage, true);
    musicStart(S.song, 1 + (S.stage - 1) * 0.06);
    showBanner('STAGE ' + S.stage + ' · ' + SONGS[S.song].name + ' ' + STAGES[Math.min(S.stage, 5) - 1].emoji);
    hudCache.stage = -1; hudCache.song = '';
    updateHud();
  }

  function stairsFall(reason) {
    if (ST.over) return;
    ST.over = true;
    S.endReason = reason;
    ST.fallT = 1;
    S.fallT = 1;
    S.oopsT = 1.7;
    S.combo = 0;
    S.shake = 1;
    playThud();
    musicStop();
    judgeShow(reason === 'time' ? '시간 초과!' : '아차!', 'miss');
    vibrate([14, 44, 20]);
    var p = pathScreen(ST, ST.charIdx);
    burst(p.x, p.y, '#ff9ec4', 16, 1.1);
    clearTimeout(ST.timer);
    ST.timer = setTimeout(function () {
      if (S.screen === 'play' && S.mode === 'stairs' && ST.over) stairsGameOver(reason);
    }, 980);
  }

  function stairsGameOver(reason) {
    if (S.screen !== 'play') return;
    gameOver();
  }

  function stairsUpdate(dt) {
    ST.hopT = Math.max(0, ST.hopT - dt * 6.4);
    ST.fallT = Math.max(0, ST.fallT - dt * 1.1);
    updateCam(ST, dt);
    for (var i = 0; i < ST.steps.length; i++) if (ST.steps[i].fx > 0) ST.steps[i].fx = Math.max(0, ST.steps[i].fx - dt * 2.2);
    if (ST.over) { updateHud(); return; }
    ST.time -= (ST.drain + S.combo * 0.02) * dt;
    if (ST.time <= 0) { ST.time = 0; stairsFall('time'); }
    // 다음에 누를 버튼
    var nx = ST.steps[ST.charIdx + 1];
    hintKeys(nx ? (nx.turn ? ['sturn'] : ['sup']) : []);
    updateHud();
  }

  /* 계단 화면 그리기 */
  function stairsRender(now) {
    var top = Math.min(ST.steps.length - 1, ST.charIdx + 10);
    var k;
    for (k = top; k >= Math.max(0, ST.charIdx - 2); k--) drawStairStep(k, now);
    // 다음 계단 안내
    drawStairHint(now);
    // 우진이
    var hop = clamp(ST.hopT, 0, 1);
    var a = pathScreen(ST, Math.max(0, ST.charIdx - 1)), b = pathScreen(ST, ST.charIdx);
    var t = 1 - hop;
    var x = lerp(a.x, b.x, easeOut(t));
    var y = lerp(a.y, b.y, easeOut(t)) - Math.sin(Math.PI * hop) * 30 * b.s;
    var sc = lerp(a.s, b.s, t);
    var h = 116 * sc;
    var pose = ST.fallT > 0 ? 'oops' : (S.cheerT > 0 ? 'cheer' : (S.playT > 0 ? 'play' : 'run'));
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = 'rgba(20, 60, 120, .85)';
    ctx.beginPath();
    ctx.ellipse(b.x, b.y + 6 * b.s, h * 0.20, 6 * b.s, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
    if (ST.fallT > 0) {
      var ft = 1 - clamp(ST.fallT, 0, 1);
      drawSprite(pose, x, y, h, now, { drop: ft * 90, rot: ft * 0.65, alpha: clamp(1 - ft * 0.35, 0.5, 1), bob: 0 });
    } else {
      drawSprite(pose, x, y, h, now, { bob: S.screen === 'play' ? Math.sin(now * 0.006) * 1.6 * sc : Math.sin(now * 0.0035) * 3 });
    }
    // 피버 왕관
    if (S.fever || pose === 'cheer') {
      ctx.save();
      ctx.translate(x, y - h - 3);
      ctx.rotate(Math.sin(now * 0.004) * 0.12);
      var cs = Math.max(0.42, 0.9 * sc);
      ctx.scale(cs, cs);
      ctx.fillStyle = '#ffd84a';
      ctx.shadowColor = 'rgba(255, 210, 60, .95)';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(-15, 6); ctx.lineTo(-15, -8); ctx.lineTo(-7, 0);
      ctx.lineTo(0, -13); ctx.lineTo(7, 0); ctx.lineTo(15, -8); ctx.lineTo(15, 6);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }

  function pathScreen(P, k) {
    if (k < 0) k = 0;
    if (k >= P.steps.length) k = P.steps.length - 1;
    var d = k - P.charIdx;
    var s, y, ls;
    if (d >= 0) {
      s = clamp(1.02 - 0.052 * d, 0.42, 1.04);
      y = L.nearY - (56 * d) + 1.45 * d * d;
      ls = 33 * (0.5 + 0.5 * s);
    } else {
      s = 1.06;
      y = L.nearY + 54 * (-d);
      ls = 34;
    }
    var x = L.cx + (P.cam || 0) + (P.steps[k].wx - P.steps[P.charIdx].wx) * ls;
    return { x: x, y: y, s: s, d: d };
  }

  /* 계단이 화면 밖으로 흘러나가지 않게 카메라를 살짝 따라간다 */
  function updateCam(P, dt) {
    var ahead = Math.min(P.charIdx + 4, P.steps.length - 1);
    var drift = P.steps[ahead].wx - P.steps[P.charIdx].wx;
    var want = -clamp(drift, -3.4, 3.4) * 15;
    P.cam = P.cam === undefined ? want : lerp(P.cam, want, clamp(dt * 3.2, 0, 1));
  }

  function drawStairStep(k, now) {
    var st = ST.steps[k];
    var p = pathScreen(ST, k);
    if (p.d < -2.4 || p.d > 10.5) return;
    var pal = palOf(S.stage);
    var w = 100 * p.s, h = 26 * p.s, th = 22 * p.s;
    var isNext = (k === ST.charIdx + 1);
    var past = k <= ST.charIdx;
    var glow = st.fx || 0;

    ctx.save();
    ctx.globalAlpha = past ? 0.94 : clamp(1.06 - Math.max(0, p.d) * 0.03, 0.7, 1);

    // 그림자
    ctx.fillStyle = 'rgba(18, 30, 70, .22)';
    rr(ctx, p.x - w / 2 + 3 * p.s, p.y + th + 4 * p.s, w, h * 0.7, 9 * p.s);
    ctx.fill();

    // 앞면(두께)
    var fg = ctx.createLinearGradient(0, p.y, 0, p.y + th + 8 * p.s);
    fg.addColorStop(0, pal.stepFront[0]);
    fg.addColorStop(1, pal.stepFront[1]);
    ctx.fillStyle = fg;
    rr(ctx, p.x - w / 2, p.y + 2 * p.s, w, th + 6 * p.s, 8 * p.s);
    ctx.fill();

    // 윗면
    var tg = ctx.createLinearGradient(0, p.y - h / 2, 0, p.y + h / 2);
    tg.addColorStop(0, pal.stepTop[0]);
    tg.addColorStop(1, pal.stepTop[1]);
    ctx.fillStyle = tg;
    rr(ctx, p.x - w / 2, p.y - h / 2, w, h, 9 * p.s);
    ctx.fill();

    // 잔디 띠
    ctx.fillStyle = pal.grass;
    rr(ctx, p.x - w / 2 + 2 * p.s, p.y - h / 2, w - 4 * p.s, 4.5 * p.s, 3 * p.s);
    ctx.fill();
    ctx.globalAlpha *= 0.9;
    ctx.strokeStyle = pal.edge;
    ctx.lineWidth = 1.4 * p.s;
    rr(ctx, p.x - w / 2, p.y - h / 2, w, h, 9 * p.s);
    ctx.stroke();
    ctx.globalAlpha /= 0.9;

    // 앞으로 세 칸 — 어느 버튼을 눌러야 하는지 계단 위에 표시
    if (k > ST.charIdx && k <= ST.charIdx + 3) {
      var dd = k - ST.charIdx;
      ctx.save();
      ctx.globalAlpha *= (dd === 1 ? 0.95 : (dd === 2 ? 0.5 : 0.26));
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '900 ' + Math.round(15 * p.s) + 'px "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
      ctx.fillStyle = st.turn ? '#a83a86' : '#255f9c';
      ctx.fillText(st.turn ? '↺' : '⬆', p.x, p.y + 1);
      ctx.restore();
    }

    // 작은 꽃·풀 — 계단마다 다르게
    if (p.s > 0.55 && k > 1) {
      var hh = hash(k);
      if (hh > 0.55) {
        var fx = p.x - w * 0.34 + hh * w * 0.5;
        ctx.fillStyle = hh > 0.8 ? '#ffd1e6' : (hh > 0.68 ? '#fff2a8' : '#e9f7ff');
        ctx.beginPath();
        ctx.arc(fx, p.y - h / 2 - 1, 2.2 * p.s, 0, TAU);
        ctx.fill();
      }
      if (hh < 0.24) {
        ctx.strokeStyle = pal.grass;
        ctx.lineWidth = 1.6 * p.s;
        ctx.beginPath();
        var gx = p.x + w * 0.30;
        ctx.moveTo(gx, p.y - h / 2);
        ctx.quadraticCurveTo(gx + 3 * p.s, p.y - h / 2 - 7 * p.s, gx - 2 * p.s, p.y - h / 2 - 9 * p.s);
        ctx.stroke();
      }
    }

    // 10층마다 깃발
    if (k > 0 && k % 10 === 0) {
      var px2 = p.x + w * 0.34;
      ctx.strokeStyle = 'rgba(90,70,50,.75)';
      ctx.lineWidth = 1.8 * p.s;
      ctx.beginPath();
      ctx.moveTo(px2, p.y - h / 2);
      ctx.lineTo(px2, p.y - h / 2 - 20 * p.s);
      ctx.stroke();
      ctx.fillStyle = '#ff6f8f';
      ctx.beginPath();
      ctx.moveTo(px2, p.y - h / 2 - 20 * p.s);
      ctx.lineTo(px2 + 13 * p.s, p.y - h / 2 - 16 * p.s);
      ctx.lineTo(px2, p.y - h / 2 - 12 * p.s);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      ctx.font = '900 ' + Math.round(9 * p.s) + 'px sans-serif';
      ctx.fillText(String(k), px2 + 2 * p.s, p.y - h / 2 + 10 * p.s);
    }

    // 밟은 자리 반짝
    if (glow > 0) {
      ctx.globalAlpha = glow * 0.8;
      ctx.strokeStyle = '#fffbe0';
      ctx.lineWidth = 3 * p.s;
      rr(ctx, p.x - w / 2, p.y - h / 2, w, h, 9 * p.s);
      ctx.stroke();
    }

    // 다음 계단 — 노란 테두리
    if (isNext) {
      var pl = 0.55 + 0.45 * Math.sin(now * 0.008);
      ctx.globalAlpha = pl;
      ctx.strokeStyle = '#ffe066';
      ctx.lineWidth = 3 * p.s;
      ctx.shadowColor = 'rgba(255, 210, 60, .95)';
      ctx.shadowBlur = 14;
      rr(ctx, p.x - w / 2, p.y - h / 2, w, h, 9 * p.s);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawStairHint(now) {
    var next = ST.steps[ST.charIdx + 1];
    if (!next || ST.over) return;
    var p = pathScreen(ST, ST.charIdx + 1);
    var c = pathScreen(ST, ST.charIdx);
    // 현재 → 다음 계단 점선
    ctx.save();
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = 'rgba(255,255,255,.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ctx.restore();
  }

  /* ══════════════════════════════════════════════════════════
     ③ 믹스 모드 — 피아노 70 : 계단 30
     ══════════════════════════════════════════════════════════ */
  var MX = {
    steps: [], charIdx: 0, nextIdx: 1, dir: 1, sinceTurn: 0, wx: 0,
    genStage: 1, genSong: 'twinkle', notePtr: 0,
    timeLeft: 1, timeLimit: 1,
    hopT: 0, fallT: 0, respawnT: 0, pressBuf: []
  };

  function turnChanceAt(stage) { return clamp(0.30 + (stage - 1) * 0.015, 0.30, 0.36); }
  function tempoAt(stage) { return Math.pow(1.055, stage - 1); }

  function mixPush() {
    var mel = melodyOf(MX.genSong);
    if (MX.notePtr >= mel.length) {
      MX.genStage++;
      MX.genSong = songAt(MX.genStage);
      MX.notePtr = 0;
      mel = melodyOf(MX.genSong);
      MX.sinceTurn = 0;
    }
    var cur = mel[MX.notePtr];
    var turn = false;
    if (MX.steps.length > 2) {
      MX.sinceTurn++;
      if (MX.sinceTurn >= 5) turn = true;
      else if (MX.sinceTurn >= 2 && Math.random() < turnChanceAt(MX.genStage)) turn = true;
      if (turn) { MX.dir = -MX.dir; MX.sinceTurn = 0; }
    }
    var bpm = SONGS[MX.genSong].bpm * tempoAt(MX.genStage);
    var beatSec = 60 / bpm;
    var lane = laneOfPitch(cur.midi);
    var chord = false, midis = [cur.midi], lanes = [lane];
    if (MX.genStage >= 3 && !turn && MX.notePtr + 1 < mel.length && Math.random() < 0.17) {
      var l2 = laneOfPitch(mel[MX.notePtr + 1].midi);
      if (l2 !== lane) {
        chord = true;
        midis.push(mel[MX.notePtr + 1].midi);
        lanes.push(l2);
      }
    }
    var beats = cur.beats + (chord ? mel[MX.notePtr + 1].beats : 0);
    var limit = clamp(beatSec * beats * 2.1, 0.6, 1.9 / tempoAt(MX.genStage) + 0.5);
    MX.wx += MX.dir;
    MX.steps.push({
      k: MX.steps.length, dir: MX.dir, turn: turn, wx: MX.wx,
      stage: MX.genStage, song: MX.genSong,
      midi: cur.midi, midis: midis, chord: chord, lane: lane, lanes: lanes,
      limit: limit, noteName: noteNameOf(cur.midi), fall: 0
    });
    MX.notePtr += chord ? 2 : 1;
  }

  function mixEnsure(n) {
    var guard = 0;
    while (MX.steps.length <= n && guard++ < 200) mixPush();
  }

  function mixReset(songId) {
    S.song = songId;
    S.stage = 1;
    MX.genStage = 1; MX.genSong = songId;
    MX.notePtr = 0; MX.dir = 1; MX.sinceTurn = 0; MX.wx = 0;
    MX.steps = [{ k: 0, dir: 1, turn: false, wx: 0, stage: 1, song: songId, midi: null, midis: [], chord: false, lane: 0, lanes: [], limit: 1, noteName: '', fall: 0 }];
    MX.charIdx = 0; MX.nextIdx = 1;
    MX.cam = 0;
    mixEnsure(14);
    MX.timeLimit = MX.steps[1].limit;
    MX.timeLeft = MX.timeLimit;
  }

  function mixStart() {
    MX.fallT = 0; MX.respawnT = 0; MX.hopT = 0; MX.pressBuf = [];
    mixReset(S.startSong);
    paintBg(S.stage, true);
    updateHud();
    showBanner('건반을 톡톡! 계단을 올라요 🎹');
  }

  function mixFallProgress() {
    if (S.screen !== 'play' || !(MX.timeLimit > 0)) return 0;
    return clamp(1 - MX.timeLeft / MX.timeLimit, 0, 1);
  }

  function mixAnchor(st) {
    if (st && st.turn && el.btnTurn) {
      var r = el.btnTurn.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top, w: r.width, rgb: '236,158,215' };
    }
    var idx = st ? (st.lane || 0) : 0;
    var e = el.mkeys[idx];
    if (e) {
      var q = e.getBoundingClientRect();
      return { x: q.left + q.width / 2, y: q.top, w: q.width, rgb: LANES[idx].rgb };
    }
    return { x: L.cx, y: L.fieldBottom, w: 80, rgb: '255,255,255' };
  }

  function mixPress(action) {
    if (S.screen !== 'play' || MX.fallT > 0 || MX.respawnT > 0) return;
    var st = MX.steps[MX.nextIdx];
    if (!st) return;
    audioInit();

    if (st.chord) {
      var nowMs = performance.now();
      MX.pressBuf = MX.pressBuf.filter(function (q) { return nowMs - q.t < 300; });
      MX.pressBuf.push({ a: action, t: nowMs });
      var got = true;
      for (var i = 0; i < st.lanes.length; i++) {
        var has = false;
        for (var j = 0; j < MX.pressBuf.length; j++) if (MX.pressBuf[j].a === 'lane' + st.lanes[i]) has = true;
        if (!has) got = false;
      }
      if (got) { MX.pressBuf = []; mixHit(st, true); }
      return;
    }
    var want = st.turn ? 'turn' : ('lane' + st.lane);
    if (action === want) mixHit(st, false);
    else mixFail('wrong');
  }

  function mixHit(st, chordHit) {
    var midis = st.chord ? st.midis : [st.midi];
    for (var i = 0; i < midis.length; i++) playPiano(midis[i], i === 0 ? 1 : 0.88);
    var ratio = MX.timeLimit > 0 ? MX.timeLeft / MX.timeLimit : 1;
    var perfect = (1 - ratio) >= 0.55;
    var pts = (perfect ? 120 : 80) * (st.chord ? 1.6 : 1) * (S.fever ? 2 : 1);
    S.score += Math.round(pts);
    S.combo++;
    if (S.combo > S.maxCombo) S.maxCombo = S.combo;
    S.judged++;
    if (perfect) S.perfect++;
    if (!S.fever && S.combo >= 10) {
      S.fever = true;
      S.cheerT = 1.1;
      showBanner('피버 타임! 점수 2배 🌈');
      playSparkle(76);
    }
    if (perfect && S.combo % 7 === 0) S.playT = 0.5;

    var p = pathScreen(MX, MX.nextIdx);
    burst(p.x, p.y - 10, '#ffe9a8', perfect ? 16 : 9, 1);
    burst(p.x, p.y - 10, '#ffffff', 6, 0.7);
    judgeShow(perfect ? 'Perfect!' : 'Good!', perfect ? 'perfect' : 'great');
    vibrate(perfect ? 12 : 8);

    MX.charIdx = MX.nextIdx;
    MX.nextIdx++;
    MX.hopT = 1;
    mixEnsure(MX.charIdx + 14);

    var nx = MX.steps[MX.nextIdx];
    if (nx && nx.stage !== S.stage) {
      S.stage = nx.stage;
      S.song = nx.song;
      var info = STAGES[Math.min(STAGES.length, S.stage) - 1];
      showBanner('STAGE ' + S.stage + ' · ' + SONGS[S.song].name + ' ' + info.emoji);
      S.flash = 0.55;
      S.cheerT = 1.4;
      playSparkle(72 + (S.stage % 5) * 2);
      paintBg(S.stage, true);
      hudCache.stage = -1; hudCache.song = '';
    }
    MX.timeLimit = nx ? nx.limit : 1.2;
    MX.timeLeft = MX.timeLimit;
    updateHud();
  }

  function mixFail(kind) {
    S.combo = 0;
    S.fever = false;
    S.hearts--;
    S.judged++;
    MX.fallT = 1;
    S.oopsT = 1.5;
    S.shake = 1;
    MX.timeLeft = MX.timeLimit;
    playThud();
    judgeShow(kind === 'wrong' ? '아차!' : '놓쳤어요', 'miss');
    vibrate([12, 40, 18]);
    var p = pathScreen(MX, MX.nextIdx);
    burst(p.x, p.y, '#ff9ec4', 14, 1.1);
    updateHud();
    if (S.hearts <= 0) {
      MX.respawnT = 0;
      setTimeout(function () { if (S.mode === 'mix' && S.screen === 'play') gameOver(); }, 620);
    } else {
      MX.respawnT = 0.95;
    }
  }

  function mixUpdate(dt) {
    MX.hopT = Math.max(0, MX.hopT - dt * 6.2);
    MX.fallT = Math.max(0, MX.fallT - dt * 1.15);
    updateCam(MX, dt);
    if (MX.respawnT > 0) {
      MX.respawnT = Math.max(0, MX.respawnT - dt);
      if (MX.respawnT === 0) { MX.timeLeft = MX.timeLimit; S.oopsT = 0; }
      updateHud();
      return;
    }
    if (MX.fallT > 0) { updateHud(); return; }

    MX.timeLeft -= dt;
    if (MX.timeLeft <= 0) {
      MX.timeLeft = 0;
      mixFail('timeout');
    }
    if (MX.steps[MX.nextIdx] && MX.steps[MX.nextIdx].chord && MX.pressBuf.length) {
      var nowMs = performance.now();
      MX.pressBuf = MX.pressBuf.filter(function (q) { return nowMs - q.t < 260; });
    }
    var nx = MX.steps[MX.nextIdx];
    hintKeys(nx ? (nx.turn ? ['turn'] : ['m' + nx.lane]) : []);
    updateHud();
  }

  /* 믹스 화면 그리기 */
  function mixRender(now) {
    var top = Math.min(MX.steps.length - 1, MX.charIdx + 9);
    var k;
    for (k = Math.max(0, MX.charIdx - 2); k <= top; k++) if (k >= 1) mixRiser(k, now);
    for (k = top; k >= Math.max(0, MX.charIdx - 2); k--) mixTile(k, now);
    mixCharacter(now);
    mixFallingTile(now);
  }

  var STEP_COLORS = ['#4d8dff', '#a86bff', '#ff6fbe', '#4fd8ff', '#ffb84d'];
  function stepColor(st) { return STEP_COLORS[((st.midi || 60) - 60 + 24) % STEP_COLORS.length]; }

  function mixRiser(k, now) {
    var a = pathScreen(MX, k - 1), b = pathScreen(MX, k);
    if (b.d < -2.2 || a.d > 10.5) return;
    var h = 34 * b.s;
    ctx.save();
    ctx.globalAlpha = clamp(0.7 - Math.max(0, b.d) * 0.03, 0.28, 0.8);
    var g = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
    g.addColorStop(0, 'rgba(140, 198, 252, .52)');
    g.addColorStop(1, 'rgba(228, 246, 255, .82)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(b.x - 40 * b.s, b.y);
    ctx.lineTo(b.x + 40 * b.s, b.y);
    ctx.lineTo(b.x + 40 * b.s, b.y + h);
    ctx.lineTo(a.x + 40 * a.s, a.y + h);
    ctx.lineTo(a.x - 40 * a.s, a.y + h);
    ctx.lineTo(b.x - 40 * b.s, b.y + h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, .35)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  function mixLandingSlot(k, now) {
    var st = MX.steps[k];
    var p = pathScreen(MX, k);
    var w = 92 * p.s, h = 28 * p.s;
    var fc = st.turn ? '236,158,215' : LANES[st.lane || 0].rgb;
    var pulse = 0.5 + 0.5 * Math.sin(now * 0.007);
    var f0 = mixFallProgress();
    var ringA = 0.18 + 0.55 * f0;
    ctx.save();
    ctx.strokeStyle = 'rgba(' + fc + ',' + ringA.toFixed(3) + ')';
    ctx.lineWidth = 2 + 2.4 * f0;
    ctx.shadowColor = 'rgba(' + fc + ', .85)';
    ctx.shadowBlur = 8 + 18 * f0;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 8 * p.s, (46 + 24 * f0) * p.s, (10 + 5 * f0) * p.s, 0, 0, TAU);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = clamp(1 - Math.max(0, p.d) * 0.03, 0.7, 1);
    ctx.fillStyle = 'rgba(' + fc + ', .10)';
    rr(ctx, p.x - w / 2, p.y - h / 2, w, h, 8 * p.s);
    ctx.fill();
    ctx.setLineDash([7 * p.s, 5 * p.s]);
    ctx.strokeStyle = 'rgba(' + fc + ',' + (0.42 + 0.32 * pulse).toFixed(3) + ')';
    ctx.lineWidth = 2.2 * p.s;
    rr(ctx, p.x - w / 2, p.y - h / 2, w, h, 8 * p.s);
    ctx.stroke();
    ctx.restore();
  }

  function mixTile(k, now) {
    var st = MX.steps[k];
    var p = pathScreen(MX, k);
    if (p.d < -2.4 || p.d > 10.5) return;
    var isNext = k === MX.nextIdx;
    if (isNext) { mixLandingSlot(k, now); return; }
    var past = k <= MX.charIdx;
    var w = 92 * p.s, h = 28 * p.s;
    var col = st.midi ? stepColor(st) : '#9fc6e8';

    ctx.save();
    ctx.globalAlpha = past ? 0.42 : clamp(1.06 - Math.max(0, p.d) * 0.03, 0.78, 1);

    ctx.fillStyle = 'rgba(20, 16, 60, .28)';
    rr(ctx, p.x - w / 2 + 3 * p.s, p.y + 7 * p.s, w, h, 9 * p.s);
    ctx.fill();

    var fg = ctx.createLinearGradient(0, p.y, 0, p.y + 26 * p.s);
    fg.addColorStop(0, '#eaf4ff');
    fg.addColorStop(1, '#a9c8ea');
    ctx.fillStyle = fg;
    rr(ctx, p.x - w / 2, p.y + 2 * p.s, w, 20 * p.s, 8 * p.s);
    ctx.fill();

    var tg = ctx.createLinearGradient(0, p.y - h / 2, 0, p.y + h / 2);
    tg.addColorStop(0, '#ffffff');
    tg.addColorStop(0.6, '#f6fbff');
    tg.addColorStop(1, '#e2efff');
    ctx.fillStyle = tg;
    rr(ctx, p.x - w / 2, p.y - h / 2, w, h, 8 * p.s);
    ctx.fill();
    ctx.strokeStyle = hexA(col, 0.55);
    ctx.lineWidth = Math.max(1, 1.6 * p.s);
    rr(ctx, p.x - w / 2, p.y - h / 2, w, h, 8 * p.s);
    ctx.stroke();

    ctx.fillStyle = 'rgba(24, 22, 52, .88)';
    rr(ctx, p.x - w * 0.16, p.y - h / 2 - 4 * p.s, w * 0.32, h * 0.62, 3 * p.s);
    ctx.fill();

    ctx.save();
    ctx.globalAlpha *= 0.85;
    ctx.fillStyle = hexA(col, 0.9);
    rr(ctx, p.x - w * 0.4, p.y + h * 0.28, w * 0.8, Math.max(2, 3.4 * p.s), 2);
    ctx.fill();
    ctx.restore();

    if (p.s > 0.5 && st.noteName) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '900 ' + Math.round(13 * p.s) + 'px "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
      ctx.fillStyle = st.chord ? '#b3560a' : '#2f5f96';
      ctx.fillText(st.chord ? st.noteName + '+' : st.noteName, p.x, p.y + h * 0.06);
      ctx.restore();
    }
    ctx.restore();
  }

  function mixFallingTile(now) {
    if (S.screen !== 'play' || MX.fallT > 0 || MX.respawnT > 0) return;
    var st = MX.steps[MX.nextIdx];
    if (!st) return;
    var p = pathScreen(MX, MX.nextIdx);
    if (p.d > 10.5 || p.d < -2.4) return;
    var f = mixFallProgress();
    var dropH = 200 * Math.max(0.55, p.s);
    var ty = p.y - (1 - f) * dropH;
    var s2 = p.s * (0.86 + 0.14 * f);
    var a = mixAnchor(st);
    var col = st.turn ? '236,158,215' : LANES[st.lane].rgb;

    var lg = ctx.createLinearGradient(a.x, a.y, p.x, ty);
    lg.addColorStop(0, 'rgba(' + col + ', .62)');
    lg.addColorStop(0.45, 'rgba(' + col + ', .26)');
    lg.addColorStop(1, 'rgba(' + col + ', .04)');
    ctx.save();
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.moveTo(a.x - a.w * 0.42, a.y + 2);
    ctx.lineTo(a.x + a.w * 0.42, a.y + 2);
    ctx.lineTo(p.x + 26 * s2, ty);
    ctx.lineTo(p.x - 26 * s2, ty);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(' + col + ', ' + (0.5 + 0.35 * f).toFixed(3) + ')';
    ctx.lineWidth = 2.2;
    ctx.shadowColor = 'rgba(' + col + ', .9)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y + 2);
    ctx.lineTo(p.x, ty);
    ctx.stroke();
    ctx.restore();

    var w = 96 * s2, h = 31 * s2;
    ctx.save();
    ctx.shadowColor = 'rgba(' + col + ', .9)';
    ctx.shadowBlur = 16 * s2;
    var tg = ctx.createLinearGradient(0, ty - h / 2, 0, ty + h / 2);
    if (st.turn) {
      tg.addColorStop(0, '#ffe9f7'); tg.addColorStop(0.58, '#f8b6e4'); tg.addColorStop(1, '#dd88c6');
    } else {
      tg.addColorStop(0, '#fffef6'); tg.addColorStop(0.55, '#fff7d2'); tg.addColorStop(1, '#ffe6a0');
    }
    ctx.fillStyle = tg;
    rr(ctx, p.x - w / 2, ty - h / 2, w, h, 9 * s2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = st.turn ? 'rgba(198,86,160,.95)' : 'rgba(255,190,54,.95)';
    ctx.lineWidth = 2.2 * s2;
    rr(ctx, p.x - w / 2, ty - h / 2, w, h, 9 * s2);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (st.turn) {
      ctx.strokeStyle = '#b3458f';
      ctx.lineWidth = 2.6 * s2;
      ctx.beginPath();
      ctx.moveTo(p.x - w * 0.30, ty + h * 0.20);
      ctx.lineTo(p.x - w * 0.10, ty + h * 0.02);
      ctx.lineTo(p.x + w * 0.06, ty + h * 0.20);
      ctx.lineTo(p.x + w * 0.24, ty + h * 0.02);
      ctx.stroke();
      ctx.font = '900 ' + Math.round(14 * s2) + 'px "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
      ctx.fillStyle = '#8c2f6c';
      ctx.fillText('↺ 꺾임', p.x, ty - h * 0.16);
    } else {
      ctx.fillStyle = 'rgba(26,24,56,.9)';
      rr(ctx, p.x - w * 0.15, ty - h / 2 - 3 * s2, w * 0.30, h * 0.46, 3 * s2);
      ctx.fill();
      var lbl = st.chord ? (LANES[st.lanes[0]].syl + '+' + LANES[st.lanes[1]].syl) : LANES[st.lane].syl;
      ctx.font = '900 ' + Math.round(16 * s2) + 'px "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
      ctx.fillStyle = '#8a5600';
      ctx.fillText(lbl, p.x, ty + h * 0.20);
    }
    ctx.restore();
  }

  function mixCharacter(now) {
    var hop = clamp(MX.hopT, 0, 1);
    var prevK = Math.max(0, MX.charIdx - 1);
    var a = pathScreen(MX, prevK), b = pathScreen(MX, MX.charIdx);
    var t = 1 - hop;
    var x = lerp(a.x, b.x, easeOut(t));
    var y = lerp(a.y, b.y, easeOut(t)) - Math.sin(Math.PI * hop) * 34 * b.s;
    var s = lerp(a.s, b.s, t);
    var pose = (MX.fallT > 0 || S.oopsT > 0) ? 'oops' : (S.cheerT > 0 ? 'cheer' : (S.playT > 0 ? 'play' : 'run'));
    var h = 114 * s;
    var w = h * ((sprites[pose] || sprites.run).ar || 0.46);

    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = 'rgba(30, 80, 150, .8)';
    ctx.beginPath();
    ctx.ellipse(b.x, b.y + 8 * s, w * 0.34, 6 * s, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    var hg = ctx.createRadialGradient(x, y - h * 0.5, 2, x, y - h * 0.5, h * 0.72);
    hg.addColorStop(0, S.fever ? 'rgba(255, 248, 205, .42)' : 'rgba(255,255,255,.24)');
    hg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.arc(x, y - h * 0.5, h * 0.72, 0, TAU);
    ctx.fill();

    if (MX.fallT > 0) {
      var ft = 1 - clamp(MX.fallT, 0, 1);
      drawSprite(pose, x, y, h, now, { rot: ft * 0.55, drop: ft * 62, alpha: clamp(1 - ft * 0.3, 0.66, 1), bob: 0 });
    } else {
      drawSprite(pose, x, y, h, now, { bob: S.screen === 'play' ? Math.sin(now * 0.006) * 1.6 * s : Math.sin(now * 0.0035) * 3 });
    }
  }

  /* ══════════════════════════════════════════════════════════
     게임 흐름
     ══════════════════════════════════════════════════════════ */
  function resetCommon() {
    S.score = 0; S.combo = 0; S.maxCombo = 0; S.hearts = 3;
    S.perfect = 0; S.judged = 0; S.fever = false;
    S.hopT = 0; S.fallT = 0; S.oopsT = 0; S.cheerT = 0; S.playT = 0;
    S.shake = 0; S.flash = 0.4;
    S.floor = 0; S.endReason = '';
    hudCache = {};
    el.judge.className = 'judge';
    el.comboBox.classList.remove('on');
    for (var i = 0; i < el.hearts.children.length; i++) el.hearts.children[i].classList.remove('gone');
  }

  function startMode(mode) {
    audioInit();
    audioRestore();
    clearTimeout(ST.timer);
    musicStop();
    setMode(mode);
    setScreen('play');
    resetCommon();
    el.homeScreen.classList.remove('show');
    el.overScreen.classList.remove('show');
    el.pauseScreen.classList.remove('show');
    measure();
    if (mode === 'rhythm') rhythmStart();
    else if (mode === 'stairs') stairsStart();
    else mixStart();
    updateHud();
  }

  function goHome() {
    clearTimeout(ST.timer);
    musicStop();
    audioPanic();
    setScreen('home');
    ST.over = false;
    S.fallT = 0; S.oopsT = 0; S.cheerT = 0; S.playT = 0; S.combo = 0;
    el.overScreen.classList.remove('show');
    el.pauseScreen.classList.remove('show');
    el.homeScreen.classList.add('show');
    hintKeys([]);
    refreshBest();
    S.stage = 1;
    paintBg(S.stage, true);
  }

  function pauseGame() {
    if (S.screen !== 'play') return;
    setScreen('pause');
    musicStop();
    audioPanic();
    el.pauseMsg.textContent = S.mode === 'stairs' ? '계단은 잠깐 쉬어요!' : '준비되면 다시 놀아요!';
    el.pauseScreen.classList.add('show');
  }

  function resumeGame() {
    if (S.screen !== 'pause') return;
    setScreen('play');
    el.pauseScreen.classList.remove('show');
    audioRestore();
    if (S.mode === 'stairs' && ST.over) { gameOver(); return; }
    if (S.mode === 'stairs') musicStart(S.song, 1 + (S.stage - 1) * 0.06);
    lastT = 0;
  }

  function gameOver() {
    if (S.screen === 'over') return;
    musicStop();
    clearTimeout(ST.timer);
    var key = 'woojin_piano_best_' + S.mode;
    if (S.score > S.best[S.mode]) {
      S.best[S.mode] = S.score;
      try { localStorage.setItem(key, String(S.score)); } catch (e) { }
    }
    if (S.mode === 'stairs' && S.floor > S.bestFloor) {
      S.bestFloor = S.floor;
      try { localStorage.setItem('woojin_piano_best_floor', String(S.floor)); } catch (e) { }
    }
    el.overScore.textContent = fmt(S.score);
    el.overCombo.textContent = S.maxCombo + '콤보';
    if (S.mode === 'stairs') {
      el.overRecLbl.textContent = '오른 층';
      el.overStage.textContent = S.floor + '층';
      el.overBestLine.innerHTML = '최고 기록 <b>' + fmt(S.bestFloor) + '</b>층 · 최고 점수 <b>' + fmt(S.best.stairs) + '</b>점';
    } else {
      el.overRecLbl.textContent = '판';
      el.overStage.textContent = 'STAGE ' + S.stage;
      el.overBestLine.innerHTML = '최고 점수 <b>' + fmt(S.best[S.mode]) + '</b>점';
    }
    var title, msg;
    if (S.mode === 'stairs' && S.endReason === 'time') {
      title = '시간 초과!';
      msg = '빠르게 오를수록 시간이 늘어나요 ⏱';
    } else if (S.mode === 'stairs') {
      if (S.floor >= 60) { title = '하늘 끝까지!'; msg = '구름을 뚫고 올라갔어요 ✨'; }
      else if (S.floor >= 30) { title = '계단 박사!'; msg = '무지개 위까지 올랐어요 🌈'; }
      else if (S.floor >= 12) { title = '잘했어요!'; msg = '다음엔 별까지 올라가요 ⭐'; }
      else { title = '한 번 더!'; msg = '계단이 꺾이면 ↺를 눌러요 🎈'; }
    } else if (S.stage >= 4) { title = '별빛 마스터!'; msg = '성문이 활짝 열렸어요 ✨'; }
    else if (S.stage >= 3) { title = '대단해요!'; msg = '판을 넘어 다음 노래까지! 🌈'; }
    else if (S.score >= 1200) { title = '잘했어요!'; msg = '다음엔 더 높이 올라가요 ⭐'; }
    else { title = '한 번 더!'; msg = '천천히 눌러도 괜찮아요 🎈'; }

    el.overTitle.textContent = title;
    el.overMsg.textContent = msg;
    if (el.overFace) el.overFace.src = (S.stage >= 3 || S.floor >= 24) ? 'assets/woojin-cheer.png' : 'assets/woojin-oops.png';
    setScreen('over');
    hintKeys([]);
    setTimeout(function () {
      if (S.screen === 'over') el.overScreen.classList.add('show');
    }, 380);
    refreshBest();
  }

  function refreshBest() {
    el.bestRhythm.textContent = fmt(S.best.rhythm);
    el.bestStairs.textContent = S.bestFloor ? (fmt(S.bestFloor) + '층') : fmt(S.best.stairs);
    el.bestSummary.innerHTML = '최고 기록 · 리듬 <b>' + fmt(S.best.rhythm) + '</b>점 · 계단 <b>' + fmt(S.bestFloor) + '</b>층 · 믹스 <b>' + fmt(S.best.mix) + '</b>점';
  }

  /* ══════════════════════════════════════════════════════════
     루프 · 렌더
     ══════════════════════════════════════════════════════════ */
  var lastT = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    var dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 0.016;
    lastT = now;

    S.hopT = Math.max(0, S.hopT - dt * 6.2);
    S.fallT = Math.max(0, S.fallT - dt * 1.15);
    S.oopsT = Math.max(0, S.oopsT - dt);
    S.cheerT = Math.max(0, S.cheerT - dt);
    S.playT = Math.max(0, S.playT - dt);
    S.shake = Math.max(0, S.shake - dt * 2.6);
    S.flash = Math.max(0, S.flash - dt * 1.5);

    if (S.screen === 'play') {
      if (S.mode === 'rhythm') rhythmUpdate(dt);
      else if (S.mode === 'stairs') stairsUpdate(dt);
      else mixUpdate(dt);
    }
    if (parts.length) updateParts(dt);
    render(now);
  }

  function render(now) {
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    if (S.shake > 0.01) ctx.translate(rnd(-1, 1) * S.shake * 5, rnd(-1, 1) * S.shake * 4);

    if (S.screen === 'home') {
      renderBg(now);
      drawHomeScene(now);
      drawParts();
      ctx.restore();
      return;
    }

    renderBg(now);
    if (S.mode === 'rhythm') rhythmRender(now);
    else if (S.mode === 'stairs') stairsRender(now);
    else mixRender(now);
    drawParts();

    if (S.flash > 0.01) {
      ctx.fillStyle = 'rgba(255,255,255,' + (S.flash * 0.4) + ')';
      ctx.fillRect(0, 0, W, H);
    }
    if (S.stage >= 4 && S.mode !== 'stairs') {
      var pg = ctx.createLinearGradient(0, 0, 0, H);
      pg.addColorStop(0, 'rgba(255, 222, 140, .12)');
      pg.addColorStop(0.5, 'rgba(255, 222, 140, 0)');
      pg.addColorStop(1, 'rgba(255, 196, 96, .1)');
      ctx.fillStyle = pg;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
  }

  /* 홈 배경 — 성 앞에서 손 흔드는 우진이 */
  function drawHomeScene(now) {
    var gy = H * 0.80;
    // 무지개 다리
    ctx.save();
    ctx.globalAlpha = 0.4;
    var cols = ['#ff9ec4', '#ffd27a', '#fff2a0', '#a6f0c0', '#9ecbff', '#c9a8ff'];
    for (var i = 0; i < cols.length; i++) {
      ctx.strokeStyle = cols[i];
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(W * 0.5, gy + 90, W * (0.42 - i * 0.028), Math.PI * 1.08, Math.PI * 1.92);
      ctx.stroke();
    }
    ctx.restore();

    // 구름 위 발판
    drawCloud(ctx, W * 0.5, gy + 26, 2.5, 0.55, true);
    var h = Math.min(150, H * 0.20);
    drawSprite('cheer', W * 0.5, gy + 10, h, now, { bob: Math.sin(now * 0.003) * 4 });
    drawBalloon(ctx, W * 0.84, gy - h * 0.9, 1.15, now);
    drawBalloon(ctx, W * 0.14, gy - h * 0.62, 0.9, now + 1400);

    // 반짝이
    for (var k = 0; k < 9; k++) {
      var a = now * 0.0004 + k * 0.7;
      var x = W * 0.5 + Math.cos(a) * (W * 0.30);
      var y = gy - 40 + Math.sin(a * 1.3) * 40;
      var al = 0.2 + 0.5 * Math.abs(Math.sin(now * 0.002 + k));
      drawStar(ctx, x, y, 2 + Math.abs(Math.sin(now * 0.0015 + k)) * 2.4, 4, 'rgba(255,255,240,' + al.toFixed(2) + ')');
    }
  }

  /* ══════════════════════════════════════════════════════════
     입력
     ══════════════════════════════════════════════════════════ */
  function holdBtn(b, action) {
    if (!b) return;
    function down(e) {
      if (e.cancelable) e.preventDefault();
      b.classList.add('down');
      doAction(action);
      clearTimeout(b._t);
      b._t = setTimeout(function () { b.classList.remove('down'); }, 110);
    }
    b.addEventListener('pointerdown', down, { passive: false });
    b.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }
  function releaseBtn(b) {
    if (!b) return;
    b.addEventListener('pointerup', function () { b.classList.remove('down'); });
    b.addEventListener('pointercancel', function () { b.classList.remove('down'); });
    b.addEventListener('pointerleave', function () { b.classList.remove('down'); });
  }

  function doAction(action) {
    if (S.screen !== 'play') return;
    if (S.mode === 'rhythm') {
      var m = /^lane([0-3])$/.exec(action);
      if (m) rhythmPress(+m[1]);
      return;
    }
    if (S.mode === 'stairs') {
      if (action === 'up' || action === 'turn') stairsPress(action);
      return;
    }
    mixPress(action);
  }

  function bindUi() {
    el.modeRhythm.addEventListener('click', function () { startMode('rhythm'); });
    el.modeStairs.addEventListener('click', function () { startMode('stairs'); });
    el.modeMix.addEventListener('click', function () { startMode('mix'); });

    el.retryBtn.addEventListener('click', function () {
      el.overScreen.classList.remove('show');
      startMode(S.mode);
    });
    el.menuBtn.addEventListener('click', goHome);
    el.pauseMenuBtn.addEventListener('click', goHome);
    el.resumeBtn.addEventListener('click', resumeGame);
    el.pauseBtn.addEventListener('click', pauseGame);

    // 리듬 건반
    for (var i = 0; i < el.rkeys.length; i++) {
      (function (idx) { holdBtn(el.rkeys[idx], 'lane' + idx); releaseBtn(el.rkeys[idx]); })(i);
    }
    // 믹스 건반 + 방향전환
    for (var j = 0; j < el.mkeys.length; j++) {
      (function (idx) { holdBtn(el.mkeys[idx], 'lane' + idx); releaseBtn(el.mkeys[idx]); })(j);
    }
    holdBtn(el.btnTurn, 'turn');
    releaseBtn(el.btnTurn);
    // 계단 두 버튼
    holdBtn(el.btnStUp, 'up');
    releaseBtn(el.btnStUp);
    holdBtn(el.btnStTurn, 'turn');
    releaseBtn(el.btnStTurn);

    // 노래 고르기
    el.songPicker.addEventListener('click', function (e) {
      var b = e.target.closest('.song');
      if (!b) return;
      var btns = el.songPicker.querySelectorAll('.song');
      for (var i = 0; i < btns.length; i++) {
        btns[i].classList.remove('is-on');
        btns[i].setAttribute('aria-checked', 'false');
      }
      b.classList.add('is-on');
      b.setAttribute('aria-checked', 'true');
      S.startSong = b.dataset.song;
      audioInit();
      playPiano(melodyOf(S.startSong)[0].midi, 0.7);
      b.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    });

    el.muteToggle.addEventListener('click', function () {
      muted = !muted;
      try { localStorage.setItem('woojin_piano_mute', muted ? '1' : '0'); } catch (e) { }
      if (master) master.gain.value = muted ? 0.0001 : 0.82;
      el.muteToggle.textContent = muted ? '🔇 소리 켜기' : '🔊 소리 끄기';
    });
    el.muteToggle.textContent = muted ? '🔇 소리 켜기' : '🔊 소리 끄기';

    document.addEventListener('keydown', function (e) {
      if (S.screen === 'home') {
        if (e.key === '1') startMode('rhythm');
        if (e.key === '2') startMode('stairs');
        if (e.key === '3') startMode('mix');
        return;
      }
      if (e.key === 'Escape') { if (S.screen === 'play') pauseGame(); else if (S.screen === 'pause') resumeGame(); return; }
      if (S.screen !== 'play') return;
      var k = e.key;
      var laneMap = { '1': 0, '2': 1, '3': 2, '4': 3, 'a': 0, 's': 1, 'd': 2, 'f': 3, 'A': 0, 'S': 1, 'D': 2, 'F': 3 };
      if (laneMap[k] !== undefined) { e.preventDefault(); doAction('lane' + laneMap[k]); }
      else if (k === 'ArrowLeft' || k === 'k' || k === 'K') { e.preventDefault(); doAction('turn'); }
      else if (k === 'ArrowRight' || k === 'Enter' || k === ' ') { e.preventDefault(); doAction(S.mode === 'stairs' ? 'up' : 'turn'); }
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden && S.screen === 'play') pauseGame();
    });
    window.addEventListener('resize', function () {
      clearTimeout(window.__rz);
      window.__rz = setTimeout(resize, 120);
    });
    window.addEventListener('orientationchange', function () { setTimeout(resize, 260); });
  }

  /* ══════════════════════════════════════════════════════════
     부트
     ══════════════════════════════════════════════════════════ */
  function boot() {
    buildStars();
    resize();
    bindUi();
    refreshBest();
    updateHud();
    requestAnimationFrame(frame);
  }

  /* E2E · 점검용 훅 */
  window.__piano = {
    version: 3,
    screen: function () { return S.screen; },
    mode: function () { return S.mode; },
    state: S,
    start: startMode,
    home: goHome,
    pause: pauseGame,
    resume: resumeGame,
    press: doAction,
    songs: function () { return SONG_ORDER.slice(); },
    hud: function () {
      return {
        score: S.score, combo: S.combo, maxCombo: S.maxCombo, hearts: S.hearts,
        stage: S.stage, song: S.song, floor: ST.floor, time: Math.round(ST.time),
        rhythmPtr: RH.ptr, rhythmNotes: RH.notes.length, rhTime: RH.t,
        mixPtr: MX.nextIdx, mixSteps: MX.steps.length
      };
    },
    rhythm: {
      next: function () {
        var n = RH.notes[RH.ptr];
        return n ? { lane: n.lane, t: n.t, dt: n.t - RH.t, midi: n.midi, syl: LANES[n.lane].syl } : null;
      },
      all: function () { return RH.notes.map(function (n) { return { lane: n.lane, t: n.t, hit: n.hit }; }); },
      seek: function (t) { RH.t = t; }
    },
    stairs: {
      next: function () {
        var st = ST.steps[ST.charIdx + 1];
        return st ? { need: st.turn ? 'turn' : 'up', turn: st.turn, floor: ST.charIdx, time: ST.time, stage: S.stage } : null;
      },
      seekFloor: function (n) {
        while (ST.charIdx + 1 <= n) { ST.charIdx++; ST.floor = ST.charIdx; stairsPush(); }
        updateHud();
      }
    },
    mix: {
      next: function () {
        var st = MX.steps[MX.nextIdx];
        return st ? { turn: st.turn, chord: st.chord, lane: st.lane, lanes: st.lanes, stage: st.stage } : null;
      }
    },
    audio: function () {
      return {
        ctx: actx ? actx.state : null,
        master: master ? +master.gain.value.toFixed(4) : 0,
        music: MUS.on,
        musicPtr: MUS.ptr,
        musicTimer: !!MUS.timer,
        musGain: musGain ? +musGain.gain.value.toFixed(4) : 0,
        muted: muted
      };
    },
    layout: function () {
      function box(e) {
        if (!e || e.offsetParent === null) return null;
        var r = e.getBoundingClientRect();
        return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) };
      }
      return {
        W: W, H: H,
        hud: box(el.hudScore), hearts: box(el.hearts), floors: box(el.floorBadge),
        songTag: box(document.querySelector('.song-tag')), acc: box(el.accTag),
        combo: box(el.comboBox), gauge: box(el.timeGauge), prog: box(el.songProg),
        controls: box(activeControls()),
        laneTop: L.laneTop, hitY: L.hitY, fieldBottom: L.fieldBottom
      };
    }
  };

  boot();
})();
