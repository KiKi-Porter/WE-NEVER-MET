'use strict';
// ======================================================================== II 德雷克的耳朵 · DRAKE'S EAR  (bars 12–18)
// 0–10.4 s   1960, Green Bank: a 26 m dish tilts up toward τ Ceti and ε Eridani; the receiver's noise scrolls by,
//            the listening clock runs to 150 hours; one spike jumps out (7.5 s) — it was an aeroplane
// 10.4–15.6  a blackboard: Drake writes his equation; seven unknowns light up one per eighth note; N = ?
// 15.6–18    "not just listen — call out": the board fades into a single gold point (the next chapter begins with it)

const DISH_CX = 560, DISH_CY = 610;
const DISH_R = 1, DISH_FOC = .42, DISH_RAIL = 1.62;           // 26 m dish: radius 1 unit ≈ 13 m
const STAR_T = [['天仓五', 'τ CETI · 11.9 光年', 1390, 250], ['天苑四', 'ε ERIDANI · 10.5 光年', 1610, 400]];
const T_SPIKE = 7.5, T_PLANE = 8.6, T_BOARD = 10.4, T_FAC = 12.4, T_N = 15.1, T_TURN = 15.9;
const FACTORS = [['R*', '恒星诞生'], ['fp', '有行星'], ['ne', '宜居'], ['fl', '出现生命'], ['fi', '出现智慧'], ['fc', '发出信号'], ['L', '文明寿命']];
const FAC_TEX = ['f_R', 'f_fp', 'f_ne', 'f_fl', 'f_fi', 'f_fc', 'f_L'];
const DEC_STEEL = [150, 156, 166], DEC_DARK = [62, 68, 78], DEC_CONC = [88, 90, 92];

// The Tatel telescope: an 85-foot (26 m) paraboloid on a declination axle carried by a polar-axis yoke on a concrete pier.
// dec = how far the dish axis is raised from the horizon; hour = rotation about the polar axis (a slow track).
function dishModel(dec, hour) {
  const P = [], axle = [0, DISH_RAIL, 0], lat = 38.4 * PI / 180;
  const dishXf = v => { let p = V3.rx([v[0], v[1], v[2] + .05], -dec); p = V3.rx(p, 0); return V3.add(p, axle); };
  P.push(...paraboloid(DISH_R, DISH_FOC, 14, 44, DEC_STEEL, dishXf, .55));
  const rim = j => { const a = j / 44 * TAU; return dishXf([DISH_R * Math.cos(a), DISH_R * Math.sin(a), DISH_R * DISH_R / (4 * DISH_FOC)]); };
  const mid = j => { const a = j / 44 * TAU, r = DISH_R * .5; return dishXf([r * Math.cos(a), r * Math.sin(a), r * r / (4 * DISH_FOC) - .02]); };
  const hub = dishXf([0, 0, -.32]), focus = dishXf([0, 0, DISH_FOC]);
  for (let j = 0; j < 44; j += 2) { P.push(strut(rim(j), hub, DEC_DARK, 1.1, .9)); P.push(strut(mid(j), hub, DEC_DARK, 1.1, .7)); }
  for (let j = 0; j < 44; j++) P.push(strut(rim(j), rim((j + 1) % 44), [210, 216, 226], 1.2, .8));
  for (const j of [0, 11, 22, 33]) P.push(strut(rim(j), focus, [150, 156, 166], 1.8, 1));                    // the feed legs
  P.push(...box(V3.add(focus, V3.mul(V3.sub(focus, hub), .06)), [.09, .09, .09], [210, 214, 222], v => V3.rx(v, -dec)));
  P.push(...box(dishXf([0, 0, -.5]), [.42, .42, .5], DEC_DARK, v => V3.rx(v, -dec)));                          // the counterweight behind the hub
  P.push(...box(V3.add(axle, [0, 0, 0]), [.34, .34, .34], DEC_DARK));                                          // the declination drive housing
  // the pier, the polar yoke, and the concrete base
  P.push(...box([0, .12, 0], [2.6, .24, 2.6], DEC_CONC), ...box([0, .26, 0], [1.9, .12, 1.9], [104, 106, 108]));
  P.push(...box([0, .85, 0], [.5, 1.1, .5], [92, 98, 108]));
  P.push(...box([-.62, DISH_RAIL - .1, 0], [.12, .46, .28], DEC_DARK), ...box([.62, DISH_RAIL - .1, 0], [.12, .46, .28], DEC_DARK));  // yoke arms
  P.push(...box([0, DISH_RAIL - .3, 0], [1.36, .1, .3], DEC_DARK));
  P.push(...box([1.55, .42, -.4], [.7, .36, .5], [80, 84, 92]));                                               // control hut
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, r = 1.9; P.push(strut([Math.cos(a) * r, .24, Math.sin(a) * r], [Math.cos(a + .39) * r, .24, Math.sin(a + .39) * r], [70, 74, 80], 1.3, .8)); }  // fence
  return { prims: P, feed: focus };
}

