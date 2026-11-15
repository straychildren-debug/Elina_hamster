/* Elina — процедурная графика (canvas). Все координаты в логическом поле 1230×1280. */
(function (root) {
  'use strict';
  const OL = '#6b3f26';           // основной контур
  const FONT = '"Nunito", "Segoe UI", Arial, sans-serif';
  const PI2 = Math.PI * 2;

  // ---------- примитивы ----------
  function rr(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }
  function ell(c, x, y, rx, ry, rot) { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, PI2); }
  function circ(c, x, y, r) { c.beginPath(); c.arc(x, y, Math.max(0.1, r), 0, PI2); }
  function fs(c, fill, stroke, lw) {
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 3; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); }
  }
  function lg(c, x0, y0, x1, y1, stops) { const g = c.createLinearGradient(x0, y0, x1, y1); stops.forEach((s, i) => g.addColorStop(s[0], s[1])); return g; }
  function rg(c, x, y, r0, r1, stops) { const g = c.createRadialGradient(x, y, r0, x, y, r1); stops.forEach((s) => g.addColorStop(s[0], s[1])); return g; }
  function seeded(n) { let s = n % 2147483647; if (s <= 0) s += 2147483646; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  function text(c, str, x, y, size, color, opts) {
    opts = opts || {};
    c.font = `${opts.weight || 900} ${size}px ${opts.font || FONT}`;
    c.textAlign = opts.align || 'center';
    c.textBaseline = opts.base || 'middle';
    if (opts.stroke) { c.lineWidth = opts.lw || 6; c.strokeStyle = opts.stroke; c.lineJoin = 'round'; c.strokeText(str, x, y); }
    c.fillStyle = color; c.fillText(str, x, y);
  }

  // ---------- еда ----------
  // (x,y) — центр, s — масштаб (1 ≈ иконка 100px)
  function drawFood(c, type, x, y, s) {
    c.save(); c.translate(x, y); c.scale(s, s);
    const f = FOOD[type]; if (f) f(c);
    c.restore();
  }
  const FOOD = {
    burger(c) {
      c.lineWidth = 3.2;
      // нижняя булка
      rr(c, -42, 14, 84, 24, 11); fs(c, lg(c, 0, 14, 0, 38, [[0, '#F4B565'], [1, '#D98A3C']]), OL, 3.2);
      // котлета
      rr(c, -46, 0, 92, 20, 10); fs(c, lg(c, 0, 0, 0, 20, [[0, '#8A4A2A'], [1, '#5E2F18']]), OL, 3.2);
      // сыр с потёками
      c.beginPath(); c.moveTo(-44, -2); c.lineTo(44, -2); c.lineTo(40, 6); c.lineTo(28, 6); c.lineTo(22, 16); c.lineTo(16, 6);
      c.lineTo(-8, 6); c.lineTo(-14, 15); c.lineTo(-20, 6); c.lineTo(-40, 6); c.closePath(); fs(c, '#FFC93C', OL, 2.6);
      // помидор
      rr(c, -40, -9, 80, 9, 4.5); fs(c, '#E8483B', OL, 2.6);
      // салат
      c.beginPath(); c.moveTo(-50, -10);
      for (let i = 0; i <= 10; i++) { const xx = -50 + i * 10; c.quadraticCurveTo(xx - 5, i % 2 ? -2 : -16, xx, -8); }
      c.lineTo(50, -14); c.lineTo(-50, -14); c.closePath(); fs(c, '#7BC843', OL, 2.6);
      // верхняя булка
      c.beginPath(); c.moveTo(-47, -10); c.bezierCurveTo(-47, -58, 47, -58, 47, -10); c.closePath();
      fs(c, lg(c, 0, -50, 0, -10, [[0, '#F9C374'], [1, '#E79A45']]), OL, 3.2);
      ell(c, -16, -36, 14, 6, -0.3); fs(c, 'rgba(255,255,255,0.35)');
      c.fillStyle = '#FFF6DC';
      [[-22, -26], [-6, -40], [10, -30], [24, -40], [28, -22], [-30, -38], [4, -20]].forEach((p) => { ell(c, p[0], p[1], 3.2, 2, 0.4); c.fill(); });
    },
    pizza(c) {
      c.save(); c.rotate(-0.55);
      // ломтик: остриё вниз
      c.beginPath(); c.moveTo(0, 50); c.lineTo(-40, -32); c.quadraticCurveTo(0, -46, 40, -32); c.closePath();
      fs(c, lg(c, 0, -40, 0, 50, [[0, '#FFD45A'], [1, '#FFB52E']]), OL, 3.2);
      // корочка
      c.beginPath(); c.moveTo(-44, -30); c.quadraticCurveTo(0, -50, 44, -30); c.quadraticCurveTo(46, -42, 40, -46); c.quadraticCurveTo(0, -62, -40, -46); c.quadraticCurveTo(-46, -42, -44, -30); c.closePath();
      fs(c, lg(c, 0, -60, 0, -30, [[0, '#F4B565'], [1, '#D98A3C']]), OL, 3.2);
      // пепперони
      [[-12, -16, 9], [12, -10, 8.5], [-2, 12, 8], [16, -30, 6]].forEach((p) => { circ(c, p[0], p[1], p[2]); fs(c, '#D9452F', '#9E2A1B', 2); circ(c, p[0] - 2, p[1] - 2, p[2] * 0.3); fs(c, 'rgba(255,255,255,0.35)'); });
      ell(c, -20, -28, 4, 2.5); fs(c, '#7BC843');
      c.restore();
    },
    coffee(c) {
      // блюдце
      ell(c, 0, 30, 48, 12); fs(c, '#FFFFFF', OL, 3);
      ell(c, 0, 28, 30, 6); fs(c, '#EDE6DF');
      // ручка
      c.beginPath(); c.arc(34, 2, 13, -1.4, 1.4); c.lineWidth = 9; c.strokeStyle = OL; c.stroke(); c.lineWidth = 5; c.strokeStyle = '#FFFFFF'; c.stroke();
      // чашка
      c.beginPath(); c.moveTo(-36, -14); c.lineTo(36, -14); c.bezierCurveTo(36, 18, 22, 30, 0, 30); c.bezierCurveTo(-22, 30, -36, 18, -36, -14); c.closePath();
      fs(c, lg(c, -36, 0, 36, 0, [[0, '#FFFFFF'], [0.7, '#F7F2EE'], [1, '#E3DBD3']]), OL, 3.2);
      ell(c, 0, -14, 36, 9); fs(c, '#FFFFFF', OL, 3);
      ell(c, 0, -13, 30, 6.5); fs(c, '#6B3A22');
      ell(c, -4, -14, 14, 3); fs(c, '#B9825A');
      // пар
      c.strokeStyle = 'rgba(160,140,130,0.7)'; c.lineWidth = 4; c.lineCap = 'round';
      [[-12, 0], [8, 1]].forEach((p) => { c.beginPath(); c.moveTo(p[0], -26); c.bezierCurveTo(p[0] - 10, -36, p[0] + 10, -42, p[0], -54); c.stroke(); });
    },
    soup(c) {
      c.beginPath(); c.moveTo(-48, -6); c.bezierCurveTo(-46, 30, 46, 30, 48, -6); c.closePath();
      fs(c, lg(c, 0, -6, 0, 30, [[0, '#FFFFFF'], [1, '#DCD6D0']]), OL, 3.2);
      rr(c, -14, 22, 28, 9, 4); fs(c, '#E9E3DD', OL, 2.6);
      ell(c, 0, -6, 48, 13); fs(c, '#FFFFFF', OL, 3);
      ell(c, 0, -5, 42, 10); fs(c, '#F08A2E');
      [[-20, -6, '#7BC843'], [-4, -9, '#E8483B'], [14, -4, '#FFD45A'], [24, -8, '#7BC843'], [4, -2, '#F4B565'], [-28, -3, '#E8483B']].forEach((p) => { rr(c, p[0] - 4, p[1] - 3, 8, 6, 2); fs(c, p[2]); });
      c.strokeStyle = 'rgba(160,140,130,0.6)'; c.lineWidth = 4; c.lineCap = 'round';
      [[-10], [12]].forEach((p) => { c.beginPath(); c.moveTo(p[0], -20); c.bezierCurveTo(p[0] - 9, -30, p[0] + 9, -36, p[0], -48); c.stroke(); });
    },
    salad(c) {
      c.beginPath(); c.moveTo(-46, -2); c.bezierCurveTo(-44, 32, 44, 32, 46, -2); c.closePath(); fs(c, lg(c, 0, 0, 0, 30, [[0, '#8FD1E8'], [1, '#5BAFD0']]), OL, 3.2);
      // листья
      [[-28, -10, 18, -0.5], [-6, -18, 20, 0], [18, -12, 18, 0.5], [30, -4, 14, 0.8], [-36, -2, 12, -0.8]].forEach((p) => { ell(c, p[0], p[1], p[2], p[2] * 0.62, p[3]); fs(c, '#7BC843', OL, 2.4); });
      [[-12, -8], [10, -6], [24, -14]].forEach((p) => { circ(c, p[0], p[1], 7); fs(c, '#E8483B', OL, 2.2); });
      [[-26, -16], [2, -4]].forEach((p) => { circ(c, p[0], p[1], 6); fs(c, '#DDF2B0', OL, 2); });
      ell(c, 0, -2, 46, 8); c.strokeStyle = OL; c.lineWidth = 3; c.stroke();
    },
    cake(c) {
      // кекс
      c.beginPath(); c.moveTo(-30, 0); c.lineTo(30, 0); c.lineTo(22, 36); c.lineTo(-22, 36); c.closePath();
      fs(c, lg(c, -30, 0, 30, 0, [[0, '#F48FB1'], [1, '#E56B98']]), OL, 3.2);
      c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 3;
      for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * 11, 2); c.lineTo(i * 8, 34); c.stroke(); }
      [[-24, -6, 16], [24, -6, 16], [0, -10, 22], [-10, -26, 14], [10, -26, 14], [0, -38, 11]].forEach((p) => { circ(c, p[0], p[1], p[2]); fs(c, '#FFF0F5', OL, 3); });
      [[-24, -6, 16], [24, -6, 16], [0, -10, 22], [-10, -26, 14], [10, -26, 14], [0, -38, 11]].forEach((p) => { circ(c, p[0], p[1], p[2] - 2.5); fs(c, '#FFF0F5'); });
      c.fillStyle = '#F06292'; [[-14, -12], [12, -20], [4, -4], [-4, -30], [18, -6]].forEach((p) => { rr(c, p[0], p[1], 5, 2.5, 1); c.fill(); });
      circ(c, 2, -52, 9); fs(c, '#E53935', OL, 2.6); circ(c, -1, -55, 2.5); fs(c, 'rgba(255,255,255,0.7)');
      c.beginPath(); c.moveTo(4, -60); c.quadraticCurveTo(8, -70, 16, -72); c.strokeStyle = '#5B8C2A'; c.lineWidth = 2.5; c.stroke();
    },
  };

  function drawPlate(c, x, y, s, dish) {
    c.save(); c.translate(x, y); c.scale(s, s);
    ell(c, 0, 4, 52, 17); fs(c, 'rgba(120,70,30,0.18)');
    ell(c, 0, 0, 52, 17); fs(c, '#FFFFFF', '#B9B2AA', 2.5);
    ell(c, 0, 0, 36, 11); fs(c, '#F1ECE6');
    c.restore();
    if (dish) drawFood(c, dish, x, y - 20 * s, 0.62 * s);
  }

  // ---------- хомяки ----------
  const LOOKS = [
    { fur: '#EFA35C', fur2: '#D98843', belly: '#FFF6EA', scarf: '#3E7FD6' },   // рыжий с голубым шарфом
    { fur: '#F2B26F', fur2: '#DE9550', belly: '#FFF6EA' },                     // рыжий
    { fur: '#C08450', fur2: '#9D6534', belly: '#F9E8D2', glasses: true },      // коричневый в очках
    { fur: '#94909E', fur2: '#76727F', belly: '#ECE9F1', muzzle: '#F4F1F6' },  // серый
    { fur: '#F7D9B4', fur2: '#EFC290', belly: '#FFF9F0', bow: '#F06292' },     // кремовый с бантом
    { fur: '#E2DDE6', fur2: '#B9B2C1', belly: '#FFFFFF', scarf: '#7BC043' },   // белый с зелёным шарфом
  ];
  const CHEF = { fur: '#3A353E', fur2: '#26232A', belly: '#4A4550', muzzle: '#56505D', chef: true, nose: '#FF8FA8' };

  // (x,y) — точка между лапками, s — масштаб; st: {walk, phase, expr, hold:[], face, seated}
  function drawHamster(c, x, y, s, look, st) {
    st = st || {};
    const face = st.face || 1;
    const ph = st.phase || 0;
    const bob = st.walk ? -Math.abs(Math.sin(ph * 9)) * 7 : Math.sin(ph * 2.2) * 1.5;
    const squash = st.walk ? 1 : 1 + Math.sin(ph * 2.2) * 0.012;
    c.save();
    c.translate(x, y);
    c.scale(s * face, s);
    // тень
    if (!st.seated) { ell(c, 0, 0, 50, 11); fs(c, 'rgba(110,60,30,0.18)'); }
    c.translate(0, bob);
    c.scale(1, squash);
    if (look.chef) c.scale(1.1, 1);
    if (st.walk) c.rotate(look.chef ? 0.13 : 0.06);
    const fur = look.fur, fur2 = look.fur2;

    // ноги
    if (!st.seated) {
      const k = st.walk ? Math.sin(ph * 9) : 0;
      const sx = st.walk ? 16 : 0;
      ell(c, -24 - sx * k, -6 - Math.max(0, k) * 12, 15, 9, st.walk ? -0.3 * k : 0); fs(c, look.chef ? '#2A262C' : '#F4B9A9', OL, 3);
      ell(c, 24 + sx * k, -6 - Math.max(0, -k) * 12, 15, 9, st.walk ? 0.3 * k : 0); fs(c, look.chef ? '#2A262C' : '#F4B9A9', OL, 3);
      if (look.chef) { ell(c, -24 - sx * k, -3 - Math.max(0, k) * 12, 9, 4); fs(c, '#F4B9A9'); ell(c, 24 + sx * k, -3 - Math.max(0, -k) * 12, 9, 4); fs(c, '#F4B9A9'); }
    }
    // уши (за головой)
    [[-42, -152], [42, -152]].forEach((p) => { circ(c, p[0], p[1], 18); fs(c, fur2, OL, 3.5); circ(c, p[0], p[1] + 1, 10); fs(c, '#F7A9B4'); });

    // единый контур тела+головы
    c.lineWidth = 7; c.strokeStyle = OL;
    ell(c, 0, -56, 57, 54); c.stroke();
    ell(c, 0, -112, 61, 51); c.stroke();
    const furG = lg(c, -60, -160, 60, 0, [[0, shade(fur, 14)], [0.55, fur], [1, shade(fur, -10)]]);
    ell(c, 0, -56, 57, 54); fs(c, furG);
    ell(c, 0, -112, 61, 51); fs(c, furG);

    // животик
    ell(c, 0, -46, 39, 37); fs(c, look.belly);
    if (look.chef) {
      // фартук
      c.beginPath(); c.moveTo(-36, -78); c.lineTo(36, -78); c.quadraticCurveTo(44, -20, 30, -8); c.quadraticCurveTo(0, 4, -30, -8); c.quadraticCurveTo(-44, -20, -36, -78); c.closePath();
      fs(c, '#FFFFFF', '#CFC8C2', 2.5);
      rr(c, -14, -50, 28, 16, 5); fs(c, '#F3EEE9', '#CFC8C2', 2);
    }
    // мордочка
    ell(c, 0, -94, 42, 27); fs(c, look.muzzle || look.belly);
    if (look.chef) { ell(c, 0, -95, 40, 25); fs(c, look.muzzle); }

    // шарф
    if (look.scarf || look.chef) {
      const col = look.chef ? '#E0473C' : look.scarf;
      c.beginPath(); c.moveTo(-46, -80); c.quadraticCurveTo(0, -60, 46, -80); c.lineTo(44, -68); c.quadraticCurveTo(0, -48, -44, -68); c.closePath(); fs(c, col, OL, 3);
      c.beginPath(); c.moveTo(10, -64); c.lineTo(24, -40); c.lineTo(6, -44); c.closePath(); fs(c, col, OL, 3);
      circ(c, 8, -64, 7); fs(c, col, OL, 3);
    }

    // лапки
    const hold = st.hold || [];
    if (hold.length) {
      // правая лапа держит тарелку на уровне плеча
      ell(c, 50, -90, 12, 10); fs(c, fur, OL, 3);
      if (hold.length > 1) { ell(c, -48, -84, 12, 10); fs(c, fur, OL, 3); }
    } else if (st.seated) {
      ell(c, -26, -52, 12, 9); fs(c, fur, OL, 3); ell(c, 26, -52, 12, 9); fs(c, fur, OL, 3);
    } else {
      const a = st.walk ? Math.sin(ph * 9) * 5 : 0;
      ell(c, -44, -60 + a, 11, 13, 0.3); fs(c, fur, OL, 3); ell(c, 44, -60 - a, 11, 13, -0.3); fs(c, fur, OL, 3);
    }

    // лицо
    const ex = st.expr || 'smile';
    drawFace(c, look, ex, ph);

    // аксессуары
    if (look.glasses) {
      c.lineWidth = 3.5; c.strokeStyle = '#3B2A20';
      circ(c, -22, -114, 15); c.stroke(); circ(c, 22, -114, 15); c.stroke();
      c.beginPath(); c.moveTo(-7, -116); c.quadraticCurveTo(0, -121, 7, -116); c.stroke();
      circ(c, -22, -114, 15); fs(c, 'rgba(255,255,255,0.12)');
      circ(c, 22, -114, 15); fs(c, 'rgba(255,255,255,0.12)');
    }
    if (look.bow) {
      c.save(); c.translate(30, -158); c.rotate(0.35);
      c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-24, -20, -30, 14, 0, 0); fs(c, look.bow, OL, 3);
      c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(24, -20, 30, 14, 0, 0); fs(c, look.bow, OL, 3);
      circ(c, 0, 0, 6); fs(c, shade(look.bow, -15), OL, 2.5);
      c.restore();
    }
    if (look.chef) drawChefHat(c, 2, -150, 0.8);

    c.restore();

    // тарелки в лапах (рисуем без отражения, чтобы еда не была зеркальной)
    if (hold.length) {
      const hx = x + 58 * s * face, hy = y + (bob - 96) * s;
      drawPlate(c, hx, hy, 0.95 * s, hold[0]);
      if (hold[1]) drawPlate(c, x - 52 * s * face, y + (bob - 90) * s, 0.85 * s, hold[1]);
      if (hold[2]) drawPlate(c, hx - 8 * s * face, hy - 30 * s, 0.8 * s, hold[2]);
    }
  }

  function drawFace(c, look, ex, ph) {
    const blink = (Math.sin(ph * 1.3) > 0.985);
    const eyeY = -114;
    // глаза
    if (ex === 'happy' || ex === 'eat' || blink) {
      c.strokeStyle = '#2A1A12'; c.lineWidth = 4.5; c.lineCap = 'round';
      [-22, 22].forEach((ex2) => { c.beginPath(); c.arc(ex2, eyeY + 4, 9, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); });
    } else {
      [-22, 22].forEach((ex2) => {
        if (look.chef) { ell(c, ex2, eyeY, 11, 12.5); fs(c, '#7A7380'); }
        ell(c, ex2, eyeY, 9, 10.5); fs(c, '#1E1410');
        circ(c, ex2 + 3, eyeY - 4, 3.8); fs(c, '#FFFFFF');
        circ(c, ex2 - 3, eyeY + 4, 1.8); fs(c, '#FFFFFF');
      });
      if (ex === 'angry') {
        c.strokeStyle = '#2A1A12'; c.lineWidth = 4;
        c.beginPath(); c.moveTo(-34, -132); c.lineTo(-12, -126); c.stroke();
        c.beginPath(); c.moveTo(34, -132); c.lineTo(12, -126); c.stroke();
      }
    }
    // щёчки
    ell(c, -38, -96, 12, 7); fs(c, 'rgba(255,128,140,0.5)');
    ell(c, 38, -96, 12, 7); fs(c, 'rgba(255,128,140,0.5)');
    // нос
    ell(c, 0, -102, look.chef ? 7.5 : 5.5, look.chef ? 5.5 : 4); fs(c, look.nose || '#F07A8A', look.chef ? '#C9506A' : null, 1.5);
    circ(c, -2, -104, 1.6); fs(c, 'rgba(255,255,255,0.7)');
    // рот
    c.strokeStyle = '#3A2018'; c.lineWidth = 2.6; c.lineCap = 'round';
    if (ex === 'angry') {
      c.beginPath(); c.arc(0, -84, 7, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
    } else if (ex === 'happy' || ex === 'eat') {
      c.beginPath(); c.moveTo(-8, -96); c.quadraticCurveTo(0, -82 + (ex === 'eat' ? Math.sin(ph * 14) * 2 : 0), 8, -96); c.closePath(); fs(c, '#B4414B', '#3A2018', 2.4);
      ell(c, 0, -90, 4, 2.5); fs(c, '#F57F8E');
    } else {
      c.beginPath(); c.arc(-4, -97, 4, 0.1, Math.PI - 0.1); c.stroke();
      c.beginPath(); c.arc(4, -97, 4, 0.1, Math.PI - 0.1); c.stroke();
    }
  }

  function drawChefHat(c, x, y, s) {
    c.save(); c.translate(x, y); c.scale(s, s); c.rotate(-0.08);
    rr(c, -38, -16, 76, 26, 8); fs(c, '#F4F1EE', OL, 3.5);
    c.beginPath();
    c.moveTo(-36, -12);
    c.bezierCurveTo(-62, -20, -56, -66, -28, -60);
    c.bezierCurveTo(-24, -92, 22, -94, 28, -62);
    c.bezierCurveTo(58, -68, 62, -20, 36, -12);
    c.closePath(); fs(c, lg(c, 0, -90, 0, -10, [[0, '#FFFFFF'], [1, '#ECE7E2']]), OL, 3.5);
    c.strokeStyle = 'rgba(160,150,140,0.5)'; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(-14, -18); c.quadraticCurveTo(-18, -40, -10, -56); c.stroke();
    c.beginPath(); c.moveTo(14, -18); c.quadraticCurveTo(18, -40, 10, -58); c.stroke();
    c.restore();
  }

  function shade(hex, pct) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const f = pct / 100;
    if (f > 0) { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; }
    else { r *= 1 + f; g *= 1 + f; b *= 1 + f; }
    return `rgb(${r | 0},${g | 0},${b | 0})`;
  }

  // ---------- столики и стулья ----------
  const CHAIR = '#D9443F', CHAIR_D = '#A92F2C', CHAIR_L = '#EE6A5E', LEG = '#9E5A2E';
  function chairBack(c, x, y) {    // дальний стул: видна спинка и сиденье
    ell(c, x, y + 36, 40, 10); fs(c, 'rgba(160,80,35,0.25)');
    c.lineWidth = 3;
    rr(c, x - 26, y - 6, 6, 40, 3); fs(c, LEG, OL, 2.5);
    rr(c, x + 20, y - 6, 6, 40, 3); fs(c, LEG, OL, 2.5);
    rr(c, x - 38, y - 92, 76, 88, 22); fs(c, LEG, OL, 3.5);
    rr(c, x - 31, y - 85, 62, 74, 18); fs(c, lg(c, 0, y - 85, 0, y - 11, [[0, CHAIR_L], [1, CHAIR]]), CHAIR_D, 2.5);
    ell(c, x, y + 5, 40, 14); fs(c, CHAIR_D, OL, 3);
    ell(c, x, y, 40, 14); fs(c, lg(c, 0, y - 14, 0, y + 14, [[0, CHAIR_L], [1, CHAIR]]), OL, 3);
    ell(c, x - 6, y - 4, 24, 5); fs(c, 'rgba(255,255,255,0.25)');
  }
  function chairFront(c, x, y) {   // ближний стул: видна спинка сзади
    ell(c, x, y + 56, 42, 11); fs(c, 'rgba(160,80,35,0.25)');
    rr(c, x - 30, y + 10, 7, 46, 3); fs(c, LEG, OL, 2.5);
    rr(c, x + 23, y + 10, 7, 46, 3); fs(c, LEG, OL, 2.5);
    ell(c, x, y + 6, 38, 13); fs(c, CHAIR_D, OL, 3);
    rr(c, x - 36, y - 40, 72, 58, 18); fs(c, LEG, OL, 3.5);
    rr(c, x - 29, y - 34, 58, 46, 14); fs(c, lg(c, 0, y - 34, 0, y + 12, [[0, CHAIR_L], [1, CHAIR]]), CHAIR_D, 2.5);
    rr(c, x - 20, y - 29, 30, 8, 4); fs(c, 'rgba(255,255,255,0.25)');
  }
  function scaled(c, t, fn) { c.save(); c.translate(t.x, t.y); c.scale(t.s || 1, t.s || 1); fn(); c.restore(); }
  function tableBackChairs(c, t) { scaled(c, t, () => { chairBack(c, -64, -36); chairBack(c, 72, -40); }); }
  function tableFrontChairs(c, t) { scaled(c, t, () => { chairFront(c, -70, 62); chairFront(c, 74, 58); }); }
  function tableTop(c, t, plates, highlight) { scaled(c, t, () => tableTop0(c, plates, highlight)); }
  function tableTop0(c, plates, highlight) {
    const x = 0, y = 0;
    // ножки
    ell(c, x, y + 84, 104, 26); fs(c, 'rgba(170,80,30,0.22)');
    [[-56, 30], [52, 30], [-4, 40]].forEach((p) => { rr(c, x + p[0] - 9, y + p[1] - 10, 18, 52, 5); fs(c, lg(c, x + p[0] - 9, 0, x + p[0] + 9, 0, [[0, '#C27838'], [1, '#93522A']]), OL, 3); });
    ell(c, x, y + 15, 114, 50); fs(c, '#C86A2A', OL, 3.5);
    ell(c, x, y, 114, 50); fs(c, lg(c, x - 114, y - 50, x + 114, y + 50, [[0, '#FFB061'], [1, '#DD7F36']]), OL, 3.5);
    ell(c, x - 30, y - 22, 52, 14, -0.1); fs(c, 'rgba(255,255,255,0.18)');
    ell(c, x, y, 98, 40); c.strokeStyle = 'rgba(190,120,60,0.35)'; c.lineWidth = 3; c.stroke();
    if (highlight) { ell(c, x, y, 118, 54); c.strokeStyle = 'rgba(255,255,255,' + highlight + ')'; c.lineWidth = 6; c.stroke(); }
    // ваза с ромашками
    const vx = x + 62, vy = y - 8;
    c.strokeStyle = '#4E8C2B'; c.lineWidth = 2.5;
    [[-10, -38], [0, -46], [11, -36], [5, -30]].forEach((p) => { c.beginPath(); c.moveTo(vx, vy - 14); c.lineTo(vx + p[0], vy + p[1]); c.stroke(); });
    [[-10, -38], [0, -46], [11, -36]].forEach((p) => daisy(c, vx + p[0], vy + p[1], 7));
    ell(c, vx + 8, vy - 28, 6, 3, -0.6); fs(c, '#6DB33F');
    c.beginPath(); c.moveTo(vx - 8, vy - 16); c.quadraticCurveTo(vx - 14, vy + 2, vx - 8, vy + 6); c.lineTo(vx + 8, vy + 6); c.quadraticCurveTo(vx + 14, vy + 2, vx + 8, vy - 16); c.closePath();
    fs(c, lg(c, vx - 10, 0, vx + 10, 0, [[0, '#7FCB5A'], [1, '#4E9E36']]), OL, 2.5);
    // тарелки
    const pos = [[-34, -4], [20, 10], [-4, 18]];
    (plates || []).forEach((d, i) => { const p = pos[i % 3]; drawPlate(c, x + p[0], y + p[1], 0.8, d); });
  }
  function pawsOnTable(c, x, y, fur) {
    ell(c, x - 22, y, 13, 9); fs(c, fur, OL, 3); ell(c, x - 22, y + 2, 6, 3); fs(c, 'rgba(255,170,170,0.6)');
    ell(c, x + 22, y, 13, 9); fs(c, fur, OL, 3); ell(c, x + 22, y + 2, 6, 3); fs(c, 'rgba(255,170,170,0.6)');
  }
  function daisy(c, x, y, r) {
    c.fillStyle = '#FFFFFF';
    for (let i = 0; i < 7; i++) { const a = (i / 7) * PI2; ell(c, x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7, r * 0.55, r * 0.3, a); c.fill(); }
    circ(c, x, y, r * 0.38); fs(c, '#FFC93C');
  }

  // ---------- растения ----------
  function plant(c, x, y, s, variant) {
    c.save(); c.translate(x, y); c.scale(s, s);
    const leafC = ['#6DBE45', '#58A936', '#7FCC52'];
    const r = seeded(17 + (variant || 0) * 31);
    // листья
    const n = 9;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (i / (n - 1) - 0.5) * 2.4 + (r() - 0.5) * 0.3;
      const len = 60 + r() * 34;
      c.save(); c.translate(0, -56); c.rotate(a + Math.PI / 2);
      c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-18, -len * 0.5, 0, -len); c.quadraticCurveTo(18, -len * 0.5, 0, 0); c.closePath();
      fs(c, leafC[i % 3], '#3F7F28', 2.5);
      c.beginPath(); c.moveTo(0, -4); c.lineTo(0, -len * 0.85); c.strokeStyle = 'rgba(40,90,30,0.45)'; c.lineWidth = 2; c.stroke();
      c.restore();
    }
    // горшок
    c.beginPath(); c.moveTo(-34, -60); c.lineTo(34, -60); c.lineTo(26, 0); c.lineTo(-26, 0); c.closePath();
    fs(c, lg(c, -34, 0, 34, 0, [[0, '#FFFFFF'], [1, '#E2DAD2']]), OL, 3);
    rr(c, -38, -66, 76, 14, 5); fs(c, '#F4EFEA', OL, 3);
    c.restore();
  }

  // ---------- задний план (кэшируется) ----------
  // geo: { VW, VH, ox, ext, MY } — экран шире/выше сцены 1230×1280: зал растягивается, кухня уезжает вниз
  function drawBackLayer(c, VW, VH, menu, geo) {
    geo = geo || { ox: 0, ext: 0, top: 0, MY: (y) => y };
    const ox = geo.ox, T = geo.top || 0;
    // пол
    c.fillStyle = '#F9BB86'; c.fillRect(0, 0, VW, VH);
    const r = seeded(7);
    for (let y = 252 + T, row = 0; y < VH; y += 36, row++) {
      let x = -((row * 137) % 260) + (ox % 260) - 260;
      while (x < VW) {
        const w = 170 + r() * 170, sh = r();
        c.fillStyle = sh < 0.33 ? '#FCC592' : sh < 0.66 ? '#F8B781' : '#FBBF8A';
        c.fillRect(x, y, w, 36);
        c.fillStyle = 'rgba(190,100,45,0.28)'; c.fillRect(x, y, 2.5, 36);
        x += w;
      }
      c.fillStyle = 'rgba(190,100,45,0.3)'; c.fillRect(0, y + 34, VW, 2.5);
    }
    // тёплый свет на полу зала
    const midY = geo.MY(480);
    c.fillStyle = rg(c, ox + 615, midY, 80, 560 + geo.ext * 0.4, [[0, 'rgba(255,240,200,0.28)'], [1, 'rgba(255,240,200,0)']]); c.fillRect(0, 250, VW, VH - 250);
    // стена (над ней — продолжение стены под вырез экрана)
    c.fillStyle = '#F2B48E'; c.fillRect(0, 0, VW, T + 1);
    c.save(); c.translate(0, T);
    c.fillStyle = lg(c, 0, 0, 0, 210, [[0, '#F2B48E'], [1, '#F9CDA8']]); c.fillRect(0, 0, VW, 210);
    c.fillStyle = 'rgba(232,170,120,0.13)'; for (let x = ox % 48 - 48; x < VW; x += 48) c.fillRect(x, -T, 20, 205 + T);
    // панели (вагонка)
    c.fillStyle = lg(c, 0, 196, 0, 262, [[0, '#BE6438'], [1, '#A04E28']]); c.fillRect(0, 196, VW, 64);
    c.fillStyle = 'rgba(110,55,25,0.35)'; for (let x = ox % 42 - 42 + 18; x < VW; x += 42) c.fillRect(x, 204, 3, 50);
    rr(c, -5, 188, VW + 10, 14, 4); fs(c, '#D98A55', OL, 3);
    c.fillStyle = '#93522A'; c.fillRect(0, 254, VW, 8);

    c.save(); c.translate(ox, 0);
    // окошко слева сверху и картина
    rr(c, -10, 18, 36, 92, 6); fs(c, '#BFE3F5', '#8E5A35', 5);
    rr(c, 14, 118, 46, 104, 4); fs(c, '#A8673C', OL, 3);
    rr(c, 21, 125, 32, 90, 2); fs(c, '#FFF6E8');
    c.strokeStyle = '#4E8C2B'; c.lineWidth = 2; c.beginPath(); c.moveTo(37, 205); c.lineTo(37, 160); c.stroke();
    for (let i = 0; i < 5; i++) { const a = i / 5 * PI2; ell(c, 37 + Math.cos(a) * 8, 158 + Math.sin(a) * 8, 6, 4, a); fs(c, '#6FA8E0'); }
    circ(c, 37, 158, 4); fs(c, '#FFC93C');
    door(c);
    windowRight(c);
    lamp(c, 410); lamp(c, 820);
    plant(c, 95, 282, 0.82, 1);
    plant(c, 412, 270, 0.85, 2);
    plant(c, 820, 262, 0.8, 3);
    plant(c, 905, 210, 0.66, 4);
    plant(c, 45, geo.MY(455) - T, 1.05, 5);
    if (geo.ext - T > 300) { plant(c, 1190, geo.MY(470) - T, 1.0, 9); plant(c, 40, geo.MY(640) - T, 0.95, 10); }
    chalkboard(c, menu);
    sign(c, 620, 108);
    c.restore();
    c.restore();
    // потолочные балки-арки по углам экрана
    c.fillStyle = '#A8673C';
    c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 70 + T); c.quadraticCurveTo(30, 12 + T, 130, 0); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(VW, 0); c.lineTo(VW, 70 + T); c.quadraticCurveTo(VW - 30, 12 + T, VW - 130, 0); c.closePath(); c.fill();
    c.fillRect(0, 0, VW, 10);
    // по бокам широкого экрана — растения
    if (ox > 90) {
      for (let x = ox - 90; x > -60; x -= 230) { plant(c, x, 300 + T, 1.0, x | 0); plant(c, VW - x, 300 + T, 1.0, (x | 0) + 3); }
      for (let x = ox - 70; x > -60; x -= 260) { plant(c, x, geo.MY(700), 1.1, (x | 0) + 5); plant(c, VW - x, geo.MY(700), 1.1, (x | 0) + 7); }
    }
  }
  function vignette(c, W, H) {
    c.fillStyle = rg(c, W / 2, H / 2, H * 0.42, H * 0.78, [[0, 'rgba(200,100,58,0)'], [1, 'rgba(200,100,58,0.22)']]);
    c.fillRect(0, 0, W, H);
  }

  function door(c) {
    // проём с улицей
    rr(c, 128, 86, 226, 222, 10); fs(c, '#7A4426', OL, 4);
    const g = lg(c, 0, 96, 0, 300, [[0, '#9ED8F5'], [0.55, '#CDEFFC'], [0.56, '#8CCB5E'], [1, '#6DB343']]);
    c.fillStyle = g; c.fillRect(140, 96, 202, 210);
    // кусты и флажки
    [[160, 220, 34], [220, 210, 30], [300, 222, 38], [340, 205, 26]].forEach((p) => { circ(c, p[0], p[1], p[2]); fs(c, '#5FA83A'); });
    c.strokeStyle = '#7A4426'; c.lineWidth = 2; c.beginPath(); c.moveTo(140, 110); c.quadraticCurveTo(240, 140, 342, 110); c.stroke();
    const fl = ['#E8483B', '#FFC93C', '#3E7FD6', '#7BC043', '#F06292'];
    for (let i = 0; i < 9; i++) { const t = (i + 0.5) / 9; const x = 140 + t * 202, y = 110 + Math.sin(t * Math.PI) * 22; c.beginPath(); c.moveTo(x - 8, y); c.lineTo(x + 8, y); c.lineTo(x, y + 16); c.closePath(); fs(c, fl[i % 5]); }
    // распахнутые створки
    leaf(c, [[128, 92], [192, 112], [192, 322], [128, 304]], 160);
    leaf(c, [[354, 92], [292, 112], [292, 322], [354, 304]], 323);
    // коврик
    rr(c, 190, 304, 140, 36, 8); fs(c, '#6E8AA8', '#4E6681', 3);
    c.strokeStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = 2; rr(c, 198, 310, 124, 24, 6); c.stroke();
  }
  function leaf(c, pts, hx) {
    c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < 4; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath();
    fs(c, lg(c, pts[0][0], 0, pts[1][0], 0, [[0, '#B4693A'], [1, '#C97C46']]), OL, 3.5);
    // стекло
    const l = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    const p0 = l(pts[0], pts[3], 0.08), p3 = l(pts[0], pts[3], 0.5), p1 = l(pts[1], pts[2], 0.08), p2 = l(pts[1], pts[2], 0.5);
    const inset = (p, q) => l(p, q, 0.18);
    const a = inset(p0, p1), b = inset(p1, p0), cc = inset(p2, p3), d = inset(p3, p2);
    c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(cc[0], cc[1]); c.lineTo(d[0], d[1]); c.closePath(); fs(c, '#A8DDF5', OL, 2.5);
    const q0 = l(pts[0], pts[3], 0.6), q1 = l(pts[1], pts[2], 0.6), q2 = l(pts[1], pts[2], 0.9), q3 = l(pts[0], pts[3], 0.9);
    const e = inset(q0, q1), f = inset(q1, q0), g2 = inset(q2, q3), h = inset(q3, q2);
    c.beginPath(); c.moveTo(e[0], e[1]); c.lineTo(f[0], f[1]); c.lineTo(g2[0], g2[1]); c.lineTo(h[0], h[1]); c.closePath(); fs(c, null, 'rgba(90,45,20,0.6)', 2.5);
    circ(c, hx, 212, 5); fs(c, '#F2C14E', OL, 2);
  }

  function windowRight(c) {
    rr(c, 940, 128, 270, 124, 6); fs(c, '#FFF3E4', OL, 4);
    c.fillStyle = lg(c, 0, 136, 0, 244, [[0, '#A9DDF6'], [0.6, '#D6F1FC'], [0.61, '#9BD27A'], [1, '#79BE52']]); c.fillRect(950, 136, 250, 108);
    c.fillStyle = '#FFF3E4'; c.fillRect(1072, 136, 8, 108); c.fillRect(950, 186, 250, 6);
    // маркиза
    const x0 = 928, x1 = 1222, n = 8, w = (x1 - x0) / n;
    for (let i = 0; i < n; i++) {
      c.beginPath(); c.moveTo(x0 + i * w + 10, 92); c.lineTo(x0 + (i + 1) * w + 10, 92); c.lineTo(x0 + (i + 1) * w, 138); c.arc(x0 + i * w + w / 2, 138, w / 2, 0, Math.PI); c.closePath();
      fs(c, i % 2 ? '#FFF4EA' : '#E8574E');
    }
    c.beginPath(); c.moveTo(x0 + 10, 92); c.lineTo(x1 + 10, 92); c.lineTo(x1, 138);
    for (let i = n - 1; i >= 0; i--) c.arc(x0 + i * w + w / 2, 138, w / 2, 0, Math.PI);
    c.closePath(); fs(c, null, OL, 3.5);
    rr(c, 922, 84, 308, 12, 5); fs(c, '#C9573F', OL, 3);
    // ящик с цветами
    rr(c, 946, 238, 260, 30, 6); fs(c, '#B86F3E', OL, 3);
    for (let i = 0; i < 9; i++) { const x = 960 + i * 29; circ(c, x, 232, 13); fs(c, '#6DBE45', '#3F7F28', 2); }
    [[968, 222], [1000, 214], [1034, 226], [1066, 212], [1100, 224], [1134, 214], [1168, 224], [1196, 216]].forEach((p, i) => {
      if (i % 3 === 1) { circ(c, p[0], p[1], 7); fs(c, '#F48FB1', OL, 1.5); circ(c, p[0], p[1], 2.5); fs(c, '#FFC93C'); }
      else daisy(c, p[0], p[1], 9);
    });
  }

  function lamp(c, x) {
    c.strokeStyle = '#5A3A26'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 50); c.stroke();
    c.fillStyle = rg(c, x, 96, 4, 120, [[0, 'rgba(255,236,170,0.75)'], [0.5, 'rgba(255,226,160,0.3)'], [1, 'rgba(255,220,150,0)']]); c.fillRect(x - 150, 0, 300, 260);
    rr(c, x - 8, 44, 16, 12, 3); fs(c, '#7A4A2A', OL, 2.5);
    c.beginPath(); c.moveTo(x - 10, 56); c.bezierCurveTo(x - 34, 60, x - 46, 82, x - 48, 94); c.lineTo(x + 48, 94); c.bezierCurveTo(x + 46, 82, x + 34, 60, x + 10, 56); c.closePath();
    fs(c, lg(c, x - 48, 0, x + 48, 0, [[0, '#8B4E2B'], [0.5, '#B8703F'], [1, '#7A4224']]), OL, 3);
    ell(c, x, 95, 48, 8); fs(c, '#5E3218', OL, 2.5);
    circ(c, x, 104, 14); fs(c, rg(c, x, 104, 2, 16, [[0, '#FFFBEA'], [1, '#FFD36B']]), '#E0A33A', 2);
  }

  function chalkboard(c, menu) {
    // ножки мольберта
    c.strokeStyle = OL; c.lineWidth = 4;
    rr(c, 1072, 380, 12, 36, 4); fs(c, '#A8673C', OL, 3);
    rr(c, 1192, 380, 12, 36, 4); fs(c, '#A8673C', OL, 3);
    rr(c, 1062, 168, 152, 222, 10); fs(c, '#B8703F', OL, 4);
    rr(c, 1074, 180, 128, 198, 6); fs(c, '#33403A');
    text(c, 'Меню:', 1138, 210, 26, '#F4F1EA', { weight: 800 });
    const list = (menu || []).slice(0, 5);
    const step = list.length > 3 ? 160 / list.length : 52;
    list.forEach((d, i) => {
      const y = 252 + i * step;
      drawFood(c, d, 1112, y, list.length > 3 ? 0.32 : 0.4);
      c.strokeStyle = 'rgba(244,241,234,0.85)'; c.lineWidth = 3; c.setLineDash([8, 6]);
      c.beginPath(); c.moveTo(1140, y + 4); c.lineTo(1188, y + 4); c.stroke(); c.setLineDash([]);
    });
  }

  function sign(c, x, y) {
    ell(c, x, y + 6, 160, 86); fs(c, 'rgba(90,45,20,0.25)');
    ell(c, x, y, 158, 84); fs(c, lg(c, 0, y - 84, 0, y + 84, [[0, '#B5703F'], [1, '#8B4A26']]), OL, 4);
    ell(c, x, y, 140, 68); fs(c, lg(c, 0, y - 68, 0, y + 68, [[0, '#9A5832'], [1, '#7B3F1F']]), '#C98652', 3);
    c.save();
    c.font = `400 86px "Pacifico", "Segoe Script", cursive`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineWidth = 10; c.strokeStyle = '#5A2D14'; c.lineJoin = 'round'; c.strokeText('Elina', x, y - 8);
    c.fillStyle = lg(c, 0, y - 50, 0, y + 30, [[0, '#FFF8EC'], [1, '#F6DDBE']]); c.fillText('Elina', x, y - 8);
    c.restore();
    text(c, 'Ресторан', x, y + 50, 25, '#FFF1DF', { weight: 800 });
    drawChefHat(c, x, y - 66, 0.5);
  }

  // ---------- передний план (кухня и раздача, кэшируется) ----------
  function drawFrontLayer(c, VW, VH, menu, geo) {
    geo = geo || { ox: 0, ext: 0 };
    c.save(); c.translate(geo.ox, geo.ext);
    // проход между стойками (плитка)
    c.fillStyle = '#EADFD6'; c.fillRect(560, 812, 272, 290);
    c.strokeStyle = 'rgba(160,140,125,0.45)'; c.lineWidth = 2;
    for (let y = 812; y < 1102; y += 48) { c.beginPath(); c.moveTo(560, y); c.lineTo(832, y); c.stroke(); }
    for (let x = 560; x < 832; x += 68) { c.beginPath(); c.moveTo(x, 812); c.lineTo(x, 1102); c.stroke(); }
    // ящик с ингредиентами
    rr(c, 34, 756, 528, 146, 16); fs(c, lg(c, 0, 756, 0, 902, [[0, '#E89C57'], [0.45, '#D9874A'], [1, '#C4733D']]), OL, 4);
    rr(c, 34, 756, 528, 24, 12); fs(c, '#F0AD68', OL, 3);
    rr(c, 60, 778, 476, 76, 10); fs(c, '#AEB4BE', OL, 3);
    const bins = [['lettuce', 70], ['tomato', 188], ['cheese', 306], ['patty', 424]];
    bins.forEach((b) => {
      rr(c, b[1], 786, 104, 60, 8); fs(c, lg(c, 0, 786, 0, 846, [[0, '#F4F6F8'], [1, '#C9CED6']]), '#7E8590', 2.5);
      ingredient(c, b[0], b[1] + 52, 816);
    });
    c.fillStyle = 'rgba(90,40,15,0.25)'; c.fillRect(48, 866, 500, 4);
    // кнопочка-таймер
    rr(c, 312, 740, 30, 18, 6); fs(c, '#8F96A3', OL, 2.5); ell(c, 327, 740, 15, 6); fs(c, '#C5CAD3', OL, 2.5);

    // плита
    rr(c, 38, 892, 684, 220, 18); fs(c, lg(c, 0, 892, 0, 1112, [[0, '#D9874A'], [1, '#B8663A']]), OL, 4);
    rr(c, 52, 902, 656, 140, 12); fs(c, lg(c, 0, 902, 0, 1042, [[0, '#D5D9E0'], [1, '#AEB4BE']]), OL, 3.5);
    // конфорки
    burner(c, 185, 978); burner(c, 392, 978);
    // разделочная доска
    rr(c, 512, 922, 180, 108, 12); fs(c, lg(c, 0, 922, 0, 1030, [[0, '#E8A764'], [1, '#CF8A4C']]), OL, 3.5);
    circ(c, 675, 940, 6); fs(c, '#B8703F', OL, 2);
    c.fillStyle = 'rgba(255,255,255,0.15)'; rr(c, 522, 930, 160, 10, 5); c.fill();
    // фронт кухни
    rr(c, 38, 1042, 684, 70, 16); fs(c, lg(c, 0, 1042, 0, 1112, [[0, '#C97A42'], [1, '#A95F32']]), OL, 3.5);
    c.fillStyle = 'rgba(80,35,10,0.25)'; for (let x = 120; x < 700; x += 150) c.fillRect(x, 1052, 3, 50);
    // ступенька в проходе
    rr(c, 722, 1040, 112, 70, 6); fs(c, '#D6CCC4', '#A69A90', 3);

    // стойка раздачи
    rr(c, 836, 764, 380, 160, 14); fs(c, lg(c, 0, 764, 0, 924, [[0, '#E89C57'], [1, '#C4733D']]), OL, 4);
    rr(c, 836, 764, 380, 56, 12); fs(c, lg(c, 0, 764, 0, 820, [[0, '#F4B672'], [1, '#E39A55']]), OL, 3.5);
    rr(c, 912, 776, 284, 34, 8); fs(c, '#F4F2EF', '#B9B2AA', 2.5);
    // полки с посудой
    rr(c, 856, 836, 92, 76, 6); fs(c, lg(c, 856, 836, 948, 912, [[0, '#9CCDE8'], [1, '#6FA6C8']]), OL, 3); glare(c, 856, 836, 92, 76);
    rr(c, 958, 836, 98, 76, 6); fs(c, '#8E4E28', OL, 3);
    for (let i = 0; i < 5; i++) { ell(c, 1007, 896 - i * 11, 40, 10); fs(c, '#FFFFFF', '#B9B2AA', 2); }
    rr(c, 1066, 836, 138, 76, 6); fs(c, lg(c, 1066, 836, 1204, 912, [[0, '#9CCDE8'], [1, '#6FA6C8']]), OL, 3); glare(c, 1066, 836, 138, 76);
    // нижний стол
    rr(c, 836, 928, 394, 168, 14); fs(c, lg(c, 0, 928, 0, 1096, [[0, '#E39A55'], [1, '#C4733D']]), OL, 4);
    rr(c, 836, 928, 394, 62, 12); fs(c, lg(c, 0, 928, 0, 990, [[0, '#F1B06C'], [1, '#DF9654']]), OL, 3.5);
    c.fillStyle = 'rgba(80,35,10,0.25)'; c.fillRect(1100, 990, 3, 100);

    // кофемашина (если кофе в меню)
    if (menu && menu.indexOf('coffee') >= 0) coffeeMachine(c, 872, 812);

    // растения на переднем плане
    plant(c, 1200, 830, 0.95, 6);
    plant(c, 38, 812, 0.8, 7);
    plant(c, 30, 1290, 1.3, 8);
    c.restore();
  }

  function glare(c, x, y, w, h) {
    c.save(); rr(c, x + 3, y + 3, w - 6, h - 6, 4); c.clip();
    c.fillStyle = 'rgba(255,255,255,0.35)';
    c.beginPath(); c.moveTo(x + w * 0.2, y); c.lineTo(x + w * 0.45, y); c.lineTo(x + w * 0.15, y + h); c.lineTo(x - w * 0.1, y + h); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(x + w * 0.55, y); c.lineTo(x + w * 0.62, y); c.lineTo(x + w * 0.32, y + h); c.lineTo(x + w * 0.25, y + h); c.closePath(); c.fill();
    c.restore();
  }
  function ingredient(c, kind, x, y) {
    const r = seeded(kind.length * 13);
    if (kind === 'lettuce') {
      for (let i = 0; i < 9; i++) { ell(c, x - 36 + (i % 5) * 18 + r() * 4, y - 10 + Math.floor(i / 5) * 18 + r() * 4, 16, 11, r() * 2); fs(c, i % 2 ? '#7BC843' : '#63B33A', '#3F7F28', 2); }
    } else if (kind === 'tomato') {
      [[-30, -8], [-6, -12], [18, -8], [-20, 10], [6, 8], [30, 10]].forEach((p) => { circ(c, x + p[0], y + p[1], 15); fs(c, '#E8483B', '#9E2A1B', 2); circ(c, x + p[0], y + p[1], 9); fs(c, '#F27A6A'); });
    } else if (kind === 'cheese') {
      [[-30, -6, 0.2], [-6, -10, -0.15], [18, -6, 0.25], [-18, 10, 0.05], [8, 10, -0.2], [32, 8, 0.1]].forEach((p) => { c.save(); c.translate(x + p[0], y + p[1]); c.rotate(p[2]); rr(c, -14, -10, 28, 20, 3); fs(c, '#FFD45A', '#D9A21E', 2); c.restore(); });
    } else if (kind === 'patty') {
      [[-26, -6], [0, -10], [26, -6], [-14, 10], [12, 10]].forEach((p) => { ell(c, x + p[0], y + p[1], 20, 13); fs(c, '#7A4024', '#4A2312', 2); ell(c, x + p[0] - 4, y + p[1] - 3, 9, 4); fs(c, 'rgba(255,255,255,0.15)'); });
    }
  }

  function burner(c, x, y) {
    ell(c, x, y + 4, 80, 50); fs(c, '#4A4E57', OL, 3);
    ell(c, x, y, 70, 42); fs(c, '#2E3138');
    c.strokeStyle = '#5D626D'; c.lineWidth = 4;
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 4; c.beginPath(); c.moveTo(x + Math.cos(a) * 68, y + Math.sin(a) * 40); c.lineTo(x - Math.cos(a) * 68, y - Math.sin(a) * 40); c.stroke(); }
  }

  function coffeeMachine(c, x, y) {
    rr(c, x - 30, y - 92, 60, 92, 10); fs(c, lg(c, x - 30, 0, x + 30, 0, [[0, '#E0E3E8'], [1, '#9EA4AE']]), OL, 3);
    rr(c, x - 24, y - 84, 48, 20, 5); fs(c, '#4A4E57');
    circ(c, x - 10, y - 74, 4); fs(c, '#7BC843'); circ(c, x + 6, y - 74, 4); fs(c, '#E8483B');
    rr(c, x - 14, y - 58, 28, 12, 3); fs(c, '#5D626D', OL, 2);
    rr(c, x - 24, y - 12, 48, 8, 3); fs(c, '#5D626D', OL, 2);
  }

  // ---------- кухня: динамика ----------
  function drawStationFx(c, g, time) {
    const busy = {};
    for (const j of g.cooking) (busy[j.station] = busy[j.station] || []).push(j);
    // сковорода
    flameIf(c, 185, 990, !!busy.pan, time);
    pan(c, 185, 968, busy.pan, time);
    // кастрюля
    flameIf(c, 392, 990, !!busy.pot, time);
    pot(c, 392, 952, !!busy.pot, time);
    // доска
    const bj = busy.board || [];
    if (bj.length) {
      bj.slice(0, 2).forEach((j, i) => {
        const p = j.t / j.total;
        c.globalAlpha = 0.45 + 0.55 * p;
        drawFood(c, j.dish, 575 + i * 70, 978, 0.48);
        c.globalAlpha = 1;
      });
    } else {
      circ(c, 570, 978, 26); fs(c, '#E8483B', '#9E2A1B', 2.5); circ(c, 570, 978, 17); fs(c, '#F27A6A');
      [[0, 0], [-4, -6], [5, -5], [-6, 4], [6, 5]].forEach((q) => { ell(c, 570 + q[0], 978 + q[1], 2, 3.5); fs(c, '#FFE2A8'); });
      ell(c, 640, 975, 30, 22, 0.3); fs(c, '#7BC843', '#3F7F28', 2.5); ell(c, 648, 968, 18, 14, -0.4); fs(c, '#8FD459', '#3F7F28', 2);
    }
    // зелень
    if (busy.greens) sparkle(c, 300, 805, time);
    // кофе
    if (busy.coffee && g.L.menu.indexOf('coffee') >= 0) {
      steam(c, 872, 760, time);
      drawFood(c, 'coffee', 872, 800, 0.26);
    }
    // кольца прогресса над станциями
    const ringPos = { pan: [185, 900], pot: [392, 900], board: [602, 905], greens: [300, 744], coffee: [872, 700] };
    for (const st in busy) {
      const j = busy[st][0], p = ringPos[st]; if (!p) continue;
      progressRing(c, p[0], p[1], 22, j.t / j.total, j.dish);
    }
  }
  function flameIf(c, x, y, on, time) {
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * PI2, fx = x + Math.cos(a) * 54, fy = y + Math.sin(a) * 28;
      const h = (on ? 16 : 9) + Math.sin(time * 18 + i * 1.7) * (on ? 5 : 2);
      c.beginPath(); c.moveTo(fx - 7, fy); c.quadraticCurveTo(fx - 4, fy - h * 0.6, fx, fy - h); c.quadraticCurveTo(fx + 4, fy - h * 0.6, fx + 7, fy); c.closePath();
      fs(c, lg(c, 0, fy - h, 0, fy, [[0, '#FFE066'], [1, '#FF7A1A']]));
    }
  }
  function pan(c, x, y, jobs, time) {
    c.save(); c.translate(x + 50, y - 10); c.rotate(-0.45); rr(c, 0, -8, 86, 16, 8); fs(c, '#2E3138', OL, 3); c.restore();
    ell(c, x, y + 7, 60, 33); fs(c, '#2B2E35', OL, 3.5);
    ell(c, x, y, 56, 29); fs(c, lg(c, 0, y - 30, 0, y + 30, [[0, '#4B505B'], [1, '#2A2D34']]));
    ell(c, x - 16, y - 10, 20, 7, -0.2); fs(c, 'rgba(255,255,255,0.14)');
    if (jobs) {
      jobs.slice(0, 2).forEach((j, i) => {
        const p = j.t / j.total, px = x - 20 + i * 40, py = y + 2;
        ell(c, px, py, 24, 13); fs(c, p > 0.5 ? '#6B3A1F' : '#B0574A', '#3A1D0E', 2);
        if (Math.sin(time * 20 + i) > 0) { circ(c, px + 10, py - 14 - (time * 30 % 10), 2.5); fs(c, 'rgba(255,240,200,0.8)'); }
      });
      steam(c, x - 10, y - 30, time);
    }
  }
  function pot(c, x, y, on, time) {
    rr(c, x - 78, y - 6, 18, 14, 6); fs(c, '#A9AFB9', OL, 3); rr(c, x + 60, y - 6, 18, 14, 6); fs(c, '#A9AFB9', OL, 3);
    c.beginPath(); c.moveTo(x - 64, y - 10); c.lineTo(x - 60, y + 40); c.quadraticCurveTo(x, y + 58, x + 60, y + 40); c.lineTo(x + 64, y - 10); c.closePath();
    fs(c, lg(c, x - 64, 0, x + 64, 0, [[0, '#C9CED6'], [0.5, '#EEF0F3'], [1, '#9EA4AE']]), OL, 3.5);
    ell(c, x, y - 10, 64, 24); fs(c, '#D5D9E0', OL, 3.5);
    ell(c, x, y - 8, 56, 18); fs(c, '#F08A2E');
    [[-26, -10, '#7BC843'], [-8, -14, '#FFD45A'], [12, -6, '#E8483B'], [30, -12, '#7BC843'], [0, -2, '#F4B565'], [-34, -4, '#FFD45A'], [22, -2, '#7BC843']].forEach((p) => { rr(c, x + p[0] - 5, y + p[1] - 4, 10, 8, 3); fs(c, p[2]); });
    if (on) {
      for (let i = 0; i < 4; i++) { const bx = x - 30 + i * 20, by = y - 10 + Math.sin(time * 7 + i * 2) * 3; circ(c, bx, by, 3 + (Math.sin(time * 9 + i) + 1) * 1.5); fs(c, 'rgba(255,200,140,0.9)'); }
      steam(c, x, y - 34, time);
    }
  }
  function steam(c, x, y, time) {
    c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 5; c.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const o = ((time * 0.8 + i / 3) % 1);
      c.globalAlpha = 1 - o;
      const sx = x - 18 + i * 18, sy = y - o * 40;
      c.beginPath(); c.moveTo(sx, sy); c.bezierCurveTo(sx - 9, sy - 10, sx + 9, sy - 18, sx, sy - 28); c.stroke();
    }
    c.globalAlpha = 1;
  }
  function sparkle(c, x, y, time) {
    for (let i = 0; i < 4; i++) {
      const a = time * 3 + i * 1.6, r = 18 + (i % 2) * 10;
      star4(c, x + Math.cos(a) * r, y + Math.sin(a) * r * 0.5 - 10, 6 + Math.sin(time * 10 + i) * 2, '#FFFFFF');
    }
  }
  function star4(c, x, y, r, col) {
    c.beginPath(); c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r); c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.closePath(); fs(c, col);
  }
  function progressRing(c, x, y, r, p, dish) {
    circ(c, x, y, r + 5); fs(c, '#FFFFFF', '#E3B98B', 3);
    c.beginPath(); c.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + PI2 * Math.min(1, p)); c.strokeStyle = '#7CC242'; c.lineWidth = 6; c.lineCap = 'round'; c.stroke();
    drawFood(c, dish, x, y, 0.26);
  }

  function drawPass(c, g) {
    const S = root.Elina.PASS_SLOTS;
    g.pass.forEach((d, i) => { const p = S[i]; drawPlate(c, p.x, p.y, 0.8, d); });
  }

  // ---------- облачка ----------
  function bubble(c, x, y, items, ratio, opts) {
    opts = opts || {};
    const n = Math.max(1, items.length);
    const w = n === 1 ? 84 : 140, h = 84;
    const bx = x - w / 2, by = y - h / 2;
    c.save();
    if (opts.pop) { c.translate(x, y + h / 2); c.scale(opts.pop, opts.pop); c.translate(-x, -(y + h / 2)); }
    // хвостик
    c.beginPath(); c.moveTo(x - 26, y + 26); c.lineTo(x - 44, y + 58); c.lineTo(x - 6, y + 36); c.closePath(); fs(c, '#FFFFFF', '#D9C3AE', 3);
    rr(c, bx, by, w, h, 42); fs(c, '#FFFFFF', '#D9C3AE', 3);
    c.beginPath(); c.moveTo(x - 24, y + 30); c.lineTo(x - 8, y + 34); c.lineTo(x - 8, y + 26); c.closePath(); fs(c, '#FFFFFF');
    if (ratio != null) {
      // полоска терпения по краю
      const col = ratio > 0.55 ? '#7CC242' : ratio > 0.28 ? '#FFB830' : '#F0473C';
      c.save(); rr(c, bx - 1, by - 1, w + 2, h + 2, 43); c.clip();
      c.beginPath(); c.moveTo(x, by + h + 10);
      const ang = -Math.PI / 2 - PI2 * ratio;
      c.arc(x, y, w, -Math.PI / 2, ang, true); c.closePath();
      c.restore();
      c.lineWidth = 4; c.strokeStyle = col; c.lineCap = 'round';
      c.globalAlpha = ratio > 0.55 ? 0.6 : 1;
      perimeterArc(c, bx + 3, by + 3, w - 6, h - 6, ratio);
      c.globalAlpha = 1;
      if (ratio < 0.28 && opts.time) { c.globalAlpha = 0.5 + 0.5 * Math.sin(opts.time * 14); perimeterArc(c, bx + 3, by + 3, w - 6, h - 6, ratio); c.globalAlpha = 1; }
    }
    if (opts.heart) heart(c, x, y + 2, 26);
    else if (opts.angry) angryMark(c, x, y);
    else items.forEach((d, i) => drawFood(c, d, n === 1 ? x : x - 32 + i * 64, y + 4, n === 1 ? 0.56 : 0.48));
    if (opts.coming) { circ(c, bx + w - 4, by + 6, 15); fs(c, '#7CC242', '#FFFFFF', 3); c.strokeStyle = '#FFFFFF'; c.lineWidth = 4; c.beginPath(); c.moveTo(bx + w - 11, by + 6); c.lineTo(bx + w - 5, by + 12); c.lineTo(bx + w + 4, by + 0); c.stroke(); }
    c.restore();
  }
  function perimeterArc(c, x, y, w, h, ratio) {
    // рисуем часть контура скруглённого прямоугольника (по часовой, от верхней середины)
    const r = h / 2, straight = w - 2 * r, total = 2 * straight + PI2 * r;
    let left = total * Math.max(0, Math.min(1, ratio));
    c.beginPath(); const cx = x + w / 2; c.moveTo(cx, y);
    const seg = (len, fn) => { const l = Math.min(left, len); if (l > 0) fn(l / len); left -= l; };
    seg(straight / 2, (k) => c.lineTo(cx + straight / 2 * k, y));
    seg(Math.PI * r, (k) => c.arc(x + w - r, y + r, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * k));
    seg(straight, (k) => c.lineTo(x + w - r - straight * k, y + h));
    seg(Math.PI * r, (k) => c.arc(x + r, y + r, r, Math.PI / 2, Math.PI / 2 + Math.PI * k));
    seg(straight / 2, (k) => c.lineTo(x + r + straight / 2 * k, y));
    c.stroke();
  }
  function heart(c, x, y, s) {
    c.beginPath(); c.moveTo(x, y + s * 0.8);
    c.bezierCurveTo(x - s * 1.4, y - s * 0.1, x - s * 0.7, y - s * 1.1, x, y - s * 0.45);
    c.bezierCurveTo(x + s * 0.7, y - s * 1.1, x + s * 1.4, y - s * 0.1, x, y + s * 0.8);
    c.closePath(); fs(c, lg(c, 0, y - s, 0, y + s, [[0, '#FF6F8A'], [1, '#E53958']]), '#B8243F', 2.5);
    ell(c, x - s * 0.45, y - s * 0.35, s * 0.2, s * 0.12, -0.6); fs(c, 'rgba(255,255,255,0.7)');
  }
  function angryMark(c, x, y) {
    c.strokeStyle = '#E53935'; c.lineWidth = 6; c.lineCap = 'round';
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach((q) => { c.beginPath(); c.moveTo(x + q[0] * 6, y + q[1] * 20); c.quadraticCurveTo(x + q[0] * 8, y + q[1] * 8, x + q[0] * 20, y + q[1] * 6); c.stroke(); });
  }

  // ---------- HUD ----------
  const CREAM = '#FFF6E8', BORDER = '#E6C49C', BROWN = '#4A2C1A';
  function pill(c, x, y, w, h) {
    rr(c, x, y + 4, w, h, h / 2); fs(c, 'rgba(120,60,20,0.18)');
    rr(c, x, y, w, h, h / 2); fs(c, lg(c, 0, y, 0, y + h, [[0, '#FFFBF3'], [1, '#FCEBD5']]), BORDER, 4);
  }
  function coinIcon(c, x, y, r) {
    circ(c, x, y + 3, r); fs(c, '#C9780F');
    circ(c, x, y, r); fs(c, lg(c, 0, y - r, 0, y + r, [[0, '#FFE066'], [1, '#F5A623']]), '#D98A1C', 3);
    circ(c, x, y, r * 0.74); fs(c, null, 'rgba(200,120,20,0.6)', 3);
    text(c, '$', x, y + 2, r * 1.1, '#FFF3C4', { stroke: '#D27F12', lw: 5 });
  }
  function hudCoins(c, coins, goal) {
    pill(c, 30, 22, 276, 70);
    coinIcon(c, 70, 57, 40);
    text(c, String(coins), 186, 58, 42, BROWN);
    circ(c, 268, 57, 24); fs(c, lg(c, 0, 33, 0, 81, [[0, '#8AD45A'], [1, '#5BAE36']]), '#3F8A23', 3);
    c.strokeStyle = '#FFFFFF'; c.lineWidth = 6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(256, 57); c.lineTo(280, 57); c.moveTo(268, 45); c.lineTo(268, 69); c.stroke();
    if (goal) {
      const p = Math.min(1, coins / goal);
      rr(c, 112, 98, 150, 8, 4); fs(c, 'rgba(243,220,192,0.9)', BORDER, 1.5);
      if (p > 0) { rr(c, 113, 99, Math.max(6, 148 * p), 6, 3); fs(c, p >= 1 ? '#FFC93C' : '#7CC242'); }
      text(c, `цель ${goal}`, 268, 103, 12, BROWN, { weight: 800, align: 'left', stroke: 'rgba(255,246,232,0.8)', lw: 3 });
    }
  }
  function hudTimer(c, secs, time) {
    pill(c, 924, 22, 202, 70);
    const warn = secs <= 15 && secs > 0;
    circ(c, 964, 57, 38); fs(c, lg(c, 0, 19, 0, 95, [[0, '#FFB84D'], [1, '#EE8A1E']]), '#C96A10', 3);
    circ(c, 964, 57, 28); fs(c, '#FFFDF8', '#C96A10', 2);
    c.strokeStyle = BROWN; c.lineWidth = 4; c.lineCap = 'round';
    c.beginPath(); c.moveTo(964, 57); c.lineTo(964, 39); c.moveTo(964, 57); c.lineTo(977, 62); c.stroke();
    for (let i = 0; i < 12; i++) { const a = i / 12 * PI2; circ(c, 964 + Math.cos(a) * 23, 57 + Math.sin(a) * 23, 1.6); fs(c, '#C96A10'); }
    const m = Math.floor(secs / 60), s = Math.floor(secs % 60);
    const str = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    const sc = warn ? 1 + 0.06 * Math.sin(time * 10) : 1;
    text(c, str, 1062, 58, 42 * sc, warn ? '#E53935' : BROWN);
  }
  function hudPause(c, paused) {
    rr(c, 1140, 26, 76, 70, 18); fs(c, 'rgba(120,60,20,0.18)');
    rr(c, 1140, 22, 76, 70, 18); fs(c, lg(c, 0, 22, 0, 92, [[0, '#FFFBF3'], [1, '#FCEBD5']]), BORDER, 4);
    if (paused) { c.beginPath(); c.moveTo(1166, 38); c.lineTo(1196, 57); c.lineTo(1166, 76); c.closePath(); fs(c, '#7A3E1E'); }
    else { rr(c, 1161, 39, 12, 36, 4); fs(c, '#7A3E1E'); rr(c, 1183, 39, 12, 36, 4); fs(c, '#7A3E1E'); }
  }
  // слоты блюд снизу; возвращает массив хит-боксов
  function hudDishBar(c, g, time, flash) {
    const menu = g.L.menu, n = menu.length;
    const x0 = 300, y0 = 1090, w = 636, h = 166;
    rr(c, x0, y0 + 6, w, h, 40); fs(c, 'rgba(120,60,20,0.2)');
    rr(c, x0, y0, w, h, 40); fs(c, lg(c, 0, y0, 0, y0 + h, [[0, '#FBE0BF'], [1, '#F6C99A']]), '#E4A970', 5);
    const pad = 22, gap = n > 4 ? 10 : 22;
    const sw = (w - pad * 2 - gap * (n - 1)) / n;
    const boxes = [];
    const free = g.freeStoveSlots() > 0;
    menu.forEach((d, i) => {
      const sx = x0 + pad + i * (sw + gap), sy = y0 + 18, sh = h - 36;
      const fl = flash && flash[d] ? flash[d] : 0;
      c.save();
      if (fl > 0) { c.translate(Math.sin(time * 60) * 6 * fl, 0); }
      rr(c, sx, sy + 4, sw, sh, 24); fs(c, 'rgba(160,100,50,0.15)');
      rr(c, sx, sy, sw, sh, 24); fs(c, free ? '#FFFDF8' : '#F2E9DF', fl > 0 ? '#E53935' : '#F0D3B0', 3);
      const iconS = Math.min(0.92, sw / 120);
      if (!free) c.globalAlpha = 0.75;
      drawFood(c, d, sx + sw / 2, sy + 56, iconS);
      c.globalAlpha = 1;
      // прогресс
      let p = 0, cnt = 0;
      for (const j of g.cooking) if (j.dish === d) { cnt++; p = Math.max(p, j.t / j.total); }
      const bx = sx + 16, bw = sw - 32, by = sy + sh - 30;
      rr(c, bx, by, bw, 18, 9); fs(c, '#E9E1D6', '#D8CBBB', 2);
      if (p > 0) { rr(c, bx + 2, by + 2, Math.max(14, (bw - 4) * p), 14, 7); fs(c, lg(c, 0, by, 0, by + 18, [[0, '#9BD964'], [1, '#62B238']])); rr(c, bx + 6, by + 4, Math.max(4, (bw - 12) * p), 4, 2); fs(c, 'rgba(255,255,255,0.4)'); }
      const ready = g.pass.filter((x) => x === d).length + g.chef.hands.filter((x) => x === d).length;
      if (ready) { circ(c, sx + sw - 14, sy + 14, 17); fs(c, '#7CC242', '#FFFFFF', 3); text(c, String(ready), sx + sw - 14, sy + 15, 20, '#FFFFFF'); }
      if (cnt > 1) { text(c, '×' + cnt, sx + 22, sy + 18, 18, '#62B238'); }
      if (n <= 6) text(c, String(i + 1), sx + 14, sy + sh - 44, 13, 'rgba(74,44,26,0.35)', { weight: 800, align: 'left' });
      c.restore();
      boxes.push({ dish: d, x: sx, y: sy, w: sw, h: sh });
    });
    return boxes;
  }
  function hudChefBtn(c, badge, time) {
    rr(c, 34, 1104, 142, 142, 34); fs(c, 'rgba(120,60,20,0.2)');
    rr(c, 34, 1098, 142, 142, 34); fs(c, lg(c, 0, 1098, 0, 1240, [[0, '#FFF8EE'], [1, '#F8DFC0']]), BORDER, 5);
    drawChefHat(c, 105, 1196, 0.82);
    if (badge) {
      const s = 1 + 0.08 * Math.sin(time * 6);
      c.save(); c.translate(162, 1110); c.scale(s, s);
      circ(c, 0, 0, 24); fs(c, '#E53935', '#FFFFFF', 4);
      text(c, '!', 0, 2, 30, '#FFFFFF');
      c.restore();
    }
  }
  function hudBoostBtn(c, boostT, boostCd, time) {
    const x = 1122, y = 1170, r = 76;
    circ(c, x, y + 6, r); fs(c, 'rgba(120,60,20,0.25)');
    if (boostT > 0) { circ(c, x, y, r + 10 + Math.sin(time * 12) * 4); fs(c, 'rgba(255,215,90,0.45)'); }
    circ(c, x, y, r); fs(c, lg(c, 0, y - r, 0, y + r, [[0, '#FFD45A'], [1, '#F29A1B']]), '#FFFFFF', 7);
    circ(c, x, y, r + 3.5); fs(c, null, '#E08A10', 2);
    // кроссовок
    c.save(); c.translate(x + 4, y + 4); c.rotate(-0.12);
    // пыль
    [[-46, 30, 12], [-58, 18, 9], [-40, 40, 8]].forEach((p) => { circ(c, p[0], p[1], p[2]); fs(c, 'rgba(160,110,60,0.55)'); });
    c.beginPath(); c.moveTo(-42, 14); c.quadraticCurveTo(-44, -16, -26, -22); c.lineTo(-6, -24); c.quadraticCurveTo(4, -6, 22, -2); c.quadraticCurveTo(46, 2, 48, 18); c.closePath();
    fs(c, lg(c, 0, -24, 0, 18, [[0, '#4D8FEA'], [1, '#2F6CC9']]), '#1F3F78', 3.5);
    rr(c, -46, 12, 98, 14, 7); fs(c, '#FFFFFF', '#1F3F78', 3);
    c.strokeStyle = '#FFFFFF'; c.lineWidth = 3;
    [[-18, -14, -4, -8], [-14, -6, 0, 0], [-10, 2, 4, 6]].forEach((l) => { c.beginPath(); c.moveTo(l[0], l[1]); c.lineTo(l[2], l[3]); c.stroke(); });
    c.beginPath(); c.moveTo(14, 6); c.quadraticCurveTo(26, 2, 38, 10); c.stroke();
    c.restore();
    if (boostCd > 0 && boostT <= 0) {
      const p = boostCd / 25;
      c.beginPath(); c.moveTo(x, y); c.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + PI2 * p); c.closePath(); fs(c, 'rgba(60,40,30,0.45)');
      text(c, String(Math.ceil(boostCd)), x, y, 40, '#FFFFFF', { stroke: 'rgba(60,40,30,0.6)', lw: 6 });
    }
  }

  // ---------- панели и кнопки ----------
  function panel(c, x, y, w, h, title) {
    rr(c, x, y + 10, w, h, 40); fs(c, 'rgba(80,40,15,0.3)');
    rr(c, x, y, w, h, 40); fs(c, lg(c, 0, y, 0, y + h, [[0, '#C27A45'], [1, '#9A5A30']]), OL, 5);
    rr(c, x + 16, y + 16, w - 32, h - 32, 30); fs(c, lg(c, 0, y, 0, y + h, [[0, '#FFF8EE'], [1, '#FBE5C8']]), '#E3B98B', 3);
    if (title) {
      const tw = Math.max(260, title.length * 26 + 80);
      rr(c, x + w / 2 - tw / 2, y - 34, tw, 72, 36); fs(c, lg(c, 0, y - 34, 0, y + 38, [[0, '#F0675B'], [1, '#C9433A']]), OL, 4);
      text(c, title, x + w / 2, y + 3, 38, '#FFFFFF', { stroke: '#8E2A22', lw: 6 });
    }
  }
  function button(c, x, y, w, h, label, color, hover) {
    const cols = { green: ['#8AD45A', '#4FA22C', '#2F7A16'], orange: ['#FFC650', '#F28C1B', '#B8620A'], gray: ['#E9DED2', '#C8B8A6', '#8E7A66'], red: ['#F27B6E', '#D4483D', '#9E2A22'] }[color || 'green'];
    rr(c, x, y + 7, w, h, h / 2); fs(c, cols[2]);
    rr(c, x, y + (hover ? 2 : 0), w, h, h / 2); fs(c, lg(c, 0, y, 0, y + h, [[0, cols[0]], [1, cols[1]]]), cols[2], 3);
    rr(c, x + 14, y + 6 + (hover ? 2 : 0), w - 28, h * 0.32, h * 0.16); fs(c, 'rgba(255,255,255,0.3)');
    text(c, label, x + w / 2, y + h / 2 + 2 + (hover ? 2 : 0), Math.min(36, h * 0.46), '#FFFFFF', { stroke: cols[2], lw: 6 });
    return { x, y, w, h };
  }
  function starShape(c, x, y, r, filled) {
    c.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr2 = i % 2 ? r * 0.48 : r; c.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); }
    c.closePath();
    fs(c, filled ? lg(c, 0, y - r, 0, y + r, [[0, '#FFE066'], [1, '#F5A623']]) : '#E9DCCB', filled ? '#C9780F' : '#C9B6A0', 4);
  }

  root.Art = {
    rr, ell, circ, fs, lg, rg, text, shade, FONT,
    drawFood, drawPlate, drawHamster, drawChefHat, LOOKS, CHEF,
    tableBackChairs, tableFrontChairs, tableTop, pawsOnTable,
    drawBackLayer, drawFrontLayer, vignette, drawStationFx, drawPass,
    bubble, heart, coinIcon, star4, starShape,
    hudCoins, hudTimer, hudPause, hudDishBar, hudChefBtn, hudBoostBtn, panel, button, progressRing,
  };
})(window);
