'use strict';
// ======================================================================== real photographs (photos/, supplied by hand)
// Each photo is graded once on load to match the film (desaturated, darker, cool shadows, edges feathered into black)
// and cached as a canvas. Portrait sketches become light ink on transparent. A missing file shows a labelled frame.
const PHOTOS = {                                                 // all supplied as PNG with transparent backgrounds
  voyager: { ext: 'png', sat: .7, gain: 1, feather: 0 }, golden_record: { ext: 'png', sat: .9, gain: 1, feather: 0 },
  portrait_fermi: { ext: 'png', sat: .55, gain: .95, feather: 0 }, portrait_teller: { ext: 'png', sat: .55, gain: .95, feather: 0 },
  portrait_york: { ext: 'png', sat: .55, gain: .95, feather: 0 }, portrait_konopinski: { ext: 'png', sat: .55, gain: .95, feather: 0 },
};
const PH = {}, PH_REAL = {};
const photoReady = Promise.all(Object.entries(PHOTOS).map(([name, o]) => new Promise(res => {
  const im = new Image();
  im.onload = () => { if (o.detect) o.dot = detectDot(im) || o.dot; PH[name] = gradePhoto(im, o); PH_REAL[name] = true; res(); };
  im.onerror = () => { PH[name] = photoPlaceholder(name, o); res(); };
  im.src = `photos/${name}.${o.ext}`;
})));
function detectDot(im) {                                         // the pale blue dot: the pixel whose blue most exceeds its red and green, among bright ones
  const s = 1400 / im.width, w = Math.round(im.width * s), h = Math.round(im.height * s);
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0, w, h);
  const p = x.getImageData(0, 0, w, h).data; let best = 0, bi = -1;
  for (let i = 0; i < p.length; i += 4) { const sc = p[i + 2] - (p[i] + p[i + 1]) / 2; if (p[i + 2] > 100 && sc > best) { best = sc; bi = i / 4; } }
  return bi < 0 ? null : [(bi % w) / w, Math.floor(bi / w) / h];
}
function gradePhoto(im, o) {
  const s = Math.min(1, 2400 / im.width), w = Math.round(im.width * s), h = Math.round(im.height * s);
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(im, 0, 0, w, h);
  const d = x.getImageData(0, 0, w, h), p = d.data, f = o.feather;
  for (let i = 0; i < p.length; i += 4) {
    const u = (i / 4) % w / w, v = Math.floor(i / 4 / w) / h;
    const l = .2126 * p[i] + .7152 * p[i + 1] + .0722 * p[i + 2], sh = 1 - l / 255;
    const m = f ? o.gain * sstep(0, f, u) * sstep(0, f, 1 - u) * sstep(0, f * 1.6, v) * sstep(0, f * 1.6, 1 - v) : o.gain;
    p[i] = clamp((l + (p[i] - l) * o.sat - 6 * sh) * m, 0, 255);
    p[i + 1] = clamp((l + (p[i + 1] - l) * o.sat) * m, 0, 255);
    p[i + 2] = clamp((l + (p[i + 2] - l) * o.sat + 8 * sh) * m, 0, 255);
  }
  x.putImageData(d, 0, 0); return c;
}
function inkPortrait(im) {
  const s = Math.min(1, 900 / Math.max(im.width, im.height)), w = Math.round(im.width * s), h = Math.round(im.height * s);
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(im, 0, 0, w, h);
  const d = x.getImageData(0, 0, w, h), p = d.data;
  for (let i = 0; i < p.length; i += 4) {
    const l = (p[i] + p[i + 1] + p[i + 2]) / 3, ink = clamp((235 - l) / 180) * (p[i + 3] / 255);
    p[i] = 236; p[i + 1] = 239; p[i + 2] = 244; p[i + 3] = 255 * ink;
  }
  x.putImageData(d, 0, 0); return c;
}
function photoPlaceholder(name, o) {
  const c = document.createElement('canvas'); c.width = o.portrait ? 600 : 1600; c.height = o.portrait ? 600 : 900; const x = c.getContext('2d');
  if (!o.portrait) { x.fillStyle = '#15171b'; x.fillRect(0, 0, c.width, c.height); }
  x.strokeStyle = 'rgba(179,186,198,.45)'; x.lineWidth = 3; x.setLineDash([14, 10]); x.strokeRect(10, 10, c.width - 20, c.height - 20); x.setLineDash([]);
  if (o.portrait) { x.strokeStyle = 'rgba(220,226,235,.6)'; x.lineWidth = 4; x.beginPath(); x.arc(300, 230, 100, 0, TAU); x.stroke(); x.beginPath(); x.ellipse(300, 540, 200, 170, 0, PI, TAU); x.stroke(); }
  x.font = `400 ${o.portrait ? 30 : 40}px Consolas, monospace`; x.fillStyle = 'rgba(200,206,215,.8)'; x.textAlign = 'center';
  x.fillText(`photos/${name}.${o.ext}`, c.width / 2, o.portrait ? 585 : c.height / 2 + 30);
  if (!o.portrait) { x.font = '400 34px "Microsoft YaHei"'; x.fillText('等待真实照片', c.width / 2, c.height / 2 - 40); }
  return c;
}
// the earlier galaxy-band picture, kept for the opening and the ending
const NEBULA = new Image(); const nebulaReady = new Promise(r => { NEBULA.onload = NEBULA.onerror = r; }); NEBULA.src = 'assets/nebula.png';
function nebula(cx, cy, w, a = 1, rot = 0) {
  if (a <= 0 || !NEBULA.width) return;
  ctx.save(); ctx.globalAlpha = a; ctx.globalCompositeOperation = 'screen'; ctx.translate(cx, cy); ctx.rotate(rot);
  ctx.drawImage(NEBULA, -w / 2, -w * NEBULA.height / NEBULA.width / 2, w, w * NEBULA.height / NEBULA.width); ctx.restore();
}
// draw a photo centred at (cx, cy), `w` px wide. o.crop = [u0, v0, u1, v1] (fractions), o.rot, o.mode
let NO_PHOTO = false;                                            // set while the cold open flashes back to later scenes: photos appear only once
function photo(name, cx, cy, w, a = 1, o = {}) {
  const im = PH[name]; if (!im || a <= 0 || NO_PHOTO) return;
  const [u0, v0, u1, v1] = o.crop || [0, 0, 1, 1], sw = im.width * (u1 - u0), sh = im.height * (v1 - v0), h = w * sh / sw;
  ctx.save(); ctx.globalAlpha = a; ctx.globalCompositeOperation = o.mode || 'source-over';
  if (o.rot) { ctx.translate(cx, cy); ctx.rotate(o.rot); ctx.translate(-cx, -cy); }
  ctx.drawImage(im, im.width * u0, im.height * v0, sw, sh, cx - w / 2, cy - h / 2, w, h); ctx.restore();
}

