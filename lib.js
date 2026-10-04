'use strict';
// ======================================================================== core: 1920×1080 logical canvas
// ?export=1 renders at 4K (PX = 2); the live preview runs at 1080p unless ?px=2.
const Q = new URLSearchParams(location.search);
const EXPORT = Q.has('export');
const W = 1920, H = 1080, PX = +(Q.get('px') || (EXPORT ? 2 : 1));
const BPM = 80, BEAT = 60 / BPM, BAR = BEAT * 4, EIGHTH = BEAT / 2;      // 1 bar = 3 s
const cv = document.getElementById('c'); cv.width = W * PX; cv.height = H * PX;
const ctx = cv.getContext('2d', { willReadFrequently: false });
const PI = Math.PI, TAU = PI * 2;
const clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const eio = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const eout = t => 1 - Math.pow(1 - t, 3);
const ein = t => t * t * t;
const eexpo = t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
const eback = t => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const win = (t, a, b, fi = .5, fo = .5) => sstep(a, a + fi, t) * (1 - sstep(b - fo, b, t));   // fade in at a, out at b
function rng(seed) { let a = seed | 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
function gauss(r) { let u = 0; while (u === 0) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * r()); }

// ---- palette: black, white, silver, gray + one cool accent; gold only for what humanity sent
const WHITE = '#f3f5f8', SILVER = '#b3bac6', GRAY = '#6b7280', DIM = '#2e333b', ACC = '#7fb4ff', GOLD = '#e8c27a', RED = '#e0574f';
const RGB = { W: [243, 245, 248], S: [179, 186, 198], G: [107, 114, 128], A: [127, 180, 255], GOLD: [232, 194, 122], R: [224, 87, 79] };
const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

const F_ZH = '"Noto Serif SC", "Songti SC", "STSong", serif';
const F_SANS = '"Microsoft YaHei", "PingFang SC", sans-serif';
const F_EN = '"Bodoni MT", "Didot", "Times New Roman", serif';
const F_IT = '"Palatino Linotype", "Baskerville", "Times New Roman", serif';
const F_MATH = '"Cambria Math", "Cambria", "Times New Roman", serif';
const F_MONO = '"Consolas", "Menlo", monospace';

// ======================================================================== 2D drawing helpers
function text(s, x, y, o = {}) {
  const a = o.alpha ?? 1; if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.font = `${o.style || ''} ${o.weight || 400} ${o.size || 40}px ${o.font || F_ZH}`;
  ctx.letterSpacing = (o.ls || 0) + 'px';
  ctx.textAlign = o.align || 'center'; ctx.textBaseline = o.base || 'middle';
  ctx.fillStyle = o.color || WHITE;
  if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = o.blur ?? 16; }
  ctx.fillText(s, x, y);
  ctx.restore();
}
function textW(s, size, font = F_ZH, weight = 400, ls = 0) {
  ctx.save(); ctx.font = `${weight} ${size}px ${font}`; ctx.letterSpacing = ls + 'px'; const w = ctx.measureText(s).width; ctx.restore(); return w;
}
function silverGrad(x0, x1, shine = .5) {
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, '#5d636c'); g.addColorStop(clamp(shine - .12), '#cfd5de'); g.addColorStop(clamp(shine), '#ffffff');
  g.addColorStop(clamp(shine + .12), '#aab2be'); g.addColorStop(1, '#5d636c'); return g;
}
function add(fn) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; fn(); ctx.restore(); }
function glowDot(x, y, r, c = RGB.W, a = 1) {
  if (a <= 0 || r <= 0) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(c, a)); g.addColorStop(.25, rgba(c, a * .35)); g.addColorStop(1, rgba(c, 0));
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
}
function line(x0, y0, x1, y1, c, a, w = 2) { if (a <= 0) return; ctx.strokeStyle = rgba(c, a); ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
function ring(x, y, r, c, a, w = 2) { if (a <= 0 || r <= 0) return; ctx.strokeStyle = rgba(c, a); ctx.lineWidth = w; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); }
function poly(pts, c, a, w = 2, close = false) {
  if (a <= 0 || pts.length < 2) return;
  ctx.strokeStyle = rgba(c, a); ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  if (close) ctx.closePath(); ctx.stroke();
}
function glowPoly(pts, c, a, w = 3) { ctx.save(); ctx.lineCap = ctx.lineJoin = 'round'; poly(pts, c, a * .08, w * 6); poly(pts, c, a * .22, w * 2.5); poly(pts, c, a, w); ctx.restore(); }
function rrect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
// a short label with a thin leader line, used to annotate pictures
function label(x, y, zh, en, a, o = {}) {
  if (a <= 0) return;
  const al = o.align || 'left', dx = al === 'left' ? 1 : -1, L = o.len ?? 60;
  line(x, y, x + dx * L * eout(clamp(a * 1.4)), y, o.rgb || RGB.S, a * .7, 1.5);
  text(zh, x + dx * (L + 14), y - 11, { font: F_ZH, size: o.size || 26, weight: 600, color: o.color || WHITE, alpha: a, align: al });
  if (en) text(en, x + dx * (L + 15), y + 17, { font: F_EN, size: 14, ls: 4, color: GRAY, alpha: a, align: al });
}
// a number that counts up to v as k goes 0 → 1
const rollNum = (v, k, dec = 0) => (v * eout(clamp(k))).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });

