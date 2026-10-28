import { expect, test, type Page } from '@playwright/test';
import { EXPLORED, seedCycle } from './seed';

/* The design cycle (data/cycle.ts, CycleScreen), and since 2026-10-26 the
   front door. What must stay true:

   1. "/" is the cycle's first stage, with no screen in front of it, and the
      bar there offers no other place in the product. A run's own address
      is that run. The product's name goes to the first stage from anywhere.
   2. The cycle is a script: the way on waits for the stage's move (Continue
      in the move; wide, that is the only one, and under 64rem the foot's
      Next as well, since 2026-10-28), the rail links only the stages that
      are open, and an address further on than the reader has come sends
      them to the first open stage.
   3. Each open stage is an address, and back and forward step between them.
   4. The whole cycle can be done from the keyboard, Explore included, and a
      choice made in one stage is what a later stage shows. The choices
      survive a reload; Start over clears them. */

test.use({ viewport: { width: 1280, height: 900 } });
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('agent-review:theme', 'light'));
});

async function open(page: Page, hash: string) {
  await page.goto(hash);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
}

const arrived = (page: Page, heading: string | RegExp) => expect(page.getByRole('heading', { level: 1, name: heading })).toBeFocused();

/* Moves focus to a control by tabbing, never by clicking, and presses it. */
async function press(page: Page, name: string | RegExp, role: 'button' | 'link' = 'button') {
  const target = page.getByRole(role, { name, exact: typeof name === 'string' });
  for (let i = 0; i < 300; i++) {
    if (await target.evaluate((el) => el === document.activeElement).catch(() => false)) {
      await page.keyboard.press('Enter');
      return;
    }
    await page.keyboard.press('Tab');
  }
  throw new Error(`never reached ${name} by Tab`);
}

test('the front door is the first stage, and a run’s own address is the run', async ({ page }) => {
  await open(page, '#/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Something is wrong with archiving. What, exactly?');
  await expect(page).toHaveTitle('Design cycle: Discover · Agent Review');
  await expect(page.locator('.cycle__setup')).toContainText('You’re Adam, a product designer');
  await expect(page.getByRole('navigation', { name: 'Primary' })).toHaveCount(0);

  for (const [hash, title] of [
    ['#/runs/billing', 'Bring the billing screens onto the design system'],
    ['#/runs/shared-table', /.+/],
  ] as const) {
    await open(page, hash);
    await expect(page.locator('.cycle')).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
    await expect(page.getByRole('link', { name: /Delegated work/ })).toHaveAttribute('aria-current', 'page');
  }
});

test('the product’s name goes to the first stage', async ({ page }) => {
  await open(page, '#/queue');
  await page.getByRole('link', { name: 'Agent Review, start of the design cycle' }).click();
  await expect(page).toHaveURL(/#\/cycle\/discover$/);
  await arrived(page, 'Something is wrong with archiving. What, exactly?');
});

test('the way on waits for the move, and a stage further on sends the reader back to the open one', async ({ page }) => {
  await open(page, '#/cycle/discover');
  await expect(page.getByRole('button', { name: /Continue to/ })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Next/ })).toHaveCount(0);
  /* Wide, the foot says nothing about the way on: the move beside the work is it. */
  await expect(page.locator('.cycle__pager-wait')).toBeHidden();
  await expect(page.locator('.cycle__rail a')).toHaveCount(1);

  await open(page, '#/cycle/evaluate');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Which direction, and what has to be true of it?');
  await expect(page.getByText('Start with Discover')).toBeVisible();
  await page.getByRole('button', { name: 'Go to Discover' }).click();
  await expect(page).toHaveURL(/#\/cycle\/discover$/);

  await page.getByRole('button', { name: 'Choose Correct it' }).click();
  await expect(page.locator('.cycle__rail a')).toHaveCount(2);
  await page.getByRole('button', { name: 'Continue to Define' }).click();
  await expect(page).toHaveURL(/#\/cycle\/define$/);
  await arrived(page, 'What are we solving, and what wins when the goals pull apart?');
});

test('under 64rem the foot’s Next is a second way on, and waits with the move', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 900 });
  await open(page, '#/cycle/discover');
  await expect(page.getByRole('link', { name: /Next/ })).toHaveCount(0);
  await expect(page.locator('.cycle__pager-wait')).toHaveText('Define opens after your move');
  await page.getByRole('button', { name: 'Choose Correct it' }).click();
  await expect(page.getByRole('button', { name: 'Continue to Define' })).toBeVisible();
  await page.getByRole('link', { name: /Next Define/ }).click();
  await expect(page).toHaveURL(/#\/cycle\/define$/);
  await arrived(page, 'What are we solving, and what wins when the goals pull apart?');
});

test('an open stage is an address, and back and forward step between them', async ({ page }) => {
  await seedCycle(page, { ...EXPLORED, direction: 'undo' });
  await open(page, '#/cycle/evaluate');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Which direction, and what has to be true of it?');
  await expect(page).toHaveTitle('Design cycle: Evaluate · Agent Review');
  await page.getByRole('button', { name: 'Continue to Delegate' }).click();
  await expect(page).toHaveURL(/#\/cycle\/delegate$/);
  await page.goBack();
  await expect(page).toHaveURL(/#\/cycle\/evaluate$/);
  await expect.poll(() => page.evaluate(() => document.activeElement?.textContent)).toBe('Which direction, and what has to be true of it?');
  await page.goForward();
  await expect(page).toHaveURL(/#\/cycle\/delegate$/);
});

test('the cycle can be done from the keyboard, and its choices survive a reload', async ({ page }) => {
  await open(page, '#/');
  await press(page, 'Choose Correct it');
  await press(page, 'Continue to Define');
  await press(page, 'Choose Nothing leaves without a way back');
  await press(page, 'Continue to Explore');

  /* Explore: the same batch, three ways, every press made from the move
     (since 2026-10-28), which presses the screen's marked control. */
  await press(page, 'Press Archive');
  await expect(page.locator('.cycle__tries li[data-done]')).toHaveCount(1);
  await press(page, /Try direction 2/);
  await press(page, 'Press Archive');
  await expect(page.locator('.cycle__next-mark')).toBeVisible();
  await press(page, 'Press Archive 5 customers');
  await press(page, /Try direction 3/);
  await press(page, 'Press Archive');
  await press(page, 'Press Archive 4 customers');
  await expect(page.locator('.cycle__tries li[data-done]')).toHaveCount(3);
  await press(page, 'Continue to Evaluate');

  await expect(page.locator('.cycle__move-lead')).toContainText('The agent recommends Review batch, then archive');
  await press(page, 'Choose Confirm first, naming who');
  await press(page, 'Continue to Delegate');
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
  await expect(page.getByRole('link', { name: 'How it was made, in the case study' })).toBeVisible();

  await page.getByRole('button', { name: 'Start over' }).click();
  await page.getByRole('button', { name: 'Start over' }).click();
  await expect(page).toHaveURL(/#\/cycle\/discover$/);
  await open(page, '#/cycle/learn');
  await expect(page.getByText('Start with Discover')).toBeVisible();
});
