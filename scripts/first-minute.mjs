#!/usr/bin/env node
/* The delegated work's first minute, measured on a production build served
   under /agent-review/ (docs/first-minute/README.md): where the question and
   the first "Select and preview" are, what in the preview can be tabbed to
   and does nothing, how many presses of Tab reach the first direction,
   whether the proposed interface is in view with Apply, and what follows the
   first answer. At 1440x900 and 1440x800 with a mouse, and 375x812 on a
   touch phone. Prints JSON; writes screenshots.

     npm run build
     node scripts/first-minute.mjs after dist 5194 /tmp/first-minute

   A tree from before the change is measured the same way, from its own
   build (git archive origin/main into a folder, node_modules beside it). */

import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium, devices } from '@playwright/test';

const [, , label, dist, port, shots] = process.argv;

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp' };
const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/agent-review/, '') || '/';
  const file = join(dist, path.endsWith('/') ? `${path}index.html` : path);
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end();
  }
}).listen(Number(port));
const base = `http://localhost:${port}/agent-review/`;
await mkdir(shots, { recursive: true });

const { defaultBrowserType: _d, ...iphone } = devices['iPhone 13'];
const sizes = [
  { name: 'desktop-1440x900', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 } },
  { name: 'desktop-1440x800', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 800 }, deviceScaleFactor: 1 } },
  { name: 'phone-375x812', use: { ...iphone, viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 } },
];

const browser = await chromium.launch();
const out = {};
for (const size of sizes) {
  const context = await browser.newContext(size.use);
  const page = await context.newPage();
  await page.goto('about:blank');
  await page.goto(`${base}#/`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);

  const first = await page.evaluate(() => {
    const box = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return [Math.round(r.top + scrollY), Math.round(r.bottom + scrollY)];
    };
    const selects = [...document.querySelectorAll('button')].filter((b) => /Select and preview/.test(b.textContent));
    const frame = document.querySelector('.studio-preview__frame');
    const dead = frame ? [...frame.querySelectorAll('.sketch button, .sketch a')].filter((e) => e.tabIndex >= 0) : [];
    return {
      innerHeight,
      zoom: getComputedStyle(document.documentElement).zoom,
      question: box(document.querySelector('.ask__title')),
      selects: selects.map(box),
      firstSelectOnFirstScreen: selects[0] ? selects[0].getBoundingClientRect().bottom <= innerHeight : false,
      deadControlsInPreview: dead.map((e) => e.textContent.trim()),
      page: document.documentElement.scrollHeight,
    };
  });
  await page.screenshot({ path: join(shots, `${label}-${size.name}-first.png`) });

  // Tab presses from the top of the page to the first Select and preview.
  let tabs = null;
  if (!size.name.startsWith('phone')) {
    await page.evaluate(() => {
      document.activeElement?.blur();
      scrollTo(0, 0);
    });
    for (let i = 1; i <= 80; i++) {
      await page.keyboard.press('Tab');
      const at = await page.evaluate(() => document.activeElement?.textContent ?? '');
      if (/Select and preview/.test(at)) {
        tabs = i;
        break;
      }
    }
    await page.evaluate(() => scrollTo(0, 0));
  }

  // Select the recommended direction: is the proposed interface in view with Apply?
  await page.getByRole('button', { name: /^Select and preview\s+Add a quiet variant$/ }).click();
  await page.waitForTimeout(600);
  const selected = await page.evaluate(() => {
    const seen = (el) => {
      if (!el) return 0;
      const r = el.getBoundingClientRect();
      const v = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
      return Math.round((v / r.height) * 100);
    };
    const apply = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Apply');
    const frame = document.querySelector('.studio-preview__frame');
    return { applyInView: seen(apply) === 100, previewFrameInViewPercent: seen(frame) };
  });
  await page.screenshot({ path: join(shots, `${label}-${size.name}-selected.png`) });

  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await page.waitForTimeout(600);
  const applied = await page.evaluate(() => ({
    lead: document.querySelector('.outcome__lead')?.textContent.trim(),
    focus: document.activeElement?.textContent.trim().slice(0, 40),
    ending: Boolean(document.querySelector('.studio-end')),
  }));
  await page.screenshot({ path: join(shots, `${label}-${size.name}-applied.png`) });

  out[size.name] = { ...first, tabsToFirstSelect: tabs, selected, applied };
  await context.close();
}
await browser.close();
server.close();
console.log(JSON.stringify({ label, ...out }, null, 1));