// ---- glitch / typewriter text
function glitchText(s, x, y, size, a, font = F_EN, seed = 0) {
  if (a <= 0) return;
  const r = rng(seed * 977 + 13);
  for (const [dx, c] of [[-4, 'rgba(127,180,255,.55)'], [4, 'rgba(255,255,255,.35)']]) text(s, x + dx * (r() + .3), y, { font, size, color: c, alpha: a * .8 });
  ctx.save(); ctx.beginPath();
  for (let i = 0; i < 6; i++) { const yy = y - size * .6 + r() * size * 1.2; ctx.rect(0, yy, W, 3 + r() * size * .2); }
  ctx.clip(); text(s, x + (r() - .5) * 40, y, { font, size, color: WHITE, alpha: a }); ctx.restore();
  text(s, x, y, { font, size, color: WHITE, alpha: a * .92 });
}
function typeText(s, k, x, y, o = {}) {                         // k: 0 → 1 reveals the characters; a block cursor rides the end
  const n = Math.floor(s.length * clamp(k)), shown = s.slice(0, n);
  text(shown, x, y, { ...o, align: 'left' });
  if (k > 0 && k < 1.15 && Math.floor(k * 30) % 2 === 0) {
    const w = textW(shown, o.size || 40, o.font || F_ZH, o.weight || 400, o.ls || 0);
    ctx.save(); ctx.globalAlpha = o.alpha ?? 1; ctx.fillStyle = o.color || WHITE; ctx.fillRect(x + w + 4, y - (o.size || 40) * .45, (o.size || 40) * .45, (o.size || 40) * .9); ctx.restore();
  }
}

// ---- points sampled from text / drawings (for particles that write words)
const _ptsCache = {};
function textPts(key, draw, step = 3, n = 2000, seed = 5) {
  if (_ptsCache[key]) return _ptsCache[key];
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  x.fillStyle = '#fff'; x.strokeStyle = '#fff'; draw(x);
  const d = x.getImageData(0, 0, W, H).data, pts = [];
  for (let yy = 0; yy < H; yy += step) for (let xx = 0; xx < W; xx += step) if (d[(yy * W + xx) * 4 + 3] > 128) pts.push([xx, yy]);
  const r = rng(seed);
  for (let i = pts.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pts[i], pts[j]] = [pts[j], pts[i]]; }
  return (_ptsCache[key] = pts.slice(0, n));
}

// ======================================================================== formulas (tex.js): size = px per em
const TEXIMG = {};
const texReady = Promise.all(Object.entries(window.TEX || {}).map(([k, v]) => new Promise(res => { const im = new Image(); im.onload = res; im.onerror = res; im.src = v.src; TEXIMG[k] = im; })));
function tex(name, x, y, size = 48, a = 1, align = 'center', glow = 0) {
  if (a <= 0) return;
  const T = window.TEX[name], w = T.w * size, h = T.h * size, x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  ctx.save(); ctx.globalAlpha = a;
  if (glow) { ctx.shadowColor = `rgba(200,220,255,${glow})`; ctx.shadowBlur = 18; }
  ctx.drawImage(TEXIMG[name], x0, y - h / 2, w, h); ctx.restore();
}
const texW = (name, size) => window.TEX[name].w * size;

