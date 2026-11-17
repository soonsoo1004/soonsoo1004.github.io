/* 천국의 계단 · 우진이의 구름 계단
   ------------------------------------------------------------- */
(function () {
  'use strict';

  var TAU = Math.PI * 2;
  var clamp = function (v, a, b) { a = a === undefined ? 0 : a; b = b === undefined ? 1 : b; return v < a ? a : v > b ? b : v; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var easeOutCubic = function (t) { return 1 - Math.pow(1 - t, 3); };
  var easeInOut = function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };

  function hex2rgb(h) { var n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }

  /* ── 하늘 단계 (층수에 따라 서서히 변함) ───────────────── */
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

  function mix(ws, key) {
    var r = 0, g = 0, b = 0;
    for (var i = 0; i < STAGES.length; i++) { var c = STAGES[i][key]; r += c[0] * ws[i]; g += c[1] * ws[i]; b += c[2] * ws[i]; }
    return 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')';
  }
  function mixA(ws, key, a) {
    var r = 0, g = 0, b = 0;
    for (var i = 0; i < STAGES.length; i++) { var c = STAGES[i][key]; r += c[0] * ws[i]; g += c[1] * ws[i]; b += c[2] * ws[i]; }
    return 'rgba(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ',' + a + ')';
  }

  /* ── 소리 (Web Audio 직접 합성) ─────────────────────────── */
  var actx = null, master = null, muted = false;
  try { muted = localStorage.getItem('woojin_stairs_mute') === '1'; } catch (e) { }

  function audioInit() {
    if (actx) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      actx = new AC();
      master = actx.createGain();
      master.gain.value = 0.55;
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
  var sfx = {
    step: function (combo) {
      var f = 640 + Math.min(combo, 14) * 42;
      tone(f, 0.11, 'triangle', 0.20, f * 1.7);
      tone(f * 2.02, 0.05, 'sine', 0.06);
    },
    turn: function () { tone(560, 0.06, 'sine', 0.09, 430); },
    fail: function () { tone(430, 0.45, 'sawtooth', 0.16, 90); tone(200, 0.55, 'sine', 0.10, 60); },
    fever: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.16, 'triangle', 0.16, null, i * 0.06); }); },
    over: function () { tone(660, 0.22, 'triangle', 0.16, 520); tone(520, 0.3, 'triangle', 0.14, 380, 0.16); tone(370, 0.45, 'sine', 0.12, 170, 0.36); },
    tick: function () { tone(900, 0.045, 'square', 0.04); },
    start: function () { [523, 659, 784].forEach(function (f, i) { tone(f, 0.13, 'triangle', 0.15, null, i * 0.07); }); },
    best: function () { [784, 988, 1175, 1568].forEach(function (f, i) { tone(f, 0.2, 'triangle', 0.16, null, i * 0.09); }); }
  };

  /* ── 캔버스 ─────────────────────────────────────────────── */
  var cv = document.getElementById('stage');
  var ctx = cv.getContext('2d');
  var W = 390, H = 844, DPR = 1;
  var faceImg = new Image();
  var faceReady = false;
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

  /* ── 상태 ───────────────────────────────────────────────── */
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
    shake: 0,
    particles: [], floaters: [],
    lowTick: 0,
    reason: ''
  };

  try {
    S.best = parseInt(localStorage.getItem('woojin_stairs_best') || '0', 10) || 0;
    S.bestScore = parseInt(localStorage.getItem('woojin_stairs_best_score') || '0', 10) || 0;
  } catch (e) { }

  function saveBest() {
    var newRecord = false;
    if (S.floor > S.best) { S.best = S.floor; S.bestScore = Math.max(S.bestScore, S.score); newRecord = true; }
    else if (S.score > S.bestScore) { S.bestScore = S.score; newRecord = true; }
    try {
      localStorage.setItem('woojin_stairs_best', String(S.best));
      localStorage.setItem('woojin_stairs_best_score', String(S.bestScore));
    } catch (e) { }
    return newRecord;
  }

  /* ── 무대 기하 ──────────────────────────────────────────── */
  function stairX(n) { return (n % 2 === 0) ? W * 0.30 : W * 0.70; }
  function risePx() { return H * 0.084; }
  function baseY() { return H * 0.70; }
  function yOf(n) { return baseY() - (n - S.camF) * risePx(); }
  function stairW() { return Math.min(W * 0.44, 240); }

  /* ── 파티클 ─────────────────────────────────────────────── */
  function burst(x, y, n, colors, power) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * TAU, sp = (power || 1) * (60 + Math.random() * 150);
      S.particles.push({
        x: x, y: y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40,
        life: 0, max: 0.45 + Math.random() * 0.5,
        r: 1.6 + Math.random() * 2.6,
        col: colors[(Math.random() * colors.length) | 0],
        star: Math.random() < 0.35
      });
    }
  }

  function floatText(x, y, text, col) {
    S.floaters.push({ x: x, y: y, text: text, life: 0, max: 0.85, col: col || '#ff7a59' });
  }

  /* ── 게임 진행 ──────────────────────────────────────────── */
  function resetRun() {
    S.floor = 0; S.score = 0;
    S.dir = 1; S.camF = 0;
    S.gauge = 100; S.combo = 0; S.lastClimb = -99;
    S.fever = 0; S.jump = null; S.fall = null; S.shake = 0;
    S.particles.length = 0; S.floaters.length = 0;
    S.lowTick = 0; S.reason = '';
    S.mode = 'playing';
  }

  function startGame() {
    audioInit();
    if (actx && actx.state === 'suspended') { actx.resume(); }
    resetRun();
    hideOverlay();
    sfx.start();
    updateHUD(true);
  }

  function doTurn() {
    if (S.mode !== 'playing') return;
    S.dir *= -1;
    sfx.turn();
    var v = charVisual();
    burst(v.x, v.feet - 4, 4, ['rgba(255,255,255,0.95)', 'rgba(160,215,255,0.9)'], 0.45);
  }

  function doClimb() {
    if (S.mode !== 'playing') return;
    var need = (stairX(S.floor + 1) > stairX(S.floor)) ? 1 : -1;
    if (S.dir !== need) { missStep(); return; }

    var from = S.floor;
    S.floor += 1;

    var now = S.combo > 0 && (S.t - S.lastClimb) < 1.5 ? S.combo + 1 : 1;
    if (now < S.combo + 1) now = 1;
    S.combo = now;
    S.lastClimb = S.t;

    var wasFever = S.fever > 0.5;
    var feverOn = S.combo >= 5;
    var gain = feverOn ? 20 : 10;
    S.score += gain;

    S.jump = { t: 0, dur: 0.13, from: from, to: S.floor };
    S.gauge = Math.min(100, S.gauge + 24);

    sfx.step(S.combo);

    var v = charVisual();
    var px = stairX(S.floor), py = yOf(S.floor);
    burst(px, py - 6, feverOn ? 8 : 4, feverOn
      ? ['#ffd76a', '#ffe9a8', '#fff6d0', '#ffb347']
      : ['rgba(255,255,255,0.95)', 'rgba(180,225,255,0.9)'], feverOn ? 1 : 0.6);
    floatText(px + (S.dir > 0 ? 26 : -26), py - 74, '+' + gain, feverOn ? '#c07a00' : '#e04a1c');

    if (feverOn && !wasFever) { sfx.fever(); toast('피버! 반짝반짝 ✨'); }
    if (!feverOn && wasFever) { }

    if (S.floor % 10 === 0) cheer(S.floor);
    updateHUD();
  }

  var CHEERS = {
    10: '10층! 하늘까지 반짝 ✨',
    20: '20층! 구름이 보여요 ☁️',
    30: '30층! 무지개가 활짝 🌈',
    50: '50층! 별이 총총 ⭐',
    70: '70층! 천국 문이 앞에 👼',
    100: '100층! 우진이 최고! 👑',
    150: '150층! 전설의 계단인데? 🏆'
  };
  function cheer(f) {
    var msg = CHEERS[f];
    if (!msg && f % 25 === 0) msg = f + '층! 멈추지 마요 🚀';
    if (msg) { toast(msg); sfx.best(); }
  }

  function missStep() {
    if (S.mode !== 'playing') return;
    S.mode = 'dying';
    S.reason = '발을 헛디뎠어요';
    sfx.fail();
    S.shake = 1;
    var v = charVisual();
    S.fall = { t: 0, x: v.x, y: v.y, vx: S.dir * W * 0.55, vy: -H * 0.16, rot: 0, cs: v.cs };
    S.jump = null;
    S.combo = 0; S.fever = 0;
  }

  function timeOver() {
    if (S.mode !== 'playing') return;
    S.mode = 'dying';
    S.reason = '시간이 다 됐어요';
    sfx.fail();
    var v = charVisual();
    S.fall = { t: 0, x: v.x, y: v.y, vx: (Math.random() - 0.5) * W * 0.2, vy: -H * 0.05, rot: 0, cs: v.cs };
    S.jump = null;
  }

  function finishRun() {
    S.mode = 'over';
    S.fall = null;
    var record = saveBest();
    if (record) sfx.best(); else sfx.over();
    showOverlay('over', record);
  }

  /* ── HUD ────────────────────────────────────────────────── */
  var elFloor = document.getElementById('floorNum');
  var elScore = document.getElementById('scoreNum');
  var elGauge = document.getElementById('gaugeFill');
  var elMute = document.getElementById('muteBtn');
  var lastFloor = -1, lastScore = -1;

  function updateHUD(force) {
    if (force || S.floor !== lastFloor) {
      elFloor.textContent = S.floor;
      if (lastFloor >= 0 && S.floor !== lastFloor) {
        elFloor.parentNode.classList.add('pop');
        setTimeout(function () { elFloor.parentNode.classList.remove('pop'); }, 120);
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
    elGauge.style.transformOrigin = 'left center';
    var cls = g < 0.3 ? 'gauge-fill danger' : g < 0.55 ? 'gauge-fill warn' : 'gauge-fill';
    if (elGauge.className !== cls) elGauge.className = cls;
  }

  function updateMuteBtn() {
    elMute.textContent = muted ? '🔇' : '🔊';
    elMute.classList.toggle('off', muted);
    elMute.setAttribute('aria-label', muted ? '소리 켜기' : '소리 끄기');
  }
  updateMuteBtn();

  /* ── 토스트 ─────────────────────────────────────────────── */
  var elToast = document.getElementById('toast'), toastTimer = null;
  function toast(msg) {
    elToast.textContent = msg;
    elToast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { elToast.classList.remove('show'); }, 1500);
  }

  /* ── 오버레이 ───────────────────────────────────────────── */
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

  /* ── 입력 ───────────────────────────────────────────────── */
  var btnTurn = document.getElementById('turnBtn');
  var btnClimb = document.getElementById('climbBtn');

  function bindPress(el, fn) {
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      fn();
      el.classList.add('down');
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
      el.addEventListener(ev, function () { el.classList.remove('down'); });
    });
    el.addEventListener('click', function (e) { e.preventDefault(); });
    el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }
  bindPress(btnTurn, doTurn);
  bindPress(btnClimb, doClimb);

  window.addEventListener('keydown', function (e) {
    var k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') { e.preventDefault(); if (S.mode === 'playing' && S.dir !== -1) doTurn(); return; }
    if (k === 'ArrowRight' || k === 'd' || k === 'D') { e.preventDefault(); if (S.mode === 'playing' && S.dir !== 1) doTurn(); return; }
    if (k === ' ' || k === 'Spacebar' || k === 'ArrowUp' || k === 'Enter' || k === 'w' || k === 'W') {
      e.preventDefault();
      if (S.mode === 'playing') doClimb();
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

  /* ── 캐릭터 위치 계산 ───────────────────────────────────── */
  var _char = { x: 0, y: 0, feet: 0, cs: 72, tilt: 0, air: 0 };
  function charVisual() {
    var cs = Math.min(W * 0.22, 86);
    var x = stairX(S.floor), feet = yOf(S.floor), tilt = 0, air = 0;
    if (S.jump) {
      var p = clamp(S.jump.t / S.jump.dur);
      var e = easeInOut(p);
      var x0 = stairX(S.jump.from), x1 = stairX(S.jump.to);
      var y0 = yOf(S.jump.from), y1 = yOf(S.jump.to);
      x = lerp(x0, x1, e);
      feet = lerp(y0, y1, e);
      air = Math.sin(Math.PI * p) * risePx() * 0.42;
      feet -= air;
      tilt = Math.sin(Math.PI * p) * 0.10 * (x1 > x0 ? 1 : -1);
    }
    var bob = (S.mode === 'playing' && !S.jump) ? Math.sin(S.t * 7) * 1.6 : (S.mode === 'playing' ? 0 : Math.sin(S.t * 2.4) * 2.2);
    _char.x = x; _char.feet = feet + bob; _char.cs = cs; _char.tilt = tilt; _char.air = air;
    _char.y = _char.feet - cs / 2 - 2;
    return _char;
  }

  /* ── 그리기 도우미 ──────────────────────────────────────── */
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

  /* 별 (고정 배치, 반짝임만) */
  var STARS = (function () {
    var a = [], seed = 7;
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    for (var i = 0; i < 80; i++) a.push({ x: rnd(), y: rnd(), r: 0.6 + rnd() * 1.8, ph: rnd() * TAU, sp: 0.8 + rnd() * 2 });
    return a;
  })();

  function starShape(x, y, r, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    for (var i = 0; i < 4; i++) {
      var a = i * Math.PI / 2;
      ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      ctx.lineTo(x + Math.cos(a + 0.785) * r * 0.42, y + Math.sin(a + 0.785) * r * 0.42);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /* ── 배경 ───────────────────────────────────────────────── */
  function drawSky(ws, f, t) {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, mix(ws, 'top'));
    g.addColorStop(0.55, mix(ws, 'mid'));
    g.addColorStop(1, mix(ws, 'bot'));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    var off = (S.camF * 0.55 * risePx()) % (H * 1.4);

    /* 1단계 · 포근한 하늘 */
    if (ws[0] > 0.02) {
      var a0 = ws[0];
      /* 해 */
      var sx = W * 0.80, sy = H * 0.13 - off * 0.25;
      var rg = ctx.createRadialGradient(sx, sy, 8, sx, sy, 120);
      rg.addColorStop(0, 'rgba(255,244,190,' + (0.95 * a0) + ')');
      rg.addColorStop(0.35, 'rgba(255,232,150,' + (0.45 * a0) + ')');
      rg.addColorStop(1, 'rgba(255,232,150,0)');
      ctx.fillStyle = rg;
      ctx.beginPath(); ctx.arc(sx, sy, 120, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,252,225,' + (0.95 * a0) + ')';
      ctx.beginPath(); ctx.arc(sx, sy, 30, 0, TAU); ctx.fill();

      for (var i = 0; i < 5; i++) {
        var cx = ((i * 0.27 * W + t * (9 + i * 4) + i * 120) % (W + 320)) - 160;
        var cy = ((i * 0.23 + 0.08) * H + off * (0.3 + i * 0.12)) % (H * 1.25);
        cloud(cx, cy, 0.65 + (i % 3) * 0.28, '#ffffff', 0.85 * a0);
      }
    }

    /* 2단계 · 노을 */
    if (ws[1] > 0.02) {
      var a1 = ws[1];
      var hy = H * 0.62;
      var rg2 = ctx.createRadialGradient(W * 0.5, hy, 10, W * 0.5, hy, W * 0.85);
      rg2.addColorStop(0, 'rgba(255,196,120,' + (0.8 * a1) + ')');
      rg2.addColorStop(0.5, 'rgba(255,150,110,' + (0.32 * a1) + ')');
      rg2.addColorStop(1, 'rgba(255,150,110,0)');
      ctx.fillStyle = rg2;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = 'rgba(255,241,205,' + (0.85 * a1) + ')';
      ctx.beginPath(); ctx.arc(W * 0.5, hy + 10, 46, 0, TAU); ctx.fill();

      for (var j = 0; j < 4; j++) {
        var cx2 = ((j * 0.31 * W - t * (7 + j * 3) + j * 90) % (W + 320) + W + 320) % (W + 320) - 160;
        var cy2 = (0.30 + j * 0.14) * H + off * (0.25 + j * 0.1);
        cloud(cx2, cy2 % (H * 1.2), 0.7 + (j % 2) * 0.3, 'rgba(255,214,170,1)', 0.7 * a1);
      }
      /* 새 */
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
    }

    /* 3단계 · 무지개 */
    if (ws[2] > 0.02) {
      var a2 = ws[2];
      drawRainbow(W * 0.5, H * 1.34, Math.max(H * 0.82, 470), 10, 0.6 * a2);
      drawRainbow(W * 0.5, H * 1.44, Math.max(H * 0.70, 400), 7, 0.32 * a2);
      for (var k = 0; k < 4; k++) {
        var cx3 = ((k * 0.29 * W + t * (11 + k * 5)) % (W + 300)) - 150;
        var cy3 = (0.14 + k * 0.19) * H + off * 0.2;
        cloud(cx3, cy3 % (H * 1.1), 0.55 + (k % 2) * 0.3, '#ffffff', 0.75 * a2);
      }
      for (var s2 = 0; s2 < 18; s2++) {
        var ang = t * 0.6 + s2;
        var px = W * 0.5 + Math.cos(ang) * (W * 0.45);
        var py = H * 0.30 + Math.sin(ang * 1.3) * (H * 0.30);
        starShape(px, py, 2 + (s2 % 3), '#fff8c9', 0.55 * a2 * (0.5 + 0.5 * Math.sin(t * 3 + s2)));
      }
    }

    /* 4단계 · 별빛 우주 */
    if (ws[3] > 0.02) {
      var a3 = ws[3];
      var so = (S.camF * 0.35 * risePx()) % H;
      for (var si = 0; si < STARS.length; si++) {
        var st = STARS[si];
        var y = (st.y * H + so) % H;
        var tw = 0.45 + 0.55 * Math.abs(Math.sin(t * st.sp + st.ph));
        ctx.fillStyle = 'rgba(255,255,255,' + (tw * a3) + ')';
        ctx.beginPath(); ctx.arc(W * st.x, y, st.r, 0, TAU); ctx.fill();
      }
      /* 달 */
      var mx = W * 0.78, my = H * 0.16 + Math.sin(t * 0.4) * 4;
      var mg = ctx.createRadialGradient(mx, my, 4, mx, my, 70);
      mg.addColorStop(0, 'rgba(255,250,215,' + (0.5 * a3) + ')');
      mg.addColorStop(1, 'rgba(255,250,215,0)');
      ctx.fillStyle = mg;
      ctx.beginPath(); ctx.arc(mx, my, 70, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,251,226,' + (0.97 * a3) + ')';
      ctx.beginPath(); ctx.arc(mx, my, 24, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(228,220,180,' + (0.05 * a3) + ')';
      ctx.beginPath(); ctx.arc(mx + 11, my - 6, 21, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(226,218,182,' + (0.55 * a3) + ')';
      ctx.beginPath(); ctx.arc(mx - 7, my - 8, 5, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(mx + 6, my + 6, 7, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(mx - 4, my + 12, 3.5, 0, TAU); ctx.fill();

      /* 별똥별 */
      var per = 4.6, ph = (t % per) / per;
      if (ph < 0.22) {
        var k2 = ph / 0.22;
        var sx2 = W * (0.15 + (Math.floor(t / per) % 3) * 0.25) + k2 * W * 0.5;
        var sy2 = H * 0.12 + k2 * H * 0.22;
        var grad = ctx.createLinearGradient(sx2, sy2, sx2 - 70, sy2 - 30);
        grad.addColorStop(0, 'rgba(255,255,255,' + (0.9 * a3 * (1 - k2)) + ')');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = grad; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(sx2, sy2); ctx.lineTo(sx2 - 70, sy2 - 30); ctx.stroke();
      }
    }

    /* 5단계 · 천국 구름 정원 */
    if (ws[4] > 0.02) {
      var a4 = ws[4];
      /* 빛줄기 */
      ctx.save();
      ctx.globalAlpha = a4;
      var lx = W * 0.5, ly = -H * 0.06;
      var rayG = ctx.createLinearGradient(0, 0, 0, H * 0.95);
      rayG.addColorStop(0, 'rgba(255,214,120,0.75)');
      rayG.addColorStop(0.45, 'rgba(255,228,160,0.34)');
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
      /* 상단 은은한 금빛 */
      var hg2 = ctx.createLinearGradient(0, 0, 0, H * 0.55);
      hg2.addColorStop(0, 'rgba(255,226,150,' + (0.42 * a4) + ')');
      hg2.addColorStop(1, 'rgba(255,226,150,0)');
      ctx.fillStyle = hg2;
      ctx.fillRect(0, 0, W, H * 0.55);
      ctx.restore();

      for (var q = 0; q < 6; q++) {
        var cx4 = ((q * 0.21 * W + t * (5 + q * 2)) % (W + 400)) - 200;
        var cy4 = (0.06 + q * 0.16) * H + off * (0.15 + q * 0.05);
        cloud(cx4, cy4 % (H * 1.15), 0.8 + (q % 3) * 0.22, '#ffffff', 0.8 * a4);
      }
      /* 반짝이는 먼지 */
      for (var d = 0; d < 22; d++) {
        var dpx = ((d * 137.5) % W + Math.sin(t * 0.5 + d) * 12);
        var dpy = ((d * 89.3 + t * 14) % (H * 1.2)) + Math.sin(t + d) * 8;
        ctx.fillStyle = 'rgba(255,246,200,' + (0.55 * a4 * (0.4 + 0.6 * Math.abs(Math.sin(t * 2 + d)))) + ')';
        ctx.beginPath(); ctx.arc(dpx, dpy, 1.6 + (d % 3) * 0.7, 0, TAU); ctx.fill();
      }

      /* 발밑 구름 정원 */
      for (var g2 = 0; g2 < 5; g2++) {
        var gx = (g2 * W * 0.26 + 40 + Math.sin(t * 0.4 + g2) * 10);
        cloud(gx, H * 0.985 + Math.cos(g2 * 1.7) * 16, 1.5 + (g2 % 2) * 0.4, '#ffffff', 0.75 * a4);
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

  /* ── 계단 ───────────────────────────────────────────────── */
  function drawStairs(ws) {
    var stepRise = risePx();
    var sw = stairW();
    var from = Math.floor(S.camF) - 3, to = Math.floor(S.camF) + 9;
    var top = mix(ws, 'sTop'), face = mix(ws, 'sFace'), edge = mix(ws, 'sEdge');

    for (var n = from; n <= to; n++) {
      if (n < 0) continue;
      var y = yOf(n);
      if (y < -140 || y > H + 180) continue;
      var cx = stairX(n);
      var x = cx - sw / 2;
      var alpha = 1;
      if (y > H * 0.90) alpha = clamp((H * 1.15 - y) / (H * 0.25));
      ctx.save();
      ctx.globalAlpha = alpha;

      /* 그림자 */
      ctx.fillStyle = 'rgba(40,60,90,0.12)';
      rr(x + 4, y + 16, sw, 24, 10); ctx.fill();

      /* 앞면 */
      ctx.fillStyle = face;
      rr(x, y + 8, sw, 32, 10); ctx.fill();

      /* 윗면 */
      ctx.fillStyle = top;
      rr(x, y, sw, 20, 10); ctx.fill();

      /* 테두리 */
      ctx.strokeStyle = edge;
      ctx.lineWidth = 2;
      rr(x + 1, y + 1, sw - 2, 19, 9); ctx.stroke();

      /* 윗면 광택 */
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 14, y + 6);
      ctx.lineTo(x + sw - 14, y + 6);
      ctx.stroke();

      /* 무지개 구간 색 띠 */
      if (ws[2] > 0.05) {
        ctx.strokeStyle = 'hsla(' + ((n * 24) % 360) + ',88%,64%,' + (0.75 * ws[2]) + ')';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + 12, y + 31);
        ctx.lineTo(x + sw - 12, y + 31);
        ctx.stroke();
      }

      /* 지금 서 있는 계단 표시 */
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

  /* 다음 계단 안내 (아이용) */
  function drawHint(ws) {
    if (S.mode !== 'playing') return;
    var n = S.floor + 1;
    var y = yOf(n);
    if (y < -60 || y > H) return;
    var cx = stairX(n);
    var sw = stairW();
    var pulse = 0.55 + 0.45 * Math.sin(S.t * 5);
    var need = (stairX(n) > stairX(S.floor)) ? 1 : -1;
    var ok = S.dir === need;

    ctx.save();
    ctx.globalAlpha = 0.28 + 0.36 * pulse;
    ctx.fillStyle = ok ? 'rgba(120,230,150,0.95)' : 'rgba(255,180,90,0.95)';
    rr(cx - sw / 2 + 18, y + 8, sw - 36, 6, 3);
    ctx.fill();
    ctx.restore();

    /* 방향 화살표 */
    var ax = cx;
    var ay = y - 13 - pulse * 3;
    ctx.save();
    ctx.globalAlpha = 0.55 + 0.35 * pulse;
    ctx.fillStyle = ok ? 'rgba(90,200,125,0.95)' : 'rgba(255,160,80,0.95)';
    ctx.beginPath();
    ctx.moveTo(ax + need * 9, ay);
    ctx.lineTo(ax - need * 5, ay - 7.5);
    ctx.lineTo(ax - need * 5, ay + 7.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /* ── 캐릭터 ─────────────────────────────────────────────── */
  function drawCharacter() {
    if (S.fall) { drawFalling(); return; }
    var v = charVisual();
    var cs = v.cs, d = cs;
    var fever = S.fever;

    /* 그림자 */
    var shadowScale = 1 - clamp(v.air / (risePx() * 0.6)) * 0.45;
    ctx.save();
    ctx.globalAlpha = 0.18 * shadowScale;
    ctx.fillStyle = '#22304a';
    ctx.beginPath();
    ctx.ellipse(v.x, v.feet + 2, cs * 0.40 * shadowScale, cs * 0.13 * shadowScale, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    /* 천사 날개 (피버) */
    if (fever > 0.02) {
      var flap = Math.sin(S.t * 11) * 0.16;
      for (var side = -1; side <= 1; side += 2) {
        drawWing(v.x, v.y, cs, side, flap, fever);
      }
    }

    /* 후광 */
    var hg = ctx.createRadialGradient(v.x, v.y, cs * 0.22, v.x, v.y, cs * 0.92);
    hg.addColorStop(0, 'rgba(255,255,255,0.22)');
    hg.addColorStop(0.7, 'rgba(255,255,255,0.07)');
    hg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hg;
    ctx.beginPath(); ctx.arc(v.x, v.y, cs * 0.92, 0, TAU); ctx.fill();

    /* 얼굴 */
    ctx.save();
    ctx.translate(v.x, v.y);
    ctx.rotate(v.tilt);
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, d / 2, 0, TAU);
    ctx.closePath();
    ctx.clip();
    if (faceReady) {
      ctx.drawImage(faceImg, -d / 2, -d / 2, d, d);
    } else {
      ctx.fillStyle = '#ffe1b8'; ctx.fillRect(-d / 2, -d / 2, d, d);
    }
    ctx.restore();

    /* 테두리 */
    ctx.lineWidth = Math.max(3, d * 0.05);
    ctx.strokeStyle = fever > 0.3 ? 'rgba(255,214,120,0.98)' : 'rgba(255,255,255,0.96)';
    ctx.beginPath();
    ctx.arc(0, 0, d / 2 - ctx.lineWidth / 2, 0, TAU);
    ctx.stroke();

    /* 왕관 */
    if (fever > 0.05) {
      ctx.save();
      ctx.globalAlpha = fever;
      ctx.translate(0, -d / 2 - d * 0.10);
      var cw = d * 0.46, ch = d * 0.24;
      ctx.fillStyle = '#ffcf4d';
      ctx.strokeStyle = 'rgba(200,140,20,0.9)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-cw / 2, ch * 0.5);
      ctx.lineTo(-cw / 2, -ch * 0.35);
      ctx.lineTo(-cw * 0.22, ch * 0.05);
      ctx.lineTo(0, -ch * 0.6);
      ctx.lineTo(cw * 0.22, ch * 0.05);
      ctx.lineTo(cw / 2, -ch * 0.35);
      ctx.lineTo(cw / 2, ch * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ff5f7a';
      ctx.beginPath(); ctx.arc(0, ch * 0.12, d * 0.035, 0, TAU); ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    /* 방향 표시 */
    ctx.save();
    var ay = v.feet + 16 + Math.sin(S.t * 6) * 2;
    var ax = v.x + S.dir * (cs * 0.52);
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
        var rx = v.x + Math.cos(ang) * cs * 0.78;
        var ry = v.y + Math.sin(ang) * cs * 0.62;
        starShape(rx, ry, 3 + Math.sin(S.t * 6 + i) * 1.4, '#fff2b8', 0.85 * fever);
      }
    }
  }

  function drawWing(x, y, cs, side, flap, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha * 0.97;
    ctx.translate(x + side * cs * 0.22, y + cs * 0.04);
    ctx.rotate(side * (0.28 + flap));
    ctx.scale(side, 1);
    var g = ctx.createLinearGradient(0, -cs * 0.2, cs * 0.9, cs * 0.3);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.6, 'rgba(255,247,222,0.95)');
    g.addColorStop(1, 'rgba(255,224,158,0.65)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(cs * 0.42, -cs * 0.40, cs * 0.92, -cs * 0.16);
    ctx.quadraticCurveTo(cs * 0.66, cs * 0.02, cs * 0.74, cs * 0.18);
    ctx.quadraticCurveTo(cs * 0.48, cs * 0.10, cs * 0.50, cs * 0.30);
    ctx.quadraticCurveTo(cs * 0.24, cs * 0.16, 0, cs * 0.10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,214,150,0.5)';
    ctx.lineWidth = 1.4;
    for (var i = 1; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(cs * 0.04 * i, cs * 0.03);
      ctx.quadraticCurveTo(cs * 0.34, -cs * 0.15 * i, cs * 0.70, -cs * 0.01 * i);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFalling() {
    var f = S.fall;
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.rotate(f.rot);
    var d = f.cs;
    ctx.beginPath();
    ctx.arc(0, 0, d / 2, 0, TAU);
    ctx.closePath();
    ctx.save(); ctx.clip();
    if (faceReady) ctx.drawImage(faceImg, -d / 2, -d / 2, d, d);
    else { ctx.fillStyle = '#ffe1b8'; ctx.fillRect(-d / 2, -d / 2, d, d); }
    ctx.restore();
    ctx.lineWidth = Math.max(3, d * 0.05);
    ctx.strokeStyle = 'rgba(255,255,255,0.96)';
    ctx.beginPath(); ctx.arc(0, 0, d / 2 - ctx.lineWidth / 2, 0, TAU); ctx.stroke();
    ctx.restore();
  }

  /* ── 파티클 그리기 ──────────────────────────────────────── */
  function drawParticles() {
    var i, p;
    for (i = 0; i < S.particles.length; i++) {
      p = S.particles[i];
      var k = 1 - p.life / p.max;
      ctx.save();
      ctx.globalAlpha = clamp(k, 0, 1) * 0.95;
      if (p.star) {
        starShape(p.x, p.y, p.r * 1.5, p.col, clamp(k, 0, 1));
      } else {
        ctx.fillStyle = p.col;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * k, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }
    for (i = 0; i < S.floaters.length; i++) {
      var ft = S.floaters[i];
      var kk = 1 - ft.life / ft.max;
      ctx.save();
      ctx.globalAlpha = clamp(kk, 0, 1);
      ctx.font = 'bold 18px Gulim, "굴림", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(255,255,255,0.95)';
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillStyle = ft.col;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }

  /* ── 업데이트 ───────────────────────────────────────────── */
  function update(dt) {
    S.t += dt;

    /* 카메라 */
    var targetCam = S.floor;
    S.camF += (targetCam - S.camF) * (1 - Math.exp(-dt * 9));
    if (Math.abs(S.camF - targetCam) < 0.002) S.camF = targetCam;

    /* 점프 애니메이션 */
    if (S.jump) {
      S.jump.t += dt;
      if (S.jump.t >= S.jump.dur) S.jump = null;
    }

    /* 피버 시각화 */
    var feverTarget = (S.mode === 'playing' && S.combo >= 5) ? 1 : 0;
    S.fever += (feverTarget - S.fever) * (1 - Math.exp(-dt * 8));

    if (S.mode === 'playing') {
      /* 게이지 */
      var drain = 8.5 + Math.min(S.floor * 0.075, 9);
      if (S.fever > 0.5) drain *= 0.6;
      S.gauge -= drain * dt;
      if (S.gauge <= 0) { S.gauge = 0; timeOver(); }

      if (S.gauge < 30) {
        S.lowTick += dt;
        if (S.lowTick > 0.45) { S.lowTick = 0; sfx.tick(); }
      } else S.lowTick = 0;

      /* 콤보 유지 시간이 지나면 초기화 */
      if (S.combo > 0 && S.t - S.lastClimb > 1.8) S.combo = 0;

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

    /* 파티클 */
    var arr = S.particles, keep = [], i;
    for (i = 0; i < arr.length; i++) {
      var p = arr[i];
      p.life += dt;
      if (p.life >= p.max) continue;
      p.vy += 320 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= (1 - 1.6 * dt);
      keep.push(p);
    }
    S.particles = keep;

    var fl = S.floaters, kf = [];
    for (i = 0; i < fl.length; i++) {
      var ft = fl[i];
      ft.life += dt;
      if (ft.life >= ft.max) continue;
      ft.y -= 42 * dt;
      kf.push(ft);
    }
    S.floaters = kf;

    if (S.shake > 0) S.shake = Math.max(0, S.shake - dt * 2.4);
  }

  /* ── 메인 드로우 ────────────────────────────────────────── */
  function draw() {
    var ws = weights(S.floor);
    ctx.save();
    if (S.shake > 0) {
      var m = S.shake * 7;
      ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
    }
    ctx.clearRect(-20, -20, W + 40, H + 40);
    drawSky(ws, S.floor, S.t);
    drawStairs(ws);
    drawHint(ws);
    drawCharacter();
    drawParticles();
    ctx.restore();

    /* 시간 초과 임박 비네트 */
    if (S.mode === 'playing' && S.gauge < 30) {
      var a = (1 - S.gauge / 30) * 0.22 * (0.6 + 0.4 * Math.sin(S.t * 8));
      var vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.75);
      vg.addColorStop(0, 'rgba(255,60,60,0)');
      vg.addColorStop(1, 'rgba(255,60,60,' + a.toFixed(3) + ')');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);
    }
  }

  /* ── 루프 ───────────────────────────────────────────────── */
  var last = 0, raf = 0;
  function frame(now) {
    if (!last) last = now;
    var dt = (now - last) / 1000;
    last = now;
    if (dt > 0.06) dt = 0.06;
    if (!document.hidden) update(dt);
    draw();
    raf = requestAnimationFrame(frame);
  }

  resize();
  resetRunIdle();
  function resetRunIdle() {
    S.floor = 0; S.dir = 1; S.camF = 0; S.gauge = 100;
    S.mode = 'ready';
    updateGaugeBar();
    updateHUD(true);
    showOverlay('ready', false);
  }

  window.addEventListener('resize', function () { resize(); });

  /* 테스트·디버그용 (읽기/호출 전용) */
  window.__woojinGame = {
    state: S,
    start: startGame,
    turn: doTurn,
    climb: doClimb,
    get mode() { return S.mode; }
  };

  raf = requestAnimationFrame(frame);

  /* 페이지 가시성: 돌아오면 시간 점프 방지 */
  document.addEventListener('visibilitychange', function () { last = 0; });
})();
