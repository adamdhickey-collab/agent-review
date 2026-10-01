import { expect, test, type Page } from '@playwright/test';

/* The screens, at two widths, against their baselines. Each screenshot is
   the full page so a change below the fold counts. The product screens
   are rendered on their own through the preview route so the baseline is
   the screen, not the review around it. */

const WIDTHS = [1280, 768] as const;

async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(100);
}

for (const width of WIDTHS) {
  test.describe(`at ${width}`, () => {
    test.use({ viewport: { width, height: 900 } });

    test('the review queue', async ({ page }) => {
      await page.goto('#/');
      await settle(page);
      await expect(page).toHaveScreenshot(`queue-${width}.png`, { fullPage: true });
    });

    test('the change, with the first finding open', async ({ page }) => {
      await page.goto('#/changes/rv-2041/findings/f1-shared-table');
      await settle(page);
      await expect(page).toHaveScreenshot(`change-${width}.png`, { fullPage: true });
    });
  });
}

test.describe('the product screens', () => {
  for (const width of WIDTHS) {
    test(`customers, before, at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('#/changes/rv-2041');
      await settle(page);
      await page.getByRole('radio', { name: 'Before' }).click();
      await page.getByRole('radio', { name: `${width === 768 ? 'Tablet' : 'Desktop'}, ${width}` }).click();
      const frame = page.locator('.preview__frame');
      await expect(frame).toHaveScreenshot(`customers-before-${width}.png`);
    });
  }
});

/* Rule 7: a toolbar over a table wraps rather than overflows. Measured on
   the real screen at 768, on every toolbar in the frame: each one's
   content must fit its own box. The frame's scroll width is not enough
   on its own, which the seeded drift branch showed: the customers
   section clips its overflow, so a bar whose buttons ran past its edge
   left the frame's scrollWidth untouched. The bar itself still knows. */
test('nothing overflows the customers screen at 768', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto('#/changes/rv-2041/findings/f1-states');
  await settle(page);
  for (const side of ['Before', 'After']) {
    await page.getByRole('radio', { name: side }).click();
    const frame = page.locator('.preview__frame');
    const inner = await frame.evaluate((el) => {
      const first = el.firstElementChild as HTMLElement;
      return { scroll: first.scrollWidth, client: first.clientWidth };
    });
    expect(inner.scroll, `${side}: the frame scrolls sideways (${inner.scroll} vs ${inner.client})`).toBeLessThanOrEqual(inner.client);
    const bars = await frame.locator('[role="toolbar"]').evaluateAll((els) =>
      els.map((el) => ({ name: el.getAttribute('aria-label'), scroll: el.scrollWidth, client: el.clientWidth })),
    );
    for (const bar of bars) {
      expect(bar.scroll, `${side}: toolbar "${bar.name}" overflows its box (${bar.scroll} vs ${bar.client})`).toBeLessThanOrEqual(bar.client);
    }
  }
});