// ======================================================================== shader layer: realistic renders
// A second WebGL2 canvas renders full-screen fragment shaders at half the output resolution; the result is
// composited into the 2D frame like an image (additively by default: these are things that emit light).
const SHW = Math.round(W * PX / 2), SHH = Math.round(H * PX / 2);
const shc = document.createElement('canvas'); shc.width = SHW; shc.height = SHH;
const sgl = shc.getContext('webgl2', { preserveDrawingBuffer: true, premultipliedAlpha: false, alpha: true });
const SH_HEAD = `#version 300 es
precision highp float; in vec2 vUv; out vec4 o;
uniform vec2 uRes; uniform float uT; uniform vec4 uA, uB, uC, uD; uniform sampler2D uMap;
float hash(vec3 p){ p = fract(p * .3183099 + .1); p *= 17.; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z); }
float fbm(vec3 p){ float s = 0., a = .5; for (int i = 0; i < 5; i++) { s += a * noise(p); p = p * 2.03 + 17.1; a *= .5; } return s; }
// logical pixel (1920×1080, y down) → camera ray in the same frame lib.js proj() uses (camera at z = -D, un-rotated by pitch, then yaw)
vec3 unrot(vec3 d, float yaw, float pitch){
  float cp = cos(pitch), sp = sin(pitch); d = vec3(d.x, d.y * cp + d.z * sp, -d.y * sp + d.z * cp);
  float cy = cos(yaw), sy = sin(yaw); return vec3(d.x * cy - d.z * sy, d.y, d.x * sy + d.z * cy);
}
vec2 logical(){ return vec2(vUv.x, 1. - vUv.y) * vec2(${W}., ${H}.); }
`;
const SH_VS = `#version 300 es
out vec2 vUv; void main(){ vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2); vUv = p; gl_Position = vec4(p * 2. - 1., 0., 1.); }`;
const SHADERS = {};
function shaderProgram(name, body) {
  const mk = (t, src) => { const s = sgl.createShader(t); sgl.shaderSource(s, src); sgl.compileShader(s); if (!sgl.getShaderParameter(s, sgl.COMPILE_STATUS)) throw new Error(name + ': ' + sgl.getShaderInfoLog(s)); return s; };
  const p = sgl.createProgram(); sgl.attachShader(p, mk(sgl.VERTEX_SHADER, SH_VS)); sgl.attachShader(p, mk(sgl.FRAGMENT_SHADER, SH_HEAD + body)); sgl.linkProgram(p);
  if (!sgl.getProgramParameter(p, sgl.LINK_STATUS)) throw new Error(name + ': ' + sgl.getProgramInfoLog(p));
  SHADERS[name] = { p, u: Object.fromEntries(['uRes', 'uT', 'uA', 'uB', 'uC', 'uD', 'uMap'].map(k => [k, sgl.getUniformLocation(p, k)])) };
}
sgl.bindVertexArray(sgl.createVertexArray());
function runShader(name, t, A, B, C, D, w, h) {
  const S = SHADERS[name]; sgl.useProgram(S.p); sgl.viewport(0, 0, w, h);
  sgl.uniform2f(S.u.uRes, w, h); sgl.uniform1f(S.u.uT, t);
  sgl.uniform4fv(S.u.uA, A || [0, 0, 0, 0]); sgl.uniform4fv(S.u.uB, B || [0, 0, 0, 0]); sgl.uniform4fv(S.u.uC, C || [0, 0, 0, 0]); sgl.uniform4fv(S.u.uD, D || [0, 0, 0, 0]);
  sgl.uniform1i(S.u.uMap, 0);
  sgl.drawArrays(sgl.TRIANGLES, 0, 3);
}
// render shader `name` (four vec4 parameters) and composite it onto the frame
function shade(name, t, A, B, C, D, a = 1, mode = 'lighter') {
  if (a <= 0) return;
  sgl.bindFramebuffer(sgl.FRAMEBUFFER, null); sgl.clearColor(0, 0, 0, 0); sgl.clear(sgl.COLOR_BUFFER_BIT);
  runShader(name, t, A, B, C, D, SHW, SHH);
  ctx.save(); ctx.globalAlpha = a; ctx.globalCompositeOperation = mode; ctx.drawImage(shc, 0, 0, W, H); ctx.restore();
}

