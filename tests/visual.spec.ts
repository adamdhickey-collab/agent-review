import { devices, expect, test, type Page } from '@playwright/test';

/* The screens, at two widths and on a phone, against their baselines. Each screenshot is
   the full page so a change below the fold counts. The product screens
   are rendered on their own through the preview route so the baseline is
   the screen, not the review around it. */

const WIDTHS = [1280, 768] as const;

/* The review is dark until a person chooses light (app/useTheme.ts). The
   baselines that are not named -dark are of the light theme, so those tests
   make that choice first, the way the bar's toggle does: by remembering it. */
const chooseLight = () => localStorage.setItem('agent-review:theme', 'light');

async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(100);
}

for (const width of WIDTHS) {
  test.describe(`at ${width}`, () => {
    test.use({ viewport: { width, height: 900 } });
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(chooseLight);
    });

    test('the delegated work', async ({ page }) => {
      await page.goto('#/');
      await settle(page);
      await expect(page).toHaveScreenshot(`delegation-${width}.png`, { fullPage: true });
    });

    test('the shared-table run', async ({ page }) => {
      await page.goto('#/runs/shared-table');
      await settle(page);
      await expect(page).toHaveScreenshot(`shared-table-${width}.png`, { fullPage: true });
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
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(chooseLight);
  });

  async function open(page: Page, hash: string) {
    await page.goto('about:blank');
    await page.goto(hash);
    await settle(page);
  }

  test('the delegated work', async ({ page }) => {
    await open(page, '#/');
    await expect(page).toHaveScreenshot('delegation-375.png', { fullPage: true });
  });

  test('the shared-table run', async ({ page }) => {
    await open(page, '#/runs/shared-table');
    await expect(page).toHaveScreenshot('shared-table-375.png', { fullPage: true });
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

/* The dark theme, at one width: what a first visit sees, with no choice
   made. The change is the one to look at: the review is dark and the product
   in its frame is not, because the frame is the product's surface and that
   surface is always light. */
test.describe('in the dark theme, the default, at 1280', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('the delegated work', async ({ page }) => {
    await page.goto('#/');
    await settle(page);
    await expect(page).toHaveScreenshot('delegation-1280-dark.png', { fullPage: true });
  });

  test('the review queue', async ({ page }) => {
    await page.goto('#/queue');
    await settle(page);
    await expect(page).toHaveScreenshot('queue-1280-dark.png', { fullPage: true });
  });

  test('the change, with the first finding open', async ({ page }) => {
    await page.goto('#/changes/rv-2041/findings/f1-shared-table');
    await settle(page);
    await expect(page).toHaveScreenshot('change-1280-dark.png', { fullPage: true });
  });
});

test.describe('the product screens', () => {
  /* The product is light whatever the review is, so the theme makes no
     difference to it; the choice is made so the page behind the frame is
     light too, because the frame is a fraction of a pixel taller than a
     whole number and the capture's last row shows what is behind it. */
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(chooseLight);
  });
  for (const width of WIDTHS) {
    test(`customers, before, at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('#/changes/rv-2041');
      await settle(page);
      await page.getByRole('radio', { name: 'Before' }).click();
      await page.getByRole('radio', { name: `${width === 768 ? 'Tablet' : 'Desktop'}, ${width}` }).click();
      /* Below 64rem the review's decision bar is fixed to the bottom of the
         screen, over the lower edge of the frame, and a picture of the frame
         took it along: the product's baseline held three of the review's
         buttons, and moved whenever the review's chrome did. It is hidden
         for this capture, so the baseline is the product and nothing else. */
      await page.addStyleTag({ content: '.change__header .decision { visibility: hidden !important; }' });
      /* And the frame is lifted out of the review for the capture. Its page
         offset is wherever the review's chrome above it puts it, a fraction
         of a pixel when an icon or a line of type above it changes size, and
         the scaled product rasterises differently at a different offset: the
         baseline moved with the review while every element in the frame was
         where it had been (811 compared, none different). Alone at 0,0 it
         is drawn the same whatever is above it, so a Relay baseline moves
         when Relay does. */
      const frame = page.locator('.preview__frame');
      await frame.evaluate((el) => {
        const lifted = el.cloneNode(true) as HTMLElement;
        document.body.replaceChildren(lifted);
        document.body.style.margin = '0';
      });
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
