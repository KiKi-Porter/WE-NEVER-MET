'use strict';
// ======================================================================== I 费米的午餐 · FERMI'S LUNCH  (bars 6–12)
// 0–8 s     1950, Los Alamos: a real round dining table seen from above under one lamp; four seats fill in with
//           portraits and names; a newspaper clipping about flying saucers slides onto the table
// 8–12 s    Fermi's seat lights up: "Where is everybody?" → 大家都在哪儿？
// 12–18 s   the reasoning, told with a picture: one civilization spreads through the galaxy in ~10 million years,
//           a tiny notch on a 13-billion-year ruler

const TABLE = { x: W / 2, y: 480, r: 215, k: 1.3 };           // drawn at base size r, scaled by k
const SEATS = [['费米', 'ENRICO FERMI', -3 * PI / 4, 'portrait_fermi'], ['泰勒', 'EDWARD TELLER', -PI / 4, 'portrait_teller'],
  ['约克', 'HERBERT YORK', PI / 4, 'portrait_york'], ['科诺平斯基', 'EMIL KONOPINSKI', 3 * PI / 4, 'portrait_konopinski']];
const T_NAME = [1.5, 2.25, 3, 3.75], T_PAPER = 4.8, T_ASK = 8.2, T_ZH = 10.5, T_GAL = 12;
let COLONY = null, COLONY_O = 0, WOOD = null;                   // per galaxy particle: its distance from the first colony

