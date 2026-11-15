/* Elina — экраны, ввод, эффекты, цикл. */
(function () {
  'use strict';
  const E = window.Elina, A = window.Art, B = window.ElinaBot;
  const W = E.W, H = E.H;
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');
  const params = new URLSearchParams(location.search);

  // ---------- звук ----------
  const Snd = (() => {
    let ac = null, muted = params.has('mute');
    const get = () => { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; } } return ac; };
    function tone(f, d, type, vol, slide) {
      const a = get(); if (!a || muted) return;
      const o = a.createOscillator(), g = a.createGain();
      o.type = type || 'sine'; o.frequency.setValueAtTime(f, a.currentTime);
      if (slide) o.frequency.exponentialRampToValueAtTime(f * slide, a.currentTime + d);
      g.gain.setValueAtTime(vol || 0.1, a.currentTime); g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + d);
      o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + d);
    }
    return {
      unlock() { const a = get(); if (a && a.state === 'suspended') a.resume(); },
      coin() { tone(988, 0.08, 'square', 0.04); setTimeout(() => tone(1319, 0.16, 'square', 0.04), 70); },
      click() { tone(660, 0.06, 'triangle', 0.08); },
      ready() { tone(1047, 0.12, 'sine', 0.1); },
      bad() { tone(220, 0.16, 'sawtooth', 0.04, 0.7); },
      angry() { tone(320, 0.32, 'sawtooth', 0.05, 0.5); },
      boost() { tone(400, 0.3, 'triangle', 0.08, 2.5); },
      win() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.22, 'triangle', 0.1), i * 120)); },
      lose() { [392, 330, 262].forEach((f, i) => setTimeout(() => tone(f, 0.26, 'triangle', 0.1), i * 160)); },
      toggle() { muted = !muted; return muted; },
      get muted() { return muted; },
    };
  })();

  // ---------- сохранение ----------
  const SAVE_KEY = 'elina-save-v1';
  function loadSave() {
    const def = { level: 1, wallet: 0, upg: {}, stars: {} };
    try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); return s ? Object.assign(def, s) : def; } catch (e) { return def; }
  }
  function writeSave() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* приватный режим */ } }
  let save = loadSave();

  // ---------- холст ----------
  // Логический экран VW×VH: сцена 1230×1280 по центру; на высоком экране зал растягивается,
  // HUD прижат к краям, кухня и панель блюд — к низу.
  let scale = 1;
  let VW = W, VH = H, OX = 0, EXT = 0, KY = 1, TOP = 0, BOT = 0;
  let KO = 0; // смещение кухни/нижней панели на экране
  function WY(y) { return y + TOP; }
  function gameExt() { return Math.max(0, EXT - TOP); }
  function MY(y) { return y < 262 ? y + TOP : y < 740 ? TOP + 262 + (y - 262) * KY : y + EXT; }
  const geo = { VW, VH, ox: 0, ext: 0, top: 0, MY };
  function resize() {
    const vw = Math.max(1, window.innerWidth), vh = Math.max(1, window.innerHeight);
    if (vh / vw > H / W) { VW = W; VH = W * vh / vw; } else { VH = H; VW = H * vw / vh; }
    const cs = getComputedStyle(document.documentElement);
    TOP = (parseFloat(cs.getPropertyValue('--sat')) || 0) * VW / vw;
    BOT = (parseFloat(cs.getPropertyValue('--sab')) || 0) * VW / vw;
    if (VH - H - BOT < TOP) { TOP = 0; BOT = 0; }
    OX = (VW - W) / 2;
    EXT = VH - H - BOT;
    KY = (478 + EXT - TOP) / 478;
    Object.assign(geo, { VW, VH, ox: OX, ext: EXT, top: TOP });
    KO = EXT;
    cv.style.width = vw + 'px';
    cv.style.height = vh + 'px';
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(vw * dpr);
    cv.height = Math.round(vh * dpr);
    scale = cv.width / VW;
    layers = {};
  }
  window.addEventListener('resize', resize);

  let layers = {};
  let fontsOk = false;
  function layer(name, menu, fn) {
    const key = name + '|' + menu.join(',') + '|' + fontsOk + '|' + scale.toFixed(4) + '|' + VW.toFixed(1) + 'x' + VH.toFixed(1) + '|' + TOP.toFixed(1) + '|' + geo.ext.toFixed(1);
    if (layers[name] && layers[name].key === key) return layers[name].cv;
    const off = document.createElement('canvas');
    off.width = cv.width; off.height = cv.height;
    const c = off.getContext('2d');
    c.setTransform(scale, 0, 0, scale, 0, 0);
    fn(c, VW, VH, menu, geo);
    layers[name] = { key, cv: off };
    return off;
  }
  if (document.fonts && document.fonts.load) {
    Promise.all([document.fonts.load('400 80px "Pacifico"'), document.fonts.load('900 40px "Nunito"'), document.fonts.load('800 20px "Nunito"')])
      .then(() => { fontsOk = true; layers = {}; }).catch(() => { fontsOk = true; });
  }

  // ---------- состояние ----------
  let screen = 'title';
  let game = null;          // текущая партия
  let bgGame = null;        // фоновая партия на титульном экране (играет бот)
  let bgBot = null;
  let autoBot = params.get('bot') ? new B.Bot(params.get('bot'), 5) : null;
  let time = 0, last = 0;
  let fx = [];
  let ui = [];
  let flash = {};
  let toast = null;
  let pointer = { x: -1, y: -1 };
  let popAt = new Map();
  let coinBump = 0;
  let demoFreeze = false, demoBadge = false;
  let speed = +(params.get('speed') || 1);

  function newGame(n) {
    return new E.Game({ level: n, upgrades: save.upg, seed: (Math.random() * 1e9) | 0, ext: gameExt() });
  }
  function startTitle() {
    screen = 'title';
    bgGame = new E.Game({ level: 3, seed: (Math.random() * 1e9) | 0, upgrades: { stove: 1 }, ext: gameExt() });
    bgBot = new B.Bot('pro', 3);
    game = null;
  }
  function openIntro(n) { game = newGame(n); fx = []; popAt.clear(); screen = 'intro'; }
  function startPlay() { screen = 'play'; Snd.click(); }

  // ---------- демо-кадр как на референсе ----------
  function setupDemo() {
    const g = new E.Game({ level: 3, seed: 42, upgrades: { stove: 1 }, ext: gameExt() });
    g.maxCooking = 4; demoBadge = true;
    const T = g.tables;
    const mk = (id, kind, tb, state, order, extra) => {
      const s = E.seatOf(T[tb]);
      const c = Object.assign({ id, kind, x: s.x, y: s.y, face: 1, state, orig: order.slice(), order: order.slice(), pmax: 30, patience: 24,
        table: tb, timer: 2, mood: 'ok', anim: id, walking: false, qwait: 20 }, extra || {});
      T[tb].cust = id; return c;
    };
    g.customers = [
      mk(1, 1, 0, 'eat', ['burger']),
      mk(2, 2, 1, 'order', ['burger'], { patience: 25 }),
      mk(3, 3, 2, 'order', ['pizza'], { patience: 21 }),
      mk(4, 4, 3, 'eat', ['pizza']),
      { id: 5, kind: 0, x: 238, y: 296, face: 1, state: 'queue', orig: ['burger'], order: ['burger'], pmax: 30, patience: 30, table: -1, timer: 0, mood: 'ok', anim: 5, walking: true, qwait: 24 },
    ];
    T[0].plates = ['burger']; T[1].plates = ['burger']; T[2].plates = ['pizza']; T[3].plates = ['pizza'];
    g.chef.x = 690; g.chef.y = 650 + g.ext * 0.6; g.chef.hands = ['burger']; g.chef.walking = true; g.chef.face = 1; g.chef.anim = 0.2;
    g.chef.tasks = [];
    g.pass = ['burger'];
    g.cooking = [{ dish: 'burger', t: 2, total: 5, station: 'pan' }, { dish: 'pizza', t: 2.8, total: 7, station: 'board' }, { dish: 'coffee', t: 1.2, total: 3, station: 'coffee' }];
    g.coins = 125;
    g.si = g.schedule.length;
    game = g; screen = 'play'; demoFreeze = !params.has('live');
  }

  // ---------- события игры → эффекты ----------
  function addFx(o) { fx.push(Object.assign({ t: 0, life: 1.2, vx: 0, vy: -40 }, o)); }
  function handleEvents(g, quiet) {
    for (const ev of g.events) {
      if (quiet) continue;
      switch (ev.type) {
        case 'coins':
          { const fy = WY(ev.y + 140) - 140 + SEAT_DROP;
          addFx({ kind: 'coins', x: ev.x, y: fy, text: '+' + ev.amount, life: 1.6, vy: -55 });
          for (let i = 0; i < 5; i++) addFx({ kind: 'coin', x: ev.x, y: fy, tx: 70 - OX, ty: 57 + TOP, life: 0.8 + i * 0.08, delay: i * 0.06 }); }
          Snd.coin(); break;
        case 'angry':
          addFx({ kind: 'text', x: ev.x, y: WY(ev.y + 130) - 130, text: 'Не дождался…', color: '#E53935', life: 1.6, vy: -30 }); Snd.angry(); break;
        case 'ready': {
          const p = E.PASS_SLOTS[Math.min(ev.slot, E.PASS_SLOTS.length - 1)];
          for (let i = 0; i < 6; i++) addFx({ kind: 'spark', x: p.x, y: p.y + KO - 30, vx: (Math.random() - 0.5) * 160, vy: -60 - Math.random() * 100, life: 0.7 });
          Snd.ready(); break;
        }
        case 'serve':
          for (let i = 0; i < 3; i++) addFx({ kind: 'heart', x: ev.x + (i - 1) * 26, y: WY(ev.y + 30) - 40, vy: -50 - i * 10, life: 1.1 });
          break;
        case 'reject':
          if (ev.what === 'cook') { flash[ev.dish] = 1; showToast(game && game.L.menu.indexOf(ev.dish) >= 0 ? 'Все конфорки заняты!' : 'Этого нет в меню'); }
          else if (ev.what === 'serve') showToast('Сначала приготовь это блюдо!');
          else if (ev.what === 'discard') showToast('Это блюдо уже кто-то ждёт');
          Snd.bad(); break;
        case 'queued': Snd.click(); break;
        case 'boost': for (let i = 0; i < 8; i++) addFx({ kind: 'dust', x: g.chef.x, y: WY(g.chef.y), vx: (Math.random() - 0.5) * 200, vy: -Math.random() * 60, life: 0.6 }); Snd.boost(); break;
        case 'order': popAt.set(ev.id, time); break;
        case 'cancel': showToast('Розовый нос отменил приказы'); break;
        case 'discard': { const p = E.PASS_SLOTS[Math.min(ev.slot, E.PASS_SLOTS.length - 1)]; for (let i = 0; i < 6; i++) addFx({ kind: 'dust', x: p.x, y: p.y + KO - 20, vx: (Math.random() - 0.5) * 160, vy: -Math.random() * 120, life: 0.6 }); showToast('Блюдо выброшено'); Snd.bad(); break; }
      }
    }
    g.events.length = 0;
  }
  function showToast(s) { toast = { text: s, t: 0 }; }

  // ---------- ввод ----------
  function toLogical(e) {
    const r = cv.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width * VW, y: (e.clientY - r.top) / r.height * VH };
  }
  cv.addEventListener('pointermove', (e) => { pointer = toLogical(e); });
  cv.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    Snd.unlock();
    const p = toLogical(e); pointer = p;
    for (let i = ui.length - 1; i >= 0; i--) {
      const b = ui[i];
      if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) { b.act(); return; }
    }
    if (screen === 'play' && game && !demoFreeze) worldClick(p.x, p.y);
  });
  window.addEventListener('keydown', (e) => {
    if (screen === 'play' && game) {
      const k = parseInt(e.key, 10);
      if (k >= 1 && k <= game.L.menu.length) { game.cmdCook(game.L.menu[k - 1]); return; }
      if (e.code === 'Space') { e.preventDefault(); game.boost(); return; }
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'з') { screen = 'pause'; return; }
    } else if (screen === 'pause' && (e.key === 'Escape' || e.key === 'p')) { screen = 'play'; return; }
    if (e.key === 'm' || e.key === 'ь') Snd.toggle();
  });

  const STATION_HIT = [
    { st: 'pan', x: 100, y: 925, w: 170, h: 110 },
    { st: 'pot', x: 315, y: 915, w: 160, h: 115 },
    { st: 'board', x: 510, y: 920, w: 185, h: 112 },
    { st: 'greens', x: 60, y: 778, w: 476, h: 76 },
    { st: 'coffee', x: 836, y: 712, w: 74, h: 104 },
  ];
  // попадание по гостю/столу в экранных координатах (x уже без OX)
  function hitCustomer(g, cu, x, y) {
    const tb = g.tables[cu.table];
    const ts = (tb && tb.s) || 1;
    const sy = WY(cu.y) + SEAT_DROP * ts;
    const k = custK(g, cu);
    const onBody = Math.hypot(x - cu.x, y - (sy - 70 * k)) < 78 * k;
    const onBubble = Math.hypot(x - (cu.x + 70 * k), y - (sy - 180 * k)) < 56;
    const onTable = tb && ((x - tb.x) ** 2) / (125 * 125 * ts * ts) + ((y - WY(tb.y)) ** 2) / (62 * 62 * ts * ts) < 1;
    return onBody || onBubble || onTable;
  }
  function worldClick(px, py) {
    const g = game, x = px - OX, y = py;
    // Розовый нос — отменить приказы
    if (Math.hypot(x - g.chef.x, y - (WY(g.chef.y) - 110)) < 62 && (g.chef.tasks.length || g.chef.cur)) { g.cmdCancel(); return; }
    // блюдо на раздаче — выбросить лишнее
    for (let i = g.pass.length - 1; i >= 0; i--) {
      const p = E.PASS_SLOTS[i];
      if (Math.hypot(x - p.x, y - (p.y + KO - 16)) < 36) { g.cmdDiscard(i); return; }
    }
    // гости
    const order = g.customers.filter((c) => c.state === 'order').sort((a, b) => b.y - a.y);
    for (const c of order) if (hitCustomer(g, c, x, y)) { g.cmdServe(c.id); return; }
    // станции кухни
    for (const st of STATION_HIT) {
      if (x >= st.x && x <= st.x + st.w && y >= st.y + KO && y <= st.y + KO + st.h) {
        const d = g.L.menu.find((m) => E.DISHES[m].station === st.st);
        if (d) { g.cmdCook(d); return; }
      }
    }
  }

  // ---------- отрисовка мира ----------
  function lookOf(c) { return A.LOOKS[c.kind % A.LOOKS.length]; }
  function drawWorld(c, g, interactive) {
    KO = TOP + g.ext; geo.ext = EXT;
    c.drawImage(layer('back', g.L.menu, A.drawBackLayer), 0, 0, VW, VH);
    c.save(); c.translate(OX, 0);
    // хайлайт под курсором
    let hoverId = 0;
    if (interactive) {
      for (const cu of g.customers) if (cu.state === 'order' && hitCustomer(g, cu, pointer.x - OX, pointer.y)) hoverId = cu.id;
    }
    const items = [];
    for (const tb of g.tables) {
      const tt = { x: tb.x, y: WY(tb.y), s: tb.s || 1 };
      items.push({ k: tt.y - 50 * tt.s, f: () => A.tableBackChairs(c, tt) });
      const hl = tb.cust && tb.cust === hoverId ? 0.55 + 0.35 * Math.sin(time * 8) : 0;
      items.push({ k: tt.y, f: () => A.tableTop(c, tt, tb.plates, hl) });
      items.push({ k: tt.y + 50 * tt.s, f: () => A.tableFrontChairs(c, tt) });
    }
    for (const cu of g.customers) {
      cu._ts = cu.table >= 0 ? (g.tables[cu.table].s || 1) : 1;
      cu._k = custK(g, cu);
      items.push({ k: WY(cu.y), f: () => drawCustomer(c, cu) });
      if (isSeated(cu) && cu.table >= 0) {
        const tb = g.tables[cu.table];
        items.push({ k: WY(tb.y) + 1, f: () => { c.save(); c.translate(cu.x, WY(tb.y) - 34 * (tb.s || 1)); c.scale(tb.s || 1, tb.s || 1); A.pawsOnTable(c, 0, 0, lookOf(cu).fur); c.restore(); } });
      }
    }
    const ch = g.chef;
    items.push({ k: WY(ch.y), f: () => drawChef(c, g) });
    items.sort((a, b) => a.k - b.k);
    for (const it of items) it.f();
    c.restore();

    KO = TOP + g.ext; geo.ext = KO;
    c.drawImage(layer('front', g.L.menu, A.drawFrontLayer), 0, 0, VW, VH);
    c.drawImage(layer('vig', [], A.vignette), 0, 0, VW, VH);
    c.save(); c.translate(OX, KO);
    A.drawStationFx(c, g, time);
    A.drawPass(c, g);
    c.restore();
    c.save(); c.translate(OX, 0);

    // облачка поверх всего
    const coming = new Set(g.allTasks().filter((t) => t.type === 'serve').map((t) => t.cid));
    const bubbles = g.customers.slice().sort((a, b) => a.y - b.y);
    for (const cu of bubbles) {
      const k = cu._k || 1;
      const bx = cu.x + 70 * k, by = WY(cu.y) - 176 * k + (isSeated(cu) ? (SEAT_DROP - 4) * (cu._ts || 1) : 0);
      const since = popAt.has(cu.id) ? time - popAt.get(cu.id) : 1;
      const pop = since < 0.35 ? easeBack(since / 0.35) : 1;
      if (cu.state === 'order') A.bubble(c, bx, by, cu.order, cu.patience / cu.pmax, { pop, time, coming: coming.has(cu.id) });
      else if (cu.state === 'queue') A.bubble(c, bx, by, cu.orig, cu.qwait / (cu.pmax * 0.85), { time });
      else if (cu.state === 'eat') A.bubble(c, bx, by, [], null, { heart: true });
      else if (cu.state === 'leave' && cu.mood === 'angry') A.bubble(c, bx, by + 20, [], null, { angry: true });
    }
    // очередь приказов над поваром
    const tasks = g.allTasks();
    if (tasks.length) {
      const n = Math.min(tasks.length, 5), x0 = ch.x - (n - 1) * 19;
      for (let i = 0; i < n; i++) {
        const t = tasks[i], x = x0 + i * 38, y = WY(ch.y) - 262;
        A.circ(c, x, y, 18); A.fs(c, '#FFFFFF', t.type === 'cook' ? '#F29A1B' : '#7CC242', 4);
        A.drawFood(c, t.type === 'cook' ? t.dish : (t.bring[0] || 'burger'), x, y + 2, 0.22);
      }
    }
    c.restore();
  }
  function easeBack(t) { const s = 1.7; t -= 1; return t * t * ((s + 1) * t + s) + 1; }

  const SEAT_DROP = 26;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function charScale(g) { let m = 0; for (const t of g.tables) m += t.s || 1; return clamp(m / g.tables.length, 0.9, 1.35); }
  function custK(g, cu) { const tb = cu.table >= 0 ? g.tables[cu.table] : null; return tb && isSeated(cu) ? clamp(tb.s || 1, 0.9, 1.45) : charScale(g); }
  function isSeated(cu) { return cu.state === 'think' || cu.state === 'order' || cu.state === 'eat'; }
  function drawCustomer(c, cu) {
    const seated = isSeated(cu);
    let expr = 'smile';
    if (cu.state === 'eat') expr = 'eat';
    else if (cu.state === 'order' && cu.patience / cu.pmax < 0.25) expr = 'angry';
    else if (cu.state === 'leave') expr = cu.mood === 'angry' ? 'angry' : 'happy';
    else if (cu.state === 'queue' && cu.qwait / (cu.pmax * 0.85) < 0.25) expr = 'angry';
    let alpha = 1;
    if (cu.state === 'leave') { const d = Math.hypot(cu.x - E.DOOR.x, cu.y - E.DOOR.y); alpha = Math.min(1, d / 50); }
    c.save(); c.globalAlpha = alpha;
    let shake = 0;
    if (expr === 'angry' && cu.state === 'order') shake = Math.sin(time * 40) * 2;
    const sc = 0.82 * (cu._k || 1);
    A.drawHamster(c, cu.x + shake, WY(cu.y) + (seated ? SEAT_DROP * (cu._ts || 1) : 0), sc, lookOf(cu), { walk: cu.walking, phase: cu.anim, expr, seated, face: cu.face || 1 });
    c.restore();
  }

  function drawChef(c, g) {
    const ch0 = g.chef;
    const ch = { x: ch0.x, y: WY(ch0.y), face: ch0.face, walking: ch0.walking, boostT: ch0.boostT, anim: ch0.anim, hands: ch0.hands, working: ch0.working };
    if (ch.walking) {
      // линии скорости (как на референсе)
      c.save();
      c.strokeStyle = ch.boostT > 0 ? 'rgba(255,200,60,0.9)' : 'rgba(255,255,255,0.9)'; c.lineWidth = 4; c.lineCap = 'round';
      const dir = -(ch.face || 1);
      for (let i = 0; i < 3; i++) {
        const y = ch.y - 50 - i * 20, o = ((time * 4 + i * 0.3) % 1) * 12;
        c.beginPath(); c.moveTo(ch.x + dir * (70 + o + i * 6), y); c.lineTo(ch.x + dir * (120 + o + i * 10), y - 8 * (1 - i * 0.3)); c.stroke();
      }
      c.restore();
    }
    let expr = 'smile';
    if (ch.boostT > 0 && ch.walking) expr = 'happy';
    const cs = charScale(g);
    A.drawHamster(c, ch.x, ch.y, cs, A.CHEF, { walk: ch.walking, phase: ch.anim, expr, hold: ch.hands, face: ch.face || 1 });
    if (ch.working) {
      for (let i = 0; i < 2; i++) A.star4(c, ch.x + 50 * (i ? 1 : -1), ch.y - 150 - Math.abs(Math.sin(time * 8 + i)) * 16, 8, '#FFE066');
    }
  }

  // ---------- HUD ----------
  function upgradeAffordable() {
    return E.UPGRADES.some((u) => (save.upg[u.id] || 0) < u.max && save.wallet >= u.cost[save.upg[u.id] || 0]);
  }
  let uiOff = { x: 0, y: 0 };
  function pushUI(x, y, w, h, act) { ui.push({ x: x + uiOff.x, y: y + uiOff.y, w, h, act }); }
  function drawHud(c, g, interactive) {
    // верх: монеты слева, таймер и пауза справа
    c.save(); c.translate(0, TOP);
    if (coinBump > 0) { c.translate(168, 57); c.scale(1 + coinBump * 0.12, 1 + coinBump * 0.12); c.translate(-168, -57); }
    A.hudCoins(c, g.coins, screen === 'title' ? 0 : g.L.goal);
    c.restore();
    c.save(); c.translate(VW - W, TOP);
    A.hudTimer(c, g.timeLeft, time);
    A.hudPause(c, screen === 'pause');
    c.restore();
    // низ: колпак слева, блюда по центру, кроссовок справа
    c.save(); c.translate(OX, KO);
    const boxes = A.hudDishBar(c, g, time, flash);
    c.restore();
    c.save(); c.translate(0, KO); A.hudChefBtn(c, demoBadge || upgradeAffordable(), time); c.restore();
    c.save(); c.translate(VW - W, KO); A.hudBoostBtn(c, g.chef.boostT, g.chef.boostCd, time); c.restore();
    if (!interactive) return;
    uiOff = { x: VW - W, y: TOP }; pushUI(1140, 22, 76, 70, () => { screen = 'pause'; Snd.click(); });
    uiOff = { x: 0, y: TOP }; pushUI(238, 30, 60, 56, () => openShop());
    uiOff = { x: 0, y: KO }; pushUI(34, 1098, 142, 142, () => openShop());
    uiOff = { x: VW - W, y: KO }; pushUI(1046, 1094, 152, 152, () => g.boost());
    uiOff = { x: OX, y: KO }; for (const b of boxes) pushUI(b.x, b.y, b.w, b.h, () => g.cmdCook(b.dish));
    uiOff = { x: 0, y: 0 };
  }

  // ---------- оверлеи ----------
  function dim(c, a) { c.save(); c.setTransform(scale, 0, 0, scale, 0, 0); c.fillStyle = `rgba(60,30,12,${a})`; c.fillRect(0, 0, VW, VH); c.restore(); }
  function btn(c, x, y, w, h, label, color, act) {
    const px = pointer.x - uiOff.x, py = pointer.y - uiOff.y;
    const hover = px >= x && px <= x + w && py >= y && py <= y + h;
    A.button(c, x, y, w, h, label, color, hover);
    pushUI(x, y, w, h, () => { Snd.click(); act(); });
  }

  function drawTitle(c) {
    dim(c, 0.35);
    A.panel(c, 215, 330, 800, 600, null);
    // вывеска крупно
    c.save(); c.translate(615, 455); c.scale(1.45, 1.45); c.translate(-620, -108);
    c.restore();
    c.save();
    c.font = `400 120px "Pacifico", "Segoe Script", cursive`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineWidth = 14; c.strokeStyle = '#7B3F1F'; c.lineJoin = 'round'; c.strokeText('Elina', 615, 440);
    c.fillStyle = A.lg(c, 0, 380, 0, 500, [[0, '#FFFFFF'], [1, '#FFE2C2']]); c.fillText('Elina', 615, 440);
    c.restore();
    A.drawChefHat(c, 615, 362, 0.9);
    A.text(c, 'Ресторан для хомячков', 615, 525, 34, '#7B3F1F');
    A.drawHamster(c, 365, 780, 1.05, A.CHEF, { phase: time, expr: 'happy', hold: ['burger'] });
    A.text(c, 'Повар «Розовый нос» готовит', 720, 600, 25, '#4A2C1A', { weight: 800 });
    A.text(c, 'и разносит еду гостям.', 720, 634, 25, '#4A2C1A', { weight: 800 });
    A.text(c, 'Успей накормить всех!', 720, 668, 25, '#4A2C1A', { weight: 800 });
    btn(c, 560, 715, 330, 92, save.level > 1 ? `Играть · день ${save.level}` : 'Играть', 'green', () => openIntro(save.level));
    btn(c, 560, 822, 160, 70, 'Кухня', 'orange', () => openShop());
    btn(c, 730, 822, 160, 70, Snd.muted ? 'Звук: нет' : 'Звук: да', 'gray', () => Snd.toggle());
    A.text(c, 'Клик по блюду внизу — готовить · клик по гостю — отнести', 615, 960, 22, '#FFF4E3', { weight: 800, stroke: 'rgba(60,30,12,0.7)', lw: 6 });
    A.text(c, 'Клавиши 1–6 — блюда · Пробел — ускорение · Esc — пауза', 615, 994, 20, '#FFF4E3', { weight: 800, stroke: 'rgba(60,30,12,0.7)', lw: 6 });
  }

  function drawIntro(c, g) {
    dim(c, 0.45);
    A.panel(c, 245, 330, 740, 580, `День ${g.n}`);
    const prev = g.n > 1 ? E.levelConfig(g.n - 1) : { menu: [], tables: 0 };
    const newDishes = g.L.menu.filter((d) => prev.menu.indexOf(d) < 0);
    A.coinIcon(c, 470, 430, 34);
    A.text(c, `Заработай ${g.L.goal} монет`, 660, 432, 36, '#4A2C1A');
    A.text(c, `Столиков: ${g.L.tables}   ·   Время: ${Math.floor(g.L.dur / 60)}:${String(g.L.dur % 60).padStart(2, '0')}`, 615, 492, 26, '#7B4A2A', { weight: 800 });
    if (newDishes.length) {
      A.text(c, newDishes.length > 1 || g.n === 1 ? 'Меню:' : 'Новое блюдо!', 615, 560, 30, '#E0473C');
      newDishes.forEach((d, i) => {
        const x = 615 + (i - (newDishes.length - 1) / 2) * 170;
        A.rr(c, x - 70, 590, 140, 150, 26); A.fs(c, '#FFFFFF', '#F0D3B0', 3);
        A.drawFood(c, d, x, 650, 0.9);
        A.text(c, E.DISHES[d].name, x, 718, 24, '#4A2C1A');
      });
    } else {
      A.text(c, 'Гостей будет больше!', 615, 600, 32, '#E0473C');
      g.L.menu.forEach((d, i) => A.drawFood(c, d, 615 + (i - (g.L.menu.length - 1) / 2) * 90, 680, 0.6));
    }
    btn(c, 455, 780, 320, 92, 'Начать!', 'green', startPlay);
  }

  function drawPause(c) {
    dim(c, 0.45);
    A.panel(c, 365, 400, 500, 470, 'Пауза');
    btn(c, 445, 470, 340, 86, 'Продолжить', 'green', () => { screen = 'play'; });
    btn(c, 445, 575, 340, 86, 'Заново', 'orange', () => openIntro(game.n));
    btn(c, 445, 680, 340, 86, 'В меню', 'gray', () => startTitle());
    A.text(c, Snd.muted ? 'Звук выключен (M)' : 'Звук включён (M)', 615, 810, 22, '#7B4A2A', { weight: 800 });
  }

  let resultAnim = 0;
  function drawResult(c, g) {
    const r = g.result;
    dim(c, 0.5);
    A.panel(c, 245, 300, 740, 640, r.win ? 'День окончен!' : 'Не хватило…');
    for (let i = 0; i < 3; i++) {
      const on = i < r.stars && resultAnim > 0.3 + i * 0.35;
      const s = on ? Math.min(1, (resultAnim - 0.3 - i * 0.35) * 5) : 1;
      c.save(); c.translate(495 + i * 120, 410 - (i === 1 ? 20 : 0)); c.scale(0.6 + 0.4 * s, 0.6 + 0.4 * s);
      A.starShape(c, 0, 0, i === 1 ? 54 : 46, on); c.restore();
    }
    A.coinIcon(c, 470, 520, 34);
    A.text(c, `${r.coins} / ${r.goal}`, 640, 522, 44, '#4A2C1A');
    A.text(c, `Накормлено гостей: ${r.served}`, 615, 590, 28, '#3F8A23', { weight: 800 });
    A.text(c, `Ушли голодными: ${r.lost}`, 615, 630, 28, r.lost ? '#E0473C' : '#7B4A2A', { weight: 800 });
    A.text(c, `В копилке: ${save.wallet} монет`, 615, 676, 24, '#7B4A2A', { weight: 800 });
    if (r.win) {
      btn(c, 425, 720, 380, 90, `Дальше · день ${g.n + 1}`, 'green', () => openIntro(g.n + 1));
      btn(c, 425, 825, 180, 72, 'Ещё раз', 'orange', () => openIntro(g.n));
      btn(c, 625, 825, 180, 72, 'Кухня', 'gray', () => openShop());
    } else {
      btn(c, 425, 720, 380, 90, 'Попробовать снова', 'green', () => openIntro(g.n));
      btn(c, 425, 825, 180, 72, 'Кухня', 'orange', () => openShop());
      btn(c, 625, 825, 180, 72, 'Меню', 'gray', () => startTitle());
    }
  }

  let shopReturn = 'title';
  function openShop() { if (screen !== 'shop') shopReturn = screen; screen = 'shop'; Snd.click(); }
  function drawShop(c) {
    dim(c, 0.5);
    A.panel(c, 165, 210, 900, 860, 'Кухня');
    A.coinIcon(c, 520, 290, 28);
    A.text(c, `${save.wallet}`, 600, 292, 40, '#4A2C1A', { align: 'left' });
    E.UPGRADES.forEach((u, i) => {
      const y = 340 + i * 120, lv = save.upg[u.id] || 0, maxed = lv >= u.max;
      A.rr(c, 205, y, 820, 104, 24); A.fs(c, '#FFFFFF', '#F0D3B0', 3);
      shopIcon(c, u.id, 265, y + 52);
      A.text(c, u.name, 325, y + 34, 30, '#4A2C1A', { align: 'left' });
      A.text(c, u.desc, 325, y + 70, 21, '#7B4A2A', { align: 'left', weight: 700 });
      for (let k = 0; k < u.max; k++) { A.circ(c, 700 + k * 26, y + 52, 9); A.fs(c, k < lv ? '#7CC242' : '#E9DCCB', '#C9B6A0', 2); }
      if (maxed) A.text(c, 'Макс.', 900, y + 52, 28, '#3F8A23');
      else {
        const cost = u.cost[lv], ok = save.wallet >= cost;
        btn(c, 815, y + 18, 180, 68, `${cost} 🪙`.replace(' 🪙', ''), ok ? 'green' : 'gray', () => {
          if (save.wallet >= cost) { save.wallet -= cost; save.upg[u.id] = lv + 1; writeSave(); Snd.coin(); }
          else { Snd.bad(); showToast('Не хватает монет'); }
        });
        A.coinIcon(c, 845, y + 52, 15);
      }
    });
    A.text(c, 'Улучшения действуют со следующего дня', 615, 960, 22, '#7B4A2A', { weight: 800 });
    btn(c, 455, 985, 320, 74, 'Готово', 'orange', () => { screen = shopReturn; });
  }
  function shopIcon(c, id, x, y) {
    A.circ(c, x, y, 36); A.fs(c, '#FFF3E2', '#F0D3B0', 3);
    if (id === 'cook') { c.save(); c.translate(x, y); c.rotate(-0.7); A.rr(c, -6, -30, 12, 36, 4); A.fs(c, '#D5D9E0', '#6b3f26', 2.5); A.rr(c, -7, 4, 14, 26, 5); A.fs(c, '#8B4E2B', '#6b3f26', 2.5); c.restore(); }
    else if (id === 'stove') { A.ell(c, x, y + 4, 26, 16); A.fs(c, '#2E3138', '#6b3f26', 3); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; A.circ(c, x + Math.cos(a) * 20, y + 4 + Math.sin(a) * 11, 4); A.fs(c, '#FF8A1A'); } }
    else if (id === 'shoes') { c.save(); c.translate(x, y + 4); c.scale(0.5, 0.5); c.beginPath(); c.moveTo(-42, 14); c.quadraticCurveTo(-44, -16, -26, -22); c.lineTo(-6, -24); c.quadraticCurveTo(4, -6, 22, -2); c.quadraticCurveTo(46, 2, 48, 18); c.closePath(); A.fs(c, '#3D7BE0', '#1F3F78', 4); A.rr(c, -46, 12, 98, 14, 7); A.fs(c, '#FFFFFF', '#1F3F78', 3); c.restore(); }
    else if (id === 'patience') A.heart(c, x, y, 20);
    else if (id === 'tray') { A.drawPlate(c, x - 8, y + 10, 0.5, 'burger'); A.drawPlate(c, x + 10, y - 2, 0.45, 'coffee'); }
  }

  // ---------- эффекты ----------
  function updateFx(dt) {
    for (const f of fx) {
      if (f.delay > 0) { f.delay -= dt; continue; }
      f.t += dt;
      if (f.kind === 'coin') continue;
      f.x += f.vx * dt; f.y += f.vy * dt;
      if (f.kind === 'spark' || f.kind === 'dust') f.vy += 300 * dt;
    }
    const before = fx.length;
    fx = fx.filter((f) => {
      if (f.t < f.life) return true;
      if (f.kind === 'coin') coinBump = 1;
      return false;
    });
    if (before !== fx.length) { /* ok */ }
    coinBump = Math.max(0, coinBump - dt * 4);
    for (const k in flash) flash[k] = Math.max(0, flash[k] - dt * 3);
    if (toast) { toast.t += dt; if (toast.t > 1.8) toast = null; }
  }
  function drawFx(c) {
    c.save(); c.translate(OX, 0);
    for (const f of fx) {
      if (f.delay > 0) continue;
      const k = f.t / f.life, a = 1 - Math.max(0, (k - 0.6) / 0.4);
      c.save(); c.globalAlpha = Math.max(0, a);
      if (f.kind === 'coins') {
        const s = k < 0.15 ? k / 0.15 : 1;
        A.text(c, f.text, f.x, f.y, 40 * (0.6 + 0.4 * s), '#FFD23F', { stroke: '#8A4B12', lw: 7 });
      } else if (f.kind === 'coin') {
        const e = k * k * (3 - 2 * k);
        const x = f.x + (f.tx - f.x) * e, y = f.y + (f.ty - f.y) * e - Math.sin(k * Math.PI) * 120;
        c.globalAlpha = 1; A.coinIcon(c, x, y, 15);
      } else if (f.kind === 'text') {
        A.text(c, f.text, f.x, f.y, 26, f.color || '#4A2C1A', { stroke: '#FFFFFF', lw: 6 });
      } else if (f.kind === 'heart') {
        A.heart(c, f.x, f.y, 12);
      } else if (f.kind === 'spark') {
        A.star4(c, f.x, f.y, 9, '#FFE066');
      } else if (f.kind === 'dust') {
        A.circ(c, f.x, f.y, 10 * (1 - k) + 3); A.fs(c, 'rgba(200,160,110,0.6)');
      }
      c.restore();
    }
    c.restore();
    c.save(); c.translate(OX, KO);
    if (toast) {
      const a = Math.min(1, (1.8 - toast.t) * 4);
      c.save(); c.globalAlpha = Math.max(0, a);
      c.font = `900 28px ${A.FONT}`;
      const w = c.measureText(toast.text).width + 60;
      A.rr(c, 615 - w / 2, 1022, w, 54, 27); A.fs(c, 'rgba(74,44,26,0.88)');
      A.text(c, toast.text, 615, 1050, 28, '#FFFFFF');
      c.restore();
    }
    c.restore();
  }

  // ---------- цикл ----------
  function frame(ts) {
    const dtRaw = last ? Math.min(0.05, (ts - last) / 1000) : 0.016;
    last = ts;
    time += dtRaw;
    const dt = dtRaw * speed;

    if (screen === 'title') {
      if (!bgGame || bgGame.done) { bgGame = new E.Game({ level: 3, seed: (Math.random() * 1e9) | 0, upgrades: { stove: 1 }, ext: gameExt() }); bgBot = new B.Bot('pro', 3); }
      bgBot.step(bgGame, dtRaw); bgGame.update(dtRaw); handleEvents(bgGame, true);
    } else if (screen === 'play' && game && !demoFreeze) {
      if (autoBot) autoBot.step(game, dt);
      game.update(dt);
      handleEvents(game, false);
      if (game.done) {
        save.wallet += game.result.coins;
        if (game.result.win) {
          save.level = Math.max(save.level, game.n + 1);
          save.stars[game.n] = Math.max(save.stars[game.n] || 0, game.result.stars);
          Snd.win();
        } else Snd.lose();
        writeSave();
        resultAnim = 0;
        screen = 'result';
        if (autoBot) setTimeout(() => { if (screen === 'result') openIntro(game.result.win ? game.n + 1 : game.n), screen = 'play'; }, 2500);
      }
    }
    if (screen === 'result') resultAnim += dtRaw;
    updateFx(dtRaw);
    if (demoFreeze && game) { game.chef.anim += dtRaw; for (const cu of game.customers) cu.anim += dtRaw; }

    // рисуем
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ui = [];
    const g = screen === 'title' ? bgGame : (game || bgGame);
    if (screen === 'shop' && !game) { drawWorld(ctx, bgGame, false); drawHud(ctx, bgGame, false); }
    else {
      drawWorld(ctx, g, screen === 'play');
      drawFx(ctx);
      drawHud(ctx, g, screen === 'play');
    }
    if (screen !== 'play') {
      const oy = TOP + Math.max(0, (VH - H - TOP - BOT) / 2);
      ctx.save(); ctx.translate(OX, oy); uiOff = { x: OX, y: oy };
      if (screen === 'title') drawTitle(ctx);
      else if (screen === 'intro') drawIntro(ctx, game);
      else if (screen === 'pause') drawPause(ctx);
      else if (screen === 'result') drawResult(ctx, game);
      else if (screen === 'shop') drawShop(ctx);
      ctx.restore(); uiOff = { x: 0, y: 0 };
    }
    if (screen === 'pause') ui.push({ x: VW - W + 1140, y: TOP + 22, w: 76, h: 70, act: () => { screen = 'play'; } });

    requestAnimationFrame(frame);
  }

  // ---------- старт ----------
  resize();
  if (params.has('demo')) setupDemo();
  else if (params.get('level')) { openIntro(+params.get('level')); if (autoBot) screen = 'play'; }
  else startTitle();
  window.__elina = { get game() { return game; }, get screen() { return screen; }, E, save: () => save };
  requestAnimationFrame(frame);
})();
