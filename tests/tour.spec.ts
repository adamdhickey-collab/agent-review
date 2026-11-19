import { expect, test, type Page } from '@playwright/test';
import { seedCycle } from './seed';

/* The guided tour (review/Tour). What must stay true:

   1. The tour plays the cycle by pressing its real controls, and ends in the
      state those presses give: the same choices the case study describes.
      Played here under reduced motion, where each beat makes its presses at
      once and waits for Next, so the whole tour is pressed through in
      seconds and nothing plays by itself.
   2. It starts from wherever a person was, clearing what they had chosen;
      it can be paused, sent to any stage, and taken over, and the page it
      hands back is one a person can carry on in.
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
    const w = window as unknown as { __said: string[]; __cancels: number; __rates: number[]; __voices: string[]; __offer?: SpeechSynthesisVoice[] };
    w.__said = said;
    w.__cancels = 0;
    /* Each utterance's rate and voice, and the voices a test offers the page (none, unless it sets __offer). */
    w.__rates = [];
    w.__voices = [];
    let live: ReturnType<typeof setTimeout> | null = null;
    Object.defineProperty(window.speechSynthesis, 'getVoices', { value: () => w.__offer ?? [] });
    Object.defineProperty(window.speechSynthesis, 'speak', {
      value: (u: SpeechSynthesisUtterance) => {
        said.push(u.text);
        w.__rates.push(u.rate);
        w.__voices.push(u.voice?.name ?? '');
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

const BEATS = 18;
const said = (page: Page) => page.evaluate(() => (window as unknown as { __said: string[] }).__said.slice());
const bar = (page: Page) => page.getByRole('region', { name: 'Guided tour' });
const cycle = (page: Page) => page.evaluate(() => JSON.parse(sessionStorage.getItem('agent-review:cycle') ?? '{}'));

async function open(page: Page, hash: string) {
  await page.goto(hash);
  await page.evaluate(() => document.fonts.ready);
}

test('pressed through under reduced motion, the tour ends in the case study’s choices', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '#/');
  await page.getByRole('button', { name: 'Watch the tour' }).click();
  await expect(bar(page)).toContainText('Step 1 of 18 · Paused');
  await expect(bar(page)).toContainText('Simulated demo');
  /* Nothing moves for a reader who asked for stillness: no pointer is drawn. */
  await expect(page.locator('.tour-layer__pointer')).toHaveCount(0);

  for (let step = 2; step <= BEATS; step++) {
    await page.keyboard.press('ArrowRight');
    if (step < BEATS) await expect(bar(page)).toContainText(`Step ${step} of ${BEATS} · Paused`);
  }
  await expect(bar(page)).toContainText('The end');
  await expect(page).toHaveURL(/#\/cycle\/learn$/);

  const s = await cycle(page);
  expect(s).toMatchObject({
    reading: 'correct',
    priority: 'recovery',
    direction: 'review',
    stops: 'active',
    required: { restore: true, who: true, 'only-active': true },
    delegated: true,
    answer: 'inline',
    kept: true,
  });
  for (const tried of Object.values(s.trials as Record<string, string[]>)) expect(tried).toContain('archived');

  /* The way out leaves a page to use: every stage open, the tour's choices in it. */
  await bar(page).getByRole('button', { name: 'Explore the prototype' }).click();
  await expect(bar(page)).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await expect(page.getByRole('navigation', { name: 'Stages' }).getByRole('link')).toHaveCount(6);
  await page.getByRole('navigation', { name: 'Stages' }).getByRole('link', { name: /Evaluate/ }).click();
  await expect(page.getByRole('button', { name: /Chosen Review batch/ })).toBeVisible();
});

test('it starts from anywhere, pauses, goes to a stage, and hands the page over', async ({ page }) => {
  test.setTimeout(90_000);
  /* A person part-way through, with other choices than the tour's. */
  await seedCycle(page, { reading: 'keep', priority: 'pace' });
  await open(page, '#/cycle/define');
  await page.getByRole('button', { name: 'Watch the tour' }).click();
  await expect(page).toHaveURL(/#\/cycle\/discover$/);
  await expect(bar(page)).toContainText('Step 1 of 18');
  expect(await cycle(page)).toMatchObject({ reading: null, priority: null });

  /* Focus is in the bar, and stays there while the tour presses the page. */
  const pause = bar(page).getByRole('button', { name: 'Pause the tour' });
  await expect(pause).toBeFocused();
  await expect(bar(page)).toContainText('Step 5 of 18', { timeout: 45_000 });
  await expect(page.getByRole('button', { name: /Chosen Correct the summary/ })).toBeVisible({ timeout: 10_000 });
  await expect(pause).toBeFocused();
  await page.keyboard.press('Space');
  await expect(bar(page)).toContainText('Paused');
  const held = (await bar(page).locator('.tour__caption').textContent()) ?? '';
  await page.waitForTimeout(1500);
  await expect(bar(page).locator('.tour__caption')).toHaveText(held);

  /* A stage's chapter goes there, with every earlier choice made. */
  await bar(page).getByRole('button', { name: /^4\s*Evaluate$/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Which direction, and when does it stop?' })).toBeVisible();
  await expect(bar(page)).toContainText('Step 12 of 18');
  expect(await cycle(page)).toMatchObject({ reading: 'correct', priority: 'recovery' });
  await expect(page.getByRole('button', { name: /Chosen Review batch/ })).toBeVisible({ timeout: 15_000 });

  await bar(page).getByRole('button', { name: 'Close the tour' }).click();
  await expect(bar(page)).toHaveCount(0);
  await expect(page.locator('.tour-layer__ring')).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  /* The page is the person's: the next choice is theirs to make. */
  await page.getByRole('button', { name: /Choose On every batch/ }).click();
  expect(await cycle(page)).toMatchObject({ direction: 'review', stops: 'every' });
});

test('the arrows step, Escape leaves, and a press on the page pauses', async ({ page }) => {
  await open(page, '#/');
  await page.getByRole('button', { name: 'Watch the tour' }).click();
  await expect(bar(page)).toContainText('Step 1 of 18');
  await page.keyboard.press('ArrowRight');
  await expect(bar(page)).toContainText('Step 2 of 18');
  await page.keyboard.press('ArrowRight');
  await expect(bar(page)).toContainText('Step 3 of 18');
  await page.keyboard.press('ArrowLeft');
  await expect(bar(page)).toContainText('Step 2 of 18');

  await page.getByRole('heading', { level: 1 }).click();
  await expect(bar(page)).toContainText('Paused');
  await bar(page).getByRole('button', { name: 'Play the tour' }).click();
  await expect(bar(page)).not.toContainText('Paused');

  await page.keyboard.press('Escape');
  await expect(bar(page)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Watch the tour' })).toBeVisible();
});

test('the close in the corner leaves the tour from its first step', async ({ page }) => {
  await open(page, '#/');
  await page.getByRole('region', { name: /Watch an agent do the work/ }).getByRole('button', { name: 'Watch the tour' }).click();
  await expect(bar(page)).toContainText('Step 1 of 18');
  await bar(page).getByRole('button', { name: 'Close the tour' }).click();
  await expect(bar(page)).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  expect(await said(page), 'the tour is silent until narration is turned on').toEqual([]);
});

test('the narration is off until turned on, then reads each caption as it plays, stops on a pause, and goes off again', async ({ page }) => {
  test.setTimeout(90_000);
  await open(page, '#/');
  await page.getByRole('region', { name: /Watch an agent do the work/ }).getByRole('button', { name: 'Watch the tour' }).click();
  const voice = bar(page).getByRole('button', { name: 'Narration' });
  /* Off by default: nothing is said, and nothing is kept. Turned on, it reads the line on screen and is remembered. */
  await expect(voice).toHaveAttribute('aria-pressed', 'false');
  await expect(bar(page)).toContainText('Step 1 of 18');
  expect(await said(page)).toEqual([]);
  await voice.click();
  await expect(voice).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => localStorage.getItem('agent-review:tour-narration'))).toBe('on');
  /* Each beat's words, sentence by sentence, before the beat moves on. */
  await expect(bar(page)).toContainText('Step 3 of 18', { timeout: 30_000 });
  const first = (await said(page)).join(' ');
  expect(first).toContain('In this demo an agent does the work, and a designer makes the decisions that matter.');
  expect(first).toContain('Watch for where the person steps in.');
  expect(first).toContain('It’s a scripted demo.');

  /* A pause stops the voice; nothing more is said until play. */
  await bar(page).getByRole('button', { name: 'Pause the tour' }).click();
  const count = (await said(page)).length;
  await page.waitForTimeout(1500);
  expect((await said(page)).length).toBe(count);

  /* Off, forgotten, and the tour carries on by its own clock. */
  await voice.click();
  await expect(voice).toHaveAttribute('aria-pressed', 'false');
  expect(await page.evaluate(() => localStorage.getItem('agent-review:tour-narration'))).toBeNull();
  await bar(page).getByRole('button', { name: 'Play the tour' }).click();
  const silent = (await said(page)).length;
  await expect(bar(page)).toContainText('Step 5 of 18', { timeout: 40_000 });
  expect((await said(page)).length).toBe(silent);
});

test('one menu holds the speed and the voice: a speed is spoken at and remembered, and each English voice is offered once', async ({ page }) => {
  test.setTimeout(60_000);
  /* Voices as macOS lists them (one twice by quality, one twice by accent) and a novelty one, offered through the stand-in above. */
  await page.addInitScript(() => {
    localStorage.setItem('agent-review:tour-narration', 'on'); /* a reader who turned narration on last time */
    const voice = (name: string) => ({ name, lang: 'en-US', default: false, localService: true, voiceURI: name }) as SpeechSynthesisVoice;
    (window as unknown as { __offer: SpeechSynthesisVoice[] }).__offer = [voice('Samantha'), voice('Zarvox'), voice('Ava'), voice('Ava (Premium)'), voice('Eddy (English (United States))'), { ...voice('Eddy (English (United Kingdom))'), lang: 'en-GB' }];
    /* A real utterance refuses a voice that isn't the engine's own; these aren't, so it is taught to hold one. */
    let held: SpeechSynthesisVoice | null = null;
    Object.defineProperty(SpeechSynthesisUtterance.prototype, 'voice', { get: () => held, set: (v: SpeechSynthesisVoice | null) => (held = v) });
  });
  await open(page, '#/');
  await page.getByRole('region', { name: /Watch an agent do the work/ }).getByRole('button', { name: 'Watch the tour' }).click();
  const settings = bar(page).getByRole('button', { name: /^Voice and speed: / });
  await expect(settings).toHaveText('Voice and speed: Ava · , 1×');
  await bar(page).getByRole('button', { name: 'Pause the tour' }).click();
  await bar(page).getByRole('button', { name: 'Play the tour' }).click();
  const before = (await said(page)).length;
  await settings.click();
  const menu = bar(page).getByRole('dialog', { name: 'Voice and speed' });
  await menu.getByRole('radio', { name: '1.25×' }).click();
  await expect(settings).toContainText('1.25×');
  expect(await page.evaluate(() => localStorage.getItem('agent-review:tour-rate'))).toBe('1.25');
  /* The stand-in ends a sentence in 40ms, so the beat's words are usually said already: the next beat's are what come at the new speed. */
  await expect.poll(async () => (await said(page)).length, { timeout: 30_000 }).toBeGreaterThan(before);
  const rates = await page.evaluate(() => (window as unknown as { __rates: number[] }).__rates);
  expect(rates[0]).toBeCloseTo(0.95);
  expect(rates[rates.length - 1]).toBeCloseTo(0.95 * 1.25);

  /* The voices: the better one first, each name once, the novelty one never offered; a choice is spoken in and kept. */
  const voices = menu.getByRole('radiogroup', { name: 'Voice' }).getByRole('radio');
  await expect(voices).toHaveText(['Ava', 'Samantha', 'Eddy']);
  await expect(voices.first()).toBeChecked();
  await voices.nth(1).click();
  expect(await page.evaluate(() => localStorage.getItem('adamhickey:read-aloud-voice'))).toBe('Samantha');
  await expect.poll(async () => (await page.evaluate(() => (window as unknown as { __voices: string[] }).__voices)).at(-1), { timeout: 30_000 }).toBe('Samantha');
  await expect(settings).toContainText('Samantha');

  /* Escape closes the menu and leaves the tour open. */
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(bar(page)).toBeVisible();

  /* Narration off: the settings stay in the bar, out of reach, so they can be found. */
  await bar(page).getByRole('button', { name: 'Narration' }).click();
  await expect(settings).toBeDisabled();
});
