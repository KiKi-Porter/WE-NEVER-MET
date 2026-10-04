'use strict';
// ======================================================================== S0 cold open  (bars 0–6)
// 0–6 s    a lone point of light pulses on the beat; each pulse rings outward and nothing answers
// 6–12 s   eight flash-cut teasers, one per beat
// 12–15 s  back to the lone pulse; riser
// 15–18 s  impact: star dust rushes into the title 我们从未相遇

const PULSES = [bt(1), bt(3), bt(5), bt(7)];
const TEASE = [                                                // [word, scene name, local time to flash back to]
  ['Where is everybody?', 'silence', 13.5], ['Project Ozma', 'drake', 3], ['1679', 'called', 6.5], ['23 × 73', 'called', 15],
  ['6EQUJ5', 'wow', 7.5], ['2020 · 12 · 01', 'ears', 4.5], ['FAST · 500 m', 'ears', 10], ['1 light-day', 'echo', 4]];
const TITLE = { y: 500, size: 150 };
let TITLE_P = null;

// a nearly edge-on spiral behind the title, turning very slowly
const openCam = lt => ({ yaw: 2.2 + lt * .012, pitch: .36, cx: W / 2, cy: H / 2 + 60, F: 1700, D: 2.6 });

function pulse(cx, cy, u, a = 1, big = 1) {                     // u = seconds since the beat
  if (u < 0) return;
  add(() => {
    glowDot(cx, cy, (34 + 40 * Math.exp(-u * 7)) * big, RGB.W, a * (.85 * Math.exp(-u * 3) + .18));
    ring(cx, cy, (16 + u * 380) * big, RGB.W, a * .55 * Math.exp(-u * 1.7), 1.6);
    ring(cx, cy, (10 + u * 250) * big, RGB.A, a * .3 * Math.exp(-u * 2.2), 1);
  });
}
function lonePoint(lt, beats, a = 1, big = 1) {
  add(() => glowDot(W / 2, H / 2, 22 * big, RGB.W, a * (.5 + .08 * Math.sin(lt * 3))));
  for (const tb of beats) pulse(W / 2, H / 2, lt - tb, a, big);
}