// ======================================================================== WebGL: film post-processing
// motion-blur accumulation → bloom (threshold + mip chain) → chromatic aberration, vignette, grain
const GW = W * PX, GH = H * PX;
const glc = document.createElement('canvas'); glc.width = GW; glc.height = GH;
const gl = glc.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false, alpha: false, premultipliedAlpha: false });
const FLOAT = !!gl.getExtension('EXT_color_buffer_float');
const VS = `#version 300 es
out vec2 vUv; void main(){ vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2); vUv = p; gl_Position = vec4(p * 2. - 1., 0., 1.); }`;
const HEAD = `#version 300 es
precision highp float; in vec2 vUv; out vec4 o;`;
const FS_ACC = HEAD + `uniform sampler2D uT; uniform float uW; void main(){ o = vec4(texture(uT, vUv).rgb * uW, 1.); }`;
const FS_DOWN = HEAD + `uniform sampler2D uT; uniform vec2 uTexel; uniform float uThresh;
void main(){
  vec3 s = texture(uT, vUv + uTexel * vec2(-1., -1.)).rgb + texture(uT, vUv + uTexel * vec2(1., -1.)).rgb
         + texture(uT, vUv + uTexel * vec2(-1., 1.)).rgb + texture(uT, vUv + uTexel * vec2(1., 1.)).rgb;
  s *= .25;
  if (uThresh > 0.) { float l = max(s.r, max(s.g, s.b)); s *= smoothstep(uThresh, uThresh + .3, l); }
  o = vec4(s, 1.);
}`;
const FS_UP = HEAD + `uniform sampler2D uT; uniform vec2 uTexel;
void main(){
  vec3 s = texture(uT, vUv).rgb * 4.;
  s += (texture(uT, vUv + uTexel * vec2(1., 0.)).rgb + texture(uT, vUv - uTexel * vec2(1., 0.)).rgb + texture(uT, vUv + uTexel * vec2(0., 1.)).rgb + texture(uT, vUv - uTexel * vec2(0., 1.)).rgb) * 2.;
  s += texture(uT, vUv + uTexel).rgb + texture(uT, vUv - uTexel).rgb + texture(uT, vUv + uTexel * vec2(1., -1.)).rgb + texture(uT, vUv + uTexel * vec2(-1., 1.)).rgb;
  o = vec4(s / 16., 1.);
}`;
const FS_FINAL = HEAD + `uniform sampler2D uScene; uniform sampler2D uBloom; uniform float uBloomAmt, uCA, uVig, uGrain, uSeed; uniform vec2 uAspect;
float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + uSeed) * 43758.5453); }
void main(){
  vec2 d = vUv - .5;
  vec3 c = vec3(texture(uScene, vUv - d * uCA).r, texture(uScene, vUv).g, texture(uScene, vUv + d * uCA).b);
  c += texture(uBloom, vUv).rgb * uBloomAmt;
  c = 1. - exp(-c * 1.08);                                                   // soft shoulder
  c /= (1. - exp(-1.08));
  float v = 1. - uVig * smoothstep(.35, 1.05, length(d * uAspect));
  c *= v;
  c += (h(vUv * 1000.) - .5) * uGrain;
  o = vec4(clamp(c, 0., 1.), 1.);
}`;
function compile(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
function program(fs, names) {
  const p = gl.createProgram(); gl.attachShader(p, compile(gl.VERTEX_SHADER, VS)); gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  const u = {}; for (const n of names) u[n] = gl.getUniformLocation(p, n); return { p, u };
}
const P_ACC = program(FS_ACC, ['uT', 'uW']);
const P_DOWN = program(FS_DOWN, ['uT', 'uTexel', 'uThresh']);
const P_UP = program(FS_UP, ['uT', 'uTexel']);
const P_FIN = program(FS_FINAL, ['uScene', 'uBloom', 'uBloomAmt', 'uCA', 'uVig', 'uGrain', 'uSeed', 'uAspect']);
gl.bindVertexArray(gl.createVertexArray());
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
function makeTex(w, h, float) {
  const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
  if (float && FLOAT) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
  else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
  return t;
}
function makeFbo(w, h) { const t = makeTex(w, h, true), f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); return { t, f, w, h }; }
const SCENE_TEX = makeTex(GW, GH, false);
const ACC_FB = makeFbo(GW, GH), MIPS = [1, 2, 3, 4, 5, 6].map(k => makeFbo(Math.ceil(GW / 2 ** k), Math.ceil(GH / 2 ** k)));
function tri(fb, w, h) { gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.viewport(0, 0, w, h); gl.drawArrays(gl.TRIANGLES, 0, 3); }
function bindTex(unit, t) { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); }
function accumulate(k, K) {                                    // add the 2D canvas into the accumulation buffer with weight 1/K
  bindTex(0, SCENE_TEX); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, cv);
  gl.useProgram(P_ACC.p); gl.uniform1i(P_ACC.u.uT, 0); gl.uniform1f(P_ACC.u.uW, 1 / K);
  gl.bindFramebuffer(gl.FRAMEBUFFER, ACC_FB.f);
  if (k === 0) { gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT); }
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); tri(ACC_FB.f, GW, GH); gl.disable(gl.BLEND);
}
const GRADE = { bloom: .6, ca: .0012, vig: .55, grain: .04, thresh: .62 };
function post(T, g) {
  gl.useProgram(P_DOWN.p); gl.uniform1i(P_DOWN.u.uT, 0);
  let src = ACC_FB;
  MIPS.forEach((m, i) => { bindTex(0, src.t); gl.uniform2f(P_DOWN.u.uTexel, .5 / src.w, .5 / src.h); gl.uniform1f(P_DOWN.u.uThresh, i === 0 ? g.thresh : 0); tri(m.f, m.w, m.h); src = m; });
  gl.useProgram(P_UP.p); gl.uniform1i(P_UP.u.uT, 0); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
  for (let i = MIPS.length - 1; i > 0; i--) { bindTex(0, MIPS[i].t); gl.uniform2f(P_UP.u.uTexel, 1 / MIPS[i].w, 1 / MIPS[i].h); tri(MIPS[i - 1].f, MIPS[i - 1].w, MIPS[i - 1].h); }
  gl.disable(gl.BLEND);
  gl.useProgram(P_FIN.p); bindTex(0, ACC_FB.t); bindTex(1, MIPS[0].t);
  gl.uniform1i(P_FIN.u.uScene, 0); gl.uniform1i(P_FIN.u.uBloom, 1);
  gl.uniform1f(P_FIN.u.uBloomAmt, g.bloom); gl.uniform1f(P_FIN.u.uCA, g.ca); gl.uniform1f(P_FIN.u.uVig, g.vig); gl.uniform1f(P_FIN.u.uGrain, g.grain);
  gl.uniform1f(P_FIN.u.uSeed, (T * 37.13) % 100); gl.uniform2f(P_FIN.u.uAspect, W / H, 1);
  tri(null, GW, GH);
}

