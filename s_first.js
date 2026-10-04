'use strict';
// ======================================================================== VII 沉默的答案 · WHAT THE SILENCE MEANS  (bars 49–57, final drop, A major)
// one answer per bar (0–15 s), each a headline and a small picture:
//   不存在 · 过不去 (the Great Filter) · 不敢出声 (the dark forest) · 已离开 · 听不懂
// 15–18 s   breakdown: 又或者——
// 18–24 s   我们，就是第一个。 every particle in the film converges into the Golden Record

const ANSWERS = [
  ['不存在', 'THERE IS NO ONE', '也许，他们根本不存在。', 'Maybe there is no one else.'],
  ['过不去', 'THE GREAT FILTER', '也许，他们都没能跨过某道关卡。', 'Maybe none of them made it past some great filter.'],
  ['不敢出声', 'THE DARK FOREST', '也许，他们躲在黑暗里，不敢出声。', 'Maybe they hide in the dark and dare not speak.'],
  ['已离开', 'LONG GONE', '也许，他们早已离开。', 'Maybe they are long gone.'],
  ['听不懂', 'WE CAN\'T UNDERSTAND YET', '也许，他们一直在说话，只是我们还听不懂。', 'Maybe they have been talking all along — and we can\'t understand yet.']];
const T_OR = 15, T_FIRST = 18;
let CONVERGE = null, FOREST = null, GLYPHS = null;

// 已离开: a ringed giant over a dusty plain, the broken towers and dome of a civilization that is gone
function deadWorld(k, a) {
  if (a <= 0) return;
  const cy = 610, hz = 760, px = 1480 - k * 8, py = 560, pr = 180;
  ctx.save(); ctx.globalAlpha = a;
  const sky = ctx.createLinearGradient(0, 380, 0, hz); sky.addColorStop(0, 'rgba(0,0,0,0)'); sky.addColorStop(1, 'rgba(70,76,88,.55)'); ctx.fillStyle = sky; ctx.fillRect(0, 380, W, hz - 380);
  const pg = ctx.createRadialGradient(px - 70, py - 80, 20, px, py, pr); pg.addColorStop(0, '#6d737c'); pg.addColorStop(.7, '#3c4148'); pg.addColorStop(1, '#16191d');
  ctx.save(); ctx.beginPath(); ctx.arc(px, py, pr, 0, TAU); ctx.clip(); ctx.fillStyle = pg; ctx.fillRect(px - pr, py - pr, 2 * pr, 2 * pr);
  for (let i = 0; i < 9; i++) { ctx.fillStyle = `rgba(${i % 2 ? 30 : 160},${i % 2 ? 34 : 166},${i % 2 ? 40 : 176},.12)`; ctx.fillRect(px - pr, py - pr + i * pr * .23 + Math.sin(i) * 8, 2 * pr, pr * .1); }
  ctx.restore();
  ctx.strokeStyle = 'rgba(200,206,216,.55)'; ctx.lineWidth = 9; ctx.beginPath(); ctx.ellipse(px, py, pr * 1.9, pr * .32, -.22, -.15, PI + .15); ctx.stroke();
  ctx.strokeStyle = 'rgba(200,206,216,.3)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(px, py, pr * 2.15, pr * .37, -.22, -.15, PI + .15); ctx.stroke();
  const gg = ctx.createLinearGradient(0, hz - 30, 0, H); gg.addColorStop(0, '#2b2f35'); gg.addColorStop(1, '#08090b'); ctx.fillStyle = gg;
  ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, hz + Math.sin(x * .004) * 14 + Math.sin(x * .017) * 5); ctx.lineTo(W, H); ctx.fill();
  const r = rng(404); ctx.fillStyle = '#0d0f12';
  for (const [x, w, h, cut] of [[300, 70, 300, .3], [400, 46, 190, -.4], [520, 110, 380, .25], [1500, 60, 240, -.3], [1620, 90, 320, .35]]) {
    const base = hz + 4; ctx.beginPath(); ctx.moveTo(x, base); ctx.lineTo(x, base - h); ctx.lineTo(x + w * .4, base - h - w * cut); ctx.lineTo(x + w, base - h + w * .3); ctx.lineTo(x + w, base); ctx.fill();
    ctx.fillStyle = 'rgba(150,158,170,.08)'; for (let yy = base - h + 20; yy < base - 10; yy += 26) ctx.fillRect(x + 8, yy, w - 16, 7); ctx.fillStyle = '#0d0f12';
  }
  ctx.beginPath(); ctx.arc(980, hz + 6, 150, PI, PI * 1.62); ctx.lineTo(980 + Math.cos(PI * 1.62) * 100, hz + 6 - 40); ctx.lineTo(1060, hz - 60); ctx.lineTo(1130, hz + 6); ctx.fill();
  for (let i = 0; i < 40; i++) { ctx.fillStyle = `rgba(200,200,205,${.05 * r()})`; const x = (r() * W + k * 30 * (1 + r())) % W; ctx.fillRect(x, hz - 40 + r() * 120, 2, 2); }
  ctx.restore();
}