scene({ name: 'open', bar: 0, bars: 6, fi: .01, fo: .5, mb: 2, grade: { bloom: .45, thresh: .7 },
  subs: [[.9, 3.7, '宇宙里有数千亿个星系。', 'There are hundreds of billions of galaxies.'],
    [3.9, 5.9, '一百三十八亿年。', 'Thirteen point eight billion years.'],
    [12.25, 14.9, '可是，从来没有人回过一句"你好"。', 'And yet, no one has ever said hello.']],
  sfx: [...PULSES.map(t => [t, 'heart']), ...TEASE.map((_, i) => [6 + bt(i), i % 2 ? 'tick' : 'glitch']),
    [12, 'ping', { midi: 81 }], [12, 'riser', { dur: 3 }], [15, 'impact'], [15.05, 'sparkle', { dur: 2.6 }]],
  hits: [[15, 1]],
  cam: lt => ({ z: lt < 6 ? 1.06 - .06 * lt / 6 : lt < 12 ? 1 : lt < 15 ? 1 + .04 * (lt - 12) / 3 : 1 + .03 * (lt - 15) / 3, x: 0, y: 0 }),
  shot: lt => lt < 6 ? -1 : lt < 12 ? Math.floor((lt - 6) / BEAT) : lt < 15 ? 98 : 99,
  init() {
    const pts = textPts('title', x => { x.font = `900 ${TITLE.size}px ${F_ZH}`; x.letterSpacing = '24px'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('我们从未相遇', W / 2 + 12, TITLE.y); }, 3, 2600, 9);
    const r = rng(41);
    TITLE_P = pts.map(p => { const a = r() * TAU, d = 300 + r() * 900; return { tx: p[0], ty: p[1], sx: W / 2 + Math.cos(a) * d, sy: H / 2 + Math.sin(a) * d * .6, dl: r() * .35, z: .4 + r() * .6 }; });
  },
  draw(lt) {
    if (lt < 6) {                                              // the lone pulse, the galaxy band slowly appearing behind it
      const bg = sstep(1, 6, lt);
      nebula(W / 2, H / 2 + 40, W * 1.25, .55 * bg, -.12);
      starfield(lt, bg * .9, 3);
      lonePoint(lt, PULSES);
      return;
    }
    if (lt < 12) {                                             // flash cuts on the beat
      const bi = Math.min(7, Math.floor((lt - 6) / BEAT)), f = (lt - 6) / BEAT - bi, [word, sn, t0] = TEASE[bi], src = sceneByName(sn);
      ctx.save(); const z = 1.12 - .12 * eout(clamp(f * 1.4)); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
      ctx.globalAlpha = .6; NO_PHOTO = true; if (src) src.draw(t0 + f * BEAT, src.d / STRETCH, src.t0 + t0); NO_PHOTO = false; ctx.restore();
      ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(0, 0, W, H);
      glitchText(word, W / 2, H / 2, word.length > 12 ? 92 : 128, sstep(0, .06, f) * (1 - sstep(.85, 1, f)), F_EN, bi + Math.floor(f * 6));
      ctx.fillStyle = `rgba(255,255,255,${.14 * (1 - clamp(f * 6))})`; ctx.fillRect(0, 0, W, H);
      return;
    }
    const k = lt - 15;
    nebula(W / 2, H / 2 + 40, W * 1.25, lt < 15 ? .4 : .65, -.12);
    starfield(lt, .9, 3, 0, lt < 15 ? 1 + .25 * ein(clamp((lt - 12) / 3)) : 1);
    if (lt < 15.2) lonePoint(lt - 12, [0, bt(2)], 1 - sstep(14.7, 15.15, lt), 1 + .6 * ein(clamp((lt - 12) / 3)));
    if (k > -.05 && TITLE_P) {                                 // star dust rushes in and writes the title, then settles into type
      add(() => {
        ctx.fillStyle = '#fff';
        for (const p of TITLE_P) {
          const e = eexpo(clamp((k - p.dl * .5) / .9)), x = lerp(p.sx, p.tx, e), y = lerp(p.sy, p.ty, e);
          ctx.globalAlpha = (.3 + .6 * p.z) * clamp(k * 6) * (1 - sstep(1.1, 1.8, k) * .8);
          const s = 1.4 + 2.2 * (1 - e); ctx.fillRect(x - s / 2, y - s / 2, s, s);
        }
      });
      const ta = sstep(.6, 1.3, k);
      if (ta > 0) {
        ctx.save(); ctx.globalAlpha = ta; ctx.font = `900 ${TITLE.size}px ${F_ZH}`; ctx.letterSpacing = '24px'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const tw = textW('我们从未相遇', TITLE.size, F_ZH, 900, 24);
        ctx.fillStyle = silverGrad(W / 2 - tw / 2, W / 2 + tw / 2, -.2 + 1.4 * clamp((k - .7) / 1.8));
        ctx.shadowColor = 'rgba(200,220,255,.18)'; ctx.shadowBlur = 18; ctx.fillText('我们从未相遇', W / 2 + 12, TITLE.y); ctx.restore();
      }
      const la = sstep(1, 1.6, k);
      line(W / 2 - 260 * eout(clamp((k - .9) / .8)), 640, W / 2 + 260 * eout(clamp((k - .9) / .8)), 640, RGB.S, .5 * la, 1);
      text('WE NEVER MET', W / 2, 686, { font: F_EN, size: 34, ls: 18, color: SILVER, alpha: la });
      text('THE FERMI PARADOX  ·  费米悖论', W / 2, 738, { font: F_SANS, size: 18, ls: 8, color: GRAY, alpha: sstep(1.3, 1.9, k) });
    }
  } });
