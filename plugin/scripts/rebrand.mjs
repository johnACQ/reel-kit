#!/usr/bin/env node
// rebrand.mjs: copy the reel-kit effects into a reel project, in your colours and fonts.
//
//   node rebrand.mjs --brand brand.json --out <reel project>/compositions
//   node rebrand.mjs --brand brand.json --check        (contrast check only, writes nothing)
//
// brand.json (every field optional):
//   { "accent": "#00BEFF", "ink": "#0B0F12", "displayFont": "Bebas Neue", "bodyFont": "Roboto",
//     "displayFontFile": "fonts/MyDisplay.ttf", "bodyFontFile": "fonts/MyBody.ttf" }
// Font names are Google Fonts families, unless you give a .ttf/.otf file (path relative to brand.json).
// Node 22+, no dependencies. Only touches files it writes; never deletes anything in --out.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(HERE, '../effects/components');
const DEF = { accent: '#00BEFF', ink: '#0B0F12', displayFont: 'Bebas Neue', bodyFont: 'Roboto' };
const MIN_ACCENT_INK = 4.5;   // dark type always sits on the accent fill
const MIN_INK_WHITE = 7;      // ink is the type colour on white cards
const SAFETY = 1.15;          // width multiplier when a font's real letter widths can't be read

// ---------- args ----------
const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const flag = (name) => args.includes(name);
if (flag('--help') || flag('-h')) {
  console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 12).map(l => l.replace(/^\/\/ ?/, '')).join('\n'));
  process.exit(0);
}
const brandPath = opt('--brand') || (fs.existsSync('brand.json') ? 'brand.json' : null);
const outDir = opt('--out');
const checkOnly = flag('--check');
const offline = flag('--offline');
if (!checkOnly && !outDir) die('Missing --out <reel project>/compositions (or use --check).');

let brand = {};
if (brandPath) {
  try { brand = JSON.parse(fs.readFileSync(brandPath, 'utf8')); }
  catch (e) { die(`Could not read ${brandPath}: ${e.message}`); }
}
const brandDir = brandPath ? path.dirname(path.resolve(brandPath)) : process.cwd();
const B = { ...DEF, ...Object.fromEntries(Object.entries(brand).filter(([, v]) => v !== '' && v != null)) };
for (const k of ['displayFont', 'bodyFont']) {
  if (/['"\\<>;{}]/.test(B[k])) die(`${k} "${B[k]}" has a character that breaks CSS. Use the plain family name.`);
}

// ---------- colour ----------
const mod = (x, n) => x - n * Math.floor(x / n);
function hexToRgb(h) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(h).trim());
  if (!m) die(`"${h}" is not a hex colour like #FF7A00.`);
  let s = m[1]; if (s.length === 3) s = s.split('').map(c => c + c).join('');
  return [0, 2, 4].map(i => parseInt(s.slice(i, i + 2), 16));
}
const rgbToHex = (rgb) => '#' + rgb.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();
function lum(rgb) {
  const c = rgb.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
function rgbToHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = mx === r ? mod((g - b) / d, 6) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [mod(h * 60, 360), s, l];
}
function hslToRgb([h, s, l]) {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(mod(h / 60, 2) - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [r, g, b].map(v => (v + m) * 255);
}
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const ratio = (n) => n.toFixed(2) + ':1';

const ink = hexToRgb(B.ink);
let accent = hexToRgb(B.accent);
const report = [];
if (contrast(ink, [255, 255, 255]) < MIN_INK_WHITE) {
  die(`ink ${B.ink} is only ${ratio(contrast(ink, [255, 255, 255]))} on the white cards (needs ${MIN_INK_WHITE}:1). Pick a near-black.`);
}
const startRatio = contrast(accent, ink);
if (startRatio < MIN_ACCENT_INK) {
  const orig = rgbToHex(accent);
  let t = 0, a = accent;
  while (contrast(a, ink) < MIN_ACCENT_INK && t < 1) { t += 0.02; a = mix(accent, [255, 255, 255], t); }
  accent = hexToRgb(rgbToHex(a));
  report.push(`accent ${orig} is ${ratio(startRatio)} against ink, too dark for the dark type on it. Lightened to ${rgbToHex(accent)} (${ratio(contrast(accent, ink))}).`);
}
const accentHex = rgbToHex(accent);
const accentWhite = contrast(accent, [255, 255, 255]);
const lines = [
  `accent ${accentHex}: ${ratio(contrast(accent, ink))} with ink type on it (min ${MIN_ACCENT_INK}:1)`,
  `ink    ${rgbToHex(ink)}: ${ratio(contrast(ink, [255, 255, 255]))} on white cards (min ${MIN_INK_WHITE}:1)`,
];
if (accentWhite < 1.25) report.push(`accent ${accentHex} is very close to white (${ratio(accentWhite)}): fills will barely show on the white cards.`);
if (checkOnly) { console.log([...lines, ...report].join('\n')); process.exit(0); }

// ---------- source files ----------
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}
if (!fs.existsSync(SRC)) die(`Effects folder not found next to this script: ${SRC}`);
const files = walk(SRC);
const isText = (p) => /\.(html|svg)$/i.test(p);