function bakeTable() {                                           // oak, planks, grain, a dark worn rim
  const S = 2 * TABLE.r + 40, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), r = rng(1950), m = S / 2, R = TABLE.r;
  x.save(); x.beginPath(); x.arc(m, m, R, 0, TAU); x.clip();
  const g = x.createLinearGradient(0, 0, S, 0); g.addColorStop(0, '#4b3e32'); g.addColorStop(.5, '#392e24'); g.addColorStop(1, '#47392c'); x.fillStyle = g; x.fillRect(0, 0, S, S);
  for (let i = 0; i < 300; i++) {
    const y = r() * S, a = .03 + r() * .1, w = .5 + r() * 2; x.strokeStyle = r() < .55 ? `rgba(18,12,7,${a})` : `rgba(130,105,80,${a * .7})`; x.lineWidth = w; x.beginPath();
    for (let xx = 0; xx <= S; xx += 10) { const yy = y + Math.sin(xx * .012 + i) * 5 + Math.sin(xx * .05 + i * 3) * 1.4; xx ? x.lineTo(xx, yy) : x.moveTo(xx, yy); }
    x.stroke();
  }
  for (const sx of [S * .31, S * .53, S * .75]) { x.strokeStyle = 'rgba(8,5,3,.6)'; x.lineWidth = 2.2; x.beginPath(); x.moveTo(sx, 0); x.lineTo(sx + 5, S); x.stroke(); x.strokeStyle = 'rgba(140,115,90,.15)'; x.lineWidth = 1; x.beginPath(); x.moveTo(sx + 3, 0); x.lineTo(sx + 8, S); x.stroke(); }
  for (let i = 0; i < 6; i++) { const kx = r() * S, ky = r() * S; x.strokeStyle = 'rgba(15,10,6,.35)'; x.lineWidth = 1.4; for (let k = 1; k < 4; k++) { x.beginPath(); x.ellipse(kx, ky, 6 * k, 3.4 * k, .2, 0, TAU); x.stroke(); } }
  x.restore();
  x.lineWidth = 10; x.strokeStyle = 'rgba(14,9,5,.9)'; x.beginPath(); x.arc(m, m, R - 5, 0, TAU); x.stroke();
  x.lineWidth = 2; x.strokeStyle = 'rgba(165,138,108,.4)'; x.beginPath(); x.arc(m, m, R - 12, 0, TAU); x.stroke();
  return c;
}
function placeSetting(ang, a) {                                  // plate, knife, fork, cup — arranged as someone sitting at `ang` would find them
  const dx = Math.cos(ang), dy = Math.sin(ang), px = -dy, py = dx, R = TABLE.r;
  const cx = TABLE.x + dx * (R - 88), cy = TABLE.y + dy * (R - 88);
  ctx.save(); ctx.globalAlpha = a;
  ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 16; ctx.shadowOffsetX = 5; ctx.shadowOffsetY = 7;
  const pg = ctx.createRadialGradient(cx - 12, cy - 14, 6, cx, cy, 48); pg.addColorStop(0, '#aeaba3'); pg.addColorStop(.85, '#8f8c84'); pg.addColorStop(1, '#6f6c65');
  ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(cx, cy, 48, 0, TAU); ctx.fill();
  ctx.shadowColor = 'transparent';
  const wg = ctx.createRadialGradient(cx, cy, 8, cx, cy, 31); wg.addColorStop(0, '#9b988f'); wg.addColorStop(1, '#85827a'); ctx.fillStyle = wg; ctx.beginPath(); ctx.arc(cx, cy, 31, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(60,58,52,.5)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(cx, cy, 31, 0, TAU); ctx.stroke();
  // fork (left) and knife (right), lying along the radius
  const cut = (side, kind) => {
    const ox = cx + px * side * 70, oy = cy + py * side * 70; ctx.strokeStyle = '#8d9097'; ctx.lineWidth = 3.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(ox - dx * 44, oy - dy * 44); ctx.lineTo(ox + dx * 40, oy + dy * 40); ctx.stroke();
    if (kind === 'fork') { ctx.lineWidth = 1.6; for (const o of [-4, 0, 4]) { ctx.beginPath(); ctx.moveTo(ox - dx * 44 + px * o, oy - dy * 44 + py * o); ctx.lineTo(ox - dx * 62 + px * o, oy - dy * 62 + py * o); ctx.stroke(); } }
    else { ctx.lineWidth = 6; ctx.strokeStyle = '#999ca3'; ctx.beginPath(); ctx.moveTo(ox + dx * 40, oy + dy * 40); ctx.lineTo(ox + dx * 70, oy + dy * 70); ctx.stroke(); }
  };
  cut(-1, 'fork'); cut(1, 'knife');
  // coffee cup, top-down: saucer, cup, dark surface, handle
  const ux = cx - dx * 66 + px * 60, uy = cy - dy * 66 + py * 60;
  ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 10; ctx.shadowOffsetX = 4; ctx.shadowOffsetY = 5;
  ctx.fillStyle = '#85827a'; ctx.beginPath(); ctx.arc(ux, uy, 29, 0, TAU); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#a7a59d'; ctx.beginPath(); ctx.arc(ux, uy, 21, 0, TAU); ctx.fill();
  const cg = ctx.createRadialGradient(ux - 4, uy - 4, 2, ux, uy, 16); cg.addColorStop(0, '#4b3523'); cg.addColorStop(1, '#1e140c'); ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(ux, uy, 16, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#a7a59d'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(ux + px * 25, uy + py * 25, 8, 0, TAU); ctx.stroke();
  ctx.restore();
}
function newspaper(lt) {                                         // the clipping: slides in from the lower right and settles on the table
  const k = lt - T_PAPER; if (k < 0) return;
  const e = eout(clamp(k / .9)), a = clamp(k / .35) * (1 - sstep(T_ASK - .2, T_ASK + .5, lt));
  const x = lerp(TABLE.x + 700, TABLE.x + 20, e), y = lerp(TABLE.y + 520, TABLE.y + 8, e), rot = lerp(.5, .06, e);
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = a;
  ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10;
  const pg = ctx.createLinearGradient(-160, -105, 160, 105); pg.addColorStop(0, '#9a9588'); pg.addColorStop(1, '#827d71'); ctx.fillStyle = pg; ctx.fillRect(-160, -105, 320, 210); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(30,28,24,.35)'; ctx.lineWidth = 1; ctx.strokeRect(-150, -96, 300, 192);
  text('THE NEW YORKER', 0, -80, { font: F_EN, size: 13, ls: 6, color: '#4b473f', alpha: 1 });
  line(-140, -68, 140, -68, [40, 38, 34], .7, 1.2);
  text('FLYING SAUCERS?', 0, -44, { font: F_EN, size: 32, weight: 700, color: '#1d1b18', alpha: 1 });
  // the cartoon: a saucer taking a dustbin
  ctx.strokeStyle = '#2a2824'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.ellipse(-62, 10, 44, 11, 0, 0, TAU); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(-62, 2, 19, 13, 0, PI, TAU); ctx.stroke();
  ctx.globalAlpha = a * .45; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(-62 + i * 12, 21); ctx.lineTo(-62 + i * 18, 52); ctx.stroke(); } ctx.globalAlpha = a;
  ctx.strokeRect(-72, 56, 20, 22);
  for (let i = 0; i < 7; i++) { ctx.fillStyle = 'rgba(40,38,34,.55)'; ctx.fillRect(4, -22 + i * 14, 134 - (i % 3) * 22, 3.6); }
  ctx.restore();
}

scene({ name: 'silence', bar: 6, bars: 6, ch: ['I', '费米的午餐', "FERMI'S LUNCH"], fi: .5, mb: 2, grade: { bloom: .35, thresh: .8 },
  subs: [[.9, 4.7, '1950 年夏天，洛斯阿拉莫斯，四位物理学家在吃午饭。', 'Summer 1950, Los Alamos. Four physicists sit down to lunch.'],
    [4.8, 8.1, '他们聊起报纸上的飞碟新闻，笑成一团。', 'They joke about the flying saucers in the papers.'],
    [8.2, 10.4, '费米突然问了一句：', 'Then Fermi asks:'],
    [12, 15.2, '只要有一个文明会星际航行，几千万年就能走遍银河系。', 'One civilization with starships could cross the galaxy in tens of millions of years.'],
    [15.3, 17.9, '而银河系已存在一百多亿年。', 'And the galaxy is more than ten billion years old.']],
  sfx: [...T_NAME.map(t => [t, 'type', { dur: .35 }]), [T_PAPER, 'whoosh', { dur: .8 }], [T_ASK + .1, 'type', { dur: 1.7 }], [T_ZH, 'ding', { midi: 81 }],
    [T_GAL, 'swell', { dur: 3.2 }], [15.3, 'ding', { midi: 76 }], [16.3, 'stamp']],
  hits: [[T_ZH, .3]],
  reply: [[16.3, 1950, { dur: 1.7 }]],
  cam: (lt, d) => lt < T_GAL ? { z: 1 + .04 * lt / T_GAL, x: 0, y: 0 } : { z: 1 + .03 * (lt - T_GAL) / 6, x: 0, y: 0 },
  shot: lt => lt < T_GAL ? 0 : 1,
  init() {
    WOOD = bakeTable();
    COLONY_O = GALAXY.findIndex(p => Math.abs(Math.hypot(p.v[0], p.v[2]) - .72) < .01);    // a star out on an arm, like the Sun
    const o = GALAXY[COLONY_O].v;
    COLONY = GALAXY.map(p => Math.hypot(p.v[0] - o[0], p.v[1] - o[1], p.v[2] - o[2]));
  },
  draw(lt) {
    if (lt < T_GAL) {
      starfield(lt, .25, 2);
      const ta = sstep(.2, 1.2, lt) * (1 - sstep(T_ASK, T_ASK + .8, lt) * .88) * (1 - sstep(11.4, 12, lt));
      if (ta > 0) {
        // the table, lit by one lamp straight overhead: bright at the centre, falling away fast
        ctx.save(); ctx.translate(TABLE.x, TABLE.y); ctx.scale(TABLE.k, TABLE.k); ctx.translate(-TABLE.x, -TABLE.y);
        ctx.globalAlpha = ta; ctx.drawImage(WOOD, TABLE.x - WOOD.width / 2, TABLE.y - WOOD.height / 2); ctx.globalAlpha = 1;
        SEATS.forEach(([, , ang], i) => placeSetting(ang, ta * sstep(T_NAME[i] - .3, T_NAME[i] + .3, lt)));
        newspaper(lt);
        ctx.globalAlpha = ta; const lg = ctx.createRadialGradient(TABLE.x, TABLE.y, 60, TABLE.x, TABLE.y, TABLE.r + 20);
        lg.addColorStop(0, 'rgba(0,0,0,0)'); lg.addColorStop(.6, 'rgba(0,0,0,.28)'); lg.addColorStop(1, 'rgba(0,0,0,.8)'); ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(TABLE.x, TABLE.y, TABLE.r + 25, 0, TAU); ctx.fill();
        ctx.restore();
      }
      // the four men: a portrait ring, a name, and Fermi's turns blue when he speaks
      SEATS.forEach(([zh, en, ang, pn], i) => {
        const px = TABLE.x + Math.cos(ang) * 600, py = TABLE.y + Math.sin(ang) * 318;
        const na = sstep(T_NAME[i], T_NAME[i] + .45, lt) * (1 - sstep(11.4, 12, lt)), ask = i === 0 ? sstep(T_ASK - .2, T_ASK + .3, lt) : 0, dim = 1 - .6 * sstep(T_ASK, T_ASK + .5, lt) * (i ? 1 : 0);
        ctx.save(); ctx.globalAlpha = na * dim; ctx.fillStyle = 'rgba(14,16,20,.9)'; ctx.beginPath(); ctx.arc(px, py, 104, 0, TAU); ctx.fill(); ctx.restore();
        ring(px, py, 104, ask > 0 ? RGB.A : RGB.S, na * dim * (.55 + .4 * ask), ask > 0 ? 2.5 : 1.5);
        if (ask > 0) add(() => glowDot(px, py, 160, RGB.A, .45 * ask * na));
        ctx.save(); ctx.beginPath(); ctx.arc(px, py, 100, 0, TAU); ctx.clip(); photo(pn, px, py + 6, 196, na * dim); ctx.restore();
        text(zh, px, py + 136, { font: F_ZH, size: 28, weight: 700, color: ask > 0 ? WHITE : SILVER, alpha: na * dim });
        text(en, px, py + 164, { font: F_EN, size: 13, ls: 4, color: GRAY, alpha: na * dim });
      });
      text('1950 · 夏', 140, 836, { font: F_EN, size: 54, ls: 6, color: WHITE, alpha: win(lt, .6, 4.6, .6, .6), align: 'left' });
      text('LOS ALAMOS · NEW MEXICO', 142, 884, { font: F_EN, size: 15, ls: 6, color: SILVER, alpha: win(lt, .9, 4.6, .6, .6), align: 'left' });
      // the question
      if (lt > T_ASK) {
        const qa = 1 - sstep(T_ZH - .25, T_ZH, lt);
        typeText('"Where is everybody?"', clamp((lt - T_ASK - .1) / 1.6), W / 2 - textW('"Where is everybody?"', 76, F_IT, 400) / 2, TABLE.y, { font: F_IT, style: 'italic', size: 76, color: WHITE, alpha: qa, glow: 'rgba(0,0,0,.9)', blur: 20 });
      }
      if (lt > T_ZH - .05) {
        const k = lt - T_ZH, a = sstep(0, .25, k) * (1 - sstep(1.1, 1.5, k)), z = 1.06 - .06 * eout(clamp(k / .8));
        ctx.save(); ctx.translate(W / 2, TABLE.y); ctx.scale(z, z); ctx.translate(-W / 2, -TABLE.y);
        ctx.globalAlpha = a; ctx.font = `900 120px ${F_ZH}`; ctx.letterSpacing = '14px'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const tw = textW('大家都在哪儿？', 120, F_ZH, 900, 14); ctx.fillStyle = silverGrad(W / 2 - tw / 2, W / 2 + tw / 2, -.2 + 1.4 * clamp(k / 1.4));
        ctx.fillText('大家都在哪儿？', W / 2 + 7, TABLE.y); ctx.restore();
        text('— ENRICO FERMI', W / 2 + tw / 2, TABLE.y + 96, { font: F_EN, size: 20, ls: 6, color: GRAY, alpha: a, align: 'right' });
      }
      return;
    }
    // ---- the galaxy fills up from one point
    const k = lt - T_GAL, ga = sstep(0, .8, k);
    starfield(lt, .5, 2);
    const cam = { yaw: .4 + k * .05, pitch: 1.05, cx: W / 2, cy: 430, F: 1500, D: 4.4 };
    const R = 2.4 * eio(clamp((k - .6) / 3.4)), front = .06;
    galaxyLight(cam, ga * (1 - .5 * sstep(.4, 1.2, k)), { dust: 3, starA: .15, stars: true });
    if (COLONY && k > .4) add(() => {
      ctx.fillStyle = ACC;
      GALAXY.forEach((p, i) => {
        const d = COLONY[i]; if (d > R) return;
        const [x, y, s] = proj(p.v, cam.yaw, cam.pitch, cam.cx, cam.cy, cam.F, cam.D);
        ctx.globalAlpha = ga * (R - d < front ? 1 : .75) * clamp(s, .3, 1.4);
        const r = (R - d < front ? 3.2 : 2) * s; ctx.fillRect(x - r / 2, y - r / 2, r, r);
      });
      if (k < 1.2) { const o = proj(GALAXY[COLONY_O].v, cam.yaw, cam.pitch, cam.cx, cam.cy, cam.F, cam.D); glowDot(o[0], o[1], 50, RGB.A, .9 * win(k, .2, 1.2, .2, .4)); }
    });
    const ya = win(k, .8, 6, .4, .5);
    text(rollNum(1000, (k - .6) / 3.4), 1620, 330, { font: F_EN, size: 72, color: WHITE, alpha: ya, align: 'right' });
    text('万年', 1630, 342, { font: F_ZH, size: 30, weight: 700, color: SILVER, alpha: ya, align: 'left' });
    text('走遍银河系 · TO SETTLE THE GALAXY', 1700, 392, { font: F_SANS, size: 16, ls: 3, color: GRAY, alpha: ya, align: 'right' });
    // the ruler: 13 billion years, with the 10-million-year notch at its left end
    const ra = sstep(3.3, 3.9, k), x0 = 330, x1 = 1590, y = 800, grow = eout(clamp((k - 3.3) / 1.2));
    if (ra > 0) {
      line(x0, y, lerp(x0, x1, grow), y, RGB.S, .8 * ra, 2);
      for (let i = 0; i <= 13; i++) { const x = lerp(x0, x1, i / 13); if (x > lerp(x0, x1, grow)) break; line(x, y - (i % 5 ? 7 : 14), x, y, RGB.S, .6 * ra, 1.5); }
      text('银河系年龄 ≈ 130 亿年', x1, y - 40, { font: F_ZH, size: 26, weight: 700, color: WHITE, alpha: ra * sstep(4.1, 4.6, k), align: 'right' });
      text('THE AGE OF THE GALAXY', x1, y - 12, { font: F_EN, size: 13, ls: 4, color: GRAY, alpha: ra * sstep(4.1, 4.6, k), align: 'right' });
      const na = sstep(4.4, 4.9, k);
      add(() => { glowDot(x0 + 1, y, 18, RGB.A, na); });
      line(x0 + 1, y - 4, x0 + 1, y - 44, RGB.A, na, 1.5);
      text('1000 万年', x0 + 10, y - 58, { font: F_ZH, size: 22, weight: 700, color: ACC, alpha: na, align: 'left' });
    }
  } });
