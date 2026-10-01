#!/usr/bin/env node
/* The token lint. Reads every stylesheet under src/ and reports a value
   written where a token exists for it: a pixel or rem length in padding,
   margin, gap, border-radius, font-size or line-height; a color literal
   anywhere; a duration in a transition or animation. tokens.css itself is
   where the literals live and is the one file exempt.

   It is a small rule, deliberately: it does not parse CSS, it reads
   declarations with a regex, and it says which line. What it buys is the
   difference between a rule in a document ("never introduce arbitrary
   values when a token exists") and a rule that fails a build. This is the
   check that caught `padding: 10px 14px` in the experiment.

   Usage: node scripts/token-lint.mjs [dir]   (default: src)
   Exit 0 clean, 1 findings. Prints JSON with --json for the collector. */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DIR = path.resolve(ROOT, process.argv.find((a) => !a.startsWith('-') && !a.includes('token-lint') && a !== process.argv[0]) ?? 'src');
const JSON_OUT = process.argv.includes('--json');
const TOKENS_FILE = path.join(ROOT, 'src/tokens/tokens.css');

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.css')) out.push(p);
  }
  return out;
}

/* Which properties a token covers. A length in any of these has a spacing,
   shape or type token; a color anywhere has a color token; a time has a
   motion token. Width and height are not here: a column width or an icon
   box is a layout fact, not a token. */
const SPACE_PROPS = /^(padding|margin|gap|row-gap|column-gap|inset|top|right|bottom|left)(-[a-z]+)?$/;
const SHAPE_PROPS = /^(border-radius|border(-[a-z]+)?-radius)$/;
const TYPE_PROPS = /^(font-size|line-height|letter-spacing|font-family|font-weight)$/;
const COLOR_PROPS = /^(color|background|background-color|border|border-color|border-(top|right|bottom|left)|border-(top|right|bottom|left)-color|outline|outline-color|box-shadow|fill|stroke)$/;
const MOTION_PROPS = /^(transition|transition-duration|animation|animation-duration|transition-timing-function|animation-timing-function)$/;

const LENGTH = /(?<![\w-])-?\d*\.?\d+(px|rem|em)(?![\w-])/g;
const COLOR = /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(|\boklch\(/gi;
const TIME = /(?<![\w-])\d*\.?\d+m?s(?![\w-])/g;
const CUBIC = /cubic-bezier\(/;

/* Values a token does not replace: 0, 1px for a hairline border where the
   token is --border-width (reported), 100%, auto, inherit. A 1px that is
   not a border is a nudge and is allowed; so is 2px for an outline offset
   inside a ring the token already sets. 50% radii are circles. */
const ALLOWED_LENGTHS = new Set(['0', '0px', '0rem', '1px', '-1px', '2px', '-2px', '100%']);

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
}

function lineOf(text, index) {
  return text.slice(0, index).split('\n').length;
}

const files = walk(DIR);
const findings = [];

for (const file of files) {
  if (path.resolve(file) === TOKENS_FILE) continue;
  const raw = fs.readFileSync(file, 'utf8');
  const css = stripComments(raw);
  const rel = path.relative(ROOT, file);
  const decl = /([a-z-]+)\s*:\s*([^;{}]+);/g;
  let m;
  while ((m = decl.exec(css))) {
    const [, prop, value] = m;
    const line = lineOf(css, m.index);
    const v = value.trim();
    if (v.startsWith('--')) continue; // a custom property set on a component is scoped, not arbitrary
    const report = (kind, literal, hint) => findings.push({ file: rel, line, property: prop, value: v, literal, kind, hint });

    if (SPACE_PROPS.test(prop) || SHAPE_PROPS.test(prop) || TYPE_PROPS.test(prop)) {
      const outside = v.replace(/var\([^)]*\)/g, '').replace(/calc\([^)]*\)/g, (c) => c.replace(/\d*\.?\d+(px|rem|em)/g, ''));
      for (const len of outside.match(LENGTH) ?? []) {
        if (ALLOWED_LENGTHS.has(len)) continue;
        if (SHAPE_PROPS.test(prop) && (len === '50%' || len === '9999px')) continue;
        const group = TYPE_PROPS.test(prop) ? 'type' : SHAPE_PROPS.test(prop) ? 'shape' : 'space';
        report('length', len, `${group} token`);
      }
      if (prop === 'font-weight' && /^\d{3}$/.test(v)) report('weight', v, '--weight-*');
    }
    if (COLOR_PROPS.test(prop)) {
      const outside = v.replace(/var\([^)]*\)/g, '');
      for (const c of outside.match(COLOR) ?? []) {
        if (/^transparent$/i.test(c)) continue;
        report('color', c, 'color token');
      }
    }
    if (MOTION_PROPS.test(prop)) {
      const outside = v.replace(/var\([^)]*\)/g, '');
      for (const t of outside.match(TIME) ?? []) {
        if (t === '0s' || t === '0ms' || t === '0.01ms') continue;
        report('time', t, '--motion-*');
      }
      if (CUBIC.test(outside)) report('easing', 'cubic-bezier(…)', '--ease');
    }
  }
}

if (JSON_OUT) {
  console.log(JSON.stringify({ files: files.length, findings }, null, 2));
} else {
  console.log(`token-lint: ${files.length} stylesheets under ${path.relative(ROOT, DIR) || '.'}`);
  for (const f of findings) {
    console.log(`  ${f.file}:${f.line}  ${f.property}: ${f.value}  ← ${f.literal} written where a ${f.hint} exists`);
  }
  console.log(findings.length ? `✗ ${findings.length} value${findings.length === 1 ? '' : 's'} off the token layer` : '✓ every value is a token');
}
process.exit(findings.length ? 1 : 0);