// colour map: exact accent + ink, then the accent's tints by hue, only for tokens that change
const colourMap = new Map();      // UPPER hex -> new hex
const rgbaMap = [];               // [regex, replacement]
const defAccent = hexToRgb(DEF.accent), defInk = hexToRgb(DEF.ink);
if (accentHex !== rgbToHex(defAccent)) {
  colourMap.set(rgbToHex(defAccent), accentHex);
  const [ah, as] = rgbToHsl(accent), [ch, cs] = rgbToHsl(defAccent);
  const seen = new Set();
  for (const f of files.filter(isText)) for (const m of fs.readFileSync(f, 'utf8').matchAll(/#[0-9a-f]{6}\b/gi)) seen.add(m[0].toUpperCase());
  for (const h of seen) {
    if (colourMap.has(h) || h === rgbToHex(defInk)) continue;
    const [th, ts, tl] = rgbToHsl(hexToRgb(h));
    if (th >= 180 && th <= 215 && ts >= 0.35) {
      const nh = mod(ah + (th - ch), 360), ns = Math.min(1, ts * (cs ? as / cs : 1));
      colourMap.set(h, rgbToHex(hslToRgb([nh, ns, tl])));
    }
  }
  rgbaMap.push([new RegExp(`rgba\\(\\s*${defAccent.join('\\s*,\\s*')}\\s*,`, 'g'), `rgba(${accent.join(',')},`]);
}
if (rgbToHex(ink) !== rgbToHex(defInk)) {
  colourMap.set(rgbToHex(defInk), rgbToHex(ink));
  rgbaMap.push([new RegExp(`rgba\\(\\s*${defInk.join('\\s*,\\s*')}\\s*,`, 'g'), `rgba(${ink.join(',')},`]);
}

// ---------- fonts ----------
const displayChanged = B.displayFont !== DEF.displayFont || !!B.displayFontFile;
const bodyChanged = B.bodyFont !== DEF.bodyFont || !!B.bodyFontFile;
const plus = (n) => n.trim().replace(/\s+/g, '+');
const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

async function googleTTF(family, weight) {
  const q = `https://fonts.googleapis.com/css2?family=${plus(family)}${weight && weight !== 400 ? `:wght@${weight}` : ''}`;
  const r = await fetch(q);                     // a non-browser client is served plain TrueType
  if (!r.ok) return null;
  const css = await r.text();
  const u = /url\((https:[^)]+)\)\s*format\('truetype'\)/.exec(css);
  if (!u) return null;
  const f = await fetch(u[1]);
  return f.ok ? Buffer.from(await f.arrayBuffer()) : null;
}
async function googleWeights(family, wanted) {
  const ok = [];
  for (const w of wanted) {
    const r = await fetch(`https://fonts.googleapis.com/css2?family=${plus(family)}:wght@${w}`);
    if (r.ok) ok.push(w);
  }
  return ok;
}

// minimal TrueType/OpenType reader: unitsPerEm, cmap (format 4 / 12) and hmtx advances
function fontAdvances(buf, chars) {
  const u16 = (o) => buf.readUInt16BE(o), u32 = (o) => buf.readUInt32BE(o), i16 = (o) => buf.readInt16BE(o);
  const tables = {};
  const n = u16(4);
  for (let i = 0; i < n; i++) { const r = 12 + i * 16; tables[buf.toString('latin1', r, r + 4)] = u32(r + 8); }
  for (const t of ['head', 'hhea', 'hmtx', 'cmap']) if (tables[t] == null) throw new Error(`font has no ${t} table`);
  const upem = u16(tables.head + 18), nh = u16(tables.hhea + 34), cm = tables.cmap;
  let sub4 = null, sub12 = null;
  for (let i = 0; i < u16(cm + 2); i++) {
    const r = cm + 4 + i * 8, pid = u16(r), off = cm + u32(r + 4), fmt = u16(off);
    if (fmt === 12 && (pid === 3 || pid === 0)) sub12 = off;
    if (fmt === 4 && (pid === 3 || pid === 0)) sub4 = off;
  }
  const glyph = (cp) => {
    if (sub12 != null) {
      const ng = u32(sub12 + 12);
      for (let g = 0; g < ng; g++) { const o = sub12 + 16 + g * 12, s = u32(o), e = u32(o + 4); if (cp >= s && cp <= e) return u32(o + 8) + cp - s; }
      return 0;
    }
    if (sub4 == null || cp > 0xffff) return 0;
    const seg = u16(sub4 + 6) / 2, ends = sub4 + 14, starts = ends + seg * 2 + 2, deltas = starts + seg * 2, ros = deltas + seg * 2;
    for (let s = 0; s < seg; s++) {
      if (cp > u16(ends + s * 2)) continue;
      const st = u16(starts + s * 2); if (cp < st) return 0;
      const ro = u16(ros + s * 2), d = i16(deltas + s * 2);
      if (!ro) return (cp + d) & 0xffff;
      const gi = u16(ros + s * 2 + ro + (cp - st) * 2);
      return gi ? (gi + d) & 0xffff : 0;
    }
    return 0;
  };
  const adv = (g) => u16(tables.hmtx + Math.min(g, nh - 1) * 4);
  return Array.from(chars).map(c => Math.round(adv(glyph(c.codePointAt(0))) * 1000 / upem));
}

async function fontBuffer(name, file, weight) {
  if (file) {
    const p = path.resolve(brandDir, file);
    if (!fs.existsSync(p)) die(`font file not found: ${p}`);
    return { buf: fs.readFileSync(p), base: path.basename(p) };
  }
  if (offline) return { buf: null, why: 'offline' };
  try {
    const buf = await googleTTF(name, weight);
    return { buf, base: `${name.replace(/[^A-Za-z0-9]+/g, '')}-${weight}.ttf`, why: `"${name}" weight ${weight} not found on Google Fonts` };
  } catch (e) { return { buf: null, why: `network: ${e.message}` }; }
}

let bodyWeights = [400, 500, 700, 900];
if (bodyChanged && !B.bodyFontFile && !offline) {
  try { bodyWeights = await googleWeights(B.bodyFont, [400, 500, 700, 900]); } catch { bodyWeights = []; }
  if (!bodyWeights.length) die(`"${B.bodyFont}" was not found on Google Fonts. Check the spelling, or give "bodyFontFile".`);
}
if (displayChanged && !B.displayFontFile && !offline) {
  try {
    const r = await fetch(`https://fonts.googleapis.com/css2?family=${plus(B.displayFont)}`);
    if (!r.ok) die(`"${B.displayFont}" was not found on Google Fonts. Check the spelling, or give "displayFontFile".`);
  } catch (e) { report.push(`could not reach Google Fonts (${e.message}); continuing without the check.`); }
}

// Every changed font is embedded as a local file: the renderer trusts @font-face, not a stylesheet link.
const faces = [];        // { family, weight, base, buf }
const byWeight = {};     // family -> { weight: buf }
async function embed(family, file, weights) {
  byWeight[family] = {};
  for (const w of weights) {
    const r = await fontBuffer(family, file, w);
    if (!r.buf) { report.push(`could not embed ${family} ${w} (${r.why}). The render will fall back to another font.`); continue; }
    faces.push({ family, weight: file ? null : w, base: r.base, buf: r.buf });
    byWeight[family][file ? 400 : w] = r.buf;
    if (file) break;
  }
}
if (displayChanged) await embed(B.displayFont, B.displayFontFile, [400]);
if (bodyChanged) await embed(B.bodyFont, B.bodyFontFile, B.bodyFontFile ? [400] : bodyWeights);

let CH = null;
for (const f of files.filter(p => p.endsWith('.html'))) {
  const m = /const CH = ("(?:[^"\\]|\\.)*");/.exec(fs.readFileSync(f, 'utf8'));
  if (m) { CH = JSON.parse(m[1]); break; }
}
const pickBuf = (family, w) => {
  const have = byWeight[family] || {}, ws = Object.keys(have).map(Number).sort((a, b) => a - b);
  const k = ws.filter(x => x <= w).pop() ?? ws[0];
  if (k != null && k < w && w === 900 && !B.bodyFontFile) report.push(`${family} has no 900 weight; the browser will fake it from ${k}. Look at the stills.`);
  return k != null ? have[k] : null;
};
const tables = {};       // ADV key -> widths, or 'scale'
const widthJobs = [];
if (displayChanged) widthJobs.push(['bebas', B.displayFont, 400]);
if (bodyChanged) widthJobs.push(['roboto900', B.bodyFont, 900], ['roboto700', B.bodyFont, 700]);
for (const [key, family, w] of widthJobs) {
  const buf = pickBuf(family, w);
  if (buf && CH) {
    try { tables[key] = fontAdvances(buf, CH); continue; }
    catch (e) { report.push(`could not read letter widths for ${family} (${e.message}).`); }
  }
  tables[key] = 'scale';
  report.push(`text fitting for ${family} uses estimated widths (x${SAFETY}). Check every fitted word in a still.`);
}
const faceCss = faces.map(f => `@font-face{font-family:'${f.family}';font-style:normal;${f.weight ? `font-weight:${f.weight};` : ''}font-display:block;src:url('compositions/assets/brand-fonts/${f.base}');}`);