// ---- the galaxy: a face-on map (emission rgb, dust a) baked once, then ray-marched through a thin disk.
// Same geometry as lib.js GALAXY (four arms at angle = k·π/2 + 4.6·r, r ≤ ~1), so particles and shader line up.
shaderProgram('galaxyMap', `
void main(){
  vec2 q = (vUv * 2. - 1.) * 1.3; float r = length(q), th = atan(q.y, q.x);
  float warp = (fbm(vec3(q * 2.2, 1.7)) - .5) * 1.4 + (fbm(vec3(q * 6., 4.2)) - .5) * .35;
  float ph = th - 4.6 * r + warp;
  float c4 = .5 + .5 * cos(4. * ph);
  float arm = pow(c4, 6.) + .3 * pow(c4, 2.);
  float disk = exp(-r / .33) * smoothstep(1.32, .7, r);
  float clump = pow(fbm(vec3(q * 8., 3.1)), 1.6) * 2.2 * (.55 + .9 * fbm(vec3(q * 40., 7.7)));
  float knots = pow(clamp(fbm(vec3(q * 24., 9.2)) * 1.9 - .78, 0., 1.), 2.) * pow(c4, 6.);
  vec3 armCol = mix(vec3(.62, .74, 1.), vec3(.9, .92, 1.), clump * .4);
  vec3 em = armCol * disk * (.16 + 1.5 * arm * clump) + vec3(.95, .86, .98) * knots * disk * 7.;  em += vec3(1., .88, .7) * exp(-r / .12) * .55;
  float cb = cos(.5), sb = sin(.5); vec2 bq = vec2(cb * q.x - sb * q.y, sb * q.x + cb * q.y);
  em += vec3(1., .86, .64) * exp(-pow(bq.x / .24, 2.) - pow(bq.y / .075, 2.)) * .5;
  float lane = pow(.5 + .5 * cos(4. * ph - .45), 14.);
  float dust = disk * smoothstep(.06, .25, r) * (lane * 2.6 + .18) * smoothstep(.28, .7, fbm(vec3(q * 13., 5.5)));
  o = vec4(em * .5, clamp(dust * .9, 0., 1.));
}`);
shaderProgram('galaxy', `
void main(){
  vec2 px = logical();
  vec3 rd = unrot(normalize(vec3((px - uB.xy) / uA.z, 1.)), uA.x, uA.y), ro = unrot(vec3(0., 0., -uA.w), uA.x, uA.y);
  float tc = -dot(ro, rd), dmin = length(ro + rd * tc);                      // closest approach to the centre
  float bulge = exp(-dmin / .04) * 1.1 + exp(-dmin / .13) * .45 + exp(-dmin / .4) * .05;
  vec3 col = vec3(1., .86, .66) * bulge;
  float ry = abs(rd.y) < 1e-4 ? 1e-4 : rd.y, t = -ro.y / ry;
  if (t > 0.) {
    vec3 p = ro + rd * t; vec2 uv = p.xz / 2.6 + .5;
    vec4 m = texture(uMap, uv);
    float slant = clamp(1. / max(abs(rd.y), .12), 1., 4.);
    float tau = m.a * uB.w * min(slant, 3.);
    vec3 disk = m.rgb * 2.4 * pow(slant, .55) * exp(-tau * .35);
    float front = smoothstep(-.02, .02, tc - t);                             // the disk is between us and the core
    col = col * mix(1., exp(-tau), front) + disk;
  }
  o = vec4(col * uB.z, 1.);
}`);
const GAL_MAP = (() => {                                         // bake the map once into a texture on unit 0
  const tex = sgl.createTexture(); sgl.bindTexture(sgl.TEXTURE_2D, tex);
  sgl.texImage2D(sgl.TEXTURE_2D, 0, sgl.RGBA8, 2048, 2048, 0, sgl.RGBA, sgl.UNSIGNED_BYTE, null);
  sgl.texParameteri(sgl.TEXTURE_2D, sgl.TEXTURE_MIN_FILTER, sgl.LINEAR_MIPMAP_LINEAR); sgl.texParameteri(sgl.TEXTURE_2D, sgl.TEXTURE_MAG_FILTER, sgl.LINEAR);
  sgl.texParameteri(sgl.TEXTURE_2D, sgl.TEXTURE_WRAP_S, sgl.CLAMP_TO_EDGE); sgl.texParameteri(sgl.TEXTURE_2D, sgl.TEXTURE_WRAP_T, sgl.CLAMP_TO_EDGE);
  const fb = sgl.createFramebuffer(); sgl.bindFramebuffer(sgl.FRAMEBUFFER, fb); sgl.framebufferTexture2D(sgl.FRAMEBUFFER, sgl.COLOR_ATTACHMENT0, sgl.TEXTURE_2D, tex, 0);
  runShader('galaxyMap', 0, null, null, null, null, 2048, 2048);
  sgl.bindFramebuffer(sgl.FRAMEBUFFER, null); sgl.activeTexture(sgl.TEXTURE0); sgl.bindTexture(sgl.TEXTURE_2D, tex); sgl.generateMipmap(sgl.TEXTURE_2D);
  return tex;
})();
// the galaxy in light: cam = { yaw, pitch, cx, cy, F, D } exactly as for drawGalaxy; dust 0–4
function galaxyLight(cam, a = 1, o = {}) {
  shade('galaxy', 0, [cam.yaw, cam.pitch, cam.F, cam.D], [cam.cx, cam.cy, o.bright ?? 1, o.dust ?? 2.5], null, null, a);
  if (o.stars !== false) drawGalaxy(cam, a * (o.starA ?? .35), { size: 1.2, core: 0 });
}

