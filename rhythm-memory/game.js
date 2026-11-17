/* ════════════════════════════════════════════════════════════
   톡톡 리듬 암기  v1.0
   · 외부 라이브러리·이미지·음원 0 (Web Audio 자체 합성 + SVG/Canvas 자체 그래픽)
   · 4모드: 악보 계이름 / 기초 영단어 / 직업·안전 용어 / 내 암기장
   ════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const DAY = new Date().toISOString().slice(0, 10);

  /* ─────────── 문제 은행 (검증된 기초 일반상식·교육용만) ─────────── */
  const WORDS = [
    ['apple', '사과'], ['water', '물'], ['book', '책'], ['chair', '의자'],
    ['window', '창문'], ['door', '문'], ['morning', '아침'], ['night', '밤'],
    ['friend', '친구'], ['family', '가족'], ['school', '학교'], ['teacher', '선생님'],
    ['doctor', '의사'], ['hospital', '병원'], ['money', '돈'], ['time', '시간'],
    ['rain', '비'], ['snow', '눈'], ['wind', '바람'], ['spring', '봄'],
    ['summer', '여름'], ['autumn', '가을'], ['winter', '겨울'], ['river', '강'],
    ['mountain', '산'], ['bread', '빵'], ['milk', '우유'], ['egg', '달걀'],
    ['rice', '밥'], ['shoes', '신발'], ['socks', '양말'], ['light', '빛'],
    ['happy', '행복한'], ['tired', '피곤한'], ['hungry', '배고픈'], ['fast', '빠른'],
    ['slow', '느린'], ['begin', '시작하다'], ['finish', '끝내다'], ['remember', '기억하다'],
    ['forget', '잊다'], ['quiet', '조용한'], ['strong', '힘센'], ['careful', '조심스러운'],
    ['danger', '위험'], ['safe', '안전한'], ['price', '가격'], ['market', '시장'],
    ['letter', '편지'], ['voice', '목소리']
  ].map(([word, mean]) => ({ word, mean }));

  const TERMS = [
    ['어린이보호구역', '어린이를 보호하려고 정한 구역'],
    ['횡단보도', '길을 건너라고 그어 놓은 곳'],
    ['정지선', '차가 반드시 멈춰야 하는 선'],
    ['서행', '천천히 달리라는 뜻'],
    ['일방통행', '한쪽 방향으로만 가는 도로'],
    ['중앙선', '반대 방향 차와 나누는 선'],
    ['안전모', '머리를 보호하는 장비'],
    ['안전벨트', '몸을 좌석에 고정하는 장치'],
    ['소화기', '불을 끄는 장비'],
    ['비상구', '위급할 때 빠져나가는 출구'],
    ['바리스타', '커피를 내리는 직업'],
    ['재고', '창고에 남아 있는 물건'],
    ['송장', '택배에 붙는 배송표'],
    ['분류', '물건을 종류별로 나누는 일'],
    ['검수', '물건 상태를 확인하는 일'],
    ['피킹', '주문받은 상품을 골라 모으는 일'],
    ['포장', '물건을 싸는 일'],
    ['변수', '값을 담아 두는 상자'],
    ['반복문', '같은 일을 여러 번 되풀이하는 문법'],
    ['버그', '프로그램의 오류'],
    ['서버', '요청을 처리하는 컴퓨터'],
    ['클릭', '마우스로 누르는 일'],
    ['파일', '컴퓨터에 저장한 자료'],
    ['바코드', '상품에 붙은 굵은 줄 무늬'],
    ['영수증', '돈을 낸 것을 증명하는 종이'],
    ['주차장', '차를 세워 두는 곳'],
    ['과속', '정해진 속도보다 빨리 달리는 것'],
    ['안전거리', '앞차와 꼭 벌려야 하는 거리']
  ].map(([word, mean]) => ({ word, mean }));

  /* 계이름: 높은음자리표, C4~B4 한 옥타브 */
  const NOTES = [
    { name: '도', step: -2, freq: 261.63, letter: 'C' },
    { name: '레', step: -1, freq: 293.66, letter: 'D' },
    { name: '미', step: 0, freq: 329.63, letter: 'E' },
    { name: '파', step: 1, freq: 349.23, letter: 'F' },
    { name: '솔', step: 2, freq: 392.00, letter: 'G' },
    { name: '라', step: 3, freq: 440.00, letter: 'A' },
    { name: '시', step: 4, freq: 493.88, letter: 'B' }
  ];

  const MODE_LABEL = { staff: '🎼 계이름', word: '🔤 영단어', term: '🚗 직업·안전', custom: '📝 내 암기장' };
  const TOTAL = Math.max(5, Math.min(60, parseInt(new URLSearchParams(location.search).get('q') || '30', 10) || 30));

  /* ─────────── 상태 ─────────── */
  const s = {
    screen: 'home', mode: 'staff',
    running: false, paused: false,
    score: 0, combo: 0, maxCombo: 0, hearts: 3,
    correct: 0, wrong: 0, total: TOTAL, idx: 0,
    fever: false, feverEnd: 0, melodyId: null,
    queue: [], tile: null, wait: 0,
    hitY: 0, stageH: 0, gen: 0, review: [], bank: null,
    el: {}
  };

  const el = s.el;
  ['home', 'game', 'result', 'deck', 'fx', 'stage', 'tile', 'tileBody', 'answers',
    'scoreEl', 'heartsEl', 'comboWrap', 'comboNum', 'feverBadge', 'pop', 'toast',
    'progFill', 'progTxt', 'modeChip', 'pauseOv', 'reviewList', 'reviewCount'
  ].forEach(id => { el[id] = document.getElementById(id); });

  /* ─────────── 저장소 ─────────── */
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  };

  function loadDeck() {
    const raw = store.get('rm_deck', null);
    if (!Array.isArray(raw)) return [];
    return raw.filter(e => e && e.word && e.mean);
  }
  function saveDeck(list) { store.set('rm_deck', list); }

  function parseDeck(text) {
    const out = [], seen = new Set();
    String(text || '').split(/\r?\n/).forEach(line => {
      const t = line.trim();
      if (!t) return;
      let m = t.match(/^(.+?)\s*[:：]\s*(.+)$/) || t.match(/^(.+?)\s+[-\t]\s+(.+)$/);
      if (!m) return;
      const word = m[1].trim(), mean = m[2].trim();
      if (!word || !mean || seen.has(word)) return;
      seen.add(word);
      out.push({ word, mean });
    });
    return out;
  }

  const SAMPLE = 'apple:사과\nwater:물\nremember:기억하다\n안전모:머리를 보호하는 장비\n송장:택배에 붙는 배송표\n바리스타:커피를 내리는 직업';

  /* ─────────── 오디오 (자체 합성) ─────────── */
  let actx = null, master = null, audioOn = store.get('rm_sound', true);
  const sources = new Set();

  function ensureAudio() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!actx) {
      try { actx = new AC(); } catch (e) { return; }
      master = actx.createGain();
      master.gain.value = audioOn ? 0.85 : 0;
      master.connect(actx.destination);
    }
    if (actx.state === 'suspended') actx.resume().catch(() => { });
  }

  function voice(freq, dur, vol, type, when, detune) {
    if (!actx || !audioOn) return;
    const t = actx.currentTime + (when || 0);
    const g = actx.createGain();
    const o = actx.createOscillator();
    o.type = type || 'triangle';
    o.frequency.value = freq;
    if (detune) o.detune.value = detune;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0006, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.03);
    sources.add(o);
    o.onended = () => sources.delete(o);
  }

  function pianoNote(freq, when, dur, vol) {
    voice(freq, dur || 0.55, (vol == null ? 0.17 : vol), 'triangle', when, 0);
    voice(freq * 2, (dur || 0.55) * 0.62, (vol == null ? 0.055 : vol * 0.33), 'sine', when, 3);
  }

  function sndCorrect(freq) {
    if (!actx || !audioOn) return;
    const f = freq || 523.25;
    [1, 1.25, 1.5].forEach((r, i) => pianoNote(f * r, i * 0.048, 0.5, 0.15 - i * 0.02));
    if (s.fever) [2, 2.5].forEach((r, i) => pianoNote(f * r, 0.16 + i * 0.05, 0.35, 0.07));
  }
  function sndWrong() {
    if (!actx || !audioOn) return;
    voice(180, 0.19, 0.16, 'sawtooth', 0);
    voice(96, 0.24, 0.13, 'sine', 0.02);
  }
  function sndPass() {
    if (!actx || !audioOn) return;
    voice(210, 0.16, 0.07, 'sine', 0);
  }
  function sndTap() {
    if (!actx || !audioOn) return;
    voice(660, 0.07, 0.05, 'sine', 0);
  }

  const MELODY = [523.25, 659.25, 783.99, 659.25, 880.0, 783.99, 659.25, 587.33];
  let melStep = 0;
  function startMelody() {
    if (s.melodyId || !audioOn) return;
    melStep = 0;
    s.melodyId = setInterval(() => {
      if (!actx || !audioOn) return;
      pianoNote(MELODY[melStep % MELODY.length], 0, 0.22, 0.055);
      melStep++;
    }, 170);
  }
  function stopMelody() {
    if (s.melodyId) { clearInterval(s.melodyId); s.melodyId = null; }
  }
  function stopAllAudio() {
    stopMelody();
    sources.forEach(o => { try { o.onended = null; o.stop(); } catch (e) { } });
    sources.clear();
  }

  function setMute(mute) {
    audioOn = !mute;
    store.set('rm_sound', audioOn);
    if (master) master.gain.value = audioOn ? 0.85 : 0;
    if (!audioOn) stopAllAudio();
    else if (s.fever) startMelody();
    ['muteBtn', 'muteBtn2'].forEach(id => {
      const b = document.getElementById(id);
      if (b) b.textContent = audioOn ? '🔊' : '🔇';
    });
    const mb = document.getElementById('muteBtn');
    if (mb) mb.textContent = audioOn ? '🔊 소리 켜짐' : '🔇 소리 꺼짐';
  }

  /* ─────────── 파티클 ─────────── */
  const parts = [];
  let fx, fctx, dpr = 1;
  function sizeFx() {
    fx = el.fx; fctx = fx.getContext('2d');
    dpr = Math.min(3, window.devicePixelRatio || 1);
    fx.width = Math.floor(innerWidth * dpr);
    fx.height = Math.floor(innerHeight * dpr);
    fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  addEventListener('resize', () => { sizeFx(); measureStage(); });

  function burst(x, y, colors, n) {
    const N = n || 22;
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2, sp = 90 + Math.random() * 380;
      parts.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 90,
        life: 0.42 + Math.random() * 0.34, max: 0.76,
        r: 2 + Math.random() * 4.2,
        c: colors[(Math.random() * colors.length) | 0]
      });
    }
    if (parts.length > 320) parts.splice(0, parts.length - 320);
  }
  function updateParticles(dt) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life -= dt;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vy += 980 * dt; p.vx *= (1 - 1.4 * dt);
    }
  }
  function drawFx() {
    if (!fctx) return;
    fctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of parts) {
      fctx.globalAlpha = Math.max(0, Math.min(1, p.life / p.max));
      fctx.fillStyle = p.c;
      fctx.beginPath();
      fctx.arc(p.x, p.y, p.r, 0, 6.284);
      fctx.fill();
    }
    fctx.globalAlpha = 1;
  }

  /* ─────────── 화면 전환 ─────────── */
  function show(name) {
    s.screen = name;
    ['home', 'game', 'result', 'deck'].forEach(k => {
      const sec = el[k];
      if (sec) sec.classList.toggle('on', k === name);
    });
  }

  /* ─────────── 홈 ─────────── */
  function refreshHome() {
    ['staff', 'word', 'term', 'custom'].forEach(m => {
      const b = document.getElementById('best-' + m);
      if (!b) return;
      if (m === 'custom') {
        const n = loadDeck().length;
        b.textContent = n ? n + '개' : '준비';
        b.classList.toggle('zero', !n);
      } else {
        const v = store.get('rm_best_' + m, 0) || 0;
        b.textContent = '최고 ' + v;
        b.classList.toggle('zero', !v);
      }
    });
    setMute(!audioOn);
  }

  /* ─────────── 무대 ─────────── */
  function measureStage() {
    const r = el.stage.getBoundingClientRect();
    s.stageH = r.height;
    s.hitY = r.height * 0.62;
  }

  function staffSVG(step) {
    const W = 214, H = 126, gap = 9, y0 = 96; // step 0 = E4 (첫째 줄)
    const y = y0 - step * gap;
    const lines = [96, 78, 60, 42, 24].map(ly =>
      `<line x1="42" y1="${ly}" x2="206" y2="${ly}" stroke="rgba(190,205,245,.42)" stroke-width="1.4"/>`).join('');
    const ledger = (step <= -2)
      ? `<line x1="132" y1="${y}" x2="168" y2="${y}" stroke="rgba(190,205,245,.6)" stroke-width="1.6"/>` : '';
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="오선지 음표">
      <text x="6" y="88" font-size="66" fill="rgba(190,205,245,.8)" font-family="'Noto Music','Bravura','Segoe UI Symbol',serif">𝄞</text>
      ${lines}${ledger}
      <ellipse cx="150" cy="${y}" rx="8" ry="5.8" fill="#5ee7ff" transform="rotate(-16 150 ${y})"/>
      <rect x="156.4" y="${y - 34}" width="2.6" height="34" rx="1.2" fill="#5ee7ff"/>
      <circle cx="176" cy="${y}" r="2.4" fill="#ffd166"/>
    </svg>`;
  }

  function buildQueue(mode) {
    const n = s.total, out = [];
    if (mode === 'staff') {
      let prev = -1;
      for (let i = 0; i < n; i++) {
        let k = (Math.random() * 7) | 0;
        if (k === prev) k = (k + 1 + ((Math.random() * 5) | 0)) % 7;
        prev = k;
        const note = NOTES[k];
        out.push({ kind: 'staff', prompt: null, answer: note.name, note });
      }
      return out;
    }
    const bank = mode === 'custom' ? loadDeck() : (mode === 'word' ? WORDS : TERMS);
    let pool = bank.slice().sort(() => Math.random() - 0.5);
    for (let i = 0; i < n; i++) {
      if (i > 0 && i % pool.length === 0) pool = bank.slice().sort(() => Math.random() - 0.5);
      const e = pool[i % pool.length];
      out.push({ kind: mode, prompt: e.word, answer: e.mean, bank });
    }
    return out;
  }

  function makeOptions(q) {
    if (q.kind === 'staff') return null;
    const set = [q.answer];
    const others = q.bank.filter(e => e.mean !== q.answer).sort(() => Math.random() - 0.5);
    for (const e of others) {
      if (set.length >= 4) break;
      if (!set.includes(e.mean)) set.push(e.mean);
    }
    while (set.length < 4) set.push('—');
    return set.sort(() => Math.random() - 0.5);
  }

  /* ─────────── 게임 시작 ─────────── */
  function startRun(mode) {
    if (mode === 'custom' && loadDeck().length < 4) { openDeck(true); return; }
    ensureAudio();
    stopAllAudio();
    parts.length = 0;
    s.mode = mode;
    s.running = true; s.paused = false;
    s.score = 0; s.combo = 0; s.maxCombo = 0; s.hearts = 3;
    s.correct = 0; s.wrong = 0; s.idx = 0;
    s.fever = false; s.feverEnd = 0;
    s.tile = null; s.wait = 0; s.review = [];
    s.gen++;
    s.queue = buildQueue(mode);
    s.bank = mode === 'custom' ? loadDeck() : null;

    el.modeChip.textContent = MODE_LABEL[mode];
    el.pauseOv.classList.remove('on');
    el.comboWrap.classList.remove('on');
    el.feverBadge.classList.remove('on');
    el.toast.classList.remove('on');
    buildAnswerArea(mode);
    show('game');
    measureStage();
    updateHud();
    nextQuestion();
  }

  function buildAnswerArea(mode) {
    const box = el.answers;
    box.innerHTML = '';
    box.className = 'answers';
    if (mode === 'staff') {
      box.classList.add('keys');
      NOTES.forEach(n => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'key';
        b.dataset.note = n.name;
        b.innerHTML = `<b>${n.name}</b><i>${n.letter}</i>`;
        b.addEventListener('click', () => answer(n.name, b));
        box.appendChild(b);
      });
    } else {
      box.classList.add('quiz');
      for (let i = 0; i < 4; i++) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'ans';
        b.dataset.i = i;
        b.addEventListener('click', () => answer(b.dataset.val, b));
        box.appendChild(b);
      }
    }
  }

  function resetAnswerClasses() {
    [...el.answers.children].forEach(b => b.classList.remove('ok', 'no', 'reveal', 'hit'));
  }

  function nextQuestion() {
    s.tile = null;
    if (s.idx >= s.total || s.hearts <= 0) { endRun(); return; }
    const q = s.queue[s.idx];
    s.idx++;
    const options = makeOptions(q);
    resetAnswerClasses();

    const t = el.tile;
    t.className = 'tile' + (q.kind === 'word' ? ' word' : q.kind === 'term' ? ' term' : q.kind === 'custom' ? ' word' : '');
    t.style.setProperty('--ty', '-999px');
    t.style.display = '';
    if (q.kind === 'staff') {
      el.tileBody.innerHTML = staffSVG(q.note.step) + `<div class="tile-hint">이 음표의 계이름은?</div>`;
    } else if (q.kind === 'word') {
      el.tileBody.innerHTML = `<div class="tile-q">${esc(q.prompt)}</div><div class="tile-hint">뜻을 고르세요</div>`;
    } else {
      const small = q.prompt.length > 8;
      el.tileBody.innerHTML = `<div class="tile-q${small ? ' small' : ''}">${esc(q.prompt)}</div><div class="tile-hint">뜻을 고르세요</div>`;
    }

    if (options) {
      [...el.answers.children].forEach((b, i) => {
        b.textContent = options[i];
        b.dataset.val = options[i];
        b.dataset.i = i;
      });
    }

    const h = t.offsetHeight || 150;
    s.tile = { q, options, y: -h - 12, h, vy: tileSpeed(), done: false, at: performance.now() };
    t.style.setProperty('--ty', s.tile.y + 'px');
    updateHud();
  }

  function tileSpeed() {
    const lv = 1 + Math.floor(s.correct / 4);
    return 142 + Math.min(lv, 10) * 15;
  }

  function esc(t) {
    return String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  function updateHud() {
    el.scoreEl.textContent = String(s.score);
    el.heartsEl.textContent = '❤'.repeat(Math.max(0, s.hearts)) + '♡'.repeat(Math.max(0, 3 - s.hearts));
    el.progTxt.textContent = Math.min(s.idx, s.total) + '/' + s.total;
    el.progFill.style.width = (Math.min(s.idx, s.total) / s.total * 100) + '%';
  }

  function showPop(text, color) {
    const p = el.pop;
    p.textContent = text;
    p.style.color = color;
    p.classList.remove('go');
    void p.offsetWidth;
    p.classList.add('go');
  }
  function showToast(text) {
    const t = el.toast;
    t.textContent = text;
    t.classList.add('on');
    clearTimeout(showToast._id);
    showToast._id = setTimeout(() => t.classList.remove('on'), 1500);
  }

  /* ─────────── 정답 판정 ─────────── */
  function answer(val, btn) {
    if (s.screen !== 'game' || s.paused) return;
    const tl = s.tile;
    if (!tl || tl.done) return;
    ensureAudio();
    const q = tl.q;
    tl.done = true;
    s.wait = 0.42;

    if (val === q.answer) {
      const d = Math.abs(tl.y + tl.h / 2 - s.hitY);
      const tier = d <= 22 ? 'PERFECT' : d <= 52 ? 'GREAT' : d <= 95 ? 'GOOD' : 'EARLY';
      const base = { PERFECT: 150, GREAT: 110, GOOD: 75, EARLY: 40 }[tier];
      const mult = s.fever ? 2 : 1;
      const gain = (base + Math.min(s.combo, 20) * 4) * mult;
      s.score += gain;
      s.combo++; s.correct++;
      if (s.combo > s.maxCombo) s.maxCombo = s.combo;

      if (btn) btn.classList.add('ok');
      sndCorrect(q.kind === 'staff' ? q.note.freq : 523.25);
      el.comboNum.textContent = String(s.combo);
      el.comboWrap.classList.add('on');
      showPop(tier + ' +' + gain, tier === 'PERFECT' ? '#5ef2a0' : tier === 'GREAT' ? '#5ee7ff' : '#ffd166');

      const r = el.tile.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2,
        ['#5ee7ff', '#5ef2a0', '#ffd166', '#ff7ad9'], s.fever ? 34 : 22);
      el.tile.style.setProperty('--ty', tl.y + 'px');
      el.tile.classList.add('gone');

      if (s.combo > 0 && s.combo % 10 === 0 && !s.fever) setFever(true);
    } else {
      s.hearts--; s.wrong++; s.combo = 0;
      s.review.push({ prompt: q.kind === 'staff' ? `음표 → ${q.answer}` : q.prompt, answer: q.answer });
      if (btn) btn.classList.add('no');
      [...el.answers.children].forEach(b => {
        if ((b.dataset.val || b.dataset.note) === q.answer) b.classList.add('reveal');
      });
      sndWrong();
      el.comboWrap.classList.remove('on');
      showPop('아쉬워요', '#ff8fa8');
      showToast('정답은 "' + q.answer + '"' + (q.kind === 'staff' ? ' (' + q.note.letter + ')' : ''));
      el.tile.classList.add('miss');
      s.wait = 0.85;
      if (s.fever) setFever(false);
    }
    updateHud();
  }

  function passQuestion() {
    const tl = s.tile;
    if (!tl || tl.done) return;
    tl.done = true;
    const q = tl.q;
    s.combo = 0; s.wrong++;
    s.review.push({ prompt: q.kind === 'staff' ? `음표 → ${q.answer}` : q.prompt, answer: q.answer });
    el.comboWrap.classList.remove('on');
    [...el.answers.children].forEach(b => {
      if ((b.dataset.val || b.dataset.note) === q.answer) b.classList.add('reveal');
    });
    sndPass();
    showToast('놓쳤어요 · 정답은 "' + q.answer + '"');
    el.tile.classList.add('miss');
    s.wait = 0.9;
    if (s.fever) setFever(false);
    updateHud();
  }

  function setFever(on) {
    s.fever = on;
    el.feverBadge.classList.toggle('on', on);
    if (on) { s.feverEnd = performance.now() + 8000; startMelody(); showPop('FEVER! 점수 ×2', '#ffd166'); }
    else { stopMelody(); }
  }

  /* ─────────── 루프 ─────────── */
  let last = 0;
  function loop(t) {
    requestAnimationFrame(loop);
    const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
    last = t;
    updateParticles(dt);
    drawFx();
    if (s.screen !== 'game') return;
    if (s.paused) return;
    if (s.fever && performance.now() > s.feverEnd) setFever(false);

    const tl = s.tile;
    if (!tl) return;
    if (tl.done) {
      s.wait -= dt;
      if (s.wait <= 0) {
        el.tile.classList.remove('gone', 'miss');
        nextQuestion();
      }
      return;
    }
    tl.y += tl.vy * dt;
    el.tile.style.setProperty('--ty', tl.y + 'px');
    const d = Math.abs(tl.y + tl.h / 2 - s.hitY);
    if (d < 26) el.tile.classList.add('warm'); else el.tile.classList.remove('warm');
    if (tl.y > s.hitY + 12) passQuestion();
  }

  /* ─────────── 결과 ─────────── */
  function endRun() {
    s.running = false;
    stopAllAudio();
    parts.length = 0;
    show('result');

    const answered = s.correct + s.wrong || 1;
    const acc = Math.round(s.correct / answered * 100);
    const bestKey = 'rm_best_' + s.mode;
    const best = store.get(bestKey, 0) || 0;
    const isBest = s.score > best;
    if (isBest) store.set(bestKey, s.score);

    const saved = store.get('rm_review_' + DAY, []) || [];
    const merged = saved.concat(s.review).slice(-60);
    store.set('rm_review_' + DAY, merged);

    $('#resMode').textContent = MODE_LABEL[s.mode];
    $('#resScore').textContent = String(s.score);
    $('#resAcc').textContent = acc + '%';
    $('#resCombo').textContent = String(s.maxCombo);
    $('#resCorrect').textContent = s.correct + '/' + s.total;
    $('#resBadge').classList.toggle('on', isBest && s.score > 0);

    const ul = el.reviewList;
    ul.innerHTML = '';
    el.reviewCount.textContent = s.review.length + '개';
    if (!s.review.length) {
      const li = document.createElement('li');
      li.className = 'empty';
      li.textContent = '틀린 문제가 없어요! 완벽해요 🎉';
      ul.appendChild(li);
    } else {
      s.review.slice(0, 40).forEach(r => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${esc(r.prompt)}</span><s>→ <b>${esc(r.answer)}</b></s>`;
        ul.appendChild(li);
      });
    }
    s.gen++;
  }

  /* ─────────── 내 암기장 ─────────── */
  function openDeck() {
    const deck = loadDeck();
    el.deckInput = document.getElementById('deckInput');
    el.deckInput.value = deck.length ? deck.map(e => e.word + ':' + e.mean).join('\n') : '';
    updateDeckCount();
    show('deck');
  }
  function updateDeckCount() {
    const n = parseDeck(document.getElementById('deckInput').value).length;
    const c = document.getElementById('deckCount');
    c.textContent = n + '줄';
    c.classList.toggle('ok', n >= 4);
  }

  /* ─────────── 이벤트 ─────────── */
  document.addEventListener('pointerdown', ensureAudio, { passive: true });

  document.querySelectorAll('.mode-card').forEach(card => {
    card.addEventListener('click', () => {
      ensureAudio();
      const m = card.dataset.mode;
      if (m === 'custom' && loadDeck().length < 4) { openDeck(false); return; }
      startRun(m);
    });
  });

  document.getElementById('muteBtn').addEventListener('click', () => setMute(audioOn));
  document.getElementById('muteBtn2').addEventListener('click', () => setMute(audioOn));
  document.getElementById('deckBtn').addEventListener('click', () => openDeck(false));
  document.getElementById('deckBack').addEventListener('click', () => { refreshHome(); show('home'); });
  document.getElementById('deckInput').addEventListener('input', updateDeckCount);
  document.getElementById('deckSample').addEventListener('click', () => {
    const inp = document.getElementById('deckInput');
    inp.value = inp.value.trim() ? inp.value + '\n' + SAMPLE : SAMPLE;
    updateDeckCount();
  });
  document.getElementById('deckSave').addEventListener('click', () => {
    const list = parseDeck(document.getElementById('deckInput').value);
    if (list.length < 4) { showToast('4줄 이상 적어 주세요'); return; }
    saveDeck(list);
    showToast('저장했어요 · ' + list.length + '개');
    refreshHome();
  });
  document.getElementById('deckPlay').addEventListener('click', () => {
    const list = parseDeck(document.getElementById('deckInput').value);
    if (list.length < 4) { showToast('4줄 이상 적어 주세요'); return; }
    saveDeck(list);
    startRun('custom');
  });

  document.getElementById('pauseBtn').addEventListener('click', () => {
    if (s.screen !== 'game' || s.paused) return;
    s.paused = true;
    stopAllAudio();
    $('#pauseScore').textContent = String(s.score);
    el.pauseOv.classList.add('on');
  });
  document.getElementById('resumeBtn').addEventListener('click', () => {
    s.paused = false;
    el.pauseOv.classList.remove('on');
    ensureAudio();
    if (s.fever) startMelody();
  });
  document.getElementById('restartBtn').addEventListener('click', () => {
    el.pauseOv.classList.remove('on');
    startRun(s.mode);
  });
  document.getElementById('quitBtn').addEventListener('click', () => {
    el.pauseOv.classList.remove('on');
    s.paused = false; s.running = false; s.tile = null;
    stopAllAudio(); parts.length = 0;
    refreshHome(); show('home');
  });
  document.getElementById('homeBtn').addEventListener('click', () => {
    s.running = false; s.paused = false; s.tile = null;
    stopAllAudio(); parts.length = 0;
    el.pauseOv.classList.remove('on');
    refreshHome(); show('home');
  });
  document.getElementById('againBtn').addEventListener('click', () => startRun(s.mode));
  document.getElementById('toHomeBtn').addEventListener('click', () => { refreshHome(); show('home'); });

  addEventListener('keydown', e => {
    if (e.key >= '1' && e.key <= '7' && s.screen === 'game' && !s.paused) {
      const b = el.answers.children[+e.key - 1];
      if (b) b.click();
    }
  });

  /* ─────────── 테스트 훅 ─────────── */
  window.RM = {
    version: '1.0.0',
    state() {
      return {
        screen: s.screen, mode: s.mode, score: s.score, combo: s.combo, maxCombo: s.maxCombo,
        hearts: s.hearts, idx: s.idx, total: s.total, correct: s.correct, wrong: s.wrong,
        paused: s.paused, fever: s.fever, particles: parts.length, audio: sources.size,
        muted: !audioOn, review: s.review.length, running: s.running, phase: document.visibilityState
      };
    },
    current() {
      if (!s.tile) return null;
      const q = s.tile.q;
      return {
        kind: q.kind, prompt: q.prompt, answer: q.answer,
        options: s.tile.options, y: s.tile.y, h: s.tile.h, hitY: s.hitY, done: s.tile.done
      };
    },
    deck() { return loadDeck(); },
    setTotal(n) { s.total = Math.max(1, n | 0); }
  };

  /* ─────────── 시작 ─────────── */
  sizeFx();
  refreshHome();
  show('home');
  requestAnimationFrame(loop);
})();