function headline(zh, en, k, y = 290, size = 116) {
  const a = sstep(0, .2, k) * (1 - sstep(2.6, 3, k)), z = 1.08 - .08 * eout(clamp(k / .5));
  ctx.save(); ctx.translate(W / 2, y); ctx.scale(z, z); ctx.translate(-W / 2, -y);
  ctx.globalAlpha = a; ctx.font = `900 ${size}px ${F_ZH}`; ctx.letterSpacing = '16px'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const tw = textW(zh, size, F_ZH, 900, 16); ctx.fillStyle = silverGrad(W / 2 - tw / 2, W / 2 + tw / 2, -.2 + 1.4 * clamp(k / 2));
  ctx.fillText(zh, W / 2 + 8, y); ctx.restore();
  text(en, W / 2, y + size * .72, { font: F_EN, size: 18, ls: 8, color: GRAY, alpha: a });
}
function glyph(x, y, s, seed, a) {                               // a made-up character: a few strokes from a 3×3 lattice
  const r = rng(seed); ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = SILVER; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath();
  for (let i = 0; i < 3 + Math.floor(r() * 3); i++) { const p = () => [x + (Math.floor(r() * 3) - 1) * s, y + (Math.floor(r() * 3) - 1) * s]; const [a0, b0] = p(), [a1, b1] = p(); ctx.moveTo(a0, b0); ctx.lineTo(a1, b1); }
  if (r() < .4) { ctx.moveTo(x + s * .4, y); ctx.arc(x, y, s * .4, 0, TAU); }
  ctx.stroke(); ctx.restore();
}
function answerArt(i, k) {
  const a = sstep(0, .25, k) * (1 - sstep(2.6, 3, k)), cy = 620;
  if (i === 0) {                                                 // the whole galaxy goes out but one point
    const cam = { yaw: .7 + k * .08, pitch: 1.1, cx: W / 2, cy, F: 900, D: 4.4 };
    drawGalaxy(cam, a * (1 - sstep(.4, 2.2, k)), { size: 1.3, core: .5 });
    const [x, y] = proj(GALAXY[COLONY_O].v, cam.yaw, cam.pitch, cam.cx, cam.cy, cam.F, cam.D);
    add(() => glowDot(x, y, 26, RGB.A, a)); label(x + 24, y, '我们', 'US', a * sstep(1.4, 1.9, k), { len: 30, color: ACC, rgb: RGB.A });
  } else if (i === 1) {                                          // steps; at each one most of the climbers fall away
    const N = [96, 48, 22, 9, 3, 1], x0 = 560, sw = 150, sh = 46;
    N.forEach((n, s) => {
      const t = .2 + s * .32, sa = sstep(t, t + .15, k) * a, x = x0 + s * sw, y = cy + 110 - s * sh;
      line(x, y, x + sw - 14, y, RGB.S, .7 * sa, 2);
      add(() => { for (let j = 0; j < n; j++) { const r = rng(s * 131 + j); ctx.fillStyle = rgba(RGB.W, sa * .9); ctx.fillRect(x + 6 + r() * (sw - 26), y - 6 - r() * 26, 2.4, 2.4); } });
      if (s < N.length - 1) { const fall = clamp((k - t - .3) / .9); if (fall > 0) add(() => { for (let j = N[s + 1]; j < n; j++) { const r = rng(s * 977 + j); ctx.fillStyle = rgba(RGB.G, sa * (1 - fall)); ctx.fillRect(x + 6 + r() * (sw - 26), y + fall * fall * 220 * (.5 + r()), 2, 2); } }); }
    });
    const wx = x0 + 6 * sw - 4, wa = sstep(2.1, 2.3, k) * a;
    add(() => { ctx.fillStyle = rgba(RGB.A, .5 * wa); ctx.fillRect(wx, cy - 220, 4, 360); glowDot(wx, cy - 40, 160, RGB.A, .25 * wa); });
  } else if (i === 2) {                                          // the dark forest: points of light go out, one after another
    FOREST.forEach(([x, y, t]) => { const on = 1 - sstep(t, t + .12, k); if (on > 0) add(() => glowDot(x, y, 10, RGB.W, a * on * .9)); });
    text('黑暗森林 · 刘慈欣《三体》', W / 2, cy + 200, { font: F_SANS, size: 18, ls: 4, color: GRAY, alpha: a * sstep(.6, 1, k) });
  } else if (i === 3) {
    deadWorld(k, a);
  } else {                                                       // a stream of signs we cannot read
    GLYPHS.forEach(([x, y, seed]) => glyph(((x - k * 90) % 1640 + 1640) % 1640 + 140, y, 11, seed, a * .65));
    text('?', W / 2, cy + 10, { font: F_EN, size: 120, color: ACC, alpha: a * sstep(1.2, 1.6, k), glow: 'rgba(0,0,0,1)', blur: 30 });
  }
}

