import { expect, test, type Page } from '@playwright/test';
import { FRAMED, seedCycle } from './seed';

/* The quick path (review/QuickScreen, since 2026-11-22): the three working
   fixes, the decision, and About. Its start screen was the front door for
   a day; since 2026-11-23 the front door is Discover, which offers the
   path in one line. What must stay true:

   1. A fresh session opens on the cycle's first stage, with the tour and
      the shortcuts, and Compare the three fixes goes straight to a working
      screen with no stage rail and no demo role.
   2. Each of the three fixes is an address, works when opened directly and
      after a reload, and can be operated: Undo puts the batch back, Cancel
      keeps the selection, the review keeps a customer out.
   3. The decision asks only when the selection holds an active customer,
      and the other condition is an address too.
   4. None of it reads or writes the design cycle: progress made there is as
      it was left, a fresh visitor has decided nothing, and the six stages
      and their addresses still open.
   5. It works from the keyboard, and focus goes to each new screen's heading.
   6. The experiment's record, the Storybook, the source and the walkthrough
      are all still reachable. */

test.use({ viewport: { width: 1280, height: 900 } });
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('agent-review:theme', 'light'));
});

async function open(page: Page, hash: string) {
  await page.goto(hash);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
}

const h1 = (page: Page) => page.getByRole('heading', { level: 1 });
const arrived = (page: Page, heading: string | RegExp) => expect(page.getByRole('heading', { level: 1, name: heading })).toBeFocused();
const product = (page: Page) => page.locator('.cycle__product-frame');
const last = (page: Page) => page.getByRole('toolbar', { name: 'Last action' });
const selected = (page: Page) => page.getByRole('toolbar', { name: 'Selected customers' });
const cycleKept = (page: Page) => page.evaluate(() => JSON.parse(sessionStorage.getItem('agent-review:cycle') ?? 'null'));