// ======================================================================== shared visuals: stars, 3D projection, galaxy
const _r = rng(20261003);
const STARS = Array.from({ length: 900 }, () => ({ x: _r() * W * 1.3 - W * .15, y: _r() * H * 1.3 - H * .15, z: .15 + _r() ** 2 * .85, p: _r() * TAU, w: _r() < .06 }));
// drifting, twinkling starfield; z gives parallax and brightness. `zoom` > 1 pulls stars outward (camera flying forward)
function starfield(t, a = 1, vx = 4, vy = 0, zoom = 1) {
  if (a <= 0) return;
  ctx.save(); ctx.fillStyle = '#fff';
  for (const s of STARS) {
    let x = s.x + vx * t * s.z, y = s.y + vy * t * s.z;
    x = ((x + W * .15) % (W * 1.3) + W * 1.3) % (W * 1.3) - W * .15; y = ((y + H * .15) % (H * 1.3) + H * 1.3) % (H * 1.3) - H * .15;
    if (zoom !== 1) { const k = Math.pow(zoom, s.z); x = W / 2 + (x - W / 2) * k; y = H / 2 + (y - H / 2) * k; }
    const tw = .65 + .35 * Math.sin(t * (1 + s.z * 2) + s.p);
    ctx.globalAlpha = a * s.z * tw * (s.w ? 1 : .8);
    const r = s.w ? 2.4 : .9 + s.z * 1.3;
    ctx.fillRect(x - r / 2, y - r / 2, r, r);
  }
  ctx.restore();
}
// rotate (yaw about y, pitch about x) and perspective-project; returns [sx, sy, depth scale]
function proj(v, yaw, pitch, cx, cy, F, D) {
  const [x, y, z] = v, cy_ = Math.cos(yaw), sy_ = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const x1 = x * cy_ + z * sy_, z1 = -x * sy_ + z * cy_, y1 = y * cp - z1 * sp, z2 = y * sp + z1 * cp, k = F / (D + z2);
  return [cx + x1 * k, cy + y1 * k, k / F * D];
}
// a barred spiral galaxy as particles, in units of ~1 = 50,000 ly radius
const GALAXY = (() => {
  const r = rng(77), P = [];
  for (let i = 0; i < 7000; i++) {
    const arm = i % 4, d = Math.pow(r(), .7), ang = arm * PI / 2 + d * 4.6 + gauss(r) * .28 * (1.1 - d);
    const sc = .06 + .12 * (1 - d);
    P.push({ v: [Math.cos(ang) * d + gauss(r) * sc, gauss(r) * .025 * (1.4 - d), Math.sin(ang) * d + gauss(r) * sc], b: .3 + r() * .7, warm: r() < .15 * (1 - d) });
  }
  for (let i = 0; i < 1800; i++) { const d = Math.abs(gauss(r)) * .16; const a = r() * TAU; P.push({ v: [Math.cos(a) * d * 1.6, gauss(r) * .05, Math.sin(a) * d], b: .5 + r() * .5, warm: true }); }
  return P;
})();
function drawGalaxy(cam, a = 1, o = {}) {
  if (a <= 0) return;
  add(() => {
    glowDot(cam.cx, cam.cy, cam.F / cam.D * .45, [200, 190, 175], .22 * a * (o.core ?? 1));
    for (const p of GALAXY) {
      const [x, y, k] = proj(p.v, cam.yaw, cam.pitch, cam.cx, cam.cy, cam.F, cam.D);
      ctx.globalAlpha = a * p.b * .55 * clamp(k, .3, 1.5);
      ctx.fillStyle = p.warm ? '#efe3cf' : '#c9d6ec';
      const s = (o.size || 1.6) * k; ctx.fillRect(x - s / 2, y - s / 2, s, s);
    }
  });
}
// ---- camera presets (local time, scene duration) → { z, x, y }
const camPush = (amt = .045) => (lt, d) => ({ z: 1 + amt * lt / d, x: 7 * Math.sin(lt * .21), y: 4 * Math.sin(lt * .17 + 1) });
const camStill = () => () => ({ z: 1, x: 0, y: 0 });

