'use strict';
// ======================================================================== timeline
// STRETCH plays the whole film slower so long subtitles can be read; scenes keep their own (unstretched) local clock,
// and the score is written at BPM / STRETCH so every cut still lands on a beat.
const STRETCH = 1;
SC.forEach(s => { s.t0 = s.bar * BAR * STRETCH; s.d = s.bars * BAR * STRETCH; });
const TOTAL = SC[SC.length - 1].t0 + SC[SC.length - 1].d;
const SUBS = SC.flatMap(s => (s.subs || []).map(([a, b, zh, en]) => ({ a: s.t0 + a * STRETCH, b: s.t0 + b * STRETCH, zh, en }))).sort((p, q) => p.a - q.a);
// long lines stay up longer: at least 1 s + 1 s per 6.5 characters. A line that needs more time pushes the next
// line in the same scene later (never past the scene's end), so nothing is rushed.
const readTime = zh => 1 + zh.replace(/[\s，。、：；！？“”"《》·—…\-]/g, '').length / 7;
SC.forEach(sc => {
  const L = SUBS.filter(s => s.a >= sc.t0 && s.a < sc.t0 + sc.d), end = sc.t0 + sc.d - .05;
  L.forEach((s, i) => { if (i) s.a = Math.max(s.a, L[i - 1].b + .12); s.b = Math.min(end, Math.max(s.b, s.a + readTime(s.zh))); s.short = s.b - s.a < readTime(s.zh) - .05; });
});
// a hit = camera shake + white flash; scenes declare them in local seconds
const HITS = SC.flatMap(s => (s.hits || []).map(([t, k]) => [s.t0 + t * STRETCH, k]));
const sceneAt = t => { let sc = SC[0]; for (const s of SC) if (t >= s.t0) sc = s; return sc; };
const sceneByName = n => SC.find(s => s.name === n);

function drawLayer(t, jx, jy) {
  t = clamp(t, 0, TOTAL - 1e-3);
  const sc = sceneAt(t), lt = t - sc.t0;
  ctx.setTransform(PX, 0, 0, PX, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  let shake = 0;
  for (const [th, k] of HITS) if (t >= th && t < th + 1.5) shake += 12 * k * Math.exp(-(t - th) * 6);
  const cam = (sc.cam || camPush())(lt / STRETCH, sc.d / STRETCH);
  ctx.save();
  ctx.translate(W / 2 + jx + (cam.x || 0) + (shake > .3 ? Math.sin(t * 91) * shake : 0), H / 2 + jy + (cam.y || 0) + (shake > .3 ? Math.cos(t * 73) * shake : 0));
  ctx.scale(cam.z, cam.z); ctx.translate(-W / 2, -H / 2);
  sc.draw(lt / STRETCH, sc.d / STRETCH, t);
  ctx.restore();
  const fade = 1 - win(lt, 0, sc.d, sc.fi ?? .35, sc.fo ?? .35);
  if (fade > 0) { ctx.fillStyle = `rgba(0,0,0,${fade})`; ctx.fillRect(0, 0, W, H); }
}

// ======================================================================== crisp overlays (drawn after the film grade)
function chapter(sc, lt) {
  if (!sc.ch) return; const a = win(lt, .4, 5.4, .6, .8); if (a <= 0) return;
  const [n, zh, en] = sc.ch, x = 96, y = 96, slide = (1 - eout(clamp((lt - .4) / .8))) * -30;
  const nw = textW(n, 46, F_EN, 400);
  text(n, x + slide, y, { font: F_EN, size: 46, color: SILVER, alpha: a, align: 'left' });
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = ACC; ctx.fillRect(x + nw + 22 + slide, y - 25, 2, 50); ctx.restore();
  text(zh, x + nw + 44 + slide, y - 8, { font: F_ZH, size: 34, weight: 700, color: WHITE, alpha: a, align: 'left' });
  text(en, x + nw + 46 + slide, y + 28, { font: F_EN, size: 15, ls: 5, color: GRAY, alpha: a, align: 'left' });
}
function subtitles(T) {
  for (const s of SUBS) {
    if (T < s.a - .3 || T > s.b + .3) continue;
    const a = win(T, s.a, s.b, .22, .28); if (a <= 0) continue;
    ctx.save(); const g = ctx.createLinearGradient(0, 890, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${.6 * a})`); ctx.fillStyle = g; ctx.fillRect(0, 890, W, 190); ctx.restore();
    text(s.zh, W / 2, 976, { font: F_SANS, size: 40, weight: 500, color: '#f5f6f8', alpha: a, glow: 'rgba(0,0,0,.95)', blur: 10, ls: 2 });
    text(s.en, W / 2, 1028, { font: F_IT, style: 'italic', size: 27, color: '#a9b0bb', alpha: a * .92, glow: 'rgba(0,0,0,.95)', blur: 8 });
  }
}
function overlays(T) {
  // letterbox: opens after the cold open, closes at the very end
  const lb = 110 * Math.max(1 - eio(clamp((T - SC[1].t0) / .9)), eio(clamp((T - (TOTAL - 6)) / 2)));
  if (lb > .5) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, lb); ctx.fillRect(0, H - lb, W, lb); }
  const sc = sceneAt(T); chapter(sc, (T - sc.t0) / STRETCH);
  if (sc.overlay) sc.overlay((T - sc.t0) / STRETCH, sc.d / STRETCH, T);
  for (const [t, year, o] of sc.reply || []) replyStamp((T - sc.t0) / STRETCH, t, year, o);
  subtitles(T);
  let flash = 0; for (const [th, k] of HITS) if (T >= th && T < th + 1.5) flash += .75 * k * Math.exp(-(T - th) * 5.5);
  if (flash > .01) { ctx.fillStyle = `rgba(245,248,255,${Math.min(.92, flash)})`; ctx.fillRect(0, 0, W, H); }
}

// ======================================================================== one frame: K motion-blur samples → grade → overlays
const SHUTTER = .5, JIT = [[.5, .5], [.25, .75], [.75, .25], [.125, .625], [.625, .125], [.375, .375]];
function frame(T, fps = 30, samples = 1) {
  T = clamp(T, 0, TOTAL - 1e-3);
  const sc = sceneAt(T), K = samples > 1 ? Math.max(1, sc.mb ?? 2) : 1;
  for (let k = 0; k < K; k++) {
    let tk = K > 1 ? Math.max(0, T + ((k + .5) / K - .5) * SHUTTER / fps) : T;
    if (sceneAt(tk) !== sc || (sc.shot && sc.shot((tk - sc.t0) / STRETCH) !== sc.shot((T - sc.t0) / STRETCH))) tk = T;     // never blur across a cut
    drawLayer(tk, K > 1 ? (JIT[k][0] - .5) / PX : 0, K > 1 ? (JIT[k][1] - .5) / PX : 0);
    accumulate(k, K);
  }
  post(T, { ...GRADE, ...(sc.grade || {}) });
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'copy'; ctx.drawImage(glc, 0, 0); ctx.globalCompositeOperation = 'source-over';
  ctx.setTransform(PX, 0, 0, PX, 0, 0);
  overlays(T);
}

// ======================================================================== loading, export hooks, playback
let fontsReady = false;
const FONT_LOADS = ['900 40px "Noto Serif SC"', '700 40px "Noto Serif SC"', '400 40px "Noto Serif SC"', '500 40px "Microsoft YaHei"', '400 40px "Bodoni MT"',
  'italic 400 40px "Palatino Linotype"', '400 40px "Cambria Math"', '400 40px "Consolas"'];
Promise.all([texReady, photoReady, nebulaReady, ...FONT_LOADS.map(f => document.fonts.load(f, '我们从未相遇ABCxyz01'))]).catch(() => {}).then(() => document.fonts.ready)
  .then(() => {
    SC.forEach(s => s.init && s.init());
    fontsReady = true;
    const l = document.getElementById('load'); if (l) l.textContent = '就绪 · 建议全屏观看（F）';
    const missing = Object.keys(PHOTOS).filter(a => !PH_REAL[a]); if (missing.length) console.log('photos still missing:', missing.join(', '));
    const short = SUBS.filter(s => s.short); if (short.length) console.log('subtitles shorter than reading time:', short.map(s => `${s.a.toFixed(1)}s ${s.zh}`).join(' | '));
    frame(0);
  });

const srtTime = t => { const ms = Math.round(t * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`; };
window.__ready = () => fontsReady;
window.__frame = (t, fps = 30) => { frame(t, fps, 3); return cv.toDataURL('image/jpeg', .94); };
window.__duration = TOTAL;
// every sound the picture asks for, with absolute times; music.py places them on the score
window.__cues = () => ({
  duration: TOTAL, bpm: BPM / STRETCH,
  scenes: SC.map(s => ({ name: s.name, bar: s.bar, bars: s.bars })),
  hits: HITS.map(([t, k]) => ({ t: +t.toFixed(4), k })),
  sfx: SC.flatMap(s => (s.sfx || []).map(([t, name, o]) => ({ t: +(s.t0 + t * STRETCH).toFixed(4), name, ...(o || {}), ...(o && o.dur ? { dur: o.dur * STRETCH } : {}) }))).sort((a, b) => a.t - b.t),
});
window.__srt = () => SUBS.map((s, i) => `${i + 1}\n${srtTime(s.a)} --> ${srtTime(s.b)}\n${s.zh}\n${s.en}\n`).join('\n');

const au = document.getElementById('au');
if (EXPORT) { document.getElementById('start').remove(); document.getElementById('ui').remove(); }
else {
  au.src = 'music.mp3';
  let playing = false, clock0 = 0, useAudio = true, hideT = 0, pos = +(Q.get('t') || 0);
  au.onerror = () => { useAudio = false; };
  const ui = document.getElementById('ui'), pp = document.getElementById('pp'), fill = document.getElementById('fill'), tm = document.getElementById('tm');
  document.getElementById('dur').textContent = `${Math.floor(TOTAL / 60)}:${String(Math.round(TOTAL % 60)).padStart(2, '0')}`;
  const now = () => useAudio ? au.currentTime : (playing ? (performance.now() - clock0) / 1000 : pos);
  const seek = t => { pos = clamp(t, 0, TOTAL); if (useAudio) au.currentTime = pos; clock0 = performance.now() - pos * 1000; if (!playing) frame(pos); };
  function loop() {
    const T = now(); frame(T);
    fill.style.width = (T / TOTAL * 100) + '%'; tm.textContent = `${Math.floor(T / 60)}:${String(Math.floor(T % 60)).padStart(2, '0')}`;
    if (T >= TOTAL - .05) { playing = false; pp.textContent = '▶'; }
    if (playing) requestAnimationFrame(loop);
  }
  function play() {
    if (now() >= TOTAL - .1) seek(0);
    if (useAudio && pos) au.currentTime = pos;
    playing = true; pp.textContent = '❚❚'; clock0 = performance.now() - now() * 1000;
    if (useAudio) au.play().catch(() => { useAudio = false; clock0 = performance.now() - pos * 1000; });
    requestAnimationFrame(loop);
  }
  function pause() { pos = now(); playing = false; pp.textContent = '▶'; au.pause(); }
  document.getElementById('go').onclick = () => { document.getElementById('start').remove(); play(); poke(); };
  pp.onclick = () => playing ? pause() : play();
  document.getElementById('bar').onclick = e => { const r = e.currentTarget.getBoundingClientRect(); seek(clamp((e.clientX - r.left) / r.width) * TOTAL); };
  document.getElementById('fs').onclick = () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
  function poke() { ui.classList.remove('hide'); clearTimeout(hideT); hideT = setTimeout(() => ui.classList.add('hide'), 2200); }
  addEventListener('mousemove', poke);
  addEventListener('keydown', e => {
    if (document.getElementById('start')) return;
    if (e.code === 'Space') { e.preventDefault(); playing ? pause() : play(); }
    if (e.code === 'KeyF') document.getElementById('fs').click();
    if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') seek(now() + (e.code === 'ArrowRight' ? 5 : -5));
    poke();
  });
}
