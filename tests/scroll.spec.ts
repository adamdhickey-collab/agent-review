import { devices, expect, test, type Page } from '@playwright/test';

/* Where the page is when a screen arrives, on a phone. The bar is two rows
   there and nothing is sticky, so a page that arrives a hundred pixels down
   has no bar at all, and the delegated work's run tabs are cut. That is how
   the screens arrived on an iPhone until 2026-10-11: the hash router never
   moved the page, and the heading's focus() moved it only when the heading
   was out of view, which on a phone it usually was not (app/router.ts has
   the account). What must stay true:

   1. A screen opened from its address starts at the top.
   2. A new screen starts at the top, wherever the last one was left, with
      focus on its heading: a change from the queue, the queue from a
      change, the other run from the run tabs.
   3. Selecting a finding on a change is not a new screen, and the page
      stays where it is.
   4. A reload puts the page back where it was.
   5. Back and forward put each screen back where it was left, with focus
      on its heading.
   6. Coming back to the page from somewhere else finds it where it was.

   The viewport is an iPhone 13's with Chrome's bars open, on a touch
   device, so the bar is at its two-row width. The emulation applies to the
   NEXT navigation, so each page starts from a blank one. */

const { defaultBrowserType: _ignored, ...phone } = devices['iPhone 13'];

test.use({ ...phone, viewport: { width: 390, height: 664 }, deviceScaleFactor: 1 });

async function open(page: Page, hash: string) {
  await page.goto('about:blank');
  await page.goto(hash);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
}

/* Scrolls the page and waits for the router to have seen it. */
async function scrollTo(page: Page, y: number) {
  await page.evaluate((y) => window.scrollTo(0, y), y);
  await page.waitForTimeout(100);
}

const where = (page: Page) =>
  page.evaluate(() => {
    const bar = document.querySelector('.shell__bar')!.getBoundingClientRect();
    const h1 = document.querySelector('#main h1');
    return {
      y: Math.round(window.scrollY),
      bar: Math.round(bar.top),
      heading: h1 ? document.activeElement === h1 : false,
    };
  });

const atTheTop = { y: 0, bar: 0 };

/* A screen has arrived when its heading has focus: the route changes in a
   view transition's update, a frame after the hash. */
const arrived = (page: Page, heading: string | RegExp) => expect(page.getByRole('heading', { level: 1, name: heading })).toBeFocused();

test('a screen opened from its address starts at the top', async ({ page }) => {
  for (const hash of ['#/', '#/runs/shared-table', '#/queue', '#/changes/rv-2041']) {
    await open(page, hash);
    expect(await where(page), hash).toMatchObject(atTheTop);
  }
});

test('a new screen starts at the top, wherever the last one was left', async ({ page }) => {
  /* A change, from a queue scrolled far enough to put the bar off-screen. */
  await open(page, '#/queue');
  await scrollTo(page, 120);
  expect(await where(page)).toMatchObject({ y: 120, bar: -120 });
  await page.locator('#main a[href^="#/changes/"]').first().click();
  await expect(page).toHaveURL(/#\/changes\//);
  await arrived(page, 'Add bulk actions to the customer table');
  expect(await where(page)).toEqual({ ...atTheTop, heading: true });

  /* The queue, from the bar's second row on a change scrolled a little. */
  await scrollTo(page, 60);
  await page.getByRole('link', { name: 'Reviews' }).first().click();
  await expect(page).toHaveURL(/#\/queue$/);
  await arrived(page, 'Review queue');
  expect(await where(page)).toEqual({ ...atTheTop, heading: true });

  /* The other run, from the run tabs scrolled up to the top edge. */
  await open(page, '#/');
  const tabs = page.getByRole('navigation', { name: 'Sample runs' });
  const top = await tabs.evaluate((el) => Math.round(el.getBoundingClientRect().top + window.scrollY));
  await scrollTo(page, top - 8);
  expect(await where(page)).toMatchObject({ y: top - 8 });
  const was = (await page.locator('#main h1').textContent())!;
  await tabs.getByRole('link', { name: /Shared table/ }).click();
  await expect(page).toHaveURL(/#\/runs\/shared-table$/);
  await expect(page.locator('#main h1')).not.toHaveText(was);
  await arrived(page, /.+/);
  expect(await where(page)).toEqual({ ...atTheTop, heading: true });
  expect(await tabs.evaluate((el) => el.getBoundingClientRect().top), 'the run tabs are under the bar').toBeGreaterThan(0);
});

test('selecting a finding on a change keeps the page where it is', async ({ page }) => {
  await open(page, '#/changes/rv-2041');
  const finding = page.getByRole('button', { name: /A new interaction pattern/ }).first();
  await finding.scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);
  const before = await where(page);
  expect(before.y).toBeGreaterThan(0);
  await finding.click();
  await expect(page).toHaveURL(/findings\//);
  expect(await where(page)).toMatchObject({ y: before.y, heading: false });
});

test('a reload puts the page back where it was', async ({ page }) => {
  await open(page, '#/');
  await scrollTo(page, 900);
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  expect(await where(page)).toMatchObject({ y: 900 });
});

test('back and forward put each screen back where it was left, with focus on its heading', async ({ page }) => {
  await open(page, '#/queue');
  await scrollTo(page, 200);
  await page.locator('#main a[href^="#/changes/"]').nth(2).click();
  await expect(page).toHaveURL(/#\/changes\//);
  const heading = page.locator('#main h1');
  await expect(heading).not.toHaveText('Review queue');
  const title = (await heading.textContent())!;
  await arrived(page, title);
  await scrollTo(page, 500);

  await page.goBack();
  await expect(page).toHaveURL(/#\/queue$/);
  await arrived(page, 'Review queue');
  expect(await where(page)).toEqual({ y: 200, bar: -200, heading: true });

  await page.goForward();
  await expect(page).toHaveURL(/#\/changes\//);
  await arrived(page, title);
  expect(await where(page)).toEqual({ y: 500, bar: -500, heading: true });
});

test('coming back to the page from somewhere else finds it where it was', async ({ page }) => {
  await open(page, '#/');
  await scrollTo(page, 900);
  await page.goto('about:blank');
  await page.goBack();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  expect(await where(page)).toMatchObject({ y: 900 });
});
