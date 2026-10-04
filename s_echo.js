'use strict';
// ======================================================================== VI 回头看 · LOOKING BACK  (bars 42–49, the quiet bridge, no drums)
// 0–8 s     Voyager 1 drifts away alone; its distance counts up in light-hours until it reaches one light-day (Oct 2026)
// 8–15 s    flashback to 1990-02-14: it turns its camera back; in a band of scattered sunlight, one blue pixel
// 15–21 s   from that dot our radio bubble (100 ly) grows — then the camera pulls back and the galaxy swallows it

const T_DOT = 8, T_RING = 11, T_BUBBLE = 15, T_GAL2 = 17;
const LH_KM = 1.079e9;                                          // one light-hour in km

function sunBands(a) {                                          // the scattered-sunlight streaks of the Pale Blue Dot frame
  const bands = [[1060, 120, -.32], [1180, 150, -.32], [1330, 90, -.32]];
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const [x, w, ang] of bands) {
    ctx.save(); ctx.translate(x, H / 2); ctx.rotate(ang);
    const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.5, `rgba(205,190,170,${.16 * a})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(-w / 2, -H, w, 2 * H); ctx.restore();
  }
  ctx.restore();
}

scene({ name: 'echo', bar: 42, bars: 7, ch: ['VI', '回头看', 'LOOKING BACK'], fi: .6, fo: .5, mb: 2, grade: { bloom: .8, vig: .6 },
  subs: [[.8, 4.6, '2026 年 10 月，旅行者 1 号即将飞到离地球"一光日"远的地方。', 'In October 2026, Voyager 1 is about to reach one light-day from home.'],
    [5, 7.6, '它已经飞了 49 年。', 'It has been flying for 49 years.'],
    [8.4, 11.4, '1990 年，它曾回过一次头，给地球拍了一张照片。', 'In 1990, it turned around once and took a picture of us.'],
    [11.8, 14.6, '六十亿公里外，我们只是一个暗淡的蓝点。', 'From six billion kilometres away, we are a pale blue dot.'],
    [15.2, 18, '我们所有的声音，才走过银河系的千分之一。', 'Everything we have ever broadcast has crossed a thousandth of the galaxy.'],
    [18.3, 20.8, '也许不是宇宙太安静，是我们还太小。', 'Maybe the universe isn\'t quiet. Maybe we are just small.']],
  sfx: [[.6, 'swell', { dur: 3 }], [4.4, 'ding', { midi: 88 }], [T_DOT, 'shutter'], [T_RING, 'ping', { midi: 81 }], [T_BUBBLE, 'swell', { dur: 2.4 }], [T_GAL2, 'whoosh', { dur: 2.4 }]],
  cam: (lt) => lt < T_DOT ? { z: 1 + .03 * lt / T_DOT, x: 0, y: 0 } : lt < T_BUBBLE ? { z: 1 + .05 * eio(clamp((lt - T_DOT) / 7)), x: 0, y: 0 } : { z: 1, x: 0, y: 0 },
  shot: lt => lt < T_DOT ? 0 : lt < T_BUBBLE ? 1 : 2,
  draw(lt) {
    // ---- Voyager, alone
    if (lt < T_DOT) {
      const a = sstep(0, 1, lt) * (1 - sstep(T_DOT - .6, T_DOT, lt)), s = lerp(1, .55, eio(clamp(lt / T_DOT)));
      starfield(lt, .9, -3);
      add(() => glowDot(160, 300, 520, [230, 220, 200], .14 * a));            // the Sun, far behind it
      photo('voyager', lerp(W / 2 + 60, W / 2 + 260, lt / T_DOT), lerp(H / 2, H / 2 - 60, lt / T_DOT), W * .9 * s, a, { rot: -.05 + .02 * lt });
      const lh = 24 * eout(clamp((lt - .6) / 3.8)), day = lh >= 23.99;
      const ca = sstep(.6, 1.1, lt) * a;
      text(day ? '1 光日' : `${lh.toFixed(1)} 光时`, 140, 760, { font: F_ZH, size: 64, weight: 900, color: day ? WHITE : SILVER, alpha: ca, align: 'left', glow: day ? 'rgba(200,220,255,.5)' : null, blur: 24 });
      text(`${(lh * LH_KM / 1e9).toFixed(1)} × 10⁹ km`, 142, 820, { font: F_EN, size: 22, ls: 4, color: GRAY, alpha: ca, align: 'left' });
      text('VOYAGER 1 · LAUNCHED 1977 · 09 · 05', 142, 856, { font: F_EN, size: 14, ls: 5, color: GRAY, alpha: ca, align: 'left' });
      text('2026 · 10', W - 140, 760, { font: F_EN, size: 54, ls: 6, color: WHITE, alpha: sstep(4.2, 4.8, lt) * a, align: 'right' });
      return;
    }
    // ---- the Pale Blue Dot
    const dot = [1188, 520];
    if (lt < T_GAL2) {
      const k = lt - T_DOT, a = sstep(0, .25, k) * (1 - sstep(T_GAL2 - T_DOT - .4, T_GAL2 - T_DOT, k));
      const ba = a * (1 - sstep(T_BUBBLE - T_DOT, T_BUBBLE - T_DOT + 1, k));
      sunBands(ba);
      for (let i = 0; i < 160; i++) { const r = rng(i * 13 + 1); ctx.fillStyle = `rgba(255,255,255,${.06 * ba * r()})`; ctx.fillRect(r() * W, r() * H, 1, 1); }   // sensor noise
      add(() => { glowDot(dot[0], dot[1], 10, [150, 190, 255], a); ctx.fillStyle = rgba([170, 205, 255], a); ctx.fillRect(dot[0] - 1, dot[1] - 1, 2.4, 2.4); });
      const ra = sstep(T_RING - T_DOT, T_RING - T_DOT + .6, k) * a;
      ring(dot[0], dot[1], lerp(120, 34, eout(clamp((k - (T_RING - T_DOT)) / 1.2))), RGB.A, .8 * ra, 1.5);
      label(dot[0] + 50, dot[1] + 70, '地球', 'THAT\'S HERE. THAT\'S HOME.', ra * (1 - sstep(T_BUBBLE - T_DOT, T_BUBBLE - T_DOT + .5, k)), { len: 40 });
      text('1990 · 02 · 14', 140, 836, { font: F_EN, size: 54, ls: 6, color: WHITE, alpha: win(k, .3, T_BUBBLE - T_DOT, .5, .6), align: 'left' });
      text('PALE BLUE DOT · 6 × 10⁹ km', 142, 884, { font: F_EN, size: 15, ls: 6, color: SILVER, alpha: win(k, .6, T_BUBBLE - T_DOT, .5, .6), align: 'left' });
      // our radio bubble growing out of it
      if (lt > T_BUBBLE) {
        const u = lt - T_BUBBLE, br = 340 * eout(clamp(u / 1.8));
        ctx.save(); const g = ctx.createRadialGradient(dot[0], dot[1], 0, dot[0], dot[1], Math.max(1, br)); g.addColorStop(0, 'rgba(127,180,255,0)'); g.addColorStop(.85, `rgba(127,180,255,${.08 * a})`); g.addColorStop(1, `rgba(127,180,255,${.3 * a})`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(dot[0], dot[1], br, 0, TAU); ctx.fill(); ctx.restore();
        ring(dot[0], dot[1], br, RGB.A, .6 * a, 1.5);
        text('100 光年', dot[0], dot[1] - br - 24, { font: F_ZH, size: 26, weight: 700, color: ACC, alpha: a * sstep(.8, 1.3, u) });
      }
      return;
    }
    // ---- the galaxy swallows it
    const k = lt - T_GAL2, z = eio(clamp(k / 2.2));
    const cam = { yaw: 1.1 + k * .03, pitch: 1.12, cx: W / 2, cy: 470, F: lerp(9000, 1500, z), D: 4.4 };
    const sun = GALAXY[COLONY_O].v, [ox, oy] = proj(sun, cam.yaw, cam.pitch, 0, 0, cam.F, cam.D);
    cam.cx = lerp(dot[0] - ox, W / 2, z); cam.cy = lerp(dot[1] - oy, 470, z);      // start centred on the dot, end on the galaxy
    starfield(lt, .5, 1);
    drawGalaxy(cam, sstep(0, .8, k), { size: 1.5, core: .7 });
    const [x, y] = proj(sun, cam.yaw, cam.pitch, cam.cx, cam.cy, cam.F, cam.D);
    const br = Math.max(1.5, lerp(340, 2, z)), ba = 1 - sstep(3.4, 4, k) * 0;
    ring(x, y, br, RGB.A, .8 * ba, 1.5); add(() => glowDot(x, y, 12 + br * .2, RGB.A, .7 * ba));
    label(x + 30, y - 30, '我们所有的声音', '100 LY OF 100,000', sstep(2, 2.6, k), { color: ACC, rgb: RGB.A });
    tex('bubble', W / 2, 820, 40, sstep(2.4, 3, k) * (1 - sstep(3.4, 3.9, k)), 'center');
  } });
