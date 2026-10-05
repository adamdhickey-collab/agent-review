import { expect, test } from '@playwright/test';

/* The keyboard layer, with real key presses (app/shortcuts.ts has the rules).
   The stories cover each piece with synthetic events; these are the things
   only a browser's own keyboard shows: that Escape closes the browser's
   dialog and focus comes back, that a question mark typed into a message is
   a question mark, and that no key decides anything. */

test.use({ viewport: { width: 1280, height: 900 } });

const sheet = (page: import('@playwright/test').Page) => page.getByRole('dialog', { name: 'Keyboard shortcuts' });

test('a question mark opens the list, Escape closes it, and focus returns', async ({ page }) => {
  await page.goto('#/queue');
  const first = page.getByRole('link', { name: 'Add bulk actions to the customer table', exact: true });
  await first.focus();
  await page.keyboard.press('Shift+Slash');
  await expect(sheet(page)).toBeVisible();
  /* The page behind a modal dialog is inert: Tab stays in the sheet. */
  await page.keyboard.press('Tab');
  await expect(sheet(page).locator(':focus')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(sheet(page)).toBeHidden();
  await expect(first).toBeFocused();
});

test('J and K move between the rows of the queue, and only move', async ({ page }) => {
  await page.goto('#/queue');
  const links = page.locator('.review-row__title');
  await links.nth(0).focus();
  await page.keyboard.press('j');
  await expect(links.nth(1)).toBeFocused();
  await page.keyboard.press('j');
  await expect(links.nth(2)).toBeFocused();
  await page.keyboard.press('k');
  await expect(links.nth(1)).toBeFocused();
  await expect(page).toHaveURL(/#\/queue$/);
});

test('a question mark typed into the message to the agent is a question mark', async ({ page }) => {
  await page.goto('#/changes/rv-2043');
  await page.getByRole('button', { name: 'Return to agent' }).click();
  const dialog = page.getByRole('dialog', { name: /Return/ });
  await dialog.waitFor();
  const message = dialog.getByRole('textbox');
  await message.focus();
  await page.keyboard.type('Why? jk ');
  await expect(message).toHaveValue(/Why\? jk /);
  await expect(sheet(page)).toBeHidden();
  /* Nor from a button inside that dialog: one thing in front of a person at a time. */
  await dialog.getByRole('button').first().focus();
  await page.keyboard.press('Shift+Slash');
  await expect(sheet(page)).toBeHidden();
});

test('no key decides: the letters a person might guess do nothing on a change', async ({ page }) => {
  await page.goto('#/changes/rv-2041');
  await page.getByRole('heading', { level: 1 }).focus();
  for (const key of ['a', 'r', 'y', 'n', 'Enter']) await page.keyboard.press(key);
  await expect(page.getByRole('button', { name: 'Accept' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reject' })).toBeVisible();
  /* Still undecided, still on the same screen, and nothing opened. */
  await expect(page.locator('.decision--made')).toHaveCount(0);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page).toHaveURL(/#\/changes\/rv-2041$/);
});

test('switched off, the question mark and J do nothing, the arrows and the button still work', async ({ page }) => {
  await page.goto('#/queue');
  await page.getByRole('button', { name: 'Keyboard shortcuts' }).click();
  await sheet(page).getByText(/Single-key shortcuts/).click();
  await page.keyboard.press('Escape');
  await expect(sheet(page)).toBeHidden();

  const links = page.locator('.review-row__title');
  await links.nth(0).focus();
  await page.keyboard.press('Shift+Slash');
  await expect(sheet(page)).toBeHidden();
  await page.keyboard.press('j');
  await expect(links.nth(0)).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(links.nth(1)).toBeFocused();

  /* Remembered across a reload, and the button says nothing about a key. */
  await page.reload();
  await expect(page.getByRole('button', { name: 'Keyboard shortcuts' })).not.toHaveAttribute('aria-keyshortcuts');
});
