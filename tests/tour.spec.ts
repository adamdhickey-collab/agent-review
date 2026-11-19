import { expect, test, type Page } from '@playwright/test';

/* The guided tour (review/Tour). What must stay true:

   1. The tour plays the short path by pressing its real controls, and ends
      in the state those presses give: the case study's answer, review only
      when someone's active, with the build showing Northside in a review.
      Played here under reduced motion, where each beat makes its presses at
      once and waits for Next, so the whole tour is pressed through in
      seconds and nothing plays by itself.
   2. It starts from wherever a person was, clearing their answer; it can be
      paused, sent to any chapter, and taken over, and the page it hands
      back is one a person can carry on in.
   3. A keyboard keeps hold of it: focus stays in the bar while the tour
      presses things, the arrows step, and Escape leaves. A press on the
      page pauses it. */

test.use({ viewport: { width: 1280, height: 900 } });
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('agent-review:theme', 'light'));
  /* The speech engine, stood in for: what a browser's own voice would be
     handed is kept in window.__said, and each sentence ends a moment later,
     so the tests neither depend on a machine's voices nor wait on them. */
  await page.addInitScript(() => {
    const said: string[] = [];
    const w = window as unknown as { __said: string[]; __cancels: number };
    w.__said = said;
    w.__cancels = 0;
    let live: ReturnType<typeof setTimeout> | null = null;
    Object.defineProperty(window.speechSynthesis, 'getVoices', { value: () => [] });
    Object.defineProperty(window.speechSynthesis, 'speak', {
      value: (u: SpeechSynthesisUtterance) => {
        said.push(u.text);
        live = setTimeout(() => u.dispatchEvent(new Event('end')), 40);
      },
    });
    Object.defineProperty(window.speechSynthesis, 'cancel', {
      value: () => {
        w.__cancels += 1;
        if (live) clearTimeout(live);
      },
    });
  });
});

const BEATS = 10;
const said = (page: Page) => page.evaluate(() => (window as unknown as { __said: string[] }).__said.slice());
const bar = (page: Page) => page.getByRole('region', { name: 'Guided tour' });
const stops = (page: Page) => page.evaluate(() => sessionStorage.getItem('agent-review:decide'));
const forward = (page: Page) => page.getByRole('region', { name: 'What the agent takes forward' });
const start = (page: Page) => page.getByRole('region', { name: 'Watch the decision play out' }).getByRole('button', { name: 'Watch the tour' }).click();

async function open(page: Page, hash: string) {
  await page.goto(hash);
  await page.evaluate(() => document.fonts.ready);
}

test('pressed through under reduced motion, the tour ends in the case study’s answer', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '#/');
  await start(page);
  await expect(bar(page)).toContainText(`Step 1 of ${BEATS} · Paused`);
  await expect(bar(page)).toContainText('Simulated demo');
  /* Nothing moves for a reader who asked for stillness: no pointer is drawn. */
  await expect(page.locator('.tour-layer__pointer')).toHaveCount(0);

  for (let step = 2; step <= BEATS; step++) {
    await page.keyboard.press('ArrowRight');
    if (step < BEATS) await expect(bar(page)).toContainText(`Step ${step} of ${BEATS} · Paused`);
  }
  await expect(bar(page)).toContainText('The end');
  await expect(page).toHaveURL(/#\/(decide)?$/);
  expect(await stops(page)).toBe('active');
  /* The tour's last presses are on the build: Northside in the batch, the review open on it. */
  await expect(forward(page).getByRole('checkbox', { name: /^Northside Trucking, / })).toBeChecked();

  /* The way out leaves a page to use, with the tour's answer in it. */
  await bar(page).getByRole('button', { name: 'Explore the prototype' }).click();
  await expect(bar(page)).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await expect(page.getByRole('button', { name: /Chosen Only when someone’s active/ })).toBeVisible();
});