// Some effects size text from an average letter width instead of a table. Scale those numbers by how
// much wider (or narrower) the new font is than the one they were tuned on.
let ORIG = null;
for (const f of files.filter(p => p.endsWith('.html'))) {
  const t = fs.readFileSync(f, 'utf8'), m = /const ADV = (\{.*?\});/.exec(t);
  if (m) { const a = JSON.parse(m[1]); ORIG = { ...ORIG, ...a }; }
}
const avgOf = (t, re) => { const idx = Array.from(CH || '').map((c, i) => re.test(c) ? i : -1).filter(i => i >= 0); return idx.reduce((s, i) => s + t[i], 0) / (idx.length || 1); };
const widthRatio = (key, re) => {
  if (!tables[key]) return 1;
  if (tables[key] === 'scale' || !ORIG || !ORIG[key]) return SAFETY;
  return avgOf(tables[key], re) / avgOf(ORIG[key], re);
};
const rCaps = widthRatio('bebas', /[A-Z]/), rDig = widthRatio('bebas', /[0-9]/), rBody = widthRatio('roboto700', /[A-Za-z]/);
const num = (v) => String(Math.round(v * 1000) / 1000);
const FIT_PATCHES = {       // file -> [literal, replacement]
  'split-card.html': [['LENS.concat([1]))) * 0.40))))', () => `LENS.concat([1]))) * ${num(0.40 * rCaps)}))))`]],
  'stat-card.html': [['const ADV = 0.44, DIG = 0.42;', () => `const ADV = ${num(0.44 * rCaps)}, DIG = ${num(0.42 * rDig)};`]],
  'claim-bars.html': [['(p[1].length * 0.56)', () => `(p[1].length * ${num(0.56 * rBody)})`]],
  'price-bounce.html': [['(Math.max(1, longest) * 0.58)', () => `(Math.max(1, longest) * ${num(0.58 * rBody)})`]],
  'chapter-tracker.html': [['return w * f * 1.04;', () => `return w * f * ${num(1.04 * rBody)};`]],
};
const fitChanged = rCaps !== 1 || rDig !== 1 || rBody !== 1;
if (fitChanged) report.push(`width-fitted effects rescaled: display caps x${num(rCaps)}, digits x${num(rDig)}, body x${num(rBody)}.`);

