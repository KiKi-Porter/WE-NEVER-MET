'use strict';
// ======================================================================== V 更大的耳朵 · BIGGER EARS  (bars 34–42, drop 2)
// 0–7 s     2020-12-01: Arecibo's cables snap one by one on the beat; the 900-tonne platform falls into the dish
// 7–15 s    out of the dark rises a wireframe dish of thousands of triangles: FAST, 500 m, Guizhou; rings light on the beat
// 15–21 s   Breakthrough Listen: a sweep crosses 1,327 stars and crosses each one off; in 2022 one turns blue — interference
// 21–24 s   everything goes out: still silent

const AR_PTS = { left: [.205, .13], right: [.755, .07], front: [.795, .465], plat: [.5, .25], dish: [.5, .64] };
const AR_W = W * 1.02;
const arXY = ([fx, fy], w = AR_W, cx = W / 2, cy = H / 2) => [cx + (fx - .5) * w, cy + (fy - .5) * w * 9 / 16];
const T_SNAPS = [bt(2), bt(4), bt(5)], T_FALL = 4.5, T_LAND = 5.55, T_FAST = 7, T_BL = 15, T_SUS = 18.7, T_INT = 20.2, T_OUT = 21;
const BL_N = 1327;
let FAST_SEG = null, BL_STARS = null, BL_SUS = 0, DUST = null;

function snapCable(from, k, a) {                                 // k = seconds since the snap; a cable whips loose from the platform
  const [px, py] = arXY(AR_PTS.plat), [tx, ty] = arXY(from);
  if (k < 0) { line(tx, ty, px, py, RGB.W, .25 * a, 1.2); return; }
  const fl = Math.exp(-k * 5);
  add(() => { line(tx, ty, px, py, RGB.W, a * fl, 3); glowDot(lerp(tx, px, .5), lerp(ty, py, .5), 140, RGB.W, .5 * a * fl); });
  const g = Math.min(k, 1.4), mx = lerp(tx, px, .5), my = lerp(ty, py, .5);
  line(tx, ty, mx + (tx - mx) * .2 + 30 * g, my + 300 * g * g, RGB.S, a * (1 - sstep(.8, 1.4, k)), 1.4);
  line(px, py, mx + (px - mx) * .2 - 20 * g, my + 360 * g * g, RGB.S, a * (1 - sstep(.8, 1.4, k)), 1.4);
}