test('a fresh session opens on the first stage, and its shortcut opens a working fix', async ({ page }) => {
  await open(page, './');
  await expect(h1(page)).toHaveText('Something is wrong with archiving. What, exactly?');
  await expect(page.locator('.cycle__rail')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Watch the tour' }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'see the decision Adam made' })).toHaveAttribute('href', '#/decision');

  await page.getByRole('link', { name: 'Compare the three fixes' }).click();
  await expect(page).toHaveURL(/#\/compare$/);
  await arrived(page, 'Three fixes, each a working screen.');
  await expect(page.locator('.cycle__rail')).toHaveCount(0);
  await expect(page.getByText('Demo role')).toHaveCount(0);
  await expect(page.getByRole('tab', { name: 'Undo afterward' })).toHaveAttribute('aria-selected', 'true');
  await expect(selected(page)).toContainText('3 of 8 customers selected');
  await expect(product(page).getByRole('button', { name: 'Archive', exact: true })).toBeVisible();
});

test('each fix is an address that survives a reload, and each one works', async ({ page }) => {
  /* Undo afterward: at once, and back again. */
  await open(page, '#/compare/undo');
  await product(page).getByRole('button', { name: 'Archive', exact: true }).click();
  await expect(last(page)).toContainText('3 of 8 customers archived.');
  await expect(page.locator('.archive-flow__row--archived')).toHaveCount(3);
  await last(page).getByRole('button', { name: 'Undo' }).click();
  await expect(last(page)).toHaveCount(0);
  await expect(page.locator('.archive-flow__row--archived')).toHaveCount(0);

  /* Confirm first: names the active customer; Cancel keeps the selection; the second press archives. */
  await open(page, '#/compare/confirm');
  await page.reload();
  await expect(page.getByRole('tab', { name: 'Confirm first' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByText('Names the risk. Adds a confirmation to every cleanup.')).toBeVisible();
  await product(page).getByRole('button', { name: 'Archive', exact: true }).click();
  const ask = page.getByRole('alertdialog');
  await expect(ask).toContainText('1 is active: Northside Trucking.');
  await ask.getByRole('button', { name: 'Cancel' }).click();
  await expect(ask).toHaveCount(0);
  await expect(selected(page)).toContainText('3 of 8 customers selected');
  await product(page).getByRole('button', { name: 'Archive', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(ask).toHaveCount(0);
  await product(page).getByRole('button', { name: 'Archive', exact: true }).click();
  await ask.getByRole('button', { name: 'Archive 3 customers' }).click();
  await expect(last(page)).toContainText('3 of 8 customers archived.');

  /* Review the batch: the selection can be adjusted before anything leaves. */
  await open(page, '#/compare/review');
  await product(page).getByRole('button', { name: 'Archive', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Review 3 customers before archiving' })).toBeVisible();
  await page.getByText('Northside Trucking, $5,040 a month').click();
  await page.getByRole('button', { name: 'Archive 2 customers' }).click();
  await expect(last(page)).toContainText('2 of 8 customers archived.');
  await expect(page.getByRole('rowheader', { name: 'Northside Trucking' })).toBeVisible();

  /* A selection changed by hand is the selection that is archived. */
  await page.getByRole('button', { name: 'Reset this screen' }).click();
  await page.getByRole('checkbox', { name: 'Select Northside Trucking' }).uncheck({ force: true });
  await expect(selected(page)).toContainText('2 of 8 customers selected');

  /* The framing, and the way on. */
  await expect(page.getByText('All three passed the automated checks.')).toBeVisible();
  await page.getByRole('button', { name: 'See my design decision' }).click();
  await arrived(page, 'Ask for review when an active customer is included.');
});

test('the decision asks only when an active customer is selected', async ({ page }) => {
  await open(page, '#/decision');
  await expect(page.getByText('Pause and name the customer before archiving.')).toBeVisible();
  await expect(page.getByText('Archive immediately, with Undo.')).toBeVisible();
  await product(page).getByRole('button', { name: 'Archive', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Review 3 customers before archiving' })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: /Northside Trucking, \$5,040 a month/ })).toBeChecked();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: /before archiving/ })).toHaveCount(0);
  await expect(selected(page)).toContainText('3 of 8 customers selected');

  await page.getByRole('radio', { name: 'No active customers' }).click();
  await expect(page).toHaveURL(/#\/decision\/routine$/);
  await page.reload();
  await expect(page.getByRole('radio', { name: 'No active customers' })).toHaveAttribute('aria-checked', 'true');
  await product(page).getByRole('button', { name: 'Archive', exact: true }).click();
  await expect(page.getByRole('heading', { name: /before archiving/ })).toHaveCount(0);
  await expect(last(page)).toContainText('3 of 8 customers archived.');
  await last(page).getByRole('button', { name: 'Undo' }).click();
  await expect(page.locator('.archive-flow__row--archived')).toHaveCount(0);

  /* Said as a hypothesis, with what archiving is and what the prototype lacks. */
  await expect(page.getByText('Design hypothesis')).toBeVisible();
  await expect(page.getByText(/nobody has used this with account managers/)).toBeVisible();
  await expect(page.getByText(/Relay keeps it for 90 days/)).toBeVisible();
  await expect(page.getByText(/this prototype has no restore screen/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'That decision becomes a rule for the next build.' })).toBeVisible();
});

test('the quick path leaves the design cycle as it was, in both directions', async ({ page }) => {
  /* A fresh visitor: using every quick screen decides nothing in the cycle. */
  await open(page, '#/compare/confirm');
  await product(page).getByRole('button', { name: 'Archive', exact: true }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Archive 3 customers' }).click();
  await open(page, '#/decision');
  await page.getByText('Save the rule for customer screens (simulated)').click();
  await expect(page.getByText('Follows the rule')).toBeVisible();
  const fresh = await cycleKept(page);
  expect(fresh.reading).toBeNull();
  expect(fresh.direction).toBeNull();
  expect(fresh.trials).toEqual({ undo: [], confirm: [], review: [] });
  expect(fresh.kept).toBe(false);
  await open(page, '#/cycle/evaluate');
  await expect(page.getByText('Start with Discover')).toBeVisible();
});

test('progress in the cycle survives a visit to the quick path, and the stages still open', async ({ page }) => {
  await seedCycle(page, FRAMED);
  await open(page, '#/cycle/explore');
  await expect(h1(page)).toHaveText('Three ways to archive. Try each one.');
  await open(page, '#/compare');
  await product(page).getByRole('button', { name: 'Archive', exact: true }).click();
  await page.getByRole('button', { name: 'See my design decision' }).click();
  await page.getByRole('button', { name: 'Explore the full design process' }).click();
  await expect(page).toHaveURL(/#\/cycle\/discover$/);
  const kept = await cycleKept(page);
  expect(kept).toMatchObject({ reading: 'correct', priority: 'recovery', direction: null, trials: { undo: [], confirm: [], review: [] } });
  await expect(page.locator('.cycle__rail a')).toHaveCount(3);
  for (const [hash, title] of [
    ['#/cycle', 'Something is wrong with archiving. What, exactly?'],
    ['#/cycle/define', 'What problem are we solving?'],
    ['#/decide', 'Something is wrong with archiving. What, exactly?'],
  ] as const) {
    await open(page, hash);
    await expect(h1(page)).toHaveText(title);
  }
  await open(page, '#/cycle/discover');
  await expect(page.getByText('Demo role')).toBeVisible();
});

test('the quick path works from the keyboard', async ({ page }) => {
  await open(page, '#/');
  const short = page.getByRole('link', { name: 'Compare the three fixes' });
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press('Tab');
    if (await short.evaluate((el) => el === document.activeElement)) break;
  }
  await expect(short).toBeFocused();
  await page.keyboard.press('Enter');
  await arrived(page, 'Three fixes, each a working screen.');

  /* The fixes are one tab stop; the arrows move between them and the address follows without moving focus to the heading. */
  await page.getByRole('tab', { name: 'Undo afterward' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(/#\/compare\/confirm$/);
  await expect(page.getByRole('tab', { name: 'Confirm first' })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(/#\/compare\/review$/);
  await expect(page.getByRole('tab', { name: 'Review the batch' })).toBeFocused();

  /* The review takes focus when it opens, and Escape gives the selection back. */
  await product(page).getByRole('button', { name: 'Archive', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Archive 3 customers' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('checkbox', { name: 'Select all customers' })).toBeFocused();
});

test('the experiment, the catalog, the source and the walkthrough are still reachable', async ({ page }) => {
  await open(page, '#/compare');
  await page.getByRole('link', { name: 'About the experiment' }).click();
  await arrived(page, 'About the experiment');
  await expect(page.getByRole('link', { name: 'About the experiment' })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('region', { name: 'What the experiment showed' }).getByRole('heading', { level: 3 })).toHaveCount(3);
  await expect(page.getByText(/That third version is a test fixture, not a fix\./)).toBeVisible();
  await expect(page.getByRole('link', { name: /The full experiment record/ })).toHaveAttribute('href', /docs\/experiment\/README\.md$/);
  await expect(page.getByRole('link', { name: /The faulty fixture, written by hand/ })).toHaveAttribute('href', /seeded-drift\.md$/);
  await expect(page.getByRole('link', { name: /The component catalog, in Storybook/ })).toHaveAttribute('href', 'storybook/');
  await expect(page.getByRole('link', { name: /The source, on GitHub/ })).toHaveAttribute('href', 'https://github.com/adamdhickey-collab/agent-review');
  await expect(page.getByRole('link', { name: 'All three versions in the review queue' })).toHaveAttribute('href', '#/queue');

  await open(page, '#/');
  await page.getByRole('button', { name: 'Watch the tour' }).first().click();
  await expect(page.getByRole('region', { name: 'Guided tour' })).toContainText('Step 1 of 18');
  await expect(page).toHaveURL(/#\/cycle\/discover$/);
});
