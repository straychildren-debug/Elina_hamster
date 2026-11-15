/* Elina — игровая логика (без отрисовки). Работает и в браузере, и в Node (для ботов). */
(function (root) {
  'use strict';

  const W = 1230, H = 1280;

  const DISHES = {
    burger: { name: 'Бургер',  cook: 5.0, price: 10, station: 'pan' },
    pizza:  { name: 'Пицца',   cook: 7.0, price: 13, station: 'board' },
    coffee: { name: 'Кофе',    cook: 3.0, price: 6,  station: 'coffee' },
    soup:   { name: 'Суп',     cook: 6.0, price: 11, station: 'pot' },
    salad:  { name: 'Салат',   cook: 4.0, price: 9,  station: 'greens' },
    cake:   { name: 'Кекс',    cook: 4.5, price: 12, station: 'board' },
  };
  const DISH_ORDER = ['burger', 'pizza', 'coffee', 'soup', 'salad', 'cake'];

  // Где стоит Розовый нос, когда работает у станции
  const STATIONS = {
    pan:    { x: 180,  y: 738 },
    greens: { x: 300,  y: 738 },
    pot:    { x: 400,  y: 738 },
    board:  { x: 600,  y: 738 },
    coffee: { x: 872,  y: 738 },
  };
  const PASS_SPOT = { x: 1045, y: 738 };
  const PASS_SLOTS = [{ x: 950, y: 795 }, { x: 1020, y: 795 }, { x: 1090, y: 795 }, { x: 1160, y: 795 }];
  const HOME = { x: 690, y: 728 };
  const DOOR = { x: 240, y: 300 };
  const QUEUE_SPOTS = [{ x: 345, y: 336 }, { x: 140, y: 350 }, { x: 70, y: 420 }];

  // Расстановка столиков: 3–4 — как на референсе, 5–6 — плотнее и чуть меньше
  const A_ = { x: 490, y: 432, s: 1 }, C_ = { x: 205, y: 592, s: 1 }, B_ = { x: 850, y: 388, s: 1 }, D_ = { x: 1065, y: 592, s: 1 };
  const LAYOUTS = {
    3: [A_, C_, B_],
    4: [A_, C_, B_, D_],
    // ряды и столы разнесены так, чтобы между ними оставались проходы
    5: [{ x: 470, y: 362, s: 0.82 }, { x: 830, y: 362, s: 0.82 }, { x: 200, y: 604, s: 0.82 }, { x: 615, y: 604, s: 0.82 }, { x: 1030, y: 604, s: 0.82 }],
    6: [{ x: 470, y: 380, s: 0.76 }, { x: 830, y: 380, s: 0.76 }, { x: 172, y: 610, s: 0.76 }, { x: 467, y: 610, s: 0.76 }, { x: 762, y: 610, s: 0.76 }, { x: 1057, y: 610, s: 0.76 }],
  };
  const TABLE_SLOTS = LAYOUTS[4];
  const layoutFor = (n) => LAYOUTS[Math.max(3, Math.min(6, n))];
  // «след» гарнитура (стол + 4 стула) на полу — туда нельзя наступать
  const FOOT = { rx: 128, ry: 118, dy: 5, gap: 58 };
  // ext — сколько логических px добавил высокий экран (зал растёт вниз, кухня уезжает вниз)
  function buildLayout(n, ext) {
    n = Math.max(3, Math.min(6, n));
    if (ext < 220) {
      const ky = (478 + ext) / 478;
      return layoutFor(n).map((p) => {
        const y = 262 + (p.y - 262) * ky, side = p.x < 650 ? 1 : -1;
        return { x: p.x, y, s: p.s, serve: { x: p.x + side * (FOOT.rx * p.s + FOOT.gap), y: y + 22 * p.s } };
      });
    }
    // вертикальный экран: две колонки крупных столов, проход посередине
    const top = 372, bot = 740 + ext - 70;
    const rows = Math.ceil(n / 2), rowH = (bot - top) / rows;
    const s = Math.max(0.9, Math.min(1.35, (rowH - 30) / 270));
    const out = [];
    for (let i = 0; i < n; i++) {
      const r = Math.floor(i / 2), last = n % 2 === 1 && i === n - 1;
      const x = last ? 615 : (i % 2 ? 912 : 318);
      const y = top + r * rowH + 128 * s + Math.max(0, (rowH - 246 * s) / 2);
      const side = x <= 615 ? 1 : -1;
      out.push({ x, y, s, serve: { x: x + side * (FOOT.rx * s + FOOT.gap * Math.min(1.3, s)), y: y + 22 * s } });
    }
    return out;
  }
  const seatOf = (t) => ({ x: t.x - 62 * (t.s || 1), y: t.y - 8 * (t.s || 1) });
  const serveSpotOf = (t) => t.serve || { x: t.x + 8 * (t.s || 1), y: t.y + 80 * (t.s || 1) };

  const LEVELS = [
    { tables: 3, menu: ['burger'],                                   dur: 75,  count: 9,  patience: 31, combo: 0,    rush: 0.1,  goal: 75 },
    { tables: 4, menu: ['burger', 'coffee'],                         dur: 90,  count: 13, patience: 29, combo: 0.12, rush: 0.2,  goal: 120 },
    { tables: 4, menu: ['burger', 'pizza', 'coffee'],                dur: 105, count: 17, patience: 28, combo: 0.18, rush: 0.25, goal: 180 },
    { tables: 5, menu: ['burger', 'pizza', 'coffee', 'soup'],        dur: 105, count: 19, patience: 27, combo: 0.22, rush: 0.28, goal: 210 },
    { tables: 5, menu: ['burger', 'pizza', 'coffee', 'soup'],        dur: 120, count: 23, patience: 26, combo: 0.26, rush: 0.3,  goal: 260 },
    { tables: 6, menu: ['burger', 'pizza', 'coffee', 'soup', 'salad'], dur: 120, count: 25, patience: 25, combo: 0.28, rush: 0.32, goal: 290 },
    { tables: 6, menu: ['burger', 'pizza', 'coffee', 'soup', 'salad', 'cake'], dur: 120, count: 28, patience: 24, combo: 0.3, rush: 0.34, goal: 330 },
  ];

  function levelConfig(n) {
    n = Math.max(1, n | 0);
    if (n <= LEVELS.length) return Object.assign({ n }, LEVELS[n - 1], { menu: LEVELS[n - 1].menu.slice() });
    const b = LEVELS[LEVELS.length - 1], k = n - LEVELS.length;
    return Object.assign({}, b, {
      n, menu: b.menu.slice(),
      count: b.count + 2 * k,
      patience: Math.max(17, b.patience - 0.6 * k),
      combo: Math.min(0.5, b.combo + 0.03 * k),
      rush: Math.min(0.45, b.rush + 0.02 * k),
      goal: b.goal + 30 * k,
    });
  }

  const UPGRADES = [
    { id: 'cook',     name: 'Острые ножи',     desc: 'Готовка быстрее на 12%',           max: 3, cost: [60, 120, 200] },
    { id: 'stove',    name: 'Новая конфорка',  desc: '+1 блюдо готовится одновременно',  max: 2, cost: [90, 180] },
    { id: 'shoes',    name: 'Кроссовки',       desc: 'Розовый нос бегает быстрее',       max: 3, cost: [50, 100, 170] },
    { id: 'patience', name: 'Уютный декор',    desc: 'Гости ждут дольше на 12%',         max: 3, cost: [70, 140, 220] },
    { id: 'tray',     name: 'Большой поднос',  desc: 'Носить сразу 3 блюда',             max: 1, cost: [150] },
  ];

  function mulberry32(a) {
    a = a >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function makeOrder(L, rng) {
    const m = L.menu;
    const a = m[Math.floor(rng() * m.length)];
    if (m.length > 1 && rng() < L.combo) {
      let b;
      do { b = m[Math.floor(rng() * m.length)]; } while (b === a);
      return [a, b];
    }
    return [a];
  }

  function buildSchedule(L, rng) {
    const items = [];
    for (let i = 0; i < L.count; i++) {
      if (i > 0 && rng() < L.rush) items.push({ rush: true, w: 1.0 + rng() * 0.6 });
      else items.push({ rush: false, w: 0.6 + rng() * 0.8 });
    }
    items[0] = { rush: true, w: 0 };
    const span = L.dur * 0.86 - 2;
    let rushSum = 0, normSum = 0;
    for (const it of items) { if (it.rush) rushSum += it.w; else normSum += it.w; }
    const k = normSum > 0 ? Math.max(0, (span - rushSum) / normSum) : 0;
    let t = 2;
    return items.map((it) => {
      t += it.rush ? it.w : it.w * k;
      return { t, kind: Math.floor(rng() * 6), order: makeOrder(L, rng) };
    });
  }

  function moveTo(o, tx, ty, speed, dt) {
    const dx = tx - o.x, dy = ty - o.y, d = Math.hypot(dx, dy);
    if (Math.abs(dx) > 1.5) o.face = dx > 0 ? 1 : -1;
    if (d <= speed * dt || d < 0.01) { o.x = tx; o.y = ty; return true; }
    o.x += (dx / d) * speed * dt;
    o.y += (dy / d) * speed * dt;
    return false;
  }

  // ---------- навигация: обход столов по проходам (A* по сетке + сглаживание) ----------
  const NAV = { cs: 14, x0: 0, y0: 250, x1: 1230, y1: 750, open: 66, padX: 26, padY: 12 };
  class Nav {
    constructor(tables, ext, bodyK) {
      this.y1 = NAV.y1 + (ext || 0);
      this.padX = NAV.padX * (bodyK || 1); this.padY = NAV.padY * (bodyK || 1);
      this.cols = Math.ceil((NAV.x1 - NAV.x0) / NAV.cs);
      this.rows = Math.ceil((this.y1 - NAV.y0) / NAV.cs);
      this.block = new Uint8Array(this.cols * this.rows);
      this.obs = tables.map((t) => { const k = t.s || 1; return { x: t.x, y: t.y + FOOT.dy * k, rx: FOOT.rx * k, ry: FOOT.ry * k }; });
      for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
        const p = this.center(c, r);
        // клетка занята, если гарнитур задевает её с запасом в полклетки
        if (this.inObs(p.x, p.y, NAV.cs * 0.5)) this.block[r * this.cols + c] = 1;
      }
    }
    center(c, r) { return { x: NAV.x0 + (c + 0.5) * NAV.cs, y: NAV.y0 + (r + 0.5) * NAV.cs }; }
    cell(x, y) {
      return {
        c: Math.max(0, Math.min(this.cols - 1, Math.floor((x - NAV.x0) / NAV.cs))),
        r: Math.max(0, Math.min(this.rows - 1, Math.floor((y - NAV.y0) / NAV.cs))),
      };
    }
    // скруглённый прямоугольник (суперэллипс) вокруг стола со стульями
    inObs(x, y, pad) {
      pad = pad || 0;
      for (const o of this.obs) {
        const dx = Math.abs(x - o.x) / (o.rx + this.padX + pad), dy = Math.abs(y - o.y) / (o.ry + this.padY + pad);
        if (dx * dx * dx * dx + dy * dy * dy * dy < 1) return true;
      }
      return false;
    }
    lineFree(p, q) {
      const d = Math.hypot(q.x - p.x, q.y - p.y), n = Math.max(1, Math.ceil(d / 6));
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        if (this.inObs(p.x + (q.x - p.x) * t, p.y + (q.y - p.y) * t, 2)) return false;
      }
      return true;
    }
    // ближайшая свободная точка (для гостя, который садится за стол или встаёт)
    nearestFree(x, y) {
      if (!this.inObs(x, y, 2)) return { x, y };
      const c0 = this.cell(x, y);
      let best = null, bd = Infinity;
      for (let rad = 1; rad < 40 && !best; rad++) {
        for (let dr = -rad; dr <= rad; dr++) for (let dc = -rad; dc <= rad; dc++) {
          if (Math.max(Math.abs(dr), Math.abs(dc)) !== rad) continue;
          const c = c0.c + dc, r = c0.r + dr;
          if (c < 0 || r < 0 || c >= this.cols || r >= this.rows || this.block[r * this.cols + c]) continue;
          const p = this.center(c, r), d = Math.hypot(p.x - x, p.y - y);
          if (d < bd) { bd = d; best = p; }
        }
      }
      return best || { x, y };
    }
    path(sx, sy, gx, gy) {
      this.lastFailed = false;
      const A0 = { x: sx, y: sy }, B0 = { x: gx, y: gy };
      const a = this.nearestFree(sx, sy), b = this.nearestFree(gx, gy);
      const pre = (a.x !== sx || a.y !== sy) ? [a] : [];
      const post = (b.x !== gx || b.y !== gy) ? [B0] : [];
      if (this.lineFree(a, b)) return pre.concat([b], post);
      const C = this.cols, R = this.rows, N = C * R;
      const s0 = this.cell(a.x, a.y), g0 = this.cell(b.x, b.y);
      const si = s0.r * C + s0.c, gi = g0.r * C + g0.c;
      const free = (i) => !this.block[i] || i === si || i === gi;
      const gs = new Float32Array(N).fill(Infinity), from = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
      const fsc = new Float32Array(N).fill(Infinity);
      const h = (i) => Math.hypot((i % C) - g0.c, ((i / C) | 0) - g0.r);
      const open = [si]; gs[si] = 0; fsc[si] = h(si);
      let found = false;
      while (open.length) {
        let bi = 0;
        for (let k = 1; k < open.length; k++) if (fsc[open[k]] < fsc[open[bi]]) bi = k;
        const cur = open[bi]; open[bi] = open[open.length - 1]; open.pop();
        if (cur === gi) { found = true; break; }
        if (closed[cur]) continue;
        closed[cur] = 1;
        const cc = cur % C, cr = (cur / C) | 0;
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          const nc = cc + dc, nr = cr + dr;
          if (nc < 0 || nr < 0 || nc >= C || nr >= R) continue;
          const ni = nr * C + nc;
          if (closed[ni] || !free(ni)) continue;
          if (dr && dc && (!free(cr * C + nc) || !free(nr * C + cc))) continue;
          const ng = gs[cur] + (dr && dc ? 1.4142 : 1);
          if (ng < gs[ni]) { gs[ni] = ng; from[ni] = cur; fsc[ni] = ng + h(ni); open.push(ni); }
        }
      }
      this.lastFailed = !found;
      if (!found) return pre.concat([b], post); // не должно случаться: боты это ловят
      const pts = [];
      for (let i = gi; i !== -1 && i !== si; i = from[i]) pts.push(this.center(i % C, (i / C) | 0));
      pts.reverse(); pts.push(b);
      // сглаживание по прямой видимости
      const out = []; let cur = a, k = 0;
      while (k < pts.length) {
        let far = k;
        for (let j = pts.length - 1; j > k; j--) if (this.lineFree(cur, pts[j])) { far = j; break; }
        out.push(pts[far]); cur = pts[far]; k = far + 1;
      }
      return pre.concat(out, post);
    }
  }

  const countIn = (arr, d) => { let n = 0; for (const x of arr) if (x === d) n++; return n; };

  class Game {
    constructor(cfg) {
      cfg = cfg || {};
      this.n = cfg.level || 1;
      this.L = levelConfig(this.n);
      this.upg = Object.assign({ cook: 0, stove: 0, patience: 0, tray: 0, shoes: 0 }, cfg.upgrades || {});
      this.rng = mulberry32(cfg.seed == null ? (Date.now() & 0xffffff) : cfg.seed);
      this.t = 0; this.coins = 0; this.served = 0; this.lost = 0; this.nextId = 1;
      this.done = false; this.result = null;
      this.ext = Math.max(0, cfg.ext || 0);
      const ex = this.ext;
      this.tables = buildLayout(this.L.tables, ex).map((p, i) => ({ i, x: p.x, y: p.y, s: p.s, serve: p.serve, cust: 0, plates: [] }));
      this.stations = {};
      for (const k in STATIONS) this.stations[k] = { x: STATIONS[k].x, y: STATIONS[k].y + ex };
      this.passSpot = { x: PASS_SPOT.x, y: PASS_SPOT.y + ex };
      this.home = { x: HOME.x, y: HOME.y + ex };
      this.queueSpots = ex < 220 ? QUEUE_SPOTS : [{ x: 345, y: 336 }, { x: 470, y: 326 }, { x: 140, y: 352 }];
      // большой зал — шагаем шире, чтобы сложность не зависела от экрана
      this.walkMul = 1 + ex / 1500;
      let ms = 0; for (const t of this.tables) ms += t.s || 1;
      this.bodyK = Math.max(0.9, Math.min(1.35, ms / this.tables.length));
      this.nav = new Nav(this.tables, this.ext, this.bodyK);
      this.customers = [];
      this.cooking = [];
      this.pass = [];
      this.maxCooking = 2 + this.upg.stove;
      this.handCap = 2 + this.upg.tray;
      this.passCap = PASS_SLOTS.length;
      this.cookMul = 1 - 0.12 * this.upg.cook;
      this.patience = this.L.patience * (1 + 0.12 * this.upg.patience);
      this.chefSpeed = 300 * (1 + 0.12 * this.upg.shoes) * this.walkMul;
      this.chef = { x: this.home.x, y: this.home.y, face: 1, hands: [], tasks: [], cur: null, walking: false, working: false,
        boostT: 0, boostCd: 0, idle: 0, anim: 0 };
      this.schedule = buildSchedule(this.L, this.rng);
      this.si = 0;
      this.events = [];
    }

    // идти к (tx,ty) по маршруту в обход столов; true — пришли
    walk(o, tx, ty, sp, dt) {
      if (!o.path || o.pgx !== tx || o.pgy !== ty) { o.path = this.nav.path(o.x, o.y, tx, ty); o.pgx = tx; o.pgy = ty; if (this.nav.lastFailed) this.emit('navfail', { x: o.x, y: o.y, tx, ty }); }
      let left = sp * dt;
      while (o.path.length && left > 0) {
        const p = o.path[0], dx = p.x - o.x, dy = p.y - o.y, d = Math.hypot(dx, dy);
        if (Math.abs(dx) > 1.5) o.face = dx > 0 ? 1 : -1;
        if (d <= left) { o.x = p.x; o.y = p.y; left -= d; o.path.shift(); }
        else { o.x += (dx / d) * left; o.y += (dy / d) * left; left = 0; }
      }
      if (!o.path.length) { o.path = null; return true; }
      return false;
    }

    get timeLeft() { return Math.max(0, this.L.dur - this.t); }
    emit(type, data) { this.events.push(Object.assign({ type }, data || {})); }
    cust(id) { for (const c of this.customers) if (c.id === id) return c; return null; }
    cookTime(d) { return DISHES[d].cook * this.cookMul; }
    allTasks() { return this.chef.cur ? [this.chef.cur].concat(this.chef.tasks) : this.chef.tasks; }
    pendingCooks() { let n = 0; for (const t of this.allTasks()) if (t.type === 'cook') n++; return n; }
    pendingCookCount(d) { let n = 0; for (const t of this.allTasks()) if (t.type === 'cook' && t.dish === d) n++; return n; }
    committed(d) { let n = 0; for (const t of this.allTasks()) if (t.type === 'serve') n += countIn(t.bring, d); return n; }
    supply(d) { return countIn(this.chef.hands, d) + countIn(this.pass, d) + this.cooking.filter((j) => j.dish === d).length; }
    available(d) { return this.supply(d) - this.committed(d); }
    readyAvailable(d) { return countIn(this.chef.hands, d) + countIn(this.pass, d) - this.committed(d); }
    freeStoveSlots() { return this.maxCooking - this.cooking.length - this.pendingCooks(); }
    canCook(d) { return this.L.menu.indexOf(d) >= 0 && this.freeStoveSlots() > 0 && !this.done; }

    cmdCook(d) {
      if (!this.canCook(d)) { this.emit('reject', { what: 'cook', dish: d }); return false; }
      this.chef.tasks.push({ type: 'cook', dish: d, phase: 'start', w: 0 });
      this.emit('queued', { what: 'cook', dish: d });
      return true;
    }

    planServe(cid) {
      const c = this.cust(cid);
      if (!c || c.state !== 'order') return null;
      const need = c.order.slice();
      for (const t of this.allTasks()) {
        if (t.type === 'serve' && t.cid === cid) for (const d of t.bring) { const k = need.indexOf(d); if (k >= 0) need.splice(k, 1); }
      }
      const bring = [], used = {};
      for (const d of need) {
        const av = this.available(d) - (used[d] || 0);
        if (av > 0) { bring.push(d); used[d] = (used[d] || 0) + 1; }
      }
      return bring.length ? bring : null;
    }

    cmdServe(cid) {
      const b = this.done ? null : this.planServe(cid);
      if (!b) { this.emit('reject', { what: 'serve', cid }); return false; }
      this.chef.tasks.push({ type: 'serve', cid, bring: b, phase: 'start', w: 0 });
      this.emit('queued', { what: 'serve', cid });
      return true;
    }

    // выбросить блюдо с раздачи (если по ошибке приготовили лишнее)
    cmdDiscard(slot) {
      if (slot < 0 || slot >= this.pass.length || this.done) return false;
      const d = this.pass[slot];
      this.pass.splice(slot, 1);
      if (this.available(d) < 0) { this.pass.splice(slot, 0, d); this.emit('reject', { what: 'discard', dish: d }); return false; }
      this.emit('discard', { dish: d, slot });
      return true;
    }

    cmdCancel() {
      const ch = this.chef;
      const had = ch.tasks.length + (ch.cur ? 1 : 0);
      ch.tasks.length = 0;
      if (ch.cur && !(ch.cur.type === 'cook' && ch.cur.phase === 'work')) ch.cur = null;
      if (had) this.emit('cancel', {});
      return had > 0;
    }

    boost() {
      const ch = this.chef;
      if (ch.boostCd > 0 || this.done) return false;
      ch.boostT = 8; ch.boostCd = 25;
      this.emit('boost', {});
      return true;
    }

    freeTable() {
      for (const tb of this.tables) if (!tb.cust) return tb;
      return null;
    }
    queued() { return this.customers.filter((c) => c.state === 'queue'); }

    spawn(s) {
      const c = {
        id: this.nextId++, kind: s.kind, x: DOOR.x, y: DOOR.y - 10, face: 1, state: 'walk',
        orig: s.order.slice(), order: s.order.slice(), pmax: this.patience, patience: this.patience,
        table: -1, timer: 0, mood: 'ok', anim: this.rng() * 6, walking: true, qwait: 0,
      };
      const tb = this.freeTable();
      if (tb) { tb.cust = c.id; c.table = tb.i; }
      else if (this.queued().length < this.queueSpots.length) { c.state = 'queue'; c.qwait = this.patience * 0.85; }
      else { c.state = 'leave'; c.mood = 'angry'; this.lost++; this.emit('angry', { x: c.x, y: c.y - 120 }); }
      this.customers.push(c);
      this.emit('arrive', { id: c.id });
    }

    leave(c, angry) {
      if (angry) { this.lost++; c.mood = 'angry'; this.emit('angry', { x: c.x, y: c.y - 130 }); }
      else c.mood = 'happy';
      if (c.table >= 0) { const tb = this.tables[c.table]; tb.cust = 0; tb.plates = []; c.lastTable = c.table; c.table = -1; }
      c.state = 'leave';
      const ch = this.chef;
      ch.tasks = ch.tasks.filter((t) => !(t.type === 'serve' && t.cid === c.id));
      this.fillTables();
    }

    fillTables() {
      for (const tb of this.tables) {
        if (tb.cust) continue;
        const q = this.customers.find((c) => c.state === 'queue');
        if (!q) break;
        tb.cust = q.id; q.table = tb.i; q.state = 'walk';
      }
    }

    pay(c) {
      let sum = 0;
      for (const d of c.orig) sum += DISHES[d].price;
      const tip = Math.round(sum * 0.6 * Math.max(0, Math.min(1, c.tipRatio)));
      const total = sum + tip;
      this.coins += total; this.served++;
      this.emit('coins', { x: c.x, y: c.y - 140, amount: total, tip });
    }

    update(dt) {
      if (this.done) return;
      this.t += dt;
      while (this.si < this.schedule.length && this.schedule[this.si].t <= this.t) this.spawn(this.schedule[this.si++]);
      this.updateCooking(dt);
      this.updateChef(dt);
      this.updateCustomers(dt);
      if ((this.si >= this.schedule.length && this.t >= this.L.dur && this.customers.length === 0) || this.t > this.L.dur + 90) {
        this.finish();
      }
    }

    finish() {
      this.done = true;
      const g = this.L.goal, c = this.coins;
      const stars = c >= g ? 1 + (c >= g * 1.3 ? 1 : 0) + (c >= g * 1.6 ? 1 : 0) : 0;
      this.result = { coins: c, goal: g, stars, served: this.served, lost: this.lost, win: c >= g };
      this.emit('done', this.result);
    }

    updateCooking(dt) {
      for (const j of this.cooking) j.t = Math.min(j.total, j.t + dt);
      for (let i = 0; i < this.cooking.length; i++) {
        const j = this.cooking[i];
        if (j.t >= j.total && this.pass.length < this.passCap) {
          this.pass.push(j.dish);
          this.cooking.splice(i, 1); i--;
          this.emit('ready', { dish: j.dish, slot: this.pass.length - 1 });
        }
      }
    }

    haveAll(bring) {
      const h = this.chef.hands.slice();
      for (const d of bring) { const k = h.indexOf(d); if (k < 0) return false; h.splice(k, 1); }
      return true;
    }
    missing(bring) {
      const h = this.chef.hands.slice(), out = [];
      for (const d of bring) { const k = h.indexOf(d); if (k < 0) out.push(d); else h.splice(k, 1); }
      return out;
    }

    // убрать с рук лишнее (не нужное текущей задаче) обратно на раздачу
    stashExtra(t) {
      const ch = this.chef, keep = t.bring.slice();
      for (let i = ch.hands.length - 1; i >= 0 && ch.hands.length >= this.handCap; i--) {
        const d = ch.hands[i], k = keep.indexOf(d);
        if (k >= 0) { keep.splice(k, 1); continue; }
        if (this.pass.length < this.passCap) { this.pass.push(d); ch.hands.splice(i, 1); }
      }
    }

    // раз уж стоим у раздачи — прихватить блюда для следующих приказов «отнести»
    grabAhead() {
      const ch = this.chef;
      for (const nt of ch.tasks) {
        if (nt.type !== 'serve') break;
        for (const d of this.missing(nt.bring.concat(ch.cur ? ch.cur.bring : []))) {
          if (ch.hands.length >= this.handCap) return;
          const k = this.pass.indexOf(d);
          if (k >= 0 && nt.bring.indexOf(d) >= 0) { this.pass.splice(k, 1); ch.hands.push(d); this.emit('pick', { dish: d }); }
        }
      }
    }

    updateChef(dt) {
      const ch = this.chef;
      ch.anim += dt;
      ch.boostT = Math.max(0, ch.boostT - dt);
      ch.boostCd = Math.max(0, ch.boostCd - dt);
      const sp = this.chefSpeed * (ch.boostT > 0 ? 1.7 : 1);
      ch.walking = false; ch.working = false;
      if (!ch.cur && ch.tasks.length) { ch.cur = ch.tasks.shift(); ch.path = null; }
      const t = ch.cur;
      if (!t) {
        if (Math.hypot(ch.x - this.home.x, ch.y - this.home.y) > 2) {
          ch.idle += dt;
          if (ch.idle > 0.8) { ch.walking = true; this.walk(ch, this.home.x, this.home.y, sp * 0.7, dt); }
        } else { ch.idle = 0; ch.face = 1; }
        return;
      }
      ch.idle = 0;
      if (t.type === 'cook') this.stepCook(t, dt, sp);
      else this.stepServe(t, dt, sp);
    }

    stepCook(t, dt, sp) {
      const ch = this.chef, st = this.stations[DISHES[t.dish].station];
      if (t.phase === 'start') t.phase = 'go';
      if (t.phase === 'go') {
        ch.walking = true;
        if (this.walk(ch, st.x, st.y, sp, dt)) { t.phase = 'work'; t.w = 0; }
        return;
      }
      if (t.phase === 'work') {
        ch.working = true;
        t.w += dt;
        if (t.w >= 0.45) {
          if (this.cooking.length < this.maxCooking) {
            this.cooking.push({ dish: t.dish, t: 0, total: this.cookTime(t.dish), station: DISHES[t.dish].station });
            this.emit('cookStart', { dish: t.dish, x: st.x, y: st.y });
          } else this.emit('reject', { what: 'busy', dish: t.dish });
          ch.cur = null;
        }
      }
    }

    stepServe(t, dt, sp) {
      const ch = this.chef, c = this.cust(t.cid);
      if (!c || c.state !== 'order') { ch.cur = null; return; }
      if (t.phase === 'start') t.phase = this.haveAll(t.bring) ? 'toTable' : 'toPass';
      if (t.phase === 'toPass') {
        ch.walking = true;
        if (this.walk(ch, this.passSpot.x, this.passSpot.y, sp, dt)) { t.phase = 'wait'; t.w = 0; }
        return;
      }
      if (t.phase === 'wait') {
        ch.face = 1;
        for (const d of this.missing(t.bring)) {
          const k = this.pass.indexOf(d);
          if (k < 0) continue;
          if (ch.hands.length >= this.handCap) this.stashExtra(t);
          if (ch.hands.length < this.handCap) {
            const k2 = this.pass.indexOf(d);
            this.pass.splice(k2, 1); ch.hands.push(d);
            this.emit('pick', { dish: d });
          }
        }
        // готово, но раздача забита — снять прямо с плиты
        for (const d of this.missing(t.bring)) {
          const j = this.cooking.findIndex((x) => x.dish === d && x.t >= x.total);
          if (j >= 0 && ch.hands.length < this.handCap) { this.cooking.splice(j, 1); ch.hands.push(d); this.emit('pick', { dish: d }); }
        }
        // то, чего нет ни на раздаче, ни на плите — уже не появится
        for (const d of this.missing(t.bring)) {
          if (this.pass.indexOf(d) < 0 && !this.cooking.some((j) => j.dish === d)) t.bring.splice(t.bring.indexOf(d), 1);
        }
        if (!t.bring.length) { ch.cur = null; return; }
        if (!this.missing(t.bring).length) { this.grabAhead(); t.phase = 'toTable'; }
        else { ch.working = true; t.w += dt; }
        return;
      }
      const tb = this.tables[c.table];
      if (t.phase === 'toTable') {
        const s = serveSpotOf(tb);
        ch.walking = true;
        if (this.walk(ch, s.x, s.y, sp, dt)) { t.phase = 'give'; t.w = 0; }
        return;
      }
      if (t.phase === 'give') {
        ch.working = true;
        t.w += dt;
        if (t.w >= 0.25) { this.deliver(t, c, tb); ch.cur = null; }
      }
    }

    deliver(t, c, tb) {
      let n = 0;
      for (const d of t.bring.slice()) {
        const hi = this.chef.hands.indexOf(d), oi = c.order.indexOf(d);
        if (hi >= 0 && oi >= 0) { this.chef.hands.splice(hi, 1); c.order.splice(oi, 1); tb.plates.push(d); n++; }
      }
      if (n) this.emit('serve', { x: tb.x, y: tb.y - 30, n });
      if (!c.order.length) { c.state = 'eat'; c.timer = 3.2; c.tipRatio = c.patience / c.pmax; }
      else if (n) c.patience = Math.min(c.pmax, c.patience + c.pmax * 0.25);
    }

    updateCustomers(dt) {
      const queued = this.queued();
      for (const c of this.customers) {
        c.anim += dt;
        c.walking = false;
        switch (c.state) {
          case 'walk': {
            const s = seatOf(this.tables[c.table]);
            c.walking = !this.walk(c, s.x, s.y, 175 * this.walkMul, dt);
            if (!c.walking) { c.state = 'think'; c.timer = 1.0; c.face = 1; }
            break;
          }
          case 'queue': {
            const q = this.queueSpots[Math.max(0, queued.indexOf(c))];
            c.walking = !this.walk(c, q.x, q.y, 150 * this.walkMul, dt);
            c.qwait -= dt;
            if (c.qwait <= 0) this.leave(c, true);
            break;
          }
          case 'think':
            c.timer -= dt;
            if (c.timer <= 0) { c.state = 'order'; c.patience = c.pmax; this.emit('order', { id: c.id }); }
            break;
          case 'order':
            c.patience -= dt;
            if (c.patience <= 0) { c.patience = 0; this.leave(c, true); }
            break;
          case 'eat':
            c.timer -= dt;
            if (c.timer <= 0) { this.pay(c); this.leave(c, false); }
            break;
          case 'leave':
            c.walking = !this.walk(c, DOOR.x, DOOR.y - 10, 185 * this.walkMul, dt);
            if (!c.walking) c.gone = true;
            break;
        }
      }
      if (this.customers.some((c) => c.gone)) this.customers = this.customers.filter((c) => !c.gone);
    }
  }

  const api = {
    W, H, DISHES, DISH_ORDER, STATIONS, LAYOUTS, layoutFor, PASS_SPOT, PASS_SLOTS, HOME, DOOR, QUEUE_SPOTS, TABLE_SLOTS, LEVELS, UPGRADES,
    seatOf, serveSpotOf, levelConfig, Nav, buildLayout, FOOT, mulberry32, buildSchedule, Game,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Elina = api;
})(typeof window !== 'undefined' ? window : globalThis);
