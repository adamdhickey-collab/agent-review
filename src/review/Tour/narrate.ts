/* THE TOUR'S VOICE (2026-11-18). The tour can read its captions aloud, once
   a person turns narration on, with the browser's own speech synthesiser, by the rules adamhickey.com's
   read-aloud.js reads its pages with, so a reader who listened to the case
   study hears the same voice in the prototype:

   - The same voice. The reader's own choice from last time first, then Zoe
     (Premium), then Google UK English, then the platform's better English
     voices, with Apple's novelty voices (Zarvox, a church organ) never
     offered. The key the choice is kept under is the site's own, so the
     two agree wherever they share an origin; today the app is on
     github.io and the site is not, so they agree on the rules, not the
     stored choice.
   - The same pace. 0.95 of the API's rate, which is pitched at hearing a
     notification, not at following an argument.
   - It breathes. One utterance per sentence, with a measured silence after
     each: 140ms inside a caption, 340ms before the line of reasoning under
     it, the site's sentence and paragraph gaps. One utterance per sentence
     also keeps each one under Chrome's fifteen-second limit and lets every
     browser report where the voice has got to, by `start` and `end`.

   - The same two settings, since 2026-11-18: a reading speed that steps
     1x, 1.25x, 1.5x, 0.75x (times the pace above; the pauses shorten with
     it), and a menu of the English voices on the machine, best first. A
     change of either says the sentence in hand again, so it is heard
     against the words that prompted it.

   It differs from the site's in one way: it never marks words. The caption
   is a line in a bar, short enough to follow by ear, and the page under it
   is busy with the tour's own ring.

   A browser with no speech synthesiser gets no narration control at all,
   rather than a control that does nothing. */

const synth: SpeechSynthesis | undefined = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
export const canNarrate = !!synth && typeof window.SpeechSynthesisUtterance === 'function';

const PACE = 0.95;
const GAP = { sentence: 140, part: 340 };

const WANTED = [/^zoe\b.*premium/i, /google uk english/i, /premium/i, /enhanced/i, /natural/i, /google us english/i, /samantha/i, /\bava\b/i, /daniel/i];
const NOVELTY =
  /^(albert|bad news|bahh|bells|boing|bubbles|cellos|fred|good news|jester|junior|kathy|organ|pipe organ|ralph|superstar|trinoids|whisper|wobble|zarvox|deranged|hysterical|princess|bruce)\b/i;
const VOICE_KEY = 'adamhickey:read-aloud-voice';
const ON_KEY = 'agent-review:tour-narration';
const RATE_KEY = 'agent-review:tour-rate';

/** The speeds on offer, the site's four. */
export const RATES: readonly number[] = [1, 1.25, 1.5, 0.75];

/* One voice per name. macOS offers most of its newer voices twice, "Eddy
   (English (United States))" and "Eddy (English (United Kingdom))", and a
   downloaded voice beside its compact one, "Zoe" and "Zoe (Premium)"; listed
   as they come, a menu says every name twice. The better recording wins,
   then the American one. */
const baseName = (name: string) => name.replace(/\s*\((?:[^()]|\([^()]*\))*\)/g, '').replace(/\s+/g, ' ').trim() || name;
const quality = (v: SpeechSynthesisVoice) => (/premium/i.test(v.name) ? 4 : /enhanced/i.test(v.name) ? 2 : 0) + (/^en-US$/i.test(v.lang.replace('_', '-')) ? 1 : 0);

/** The English voices worth offering, one per name, best first: the preference list's, in its order, then the rest by name. */
export function usableVoices(): SpeechSynthesisVoice[] {
  if (!synth) return [];
  const en = synth.getVoices().filter((v) => /^en(-|_|$)/i.test(v.lang));
  let list = en.filter((v) => !NOVELTY.test(v.name));
  if (list.length < 2) list = en;
  const byName = new Map<string, SpeechSynthesisVoice>();
  for (const v of list) {
    const had = byName.get(baseName(v.name));
    if (!had || quality(v) > quality(had)) byName.set(baseName(v.name), v);
  }
  const rank = (v: SpeechSynthesisVoice) => {
    const i = WANTED.findIndex((w) => w.test(v.name));
    return i < 0 ? WANTED.length : i;
  };
  return [...byName.values()].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
}

/** A voice's name as a person says it: "Zoe", not "Zoe (Premium)" or "Eddy (English (United States))". */
export function voiceLabel(v: Pick<SpeechSynthesisVoice, 'name'>): string {
  return baseName(v.name);
}

/** The voice the tour speaks in now, or null where the machine offers none. */
export function currentVoice(): SpeechSynthesisVoice | null {
  return voiceOf();
}

export function rememberVoice(name: string) {
  try {
    localStorage.setItem(VOICE_KEY, name);
  } catch {
    /* it holds for this visit only where nothing can be stored */
  }
  chosenName = name;
}

/** Calls back when the machine's voices arrive or change; returns the way to stop listening. */
export function onVoicesChanged(fn: () => void): () => void {
  if (!synth || typeof synth.addEventListener !== 'function') return () => {};
  synth.addEventListener('voiceschanged', fn);
  return () => synth.removeEventListener('voiceschanged', fn);
}

/** The speed kept from last time, or 1. */
export function rateKept(): number {
  try {
    const kept = Number(localStorage.getItem(RATE_KEY));
    return RATES.includes(kept) ? kept : 1;
  } catch {
    return 1;
  }
}