// ---- a planet seen from orbit: night side, clouds, sun glint, a thin blue atmosphere; and the star rising behind it
shaderProgram('planet', `
void main(){
  vec2 px = logical(); vec2 d = (px - uA.xy) / uA.z; float r = length(d);
  vec3 L = normalize(vec3(uB.x - uA.x, -(uB.y - uA.y), -uA.z * .3));
  vec3 col = vec3(0.);
  vec2 s2 = normalize(vec2(L.x, L.y));
  if (r < 1.) {
    vec3 n = vec3(d.x, -d.y, sqrt(1. - r * r));
    float dif = max(dot(n, L), 0.), cl = smoothstep(.48, .78, fbm(n * 4.5 + vec3(0., 0., uA.w * .004)));
    vec3 surf = mix(vec3(.015, .04, .08), vec3(.82, .86, .9), cl);
    vec3 H = normalize(L + vec3(0., 0., 1.));
    col = surf * dif * 1.3 + pow(max(dot(n, H), 0.), 80.) * (1. - cl) * vec3(1., .94, .82) * 1.2;
    float facing = pow(max(dot(normalize(n.xy + 1e-5), s2), 0.), 3.);
    col += vec3(.3, .55, 1.) * pow(1. - n.z, 4.) * (.08 + 1.8 * facing);
  } else {
    float h = (r - 1.) * uA.z, facing = pow(max(dot(normalize(vec2(d.x, -d.y)), s2), 0.), 2.);
    col = vec3(.35, .62, 1.) * exp(-h / 7.) * (.15 + 1.6 * facing) + vec3(.25, .45, .95) * exp(-h / 45.) * .12 * (.2 + facing);
  }
  vec2 sp = px - uB.xy; float sd = length(sp), vis = smoothstep(-6., 10., (length((uB.xy - uA.xy) / uA.z) - 1.) * uA.z);
  col += vec3(1., .97, .92) * uB.z * vis * (exp(-sd / 14.) * 2.5 + exp(-sd / 110.) * .3 + exp(-abs(sp.y) / 2.5) * exp(-abs(sp.x) / 650.) * .6);
  o = vec4(col, 1.);
}`);

