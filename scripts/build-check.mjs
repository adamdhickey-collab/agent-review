#!/usr/bin/env node
/* Fails if the built stylesheets have lost light-dark().

   WHY THIS IS A CHECK. Every color token is light-dark(light, dark), and a
   surface picks its scheme with color-scheme: the review follows the
   reader's theme and Relay, in the preview frame, is always light. For a
   browser that predates light-dark() the minifier rewrites each token as
   var(--lightningcss-light, a) var(--lightningcss-dark, b). A custom
   property with a var() in it is resolved once, where it is declared, so
   every token reaches Relay already dark and the frame's own color-scheme
   cannot change it. The deployed product showed Relay dark while the dev
   server and the Storybook showed it light, and nothing else in
   `npm run check` or the visual tests builds anything: they all run against
   the dev server, so they could not see it. build-targets.ts holds the CSS
   target that keeps light-dark() native; this fails if that stops being
   true, whether the cause is the target, a Vite upgrade or a new minifier
   default.

     node scripts/build-check.mjs              build the app to a temporary directory and check it
     node scripts/build-check.mjs --dist dist  check a build that already exists: the app and the
                                               Storybook under it, which is what the deploy runs
                                               before it uploads anything
*/
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const i = process.argv.indexOf('--dist');
const given = i > -1 ? process.argv[i + 1] : null;

function stylesheets(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) return stylesheets(f);
    return e.name.endsWith('.css') ? [f] : [];
  });
}

function verdict(dir) {
  const files = stylesheets(dir);
  let native = 0;
  const lowered = [];
  for (const f of files) {
    const css = fs.readFileSync(f, 'utf8');
    native += (css.match(/light-dark\(/g) ?? []).length;
    const n = (css.match(/--lightningcss-/g) ?? []).length;
    if (n) lowered.push(`${path.relative(dir, f)} (${n})`);
  }
  if (lowered.length || native === 0) {
    console.error(
      `✗ ${files.length} built stylesheets have ${native} light-dark() and rewritten fallbacks (--lightningcss-*) in:\n` +
        (lowered.length ? lowered.map((l) => `    ${l}\n`).join('') : '    none, but there is no light-dark() at all\n') +
        '  A rewritten token is resolved on the root, so a surface that sets its own color-scheme (Relay in\n' +
        "  the preview frame) can no longer change it, and the product shows Relay in the review's theme.\n" +
        '  Keep CSS_TARGET in build-targets.ts at browsers with native light-dark(), and in every build that reads it.',
    );
    process.exitCode = 1;
  } else {
    console.log(`✓ ${files.length} built stylesheets keep light-dark() native (${native} uses, no rewritten fallbacks)`);
  }
}

if (given) {
  verdict(given);
} else {
  const { build } = await import('vite');
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-review-build-'));
  try {
    await build({ logLevel: 'silent', build: { outDir: out, emptyOutDir: true } });
    verdict(out);
  } finally {
    fs.rmSync(out, { recursive: true, force: true });
  }
}
