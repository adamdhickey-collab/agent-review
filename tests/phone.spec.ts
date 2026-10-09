import { devices, expect, test, type Page } from '@playwright/test';

/* The review on a phone. Not a screenshot: three things that must stay true
   at the widths phones come in, each measured on the real screens with a
   touch device, because that is what turns the coarse-pointer styles on.

   1. Nothing makes the page wider than the screen. A page that is wider
      than the screen is zoomed out by a phone's browser, which also puts a
      fixed bar where it is not, so this is the check that everything else
      on this page depends on. 320 is the narrowest phone still sold. It is
      measured against the width the test set, never against innerWidth: on
      a phone innerWidth GROWS with the overflow, so a page 353px wide on a
      320px screen reports 353 against 353 and passes. (This test did exactly
      that until a seeded overflow found it.)
   2. The chrome's controls are a fingertip tall, on the delegated work as
      on the review. The preview frame is left
      out: it shows the product as the checks measured it. Three things are
      allowed under 44px, and each is written here rather than skipped: a
      segmented control's options, which are 38px inside a 44px track; the
      skip links, which are only there while they have focus; and a queue
      card's title, whose box is the text but whose target is the whole card
      (the test asserts the card's height instead).
   3. The decision bar is at the bottom of the screen, and the end of the
      page is not under it. */

const { defaultBrowserType: _ignored, ...phone } = devices['iPhone 13'];

const WIDTHS = [320, 360, 375, 414] as const;
const FLOOR = 44;
const ALLOWED_UNDER = '.segmented__option, .shell__skip, .preview__skip, .review-card__title';

/* A touch context applies its emulation to the NEXT navigation, so the page
   is started from a blank one; without it the first screen would be laid out
   as a mouse's and the coarse-pointer styles would not be on. */
async function open(page: Page, hash: string) {
  await page.goto('about:blank');
  await page.goto(hash);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
}

for (const width of WIDTHS) {
  test.describe(`at ${width}`, () => {
    test.use({ ...phone, viewport: { width, height: 800 }, deviceScaleFactor: 1 });

    const SCREENS: [string, string][] = [
      ['the delegated work', '#/'],
      ['the shared-table run', '#/runs/shared-table'],
      ['the queue', '#/queue'],
      ['a change', '#/changes/rv-2041'],
      ['a finding open, with the preview at its width', '#/changes/rv-2043/findings/f3-overflow'],
    ];

    for (const [name, hash] of SCREENS) {
      test(`${name} fits the screen and its controls are a fingertip`, async ({ page }) => {
        await open(page, hash);
        expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches), 'the touch styles are on').toBe(true);

        const wide = await page.evaluate(() => document.documentElement.scrollWidth);
        expect(wide, `the page is ${wide}px wide on a ${width}px screen`).toBeLessThanOrEqual(width);

        const small = await page.evaluate(
          ({ floor, allowed }) => {
            const out: string[] = [];
            for (const el of document.querySelectorAll<HTMLElement>('a[href], button, [role="radio"], [role="tab"], input[type="checkbox"], [tabindex]:not([tabindex="-1"])')) {
              /* Inside a closed disclosure is not on the screen: Chrome hides it with
                 content-visibility rather than display: none, so it still has a box,
                 but it cannot be reached or pressed until the disclosure opens. */
              if (el.closest('.preview__frame, .visually-hidden, .diff__finding, details:not([open]) > :not(summary)') || el.matches(allowed)) continue;
              /* a checkbox input is a transparent box over its label, and the label is the target */
              const target = el.matches('input[type="checkbox"]') ? (el.closest('label') ?? el) : el;
              const r = target.getBoundingClientRect();
              if (r.height > 0 && r.height < floor) {
                const label = (el.getAttribute('aria-label') ?? el.textContent ?? el.className).toString().trim().replace(/\s+/g, ' ').slice(0, 30);
                out.push(`${label} (${Math.round(r.width)}x${Math.round(r.height)})`);
              }
            }
            return out;
          },
          { floor: FLOOR, allowed: ALLOWED_UNDER },
        );
        expect(small, `controls under ${FLOOR}px`).toEqual([]);

        const cards = await page.locator('.review-card').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
        for (const h of cards) expect(h, 'a queue card is tall enough to be the target').toBeGreaterThanOrEqual(FLOOR);
      });
    }

    test('the decision bar is at the bottom and the end of the page is not under it', async ({ page }) => {
      await open(page, '#/changes/rv-2041');
      const bar = page.locator('.change__header .decision');
      await expect(bar).toBeVisible();
      const place = await bar.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, screen: window.innerHeight, position: getComputedStyle(el).position };
      });
      expect(place.position).toBe('fixed');
      expect(Math.round(place.bottom)).toBe(place.screen);
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      const end = await page.evaluate(() => {
        const last = Array.from(document.querySelectorAll('.diff__line')).pop() as HTMLElement;
        const bar = document.querySelector('.change__header .decision') as HTMLElement;
        return { lastBottom: last.getBoundingClientRect().bottom, barTop: bar.getBoundingClientRect().top };
      });
      expect(end.lastBottom, 'the last line of the diff is under the bar').toBeLessThanOrEqual(end.barTop);
    });
  });
}