// ---- a dead world: ray-marched ruins of colossal towers and a broken dome on a dusty plain, a ringed giant in the sky
shaderProgram('ruins', `
float sdBox(vec3 p, vec3 b){ vec3 q = abs(p) - b; return length(max(q, 0.)) + min(max(q.x, max(q.y, q.z)), 0.); }
float ground(vec3 p){ return p.y + 1.2 - fbm(vec3(p.xz * .07, 0.)) * 2.4 - fbm(vec3(p.xz * .7, 2.)) * .18; }
float tower(vec3 p, vec3 c, vec3 b, float cut, float s){
  vec3 q = p - c - vec3(0., b.y, 0.);
  float d = sdBox(q, b);
  d = max(d, dot(p - c - vec3(0., 2. * b.y * cut, 0.), normalize(vec3(sin(s) * .9, 1.6, cos(s) * .9))));    // sheared top
  vec3 w = q; w.y = mod(w.y + .9, 1.8) - .9; d = max(d, -sdBox(w, vec3(b.x + .2, .38, b.z * .45)));       // window rows
  return d - fbm(p * 1.7) * .12;
}
float map(vec3 p){
  float d = ground(p);
  d = min(d, tower(p, vec3(-7., -1., 18.), vec3(1.6, 9., 1.6), .82, 1.));
  d = min(d, tower(p, vec3(-3.4, -1., 26.), vec3(1.1, 6., 1.1), .7, 2.));
  d = min(d, tower(p, vec3(9.5, -1., 30.), vec3(2., 12., 2.), .6, 4.));
  d = min(d, tower(p, vec3(4., -1., 14.), vec3(.8, 2.8, .8), .9, 5.));
  vec3 dc = vec3(2., -1., 40.); float dome = abs(length(p - dc) - 9.) - .35;                                // broken dome shell
  dome = max(dome, -(p.y + 1.) ); dome = max(dome, -sdBox(p - dc - vec3(-5., 6., -6.), vec3(5., 5., 5.)) + fbm(p * .8) * 1.5);
  d = min(d, dome);
  vec3 a = p - vec3(-14., -1., 34.); float arch = max(abs(length(a.xy) - 6.) - .7, abs(a.z) - .9); arch = max(arch, -a.y); d = min(d, arch);
  for (int i = 0; i < 7; i++) { float fi = float(i); vec3 rp = p - vec3(-10. + fi * 3.7 + sin(fi * 7.) * 2., -1.1, 9. + fi * 2.4 + cos(fi * 3.) * 3.);
    d = min(d, sdBox(rp, vec3(.5 + .4 * hash(vec3(fi)), .4, .6)) - .05); }                                    // fallen blocks
  return d;
}
vec3 nrm(vec3 p){ vec2 e = vec2(.01, 0.); return normalize(vec3(map(p + e.xyy) - map(p - e.xyy), map(p + e.yxy) - map(p - e.yxy), map(p + e.yyx) - map(p - e.yyx))); }
vec3 sky(vec3 rd, vec3 sun){
  vec3 c = mix(vec3(.10, .11, .13), vec3(0.), smoothstep(-.02, .45, rd.y));
  c += vec3(.55, .6, .7) * pow(max(dot(rd, sun), 0.), 6.) * .25;
  vec3 pc = normalize(vec3(.42, .36, 1.)) * 900.; float pr = 160.;                                            // the ringed giant
  float b = dot(pc, rd), h = b * b - dot(pc, pc) + pr * pr;
  vec3 rn = normalize(vec3(.18, 1., -.35));
  float tr = dot(pc, rn) / dot(rd, rn); vec3 rp = rd * tr - pc; float rr = length(rp);
  float ring = (tr > 0. && rr > pr * 1.35 && rr < pr * 2.3) ? (.35 + .65 * fbm(vec3(rr * .08, 0., 0.))) * smoothstep(pr * 1.35, pr * 1.5, rr) * smoothstep(pr * 2.3, pr * 2.1, rr) : 0.;
  if (h > 0.) {
    float t = b - sqrt(h); vec3 n = normalize(rd * t - pc);
    float lat = dot(n, rn), band = .55 + .45 * sin(lat * 26. + fbm(n * 6.) * 3.);
    vec3 pl = vec3(.62, .64, .68) * band * max(dot(n, sun), 0.) + vec3(.03);
    bool behind = tr > 0. && tr > t; float rf = behind ? 0. : ring;
    return mix(pl, vec3(.8, .82, .86) * max(.25, dot(rn, sun)), rf * .85);
  }
  return c + vec3(.78, .8, .85) * ring * .55;
}
void main(){
  vec2 px = logical(), uv = (px - vec2(${W / 2}., ${H / 2}.)) / ${H}. * vec2(1., -1.);
  vec3 ro = vec3(uA.x, 2.4 + uA.y, -14. + uA.z), ta = vec3(0., 4.5, 20.);
  vec3 f = normalize(ta - ro), r = normalize(cross(vec3(0., 1., 0.), f)), u = cross(f, r), rd = normalize(f * 1.5 + r * uv.x + u * uv.y);
  vec3 sun = normalize(vec3(-.55, .22, .8));
  float t = 0.; bool hit = false;
  for (int i = 0; i < 110; i++) { float d = map(ro + rd * t); if (d < .004 * t) { hit = true; break; } t += d * .9; if (t > 120.) break; }
  vec3 col = sky(rd, sun);
  if (hit) {
    vec3 p = ro + rd * t, n = nrm(p);
    float sh = 1., st = .05; for (int i = 0; i < 28; i++) { float h = map(p + sun * st); sh = min(sh, 9. * h / st); st += clamp(h, .05, .6); if (h < .001 || st > 25.) break; }
    float ao = clamp(map(p + n * .4) / .4, 0., 1.);
    vec3 alb = mix(vec3(.30, .31, .33), vec3(.42, .41, .40), fbm(p * 2.));
    vec3 c = alb * (vec3(.85, .88, .95) * max(dot(n, sun), 0.) * clamp(sh, 0., 1.) * 1.6 + vec3(.10, .11, .13) * (.5 + .5 * n.y) * ao);
    col = mix(c, vec3(.11, .12, .14), 1. - exp(-t * .022));
  }
  col += vec3(.7, .72, .78) * pow(fbm(vec3(px * .004, uT * .05)), 3.) * .06;                                 // drifting dust
  o = vec4(pow(col, vec3(.95)) * uB.x, 1.);
}`);

