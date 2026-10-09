import { expect, test, type Page } from '@playwright/test';

/* The reading size on a desktop (app/scale.css). Not a screenshot: what must
   stay true once the whole page is drawn larger, measured on the real
   screens.

   1. Each step starts where tokens.css says and nowhere else: 1 up to
      1295px, the first step from 1296, the second from 1440, and 1 on a
      touch screen at any width.
   2. Nothing is wider than the window, and the queue, which is shorter than
      the window, does not scroll. A zoomed root zooms viewport units too,
      and before they were divided by the step, 100vh made every page a
      quarter of a screen taller than the screen at the second step.
   3. The preview fits its column without panning, and the finding's mark
      sits on the element it names. The mark is placed from measured boxes
      (mark.ts), so this is the check that the measuring agrees with the
      page's own zoom. */

const STEPS: [number, string][] = [
  [1280, '1'],
  [1295, '1'],
  [1296, '1.125'],
  [1439, '1.125'],
  [1440, '1.25'],
  [1920, '1.25'],
];

async function open(page: Page, hash: string) {
  await page.goto(hash);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
}

const zoom = (page: Page) => page.evaluate(() => getComputedStyle(document.documentElement).zoom);

for (const [width, step] of STEPS) {
  test.describe(`at ${width}`, () => {
    test.use({ viewport: { width, height: 900 } });

    test(`the page is drawn at ${step}`, async ({ page }) => {
      await open(page, '#/');
      expect(await zoom(page)).toBe(step);
    });
  });
}

test.describe('on a touch screen at 1440', () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: true });

  test('the page is drawn at 1', async ({ page }) => {
    /* A touch context applies its emulation to the next navigation. */
    await page.goto('about:blank');
    await open(page, '#/');
    expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches), 'the touch styles are on').toBe(true);
    expect(await zoom(page)).toBe('1');
  });
});

for (const width of [1296, 1440]) {
  test.describe(`at ${width}, drawn larger`, () => {
    test.use({ viewport: { width, height: 900 } });

    const SCREENS: [string, string][] = [
      ['the delegated work', '#/'],
      ['the shared-table run', '#/runs/shared-table'],
      ['the queue', '#/queue'],
      ['a change, with a finding open', '#/changes/rv-2041/findings/f1-shared-table'],
    ];

    for (const [name, hash] of SCREENS) {
      test(`${name} is no wider than the window`, async ({ page }) => {
        await open(page, hash);
        const wide = await page.evaluate(() => document.documentElement.scrollWidth);
        expect(wide, `the page is ${wide}px wide in a ${width}px window`).toBeLessThanOrEqual(width);
      });
    }

    test('the queue does not scroll', async ({ page }) => {
      await open(page, '#/queue');
      const tall = await page.evaluate(() => document.documentElement.scrollHeight);
      expect(tall, `the queue is ${tall}px tall in a 900px window`).toBeLessThanOrEqual(900);
    });

    test('the preview fits its column, and the mark is on its element', async ({ page }) => {
      await open(page, '#/changes/rv-2041/findings/f1-visual');
      await expect(page.locator('.preview__column[role="region"]'), 'the preview pans').toHaveCount(0);
      const off = await page.evaluate(() => {
        const mark = document.querySelector<HTMLElement>('.preview__mark');
        const el = document.querySelector('.preview__frame [data-finding="bulk-bar"]');
        if (!mark || mark.hidden || !el) return null;
        const a = mark.getBoundingClientRect();
        const b = el.getBoundingClientRect();
        return Math.max(Math.abs(a.left - b.left), Math.abs(a.top - b.top), Math.abs(a.right - b.right), Math.abs(a.bottom - b.bottom));
      });
      expect(off, 'the mark is drawn').not.toBeNull();
      expect(off!, `the mark is ${off}px off its element`).toBeLessThanOrEqual(0.5);
    });
  });
}