export function rememberRate(rate: number) {
  try {
    if (rate === 1) localStorage.removeItem(RATE_KEY);
    else localStorage.setItem(RATE_KEY, String(rate));
  } catch {
    /* it holds for this visit */
  }
}

/* The voice chosen in this visit, for a browser that can't store it. */
let chosenName: string | null = null;

function voiceOf(): SpeechSynthesisVoice | null {
  const list = usableVoices();
  if (!list.length) return null;
  const picked = chosenName && list.find((v) => v.name === chosenName);
  if (picked) return picked;
  let kept: string | null = null;
  try {
    kept = localStorage.getItem(VOICE_KEY);
  } catch {
    /* no storage: the preference list decides */
  }
  const chosen = kept && list.find((v) => v.name === kept);
  if (chosen) return chosen;
  for (const want of WANTED) {
    const hit = list.find((v) => want.test(v.name));
    if (hit) return hit;
  }
  return list.find((v) => v.default) ?? list[0];
}

/** Whether narration is on: off until a person turns it on (since 2026-11-19; a page that
    starts talking unasked is a surprise), remembered where storage allows. An 'off' kept
    from before that date reads as off too. */
export function narrationOn(): boolean {
  try {
    return localStorage.getItem(ON_KEY) === 'on';
  } catch {
    return false;
  }
}

export function rememberNarration(on: boolean) {
  try {
    if (on) localStorage.setItem(ON_KEY, 'on');
    else localStorage.removeItem(ON_KEY);
  } catch {
    /* it holds for this visit */
  }
}

/** A caption and its reasoning, as the sentences to speak and the silence after each. */
function piecesOf(parts: string[]): { text: string; gap: number }[] {
  const out: { text: string; gap: number }[] = [];
  parts.forEach((part, p) => {
    const sentences = part.match(/[^.!?]+[.!?]+[”’"']?|[^.!?]+$/g)?.map((s) => s.trim()).filter(Boolean) ?? [];
    sentences.forEach((text, s) => out.push({ text, gap: s === sentences.length - 1 ? (p === parts.length - 1 ? 0 : GAP.part) : GAP.sentence }));
  });
  return out;
}

/* One reading at a time. `say` replaces whatever was being read; `pause`
   stops the voice and remembers the sentence it was on, and `resume` says
   that sentence again from its start, because a synthesiser's own pause is
   unreliable (Chrome drops it after a few seconds, and nothing can be
   resumed mid-silence). `idle` settles when the reading in hand is done or
   abandoned, which is what a beat waits on before it moves on. */
export class Narrator {
  private pieces: { text: string; gap: number }[] = [];
  private at = 0;
  private run = 0;
  private paused = false;
  private rate = rateKept();
  /** The utterance being spoken: held here, or Chrome can collect it and never fire `end`. */
  holding: SpeechSynthesisUtterance | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private settle: (() => void) | null = null;
  private done: Promise<void> = Promise.resolve();

  say(parts: string[]) {
    this.stop();
    if (!canNarrate) return;
    this.pieces = piecesOf(parts.filter(Boolean));
    this.at = 0;
    this.done = new Promise((resolve) => (this.settle = resolve));
    if (!this.paused) this.speak();
  }

  /** Settles when the reading in hand is finished, or stopped. */
  idle(): Promise<void> {
    return this.done;
  }

  pause() {
    if (this.paused) return;
    this.paused = true;
    this.run += 1;
    this.clear();
    synth?.cancel();
  }

  resume() {
    if (!this.paused) return;
    this.paused = false;
    if (this.settle) this.speak();
  }

  stop() {
    this.run += 1;
    this.clear();
    if (canNarrate) synth?.cancel();
    this.pieces = [];
    this.finish();
  }

  /** The reading speed, times the pace. The sentence in hand is said again at it. */
  setRate(rate: number) {
    this.rate = rate;
    this.restate();
  }

  /** Says the sentence in hand again from its start: after a change of speed or of voice. */
  restate() {
    if (!this.settle || this.paused || this.at >= this.pieces.length) return;
    this.run += 1;
    this.clear();
    synth?.cancel();
    this.speak();
  }

  /** Whether the voice has been paused by the tour, for a reading begun while it was. */
  setPaused(paused: boolean) {
    this.paused = paused;
  }

  private clear() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.holding = null;
  }

  private finish() {
    const s = this.settle;
    this.settle = null;
    s?.();
  }

  private speak() {
    if (!synth) return this.finish();
    if (this.at >= this.pieces.length) return this.finish();
    const mine = ++this.run;
    const piece = this.pieces[this.at];
    const u = new SpeechSynthesisUtterance(piece.text);
    const voice = voiceOf();
    if (voice) {
      u.voice = voice;
      u.lang = voice.lang;
    }
    u.rate = PACE * this.rate;
    /* A synthesiser that never says `end` (no voices installed, a voice
       still downloading) must not hold the tour: past twice the time the
       sentence could take, it counts as said. */
    const guard = setTimeout(() => next(), (1500 + piece.text.length * 110) / Math.min(this.rate, 1));
    const next = () => {
      clearTimeout(guard);
      if (mine !== this.run) return;
      this.holding = null;
      this.at += 1;
      if (this.at >= this.pieces.length) return this.finish();
      this.timer = setTimeout(() => {
        if (mine === this.run && !this.paused) this.speak();
      }, piece.gap / this.rate);
    };
    u.onend = next;
    u.onerror = next;
    this.holding = u;
    synth.speak(u);
  }
}
