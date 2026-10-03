import { devices, expect, test, type Page } from '@playwright/test';

/* The screens, at two widths and on a phone, against their baselines. Each screenshot is
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

    test('the delegated work', async ({ page }) => {
      await page.goto('#/');
      await settle(page);
      await expect(page).toHaveScreenshot(`delegation-${width}.png`, { fullPage: true });
    });

    test('the review queue', async ({ page }) => {
      await page.goto('#/queue');
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

/* A phone: the delegated work in one column, the queue as cards, the change with its decision bar at the
   bottom of the screen, and the return dialog over it. A touch device, so
   the coarse-pointer styles are on, started from a blank page because a
   touch context applies its emulation to the next navigation. The change and
   the dialog are the first screen, not the whole page: a fixed bar belongs
   at the bottom of what is seen, and in a full-page capture it is not. */
test.describe('on a phone, 375', () => {
  const { defaultBrowserType: _ignored, ...phone } = devices['iPhone 13'];
  test.use({ ...phone, viewport: { width: 375, height: 812 }, deviceScaleFactor: 1 });

  async function open(page: Page, hash: string) {
    await page.goto('about:blank');
    await page.goto(hash);
    await settle(page);
  }

  test('the delegated work', async ({ page }) => {
    await open(page, '#/');
    await expect(page).toHaveScreenshot('delegation-375.png', { fullPage: true });
  });

  test('the review queue', async ({ page }) => {
    await open(page, '#/queue');
    await expect(page).toHaveScreenshot('queue-375.png', { fullPage: true });
  });

  test('the change, with the first finding open', async ({ page }) => {
    await open(page, '#/changes/rv-2041/findings/f1-shared-table');
    await expect(page).toHaveScreenshot('change-375.png');
  });

  test('the return dialog', async ({ page }) => {
    await open(page, '#/changes/rv-2043');
    await page.getByRole('button', { name: 'Return to agent' }).click();
    await page.getByRole('dialog').waitFor();
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot('dialog-375.png');
  });
});

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
