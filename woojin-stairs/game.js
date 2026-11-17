/* 천국의 계단 · 우진이의 구름 계단
   오리지널 아케이드 — 달리는 손맛, 스페셜 계단, 수집 아이템
   ------------------------------------------------------------- */
(function () {
  'use strict';

  var TAU = Math.PI * 2;
  var clamp = function (v, a, b) { a = a === undefined ? 0 : a; b = b === undefined ? 1 : b; return v < a ? a : v > b ? b : v; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var easeOutCubic = function (t) { return 1 - Math.pow(1 - t, 3); };
  var easeInOut = function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };

  function hex2rgb(h) { var n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }

  /* ── 하늘 단계 ─────────────────────────────────────────── */
  var STAGES = [
    { f: 0, top: '#8ed4ff', mid: '#cdf0ff', bot: '#f7fdff', sTop: '#ffffff', sFace: '#dceeff', sEdge: '#a9d3f7' },
    { f: 12, top: '#6d59a8', mid: '#ff9f6e', bot: '#ffe2b8', sTop: '#fff3e2', sFace: '#ffc993', sEdge: '#e59a5f' },
    { f: 28, top: '#a4e5ff', mid: '#e2f6ff', bot: '#fff8e4', sTop: '#ffffff', sFace: '#e9f4ff', sEdge: '#bcdcff' },
    { f: 46, top: '#05061c', mid: '#1b2450', bot: '#3a2d66', sTop: '#5c5aa4', sFace: '#2f2c5c', sEdge: '#807ccc' },
    { f: 70, top: '#ffe6ad', mid: '#fff1d0', bot: '#fffcf3', sTop: '#fffdf6', sFace: '#ffdf9c', sEdge: '#eebc45' }
  ].map(function (s) {
    return {
      f: s.f, top: hex2rgb(s.top), mid: hex2rgb(s.mid), bot: hex2rgb(s.bot),
      sTop: hex2rgb(s.sTop), sFace: hex2rgb(s.sFace), sEdge: hex2rgb(s.sEdge)
    };
  });

  function weights(f) {
    var n = STAGES.length, w = [], i;
    for (i = 0; i < n; i++) {
      var start = STAGES[i].f;
      var end = i + 1 < n ? STAGES[i + 1].f : Infinity;
      var inA = i === 0 ? 1 : clamp((f - start + 4) / 5);
      var outA = end === Infinity ? 1 : clamp((end + 1 - f) / 5);
      w.push(Math.min(inA, outA));
    }
    var sum = 0; for (i = 0; i < n; i++) sum += w[i];
    if (sum <= 0) { w = [1, 0, 0, 0, 0]; sum = 1; }
    for (i = 0; i < n; i++) w[i] /= sum;
    return w;
  }

  function mix(ws, key, a) {
    var r = 0, g = 0, b = 0;
    for (var i = 0; i < STAGES.length; i++) { var c = STAGES[i][key]; r += c[0] * ws[i]; g += c[1] * ws[i]; b += c[2] * ws[i]; }
    r |= 0; g |= 0; b |= 0;
    return a === undefined ? 'rgb(' + r + ',' + g + ',' + b + ')' : 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }

  /* ── 소리 (Web Audio 자체 합성) ─────────────────────────── */
  var actx = null, master = null, muted = false;
  try { muted = localStorage.getItem('woojin_stairs_mute') === '1'; } catch (e) { }

  function audioInit() {
    if (actx) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      actx = new AC();
      master = actx.createGain();
      master.gain.value = 0.5;
      master.connect(actx.destination);
    } catch (e) { actx = null; }
  }

  function tone(freq, dur, type, vol, slideTo, delay) {
    if (!actx || muted) return;
    if (actx.state === 'suspended') actx.resume();
    var t0 = actx.currentTime + (delay || 0);
    var o = actx.createOscillator(), g = actx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol === undefined ? 0.2 : vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.06);
  }

  /* 콤보 음계: 장음계 위로 한 칸씩 */
  var SCALE = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21, 23, 24];
  function noteFreq(base, step) {
    var s = SCALE[Math.min(step, SCALE.length - 1)] + (step >= SCALE.length ? Math.floor(step / SCALE.length) * 12 : 0);
    return base * Math.pow(2, s / 12);
  }

  var sfx = {
    step: function (combo) {
      var f = noteFreq(392, Math.max(0, combo - 1));
      tone(f, 0.10, 'triangle', 0.18, f * 1.9);
      tone(f * 2, 0.045, 'sine', 0.05);
    },
    turn: function () {
      tone(700, 0.09, 'sine', 0.10, 520);
      tone(520, 0.08, 'triangle', 0.07, 400, 0.05);
    },
    item: function (kind) {
      var b = kind === 'heart' ? 880 : kind === 'candy' ? 988 : 1046;
      tone(b, 0.13, 'sine', 0.16);
      tone(b * 1.5, 0.19, 'sine', 0.12, null, 0.05);
      tone(b * 2, 0.12, 'triangle', 0.05, null, 0.09);
    },
    fever: function () {
      [523, 659, 784, 1047, 1319].forEach(function (f, i) { tone(f, 0.18, 'triangle', 0.16, null, i * 0.055); });
      tone(2093, 0.3, 'sine', 0.07, null, 0.3);
    },
    fanfare: function (high) {
      var seq = high ? [523, 659, 784, 1047, 784, 1047, 1319] : [523, 659, 784, 1047];
      seq.forEach(function (f, i) { tone(f, 0.2, 'square', 0.09, null, i * 0.1); tone(f * 2, 0.16, 'triangle', 0.06, null, i * 0.1); });
    },
    boost: function () {
      for (var i = 0; i < 6; i++) tone(523 * Math.pow(2, i / 6), 0.09, 'triangle', 0.10, 1046, i * 0.045);
    },
    clock: function () {
      tone(1318, 0.1, 'sine', 0.14);
      tone(1760, 0.16, 'sine', 0.12, null, 0.08);
      tone(2093, 0.22, 'triangle', 0.08, null, 0.16);
    },
    tick: function () { tone(1000, 0.04, 'square', 0.05); },
    fail: function () {
      tone(520, 0.5, 'sawtooth', 0.13, 90);
      tone(300, 0.6, 'sine', 0.10, 55, 0.05);
    },
    over: function () {
      tone(660, 0.16, 'triangle', 0.14, 560);
      tone(560, 0.18, 'triangle', 0.12, 470, 0.14);
      tone(470, 0.5, 'sine', 0.12, 150, 0.3);
    },
    start: function () { [523, 659, 784].forEach(function (f, i) { tone(f, 0.13, 'triangle', 0.15, null, i * 0.07); }); }
  };

  /* ── 캔버스 & 이미지 ───────────────────────────────────── */
  var cv = document.getElementById('stage');
  var ctx = cv.getContext('2d');
  var W = 390, H = 844, DPR = 1;

  var bodyImg = new Image(); var bodyReady = false;
  bodyImg.onload = function () { bodyReady = true; };
  bodyImg.src = 'assets/woojin-body.png';

  var faceImg = new Image(); var faceReady = false;
  faceImg.onload = function () { faceReady = true; };
  faceImg.src = 'assets/woojin-face.png';

  function resize() {
    var r = cv.getBoundingClientRect();
    W = Math.max(1, r.width || window.innerWidth);
    H = Math.max(1, r.height || window.innerHeight);
    DPR = Math.min(window.devicePixelRatio || 1, 2.5);
    cv.width = Math.round(W * DPR);
    cv.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  /* ── 상태 ──────────────────────────────────────────────── */
  var S = {
    mode: 'ready',
    floor: 0, score: 0,
    best: 0, bestScore: 0,
    dir: 1,
    camF: 0,
    gauge: 100,
    combo: 0, lastClimb: -99,
    fever: 0,
    t: 0,
    jump: null, fall: null,
    land: null,
    punch: 0, shake: 0,
    auto: null,
    seed: 1,
    taken: {},
    trail: [],
    particles: [], rings: [], floaters: [],
    lowTick: 0,
    reason: ''
  };

  try {
    S.best = parseInt(localStorage.getItem('woojin_stairs_best') || '0', 10) || 0;
    S.bestScore = parseInt(localStorage.getItem('woojin_stairs_best_score') || '0', 10) || 0;
  } catch (e) { }

  function saveBest() {
    var record = false;
    if (S.floor > S.best) { S.best = S.floor; S.bestScore = Math.max(S.bestScore, S.score); record = true; }
    else if (S.score > S.bestScore) { S.bestScore = S.score; record = true; }
    try {
      localStorage.setItem('woojin_stairs_best', String(S.best));
      localStorage.setItem('woojin_stairs_best_score', String(S.bestScore));
    } catch (e) { }
    return record;
  }

  /* ── 무대 기하 ─────────────────────────────────────────── */
  function stairX(n) { return (n % 2 === 0) ? W * 0.30 : W * 0.70; }
  function risePx() { return H * 0.084; }
  function baseY() { return H * 0.70; }
  function yOf(n) { return baseY() - (n - S.camF) * risePx(); }
  function stairW() { return Math.min(W * 0.44, 240); }
  function spriteH() { return clamp(H * 0.172, 104, 152); }

  /* ── 계단 위 요소 (아이템·스페셜) ───────────────────────── */
  function hash2(n, s) {
    var x = (n * 2654435761 + s * 40503) >>> 0;
    x ^= x >>> 15; x = (x * 2246822519) >>> 0; x ^= x >>> 13; x = (x * 3266489917) >>> 0;
    return x >>> 0;
  }
  function stepKind(n) {
    if (n < 3) return 'normal';
    var h = hash2(n, S.seed) % 1000;
    if (h < 92 && n % 3 !== 0) return 'boost';
    if (h >= 92 && h < 165 && n % 3 !== 1) return 'clock';
    return 'normal';
  }
  function itemAt(n) {
    if (n < 1) return null;
    var h = hash2(n + 777, S.seed);
    if (h % 100 >= 38) return null;
    var kinds = ['star', 'candy', 'heart'];
    return { kind: kinds[(h >>> 9) % 3], ph: (h >>> 17) % 100 / 100 };
  }

  /* ── 이펙트 ────────────────────────────────────────────── */
  function burst(x, y, n, colors, power) {
    if (S.particles.length > 150) return;
    for (var i = 0; i < n; i++) {
      var a = Math.random() * TAU, sp = (power || 1) * (70 + Math.random() * 170);
      S.particles.push({
        x: x, y: y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 50,
        life: 0, max: 0.32 + Math.random() * 0.18,
        r: 1.5 + Math.random() * 2.4,
        col: colors[(Math.random() * colors.length) | 0],
        star: Math.random() < 0.4
      });
    }
  }
  function ringFx(x, y, col, r0, r1, dur) {
    if (S.rings.length > 12) S.rings.shift();
    S.rings.push({ x: x, y: y, col: col, t: 0, max: dur || 0.34, r0: r0 || 8, r1: r1 || 58 });
  }
  function floatText(x, y, text, col, size) {
    if (S.floaters.length > 14) S.floaters.shift();
    S.floaters.push({ x: x, y: y, text: text, life: 0, max: 0.5, col: col || '#ff7a59', size: size || 20 });
  }
  function vibrate(ms) {
    try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { }
  }

  /* ── 게임 흐름 ─────────────────────────────────────────── */
  function resetRun() {
    S.floor = 0; S.score = 0;
    S.dir = 1; S.camF = 0;
    S.gauge = 100; S.combo = 0; S.lastClimb = -99;
    S.fever = 0; S.jump = null; S.fall = null; S.land = null;
    S.punch = 0; S.shake = 0; S.auto = null;
    S.taken = {}; S.trail.length = 0;
    S.particles.length = 0; S.rings.length = 0; S.floaters.length = 0;
    S.lowTick = 0; S.reason = '';
    S.seed = 1 + Math.floor(Math.random() * 90000);
    S.mode = 'playing';
  }

  function startGame() {
    audioInit();
    if (actx && actx.state === 'suspended') { actx.resume(); }
    resetRun();
    hideOverlay();
    sfx.start();
    updateHUD(true);
    setComboTag('');
  }

  function doTurn() {
    if (S.mode !== 'playing' || S.auto) return;
    S.dir *= -1;
    sfx.turn();
    var v = charVisual();
    burst(v.x, v.feet - 6, 5, ['rgba(255,255,255,0.95)', 'rgba(170,220,255,0.9)'], 0.5);
    ringFx(v.x, v.feet - 4, 'rgba(160,215,255,0.9)', 6, 30, 0.26);
    vibrate(6);
  }

  function climbCore(auto) {
    var from = S.floor;
    var need = (stairX(from + 1) > stairX(from)) ? 1 : -1;
    if (auto) S.dir = need;
    else if (S.dir !== need) { missStep(); return false; }

    S.floor += 1;
    var rapid = (S.t - S.lastClimb) < 1.6;
    S.combo = rapid ? S.combo + 1 : 1;
    S.lastClimb = S.t;

    var feverOn = S.combo >= 5;
    var gain = feverOn ? 20 : 10;
    S.score += gain;

    S.jump = { t: 0, dur: auto ? 0.10 : 0.12, from: from, to: S.floor };
    S.gauge = Math.min(100, S.gauge + (auto ? 10 : 22));
    S.punch = Math.min(1, S.punch + (auto ? 0.3 : 0.62));

    sfx.step(S.combo);
    vibrate(feverOn ? 12 : 7);

    var px = stairX(S.floor), py = yOf(S.floor);
    var cols = feverOn
      ? ['#ffd76a', '#ffe9a8', '#fff6d0', '#ffb347', '#ffffff']
      : ['rgba(255,255,255,0.95)', 'rgba(190,230,255,0.92)'];
    burst(px, py - 4, feverOn ? 9 : 6, cols, feverOn ? 1.1 : 0.8);
    ringFx(px, py - 2, feverOn ? 'rgba(255,214,110,0.95)' : 'rgba(255,255,255,0.85)', 8, 52, 0.3);
    floatText(px + (S.dir > 0 ? 30 : -30), py - 78, '+' + gain, feverOn ? '#c07a00' : '#e04a1c', feverOn ? 22 : 19);

    if (feverOn && S.combo === 5) { sfx.fever(); comboBadge('FEVER x2!'); vibrate(28); }
    else if (feverOn && S.combo % 5 === 0) { comboBadge('COMBO ' + S.combo); }
    else if (!feverOn && S.combo > 1) { setComboTag('COMBO ' + S.combo); }

    afterLand(S.floor);
    return true;
  }

  function afterLand(n) {
    S.land = { t: 0, dur: 0.2 };

    var it = itemAt(n);
    if (it && !S.taken[n]) {
      S.taken[n] = 1;
      S.score += 5;
      sfx.item(it.kind);
      var ix = stairX(n), iy = yOf(n) - 30;
      ringFx(ix, iy, it.kind === 'heart' ? 'rgba(255,140,170,0.95)' : it.kind === 'candy' ? 'rgba(255,190,120,0.95)' : 'rgba(255,235,140,0.95)', 10, 62, 0.34);
      burst(ix, iy, 10, it.kind === 'heart' ? ['#ff8fb1', '#ffc2d1', '#fff'] : it.kind === 'candy' ? ['#ffc078', '#ffe0a8', '#fff'] : ['#ffe680', '#fff3b0', '#fff'], 1);
      floatText(ix, iy - 16, '+5', '#ff9a1f', 30);
      vibrate(9);
    }

    var kind = stepKind(n);
    if (kind === 'boost') {
      S.auto = { left: 3, t: 0, gap: 0.11 };
      sfx.boost();
      toast('무지개 부스터! 3칸 슝~🌈');
      S.score += 30;
      floatText(stairX(n), yOf(n) - 96, '+30', '#7a5cff', 30);
      ringFx(stairX(n), yOf(n) - 6, 'rgba(150,120,255,0.95)', 12, 96, 0.42);
      for (var i = 0; i < 16; i++) {
        S.particles.push({
          x: stairX(n) + (Math.random() - 0.5) * 60,
          y: yOf(n) - Math.random() * 30,
          vx: (Math.random() - 0.5) * 60, vy: -120 - Math.random() * 120,
          life: 0, max: 0.3 + Math.random() * 0.2, r: 2 + Math.random() * 2,
          col: 'hsl(' + ((i * 24) % 360) + ',92%,66%)', star: true
        });
      }
      vibrate(20);
    } else if (kind === 'clock') {
      S.gauge = Math.min(100, S.gauge + 52);
      sfx.clock();
      ringFx(stairX(n), yOf(n) - 6, 'rgba(255,224,120,0.98)', 10, 92, 0.4);
      burst(stairX(n), yOf(n) - 8, 14, ['#ffe680', '#fff3b0', '#ffd24d', '#fff'], 1.05);
      floatText(stairX(n), yOf(n) - 94, '시간 +', '#e09b00', 24);
      toast('황금 시계! 시간이 가득 ⏱️');
      vibrate(16);
    }

    if (S.floor % 10 === 0) cheer(S.floor);
  }

  var CHEERS = { 10: '10층! 하늘까지 반짝 ✨' };
  function cheer(f) {
    var msg = CHEERS[f];
    if (!msg) { if (f % 25 === 0) msg = f + '층 돌파!'; }
    if (!msg) return;
    if (f % 25 === 0) {
      var big = { 25: '우진이 최고! 🌟', 50: '슈퍼 점프! 🚀', 100: '천국이 보여! 👼' }[f] || (f + '층!! 최고예요 🎉');
      banner(big, f + '층');
      sfx.fanfare(f >= 50);
      vibrate(25);
    } else {
      toast(msg);
    }
  }

  function missStep() {
    if (S.mode !== 'playing') return;
    S.mode = 'dying';
    S.reason = '발을 헛디뎠어요';
    sfx.fail();
    S.shake = 1; S.punch = 1;
    var v = charVisual();
    S.fall = { t: 0, x: v.x, y: v.y, vx: S.dir * W * 0.5, vy: -H * 0.18, rot: 0 };
    S.jump = null; S.auto = null;
    S.combo = 0; S.fever = 0;
    vibrate(40);
  }

  function timeOver() {
    if (S.mode !== 'playing') return;
    S.mode = 'dying';
    S.reason = '시간이 다 됐어요';
    sfx.fail();
    var v = charVisual();
    S.fall = { t: 0, x: v.x, y: v.y, vx: (Math.random() - 0.5) * W * 0.16, vy: -H * 0.05, rot: 0 };
    S.jump = null; S.auto = null;
  }

  function finishRun() {
    S.mode = 'over';
    S.fall = null;
    var record = saveBest();
    if (record) { sfx.fanfare(true); vibrate(30); } else sfx.over();
    showOverlay('over', record);
  }

  /* ── HUD ───────────────────────────────────────────────── */
  var elFloor = document.getElementById('floorNum');
  var elScore = document.getElementById('scoreNum');
  var elGauge = document.getElementById('gaugeFill');
  var elMute = document.getElementById('muteBtn');
  var elPanel = document.querySelector('.panel');
  var elCombo = document.getElementById('comboTag');
  var lastFloor = -1, lastScore = -1;

  function updateHUD(force) {
    if (force || S.floor !== lastFloor) {
      elFloor.textContent = S.floor;
      if (lastFloor >= 0 && S.floor !== lastFloor && elPanel) {
        elPanel.classList.add('bump');
        setTimeout(function () { elPanel.classList.remove('bump'); }, 110);
      }
      lastFloor = S.floor;
    }
    if (force || S.score !== lastScore) {
      elScore.textContent = S.score;
      lastScore = S.score;
    }
  }
  function updateGaugeBar() {
    var g = clamp(S.gauge, 0, 100) / 100;
    elGauge.style.transform = 'scaleX(' + g.toFixed(3) + ')';
    var cls = g < 0.2 ? 'gauge-fill danger' : g < 0.45 ? 'gauge-fill warn' : 'gauge-fill';
    if (elGauge.className !== cls) elGauge.className = cls;
  }
  function updateMuteBtn() {
    elMute.textContent = muted ? '🔇' : '🔊';
    elMute.classList.toggle('off', muted);
    elMute.setAttribute('aria-label', muted ? '소리 켜기' : '소리 끄기');
  }
  updateMuteBtn();

  var comboTimer = null;
  function setComboTag(txt) {
    if (!txt) { elCombo.classList.remove('show'); return; }
    elCombo.textContent = txt;
    elCombo.classList.add('show');
    if (comboTimer) clearTimeout(comboTimer);
    comboTimer = setTimeout(function () { elCombo.classList.remove('show'); }, 700);
  }
  function comboBadge(txt) {
    elCombo.textContent = txt;
    elCombo.classList.remove('show');
    void elCombo.offsetWidth;
    elCombo.classList.add('show');
    if (comboTimer) clearTimeout(comboTimer);
    comboTimer = setTimeout(function () { elCombo.classList.remove('show'); }, 900);
    S.punch = 1;
  }

  /* 배너 (층수 마일스톤) */
  var elBanner = document.getElementById('banner');
  var bannerTimer = null;
  function banner(text, sub) {
    if (!elBanner) return;
    elBanner.innerHTML = '<b>' + text + '</b>' + (sub ? '<i>' + sub + '</i>' : '');
    elBanner.classList.remove('show');
    void elBanner.offsetWidth;
    elBanner.classList.add('show');
    if (bannerTimer) clearTimeout(bannerTimer);
    bannerTimer = setTimeout(function () { elBanner.classList.remove('show'); }, 1600);
  }

  /* 토스트 */
  var elToast = document.getElementById('toast'), toastTimer = null;
  function toast(msg) {
    elToast.textContent = msg;
    elToast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { elToast.classList.remove('show'); }, 1300);
  }

  /* ── 오버레이 ─────────────────────────────────────────── */
  var elOverlay = document.getElementById('overlay');
  var elTitle = document.getElementById('ovTitle');
  var elSub = document.getElementById('ovSub');
  var elStats = document.getElementById('ovStats');
  var elMain = document.getElementById('mainBtn');
  var elTip = document.getElementById('ovTip');

  function showOverlay(kind, record) {
    if (kind === 'over') {
      elTitle.textContent = record ? '신기록이에요! 🎉' : '우진아, 한 번 더!';
      elSub.textContent = S.reason;
      elStats.innerHTML =
        '<div class="box"><b>' + S.floor + '층</b><span>이번에 오른 계단</span></div>' +
        '<div class="box"><b>' + S.score + '점</b><span>이번 점수</span></div>' +
        '<div class="box hot"><b>' + S.best + '층</b><span>최고 기록</span></div>';
      elMain.textContent = '다시 하기';
      elTip.textContent = '최고 점수 ' + S.bestScore + '점';
    } else {
      elTitle.textContent = '천국의 계단';
      elSub.textContent = '우진이의 구름 계단';
      elStats.innerHTML =
        '<div class="box hot"><b>' + S.best + '층</b><span>최고 층수</span></div>' +
        '<div class="box"><b>' + S.bestScore + '점</b><span>최고 점수</span></div>';
      elMain.textContent = '시작!';
      elTip.textContent = '방향전환으로 방향을 맞추고, 오르기를 눌러요';
    }
    elOverlay.classList.add('show');
  }
  function hideOverlay() { elOverlay.classList.remove('show'); }
  elMain.addEventListener('click', function () { elMain.blur(); startGame(); });

  /* ── 입력 (0ms 즉각 반응) ───────────────────────────────── */
  var btnTurn = document.getElementById('turnBtn');
  var btnClimb = document.getElementById('climbBtn');

  function ripple(el) {
    var r = document.createElement('span');
    r.className = 'ripple';
    el.appendChild(r);
    r.addEventListener('animationend', function () { if (r.parentNode) r.parentNode.removeChild(r); });
    setTimeout(function () { if (r.parentNode) r.parentNode.removeChild(r); }, 600);
  }

  function bindPress(el, fn) {
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      el.classList.add('down');
      ripple(el);
      fn();
    }, { passive: false });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
      el.addEventListener(ev, function () { el.classList.remove('down'); });
    });
    el.addEventListener('click', function (e) { e.preventDefault(); });
    el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }
  bindPress(btnTurn, doTurn);
  bindPress(btnClimb, function () { if (S.mode === 'playing' && !S.auto) climbCore(false); });

  window.addEventListener('keydown', function (e) {
    var k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') { e.preventDefault(); if (S.mode === 'playing' && S.dir !== -1) doTurn(); return; }
    if (k === 'ArrowRight' || k === 'd' || k === 'D') { e.preventDefault(); if (S.mode === 'playing' && S.dir !== 1) doTurn(); return; }
    if (k === ' ' || k === 'Spacebar' || k === 'ArrowUp' || k === 'Enter' || k === 'w' || k === 'W') {
      e.preventDefault();
      if (S.mode === 'playing') { if (!S.auto) climbCore(false); }
      else if (S.mode === 'over' || S.mode === 'ready') startGame();
    }
  }, { passive: false });

  elMute.addEventListener('click', function (e) {
    e.preventDefault();
    muted = !muted;
    try { localStorage.setItem('woojin_stairs_mute', muted ? '1' : '0'); } catch (er) { }
    updateMuteBtn();
    if (!muted) { audioInit(); sfx.turn(); }
  });

  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', function () { setTimeout(resize, 150); });

  /* ── 캐릭터 위치 ───────────────────────────────────────── */
  var _char = { x: 0, y: 0, feet: 0, h: 100, tilt: 0, air: 0 };
  function charVisual() {
    var hs = spriteH(), hwid = hs * 0.372;
    var x = stairX(S.floor), feet = yOf(S.floor), tilt = 0, air = 0;
    if (S.jump) {
      var p = clamp(S.jump.t / S.jump.dur);
      var e = easeInOut(p);
      var x0 = stairX(S.jump.from), x1 = stairX(S.jump.to);
      var y0 = yOf(S.jump.from), y1 = yOf(S.jump.to);
      x = lerp(x0, x1, e);
      feet = lerp(y0, y1, e);
      air = Math.sin(Math.PI * p) * risePx() * 0.5;
      feet -= air;
      tilt = Math.sin(Math.PI * p) * 0.11 * (x1 > x0 ? 1 : -1);
    }
    var bob = (S.mode === 'playing' && !S.jump) ? Math.sin(S.t * 6.5) * 1.4 : (S.mode === 'playing' ? 0 : Math.sin(S.t * 2.4) * 2.2);
    _char.x = x; _char.feet = feet + bob; _char.h = hs; _char.tilt = tilt; _char.air = air;
    _char.y = _char.feet - hs / 2;
    return _char;
  }

  /* ── 그리기 도우미 ─────────────────────────────────────── */
  function rr(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function cloud(x, y, s, color, alpha) {
    if (alpha <= 0.02) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x - 34 * s, y, 23 * s, 0, TAU);
    ctx.arc(x - 8 * s, y - 13 * s, 31 * s, 0, TAU);
    ctx.arc(x + 26 * s, y - 4 * s, 25 * s, 0, TAU);
    ctx.arc(x + 50 * s, y + 6 * s, 16 * s, 0, TAU);
    ctx.arc(x - 56 * s, y + 7 * s, 15 * s, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function starShape(x, y, r, color, alpha, points) {
    var n = points || 4;
    ctx.save();
    ctx.globalAlpha = alpha === undefined ? 1 : alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    for (var i = 0; i < n; i++) {
      var a = i * (TAU / n);
      ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      ctx.lineTo(x + Math.cos(a + Math.PI / n) * r * 0.42, y + Math.sin(a + Math.PI / n) * r * 0.42);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function heartPath(x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.32);
    ctx.bezierCurveTo(x - s * 0.9, y - s * 0.35, x - s * 0.42, y - s * 1.0, x, y - s * 0.42);
    ctx.bezierCurveTo(x + s * 0.42, y - s * 1.0, x + s * 0.9, y - s * 0.35, x, y + s * 0.32);
    ctx.closePath();
  }

  var STARS = (function () {
    var a = [], seed = 7;
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    for (var i = 0; i < 80; i++) a.push({ x: rnd(), y: rnd(), r: 0.6 + rnd() * 1.8, ph: rnd() * TAU, sp: 0.8 + rnd() * 2 });
    return a;
  })();

  /* ── 배경 ──────────────────────────────────────────────── */
  function drawBalloon(x, y, s, hue, alpha, t) {
    if (alpha <= 0.02) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y + Math.sin(t * 0.9 + x) * 3);
    var g = ctx.createLinearGradient(0, -34 * s, 0, 20 * s);
    g.addColorStop(0, 'hsla(' + hue + ',90%,78%,1)');
    g.addColorStop(1, 'hsla(' + (hue + 40) + ',85%,62%,1)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, 26 * s, 31 * s, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2 * s;
    ctx.beginPath(); ctx.ellipse(0, 0, 26 * s, 31 * s, 0, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-9 * s, -29 * s); ctx.quadraticCurveTo(0, 0, -9 * s, 29 * s); ctx.stroke();
    ctx.fillStyle = '#b1794a';
    rr(-9 * s, 30 * s, 18 * s, 13 * s, 3 * s); ctx.fill();
    ctx.strokeStyle = 'rgba(120,80,50,0.6)';
    ctx.lineWidth = 1.2 * s;
    ctx.beginPath();
    ctx.moveTo(-7 * s, 30 * s); ctx.lineTo(-4 * s, 24 * s);
    ctx.moveTo(7 * s, 30 * s); ctx.lineTo(4 * s, 24 * s);
    ctx.stroke();
    ctx.restore();
  }

  function drawCastle(x, y, s, alpha, t) {
    if (alpha <= 0.02) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    var body = 'rgba(255,252,240,0.95)';
    var shade = 'rgba(255,232,180,0.95)';
    var gold = 'rgba(240,196,90,0.95)';
    /* cloud base */
    cloud(0, 34 * s, 1.5 * s, '#ffffff', 0.9 * alpha);
    /* towers */
    [[-46, 0, 0.8], [0, -14, 1.0], [46, 2, 0.76]].forEach(function (tw) {
      var tx = tw[0] * s, ty = tw[1] * s, ts = tw[2] * s;
      ctx.fillStyle = body;
      rr(tx - 15 * ts, ty - 40 * ts, 30 * ts, 62 * ts, 4 * ts); ctx.fill();
      /* roof */
      ctx.fillStyle = shade;
      ctx.beginPath();
      ctx.moveTo(tx - 19 * ts, ty - 40 * ts);
      ctx.lineTo(tx, ty - 74 * ts);
      ctx.lineTo(tx + 19 * ts, ty - 40 * ts);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = gold;
      ctx.lineWidth = 2 * ts;
      ctx.stroke();
      /* flag */
      var fl = Math.sin(t * 2 + tx) * 2;
      ctx.strokeStyle = gold;
      ctx.beginPath(); ctx.moveTo(tx, ty - 74 * ts); ctx.lineTo(tx, ty - 88 * ts); ctx.stroke();
      ctx.fillStyle = 'rgba(255,150,150,0.95)';
      ctx.beginPath();
      ctx.moveTo(tx, ty - 88 * ts);
      ctx.lineTo(tx + 13 * ts + fl, ty - 83 * ts);
      ctx.lineTo(tx, ty - 78 * ts);
      ctx.closePath();
      ctx.fill();
      /* window */
      ctx.fillStyle = 'rgba(255,214,120,0.95)';
      ctx.beginPath(); ctx.arc(tx, ty - 16 * ts, 4.5 * ts, 0, TAU); ctx.fill();
    });
    ctx.restore();
  }

  function drawSky(ws, f, t) {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, mix(ws, 'top'));
    g.addColorStop(0.55, mix(ws, 'mid'));
    g.addColorStop(1, mix(ws, 'bot'));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    var off = (S.camF * 0.5 * risePx()) % (H * 1.4);

    /* 1 · 포근한 하늘 */
    if (ws[0] > 0.02) {
      var a0 = ws[0];
      var sx = W * 0.80, sy = H * 0.13 - off * 0.2;
      var rg = ctx.createRadialGradient(sx, sy, 8, sx, sy, 130);
      rg.addColorStop(0, 'rgba(255,244,190,' + (0.95 * a0) + ')');
      rg.addColorStop(0.35, 'rgba(255,232,150,' + (0.42 * a0) + ')');
      rg.addColorStop(1, 'rgba(255,232,150,0)');
      ctx.fillStyle = rg;
      ctx.beginPath(); ctx.arc(sx, sy, 130, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,252,225,' + (0.95 * a0) + ')';
      ctx.beginPath(); ctx.arc(sx, sy, 31, 0, TAU); ctx.fill();

      for (var i = 0; i < 5; i++) {
        var cx = ((i * 0.27 * W + t * (9 + i * 4) + i * 120) % (W + 320)) - 160;
        var cy = ((i * 0.23 + 0.08) * H + off * (0.28 + i * 0.12)) % (H * 1.25);
        cloud(cx, cy, 0.65 + (i % 3) * 0.28, '#ffffff', 0.85 * a0);
      }
      /* 열기구 */
      drawBalloon(W * 0.18 + Math.sin(t * 0.22) * 12, H * 0.30 + Math.sin(t * 0.4) * 6, 0.85, 20, 0.85 * a0, t);
      drawBalloon(W * 0.78 + Math.sin(t * 0.18 + 2) * 10, H * 0.46 + Math.cos(t * 0.3) * 5, 0.62, 200, 0.8 * a0, t);
    }

    /* 2 · 노을 */
    if (ws[1] > 0.02) {
      var a1 = ws[1];
      var hy = H * 0.62;
      var rg2 = ctx.createRadialGradient(W * 0.5, hy, 10, W * 0.5, hy, W * 0.85);
      rg2.addColorStop(0, 'rgba(255,196,120,' + (0.8 * a1) + ')');
      rg2.addColorStop(0.5, 'rgba(255,150,110,' + (0.3 * a1) + ')');
      rg2.addColorStop(1, 'rgba(255,150,110,0)');
      ctx.fillStyle = rg2;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,241,205,' + (0.85 * a1) + ')';
      ctx.beginPath(); ctx.arc(W * 0.5, hy + 10, 46, 0, TAU); ctx.fill();

      for (var j = 0; j < 4; j++) {
        var cx2 = ((j * 0.31 * W - t * (7 + j * 3) + j * 90) % (W + 320) + W + 320) % (W + 320) - 160;
        var cy2 = (0.30 + j * 0.14) * H + off * (0.22 + j * 0.1);
        cloud(cx2, cy2 % (H * 1.2), 0.7 + (j % 2) * 0.3, 'rgba(255,214,170,1)', 0.7 * a1);
      }
      ctx.strokeStyle = 'rgba(90,70,90,' + (0.5 * a1) + ')';
      ctx.lineWidth = 1.6;
      for (var b = 0; b < 3; b++) {
        var bx = (W * 0.2 + b * 34 + t * 12) % (W + 80) - 40;
        var by = H * 0.24 + b * 16 + Math.sin(t * 1.6 + b) * 5;
        ctx.beginPath();
        ctx.moveTo(bx - 7, by);
        ctx.quadraticCurveTo(bx - 3, by - 5, bx, by);
        ctx.quadraticCurveTo(bx + 3, by - 5, bx + 7, by);
        ctx.stroke();
      }
      drawBalloon(W * 0.25 + Math.sin(t * 0.2 + 1) * 14, H * 0.40 + Math.sin(t * 0.35) * 7, 0.7, 320, 0.75 * a1, t);
    }

    /* 3 · 무지개 */
    if (ws[2] > 0.02) {
      var a2 = ws[2];
      drawRainbow(W * 0.5, H * 1.34, Math.max(H * 0.82, 470), 10, 0.6 * a2);
      drawRainbow(W * 0.5, H * 1.44, Math.max(H * 0.70, 400), 7, 0.32 * a2);
      for (var k = 0; k < 4; k++) {
        var cx3 = ((k * 0.29 * W + t * (11 + k * 5)) % (W + 300)) - 150;
        var cy3 = (0.14 + k * 0.19) * H + off * 0.2;
        cloud(cx3, cy3 % (H * 1.1), 0.55 + (k % 2) * 0.3, '#ffffff', 0.75 * a2);
      }
      for (var s2 = 0; s2 < 16; s2++) {
        var ang = t * 0.6 + s2;
        var px = W * 0.5 + Math.cos(ang) * (W * 0.45);
        var py = H * 0.30 + Math.sin(ang * 1.3) * (H * 0.30);
        starShape(px, py, 2 + (s2 % 3), '#fff8c9', 0.55 * a2 * (0.5 + 0.5 * Math.sin(t * 3 + s2)));
      }
      drawBalloon(W * 0.16 + Math.sin(t * 0.26 + 3) * 10, H * 0.22 + Math.cos(t * 0.4) * 6, 0.78, 285, 0.8 * a2, t);
    }

    /* 4 · 별빛 우주 */
    if (ws[3] > 0.02) {
      var a3 = ws[3];
      var so = (S.camF * 0.35 * risePx()) % H;
      for (var si = 0; si < STARS.length; si++) {
        var st = STARS[si];
        var yy = (st.y * H + so) % H;
        var tw = 0.45 + 0.55 * Math.abs(Math.sin(t * st.sp + st.ph));
        ctx.fillStyle = 'rgba(255,255,255,' + (tw * a3) + ')';
        ctx.beginPath(); ctx.arc(W * st.x, yy, st.r, 0, TAU); ctx.fill();
      }
      var mx = W * 0.78, my = H * 0.16 + Math.sin(t * 0.4) * 4;
      var mg = ctx.createRadialGradient(mx, my, 4, mx, my, 74);
      mg.addColorStop(0, 'rgba(255,250,215,' + (0.5 * a3) + ')');
      mg.addColorStop(1, 'rgba(255,250,215,0)');
      ctx.fillStyle = mg;
      ctx.beginPath(); ctx.arc(mx, my, 74, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,251,226,' + (0.97 * a3) + ')';
      ctx.beginPath(); ctx.arc(mx, my, 24, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(226,218,182,' + (0.5 * a3) + ')';
      ctx.beginPath(); ctx.arc(mx - 7, my - 8, 5, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(mx + 6, my + 6, 7, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(mx - 4, my + 12, 3.5, 0, TAU); ctx.fill();

      var per = 4.6, ph2 = (t % per) / per;
      if (ph2 < 0.22) {
        var k2 = ph2 / 0.22;
        var sx2 = W * (0.15 + (Math.floor(t / per) % 3) * 0.25) + k2 * W * 0.5;
        var sy2 = H * 0.12 + k2 * H * 0.22;
        var grad = ctx.createLinearGradient(sx2, sy2, sx2 - 70, sy2 - 30);
        grad.addColorStop(0, 'rgba(255,255,255,' + (0.9 * a3 * (1 - k2)) + ')');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = grad; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(sx2, sy2); ctx.lineTo(sx2 - 70, sy2 - 30); ctx.stroke();
      }
    }

    /* 5 · 천국 구름 정원 */
    if (ws[4] > 0.02) {
      var a4 = ws[4];
      ctx.save();
      ctx.globalAlpha = a4;
      var lx = W * 0.5, ly = -H * 0.06;
      var rayG = ctx.createLinearGradient(0, 0, 0, H * 0.95);
      rayG.addColorStop(0, 'rgba(255,214,120,0.72)');
      rayG.addColorStop(0.45, 'rgba(255,228,160,0.3)');
      rayG.addColorStop(1, 'rgba(255,240,190,0)');
      ctx.fillStyle = rayG;
      for (var r2 = 0; r2 < 9; r2++) {
        var spread = -0.95 + r2 * 0.24 + Math.sin(t * 0.3 + r2) * 0.02;
        var tipX = lx + Math.tan(spread) * H * 1.1;
        var tipW = 46 + (r2 % 3) * 16;
        ctx.beginPath();
        ctx.moveTo(lx - 12, ly);
        ctx.lineTo(lx + 12, ly);
        ctx.lineTo(tipX + tipW, H * 0.95);
        ctx.lineTo(tipX - tipW, H * 0.95);
        ctx.closePath();
        ctx.fill();
      }
      var hg2 = ctx.createLinearGradient(0, 0, 0, H * 0.5);
      hg2.addColorStop(0, 'rgba(255,226,150,' + (0.4 * a4) + ')');
      hg2.addColorStop(1, 'rgba(255,226,150,0)');
      ctx.fillStyle = hg2;
      ctx.fillRect(0, 0, W, H * 0.5);
      ctx.restore();

      /* 하늘 성 */
      drawCastle(W * 0.72, H * 0.30 + Math.sin(t * 0.6) * 3, Math.min(W / 520, 0.82), 0.9 * a4, t);

      for (var q = 0; q < 5; q++) {
        var cx4 = ((q * 0.24 * W + t * (5 + q * 2)) % (W + 400)) - 200;
        var cy4 = (0.06 + q * 0.16) * H + off * (0.14 + q * 0.05);
        cloud(cx4, cy4 % (H * 1.15), 0.8 + (q % 3) * 0.22, '#ffffff', 0.75 * a4);
      }
      for (var d = 0; d < 20; d++) {
        var dpx = ((d * 137.5) % W + Math.sin(t * 0.5 + d) * 12);
        var dpy = ((d * 89.3 + t * 14) % (H * 1.2)) + Math.sin(t + d) * 8;
        ctx.fillStyle = 'rgba(255,246,200,' + (0.55 * a4 * (0.4 + 0.6 * Math.abs(Math.sin(t * 2 + d)))) + ')';
        ctx.beginPath(); ctx.arc(dpx, dpy, 1.6 + (d % 3) * 0.7, 0, TAU); ctx.fill();
      }
    }
  }

  function drawRainbow(cx, cy, r, wide, alpha) {
    var cols = ['#ff9a9a', '#ffc27f', '#ffe98a', '#a8e6a1', '#8fd0ff', '#a9a6ff', '#dda6ff'];
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineWidth = wide;
    for (var i = 0; i < cols.length; i++) {
      ctx.strokeStyle = cols[i];
      ctx.beginPath();
      ctx.arc(cx, cy, r - i * wide, Math.PI, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* ── 계단 ──────────────────────────────────────────────── */
  function drawStairs(ws) {
    var sw = stairW();
    var from = Math.floor(S.camF) - 3, to = Math.floor(S.camF) + 9;
    var top = mix(ws, 'sTop'), face = mix(ws, 'sFace'), edge = mix(ws, 'sEdge');

    for (var n = from; n <= to; n++) {
      if (n < 0) continue;
      var y = yOf(n);
      if (y < -140 || y > H + 180) continue;
      var cx = stairX(n);
      var x = cx - sw / 2;
      var alpha = y > H * 0.90 ? clamp((H * 1.15 - y) / (H * 0.25)) : 1;
      var kind = stepKind(n);

      ctx.save();
      ctx.globalAlpha = alpha;

      ctx.fillStyle = 'rgba(40,60,90,0.12)';
      rr(x + 4, y + 16, sw, 24, 10); ctx.fill();

      if (kind === 'boost') {
        var bg = ctx.createLinearGradient(x, y, x + sw, y);
        ['#ff9a9a', '#ffc27f', '#ffe98a', '#a8e6a1', '#8fd0ff', '#a9a6ff', '#dda6ff'].forEach(function (c, i, arr) {
          bg.addColorStop(i / (arr.length - 1), c);
        });
        ctx.fillStyle = face;
        rr(x, y + 8, sw, 32, 10); ctx.fill();
        ctx.fillStyle = bg;
        rr(x, y, sw, 20, 10); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 2;
        rr(x + 1, y + 1, sw - 2, 19, 9); ctx.stroke();
        /* 위로 화살표 */
        var ay = y + 10 + Math.sin(S.t * 4 + n) * 2;
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.beginPath();
        ctx.moveTo(cx, ay - 7); ctx.lineTo(cx + 9, ay + 3); ctx.lineTo(cx + 3.5, ay + 3);
        ctx.lineTo(cx + 3.5, ay + 9); ctx.lineTo(cx - 3.5, ay + 9); ctx.lineTo(cx - 3.5, ay + 3);
        ctx.lineTo(cx - 9, ay + 3);
        ctx.closePath(); ctx.fill();
        ctx.save();
        ctx.globalAlpha = 0.5 + 0.3 * Math.sin(S.t * 5 + n);
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 2;
        rr(x - 1, y - 1, sw + 2, 22, 11); ctx.stroke();
        ctx.restore();
      } else if (kind === 'clock') {
        var cg = ctx.createLinearGradient(x, y, x, y + 40);
        cg.addColorStop(0, '#fff6d0');
        cg.addColorStop(1, '#ffd762');
        ctx.fillStyle = cg;
        rr(x, y + 8, sw, 32, 10); ctx.fill();
        ctx.fillStyle = '#fffbe8';
        rr(x, y, sw, 20, 10); ctx.fill();
        ctx.strokeStyle = '#e8a92c';
        ctx.lineWidth = 2.4;
        rr(x + 1, y + 1, sw - 2, 19, 9); ctx.stroke();
        /* 시계 */
        var ccx = cx, ccy = y + 10;
        ctx.fillStyle = '#fffdf2';
        ctx.beginPath(); ctx.arc(ccx, ccy, 8, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#d99a20'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(ccx, ccy, 8, 0, TAU); ctx.stroke();
        var ang = S.t * 3;
        ctx.beginPath(); ctx.moveTo(ccx, ccy); ctx.lineTo(ccx + Math.cos(ang - 1.57) * 5, ccy + Math.sin(ang - 1.57) * 5); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ccx, ccy); ctx.lineTo(ccx + Math.cos(ang * 0.4) * 3.5, ccy + Math.sin(ang * 0.4) * 3.5); ctx.stroke();
        ctx.save();
        ctx.globalAlpha = 0.4 + 0.3 * Math.sin(S.t * 4 + n);
        ctx.shadowColor = 'rgba(255,210,80,0.95)';
        ctx.shadowBlur = 16;
        ctx.strokeStyle = 'rgba(255,220,110,0.9)';
        ctx.lineWidth = 2.5;
        rr(x - 1, y - 1, sw + 2, 22, 11); ctx.stroke();
        ctx.restore();
      } else {
        ctx.fillStyle = face;
        rr(x, y + 8, sw, 32, 10); ctx.fill();
        ctx.fillStyle = top;
        rr(x, y, sw, 20, 10); ctx.fill();
        ctx.strokeStyle = edge;
        ctx.lineWidth = 2;
        rr(x + 1, y + 1, sw - 2, 19, 9); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.55)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 14, y + 6);
        ctx.lineTo(x + sw - 14, y + 6);
        ctx.stroke();
        if (ws[2] > 0.05) {
          ctx.strokeStyle = 'hsla(' + ((n * 24) % 360) + ',88%,64%,' + (0.7 * ws[2]) + ')';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x + 12, y + 31);
          ctx.lineTo(x + sw - 12, y + 31);
          ctx.stroke();
        }
      }

      if (n === S.floor && S.mode !== 'over') {
        ctx.save();
        ctx.shadowColor = 'rgba(255,214,120,0.95)';
        ctx.shadowBlur = 18;
        ctx.strokeStyle = 'rgba(255,220,140,0.9)';
        ctx.lineWidth = 3;
        rr(x + 1, y + 1, sw - 2, 19, 9); ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    }
  }

  /* 다음 계단 안내 */
  function drawHint(ws) {
    if (S.mode !== 'playing' || S.jump) return;
    var n = S.floor + 1;
    var y = yOf(n);
    if (y < -60 || y > H) return;
    var cx = stairX(n), sw = stairW();
    var pulse = 0.55 + 0.45 * Math.sin(S.t * 5);
    var need = (stairX(n) > stairX(S.floor)) ? 1 : -1;
    var ok = S.dir === need;

    ctx.save();
    ctx.globalAlpha = 0.25 + 0.3 * pulse;
    ctx.fillStyle = ok ? 'rgba(120,230,150,0.95)' : 'rgba(255,180,90,0.95)';
    rr(cx - sw / 2 + 18, y + 8, sw - 36, 6, 3);
    ctx.fill();
    ctx.restore();

    var ax = cx;
    var ay = y - 15 - pulse * 3;
    ctx.save();
    ctx.globalAlpha = 0.5 + 0.35 * pulse;
    ctx.fillStyle = ok ? 'rgba(90,200,125,0.95)' : 'rgba(255,160,80,0.95)';
    ctx.beginPath();
    ctx.moveTo(ax + need * 9, ay);
    ctx.lineTo(ax - need * 5, ay - 7.5);
    ctx.lineTo(ax - need * 5, ay + 7.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /* ── 아이템 ────────────────────────────────────────────── */
  function drawItems() {
    var from = Math.floor(S.camF) - 2, to = Math.floor(S.camF) + 8;
    for (var n = from; n <= to; n++) {
      if (n < 1) continue;
      var it = itemAt(n);
      if (!it || S.taken[n]) continue;
      var y = yOf(n) - 34;
      if (y < -40 || y > H + 40) continue;
      var x = stairX(n) + (it.ph - 0.5) * 20;
      var bob = Math.sin(S.t * 3 + n) * 3;
      var sc = 0.92 + 0.08 * Math.sin(S.t * 5 + n * 2);

      ctx.save();
      ctx.translate(x, y + bob);
      /* 후광 */
      var gl = ctx.createRadialGradient(0, 0, 2, 0, 0, 26);
      gl.addColorStop(0, it.kind === 'heart' ? 'rgba(255,150,180,0.55)' : it.kind === 'candy' ? 'rgba(255,190,120,0.5)' : 'rgba(255,230,120,0.55)');
      gl.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gl;
      ctx.beginPath(); ctx.arc(0, 0, 26, 0, TAU); ctx.fill();

      if (it.kind === 'star') {
        ctx.save();
        ctx.shadowColor = 'rgba(255,205,60,0.95)';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#ffd93d';
        starShape(0, 0, 13 * sc, '#ffd93d', 1, 5);
        ctx.restore();
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (var i = 0; i < 5; i++) {
          var a = -Math.PI / 2 + i * (TAU / 5);
          var a2 = a + Math.PI / 5;
          var p1x = Math.cos(a) * 13 * sc, p1y = Math.sin(a) * 13 * sc;
          var p2x = Math.cos(a2) * 6 * sc, p2y = Math.sin(a2) * 6 * sc;
          if (i === 0) ctx.moveTo(p1x, p1y); else ctx.lineTo(p1x, p1y);
          ctx.lineTo(p2x, p2y);
        }
        ctx.closePath(); ctx.stroke();
      } else if (it.kind === 'candy') {
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath();
        ctx.moveTo(-11 * sc, 0); ctx.lineTo(-20 * sc, -8 * sc); ctx.lineTo(-20 * sc, 8 * sc); ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(11 * sc, 0); ctx.lineTo(20 * sc, -8 * sc); ctx.lineTo(20 * sc, 8 * sc); ctx.closePath(); ctx.fill();
        var cg = ctx.createRadialGradient(-3 * sc, -3 * sc, 1, 0, 0, 13 * sc);
        cg.addColorStop(0, '#ffd0e0');
        cg.addColorStop(1, '#ff7fa8');
        ctx.fillStyle = cg;
        ctx.beginPath(); ctx.arc(0, 0, 11 * sc, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(0, 0, 6.5 * sc, -0.4, 2.2);
        ctx.stroke();
      } else {
        ctx.save();
        ctx.shadowColor = 'rgba(255,110,150,0.9)';
        ctx.shadowBlur = 12;
        heartPath(0, 2 * sc, 14 * sc);
        ctx.fillStyle = '#ff6f9c';
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.beginPath(); ctx.ellipse(-4 * sc, -3 * sc, 3.4 * sc, 2.4 * sc, -0.5, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }
  }

  /* ── 캐릭터 ────────────────────────────────────────────── */
  function drawWing(cx, cy, hs, side, flap, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha * 0.96;
    ctx.translate(cx + side * hs * 0.10, cy - hs * 0.62);
    ctx.rotate(side * (0.30 + flap));
    ctx.scale(side, 1);
    var g = ctx.createLinearGradient(0, -hs * 0.1, hs * 0.55, hs * 0.2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.6, 'rgba(255,247,222,0.95)');
    g.addColorStop(1, 'rgba(255,224,158,0.6)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(hs * 0.20, -hs * 0.20, hs * 0.42, -hs * 0.07);
    ctx.quadraticCurveTo(hs * 0.30, hs * 0.02, hs * 0.34, hs * 0.10);
    ctx.quadraticCurveTo(hs * 0.22, hs * 0.04, hs * 0.23, hs * 0.15);
    ctx.quadraticCurveTo(hs * 0.11, hs * 0.08, 0, hs * 0.05);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,214,150,0.5)';
    ctx.lineWidth = 1.4;
    for (var i = 1; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(hs * 0.02 * i, hs * 0.02);
      ctx.quadraticCurveTo(hs * 0.15, -hs * 0.07 * i, hs * 0.32, -hs * 0.004 * i);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawCrown(cx, cy, hs, alpha) {
    var cw = hs * 0.23, ch = hs * 0.13;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(cx, cy);
    ctx.fillStyle = '#ffcf4d';
    ctx.strokeStyle = 'rgba(200,140,20,0.9)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-cw / 2, ch * 0.5);
    ctx.lineTo(-cw / 2, -ch * 0.4);
    ctx.lineTo(-cw * 0.22, ch * 0.02);
    ctx.lineTo(0, -ch * 0.7);
    ctx.lineTo(cw * 0.22, ch * 0.02);
    ctx.lineTo(cw / 2, -ch * 0.4);
    ctx.lineTo(cw / 2, ch * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ff5f7a';
    ctx.beginPath(); ctx.arc(0, ch * 0.12, hs * 0.022, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function drawCharacter() {
    if (S.fall) { drawFalling(); return; }
    var v = charVisual();
    var hs = v.h, hw = hs * 0.372;
    var fever = S.fever;

    /* 그림자 */
    var shadowScale = 1 - clamp(v.air / (risePx() * 0.7)) * 0.45;
    ctx.save();
    ctx.globalAlpha = 0.2 * shadowScale;
    ctx.fillStyle = '#22304a';
    ctx.beginPath();
    ctx.ellipse(v.x, v.feet + 2, hw * 0.52 * shadowScale, hw * 0.20 * shadowScale, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    /* 피버 잔상 */
    if (S.trail.length) {
      for (var ti = 0; ti < S.trail.length; ti++) {
        var tr = S.trail[ti];
        var k = 1 - tr.life / 0.34;
        if (k <= 0) continue;
        ctx.save();
        ctx.globalAlpha = 0.20 * k * fever;
        ctx.fillStyle = 'hsl(' + ((ti * 42) % 360) + ',95%,68%)';
        ctx.beginPath();
        ctx.ellipse(tr.x, tr.feet - hs * 0.45, hw * 0.5, hs * 0.32, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
    }

    /* 날개 */
    if (fever > 0.02) {
      var flap = Math.sin(S.t * 11) * 0.18;
      drawWing(v.x, v.feet, hs, -1, flap, fever);
      drawWing(v.x, v.feet, hs, 1, flap, fever);
    }

    /* 후광 */
    var hg = ctx.createRadialGradient(v.x, v.feet - hs * 0.55, hw * 0.3, v.x, v.feet - hs * 0.55, hs * 0.8);
    hg.addColorStop(0, 'rgba(255,255,255,' + (0.22 + 0.18 * fever) + ')');
    hg.addColorStop(0.7, 'rgba(255,255,255,0.06)');
    hg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hg;
    ctx.beginPath(); ctx.arc(v.x, v.feet - hs * 0.55, hs * 0.8, 0, TAU); ctx.fill();

    /* 스쿼시 & 스트레치 */
    var sx = 1, sy = 1;
    if (S.jump) {
      var jp = clamp(S.jump.t / S.jump.dur);
      var st = Math.sin(Math.PI * jp);
      sx = 1 - 0.06 * st;
      sy = 1 + 0.09 * st;
    }
    if (S.land) {
      var lp = clamp(S.land.t / S.land.dur);
      var sq = (1 - lp) * (1 - lp);
      sx += 0.16 * sq;
      sy -= 0.18 * sq;
    }

    ctx.save();
    ctx.translate(v.x, v.feet);
    ctx.rotate(v.tilt * 0.6);
    ctx.scale(sx * (S.dir < 0 ? -1 : 1), sy);

    if (bodyReady) {
      ctx.drawImage(bodyImg, -hw / 2, -hs, hw, hs);
    } else if (faceReady) {
      var d = hs * 0.55;
      ctx.save();
      ctx.beginPath(); ctx.arc(0, -hs * 0.72, d / 2, 0, TAU); ctx.clip();
      ctx.drawImage(faceImg, -d / 2, -hs * 0.72 - d / 2, d, d);
      ctx.restore();
      ctx.fillStyle = '#dceeff';
      rr(-d * 0.35, -hs * 0.72 + d * 0.4, d * 0.7, hs * 0.5, 6); ctx.fill();
    }
    ctx.restore();

    /* 왕관 (뒤집힘 영향 없이) */
    if (fever > 0.05) {
      drawCrown(v.x, v.feet - hs - hs * 0.03, hs, fever);
    }

    /* 방향 표시 */
    ctx.save();
    var ay = v.feet + 16 + Math.sin(S.t * 6) * 2;
    var ax = v.x + S.dir * (hw * 0.72);
    ctx.translate(ax, ay);
    if (S.dir < 0) ctx.rotate(Math.PI);
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-4, -9);
    ctx.lineTo(0, 0);
    ctx.lineTo(-4, 9);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,122,89,0.96)';
    ctx.strokeStyle = 'rgba(255,255,255,0.92)';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.fill();
    ctx.restore();

    /* 피버 반짝이 */
    if (fever > 0.05) {
      for (var i = 0; i < 5; i++) {
        var ang = S.t * 2 + i * (TAU / 5);
        var rx = v.x + Math.cos(ang) * hs * 0.55;
        var ry = v.feet - hs * 0.5 + Math.sin(ang) * hs * 0.42;
        starShape(rx, ry, 3 + Math.sin(S.t * 6 + i) * 1.4, '#fff2b8', 0.85 * fever);
      }
    }
  }

  function drawFalling() {
    var f = S.fall;
    var hs = spriteH(), hw = hs * 0.372;
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.rotate(f.rot);
    if (bodyReady) {
      ctx.drawImage(bodyImg, -hw / 2, -hs / 2, hw, hs);
    } else if (faceReady) {
      var d = hs * 0.6;
      ctx.drawImage(faceImg, -d / 2, -d / 2, d, d);
    }
    ctx.restore();
  }

  /* ── 이펙트 그리기 ─────────────────────────────────────── */
  function drawFx() {
    var i;
    for (i = 0; i < S.rings.length; i++) {
      var r = S.rings[i];
      var p = clamp(r.t / r.max);
      var rad = lerp(r.r0, r.r1, easeOutCubic(p));
      ctx.save();
      ctx.globalAlpha = (1 - p) * 0.9;
      ctx.strokeStyle = r.col;
      ctx.lineWidth = 3 * (1 - p) + 0.6;
      ctx.beginPath(); ctx.arc(r.x, r.y, rad, 0, TAU); ctx.stroke();
      ctx.restore();
    }
    for (i = 0; i < S.particles.length; i++) {
      var p2 = S.particles[i];
      var k = 1 - p2.life / p2.max;
      if (k <= 0) continue;
      if (p2.star) starShape(p2.x, p2.y, p2.r * 1.6 * k, p2.col, Math.min(1, k * 1.2));
      else {
        ctx.save();
        ctx.globalAlpha = Math.min(1, k * 1.1);
        ctx.fillStyle = p2.col;
        ctx.beginPath(); ctx.arc(p2.x, p2.y, p2.r * k, 0, TAU); ctx.fill();
        ctx.restore();
      }
    }
    for (i = 0; i < S.floaters.length; i++) {
      var f2 = S.floaters[i];
      var kk = 1 - f2.life / f2.max;
      var sc = 1 + (1 - kk) * 0.5;
      ctx.save();
      ctx.globalAlpha = clamp(kk * 1.4);
      ctx.translate(f2.x, f2.y);
      ctx.scale(sc, sc);
      ctx.font = 'bold ' + f2.size + 'px Gulim, "굴림", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 5;
      ctx.strokeStyle = 'rgba(255,255,255,0.95)';
      ctx.strokeText(f2.text, 0, 0);
      ctx.fillStyle = f2.col;
      ctx.fillText(f2.text, 0, 0);
      ctx.restore();
    }
  }

  /* ── 업데이트 ─────────────────────────────────────────── */
  function update(dt) {
    S.t += dt;

    var targetCam = S.floor;
    S.camF += (targetCam - S.camF) * (1 - Math.exp(-dt * 9));
    if (Math.abs(S.camF - targetCam) < 0.002) S.camF = targetCam;

    if (S.jump) {
      S.jump.t += dt;
      if (S.jump.t >= S.jump.dur) S.jump = null;
    }
    if (S.land) {
      S.land.t += dt;
      if (S.land.t >= S.land.dur) S.land = null;
    }

    var feverTarget = (S.mode === 'playing' && S.combo >= 5) ? 1 : 0;
    S.fever += (feverTarget - S.fever) * (1 - Math.exp(-dt * 8));

    /* 피버 잔상 */
    if (S.fever > 0.25 && S.mode === 'playing') {
      var v = charVisual();
      S.trail.push({ x: v.x, feet: v.feet, life: 0 });
      if (S.trail.length > 7) S.trail.shift();
    }
    for (var ti = S.trail.length - 1; ti >= 0; ti--) {
      S.trail[ti].life += dt;
      if (S.trail[ti].life > 0.34) S.trail.splice(ti, 1);
    }

    if (S.mode === 'playing') {
      /* 부스터 자동 등반 */
      if (S.auto) {
        S.auto.t += dt;
        if (S.auto.t >= S.auto.gap && S.mode === 'playing') {
          S.auto.t = 0;
          S.auto.left -= 1;
          climbCore(true);
          if (S.auto.left <= 0) {
            S.auto = null;
            /* 착지 계단 방향 자동 맞춤: 다음 계단으로 바로 오를 수 있게 */
            S.dir = (stairX(S.floor + 1) > stairX(S.floor)) ? 1 : -1;
          }
        }
      }

      var drain = 8.2 + Math.min(S.floor * 0.07, 8);
      if (S.fever > 0.5) drain *= 0.6;
      S.gauge -= drain * dt;
      if (S.gauge <= 0) { S.gauge = 0; timeOver(); }

      if (S.gauge < 20) {
        S.lowTick += dt;
        if (S.lowTick > 0.42) { S.lowTick = 0; sfx.tick(); }
      } else S.lowTick = 0;

      if (S.combo > 0 && S.t - S.lastClimb > 1.8) { S.combo = 0; }

      updateGaugeBar();
      updateHUD(false);
    }

    if (S.mode === 'dying' && S.fall) {
      var f = S.fall;
      f.t += dt;
      f.vy += H * 1.9 * dt;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.rot += dt * 7 * (f.vx > 0 ? 1 : -1);
      if (f.t > 0.95) finishRun();
    }

    /* 이펙트 수명 */
    var arr = S.particles, keep = [];
    for (var i = 0; i < arr.length; i++) {
      var p = arr[i];
      p.life += dt;
      if (p.life >= p.max) continue;
      p.vy += 340 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= (1 - 1.8 * dt);
      keep.push(p);
    }
    S.particles = keep;

    var rk = [];
    for (var j = 0; j < S.rings.length; j++) {
      var r = S.rings[j];
      r.t += dt;
      if (r.t < r.max) rk.push(r);
    }
    S.rings = rk;

    var fk = [];
    for (var m = 0; m < S.floaters.length; m++) {
      var ft = S.floaters[m];
      ft.life += dt;
      if (ft.life >= ft.max) continue;
      ft.y -= 55 * dt;
      fk.push(ft);
    }
    S.floaters = fk;

    if (S.punch > 0) S.punch = Math.max(0, S.punch - dt * 5.5);
    if (S.shake > 0) S.shake = Math.max(0, S.shake - dt * 2.6);
  }

  /* ── 메인 드로우 ───────────────────────────────────────── */
  function draw() {
    var ws = weights(S.floor);
    ctx.save();

    /* 화면 펀치 */
    if (S.punch > 0.01) {
      var sc = 1 + 0.018 * S.punch;
      ctx.translate(W / 2, H * 0.6);
      ctx.scale(sc, sc);
      ctx.translate(-W / 2, -H * 0.6);
    }
    if (S.shake > 0) {
      var m = S.shake * 8;
      ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
    }

    ctx.clearRect(-30, -30, W + 60, H + 60);
    drawSky(ws, S.floor, S.t);
    drawStairs(ws);
    drawItems();
    drawHint(ws);
    drawCharacter();
    drawFx();
    ctx.restore();

    if (S.mode === 'playing' && S.gauge < 20) {
      var a = (1 - S.gauge / 20) * 0.24 * (0.6 + 0.4 * Math.sin(S.t * 8));
      var vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.75);
      vg.addColorStop(0, 'rgba(255,60,60,0)');
      vg.addColorStop(1, 'rgba(255,60,60,' + a.toFixed(3) + ')');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);
    }
  }

  /* ── 루프 ─────────────────────────────────────────────── */
  var last = 0;
  function frame(now) {
    if (!last) last = now;
    var dt = (now - last) / 1000;
    last = now;
    if (dt > 0.06) dt = 0.06;
    if (!document.hidden) update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  resize();
  (function boot() {
    S.floor = 0; S.dir = 1; S.camF = 0; S.gauge = 100;
    S.mode = 'ready';
    updateGaugeBar();
    updateHUD(true);
    showOverlay('ready', false);
  })();

  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', function () { last = 0; });

  window.__woojinGame = {
    state: S,
    start: startGame,
    turn: doTurn,
    climb: function () { if (S.mode === 'playing' && !S.auto) climbCore(false); },
    stepKind: stepKind,
    itemAt: itemAt,
    get mode() { return S.mode; }
  };

  requestAnimationFrame(frame);
})();
