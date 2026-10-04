'use strict';
// ======================================================================== III 我们喊过 · WE CALLED OUT  (bars 18–28; build 18–22, drop 22–28)
// 0–4 s    Arecibo at night, slow push; the receiver gathers light
// 4–9 s    the real 1679 bits pour out of the receiver and hang in the sky as a cloud; counter → 1679
// 9–12 s   1679 = ?  →  23 × 73, two primes; a thin 23×73 frame appears
// 12 s     DROP: every bit snaps into its cell; the picture lights up part by part in gold
// 24–27 s  the picture folds into one gold spark and flies to M13, 25,000 light-years away
// 27–30 s  1977: Voyager drifts past and lets go of the Golden Record

const ARE = window.DATA.arecibo, ARE_PARTS = window.DATA.areciboParts;
const AR_ROWS = 73, AR_COLS = 23, CELL = 11;
const GRID = { x: W / 2 - AR_COLS * CELL / 2, y: H / 2 - AR_ROWS * CELL / 2 };
const T_EMIT = [4, 8.6], T_SNAP = 12, T_PART0 = 12.7, T_PART = 1.5, T_SEND = 24, T_VOY = 27;
const PART_LABELS = [
  ['数字 1 – 10', 'NUMBERS ONE TO TEN'], ['氢 · 碳 · 氮 · 氧 · 磷', 'THE ELEMENTS OF DNA'], ['核苷酸', 'NUCLEOTIDES'],
  ['DNA 双螺旋', 'THE DOUBLE HELIX'], ['人类 · 四十亿人', 'A HUMAN · FOUR BILLION OF US'], ['太阳系 · 第三颗行星', 'OUR SOLAR SYSTEM'], ['发出它的望远镜', 'THE TELESCOPE THAT SENT IT']];
let BITS = null, M13 = null;
const arPart = r => ARE_PARTS.findIndex(([a, b]) => r >= a && r <= b);
const cellXY = (r, c) => [GRID.x + c * CELL + CELL / 2, GRID.y + r * CELL + CELL / 2];

const VOY_DISC = [.722, .556, .062];                            // the Golden Record on photos/voyager.png: centre and diameter as fractions of the width
const arCam = lt => ({ yaw: .35 + lt * .025, pitch: .55, cx: W / 2, cy: 560, F: 1000 * (1 + .06 * clamp(lt / 9)), D: 7.5 });
function arFocusXY(lt) { const p = P3([0, 1.32, 0], arCam(lt)); return [p[0], p[1], 0]; }      // the receiver dome on screen

