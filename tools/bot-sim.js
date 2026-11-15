// Прогон ботов по уровням + проверка инвариантов логики.
// Запуск: node tools/bot-sim.js [уровней=10] [сидов=8]
const E = require('../js/logic.js');
const { Bot } = require('../js/bot.js');

const LEVELS = +process.argv[2] || 10;
const SEEDS = +process.argv[3] || 8;
const SKILLS = ['pro', 'casual', 'slow'];
const DT = 1 / 30;
const EXT = +(process.env.EXT || 0); // 0 — квадратный экран, ~1250 — высокий телефон

// апгрейды, которые разумный игрок успевает купить к уровню n
function upgradesFor(n) {
  const u = { cook: 0, stove: 0, patience: 0, tray: 0, shoes: 0 };
  if (n >= 3) u.shoes = 1;
  if (n >= 4) u.cook = 1;
  if (n >= 5) u.stove = 1;
  if (n >= 6) u.patience = 1;
  if (n >= 7) { u.cook = 2; u.shoes = 2; }
  if (n >= 8) u.tray = 1;
  if (n >= 9) { u.stove = 2; u.patience = 2; }
  return u;
}

const problems = [];
function check(g, ctx) {
  const ch = g.chef;
  const bad = (m) => problems.push(`${ctx} t=${g.t.toFixed(1)}: ${m}`);
  if (!isFinite(ch.x) || !isFinite(ch.y)) bad('chef NaN');
  if (ch.hands.length > g.handCap) bad('hands over cap');
  if (g.pass.length > g.passCap) bad('pass over cap');
  if (g.cooking.length > g.maxCooking) bad('stove over cap');
  for (const d of g.L.menu) if (g.available(d) < 0) bad('negative availability ' + d);
  for (const c of g.customers) {
    if (!isFinite(c.x) || !isFinite(c.y)) bad('customer NaN');
    if (c.table >= 0 && g.tables[c.table].cust !== c.id) bad('table mismatch');
  }
  for (const tb of g.tables) if (tb.cust && !g.cust(tb.cust)) bad('table holds ghost customer');
  // никто не должен наступать на стол со стульями (гость — только на свой стул, повар — никогда)
  const F = E.FOOT;
  const inFoot = (x, y, tb) => { const k = tb.s || 1, dx = Math.abs(x - tb.x) / (F.rx * k - 6), dy = Math.abs(y - (tb.y + F.dy * k)) / (F.ry * k - 6); return dx ** 4 + dy ** 4 < 1; };
  for (const tb of g.tables) {
    if (inFoot(ch.x, ch.y, tb)) bad('chef walks through table ' + tb.i);
    for (const c of g.customers) {
      if (c.table === tb.i || c.lastTable === tb.i) continue;
      if (inFoot(c.x, c.y, tb)) bad('customer walks through table ' + tb.i);
    }
  }
}

function run(level, skill, seed) {
  const g = new E.Game({ level, seed: seed * 1000 + level, upgrades: upgradesFor(level), ext: EXT });
  const bot = new Bot(skill, seed + 99);
  let stuck = 0, lastTask = null;
  while (!g.done) {
    bot.step(g, DT);
    g.update(DT);
    for (const ev of g.events) if (ev.type === 'navfail') problems.push(`L${level} ${skill} s${seed}: путь не найден (${ev.x | 0},${ev.y | 0})→(${ev.tx | 0},${ev.ty | 0})`);
    g.events.length = 0;
    if (Math.round(g.t * 30) % 3 === 0) check(g, `L${level} ${skill} s${seed}`);
    if (g.chef.cur && g.chef.cur === lastTask) stuck += DT; else stuck = 0;
    lastTask = g.chef.cur;
    if (stuck > 25) { problems.push(`L${level} ${skill} s${seed}: chef stuck on ${g.chef.cur.type}/${g.chef.cur.phase}`); stuck = -1e9; }
  }
  return Object.assign({ t: g.t, actions: bot.actions }, g.result);
}

const pad = (s, n) => String(s).padEnd(n);
console.log(pad('Ур', 4) + pad('меню', 7) + SKILLS.map((s) => pad(s + ' win% ★ coins/goal lost', 34)).join(''));
const summary = {};
for (let L = 1; L <= LEVELS; L++) {
  const cfg = E.levelConfig(L);
  let line = pad(L, 4) + pad(cfg.menu.length + '/' + cfg.tables, 7);
  for (const sk of SKILLS) {
    let wins = 0, stars = 0, coins = 0, lost = 0, served = 0;
    for (let s = 1; s <= SEEDS; s++) {
      const r = run(L, sk, s);
      wins += r.win ? 1 : 0; stars += r.stars; coins += r.coins; lost += r.lost; served += r.served;
    }
    const wr = Math.round((wins / SEEDS) * 100);
    (summary[sk] = summary[sk] || []).push(wr);
    line += pad(`${pad(wr + '%', 5)}${(stars / SEEDS).toFixed(1)}  ${Math.round(coins / SEEDS)}/${cfg.goal}  ${(lost / SEEDS).toFixed(1)}`, 34);
  }
  console.log(line);
}
console.log('\nПроблемы логики: ' + (problems.length ? '\n' + [...new Set(problems)].slice(0, 30).join('\n') : 'нет'));