scene({ name: 'ears', bar: 34, bars: 8, ch: ['V', '更大的耳朵', 'BIGGER EARS'], fi: .01, mb: 2, grade: { bloom: .5, thresh: .72 },
  subs: [[.6, 3.6, '2020 年 12 月 1 日，阿雷西博望远镜的钢缆接连断裂。', 'December 1, 2020. Arecibo\'s cables snap, one after another.'],
    [3.8, 6.8, '九百吨的平台坠落。那只喊过话的耳朵，永远闭上了。', 'The 900-tonne platform falls. The ear that once called out is closed for good.'],
    [7.4, 10.8, '而在中国贵州，一只更大的耳朵早已睁开——"中国天眼"，口径 500 米。', 'But in Guizhou, China, a bigger ear has already opened — FAST, 500 metres across.'],
    [11.2, 14.6, '人类从来没有听得这么清楚。', 'We have never listened so closely.'],
    [15.2, 18.2, '"突破聆听"计划，扫过了上千颗恒星。', 'Breakthrough Listen has swept over a thousand stars.'],
    [18.4, 21, '2022 年的可疑信号，最终证实是地球干扰。', 'In 2022, FAST caught a few candidates — they turned out to be our own interference.'],
    [21.2, 23.8, '宇宙，依然沉默。', 'The universe is still silent.']],
  sfx: [...T_SNAPS.map(t => [t, 'twang']), [T_FALL, 'fall', { dur: T_LAND - T_FALL }], [T_LAND, 'rumble', { dur: 2.2 }],
    [T_FAST, 'swell', { dur: 1.6 }], [T_FAST + 1, 'ding', { midi: 81 }], [T_BL, 'scan', { dur: 5.4 }], [T_SUS, 'ping', { midi: 88 }], [T_INT, 'glitch'], [21.8, 'stamp']],
  hits: [[0, .6], ...T_SNAPS.map(t => [t, .45]), [T_LAND, .9], [T_FAST + 1, .3]],
  reply: [[21.8, 2022, { dur: 2.1 }]],
  cam: (lt) => lt < T_FAST ? { z: 1 + .05 * lt / T_FAST, x: 0, y: 0 } : lt < T_BL ? { z: 1 + .04 * (lt - T_FAST) / 8, x: 0, y: 0 } : { z: 1 + .03 * (lt - T_BL) / 9, x: 0, y: 0 },
  shot: lt => lt < T_FAST ? 0 : lt < T_BL ? 1 : 2,
  init() {
    // FAST: a spherical cap (radius 300 m, aperture 500 m) as a triangulated mesh in rings
    const NR = 16, RS = 1.2, depth = r => .537 - (RS - Math.sqrt(RS * RS - r * r)), P = [];
    for (let i = 0; i <= NR; i++) { const n = Math.max(1, 6 * i), ring = []; for (let j = 0; j < n; j++) { const a = j / n * TAU + i * .13, r = i / NR; ring.push([Math.cos(a) * r, depth(r) - .27, Math.sin(a) * r]); } P.push(ring); }
    FAST_SEG = [];
    for (let i = 1; i <= NR; i++) {
      const ring = P[i], prev = P[i - 1];
      ring.forEach((p, j) => {
        FAST_SEG.push([p, ring[(j + 1) % ring.length], i]);
        const a = Math.atan2(p[2], p[0]);
        let best = 0, bd = 1e9; prev.forEach((q, m) => { const d = Math.hypot(q[0] - p[0], q[2] - p[2]); if (d < bd) { bd = d; best = m; } });
        FAST_SEG.push([p, prev[best], i]);
        if (j % 2 === 0) FAST_SEG.push([p, prev[(best + 1) % prev.length], i]);
      });
    }
    const r = rng(2015);
    BL_STARS = Array.from({ length: BL_N }, () => ({ x: 200 + r() * 1520, y: 190 + r() * 600, b: .3 + r() ** 2 * .7 }));
    BL_SUS = BL_STARS.reduce((bi, s, i) => Math.hypot(s.x - 1200, s.y - 430) < Math.hypot(BL_STARS[bi].x - 1200, BL_STARS[bi].y - 430) ? i : bi, 0);
    DUST = Array.from({ length: 260 }, () => ({ a: -PI / 2 + gauss(r) * .9, v: 120 + r() * 420, s: 1 + r() * 3 }));
  },
  draw(lt) {
    // ---------------------------------------------------------------- the fall of Arecibo
    if (lt < T_FAST) {
      const fade = 1 - sstep(T_LAND + .6, T_FAST - .2, lt), k = clamp((lt - T_FALL) / (T_LAND - T_FALL));
      const cut = T_SNAPS.map(t => lt >= t ? 1 : 0), cam = { yaw: .5 + lt * .02, pitch: .5, cx: W / 2, cy: 560, F: 1050, D: 7.5 };
      starfield(lt, .4, 1);
      renderMesh(areciboModel(k * k, cut, .5 * k * k), cam, { a: fade, light: [.3, .8, -.4], amb: .14 });
      T_SNAPS.forEach((t, i) => {                                // the snap: a flash where the cable leaves the tower
        const u = lt - t; if (u < 0 || u > 1.2) return; const [x, y] = P3(V3.add(AR_TOWERS[i], [0, .3, 0]), cam);
        add(() => { glowDot(x, y, 160, RGB.W, .8 * Math.exp(-u * 5) * fade); });
      });
      if (lt > T_LAND) {                                         // dust boiling out of the dish
        const u = lt - T_LAND, [dx, dy] = P3([0, .2, 0], cam);
        add(() => glowDot(dx, dy, 280, [220, 210, 190], .7 * Math.exp(-u * 2) * fade));
        ctx.save(); ctx.fillStyle = '#c9c4ba';
        for (const d of DUST) { ctx.globalAlpha = .5 * Math.exp(-u * 1.1) * fade; ctx.fillRect(dx + Math.cos(d.a) * d.v * u * .9, dy + Math.sin(d.a) * d.v * u * .5 + 50 * u * u, d.s, d.s); }
        ctx.restore();
      }
      text('2020 · 12 · 01', 140, 836, { font: F_EN, size: 54, ls: 6, color: WHITE, alpha: win(lt, .4, 6.6, .4, .6), align: 'left', glow: 'rgba(0,0,0,.9)', blur: 20 });
      text('ARECIBO · 1963 – 2020', 142, 884, { font: F_EN, size: 15, ls: 6, color: SILVER, alpha: win(lt, .7, 6.6, .4, .6), align: 'left', glow: 'rgba(0,0,0,.9)', blur: 12 });
      return;
    }
    // ---------------------------------------------------------------- FAST rises
    if (lt < T_BL) {
      const k = lt - T_FAST, a = sstep(0, 1, k) * (1 - sstep(7.4, 8, k));
      starfield(lt, .6, 2);
      const cam = { yaw: .3 + k * .07, pitch: .62 + .06 * Math.sin(k * .3), cx: W / 2, cy: lerp(900, 560, eout(clamp(k / 1.6))), F: 1650, D: 3.2 };
      const lit = Math.floor((k - 1) / EIGHTH) % 18;
      add(() => {
        for (const [p, q, ring] of FAST_SEG) {
          const [x0, y0, s0] = proj(p, cam.yaw, cam.pitch, cam.cx, cam.cy, cam.F, cam.D), [x1, y1] = proj(q, cam.yaw, cam.pitch, cam.cx, cam.cy, cam.F, cam.D);
          const on = k > 1 && ring === lit ? 1 : k > 1 && Math.abs(ring - lit) === 1 ? .35 : 0;
          ctx.strokeStyle = on > 0 ? rgba(mixc(RGB.S, RGB.A, on), a * (.4 + .6 * on)) : rgba(RGB.S, a * .28 * clamp(s0, .5, 1.3));
          ctx.lineWidth = on > .5 ? 1.6 : 1; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        }
        const [fx, fy] = proj([0, -.62, 0], cam.yaw, cam.pitch, cam.cx, cam.cy, cam.F, cam.D);  // the feed cabin on its six cables
        for (let j = 0; j < 6; j++) { const ang = j / 6 * TAU; const [tx, ty] = proj([Math.cos(ang) * 1.15, -.35, Math.sin(ang) * 1.15], cam.yaw, cam.pitch, cam.cx, cam.cy, cam.F, cam.D); line(tx, ty, fx, fy, RGB.S, a * .3, 1); }
        glowDot(fx, fy, 40, RGB.W, a * .8);
      });
      const la = sstep(1, 1.6, k) * a;
      text('中国天眼', 140, 790, { font: F_ZH, size: 64, weight: 900, color: WHITE, alpha: la, align: 'left' });
      text('FAST · 2016 · 09 · 25', 142, 846, { font: F_EN, size: 20, ls: 6, color: SILVER, alpha: la, align: 'left' });
      text('贵州平塘 · 口径 500 米 · 4450 块面板', 142, 880, { font: F_SANS, size: 16, ls: 3, color: GRAY, alpha: la, align: 'left' });
      return;
    }
    // ---------------------------------------------------------------- Breakthrough Listen sweeps the stars
    const k = lt - T_BL, out = 1 - sstep(T_OUT - T_BL, T_OUT - T_BL + 1.4, k);
    const sx = lerp(200, 1720, clamp((k - .3) / 5.2));
    let n = 0;
    add(() => {
      for (let i = 0; i < BL_STARS.length; i++) {
        const s = BL_STARS[i], done = s.x < sx; if (done) n++;
        if (i === BL_SUS) continue;
        ctx.fillStyle = rgba(done ? RGB.G : RGB.W, (done ? .45 : s.b) * out * sstep(0, .5, k));
        const r = done ? 1.6 : 1 + s.b * 1.6; ctx.fillRect(s.x - r / 2, s.y - r / 2, r, r);
        if (done && sx - s.x < 120) { const e = 1 - (sx - s.x) / 120; line(s.x - 4, s.y - 4, s.x + 4, s.y + 4, RGB.S, .6 * e * out, 1); line(s.x - 4, s.y + 4, s.x + 4, s.y - 4, RGB.S, .6 * e * out, 1); }
      }
    });
    add(() => { line(sx, 170, sx, 810, RGB.A, .6 * out * (k < 5.6 ? 1 : 0), 1.5); glowDot(sx, 490, 200, RGB.A, .08 * out * (k < 5.6 ? 1 : 0)); });
    const s = BL_STARS[BL_SUS], sus = sstep(T_SUS - T_BL, T_SUS - T_BL + .2, k), gone = sstep(T_INT - T_BL, T_INT - T_BL + .4, k);
    add(() => { glowDot(s.x, s.y, 40, mixc(RGB.A, RGB.G, gone), (sus ? .9 : .3) * out); });
    if (sus > 0) {
      ring(s.x, s.y, 26 + 8 * Math.sin(k * 8) * (1 - gone), gone > .5 ? RGB.G : RGB.A, .8 * out, 1.5);
      label(s.x + 30, s.y, gone < .5 ? '可疑信号' : '地球自身的干扰', gone < .5 ? '2022 · CANDIDATE SIGNAL' : 'RADIO INTERFERENCE', out * (gone < .5 ? sus : gone), { color: gone < .5 ? ACC : SILVER, rgb: gone < .5 ? RGB.A : RGB.G });
    }
    text(String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','), 1720, 860, { font: F_EN, size: 56, color: WHITE, alpha: out * sstep(.2, .6, k), align: 'right' });
    text('颗恒星已扫描 · STARS SEARCHED', 1720, 900, { font: F_SANS, size: 14, ls: 3, color: GRAY, alpha: out * sstep(.2, .6, k), align: 'right' });
    text('突破聆听', 140, 836, { font: F_ZH, size: 46, weight: 900, color: WHITE, alpha: out * win(k, .2, 5.6, .4, .6), align: 'left' });
    text('BREAKTHROUGH LISTEN · 2015 –', 142, 884, { font: F_EN, size: 15, ls: 6, color: SILVER, alpha: out * win(k, .4, 5.6, .4, .6), align: 'left' });
  } });
