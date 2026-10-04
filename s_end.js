'use strict';
// ======================================================================== END 尾声  (bars 57–62)
// the same lone point as the cold open, the same heartbeat, the tally: 2026 · 0.
// then, once, far away, something flickers — on the beat where the score plays its one answering note.

const T_ANSWER = 3 * BAR + BEAT;                                 // music.py: RESPONSE_T = bar 60 + one beat
const FAR = [1530, 270];

scene({ name: 'end', bar: 57, bars: 5, fi: .6, fo: 2.5, mb: 2, grade: { bloom: .45, thresh: .78 },
  sfx: [[1, 'stamp']],
  reply: [[1, 2026, { dur: 3.6 }]],
  cam: (lt, d) => ({ z: 1 + .05 * lt / d, x: 0, y: 0 }),
  draw(lt) {
    nebula(W / 2, H / 2 + 40, W * 1.25, .45, -.12);
    starfield(lt, .8, 2);
    const pa = 1 - sstep(10.4, 11.4, lt);
    lonePoint(lt, [bt(1), bt(3), bt(5), bt(7), 2 * BAR, 2 * BAR + bt(2)], pa);
    if (lt > T_ANSWER - .05) {                                    // the reply: faint, far, once
      const u = lt - T_ANSWER, a = Math.exp(-u * 1.3) * sstep(0, .05, u);
      add(() => { glowDot(FAR[0], FAR[1], 30, RGB.A, .9 * a); glowDot(FAR[0], FAR[1], 4, RGB.W, a); });
      ring(FAR[0], FAR[1], 8 + u * 90, RGB.A, .4 * a, 1);
    }
    const t1 = sstep(10.4, 11.2, lt), t2 = sstep(11.8, 12.6, lt);
    text('我们从未相遇。', W / 2, 450, { font: F_ZH, size: 84, weight: 900, color: WHITE, alpha: t1, ls: 10 });
    text('但我们，从未停止呼唤。', W / 2, 570, { font: F_ZH, size: 60, weight: 700, color: SILVER, alpha: t2, ls: 8 });
    text('We never met. But we never stopped calling.', W / 2, 650, { font: F_IT, style: 'italic', size: 28, color: GRAY, alpha: sstep(12.4, 13.2, lt) });
  } });
