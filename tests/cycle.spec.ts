import { expect, test, type Page } from '@playwright/test';

/* The design cycle (data/cycle.ts, CycleScreen). What must stay true:

   1. Each stage is an address: a link straight to one opens it, and back
      and forward step between them.
   2. The choices survive a reload, because a stage is an address and a
      reload of one should find the choices made on the way; Start over
      clears them.
   3. The whole cycle can be done from the keyboard, and a choice made in
      one stage is what a later stage shows. */

test.use({ viewport: { width: 1280, height: 900 } });
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('agent-review:theme', 'light'));
});

async function open(page: Page, hash: string) {
  await page.goto(hash);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
}

/* Moves focus to a control by tabbing, never by clicking, and presses it. */
async function press(page: Page, name: string | RegExp) {
  const target = page.getByRole('button', { name, exact: typeof name === 'string' });
  for (let i = 0; i < 200; i++) {
    if (await target.evaluate((el) => el === document.activeElement).catch(() => false)) {
      await page.keyboard.press('Enter');
      return;
    }
    await page.keyboard.press('Tab');
  }
  throw new Error(`never reached ${name} by Tab`);
}

test('a stage is an address, and back and forward step between them', async ({ page }) => {
  await open(page, '#/cycle/evaluate');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Which direction, and what has to be true of it?');
  await expect(page).toHaveTitle('Design cycle: Evaluate · Agent Review');
  await page.getByRole('link', { name: /Next Delegate/ }).click();
  await expect(page).toHaveURL(/#\/cycle\/delegate$/);
  await page.goBack();
  await expect(page).toHaveURL(/#\/cycle\/evaluate$/);
  await expect.poll(() => page.evaluate(() => document.activeElement?.textContent)).toBe('Which direction, and what has to be true of it?');
  await page.goForward();
  await expect(page).toHaveURL(/#\/cycle\/delegate$/);
});

test('the cycle can be done from the keyboard, and its choices survive a reload', async ({ page }) => {
  await open(page, '#/cycle/discover');
  await press(page, 'Choose Correct it');
  await open(page, '#/cycle/define');
  await press(page, 'Choose Nothing leaves without a way back');
  await open(page, '#/cycle/evaluate');
  await expect(page.locator('.cycle__move-lead')).toContainText('The agent recommends Review the batch, then archive');
  await press(page, 'Choose Confirm first, naming who');
  await open(page, '#/cycle/delegate');
  await press(page, 'Send the brief');
  await expect(page.getByText('Needs judgment')).toBeVisible();
  await press(page, 'Choose Status is Active');
  await expect(page.locator('.archive-flow')).toBeVisible();

  await page.reload();
  await page.waitForTimeout(150);
  await expect(page.locator('.archive-flow')).toBeVisible();
  await open(page, '#/cycle/learn');
  await expect(page.locator('.cycle__facts--record')).toContainText('Confirm first, naming who.');
  await expect(page.locator('.cycle__list--open')).toContainText('Whether people read the question by the third batch.');

  await page.getByRole('button', { name: 'Start over' }).click();
  await page.getByRole('button', { name: 'Start over' }).click();
  await expect(page).toHaveURL(/#\/cycle\/discover$/);
  await open(page, '#/cycle/learn');
  await expect(page.getByText('Nothing’s been built yet')).toBeVisible();
});