// ======================================================================== the Golden Record (drawn, not photographed)
// The cover engravings follow the real Voyager record cover: playback diagrams (top), the pulsar map (bottom left),
// the hydrogen hyperfine transition (bottom right), the video-signal diagrams (right). Engraving rotates with the disc;
// the anisotropic highlight of the grooves stays fixed to the light, which is what makes it read as metal.
let REC_ENGRAVE = null;
function bakeRecord() {
  const S = 1024, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), R = S / 2;
  x.translate(R, R); x.lineCap = 'round';
  const ink = (w = 3) => { x.strokeStyle = 'rgba(70,46,12,.85)'; x.lineWidth = w; };
  const hi = (w = 2) => { x.strokeStyle = 'rgba(255,236,190,.35)'; x.lineWidth = w; };
  const both = (fn, w) => { x.save(); x.translate(1.6, 1.6); hi(w); fn(); x.restore(); ink(w); fn(); };
  // label ring and hole
  both(() => { x.beginPath(); x.arc(0, 0, 150, 0, TAU); x.stroke(); }, 2.5);
  // top left: the record seen from above, with the stylus and the binary rotation period
  both(() => { x.beginPath(); x.arc(-215, -205, 92, 0, TAU); x.stroke(); x.beginPath(); x.arc(-215, -205, 10, 0, TAU); x.stroke();
    x.beginPath(); x.moveTo(-120, -300); x.lineTo(-170, -230); x.stroke(); }, 3);
  both(() => { for (let i = 0; i < 14; i++) { const a = -PI * .9 + i * .14; x.beginPath(); x.moveTo(-215 + Math.cos(a) * 112, -205 + Math.sin(a) * 112); x.lineTo(-215 + Math.cos(a) * (i % 3 ? 120 : 130), -205 + Math.sin(a) * (i % 3 ? 120 : 130)); x.stroke(); } }, 2.5);
  // top right: the record edge-on with the stylus, and the playing time in binary
  both(() => { x.beginPath(); x.moveTo(90, -250); x.lineTo(330, -250); x.stroke(); x.beginPath(); x.moveTo(180, -250); x.lineTo(250, -310); x.stroke();
    for (let i = 0; i < 12; i++) { x.beginPath(); x.moveTo(110 + i * 18, -205); x.lineTo(110 + i * 18, i % 2 ? -190 : -180); x.stroke(); } }, 3);
  // right: the video signal waveform, the raster, the first picture (a circle)
  both(() => { x.beginPath(); for (let i = 0; i <= 60; i++) { const u = i / 60; x.lineTo(95 + u * 250, -95 + Math.sin(u * 30) * 12 * (i % 10 < 2 ? 2.2 : 1)); } x.stroke();
    x.strokeRect(150, -20, 170, 120); for (let i = 0; i < 8; i++) { x.beginPath(); x.moveTo(150, -10 + i * 14); x.lineTo(320, -4 + i * 14); x.stroke(); }
    x.strokeRect(190, 140, 110, 110); x.beginPath(); x.arc(245, 195, 36, 0, TAU); x.stroke(); }, 2.5);
  // bottom left: the pulsar map — 14 lines from the Sun to pulsars, binary periods as ticks, and the long line to the galactic centre
  both(() => { const ox = -200, oy = 215; x.beginPath(); x.moveTo(ox, oy); x.lineTo(ox + 230, oy - 6); x.stroke();
    const P = [[.4, 120], [.9, 95], [1.4, 140], [2.0, 70], [2.5, 110], [2.9, 160], [3.3, 85], [3.8, 130], [4.3, 100], [4.8, 150], [5.3, 75], [5.7, 120], [6.0, 90], [-.3, 105]];
    for (const [a, l] of P) { x.beginPath(); x.moveTo(ox, oy); x.lineTo(ox + Math.cos(a) * l, oy + Math.sin(a) * l); x.stroke();
      for (let k = 1; k < 6; k++) { const d = l * (.35 + k * .1), nx = -Math.sin(a) * (k % 2 ? 5 : 9), ny = Math.cos(a) * (k % 2 ? 5 : 9);
        x.beginPath(); x.moveTo(ox + Math.cos(a) * d, oy + Math.sin(a) * d); x.lineTo(ox + Math.cos(a) * d + nx, oy + Math.sin(a) * d + ny); x.stroke(); } } }, 2);
  // bottom right: the hydrogen atom in its two states, joined by the transition line
  both(() => { for (const cx of [140, 290]) { x.beginPath(); x.arc(cx, 280, 30, 0, TAU); x.stroke(); x.beginPath(); x.arc(cx, 280, 4, 0, TAU); x.stroke(); }
    x.beginPath(); x.moveTo(170, 280); x.lineTo(260, 280); x.stroke(); x.beginPath(); x.moveTo(140, 240); x.lineTo(140, 228); x.moveTo(290, 320); x.lineTo(290, 332); x.stroke(); }, 2.5);
  REC_ENGRAVE = c;
}
function goldenRecord(cx, cy, R, rot = 0, a = 1) {
  if (a <= 0) return;
  if (!REC_ENGRAVE) bakeRecord();
  ctx.save(); ctx.globalAlpha = a;
  ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = R * .12;
  const base = ctx.createRadialGradient(cx - R * .3, cy - R * .35, R * .05, cx, cy, R);
  base.addColorStop(0, '#d9b469'); base.addColorStop(.6, '#a77c34'); base.addColorStop(.95, '#6e4c19'); base.addColorStop(1, '#3a2709');
  ctx.fillStyle = base; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
  const an = ctx.createConicGradient(-.6, cx, cy);                // brushed-groove highlight, fixed to the light
  [[0, .0], [.06, .55], [.13, .0], [.38, .05], [.5, .0], [.56, .45], [.63, .0], [.88, .05], [1, .0]].forEach(([s, v]) => an.addColorStop(s, `rgba(255,235,185,${v})`));
  ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = an; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
  ctx.globalCompositeOperation = 'source-over';
  for (let r = R * .32; r < R * .985; r += Math.max(1.1, R / 260)) { ctx.strokeStyle = `rgba(60,40,10,${.06 + .05 * hash(r)})`; ctx.lineWidth = .7; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke(); }
  ctx.translate(cx, cy); ctx.rotate(rot); ctx.drawImage(REC_ENGRAVE, -R, -R, 2 * R, 2 * R); ctx.rotate(-rot); ctx.translate(-cx, -cy);
  ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(cx, cy, R * .028, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(255,230,170,.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, R - 1, -2.4, -.9); ctx.stroke();
  ctx.restore();
}

// ======================================================================== a small 3D renderer for engineered things
// Models are y-up lists of primitives: { t: 'tri', v: [a, b, c], c: [r, g, b], spec } and { t: 'line', v: [a, b], c, w, a }.
// Lit by one key light plus ambient, painter-sorted, projected with lib.js proj() (which is y-down, hence the flip).
const V3 = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  norm: a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
  rx: (v, a) => [v[0], v[1] * Math.cos(a) - v[2] * Math.sin(a), v[1] * Math.sin(a) + v[2] * Math.cos(a)],
  ry: (v, a) => [v[0] * Math.cos(a) + v[2] * Math.sin(a), v[1], -v[0] * Math.sin(a) + v[2] * Math.cos(a)],
  rz: (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a), v[2]],
};
function camPos(cam) { const cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch), cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw); return [cam.D * cp * sy, cam.D * sp, -cam.D * cp * cy]; }
const P3 = (v, cam) => proj([v[0], -v[1], v[2]], cam.yaw, cam.pitch, cam.cx, cam.cy, cam.F, cam.D);
function renderMesh(prims, cam, o = {}) {
  const L = V3.norm(o.light || [.5, .7, -.4]), eye = camPos(cam), amb = o.amb ?? .12, rim = o.rim || [.5, .65, .9], a = o.a ?? 1;
  const items = [];
  for (const p of prims) {
    const S = p.v.map(v => P3(v, cam)), depth = S.reduce((s, q) => s + q[2], 0) / S.length;
    if (S.some(q => q[2] <= 0)) continue;
    items.push([depth, p, S]);
  }
  items.sort((x, y) => x[0] - y[0]);
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for (const [, p, S] of items) {
    if (p.t === 'tri') {
      let n = V3.norm(V3.cross(V3.sub(p.v[1], p.v[0]), V3.sub(p.v[2], p.v[0])));
      const cen = V3.mul(V3.add(V3.add(p.v[0], p.v[1]), p.v[2]), 1 / 3), view = V3.norm(V3.sub(eye, cen));
      if (V3.dot(n, view) < 0) n = V3.mul(n, -1);
      const dif = Math.max(0, V3.dot(n, L)), h = V3.norm(V3.add(L, view)), spec = (p.spec || 0) * Math.pow(Math.max(0, V3.dot(n, h)), 30);
      const fr = Math.pow(1 - Math.max(0, V3.dot(n, view)), 3) * .35;
      const c = p.c.map((k, i) => Math.min(255, (k * (amb + dif * .95) + 255 * spec + rim[i] * 255 * fr * (o.rimAmt ?? 1))));
      ctx.fillStyle = `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a * (p.a ?? 1)})`;
      ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = .6;
      ctx.beginPath(); ctx.moveTo(S[0][0], S[0][1]); ctx.lineTo(S[1][0], S[1][1]); ctx.lineTo(S[2][0], S[2][1]); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else {
      ctx.strokeStyle = rgba(p.c, a * (p.a ?? 1)); ctx.lineWidth = (p.w || 1) * Math.min(2, S[0][2]);
      ctx.beginPath(); ctx.moveTo(S[0][0], S[0][1]); ctx.lineTo(S[1][0], S[1][1]); ctx.stroke();
    }
  }
  ctx.restore();
}
// builders: a quad as two tris; a box; a lathe (surface of revolution) — all y-up
function quad(a, b, c, d, col, spec = 0) { return [{ t: 'tri', v: [a, b, c], c: col, spec }, { t: 'tri', v: [a, c, d], c: col, spec }]; }
function box(c, s, col, rot = v => v) {
  const [x, y, z] = c, [w, h, d] = s, P = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]].map(([i, j, k]) => V3.add(rot([i * w / 2, j * h / 2, k * d / 2]), [x, y, z]));
  return [[0, 1, 2, 3], [5, 4, 7, 6], [4, 0, 3, 7], [1, 5, 6, 2], [3, 2, 6, 7], [4, 5, 1, 0]].flatMap(([a, b, cc, d2]) => quad(P[a], P[b], P[cc], P[d2], col));
}
function strut(a, b, col, w = 1, al = 1) { return { t: 'line', v: [a, b], c: col, w, a: al }; }

