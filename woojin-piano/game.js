/* ══════════════════════════════════════════════════════════════
   도레미 별빛 피아노 · 우진이
   구름 위 피아노 계단 — 오르기 / 방향전환 판단 × 멜로디 연주
   음악: 저작권 만료 클래식·전래동요 12곡을 Web Audio 피아노 신스로 직접 합성
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


  /* ══════ 캔버스 · 레이아웃 ══════ */
  var cv = document.getElementById('stage');
  var ctx = cv.getContext('2d');
  var W = 0, H = 0, dpr = 1;
  var bg = document.createElement('canvas');
  var bgx = bg.getContext('2d');
  var appEl = document.getElementById('app');
  var L = { cx: 0, nearY: 0, fieldBottom: 0, gateY: 0 };

  var scoreNumEl = document.getElementById('scoreNum');
  var hudScoreEl = document.getElementById('hudScore');
  var heartsEl = document.getElementById('hearts');
  var comboBoxEl = document.getElementById('comboBox');
  var comboNumEl = document.getElementById('comboNum');
  var judgeEl = document.getElementById('judge');
  var songTagEl = document.getElementById('songTag');
  var accNumEl = document.getElementById('accNum');
  var bannerEl = document.getElementById('banner');
  var gaugeFillEl = document.getElementById('gaugeFill');
  var gaugeEl = document.getElementById('gauge');
  var melodyEl = document.getElementById('melody');
  var startScreen = document.getElementById('startScreen');
  var overScreen = document.getElementById('overScreen');
  var pauseScreen = document.getElementById('pauseScreen');
  var stageBadgeEl = document.getElementById('stageBadge');

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

  /* ══════ 곡 파싱 ══════ */
  var MEL = {};
  function melodyOf(id) {
    if (MEL[id]) return MEL[id];
    var flat = SONGS[id].melody, out = [];
    for (var i = 0; i < flat.length; i += 2) out.push({ midi: flat[i], beats: flat[i + 1] });
    MEL[id] = out;
    return out;
  }
  function songAt(stage) { return SONG_ORDER[(stage - 1) % SONG_ORDER.length]; }
  function tempoAt(stage) { return Math.pow(1.055, stage - 1); }
  var SOLFA = ['도', '도♯', '레', '레♯', '미', '파', '파♯', '솔', '솔♯', '라', '라♯', '시'];
  var SOLFA_BASE = ['도', '레', '미', '파', '솔', '라', '시'];
  function noteNameOf(m) { return SOLFA[((m % 12) + 12) % 12]; }

  /* ══════ 게임 상태 ══════ */
  var G = {
    mode: 'menu',
    stage: 1, song: 'twinkle', startSong: 'twinkle',
    score: 0, best: 0, combo: 0, maxCombo: 0, lives: 3,
    perfect: 0, judged: 0,
    steps: [], charIdx: 0, nextIdx: 1,
    genStage: 1, genSong: 'twinkle', notePtr: 0, runLeft: 3, dir: 1, wx: 0,
    timeLeft: 0, timeLimit: 1,
    fever: false, hopT: 0, fallT: 0, respawnT: 0,
    oopsT: 0, cheerT: 0, playT: 0,
    shake: 0, flash: 0, beatPulse: 0,
    elapsed: 0, lastStepAt: 0, pressBuf: [], lastInput: 'up',
    stageFlash: 0, progShown: 0
  };
  try { G.best = parseInt(localStorage.getItem('woojin_piano_best') || '0', 10) || 0; } catch (e) { }

  /* ══════ 계단 길 생성 ══════ */
  function runLenFor(stage) {
    var lo = Math.max(2, 4 - Math.floor(stage / 3));
    return lo + Math.floor(Math.random() * 3);
  }

  function pushStep() {
    var mel = melodyOf(G.genSong);
    if (G.notePtr >= mel.length) {
      G.genStage++;
      G.genSong = songAt(G.genStage);
      G.notePtr = 0;
      mel = melodyOf(G.genSong);
      G.runLeft = 2;
    }
    var cur = mel[G.notePtr];
    var turn = false;
    if (G.steps.length > 2) {
      G.runLeft--;
      if (G.runLeft <= 0) {
        turn = true;
        G.dir = -G.dir;
        G.runLeft = runLenFor(G.genStage);
      }
    }
    var bpm = SONGS[G.genSong].bpm * tempoAt(G.genStage);
    var beatSec = 60 / bpm;
    var chord = false, midis = [cur.midi];
    if (G.genStage >= 3 && !turn && G.notePtr + 1 < mel.length && Math.random() < 0.17) {
      chord = true;
      midis.push(mel[G.notePtr + 1].midi);
    }
    var beats = cur.beats + (chord ? mel[G.notePtr + 1].beats : 0);
    var limit = clamp(beatSec * beats * 2.1, 0.6, 1.9 / tempoAt(G.genStage) + 0.5);
    G.wx += G.dir;
    G.steps.push({
      k: G.steps.length, dir: G.dir, turn: turn, wx: G.wx,
      stage: G.genStage, song: G.genSong,
      midi: cur.midi, midis: midis, chord: chord,
      limit: limit, noteName: noteNameOf(cur.midi),
      fall: 0
    });
    G.notePtr += chord ? 2 : 1;
  }

  function ensureSteps(n) {
    var guard = 0;
    while (G.steps.length <= n && guard++ < 200) pushStep();
  }

  function resetPath(songId) {
    G.song = songId; G.startSong = songId;
    G.stage = 1; G.genStage = 1; G.genSong = songId;
    G.notePtr = 0; G.dir = 1; G.runLeft = 3; G.wx = 0;
    G.steps = [{ k: 0, dir: 1, turn: false, wx: 0, stage: 1, song: songId, midi: null, midis: [], chord: false, limit: 1, noteName: '', fall: 0 }];
    G.charIdx = 0; G.nextIdx = 1;
    ensureSteps(14);
    G.timeLimit = G.steps[1].limit;
    G.timeLeft = G.timeLimit;
  }

  /* ══════ 계단 좌표 → 화면 좌표 ══════ */
  function stepScreen(k) {
    if (k < 0) k = 0;
    if (k >= G.steps.length) k = G.steps.length - 1;
    var d = k - G.charIdx;
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
    var x = L.cx + (G.steps[k].wx - G.steps[G.charIdx].wx) * ls;
    return { x: x, y: y, s: s, d: d };
  }

  /* ══════ 레이아웃 ══════ */
  function measure() {
    var ctrl = document.getElementById('controls');
    var r = ctrl ? ctrl.getBoundingClientRect() : null;
    L.fieldBottom = r ? r.top : H - 170;
    L.nearY = L.fieldBottom - 66;
    L.cx = W / 2;
    var hudBottom = hudScoreEl.getBoundingClientRect().bottom;
    L.gateY = Math.max(hudBottom + 76, H * 0.20);
    var pfTop = document.querySelector('.path-bar');
    if (pfTop) pfTop.style.top = (hudBottom + 16) + 'px';
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

  /* ══════ 계단 그리기 ══════ */
  var STEP_COLORS = ['#4d8dff', '#a86bff', '#ff6fbe', '#4fd8ff', '#ffb84d'];
  function stepColor(st) {
    return STEP_COLORS[((st.midi || 60) - 60 + 24) % STEP_COLORS.length];
  }

  function drawRiser(k, now) {
    var a = stepScreen(k - 1), b = stepScreen(k);
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

  function drawTile(k, now) {
    var st = G.steps[k];
    var p = stepScreen(k);
    if (p.d < -2.4 || p.d > 10.5) return;
    var isNext = k === G.nextIdx;
    var past = k <= G.charIdx;
    var w = 92 * p.s, h = 28 * p.s;
    var col = st.midi ? stepColor(st) : '#9fc6e8';

    ctx.save();
    ctx.globalAlpha = past ? 0.42 : clamp(1.06 - Math.max(0, p.d) * 0.03, 0.78, 1);

    // 그림자
    ctx.fillStyle = 'rgba(20, 16, 60, .28)';
    rr(ctx, p.x - w / 2 + 3 * p.s, p.y + 7 * p.s, w, h, 9 * p.s);
    ctx.fill();

    // 계단 앞면(두께)
    var fg = ctx.createLinearGradient(0, p.y, 0, p.y + 26 * p.s);
    fg.addColorStop(0, '#eaf4ff');
    fg.addColorStop(1, '#a9c8ea');
    ctx.fillStyle = fg;
    rr(ctx, p.x - w / 2, p.y + 2 * p.s, w, 20 * p.s, 8 * p.s);
    ctx.fill();

    // 건반 윗면
    var tg = ctx.createLinearGradient(0, p.y - h / 2, 0, p.y + h / 2);
    if (isNext) {
      tg.addColorStop(0, '#fffdf0');
      tg.addColorStop(0.5, '#fff6cd');
      tg.addColorStop(1, '#ffe9a3');
    } else {
      tg.addColorStop(0, '#ffffff');
      tg.addColorStop(0.6, '#f6fbff');
      tg.addColorStop(1, '#e2efff');
    }
    ctx.fillStyle = tg;
    rr(ctx, p.x - w / 2, p.y - h / 2, w, h, 8 * p.s);
    ctx.fill();
    ctx.strokeStyle = isNext ? 'rgba(255, 196, 60, .95)' : hexA(col, 0.55);
    ctx.lineWidth = Math.max(1, (isNext ? 2.6 : 1.6) * p.s);
    rr(ctx, p.x - w / 2, p.y - h / 2, w, h, 8 * p.s);
    ctx.stroke();

    // 검은 건반 장식
    ctx.fillStyle = 'rgba(24, 22, 52, .88)';
    rr(ctx, p.x - w * 0.16, p.y - h / 2 - 4 * p.s, w * 0.32, h * 0.62, 3 * p.s);
    ctx.fill();

    // 건반 색 띠
    ctx.save();
    ctx.globalAlpha *= 0.85;
    ctx.fillStyle = hexA(col, 0.9);
    rr(ctx, p.x - w * 0.4, p.y + h * 0.28, w * 0.8, Math.max(2, 3.4 * p.s), 2);
    ctx.fill();
    ctx.restore();

    // 계이름
    if (p.s > 0.5 && st.noteName) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '900 ' + Math.round(13 * p.s) + 'px "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
      ctx.fillStyle = st.chord ? '#b3560a' : '#2f5f96';
      ctx.fillText(st.chord ? st.noteName + '+' : st.noteName, p.x, p.y + h * 0.06);
      ctx.restore();
    }

    // 다음 계단 표시
    if (isNext) {
      var pulse = 0.5 + 0.5 * Math.sin(now * 0.008);
      ctx.strokeStyle = 'rgba(255, 214, 90,' + (0.55 + 0.4 * pulse) + ')';
      ctx.lineWidth = 2.4 * p.s;
      ctx.shadowColor = 'rgba(255, 205, 80, .95)';
      ctx.shadowBlur = 16 * p.s;
      rr(ctx, p.x - w / 2 - 3 * p.s, p.y - h / 2 - 3 * p.s, w + 6 * p.s, h + 6 * p.s, 10 * p.s);
      ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = 0.9;
      // '?' — 어떤 판단인지는 계단 모양으로 읽는다
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '900 ' + Math.round(15 * p.s) + 'px "Apple SD Gothic Neo", sans-serif';
      ctx.fillStyle = '#c98a00';
      ctx.fillText(st.chord ? '♪♪' : '?', p.x, p.y - h * 0.85);
      ctx.restore();
      return;
    }
    ctx.restore();
  }

  /* 같은 방향으로 곧장 이어지면 '오르기', 꺾이면 '방향전환' — 예상선을 점선으로 보여준다 */
  function drawPredictor(now) {
    var st = G.steps[G.charIdx];
    if (!st) return;
    var base = stepScreen(G.charIdx);
    for (var i = 1; i <= 2; i++) {
      var si = clamp(1.02 - 0.052 * i, 0.42, 1.04);
      var lsi = 33 * (0.5 + 0.5 * si);
      var y = L.nearY - (56 * i) + 1.45 * i * i;
      var x = base.x + st.dir * i * lsi;
      var w = 92 * si, h = 28 * si;
      ctx.save();
      ctx.globalAlpha = 0.2 + 0.07 * Math.sin(now * 0.004 + i);
      ctx.setLineDash([6 * si, 5 * si]);
      ctx.strokeStyle = 'rgba(255, 255, 255, .95)';
      ctx.lineWidth = 1.6;
      rr(ctx, x - w / 2, y - h / 2, w, h, 8 * si);
      ctx.stroke();
      ctx.restore();
    }
  }


  /* ══════ 캐릭터 ══════ */
  function currentPose() {
    if (G.fallT > 0 || G.oopsT > 0) return 'oops';
    if (G.cheerT > 0) return 'cheer';
    if (G.playT > 0) return 'play';
    return 'run';
  }

  function drawCharacter(now) {
    var hop = clamp(G.hopT, 0, 1);
    var prevK = Math.max(0, G.charIdx - 1);
    var a = stepScreen(prevK), b = stepScreen(G.charIdx);
    var t = 1 - hop;
    var x = lerp(a.x, b.x, easeOut(t));
    var y = lerp(a.y, b.y, easeOut(t)) - Math.sin(Math.PI * hop) * 34 * b.s;
    var s = lerp(a.s, b.s, t);
    var pose = currentPose();
    var rec = spriteSet[pose] || spriteSet.run;
    var h = 114 * s;
    var w = h * (rec.ar || 0.46);

    ctx.save();
    // 그림자
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = 'rgba(30, 80, 150, .8)';
    ctx.beginPath();
    ctx.ellipse(b.x, b.y + 8 * s, w * 0.34, 6 * s, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    // 후광
    var hg = ctx.createRadialGradient(x, y - h * 0.5, 2, x, y - h * 0.5, h * 0.72);
    hg.addColorStop(0, G.fever ? 'rgba(255, 248, 205, .42)' : 'rgba(255,255,255,.24)');
    hg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.arc(x, y - h * 0.5, h * 0.72, 0, TAU);
    ctx.fill();

    ctx.save();
    ctx.translate(x, y);
    if (G.fallT > 0) {
      var ft = 1 - clamp(G.fallT, 0, 1);
      ctx.rotate(ft * 0.9);
      ctx.globalAlpha = clamp(1 - ft * 0.85, 0, 1);
      ctx.translate(0, ft * 150);
    }
    var bob = G.mode === 'playing' ? Math.sin(now * 0.006) * 1.6 * s : Math.sin(now * 0.0035) * 3;
    ctx.translate(0, bob);
    if (rec.ready) {
      ctx.imageSmoothingQuality = 'high';
      ctx.shadowColor = 'rgba(24, 70, 130, .34)';
      ctx.shadowBlur = 10 * s + 3;
      ctx.shadowOffsetY = 4 * s;
      ctx.drawImage(rec.img, -w * rec.ax, -h, w, h);
    } else {
      ctx.fillStyle = '#cfe8ff';
      rr(ctx, -w / 2, -h, w, h, 10);
      ctx.fill();
    }
    ctx.restore();

    // 피버 왕관
    if (G.fever || pose === 'cheer') {
      ctx.save();
      ctx.translate(x, y - h - 4);
      ctx.rotate(Math.sin(now * 0.004) * 0.12);
      var cs = Math.max(0.42, 0.95 * s);
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

  /* ══════ 배너 · 판정 표시 ══════ */
  var bannerTimer = null;
  function showBanner(text) {
    bannerEl.textContent = text;
    bannerEl.classList.remove('show');
    void bannerEl.offsetWidth;
    bannerEl.classList.add('show');
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(function () { bannerEl.classList.remove('show'); }, 1500);
  }

  function judgeShow(text, cls) {
    judgeEl.textContent = text;
    judgeEl.className = 'judge ' + cls;
    void judgeEl.offsetWidth;
    judgeEl.classList.add('show');
  }

  /* ══════ HUD ══════ */
  var hudCache = { score: -1, combo: -1, lives: -1, acc: -1, tag: '', note: '', stage: -1, gauge: -1 };

  function updateHud() {
    if (hudCache.score !== G.score) {
      hudCache.score = G.score;
      scoreNumEl.textContent = fmt(G.score);
      scoreNumEl.classList.remove('pop');
      void scoreNumEl.offsetWidth;
      scoreNumEl.classList.add('pop');
    }
    if (hudCache.combo !== G.combo) {
      hudCache.combo = G.combo;
      comboNumEl.textContent = G.combo;
      comboBoxEl.classList.toggle('on', G.combo > 0);
      comboNumEl.classList.remove('bump');
      void comboNumEl.offsetWidth;
      comboNumEl.classList.add('bump');
    }
    if (hudCache.lives !== G.lives) {
      hudCache.lives = G.lives;
      var hs = heartsEl.children;
      for (var i = 0; i < hs.length; i++) hs[i].classList.toggle('gone', i >= G.lives);
    }
    var acc = G.judged ? Math.round(G.perfect / G.judged * 100) : 100;
    if (hudCache.acc !== acc) { hudCache.acc = acc; accNumEl.textContent = acc; }
    var tag = SONGS[G.song].emoji + ' ' + SONGS[G.song].name;
    if (hudCache.tag !== tag) {
      hudCache.tag = tag;
      songTagEl.textContent = tag;
    }
    if (hudCache.stage !== G.stage) {
      hudCache.stage = G.stage;
      var info = STAGES[Math.min(STAGES.length, G.stage) - 1];
      if (stageBadgeEl) {
        stageBadgeEl.textContent = 'STAGE ' + G.stage + ' ' + info.emoji;
        stageBadgeEl.classList.toggle('pro', G.stage >= 4);
      }
    }
    // 다음 음 표시
    var nx = G.steps[G.nextIdx];
    var nm = nx ? (nx.chord ? nx.noteName + '+' + noteNameOf(nx.midis[1]) : nx.noteName) : '';
    if (hudCache.note !== nm) {
      hudCache.note = nm;
      updateMelody(nx);
    }
  }

  function updateMelody(nx) {
    if (!melodyEl) return;
    var base = nx ? nx.noteName.replace('♯', '') : '';
    var keys = melodyEl.children;
    for (var i = 0; i < keys.length; i++) {
      keys[i].classList.toggle('on', keys[i].dataset.note === base);
    }
  }

  /* ══════ 입력 ══════ */
  function press(action) {
    if (G.mode !== 'playing' || G.fallT > 0 || G.respawnT > 0) return;
    var st = G.steps[G.nextIdx];
    if (!st) return;
    audioInit();
    G.lastInput = action;

    if (st.chord) {
      var nowMs = performance.now();
      G.pressBuf = G.pressBuf.filter(function (p) { return nowMs - p.t < 260; });
      G.pressBuf.push({ a: action, t: nowMs });
      var hasU = false, hasT = false;
      for (var i = 0; i < G.pressBuf.length; i++) {
        if (G.pressBuf[i].a === 'up') hasU = true;
        if (G.pressBuf[i].a === 'turn') hasT = true;
      }
      if (hasU && hasT) {
        G.pressBuf = [];
        hitStep(st, true);
      }
      return;
    }

    if (action === (st.turn ? 'turn' : 'up')) hitStep(st, false);
    else failStep('wrong');
  }

  function hitStep(st, chordHit) {
    var midis = st.chord ? st.midis : [st.midi];
    for (var i = 0; i < midis.length; i++) {
      playPiano(midis[i], i === 0 ? 1 : 0.88);
    }
    var ratio = G.timeLimit > 0 ? G.timeLeft / G.timeLimit : 1;
    var perfect = ratio > 0.55;
    var pts = (perfect ? 120 : 80) * (st.chord ? 1.6 : 1) * (G.fever ? 2 : 1);
    G.score += Math.round(pts);
    G.combo++;
    if (G.combo > G.maxCombo) G.maxCombo = G.combo;
    G.judged++;
    if (perfect) G.perfect++;
    if (!G.fever && G.combo >= 10) {
      G.fever = true;
      G.cheerT = 1.1;
      showBanner('피버 타임! 점수 2배 🌈');
      playSparkle(76);
    }
    if (perfect && G.combo % 7 === 0) G.playT = 0.5;

    var p = stepScreen(G.nextIdx);
    burst(p.x, p.y - 10, stepColor(st), perfect ? 16 : 9, 1);
    burst(p.x, p.y - 10, '#ffffff', 6, 0.7);
    judgeShow(perfect ? 'Perfect!' : 'Good!', perfect ? 'perfect' : 'great');
    try { if (navigator.vibrate) navigator.vibrate(perfect ? 12 : 8); } catch (e) { }

    // 다음 계단으로 상승
    G.charIdx = G.nextIdx;
    G.nextIdx++;
    G.hopT = 1;
    ensureSteps(G.charIdx + 14);

    // 스테이지(판) 전환 — 자동으로 다음 곡
    var nx = G.steps[G.nextIdx];
    if (nx && nx.stage !== G.stage) {
      G.stage = nx.stage;
      G.song = nx.song;
      var info = STAGES[Math.min(STAGES.length, G.stage) - 1];
      showBanner('STAGE ' + G.stage + ' · ' + SONGS[G.song].name + ' ' + info.emoji);
      G.flash = 0.55;
      G.cheerT = 1.4;
      playSparkle(72 + (G.stage % 5) * 2);
      hudCache.stage = -1; hudCache.tag = '';
    }
    G.timeLimit = nx ? nx.limit : 1.2;
    G.timeLeft = G.timeLimit;
    updateHud();
  }

  function failStep(kind) {
    var st = G.steps[G.nextIdx];
    G.combo = 0;
    G.fever = false;
    G.lives--;
    G.judged++;
    G.fallT = 1;
    G.oopsT = 1.5;
    G.shake = 1;
    G.timeLeft = G.timeLimit;
    playThud();
    judgeShow(kind === 'wrong' ? '아차!' : '놓쳤어요', 'miss');
    try { if (navigator.vibrate) navigator.vibrate([12, 40, 18]); } catch (e) { }
    if (st) {
      burst(stepScreen(G.nextIdx).x, stepScreen(G.nextIdx).y, '#ff9ec4', 14, 1.1);
    }
    if (G.lives <= 0) {
      G.respawnT = 0;
      setTimeout(gameOver, 620);
    } else {
      G.respawnT = 0.95;
    }
    updateHud();
  }

  /* ══════ 진행 ══════ */
  function update(dt, now) {
    G.elapsed += dt;
    G.hopT = Math.max(0, G.hopT - dt * 6.2);
    G.fallT = Math.max(0, G.fallT - dt * 1.15);
    G.oopsT = Math.max(0, G.oopsT - dt);
    G.cheerT = Math.max(0, G.cheerT - dt);
    G.playT = Math.max(0, G.playT - dt);
    G.shake = Math.max(0, G.shake - dt * 2.6);
    G.flash = Math.max(0, G.flash - dt * 1.5);

    if (G.respawnT > 0) {
      G.respawnT = Math.max(0, G.respawnT - dt);
      if (G.respawnT === 0) { G.timeLeft = G.timeLimit; G.oopsT = 0; }
      updateParts(dt);
      updateHud();
      return;
    }
    if (G.fallT > 0) { updateParts(dt); updateHud(); return; }

    // 게이지
    G.timeLeft -= dt;
    if (G.timeLeft <= 0) {
      G.timeLeft = 0;
      failStep('timeout');
    }
    // 화음 계단: 한 버튼만 누르고 시간이 흐르면 실수
    if (G.steps[G.nextIdx] && G.steps[G.nextIdx].chord && G.pressBuf.length) {
      var nowMs = performance.now();
      G.pressBuf = G.pressBuf.filter(function (p) { return nowMs - p.t < 260; });
    }

    updateParts(dt);
    updateHud();
    var pct = clamp(G.timeLeft / Math.max(0.01, G.timeLimit), 0, 1) * 100;
    if (Math.abs(pct - (hudCache.gauge || 0)) > 0.6) {
      hudCache.gauge = pct;
      if (gaugeFillEl) {
        gaugeFillEl.style.width = pct.toFixed(1) + '%';
        gaugeEl.classList.toggle('low', pct < 30);
      }
    }
  }

  /* ══════ 렌더 ══════ */
  function render(now) {
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    if (G.shake > 0.01) {
      ctx.translate(rnd(-1, 1) * G.shake * 5, rnd(-1, 1) * G.shake * 4);
    }
    ctx.drawImage(bg, 0, 0, W, H);

    var drift = (now * 0.004) % (W + 300) - 150;
    drawCloud(ctx, drift, H * 0.52, 1.05, 0.22);
    drawCloud(ctx, W - drift * 0.8, H * 0.62, 0.9, 0.18);

    if (G.mode !== 'menu') {
      drawPredictor(now);
      var top = Math.min(G.steps.length - 1, G.charIdx + 9);
      var k;
      for (k = Math.max(0, G.charIdx - 2); k <= top; k++) if (k >= 1) drawRiser(k, now);
      for (k = top; k >= Math.max(0, G.charIdx - 2); k--) drawTile(k, now);
      drawCharacter(now);
      drawTile(G.nextIdx, now);
      drawParts();
    } else {
      drawCharacter(now);
      drawParts();
    }

    if (G.stage >= 4 && G.mode !== 'menu') {
      var pg = ctx.createLinearGradient(0, 0, 0, H);
      pg.addColorStop(0, 'rgba(255, 222, 140, .14)');
      pg.addColorStop(0.5, 'rgba(255, 222, 140, 0)');
      pg.addColorStop(1, 'rgba(255, 196, 96, .12)');
      ctx.fillStyle = pg;
      ctx.fillRect(0, 0, W, H);
    }
    if (G.flash > 0.01) {
      ctx.fillStyle = 'rgba(255,255,255,' + (G.flash * 0.4) + ')';
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
  }

  /* ══════ 루프 ══════ */
  var lastT = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    var dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 0.016;
    lastT = now;
    if (G.mode === 'playing') update(dt, now);
    else {
      updateParts(dt);
      G.hopT = Math.max(0, G.hopT - dt * 6.2);
      G.fallT = Math.max(0, G.fallT - dt * 1.15);
      G.oopsT = Math.max(0, G.oopsT - dt);
      G.cheerT = Math.max(0, G.cheerT - dt);
      G.hopT = Math.max(0, G.hopT - dt * 6.2);
    }
    render(now);
  }

  /* ══════ 시작 · 종료 ══════ */
  function startGame() {
    audioInit();
    if (actx && actx.state === 'suspended') { try { actx.resume(); } catch (e) { } }
    G.mode = 'playing';
    G.score = 0; G.combo = 0; G.maxCombo = 0; G.lives = 3;
    G.perfect = 0; G.judged = 0;
    G.fever = false; G.hopT = 0; G.fallT = 0; G.respawnT = 0;
    G.oopsT = 0; G.cheerT = 0; G.playT = 0;
    G.shake = 0; G.flash = 0.45; G.elapsed = 0; G.pressBuf = [];
    hudCache = { score: -1, combo: -1, lives: -1, acc: -1, tag: '', note: '', stage: -1, gauge: -1 };
    resetPath(G.startSong);
    startScreen.classList.remove('show');
    overScreen.classList.remove('show');
    pauseScreen.classList.remove('show');
    judgeEl.className = 'judge';
    comboBoxEl.classList.remove('on');
    for (var i = 0; i < heartsEl.children.length; i++) heartsEl.children[i].classList.remove('gone');
    updateHud();
    measure();
    var info = STAGES[0];
    showBanner('출발! 계단을 읽고 올라요 ' + info.emoji);
  }

  function gameOver() {
    G.mode = 'over';
    G.fallT = 0;
    if (G.score > G.best) {
      G.best = G.score;
      try { localStorage.setItem('woojin_piano_best', String(G.best)); } catch (e) { }
    }
    document.getElementById('overScore').textContent = fmt(G.score);
    document.getElementById('overCombo').textContent = G.maxCombo + '콤보';
    document.getElementById('overBest').textContent = fmt(G.best);
    document.getElementById('overStage').textContent = 'STAGE ' + G.stage;
    var title, msg;
    if (G.stage >= 4) { title = '계단 마스터!'; msg = '구름 성문이 활짝 열렸어요 ✨'; }
    else if (G.stage >= 3) { title = '대단해요!'; msg = '판을 넘어 다음 노래까지! 🌈'; }
    else if (G.score >= 1200) { title = '잘했어요!'; msg = '다음엔 더 높이 올라가요 ⭐'; }
    else { title = '한 번 더!'; msg = '계단 모양을 보고 천천히 눌러요 🎈'; }
    document.getElementById('overTitle').textContent = title;
    document.getElementById('overMsg').textContent = msg;
    var faceEl = document.querySelector('#overScreen .over-face');
    if (faceEl) faceEl.src = G.stage >= 3 ? 'assets/woojin-cheer.png' : 'assets/woojin-oops.png';
    setTimeout(function () { overScreen.classList.add('show'); }, 380);
  }

  function toMenu() {
    G.mode = 'menu';
    G.fallT = 0; G.oopsT = 0; G.cheerT = 0; G.playT = 0;
    overScreen.classList.remove('show');
    pauseScreen.classList.remove('show');
    startScreen.classList.add('show');
    document.getElementById('bestNum').textContent = fmt(G.best);
    resetPath(G.startSong);
    G.charIdx = 0; G.nextIdx = 1;
  }

  function pauseGame() {
    if (G.mode !== 'playing') return;
    G.mode = 'paused';
    pauseScreen.classList.add('show');
  }
  function resumeGame() {
    if (G.mode !== 'paused') return;
    G.mode = 'playing';
    pauseScreen.classList.remove('show');
    lastT = 0;
  }

  /* ══════ UI 바인딩 ══════ */
  function holdBtn(el, action) {
    function down(e) {
      e.preventDefault();
      el.classList.add('down');
      press(action);
      clearTimeout(el._t);
      el._t = setTimeout(function () { el.classList.remove('down'); }, 110);
    }
    el.addEventListener('pointerdown', down, { passive: false });
    el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

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

    holdBtn(document.getElementById('btnUp'), 'up');
    holdBtn(document.getElementById('btnTurn'), 'turn');

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
      G.startSong = b.dataset.song;
      resetPath(G.startSong);
      audioInit();
      playPiano(melodyOf(G.startSong)[0].midi, 0.7);
    });

    document.addEventListener('keydown', function (e) {
      if (G.mode !== 'playing') return;
      var k = e.key;
      if (k === 'ArrowUp' || k === ' ' || k === 'w' || k === 'W') {
        e.preventDefault(); press('up');
      } else if (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'a' || k === 'd' || k === 'Enter') {
        e.preventDefault(); press('turn');
      }
    });
  }

  /* ══════ 부트 ══════ */
  function boot() {
    buildStars();
    resetPath('twinkle');
    resize();
    bindUi();
    document.getElementById('bestNum').textContent = fmt(G.best);
    updateHud();
    window.addEventListener('resize', function () {
      clearTimeout(window.__rz);
      window.__rz = setTimeout(resize, 120);
    });
    window.addEventListener('orientationchange', function () { setTimeout(resize, 260); });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && G.mode === 'playing') pauseGame();
    });
    requestAnimationFrame(frame);
  }

  // 디버그/E2E 훅
  window.__piano = {
    state: G,
    press: press,
    next: function () {
      var st = G.steps[G.nextIdx];
      if (!st) return null;
      return { k: st.k, turn: st.turn, chord: st.chord, stage: st.stage, song: st.song,
               note: st.noteName, midis: st.midis, limit: st.limit, x: stepScreen(G.nextIdx).x, y: stepScreen(G.nextIdx).y };
    },
    at: function (k) { return { ...G.steps[k], ...stepScreen(k) } },
    songs: function () { return SONG_ORDER.slice(); },
    sprites: function () {
      var out = {};
      for (var k in spriteSet) out[k] = !!spriteSet[k].ready;
      return out;
    },
    pose: currentPose,
    stage: function () { return G.stage; },
    song: function () { return G.song; },
    hardMode: function (n) { G.stage = n; }
  };

  boot();
})();