function noiseLine(lt, x0, x1, y, amp, a, spike = 0) {
  if (a <= 0) return;
  const pts = [];
  for (let x = x0; x <= x1; x += 4) {
    const u = (x - x0) / (x1 - x0), n = (hash(Math.floor(x / 4) * 1.3 + Math.floor(lt * 30) * 7.1) - .5) * 2;
    const sp = spike * Math.exp(-Math.pow((u - .72) / .022, 2));
    pts.push([x, y - n * amp * (.6 + .4 * Math.sin(u * 30 + lt)) - sp * 180]);
  }
  glowPoly(pts, spike > .2 ? mixc(RGB.S, RGB.A, spike) : RGB.S, a * .8, 1.4);
}
function plane(x, y, s, a) {
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = WHITE; ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(-24, -4); ctx.lineTo(-30, -14); ctx.lineTo(-34, -14); ctx.lineTo(-30, 0); ctx.lineTo(-34, 14); ctx.lineTo(-30, 14); ctx.lineTo(-24, 4); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(4, -2); ctx.lineTo(-10, -26); ctx.lineTo(-16, -26); ctx.lineTo(-8, -2); ctx.moveTo(4, 2); ctx.lineTo(-10, 26); ctx.lineTo(-16, 26); ctx.lineTo(-8, 2); ctx.fill();
  ctx.restore();
}

