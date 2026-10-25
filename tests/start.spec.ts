import { expect, test, type Page } from '@playwright/test';

/* The front door (StartScreen, since 2026-10-23). What must stay true:

   1. The address everyone is sent to, "/", is the start screen, and every
      address under it goes where it says: a run's own address is that run,
      with no start in front of it.
   2. Its one button goes to the design cycle, as a new screen: the
      workspace's heading takes focus, and going back finds the start.
   3. The product's name goes back to the start from anywhere. */

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
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('If an agent can build the interface, what does the designer do all day?');
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

test('the way in opens the design cycle, and back finds the start', async ({ page }) => {
  await open(page, '#/');
  await page.getByRole('button', { name: 'Explore a product design cycle' }).click();
  await expect(page).toHaveURL(/#\/cycle\/discover$/);
  await arrived(page, 'Something is wrong with archiving. What, exactly?');

  await page.goBack();
  await expect(page).toHaveURL(/#\/$/);
  await arrived(page, 'If an agent can build the interface, what does the designer do all day?');
});

test('the product’s name goes back to the start', async ({ page }) => {
  await open(page, '#/queue');
  await page.getByRole('link', { name: 'Agent Review, start' }).click();
  await expect(page).toHaveURL(/#\/$/);
  await arrived(page, 'If an agent can build the interface, what does the designer do all day?');
});