test('it starts from anywhere, pauses, goes to a chapter, and hands the page over', async ({ page }) => {
  test.setTimeout(90_000);
  /* A person who had answered the other way. */
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('agent-review:decide')) sessionStorage.setItem('agent-review:decide', 'every');
  });
  await open(page, '#/');
  await expect(page.getByRole('button', { name: /Chosen On every batch/ })).toBeVisible();
  await start(page);
  await expect(bar(page)).toContainText(`Step 1 of ${BEATS}`);
  await expect(page.getByRole('button', { name: /Chosen On every batch/ })).toHaveCount(0);
  expect(await stops(page)).toBeNull();

  /* Focus is in the bar, and stays there while the tour presses the page. */
  const pause = bar(page).getByRole('button', { name: 'Pause the tour' });
  await expect(pause).toBeFocused();
  await expect(bar(page)).toContainText(`Step 4 of ${BEATS}`, { timeout: 45_000 });
  await expect(page.getByRole('heading', { name: 'Review 2 customers before archiving' })).toBeVisible({ timeout: 10_000 });
  await expect(pause).toBeFocused();
  await page.keyboard.press('Space');
  await expect(bar(page)).toContainText('Paused');
  const held = (await bar(page).locator('.tour__caption').textContent()) ?? '';
  await page.waitForTimeout(1500);
  await expect(bar(page).locator('.tour__caption')).toHaveText(held);

  /* A chapter goes there, with the answer the earlier beats gave. */
  await bar(page).getByRole('button', { name: /^3\s*What the agent takes forward$/ }).click();
  await expect(bar(page)).toContainText(`Step 7 of ${BEATS}`);
  expect(await stops(page)).toBe('active');
  await expect(page.locator('.decide__rule')).toBeVisible();

  await bar(page).getByRole('button', { name: 'Take over' }).click();
  await expect(bar(page)).toHaveCount(0);
  await expect(page.locator('.tour-layer__ring')).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  /* The page is the person's: the answer is theirs to change. */
  await page.getByRole('button', { name: /Choose On every batch/ }).click();
  expect(await stops(page)).toBe('every');
});

test('the arrows step, Escape leaves, and a press on the page pauses', async ({ page }) => {
  await open(page, '#/');
  await start(page);
  await expect(bar(page)).toContainText(`Step 1 of ${BEATS}`);
  await page.keyboard.press('ArrowRight');
  await expect(bar(page)).toContainText(`Step 2 of ${BEATS}`);
  await page.keyboard.press('ArrowRight');
  await expect(bar(page)).toContainText(`Step 3 of ${BEATS}`);
  await page.keyboard.press('ArrowLeft');
  await expect(bar(page)).toContainText(`Step 2 of ${BEATS}`);

  await page.getByRole('heading', { level: 1 }).click();
  await expect(bar(page)).toContainText('Paused');
  await bar(page).getByRole('button', { name: 'Play the tour' }).click();
  await expect(bar(page)).not.toContainText('Paused');

  await page.keyboard.press('Escape');
  await expect(bar(page)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Watch the tour' })).toBeVisible();
});

test('the narration reads each caption as it plays, stops on a pause, and stays off once turned off', async ({ page }) => {
  test.setTimeout(90_000);
  await open(page, '#/');
  await start(page);
  const voice = bar(page).getByRole('button', { name: 'Narration' });
  await expect(voice).toHaveAttribute('aria-pressed', 'true');
  await expect(bar(page)).toContainText(`Step 3 of ${BEATS}`, { timeout: 30_000 });
  const first = (await said(page)).join(' ');
  expect(first).toContain('An agent built bulk archiving for Relay, a customer tool.');
  expect(first).toContain('A designer decides one thing: when it should stop and ask.');
  expect(first).toContain('It’s a simulation.');

  await bar(page).getByRole('button', { name: 'Pause the tour' }).click();
  const count = (await said(page)).length;
  await page.waitForTimeout(1500);
  expect((await said(page)).length).toBe(count);

  await voice.click();
  await expect(voice).toHaveAttribute('aria-pressed', 'false');
  expect(await page.evaluate(() => localStorage.getItem('agent-review:tour-narration'))).toBe('off');
  await bar(page).getByRole('button', { name: 'Play the tour' }).click();
  const silent = (await said(page)).length;
  await expect(bar(page)).toContainText(`Step 5 of ${BEATS}`, { timeout: 40_000 });
  expect((await said(page)).length).toBe(silent);
});

test('the close in the corner leaves the tour, as Take over does', async ({ page }) => {
  await open(page, '#/');
  await start(page);
  await expect(bar(page)).toContainText(`Step 1 of ${BEATS}`);
  await bar(page).getByRole('button', { name: 'Close the tour' }).click();
  await expect(bar(page)).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  expect((await said(page)).length).toBeGreaterThan(0);
});

test('the cycle has no tour of its own now', async ({ page }) => {
  await open(page, '#/cycle/discover');
  await expect(page.getByRole('button', { name: /Watch the tour/ })).toHaveCount(0);
});