// Voyager, to scale: 1 unit ≈ 1.8 m. Decagonal bus, 3.7 m high-gain dish, 13 m magnetometer boom, RTG boom, science boom.
function voyagerModel() {
  const P = [], WH = [214, 218, 226], DK = [70, 74, 84], GD = [196, 160, 80], bus = (r, y) => { const a = []; for (let i = 0; i < 10; i++) a.push([Math.cos(i / 10 * TAU) * r, y, Math.sin(i / 10 * TAU) * r]); return a; };
  const lo = bus(.5, -.18), hi = bus(.5, .18);
  for (let i = 0; i < 10; i++) { const j = (i + 1) % 10; P.push(...quad(lo[i], lo[j], hi[j], hi[i], i % 2 ? [150, 154, 162] : [128, 132, 142])); P.push({ t: 'tri', v: [[0, .18, 0], hi[i], hi[j]], c: [110, 114, 124] }); }
  P.push(...paraboloid(1, .3, 10, 36, WH, v => [v[0], v[2] + .42, v[1]], .5));
  for (const a of [0, 1.57, 3.14, 4.71]) P.push(strut([Math.cos(a), .42 + 1 / (4 * .3), Math.sin(a)], [0, .72, 0], [180, 184, 192], 1.4));
  for (const a of [0, 1.57, 3.14, 4.71]) P.push(strut([Math.cos(a) * .42, .18, Math.sin(a) * .42], [Math.cos(a), .42 + 1 / (4 * .3), Math.sin(a)], [120, 124, 134], 1.1, .8));
  P.push(...box([0, .74, 0], [.14, .08, .14], WH));
  const lattice = (a, b, n, col, w = 1.3) => {                  // a triangular-section boom with rungs
    const d = V3.sub(b, a), len = Math.hypot(...d), r = .05; const ring = t => { const c = V3.add(a, V3.mul(d, t)); return [0, 1, 2].map(i => V3.add(c, [0, Math.cos(i * 2.094) * r, Math.sin(i * 2.094) * r])); };
    for (let i = 0; i < 3; i++) P.push(strut(ring(0)[i], ring(1)[i], col, w));
    for (let k = 0; k <= n; k++) { const R = ring(k / n); for (let i = 0; i < 3; i++) P.push(strut(R[i], R[(i + 1) % 3], col, 1, .8)); }
  };
  lattice([-.5, 0, 0], [-7.4, .12, .1], 26, [190, 150, 70]); P.push(...box([-7.5, .12, .1], [.2, .12, .12], DK));
  P.push(strut([.5, 0, 0], [3.4, -.12, 0], [150, 154, 164], 2.2));
  for (const x of [1.3, 2.0, 2.7, 3.4]) P.push(...box([x, -.12, 0], [.46, .32, .32], [96, 100, 110]));
  lattice([0, -.15, .45], [.5, -.85, 2.9], 12, [160, 164, 174]); P.push(...box([.5, -.9, 3.0], [.5, .34, .44], DK), ...box([.5, -.9, 3.0], [.3, .2, .3], [210, 214, 222]));
  P.push(strut([0, -.2, -.3], [3.8, -.7, -4.3], [120, 124, 134], 1.1, .7), strut([0, -.2, -.3], [-3.6, -.7, -4.5], [120, 124, 134], 1.1, .7));
  const rec = [.0, 0, .56];
  for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, b = (i + 1) / 16 * TAU, c = [Math.cos(a) * .17, Math.sin(a) * .17, .56], d = [Math.cos(b) * .17, Math.sin(b) * .17, .56]; P.push({ t: 'tri', v: [[0, 0, .56], c, d], c: GD, spec: .8 }); }
  return { prims: P, record: [0, 0, .62] };
}

