#!/usr/bin/env node
/* The Preview Studio screenshots: the delegated work's decision states, in
   both themes, at a desktop's 1440 and a phone's 390, taken by pressing
   through the app the way a person would, so every picture is a state the
   reducer reached. They are the set docs/preview-studio/README.md shows, and
   the set the case study's captures are retaken from.

   It takes a running app: the dev server (`npm run dev`), or a production
   build served under /agent-review/, which is what a capture for the site
   should come from (light-dark() and the build: see build-targets.ts).

     node scripts/preview-studio-shots.mjs [base-url] [out-dir]

   base-url defaults to http://localhost:5173/agent-review/, out-dir to
   docs/preview-studio/screens.

   A capture taller than the window is taken with the window made that tall,
   so what sticks to the window's edge (the Apply bar) sits where it would on
   a screen that tall rather than where the real window's edge was; the zoom
   steps read only the width, so the page is laid out as at 1440x1000. The
   one exception is the "follow" picture, which is the real 1440x1000 window
   scrolled to the second direction, to show the preview following it. */

import fs from 'node:fs';
import path from 'node:path';
import { chromium, devices } from 'playwright';

const base = process.argv[2] ?? 'http://localhost:5173/agent-review/';
const out = path.resolve(process.argv[3] ?? 'docs/preview-studio/screens');
fs.mkdirSync(out, { recursive: true });

const W = 1440;
const H = 1000;
const REASON = 'Support scans this feed for red during renewal week.';
const browser = await chromium.launch();
const problems = [];

async function settle(page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(350);
}

/* The bottom of the first element a selector names, in the page, with a
   step of room under it. Evaluated in the page, so the selector is passed
   in rather than closed over. */
const bottomOf = (selector) => {
  const el = document.querySelector(selector);
  if (!el) throw new Error(`nothing matches ${selector}`);
  const z = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
  return el.getBoundingClientRect().bottom + window.scrollY + 24 * z;
};

async function tall(page, file, selector, width = W) {
  await settle(page);
  await page.setViewportSize({ width, height: 4000 });
  await settle(page);
  const bottom = Math.max(H, Math.ceil(await page.evaluate(bottomOf, selector)));
  await page.setViewportSize({ width, height: bottom });
  await page.evaluate(() => window.scrollTo(0, 0));
  await settle(page);
  await page.screenshot({ path: path.join(out, file), clip: { x: 0, y: 0, width, height: bottom } });
  await page.setViewportSize({ width, height: H });
  console.log(`  ${file}  ${width}x${bottom}`);
}

for (const theme of ['light', 'dark']) {
  console.log(theme);
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, colorScheme: theme });
  await ctx.addInitScript((t) => localStorage.setItem('agent-review:theme', t), theme);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => problems.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && problems.push(m.text()));

  await page.goto(`${base}#/`, { waitUntil: 'networkidle' });
  await tall(page, `1-billing-before-${theme}.png`, '.studio');

  await page.getByRole('button', { name: /^Select and preview\s+Separate the meanings$/ }).click();
  await tall(page, `2-billing-separate-${theme}.png`, '.studio');

  await page.getByRole('button', { name: /^Select and preview\s+Keep the red for now$/ }).click();
  await page.getByRole('textbox', { name: 'Your reason' }).fill(REASON);
  await page.getByText('Use this decision for similar cases').click();
  await tall(page, `3-billing-keep-${theme}.png`, '.studio');

  /* The real window, scrolled to the second direction: the preview has
     followed it. */
  await page.getByRole('button', { name: /^Selected\s+Keep the red for now$/ }).scrollIntoViewIfNeeded();
  await settle(page);
  await page.screenshot({ path: path.join(out, `3b-billing-follow-${theme}.png`) });
  console.log(`  3b-billing-follow-${theme}.png  ${W}x${H}`);

  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await tall(page, `4-billing-record-${theme}.png`, '.decided');

  await page.goto(`${base}#/runs/shared-table`, { waitUntil: 'networkidle' });
  await page.reload({ waitUntil: 'networkidle' });
  await tall(page, `5-table-before-${theme}.png`, '.studio');
  await page.getByRole('button', { name: 'Approve, this once' }).click();
  await tall(page, `6-table-approve-${theme}.png`, '.studio');
  await ctx.close();

  /* A phone: the same first state, one column, a touch device. */
  const { defaultBrowserType: _ignored, ...phone } = devices['iPhone 13'];
  const pctx = await browser.newContext({ ...phone, viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, colorScheme: theme });
  await pctx.addInitScript((t) => localStorage.setItem('agent-review:theme', t), theme);
  const ppage = await pctx.newPage();
  await ppage.goto('about:blank');
  await ppage.goto(`${base}#/`, { waitUntil: 'networkidle' });
  const wide = await ppage.evaluate(() => document.documentElement.scrollWidth);
  if (wide > 390) problems.push(`the phone page is ${wide}px wide at 390`);
  await tall(ppage, `7-billing-phone-${theme}.png`, '.studio', 390);
  await pctx.close();
}

await browser.close();
if (problems.length) {
  console.error(`✗ ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log(`✓ written to ${path.relative(process.cwd(), out)}`);
