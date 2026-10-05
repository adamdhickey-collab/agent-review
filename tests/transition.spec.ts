import { expect, test, type Page } from '@playwright/test';

/* Moving between screens. Where the browser has view transitions, the
   router asks for one when the SCREEN changes and only then: opening a
   change from the queue is a new screen, selecting a finding on it is not.
   A reader who asked for reduced motion is never given one. The transition
   is an enhancement, so what is asserted is when it is asked for, and that
   the screen arrives either way with focus on its heading. */

async function count(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as { __transitions: number };
    w.__transitions = 0;
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    const original = doc.startViewTransition?.bind(document);
    if (original) {
      doc.startViewTransition = (cb) => {
        w.__transitions += 1;
        return original(cb);
      };
    }
  });
}
const transitions = (page: Page) => page.evaluate(() => (window as unknown as { __transitions: number }).__transitions);

test.use({ viewport: { width: 1280, height: 900 } });

test('opening a change from the queue is a transition; selecting a finding is not', async ({ page }) => {
  await page.goto('#/queue');
  await count(page);
  await page.getByRole('link', { name: 'Add bulk actions to the customer table', exact: true }).click();
  const title = page.getByRole('heading', { level: 1, name: 'Add bulk actions to the customer table' });
  await expect(title).toBeFocused();
  expect(await transitions(page)).toBe(1);

  await page.getByRole('button', { name: /A new interaction pattern/ }).first().click();
  await expect(page).toHaveURL(/findings\//);
  expect(await transitions(page)).toBe(1);

  await page.getByRole('link', { name: 'Reviews' }).first().click();
  await expect(page.getByRole('heading', { level: 1, name: 'Review queue' })).toBeFocused();
  expect(await transitions(page)).toBe(2);
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('the screen changes with no transition', async ({ page }) => {
    await page.goto('#/queue');
    await count(page);
    await page.getByRole('link', { name: 'Add bulk actions to the customer table', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Add bulk actions to the customer table' })).toBeFocused();
    expect(await transitions(page)).toBe(0);
  });
});