// a surface of revolution-like patch: fn(r in 0..1, theta) → local [x, y, z]; xf maps local → world (y-up).
// Rings alternate shade a little so panel seams read; the centre is a triangle fan.
function surfaceMesh(fn, nr, ns, col, xf = v => v, spec = .4, seam = .09) {
  const P = [];
  for (let i = 0; i <= nr; i++) { const ring = []; for (let j = 0; j < ns; j++) ring.push(xf(fn(i / nr, j / ns * TAU))); P.push(ring); }
  const out = [], shade = (i, j) => col.map(k => k * (1 - seam * ((i + j) & 1)));
  for (let j = 0; j < ns; j++) out.push({ t: 'tri', v: [xf(fn(0, 0)), P[1][j], P[1][(j + 1) % ns]], c: shade(0, j), spec });
  for (let i = 1; i < nr; i++) for (let j = 0; j < ns; j++) {
    const j2 = (j + 1) % ns;
    out.push({ t: 'tri', v: [P[i][j], P[i + 1][j], P[i + 1][j2]], c: shade(i, j), spec }, { t: 'tri', v: [P[i][j], P[i + 1][j2], P[i][j2]], c: shade(i, j), spec });
  }
  return out;
}
// a paraboloid reflector of radius R and focal length f, axis along local +z, vertex at the origin
const paraboloid = (R, f, nr, ns, col, xf, spec = .5) => surfaceMesh((u, a) => { const r = u * R; return [r * Math.cos(a), r * Math.sin(a), r * r / (4 * f)]; }, nr, ns, col, xf, spec);