scene({ name: 'drake', bar: 12, bars: 6, ch: ['II', '德雷克的耳朵', "DRAKE'S EAR"], mb: 2, grade: { bloom: .4, thresh: .78 },
  subs: [[.5, 4.5, '1960 年，德雷克把望远镜对准两颗邻近的恒星。', 'In 1960, a young astronomer, Frank Drake, aimed a telescope at two nearby stars.'],
    [4.6, 8.3, '他听了 150 小时，只有一次信号猛然跳起——', 'He listened for 150 hours. Only once did the signal leap —'],
    [8.5, 10.2, '是一架路过的飞机。', 'It was a passing aeroplane.'],
    [10.6, 13.9, '次年，他写下方程，估算银河系的文明数。', 'A year later he wrote an equation to estimate how many civilizations are out there.'],
    [14.1, 18, '没人算得出答案。那就不止听——还要喊。', 'No one could solve it. So he decided: not just listen — call out.']],
  sfx: [[.4, 'swell', { dur: 2.4 }], [T_SPIKE, 'spike'], [T_PLANE, 'whoosh', { dur: 1.2 }], [9.3, 'stamp'], [T_BOARD + .2, 'chalk', { dur: 1.6 }],
    ...FACTORS.map((_, i) => [T_FAC + i * EIGHTH, 'tick']), [T_N, 'ding', { midi: 81 }], [T_TURN + .3, 'ping', { midi: 69 }]],
  hits: [[T_SPIKE, .35]],
  reply: [[9.3, 1960, { dur: 1.9 }]],
  cam: (lt, d) => lt < T_BOARD ? { z: 1 + .035 * lt / T_BOARD, x: 0, y: 0 } : { z: 1 + .03 * (lt - T_BOARD) / 7.6, x: 0, y: 0 },
  shot: lt => lt < T_BOARD ? 0 : 1,
  draw(lt) {
    if (lt < T_BOARD) {
      starfield(lt, .7, 2);
      const fa = (1 - sstep(T_BOARD - .5, T_BOARD, lt)), dec = lerp(.2, 1.0, eio(clamp(lt / 2.8)));
      const cam = { yaw: PI - .6 + .05 * Math.sin(lt * .4), pitch: .12, cx: DISH_CX, cy: DISH_CY + 10, F: 1400, D: 8.5 };
      const dm = dishModel(dec, lt * .01), fs = P3(dm.feed, cam), fx = fs[0], fy = fs[1];
      add(() => { for (let i = 1; i < 6; i++) ring(DISH_CX, DISH_CY + 230, i * 140, RGB.G, .06 * fa * sstep(0, 1, lt), 1); });
      renderMesh(dm.prims, cam, { a: sstep(0, .8, lt) * fa, light: [.3, .7, .65], amb: .15 });
      STAR_T.forEach(([zh, en, sx, sy], i) => {
        const a = sstep(1.6 + i * .5, 2.4 + i * .5, lt) * fa;
        add(() => { glowDot(sx, sy, 34, RGB.W, a * .9); glowDot(sx, sy, 6, RGB.W, a); });
        ctx.save(); ctx.setLineDash([2, 7]); line(fx, fy, lerp(fx, sx, eout(clamp((lt - 1.6 - i * .5) / 1))), lerp(fy, sy, eout(clamp((lt - 1.6 - i * .5) / 1))), RGB.A, .5 * a, 1.2); ctx.restore();
        text(zh, sx + 30, sy - 12, { font: F_ZH, size: 26, weight: 700, color: WHITE, alpha: a, align: 'left' });
        text(en, sx + 31, sy + 16, { font: F_EN, size: 13, ls: 3, color: GRAY, alpha: a, align: 'left' });
      });
      // the receiver trace and the listening clock
      const na = sstep(2.6, 3.2, lt) * fa, spike = Math.exp(-Math.max(0, lt - T_SPIKE) * 2.6) * sstep(T_SPIKE - .08, T_SPIKE, lt);
      noiseLine(lt, 900, 1700, 690, 16, na, spike);
      line(900, 740, 1700, 740, RGB.G, .4 * na, 1);
      const hrs = Math.round(150 * clamp((lt - 3) / 5.2));
      text(`${hrs}`, 1700, 790, { font: F_EN, size: 46, color: WHITE, alpha: na, align: 'right' });
      text('小时 · HOURS LISTENED', 1700, 828, { font: F_SANS, size: 14, ls: 3, color: GRAY, alpha: na, align: 'right' });
      text('PROJECT OZMA', 900, 790, { font: F_EN, size: 16, ls: 6, color: SILVER, alpha: na, align: 'left' });
      if (lt > T_SPIKE - .1) {
        const sa = win(lt, T_SPIKE, T_BOARD - .4, .1, .4), px = 900 + .72 * 800;
        ring(px, 510, 30 + 40 * Math.exp(-(lt - T_SPIKE) * 4), RGB.A, .7 * sa * (1 - sstep(T_PLANE, T_PLANE + .5, lt)), 1.5);
        text('!', px, 450, { font: F_EN, size: 54, color: ACC, alpha: sa * (1 - sstep(T_PLANE - .2, T_PLANE + .2, lt)) });
        const pk = clamp((lt - T_PLANE) / 1.6);
        plane(lerp(px - 300, px + 260, pk), 470 - 40 * pk, 1, sa * sstep(T_PLANE, T_PLANE + .3, lt));
        text('一架路过的飞机', px, 560, { font: F_ZH, size: 24, weight: 700, color: WHITE, alpha: sa * sstep(T_PLANE + .2, T_PLANE + .6, lt) });
      }
      text('1960 · 绿岸', 140, 836, { font: F_EN, size: 54, ls: 6, color: WHITE, alpha: win(lt, .6, 4.6, .6, .6), align: 'left' });
      text('GREEN BANK · WEST VIRGINIA', 142, 884, { font: F_EN, size: 15, ls: 6, color: SILVER, alpha: win(lt, .9, 4.6, .6, .6), align: 'left' });
      return;
    }
    // ---- the blackboard
    const k = lt - T_BOARD, ba = sstep(0, .5, k) * (1 - sstep(T_TURN - T_BOARD, T_TURN - T_BOARD + .8, k));
    const bx = 260, by = 210, bw = W - 520, bh = 560;
    ctx.save(); ctx.globalAlpha = ba; ctx.fillStyle = '#0b0d10'; rrect(bx, by, bw, bh, 6); ctx.fill(); ctx.strokeStyle = 'rgba(107,114,128,.6)'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
    for (let i = 0; i < 6; i++) {                                 // faint wiped-off chalk
      const r = rng(i * 7 + 3), cx = bx + 120 + r() * (bw - 240), cy = by + 80 + r() * (bh - 160), rr = 160 + r() * 160;
      ctx.save(); const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rr); g.addColorStop(0, `rgba(255,255,255,${.028 * ba})`); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(cx - rr, cy - rr, 2 * rr, 2 * rr); ctx.restore();
    }
    const wr = clamp((k - .2) / 1.6), fw = texW('drake', 76);
    ctx.save(); ctx.beginPath(); ctx.rect(W / 2 - fw / 2 - 10, 300, (fw + 20) * wr, 140); ctx.clip();
    tex('drake', W / 2, 370, 76, ba, 'center', .25); ctx.restore();
    if (wr > 0 && wr < 1) add(() => glowDot(W / 2 - fw / 2 + fw * wr, 380, 20, RGB.W, .6));
    FACTORS.forEach(([sym, zh], i) => {
      const t = T_FAC - T_BOARD + i * EIGHTH, a = sstep(t, t + .15, k) * ba, x = W / 2 - 3 * 190 + i * 190, pop = 1 + .3 * Math.exp(-(k - t) * 8) * (k > t ? 1 : 0);
      tex(FAC_TEX[i], x, 520, 44 * pop, a);
      text(zh, x, 586, { font: F_ZH, size: 22, weight: 700, color: SILVER, alpha: a });
      text('?', x, 640, { font: F_EN, size: 34, color: ACC, alpha: a * (.5 + .5 * Math.sin(k * 6 + i)) });
    });
    const na = sstep(T_N - T_BOARD, T_N - T_BOARD + .3, k) * ba;
    if (na > 0) { ctx.save(); ctx.globalAlpha = na; ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(bx, by, bw, bh); ctx.restore(); text('N = ?', W / 2, 480, { font: F_MATH, size: 150, color: WHITE, alpha: na, glow: 'rgba(127,180,255,.5)', blur: 30 }); }
    text('1961 · GREEN BANK CONFERENCE', bx + 30, by + 40, { font: F_EN, size: 15, ls: 5, color: GRAY, alpha: ba, align: 'left' });
    // the turn: a single gold point — the call that the next chapter makes
    const ga = sstep(T_TURN - T_BOARD + .2, T_TURN - T_BOARD + .9, k);
    if (ga > 0) { add(() => { glowDot(W / 2, H / 2, 60, RGB.GOLD, ga * .9); }); ring(W / 2, H / 2, 20 + (k - (T_TURN - T_BOARD)) * 260, RGB.GOLD, ga * .5 * Math.exp(-(k - (T_TURN - T_BOARD)) * 1.4), 1.5); }
  } });
