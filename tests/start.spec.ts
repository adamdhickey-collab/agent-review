import { expect, test, type Page } from '@playwright/test';

/* The front door (StartScreen, since 2026-10-23). What must stay true:

   1. The address everyone is sent to, "/", is the start screen, and every
      address under it goes where it says: a run's own address is that run,
      with no start in front of it.
   2. The steps it names are the steps Start here names over the workspace,
      word for word, in the same order.
   3. Its one button goes to the billing run, as a new screen: the
      workspace's heading takes focus, and going back finds the start.
   4. The product's name goes back to the start from anywhere. */

const chooseLight = () => localStorage.setItem('agent-review:theme', 'light');

test.use({ viewport: { width: 1280, height: 900 } });
test.beforeEach(async ({ page }) => {
  await page.addInitScript(chooseLight);
});

async function open(page: Page, hash: string) {
  await page.goto(hash);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
}

const arrived = (page: Page, heading: string | RegExp) => expect(page.getByRole('heading', { level: 1, name: heading })).toBeFocused();

test('the front door is the start, and a run’s own address is the run', async ({ page }) => {
  await open(page, '#/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('A coding agent did most of the work. The rest needs you.');
  await expect(page).toHaveTitle('Start · Agent Review');
  await expect(page.locator('.shell__nav a[aria-current="page"]')).toHaveCount(0);

  for (const [hash, title] of [
    ['#/runs/billing', 'Bring the billing screens onto the design system'],
    ['#/runs/shared-table', /.+/],
  ] as const) {
    await open(page, hash);
    await expect(page.locator('.start')).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
    await expect(page.getByRole('link', { name: /Delegated work/ })).toHaveAttribute('aria-current', 'page');
  }
});

test('the start names the steps Start here names, in its order', async ({ page }) => {
  await open(page, '#/');
  const named = await page.locator('.start__steps strong').allTextContents();
  await open(page, '#/runs/billing');
  const steps = await page.locator('.studio__start-step .btn__label').allTextContents();
  expect(named.map((s) => s.replace(/\.$/, ''))).toEqual(steps.map((s) => s.replace(/^\d/, '').trim()));
  expect(named).toHaveLength(4);
});

test('Start the review opens the billing run, and back finds the start', async ({ page }) => {
  await open(page, '#/');
  await page.getByRole('button', { name: 'Start the review' }).click();
  await expect(page).toHaveURL(/#\/runs\/billing$/);
  await arrived(page, 'Bring the billing screens onto the design system');

  await page.goBack();
  await expect(page).toHaveURL(/#\/$/);
  await arrived(page, 'A coding agent did most of the work. The rest needs you.');
});

test('the product’s name goes back to the start', async ({ page }) => {
  await open(page, '#/queue');
  await page.getByRole('link', { name: 'Agent Review, start' }).click();
  await expect(page).toHaveURL(/#\/$/);
  await arrived(page, 'A coding agent did most of the work. The rest needs you.');
});