/* The delegated work with a direction chosen and the rule box checked: the
   plan, the reason, the rule as it will read, and Apply. The one state on that
   screen that adds controls, so the one measured beyond the first load. */
test.describe('the delegated work on a phone, answering', () => {
  test.use({ ...phone, viewport: { width: 320, height: 800 }, deviceScaleFactor: 1 });

  test('the confirmation and the rule fit, and their controls are a fingertip', async ({ page }) => {
    await open(page, '#/');
    await page.getByRole('button', { name: /^Choose\s+Separate the meanings$/ }).click();
    await page.getByText('Use this decision for similar cases').click();
    await expect(page.getByText('The rule, as it will read')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    for (const name of ['Cancel', 'Apply']) {
      const box = await page.getByRole('button', { name, exact: true }).boundingBox();
      expect(box!.height, name).toBeGreaterThanOrEqual(FLOOR);
    }
    const label = await page.locator('.ask .checkbox').boundingBox();
    expect(label!.height, 'the rule box').toBeGreaterThanOrEqual(FLOOR);
  });
});

/* The other path through the same card: evidence asked for, then the
   direction the agent did not recommend chosen and applied. Every part it
   adds (the evidence, the plan, the reason, the record) fits the screen. */
test.describe('the delegated work on a phone, the other direction', () => {
  test.use({ ...phone, viewport: { width: 320, height: 800 }, deviceScaleFactor: 1 });

  test('the evidence, the plan and the record fit, and their controls are a fingertip', async ({ page }) => {
    await open(page, '#/');
    await page.getByRole('button', { name: 'Request evidence' }).click();
    await expect(page.getByText('What the agent found when you asked')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    await page.getByRole('button', { name: /^Choose\s+Keep the red for now$/ }).click();
    await expect(page.getByRole('textbox', { name: 'Your reason' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    for (const name of [/^Chosen\s+Keep the red for now$/, /^Choose\s+Separate the meanings$/]) {
      const box = await page.getByRole('button', { name }).boundingBox();
      expect(box!.height, String(name)).toBeGreaterThanOrEqual(FLOOR);
    }
    await page.getByRole('button', { name: 'Apply', exact: true }).click();
    await expect(page.getByRole('article', { name: 'Keep the red for now' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  });
});

test.describe('the return dialog on a phone', () => {
  test.use({ ...phone, viewport: { width: 360, height: 700 }, deviceScaleFactor: 1 });

  test('is the width of the screen and its footer fits', async ({ page }) => {
    await open(page, '#/changes/rv-2043');
    await page.getByRole('button', { name: 'Return to agent' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const box = await dialog.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const footer = el.querySelector('.return__footer') as HTMLElement;
      return { width: r.width, footerScroll: footer.scrollWidth, footerClient: footer.clientWidth, page: document.documentElement.scrollWidth };
    });
    expect(box.width).toBe(360);
    expect(box.footerScroll).toBeLessThanOrEqual(box.footerClient);
    expect(box.page).toBeLessThanOrEqual(360);
  });
});