scene({ name: 'called', bar: 18, bars: 10, ch: ['III', '我们喊过', 'WE CALLED OUT'], fi: .4, mb: 2, grade: { bloom: .5, thresh: .72 },
  subs: [[.8, 3.9, '1974 年，我们第一次朝宇宙喊话。', 'In 1974, we called out to the universe for the first time.'],
    [5, 8.4, '1679 个比特。', '1,679 bits.'],
    [9, 11.85, '1679，只能拆成两个质数相乘：23 × 73。', '1,679 splits only one way — two primes, 23 by 73.'],
    [12.7, 17.2, '任何懂数学的文明，都能把它排成一幅图。', 'Any civilization that knows math can turn it into a picture.'],
    [18, 22.8, '那是我们的自画像。', 'It is a self-portrait.'],
    [24.3, 26.8, '它要走两万五千年。', 'It will travel for twenty-five thousand years.'],
    [27.2, 29.8, '1977 年，我们又寄出一张唱片。', 'In 1977, we sent a record.']],
  sfx: [[.4, 'swell', { dur: 3.5 }], [T_EMIT[0], 'data', { dur: T_EMIT[1] - T_EMIT[0] }], [9, 'tick'], [10.2, 'ding', { midi: 76 }], [10.9, 'ding', { midi: 79 }],
    [11.1, 'riser', { dur: .9 }], [T_SNAP, 'impact'], [T_SNAP + .02, 'snap'],
    ...ARE_PARTS.map((_, i) => [T_PART0 + i * T_PART, 'chime', { midi: [69, 72, 76, 79, 81, 84, 88][i] }]),
    [T_SEND, 'whoosh', { dur: 1.6 }], [T_SEND + 1.7, 'sparkle', { dur: 1.6 }], [T_VOY, 'swell', { dur: 3 }], [T_VOY + .6, 'stamp']],
  hits: [[T_SNAP, 1], [T_VOY, .3]],
  reply: [[T_VOY + .6, 1977, { dur: 2.6 }]],
  cam: (lt, d) => lt < T_SNAP ? { z: 1, x: 0, y: 0 } : lt < T_SEND ? { z: 1 + .035 * (lt - T_SNAP) / 12, x: 0, y: 4 * Math.sin(lt * .3) } : camPush(.04)(lt - T_SEND, 6),
  shot: lt => lt < T_SNAP ? 0 : lt < T_SEND ? 1 : lt < T_VOY ? 2 : 3,
  init() {
    const r = rng(1974);
    BITS = [];
    for (let i = 0; i < AR_ROWS * AR_COLS; i++) {
      const row = Math.floor(i / AR_COLS), col = i % AR_COLS, a = -PI / 2 + gauss(r) * .9, d = Math.sqrt(r());
      BITS.push({ row, col, v: ARE[row][col] === '1', part: arPart(row),
        cx: W / 2 + Math.cos(a) * d * 900, cy: 470 + Math.sin(a) * d * 420 + 120,              // where it hangs in the cloud
        e: lerp(T_EMIT[0], T_EMIT[1], i / (AR_ROWS * AR_COLS)), ph: r() * TAU, dl: r() * .22, sp: .6 + r() * .8 });
    }
    M13 = Array.from({ length: 900 }, () => { const rr = Math.abs(gauss(r)) * 34 * (r() < .2 ? 2.2 : 1), a = r() * TAU; return [Math.cos(a) * rr, Math.sin(a) * rr, .3 + r() * .7]; });
  },
  draw(lt) {
    // ---------------------------------------------------------------- the telescope and the bit cloud
    if (lt < T_SNAP + 1.2) {
      const [fx, fy, w] = arFocusXY(lt), ia = sstep(0, 1.5, lt) * (1 - sstep(8, 10.5, lt));
      starfield(lt, .8 - .4 * ia, 2);
      renderMesh(areciboModel(), arCam(lt), { a: ia, light: [.3, .8, -.4], amb: .14 });
      add(() => glowDot(fx, fy, 120 + 60 * sstep(1, 4, lt), RGB.W, .55 * sstep(1, 4, lt) * (1 - sstep(8.6, 10, lt))));
      if (lt < 4) text('1974 · 11 · 16', 140, 880, { font: F_EN, size: 60, ls: 6, color: WHITE, alpha: win(lt, .8, 4.2, .6, .6), align: 'left', glow: 'rgba(0,0,0,.9)', blur: 20 });
      if (lt < 4) text('ARECIBO OBSERVATORY  ·  PUERTO RICO', 142, 930, { font: F_EN, size: 16, ls: 6, color: SILVER, alpha: win(lt, 1.1, 4.2, .6, .6), align: 'left', glow: 'rgba(0,0,0,.9)', blur: 14 });
      if (lt > T_EMIT[0]) {
        const snap = clamp((lt - T_SNAP) / .9), cloudA = lt < 9 ? 1 : lerp(1, .35, sstep(9, 9.6, lt)) * (lt > 11.2 ? lerp(1, 2.6, sstep(11.2, 12, lt)) : 1);
        ctx.save(); ctx.font = `400 15px ${F_MONO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        for (const b of BITS) {
          const age = lt - b.e; if (age < 0) continue;
          const fly = eout(clamp(age / (1.1 + b.sp))), drift = Math.sin(lt * .7 * b.sp + b.ph) * 10;
          let x = lerp(fx, b.cx, fly) + drift, y = lerp(fy, b.cy, fly) + Math.cos(lt * .6 + b.ph) * 6;
          if (lt >= T_SNAP) { const e = eexpo(clamp((snap - b.dl) / (1 - b.dl))), [gx, gy] = cellXY(b.row, b.col); x = lerp(x, gx, e); y = lerp(y, gy, e); }
          ctx.globalAlpha = clamp(age * 5) * cloudA * (b.v ? .95 : .4) * (1 - sstep(T_SNAP + .6, T_SNAP + 1.1, lt));
          ctx.fillStyle = b.v ? GOLD : SILVER; ctx.fillText(b.v ? '1' : '0', x, y);
        }
        ctx.restore();
        const n = Math.round(1679 * clamp((lt - T_EMIT[0]) / (T_EMIT[1] - T_EMIT[0])));
        const ca = win(lt, T_EMIT[0], 9.2, .3, .5);
        text(String(n), W - 160, 520, { font: F_EN, size: 96, color: WHITE, alpha: ca, glow: 'rgba(0,0,0,.9)', blur: 24 });
        text('BITS  ·  比特', W - 160, 582, { font: F_SANS, size: 18, ls: 8, color: SILVER, alpha: ca, glow: 'rgba(0,0,0,.9)', blur: 12 });
      }
      if (lt > 9 && lt < T_SNAP + .3) {                         // 1679 = ?  →  23 × 73
        const qa = win(lt, 9, 10.4, .25, .2), sa = win(lt, 10.2, T_SNAP + .2, .2, .25);
        tex('q1679', W / 2, H / 2 - 20, 104, qa, 'center', .4);
        if (sa > 0) {
          const pop = 1 + .08 * Math.exp(-(lt - 10.2) * 6);
          tex('semi', W / 2, H / 2 - 20, 104 * pop, sa, 'center', .5);
          text('两个质数  ·  TWO PRIMES', W / 2, H / 2 + 70, { font: F_SANS, size: 22, ls: 6, color: GOLD, alpha: sa * sstep(10.9, 11.3, lt) });
        }
        const fa = sstep(11.2, 11.9, lt);                       // the empty frame the bits are about to fill
        if (fa > 0) { ctx.save(); ctx.strokeStyle = rgba(RGB.GOLD, .5 * fa); ctx.lineWidth = 1; ctx.setLineDash([4, 6]); ctx.strokeRect(GRID.x - 6, GRID.y - 6, AR_COLS * CELL + 12, AR_ROWS * CELL + 12); ctx.restore(); }
      }
    }
    // ---------------------------------------------------------------- the picture, lit part by part
    if (lt >= T_SNAP + .6 && lt < T_SEND + 1.8) {
      const send = clamp((lt - T_SEND) / 1.6), sz = 1 - eio(send), [tx, ty] = [1460, 380];
      const ox = lerp(W / 2, tx, ein(send)), oy = lerp(H / 2, ty, ein(send));
      starfield(lt, .5, 2);
      ctx.save(); ctx.translate(ox, oy); ctx.scale(sz, sz); ctx.translate(-W / 2, -H / 2);
      const ga = sstep(T_SNAP + .6, T_SNAP + 1.1, lt);
      add(() => {
        for (const b of BITS) {
          const [x, y] = cellXY(b.row, b.col), lit = clamp((lt - (T_PART0 + b.part * T_PART)) / .5);
          if (!b.v) { ctx.fillStyle = rgba(RGB.G, .12 * ga); ctx.fillRect(x - 1, y - 1, 2, 2); continue; }
          const c = mixc(RGB.S, RGB.GOLD, lit), s = CELL - 2;
          ctx.fillStyle = rgba(c, ga * (.35 + .65 * lit)); ctx.fillRect(x - s / 2, y - s / 2, s, s);
          if (lit > 0 && lit < 1) glowDot(x, y, 16, RGB.GOLD, .5 * (1 - lit));
        }
      });
      ctx.restore();
      // the scan line riding down the picture as each part lights up, and the labels
      if (send <= 0) {
        const pi = Math.floor((lt - T_PART0) / T_PART);
        ARE_PARTS.forEach(([r0, r1], i) => {
          const la = sstep(T_PART0 + i * T_PART + .1, T_PART0 + i * T_PART + .6, lt) * (1 - sstep(T_SEND - .6, T_SEND, lt)) * (i === pi ? 1 : .55);
          const y = GRID.y + (r0 + r1 + 1) / 2 * CELL, right = i % 2 === 0;
          label(right ? GRID.x + AR_COLS * CELL + 30 : GRID.x - 30, y, PART_LABELS[i][0], PART_LABELS[i][1], la, { align: right ? 'left' : 'right', len: 70, size: 24 });
        });
        if (pi >= 0 && pi < ARE_PARTS.length) {
          const u = (lt - T_PART0 - pi * T_PART) / .5, [r0, r1] = ARE_PARTS[pi], y = GRID.y + lerp(r0, r1 + 1, clamp(u)) * CELL;
          add(() => { line(GRID.x - 20, y, GRID.x + AR_COLS * CELL + 20, y, RGB.GOLD, .7 * (1 - sstep(.8, 1.2, u)), 1.5); });
        }
      }
      // the spark it folds into, flying to M13
      if (send > 0) {
        const [mx, my] = [1460, 380];
        add(() => { for (const [x, y, b] of M13) { ctx.fillStyle = rgba(RGB.W, b * .7 * send); ctx.fillRect(mx + x - 1, my + y - 1, 2, 2); } glowDot(mx, my, 90, RGB.W, .25 * send); });
        add(() => glowDot(ox, oy, 40, RGB.GOLD, .9 * sstep(.4, 1, send)));
        line(W / 2, H / 2, ox, oy, RGB.GOLD, .25 * sstep(.2, .6, send) * (1 - sstep(1, 1.6, lt - T_SEND)), 1);
      }
    }
    if (lt >= T_SEND + 1.6 && lt < T_VOY + .2) {               // the message in flight
      const k = lt - T_SEND - 1.6, [mx, my] = [1460, 380];
      starfield(lt, .6, 2);
      add(() => { for (const [x, y, b] of M13) { ctx.fillStyle = rgba(RGB.W, b * .7); ctx.fillRect(mx + x - 1, my + y - 1, 2, 2); } glowDot(mx, my, 90, RGB.W, .25); });
      const px = lerp(520, mx - 70, eout(clamp(k / 1.6)) * .08), py = lerp(700, my + 40, eout(clamp(k / 1.6)) * .08);
      add(() => glowDot(px, py, 26, RGB.GOLD, .9));
      ctx.save(); ctx.setLineDash([3, 8]); line(px, py, mx - 50, my + 30, RGB.GOLD, .35 * sstep(0, .5, k), 1); ctx.restore();
      tex('m13', mx, my + 120, 40, sstep(.1, .6, k), 'center');
      text('预计抵达：约公元 27,000 年', mx, my + 172, { font: F_SANS, size: 20, ls: 4, color: SILVER, alpha: sstep(.3, .8, k) });
      text('ARECIBO MESSAGE', px, py + 44, { font: F_EN, size: 14, ls: 5, color: GOLD, alpha: sstep(0, .5, k) });
    }
    // ---------------------------------------------------------------- 1977: Voyager lets go of the record
    if (lt >= T_VOY) {
      const k = lt - T_VOY;
      starfield(lt, .9, -6);
      photo('voyager', W / 2 + 120 - 40 * k, H / 2 - 10, W * .95, sstep(0, .7, k), { rot: -.03 * k });
      const rel = eio(clamp((k - .6) / 2.2));                     // the record drifts off the bus toward the viewer
      const rx = lerp(W / 2 + 120 + (VOY_DISC[0] - .5) * W * .95 - 40 * k, 1500, rel), ry = lerp(H / 2 - 10 + (VOY_DISC[1] - .5) * W * .95 * 941 / 1672, 520, rel), rw = lerp(VOY_DISC[2] * W * .95, 400, rel);
      add(() => glowDot(rx, ry, rw * .8, RGB.GOLD, .3 * sstep(.6, 1.6, k)));
      photo('golden_record', rx, ry, rw, sstep(.3, .7, k), { rot: rel * 2.4 });
      text('1977', 140, 800, { font: F_EN, size: 72, ls: 8, color: WHITE, alpha: sstep(.3, .9, k), align: 'left' });
      text('VOYAGER  ·  THE GOLDEN RECORD', 142, 856, { font: F_EN, size: 16, ls: 6, color: GOLD, alpha: sstep(.6, 1.2, k), align: 'left' });
    }
  } });