function fontUrl(u) {
  let s = u;
  if (displayChanged) s = s.replace(/family=Bebas\+Neue(?=&|$)/, B.displayFontFile ? '' : `family=${plus(B.displayFont)}`);
  if (bodyChanged) s = s.replace(/family=Roboto:wght@[\d;]+/, B.bodyFontFile ? '' : `family=${plus(B.bodyFont)}:wght@${bodyWeights.join(';')}`);
  return s.replace(/\?&+/, '?').replace(/&&+/g, '&');
}

function transform(text, isHtml, name) {
  let s = text;
  if (fitChanged && FIT_PATCHES[name]) {
    for (const [lit, rep] of FIT_PATCHES[name]) {
      if (!s.includes(lit)) die(`${name}: expected text-fit code not found; the effect changed. Re-check rebrand.mjs.`);
      s = s.replace(lit, rep());
    }
  }
  for (const [re, rep] of rgbaMap) s = s.replace(re, rep);
  if (colourMap.size) s = s.replace(/#[0-9a-f]{6}\b/gi, (h) => colourMap.get(h.toUpperCase()) || h);
  if (!isHtml) return s;
  if (displayChanged || bodyChanged) s = s.replace(/https:\/\/fonts\.googleapis\.com\/css2\?[^"']+/g, fontUrl);
  if (displayChanged) {
    s = s.replace(/@font-face\{font-family:'Bebas Neue';[^}]*\}/g, '');
    s = s.replace(/Bebas Neue/g, B.displayFont).replace(/\bBebas\b/g, B.displayFont);
    s = s.replace(/\/bebas\/i/g, `/${reEsc(B.displayFont.toLowerCase())}/i`);
  }
  if (bodyChanged) {
    s = s.replace(/(font-family:\s*|\d(?:px|em)(?:\/[\d.]+)?\s+)Roboto(?![ +]Mono)/g, `$1'${B.bodyFont}'`);
    s = s.replace(/Roboto(?![ +]Mono)/g, B.bodyFont);
    s = s.replace(/\/roboto\/i/g, `/${reEsc(B.bodyFont.toLowerCase())}/i`);
  }
  if (Object.keys(tables).length) {
    s = s.replace(/const ADV = (\{.*?\});/, (all, j) => {
      const adv = JSON.parse(j);
      for (const [k, t] of Object.entries(tables)) if (adv[k]) adv[k] = t === 'scale' ? adv[k].map(v => Math.round(v * SAFETY)) : t;
      return `const ADV = ${JSON.stringify(adv)};`;
    });
  }
  if (faceCss.length) s = s.replace(/<style>\n?/, (m) => m + faceCss.join('') + '\n');
  return s;
}

// ---------- write ----------
let written = 0;
for (const f of files) {
  const rel = path.relative(SRC, f), dest = path.join(outDir, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (isText(f)) fs.writeFileSync(dest, transform(fs.readFileSync(f, 'utf8'), f.endsWith('.html'), path.basename(f)));
  else fs.copyFileSync(f, dest);
  written++;
}
if (faces.length) {
  fs.mkdirSync(path.join(outDir, 'assets', 'brand-fonts'), { recursive: true });
  for (const f of faces) { fs.writeFileSync(path.join(outDir, 'assets', 'brand-fonts', f.base), f.buf); written++; }
  report.push(`embedded ${faces.map(f => f.base).join(', ')} in assets/brand-fonts/. Google Fonts are open licensed; for your own font files, check you may use them in video.`);
}

console.log(`reel-kit rebrand: ${written} files -> ${path.resolve(outDir)}`);
console.log(lines.map(l => '  ' + l).join('\n'));
if (colourMap.size) console.log('  colours: ' + [...colourMap].map(([a, b]) => `${a}->${b}`).join(', '));
else console.log('  colours: unchanged (default accent and ink)');
console.log(`  display font: ${B.displayFont}${displayChanged ? (tables.bebas === 'scale' ? ' (widths estimated)' : ' (real widths)') : ' (default)'}`);
console.log(`  body font: ${B.bodyFont}${bodyChanged ? ` weights ${bodyWeights.join('/')}` + (tables.roboto900 === 'scale' ? ' (widths estimated)' : ' (real widths)') : ' (default)'}`);
for (const r of report) console.log('  NOTE: ' + r);

function die(msg) { console.error('rebrand: ' + msg); process.exit(1); }