scene({ name: 'first', bar: 49, bars: 8, fi: .01, mb: 2, grade: { bloom: .5, thresh: .7 },
  subs: ANSWERS.map(([, , zh, en], i) => [i * BAR + .3, i * BAR + 2.85, zh, en]),
  sfx: [...ANSWERS.map((_, i) => [i * BAR, 'snap']), [T_OR, 'ping', { midi: 81 }], [T_FIRST + .05, 'sparkle', { dur: 3 }]],
  hits: [[0, .8], ...[1, 2, 3, 4].map(i => [i * BAR, .3]), [T_FIRST, 1]],
  cam: (lt) => lt < T_FIRST ? { z: 1 + .03 * ((lt % BAR) / BAR), x: 0, y: 0 } : { z: 1 + .05 * (lt - T_FIRST) / 6, x: 0, y: 0 },
  shot: lt => lt < T_OR ? Math.floor(lt / BAR) : lt < T_FIRST ? 5 : 6,
  init() {
    const r = rng(1957);
    FOREST = Array.from({ length: 140 }, () => [260 + r() * 1400, 470 + r() * 290, .3 + r() * 2]);
    GLYPHS = Array.from({ length: 150 }, (_, i) => [r() * 1640, 520 + (i % 6) * 36, i * 17 + 3]);
    CONVERGE = Array.from({ length: 2400 }, () => {
      const a = r() * TAU, d = 900 + r() * 700, rr = Math.sqrt(r()) * 230, b = r() * TAU;
      return { sx: W / 2 + Math.cos(a) * d, sy: 620 + Math.sin(a) * d * .7, tx: W / 2 + Math.cos(b) * rr, ty: 620 + Math.sin(b) * rr, dl: r() * .5, gold: r() < .5 };
    });
  },
  draw(lt) {
    starfield(lt, .6, 3);
    if (lt < T_OR) { const i = Math.floor(lt / BAR), k = lt - i * BAR; answerArt(i, k); headline(ANSWERS[i][0], ANSWERS[i][1], k); return; }
    if (lt < T_FIRST) {
      const k = lt - T_OR, a = sstep(.1, .6, k) * (1 - sstep(2.6, 3, k));
      text('又或者——', W / 2, 360, { font: F_ZH, size: 84, weight: 700, color: WHITE, alpha: a });
      text('OR MAYBE —', W / 2, 440, { font: F_EN, size: 18, ls: 10, color: GRAY, alpha: a });
      lonePoint(k, [bt(1)], a * .6, .6);
      return;
    }
    const k = lt - T_FIRST;
    shade('planet', k, [W / 2, 760 + 2600, 2600, k], [1300 + 40 * k, 770 - 8 * k, 1.2, 0], null, null, .95 * sstep(.4, 2.4, k));
    add(() => {
      for (const p of CONVERGE) {
        const e = eexpo(clamp((k - p.dl) / 1.4)), x = lerp(p.sx, p.tx, e), y = lerp(p.sy, p.ty, e);
        ctx.fillStyle = p.gold ? GOLD : WHITE; ctx.globalAlpha = .7 * clamp(k * 3) * (1 - sstep(1.8, 2.6, k) * .9);
        ctx.fillRect(x - 1, y - 1, 2, 2);
      }
      glowDot(W / 2, 620, 320, RGB.GOLD, .3 * sstep(1.4, 2.4, k));
    });
    photo('golden_record', W / 2, 620, 470, sstep(1.6, 2.6, k), { rot: k * .25 });
    const z = 1.06 - .06 * eout(clamp(k / .7)), ta = sstep(0, .3, k);
    ctx.save(); ctx.translate(W / 2, 250); ctx.scale(z, z); ctx.translate(-W / 2, -250);
    ctx.globalAlpha = ta; ctx.font = `900 112px ${F_ZH}`; ctx.letterSpacing = '14px'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const tw = textW('我们，就是第一个。', 112, F_ZH, 900, 14); ctx.fillStyle = silverGrad(W / 2 - tw / 2, W / 2 + tw / 2, -.2 + 1.4 * clamp(k / 3));
    ctx.shadowColor = 'rgba(232,194,122,.25)'; ctx.shadowBlur = 24; ctx.fillText('我们，就是第一个。', W / 2 + 7, 250); ctx.restore();
    text('WE ARE THE FIRST', W / 2, 336, { font: F_EN, size: 22, ls: 12, color: GOLD, alpha: sstep(.5, 1, k) });
  } });
