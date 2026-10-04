'use strict';
// ======================================================================== IV 72 秒 · SEVENTY-TWO SECONDS  (bars 28–34)
// 0–4.4 s    1977-08-15, Big Ear: line-printer paper scrolls by, all 1s and blanks
// 4.4–10.6   days later, under a desk lamp, Jerry Ehman reads the printout; the paper stops; 6EQUJ5 lights up,
//            a red pen circles it and writes "Wow!" (the film's only red)
// 10.6–13.6  the six characters become six bars: rising and falling over 72 s — the shape a fixed star makes
//            as it drifts through the telescope's beam
// 13.6–18    the same patch of sky searched again and again: nothing

const PAPER = { x: 600, w: 720, row: 34, cols: 24 };
const WOW = '6EQUJ5', WOW_COL = 2, WOW_ROW = 40;                 // where the signal sits on the printout
const WOW_V = [6, 14, 26, 30, 19, 5];                            // the character values (A = 10 …)
const T_LAMP = 4.4, T_STOP = 6.6, T_CIRCLE = 7.6, T_BARS = 10.6, T_RESCAN = 13.6;
const RESCANS = ['1987', '1989', '1995', '1999'];
const printChar = (r, c) => {
  if (c === WOW_COL && r >= WOW_ROW && r < WOW_ROW + 6) return WOW[r - WOW_ROW];
  const h = hash(r * 31.7 + c * 7.3);
  return h < .55 ? '1' : h < .62 ? '2' : h < .64 ? '3' : ' ';
};
function printout(lt, scroll, a, glowWow = 0) {                  // scroll = rows moved past the top
  const { x, w, row, cols } = PAPER, cw = (w - 120) / cols;
  ctx.save(); ctx.globalAlpha = a;
  ctx.fillStyle = '#121418'; ctx.fillRect(x, 0, w, H);
  ctx.strokeStyle = 'rgba(179,186,198,.25)'; ctx.lineWidth = 1;
  for (const xx of [x + 34, x + w - 34]) { ctx.beginPath(); ctx.moveTo(xx, 0); ctx.lineTo(xx, H); ctx.stroke(); }
  const off = (scroll % 1) * row, r0 = Math.floor(scroll);
  for (let i = -1; i < H / row + 1; i++) {
    const r = r0 + i, y = i * row - off + row / 2;
    for (const hx of [x + 17, x + w - 17]) { ctx.beginPath(); ctx.arc(hx, y, 6, 0, TAU); ctx.fillStyle = '#000'; ctx.fill(); }
    if (r % 2 === 0) { ctx.fillStyle = 'rgba(255,255,255,.025)'; ctx.fillRect(x + 34, y - row / 2, w - 68, row); }
  }
  ctx.font = `400 22px ${F_MONO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let i = -1; i < H / row + 1; i++) {
    const r = r0 + i, y = i * row - off + row / 2;
    for (let c = 0; c < cols; c++) {
      const ch = printChar(r, c); if (ch === ' ') continue;
      const isW = c === WOW_COL && r >= WOW_ROW && r < WOW_ROW + 6;
      ctx.fillStyle = isW && glowWow > 0 ? `rgba(255,255,255,${.55 + .45 * glowWow})` : 'rgba(170,178,190,.55)';
      ctx.fillText(ch, x + 60 + c * cw + cw / 2, y);
    }
  }
  ctx.restore();
  return (r) => [x + 60 + WOW_COL * cw + cw / 2, (r - scroll) * row + row / 2];
}

scene({ name: 'wow', bar: 28, bars: 6, ch: ['IV', '72 秒', 'SEVENTY-TWO SECONDS'], mb: 2,
  subs: [[.5, 4.2, '1977 年 8 月，"大耳朵"望远镜照常扫过天空。', 'August 1977. The Big Ear telescope in Ohio sweeps the sky, as usual.'],
    [4.6, 7.4, '几天后，志愿者埃曼在餐桌上翻看打印纸。', 'Days later, volunteer Jerry Ehman reads the printouts at his kitchen table.'],
    [7.6, 10.2, '他圈出一串字符，写下："Wow!"', 'He circles a few characters and writes: "Wow!"'],
    [10.6, 13.6, '信号只持续 72 秒——恰是恒星划过视野的时间。', 'It lasted 72 seconds — exactly how long a distant star takes to drift through the beam.'],
    [13.9, 18.3, '人们一次次回望那里，它再没出现。', 'For decades we pointed back at that spot. It never came again.']],
  sfx: [[.2, 'printer', { dur: 4.2 }], [T_LAMP, 'swell', { dur: 2 }], [T_STOP - .6, 'printer', { dur: .6 }], [T_STOP + .3, 'ping', { midi: 76 }],
    [T_CIRCLE, 'pen', { dur: .9 }], [T_CIRCLE + 1, 'pen', { dur: .5 }], [T_BARS, 'ding', { midi: 81 }],
    ...WOW_V.map((_, i) => [T_BARS + .2 + i * .25, 'blip', { midi: 72 + Math.round(WOW_V[i] / 2) }]),
    ...RESCANS.map((_, i) => [T_RESCAN + .3 + i * BEAT, 'tick']), [16.8, 'stamp']],
  hits: [[T_CIRCLE + 1.1, .25]],
  reply: [[16.8, 1977, { dur: 1.2, q: true }]],
  cam: (lt) => lt < T_LAMP ? { z: 1, x: 0, y: 0 } : lt < T_BARS ? { z: 1 + .12 * eio(clamp((lt - T_LAMP) / 4)), x: 0, y: -40 * eio(clamp((lt - T_LAMP) / 4)) } : { z: 1, x: 0, y: 0 },
  shot: lt => lt < T_LAMP ? 0 : lt < T_BARS ? 1 : 2,
  draw(lt) {
    if (lt < T_BARS) {
      // the paper scrolls fast while printing, then (on the kitchen table) slides to a stop with 6EQUJ5 near the middle
      const scroll = lt < T_LAMP ? 120 + lt * 9 : lerp(WOW_ROW - 34, WOW_ROW - 13.5, eout(clamp((lt - T_LAMP) / (T_STOP - T_LAMP))));
      const lamp = sstep(T_LAMP, T_LAMP + .8, lt);
      const pa = sstep(0, .5, lt) * (1 - sstep(T_BARS - .4, T_BARS, lt));
      const glow = sstep(T_STOP, T_STOP + .5, lt);
      if (lamp > 0) add(() => glowDot(W / 2, 520, 900, [240, 232, 214], .2 * lamp));
      const at = printout(lt, scroll, pa, glow);
      if (lamp > 0) {                                           // everything outside the lamp's pool goes dark
        ctx.save(); const g = ctx.createRadialGradient(W / 2, 520, 200, W / 2, 520, 820); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${.85 * lamp})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
      }
      if (lt < T_LAMP) {
        ctx.save(); const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(0,0,0,.9)'); g.addColorStop(.25, 'rgba(0,0,0,0)'); g.addColorStop(.75, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.9)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
        text('1977 · 08 · 15', 140, 836, { font: F_EN, size: 54, ls: 6, color: WHITE, alpha: win(lt, .4, 4.2, .5, .5), align: 'left' });
        text('BIG EAR · OHIO STATE UNIVERSITY', 142, 884, { font: F_EN, size: 15, ls: 6, color: SILVER, alpha: win(lt, .7, 4.2, .5, .5), align: 'left' });
      }
      // the red circle and "Wow!"
      if (lt > T_CIRCLE - .05) {
        const [cx] = at(0), y0 = at(WOW_ROW)[1], y1 = at(WOW_ROW + 5)[1], cy = (y0 + y1) / 2, pr = clamp((lt - T_CIRCLE) / .8);
        ctx.save(); ctx.globalAlpha = pa; ctx.strokeStyle = RED; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.ellipse(cx + 2, cy, 34, (y1 - y0) / 2 + 30, .05, -PI / 2, -PI / 2 + TAU * 1.06 * eio(pr)); ctx.stroke(); ctx.restore();
        const wa = sstep(T_CIRCLE + .95, T_CIRCLE + 1.4, lt) * pa, wk = clamp((lt - T_CIRCLE - .95) / .5);
        ctx.save(); ctx.beginPath(); ctx.rect(cx + 50, cy - 120, 260 * wk, 140); ctx.clip();
        text('Wow!', cx + 60, cy - 60, { font: '"Segoe Print", "Bradley Hand", cursive', size: 72, weight: 700, color: RED, alpha: wa, align: 'left' });
        ctx.restore();
        if (glow > 0) for (let i = 0; i < 6; i++) { const [x, y] = [cx, at(WOW_ROW + i)[1]]; add(() => glowDot(x, y, 26, RGB.W, .35 * glow)); }
        text('JERRY EHMAN · 1977', cx - 70, cy + (y1 - y0) / 2 + 80, { font: F_EN, size: 15, ls: 5, color: GRAY, alpha: wa, align: 'right' });
      }
      return;
    }
    // ---- six bars and the 72-second curve
    if (lt < T_RESCAN) {
      const k = lt - T_BARS, a = sstep(0, .4, k) * (1 - sstep(T_RESCAN - T_BARS - .4, T_RESCAN - T_BARS, k));
      starfield(lt, .4, 1);
      const x0 = 520, x1 = 1400, y0 = 760, hh = 420, bw = (x1 - x0) / 6;
      line(x0 - 30, y0, x1 + 30, y0, RGB.S, .6 * a, 1.5);
      WOW_V.forEach((v, i) => {
        const g = eback(clamp((k - .2 - i * .25) / .5)), h = v / 30 * hh * g, x = x0 + i * bw + bw / 2;
        ctx.save(); ctx.globalAlpha = a; const gr = ctx.createLinearGradient(0, y0 - h, 0, y0); gr.addColorStop(0, 'rgba(243,245,248,.95)'); gr.addColorStop(1, 'rgba(179,186,198,.25)'); ctx.fillStyle = gr; ctx.fillRect(x - bw * .3, y0 - h, bw * .6, h); ctx.restore();
        text(WOW[i], x, y0 + 40, { font: F_MONO, size: 34, color: WHITE, alpha: a * sstep(.2 + i * .25, .5 + i * .25, k) });
      });
      const ca = a * sstep(1.9, 2.4, k), pts = [];
      for (let i = 0; i <= 80; i++) { const u = i / 80, x = lerp(x0, x1, u), v = Math.exp(-Math.pow((u - .5) / .21, 2) * 1.0); pts.push([x, y0 - v * hh * (30.5 / 30) * clamp((k - 1.9) / .8 * 1.3 - u * .3 + .3)]); }
      glowPoly(pts, RGB.A, ca, 2.4);
      text('一颗恒星划过视野的样子', x1 + 40, y0 - hh * .75, { font: F_ZH, size: 24, weight: 700, color: ACC, alpha: ca, align: 'left' });
      text('A STAR DRIFTING THROUGH THE BEAM', x1 + 41, y0 - hh * .75 + 30, { font: F_EN, size: 12, ls: 3, color: GRAY, alpha: ca, align: 'left' });
      line(x0, y0 + 80, x1, y0 + 80, RGB.G, .6 * a, 1);
      line(x0, y0 + 72, x0, y0 + 88, RGB.G, .6 * a, 1); line(x1, y0 + 72, x1, y0 + 88, RGB.G, .6 * a, 1);
      text('72 秒', (x0 + x1) / 2, y0 + 110, { font: F_ZH, size: 30, weight: 700, color: WHITE, alpha: a * sstep(1, 1.5, k) });
      return;
    }
    // ---- searched again and again
    const k = lt - T_RESCAN;
    starfield(lt, .5, 1);
    const ta = 1 - sstep(4, 4.4, k);
    text('同一片天空 · THE SAME PATCH OF SKY', W / 2, 250, { font: F_SANS, size: 20, ls: 5, color: GRAY, alpha: sstep(0, .4, k) * ta });
    RESCANS.forEach((yr, i) => {
      const t = .3 + i * BEAT, a = sstep(t, t + .2, k) * ta, y = 360 + i * 110;
      text(yr, 640, y, { font: F_EN, size: 46, color: SILVER, alpha: a, align: 'right' });
      ctx.save(); ctx.globalAlpha = a; ctx.font = `400 28px ${F_MONO}`; ctx.fillStyle = 'rgba(170,178,190,.6)'; ctx.textBaseline = 'middle';
      const n = Math.floor(22 * clamp((k - t) / .5)); ctx.fillText('1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1'.slice(0, n * 2), 700, y); ctx.restore();
    });
  } });
