/* Боты-игроки: используют те же команды, что и живой игрок (cmdCook / cmdServe / boost). */
(function (root) {
  'use strict';
  const E = (typeof module !== 'undefined' && module.exports) ? require('./logic.js') : root.Elina;

  // react — время реакции (сек), maxQ — сколько приказов держит в голове, err — шанс ошибки
  const SKILLS = {
    pro:    { react: 0.35, maxQ: 3, err: 0.0 },
    casual: { react: 0.9,  maxQ: 2, err: 0.04 },
    slow:   { react: 1.6,  maxQ: 1, err: 0.1 },
  };

  class Bot {
    constructor(skill, seed) {
      this.name = typeof skill === 'string' ? skill : 'custom';
      this.s = typeof skill === 'string' ? SKILLS[skill] : skill;
      this.rng = E.mulberry32(seed == null ? 7 : seed);
      this.cd = 0.6;
      this.actions = 0;
    }

    step(g, dt) {
      this.cd -= dt;
      if (this.cd > 0 || g.done) return null;
      const a = this.decide(g);
      if (a) { this.actions++; this.cd = this.s.react * (0.6 + 0.8 * this.rng()); }
      else this.cd = 0.15;
      return a;
    }

    decide(g) {
      const ch = g.chef;
      if (ch.tasks.length + (ch.cur ? 1 : 0) >= this.s.maxQ) return null;
      const ordering = g.customers.filter((c) => c.state === 'order').sort((a, b) => a.patience - b.patience);

      if (this.rng() < this.s.err) {
        const d = g.L.menu[Math.floor(this.rng() * g.L.menu.length)];
        if (g.cmdCook(d)) return { type: 'cook', dish: d, mistake: true };
      }
      // раздача забита ненужным — выбросить лишнее
      if (g.pass.length >= g.passCap && this.s.err < 0.1) {
        const need = {};
        for (const c of g.customers) if (c.state === 'order') for (const d of c.order) need[d] = (need[d] || 0) + 1;
        for (let i = 0; i < g.pass.length; i++) {
          const d = g.pass[i];
          if ((need[d] || 0) < g.supply(d) && g.available(d) > 0 && g.cmdDiscard(i)) return { type: 'discard', dish: d };
        }
      }
      if (ch.boostCd <= 0 && ordering.length >= 3 && g.boost()) return { type: 'boost' };

      // 1) отнести то, что уже готово
      for (const c of ordering) {
        const b = g.planServe(c.id);
        if (b && b.every((d) => g.readyAvailable(d) > 0) && g.cmdServe(c.id)) return { type: 'serve', cid: c.id };
      }
      // 2) приготовить недостающее (самым нетерпеливым — первым)
      const demand = {};
      for (const c of ordering) for (const d of c.order) demand[d] = (demand[d] || 0) + 1;
      for (const c of ordering) {
        for (const d of c.order) {
          if (demand[d] > g.supply(d) + g.pendingCookCount(d) && g.canCook(d) && g.cmdCook(d)) return { type: 'cook', dish: d };
        }
      }
      // 3) заранее пойти за тем, что ещё жарится
      for (const c of ordering) {
        if (g.planServe(c.id) && g.cmdServe(c.id)) return { type: 'serve', cid: c.id, early: true };
      }
      return null;
    }
  }

  const api = { Bot, SKILLS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ElinaBot = api;
})(typeof window !== 'undefined' ? window : globalThis);