// ======================================================================== Arecibo, as a lit 3D model (no photo was supplied)
// 305 m spherical dish in a sinkhole, three towers, cables to a triangular platform 150 m above. 1 unit ≈ 100 m.
// `drop` 0→1 lowers the platform into the dish; `cut` = which of the three cable bundles have snapped.
const AR_TOWERS = [[0, 1.5, -2.0], [-1.73, 1.2, 1.0], [1.73, 1.1, 1.0]];
function areciboModel(drop = 0, cut = [0, 0, 0], tilt = 0) {
  const P = [], DISH = [96, 102, 112], STEEL = [200, 205, 214], CONC = [110, 112, 116];
  P.push(...surfaceMesh((u, a) => { const r = u * 1.53; return [r * Math.cos(a), r * r * .16 - .02, r * Math.sin(a)]; }, 12, 48, DISH, v => v, .7, .14));
  for (let j = 0; j < 48; j++) { const a0 = j / 48 * TAU, a1 = (j + 1) / 48 * TAU; P.push(strut([1.53 * Math.cos(a0), .355, 1.53 * Math.sin(a0)], [1.53 * Math.cos(a1), .355, 1.53 * Math.sin(a1)], [190, 198, 210], 1.6, .9)); }
  const py = 1.5 - drop * 1.25, pc = [0, py, 0], rot = v => V3.rz(V3.rx(v, tilt * .6), tilt);
  const tri = [0, 1, 2].map(i => { const a = -PI / 2 + i * TAU / 3; return V3.add(pc, rot([Math.cos(a) * .5, 0, Math.sin(a) * .5])); });
  for (let i = 0; i < 3; i++) { P.push(strut(tri[i], tri[(i + 1) % 3], STEEL, 3.2)); P.push(strut(tri[i], V3.add(pc, rot([0, -.12, 0])), STEEL, 1.6, .8)); }
  P.push(...box(V3.add(pc, rot([0, -.18, 0])), [.22, .16, .22], [215, 220, 228], rot));                         // the Gregorian dome
  P.push(...box(V3.add(pc, rot([.15, -.08, 0])), [.62, .05, .08], STEEL, v => rot(V3.ry(v, .3))));              // the azimuth arm
  AR_TOWERS.forEach((t, i) => {
    const [x, h, z] = t; P.push(...box([x, h / 2 + .3, z], [.12, h, .12], CONC));
    for (let k = 0; k < 4; k++) P.push(strut([x * 1.25, .5, z * 1.25], [x, h + .3, z], [80, 84, 90], 1, .6));    // backstays
    if (!cut[i]) for (const o of [-.03, 0, .03]) P.push(strut([x, h + .3, z + o], tri[i], [220, 224, 232], 1.1, .9));
  });
  return P;
}
