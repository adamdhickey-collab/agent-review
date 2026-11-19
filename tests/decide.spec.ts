import { expect, test, type Page } from '@playwright/test';

/* The short path (review/DecideScreen, data/decide.ts), the front door
   since 2026-11-18. What must stay true:

   1. "/" is the short path: one question, three beats, the agent's plan
      working on two batches, and the cycle one link away.
   2. The plan reviews every batch: a routine cleanup opens a review with
      nobody to name, and with Northside in it the review names Northside,
      and clearing its box archives the other two.
   3. The answer writes the rule and the build: only when someone's active,
      a routine cleanup archives in one press with Undo, and Northside still
      stops it. The answer survives a reload, and Start over clears it.
   4. The whole cycle opens on the brief with the answer in it.
   5. All of it from the keyboard. */

test.use({ viewport: { width: 1280, height: 900 } });
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('agent-review:theme', 'light'));
});

const beat = (page: Page, name: string) => page.getByRole('region', { name });
const plan = (page: Page) => beat(page, 'Decide when to pause');
const forward = (page: Page) => beat(page, 'What the agent takes forward');
const archive = (scope: ReturnType<Page['getByRole']>) => scope.getByRole('button', { name: 'Archive', exact: true });

async function open(page: Page, hash: string) {
  await page.goto(hash);
  await page.evaluate(() => document.fonts.ready);
}

test('the front door is the short path, with the cycle one link away', async ({ page }) => {
  await open(page, '#/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('When should Archive stop and ask?');
  await expect(page).toHaveTitle('When should Archive stop and ask? · Agent Review');
  await expect(page.getByRole('navigation', { name: 'Primary' })).toHaveCount(0);
  for (const name of ['What went wrong', 'Decide when to pause', 'What the agent takes forward']) await expect(beat(page, name)).toBeVisible();
  await expect(page.getByText('Simulated', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'The whole cycle, six stages' }).click();
  await expect(page).toHaveURL(/#\/cycle\/discover$/);
});

test('the agent’s plan reviews every batch, and clearing Northside archives the other two', async ({ page }) => {
  await open(page, '#/');
  await archive(plan(page)).click();
  await expect(plan(page).getByRole('heading', { name: 'Review 2 customers before archiving' })).toBeVisible();
  await expect(plan(page).getByRole('checkbox', { name: /^Northside Trucking, / })).toHaveCount(0);

  await plan(page).getByRole('radio', { name: 'Add Northside' }).click();
  await archive(plan(page)).click();
  const keep = plan(page).getByRole('checkbox', { name: /^Northside Trucking, / });
  await expect(keep).toBeChecked();
  await expect(plan(page).getByRole('button', { name: 'Archive 3 customers' })).toBeVisible();
  await keep.uncheck();
  await plan(page).getByRole('button', { name: 'Archive 2 customers' }).click();
  await expect(plan(page).locator('.archive-flow__result')).toHaveText('2 customers archived.');
  await expect(plan(page).getByRole('row', { name: /Northside Trucking/ })).toBeVisible();
});

test('the answer writes the rule and the build, survives a reload, and Start over clears it', async ({ page }) => {
  await open(page, '#/');
  await expect(forward(page).getByText('Your rule appears here')).toBeVisible();
  await plan(page).getByRole('button', { name: /Choose Only when someone’s active/ }).click();
  await expect(forward(page).locator('.cycle__rule')).toHaveText('A bulk action that removes records stops only when the batch holds a record at risk, and names those records.');

  await archive(forward(page)).click();
  await expect(forward(page).locator('.archive-flow__result')).toHaveText('2 customers archived.');
  await expect(forward(page).getByRole('button', { name: 'Undo' })).toBeVisible();
  await forward(page).getByRole('radio', { name: 'Add Northside' }).click();
  await archive(forward(page)).click();
  await expect(forward(page).getByRole('checkbox', { name: /^Northside Trucking, / })).toBeChecked();

  await page.reload();
  await page.evaluate(() => document.fonts.ready);
  await expect(plan(page).getByRole('button', { name: /Chosen Only when someone’s active/ })).toBeVisible();
  await page.getByRole('button', { name: 'Start over' }).click();
  await expect(forward(page).getByText('Your rule appears here')).toBeVisible();

  await plan(page).getByRole('button', { name: /Choose On every batch/ }).click();
  await expect(forward(page).locator('.cycle__rule')).toHaveText('A bulk action that removes records names the records at risk before the press.');
});

test('the whole cycle opens on the brief, with the answer in it', async ({ page }) => {
  await open(page, '#/');
  await plan(page).getByRole('button', { name: /Choose Only when someone’s active/ }).click();
  await forward(page).getByRole('button', { name: 'See the brief and the agent’s question' }).click();
  await expect(page).toHaveURL(/#\/cycle\/delegate$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('What does the agent need from you while it builds?');
  await expect(page.locator('.cycle__brief')).toContainText('Review only when someone’s active');
  await expect(page.getByRole('button', { name: /Choose Build from existing parts/ })).toBeVisible();
});

test('the short path can be done from the keyboard', async ({ page }) => {
  await open(page, '#/');
  const reach = async (name: string | RegExp) => {
    const target = page.getByRole('button', { name, exact: typeof name === 'string' }).first();
    for (let i = 0; i < 120; i++) {
      if (await target.evaluate((el) => el === document.activeElement).catch(() => false)) return page.keyboard.press('Enter');
      await page.keyboard.press('Tab');
    }
    throw new Error(`never reached ${name} by Tab`);
  };
  await reach('Archive');
  await expect(plan(page).getByRole('heading', { name: 'Review 2 customers before archiving' })).toBeVisible();
  await reach(/Choose Only when someone’s active/);
  await expect(forward(page).locator('.cycle__rule')).toBeVisible();
  await reach('See the brief and the agent’s question');
  await expect(page).toHaveURL(/#\/cycle\/delegate$/);
});