// ======================================================================== scene registry
// scene({ bar, bars, ch: [num, zh, en], subs: [[t0, t1, zh, en]], sfx: [[t, name, opts]], hits: [[t, k]], cam, draw(lt, d, T), init })
// all times inside a scene are seconds from the scene's start; bar/bars place it on the 80 BPM grid
const SC = [];
function scene(o) { SC.push(o); return o; }
const bt = n => n * BEAT;                                       // beats → seconds

// ---- a stand-in for chapters that are not built yet: starfield, chapter card, subtitles and the storyboard note
function draft(o) {
  return scene({ ...o, draw(lt, d) {
    starfield(lt, .8, 5);
    text('DRAFT · 草稿', W / 2, H / 2 - 40, { font: F_EN, size: 22, ls: 10, color: GRAY, alpha: .8 });
    text(o.note || '', W / 2, H / 2 + 10, { font: F_SANS, size: 26, color: SILVER, alpha: .7 });
  } });
}

// ---- the running tally that closes each chapter: "1960 · 收到回复 0". The digit spins, then settles on 0.
// scenes list them as reply: [[t, year, { q: true }]]; q adds a question mark that blinks and goes out
function replyStamp(lt, t0, year, o = {}) {
  const k = lt - t0, a = win(lt, t0, t0 + (o.dur || 3.8), .2, .7); if (a <= 0) return;
  const x = W - 96, y = 112, slide = (1 - eout(clamp(k / .6))) * 26;
  text('收到回复  ·  REPLIES RECEIVED', x + slide, y - 46, { font: F_SANS, size: 15, ls: 4, color: GRAY, alpha: a, align: 'right' });
  const dg = k < .55 ? String(Math.floor(hash(Math.floor(k * 28) + year) * 10)) : '0';
  const q = o.q && k > .9 && k < 2.6 && Math.floor(k * 5) % 2 === 0;
  const dw = textW('0', 76, F_EN, 400);
  text(dg, x + slide, y + 8, { font: F_EN, size: 76, color: WHITE, alpha: a, align: 'right', glow: k < .9 ? 'rgba(200,220,255,.5)' : null, blur: 20 });
  if (q) text('?', x + slide + 30, y + 8, { font: F_EN, size: 56, color: ACC, alpha: a, align: 'right' });
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = ACC; ctx.fillRect(x - dw - 24 + slide, y - 22, 2, 52); ctx.restore();
  text(String(year), x - dw - 44 + slide, y + 8, { font: F_EN, size: 40, color: SILVER, alpha: a, align: 'right' });
}
