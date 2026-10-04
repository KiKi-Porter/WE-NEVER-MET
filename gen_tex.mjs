// Typeset the formulas with MathJax (offline) -> SVG, bundled as data URLs in tex.js (window.TEX).
//   node gen_tex.mjs
// w / h are in em, so tex(name, x, y, size) draws the formula with `size` px per em.
import { writeFileSync } from 'node:fs';
import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { SVG } from 'mathjax-full/js/output/svg.js';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages.js';

const A = '\\color{#7FB4FF}';     // the one cool accent
const G = '\\color{#E8C27A}';     // gold: only for what humanity sent
const F = {
  drake: 'N = R_{*}\\cdot f_p\\cdot n_e\\cdot f_l\\cdot f_i\\cdot f_c\\cdot L',
  drakeN: `{${A}N}`,
  f_R: 'R_{*}', f_fp: 'f_p', f_ne: 'n_e', f_fl: 'f_l', f_fi: 'f_i', f_fc: 'f_c', f_L: 'L',
  semi: `1679 = {${G}23}\\times{${G}73}`,
  q1679: '1679 = \\;?',
  wow: '\\mathrm{SNR}_{U}\\approx 30\\,\\sigma',
  bubble: '\\frac{100\\ \\mathrm{ly}}{100\\,000\\ \\mathrm{ly}} = 10^{-3}',
  lightday: 'c\\cdot 1\\,\\mathrm{day}\\approx 2.6\\times10^{10}\\ \\mathrm{km}',
  filter: 'P(\\text{star}\\to\\text{us}) = \\prod_{k} p_k',
  m13: 'd_{M13}\\approx 25\\,000\\ \\mathrm{ly}',
};

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);
const doc = mathjax.document('', { InputJax: new TeX({ packages: AllPackages }), OutputJax: new SVG({ fontCache: 'none' }) });
const out = {};
for (const [k, s] of Object.entries(F)) {
  const node = doc.convert(s, { display: true });
  let svg = adaptor.innerHTML(node);
  const w = parseFloat(svg.match(/width="([\d.]+)ex"/)[1]) / 2, h = parseFloat(svg.match(/height="([\d.]+)ex"/)[1]) / 2;   // 1ex ≈ .5em
  svg = svg.replace(/currentColor/g, '#F3F5F8').replace(/width="[\d.]+ex"/, `width="${w * 100}"`).replace(/height="[\d.]+ex"/, `height="${h * 100}"`)
    .replace(/style="[^"]*"/, '');
  out[k] = { w, h, src: 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64') };
}
writeFileSync('tex.js', 'window.TEX = ' + JSON.stringify(out) + ';\n');
console.log(Object.keys(out).length, 'formulas', Object.fromEntries(Object.entries(out).slice(0, 4).map(([k, v]) => [k, [v.w.toFixed(2), v.h.toFixed(2)]])));
