import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Badge, Button, Icon, IconButton, SegmentedControl } from '../../components';
import { href } from '../../app/router';
import { useStore } from '../../app/store';
import { STAGES, type StageId } from '../../data/cycle';
import { actionsBefore, BEATS, CLOSING, firstBeatOf, holdOf, type Find } from './script';
import { canNarrate, currentVoice, Narrator, narrationOn, onVoicesChanged, RATES, rateKept, rememberNarration, rememberRate, rememberVoice, usableVoices, voiceLabel } from './narrate';
import './Tour.css';

/* The speeds, slowest first, as a row reads. */
const SPEEDS = [...RATES].sort((a, b) => a - b).map((r) => ({ value: String(r), label: `${r}×` }));

/* THE GUIDED TOUR (2026-11-18). A press on "Watch the tour" plays the design
   cycle from its first stage to its last: a pointer crosses to each real
   control and presses it, a ring says where to look, and one line in a bar
   at the foot of the window says what is happening. About two minutes. It
   is for someone who came to watch, a hiring manager mostly, and wants the
   idea before deciding whether to use the prototype themselves.

   WHY IT IS NOT A RECORDING. The tour presses the cycle's own buttons, so
   what a viewer sees is the app, in the state those presses leave. That is
   what lets them take over at any moment and carry on from where the tour
   got to, and it means the tour cannot show a screen the app no longer has:
   a control that moves fails the tour's test (tests/tour.spec.ts), not a
   video nobody re-watches.

   WHY IT IS NOT A SHARED COMPONENT (rule 10). Nothing in src/components
   plays anything. The closest is the Toolbar, a row of controls over a
   region, and it has no caption, no progress and no notion of time. The
   bar is built from the system's parts (Button, IconButton, Badge, Icon)
   and lives here, with the review's screens, because there is one of it.

   HOW IT STARTS FROM ANYWHERE. A beat's presses are also written as the
   reducer's actions (script.ts). Starting, replaying, stepping back or
   jumping to a stage resets the cycle, plays the earlier beats' actions,
   and remounts the stage (`epoch`, which App uses as the screen's key), so
   the page is exactly where the presses would have left it whatever a
   person had chosen before. It does clear those choices: the tour's are the
   ones on screen afterwards. Playing on from one beat to the next does none
   of that. It presses.

   WHAT A PERSON CAN DO. Pause and resume; step back and forward (the arrow
   keys do the same while the bar has focus); jump to any of the six stages;
   and take over, by the close in the corner, by Escape, or just by pressing something
   on the page, which pauses the tour first. Focus stays in the bar while
   the tour presses things, so a keyboard keeps hold of it: the app moves
   focus to a new screen's heading, and the tour puts it back unless the
   person moved it themselves.

   REDUCED MOTION. Nothing plays by itself: each beat makes its presses at
   once and waits for Next, the pointer isn't drawn, and the page doesn't
   glide. The same beats, read at the reader's pace.

   IT CAN BE READ ALOUD (2026-11-18), by the rules adamhickey.com's read-aloud
   reads its pages with: the same voice, pace and pauses (narrate.ts has
   them). A beat moves on once its words have been said, so the voice sets
   the tour's length where it is slower than the reading clock: about two
   and a half minutes with Zoe (Premium), against two and a quarter silent.
   Narration is off until a person turns it on (since 2026-11-19), which the
   bar's Narration control does and remembers. A pause stops the voice mid-sentence and play
   says the sentence again; the close and every jump stop it. A browser with
   no speech synthesiser gets no control and a silent tour.

   SIMULATED, SAID THREE TIMES: on the bar for as long as it is open, in the
   second beat, and where the simulated session notes are quoted. The
   archive screens are working interfaces and the tour says that too. */

type Status = 'off' | 'playing' | 'paused' | 'ended';

interface TourApi {
  /** Whether there is a tour to offer: false outside the app, as in a story of a screen alone. */
  available: boolean;
  active: boolean;
  /** Changes whenever the tour puts the cycle somewhere by its actions, so the screen can remount on it. */
  epoch: number;
  start(): void;
}

const TourContext = createContext<TourApi>({ available: false, active: false, epoch: 0, start() {} });

export function useTour(): TourApi {
  return useContext(TourContext);
}

const CANCELLED = Symbol('cancelled');
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const stageNow = () => document.querySelector('.cycle')?.getAttribute('data-stage') ?? null;

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const same = (a: Box | null, b: Box | null) => a === b || (!!a && !!b && a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h);

export function TourProvider({
  children,
  opening,
}: {
  children: ReactNode;
  /** Where the bar opens, for a story: on a beat, waiting, or at the end. The app opens it by a press. */
  opening?: { at: number; status: 'paused' | 'ended' };
}) {
  const { cycleDo } = useStore();
  const [status, setStatusState] = useState<Status>(opening?.status ?? 'off');
  const [at, setAtState] = useState(opening?.at ?? 0);
  const [epoch, setEpoch] = useState(0);
  const [ring, setRing] = useState<Box | null>(null);
  const [tip, setTip] = useState<Box | null>(null);
  const [pressing, setPressing] = useState(false);

  const statusRef = useRef<Status>(opening?.status ?? 'off');
  const atRef = useRef(opening?.at ?? 0);
  const token = useRef(0);
  /* Whether the beat on screen has made all its presses, so stepping on from it needs no reset. */
  const done = useRef(false);
  const ringOn = useRef<HTMLElement | null>(null);
  const tipOn = useRef<HTMLElement | null>(null);
  const layer = useRef<HTMLDivElement>(null);
  const probe = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  /* The voice (narrate.ts): off until a person turns it on, and only where the browser can speak. */
  const [narrator] = useState(() => new Narrator());
  const [voiced, setVoicedState] = useState(() => canNarrate && narrationOn());
  const voicedRef = useRef(voiced);
  useEffect(() => () => narrator.stop(), [narrator]);

  /* The voice's two settings, as adamhickey.com's player has them (since
     2026-11-18): one of RATES, and one of the machine's English voices. The
     list holds one option, the voice in use, until someone opens the menu;
     voices arrive late in most browsers, so both are read again when they
     change. */
  const [rate, setRateState] = useState(rateKept);
  const [voiceName, setVoiceName] = useState(() => currentVoice()?.name ?? '');
  const [voices, setVoices] = useState<{ name: string; label: string }[]>([]);
  const fillVoices = useCallback(() => setVoices(usableVoices().map((v) => ({ name: v.name, label: voiceLabel(v) }))), []);
  useEffect(
    () =>
      onVoicesChanged(() => {
        setVoiceName(currentVoice()?.name ?? '');
        setVoices((had) => (had.length ? usableVoices().map((v) => ({ name: v.name, label: voiceLabel(v) })) : had));
      }),
    [],
  );
  const chooseRate = useCallback(
    (next: number) => {
      setRateState(next);
      rememberRate(next);
      narrator.setRate(next);
    },
    [narrator],
  );
  const chooseVoice = useCallback(
    (name: string) => {
      rememberVoice(name);
      setVoiceName(name);
      narrator.restate();
    },
    [narrator],
  );

  /* The settings menu (2026-11-19): the speed and the voice behind one
     button beside the narration switch, the same on a phone and a desk.
     Until then they were a button and the platform's select in the foot
     row, which cost a phone a whole line of the bar, set the two in
     different type, and listed every voice once per accent. Opening it
     moves focus to the chosen speed; Escape, a press outside it, or the
     button again closes it and gives focus back to the button. */
  const [settingsOpen, setSettingsOpenState] = useState(false);
  const settingsOpenRef = useRef(false);
  const settings = useRef<HTMLSpanElement>(null);
  const settingsButton = useRef<HTMLButtonElement>(null);
  const setSettingsOpen = useCallback(
    (open: boolean, refocus = true) => {
      if (open) fillVoices();
      settingsOpenRef.current = open;
      setSettingsOpenState(open);
      if (!open && refocus) settingsButton.current?.focus({ preventScroll: true });
    },
    [fillVoices],
  );
  useEffect(() => {
    if (!settingsOpen) return;
    settings.current?.querySelector<HTMLElement>('.tour__menu [aria-checked="true"]')?.focus({ preventScroll: true });
    const outside = (e: PointerEvent) => {
      if (!settings.current?.contains(e.target as Node)) setSettingsOpen(false, false);
    };
    document.addEventListener('pointerdown', outside, true);
    return () => document.removeEventListener('pointerdown', outside, true);
  }, [settingsOpen, setSettingsOpen]);
  /* Up and down move the voice, as they move a radio group's choice. */
  const onVoiceKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
    if (!step || !voices.length) return;
    e.preventDefault();
    const i = Math.max(0, voices.findIndex((v) => v.name === voiceName));
    const to = voices[(i + step + voices.length) % voices.length];
    chooseVoice(to.name);
    e.currentTarget.querySelector<HTMLElement>(`[data-voice="${CSS.escape(to.name)}"]`)?.focus();
  };

  /* The voice follows the tour: a pause stops it mid-sentence and play says
     that sentence again. `keepVoice` is for a beat that has finished and
     waits for Next under reduced motion, which is not a pause of the
     reading: its caption is still being said. */
  const setStatus = useCallback(
    (s: Status, keepVoice = false) => {
      statusRef.current = s;
      setStatusState(s);
      if (keepVoice) return;
      if (s === 'paused') narrator.pause();
      else if (s === 'playing') narrator.resume();
      else if (s === 'off') narrator.stop();
    },
    [narrator],
  );
  const setAt = useCallback((i: number) => {
    atRef.current = i;
    setAtState(i);
  }, []);

  /* Where the ring and the pointer are, in the page's own coordinates, so a
     scroll moves them with what they mark. The app draws its root zoomed in
     a wide window (app/scale.css) and a measured rectangle is in the zoomed
     pixels, so the probe, 100px wide, says what one of the layer's pixels
     measures as. */
  const measure = useCallback(() => {
    const root = layer.current;
    const unit = probe.current;
    if (!root || !unit) return;
    const zoom = unit.getBoundingClientRect().width / 100 || 1;
    const origin = root.getBoundingClientRect();
    const boxOf = (el: HTMLElement | null): Box | null => {
      if (!el || !el.isConnected) return null;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return null;
      return { x: Math.round((r.left - origin.left) / zoom), y: Math.round((r.top - origin.top) / zoom), w: Math.round(r.width / zoom), h: Math.round(r.height / zoom) };
    };
    const nextRing = boxOf(ringOn.current);
    const nextTip = boxOf(tipOn.current);
    setRing((was) => (same(was, nextRing) ? was : nextRing));
    setTip((was) => (same(was, nextTip) ? was : nextTip));
  }, []);

  /* Brings what the ring is on into the part of the window the bar leaves. */
  const reveal = useCallback((el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    const foot = bar.current?.getBoundingClientRect().top ?? window.innerHeight;
    const room = foot - 24;
    if (r.top >= 16 && r.bottom <= room) return;
    const by = r.height < room - 16 ? r.top - (room - r.height) / 2 : r.top - 24;
    window.scrollBy({ top: by, behavior: reduced() ? 'auto' : 'smooth' });
  }, []);

  const aim = useCallback(
    (frame: HTMLElement | null, control: HTMLElement | null) => {
      ringOn.current = frame;
      tipOn.current = control;
      if (frame) reveal(frame);
      measure();
    },
    [measure, reveal],
  );

  /* Waits, counting only while the tour is playing, and gives up the moment
     a newer run has started. Returns what it waited, for the beat's budget. */
  const sleep = useCallback(
    (ms: number, mine: number) =>
      new Promise<number>((resolve, reject) => {
        if (ms <= 0) return token.current === mine ? resolve(0) : reject(CANCELLED);
        let left = ms;
        let last = performance.now();
        const tick = () => {
          if (token.current !== mine) return reject(CANCELLED);
          const now = performance.now();
          if (statusRef.current === 'playing') left -= now - last;
          last = now;
          if (left <= 0) resolve(ms);
          else setTimeout(tick, 40);
        };
        tick();
      }),
    [],
  );

  /* Waits for something to be in the page: a screen arriving, a control a press brought. */
  const until = useCallback(
    (find: Find, mine: number, patience = 4000) =>
      new Promise<HTMLElement>((resolve, reject) => {
        const from = performance.now();
        const look = () => {
          if (token.current !== mine) return reject(CANCELLED);
          const el = find();
          if (el) resolve(el);
          else if (performance.now() - from > patience) reject(new Error('The tour could not find a control it presses.'));
          else setTimeout(look, 50);
        };
        look();
      }),
    [],
  );

  const press = useCallback(
    async (control: HTMLElement, frame: HTMLElement, mine: number, still: boolean) => {
      let spent = 0;
      aim(frame, control);
      spent += await sleep(still ? 0 : 900, mine);
      if (!control.isConnected) throw new Error('The control went away before the tour pressed it.');
      setPressing(true);
      spent += await sleep(still ? 0 : 180, mine);
      /* A checkbox is pointed at by its label and pressed by its input. */
      (control.querySelector<HTMLElement>('input') ?? control).click();
      setPressing(false);
      requestAnimationFrame(measure); /* the press may have taken the control away, and the ring with it */
      spent += await sleep(still ? 0 : 520, mine);
      return spent;
    },
    [aim, measure, sleep],
  );

  const leave = useCallback(
    (top = false) => {
      token.current += 1;
      aim(null, null);
      setPressing(false);
      setStatus('off');
      if (top) window.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' });
      document.querySelector<HTMLElement>('#main h1')?.focus({ preventScroll: true });
    },
    [aim, setStatus],
  );

  /* The run calls itself, for the next beat and for the one retry, through a ref: a callback cannot name itself while it is being made. */
  const again = useRef<(index: number, seeded: boolean, retried?: boolean) => void>(() => {});
  const run = useCallback(
    async (index: number, seeded: boolean, retried = false) => {
      const mine = ++token.current;
      const beat = BEATS[index];
      const still = reduced();
      setPressing(false);
      narrator.stop();
      setStatus('playing');
      try {
        if (seeded) {
          aim(null, null);
          cycleDo({ type: 'reset' });
          for (const action of actionsBefore(index)) cycleDo(action);
          const to = href({ name: 'cycle', stage: beat.stage });
          if (location.hash !== to) location.hash = to;
          setEpoch((e) => e + 1);
          setAt(index);
        } else if (stageNow() !== beat.stage) {
          /* The way on is the cycle's own: Continue, in the move. */
          const on = document.querySelector<HTMLElement>('.cycle__move .cycle__move-next');
          if (on && (on.textContent ?? '').trim().startsWith('Continue')) await press(on, on, mine, still);
          else location.hash = href({ name: 'cycle', stage: beat.stage });
          aim(null, null);
        }
        await until(() => document.querySelector<HTMLElement>(`.cycle[data-stage="${beat.stage}"] .cycle__work`), mine);
        setAt(index);
        done.current = false;
        if (voicedRef.current) narrator.say([beat.caption, beat.why ?? '']);
        let spent = await sleep(still ? 0 : 400, mine); /* the new screen, before anything points at it */
        for (const step of beat.steps) {
          if ('show' in step) {
            aim(await until(step.show, mine), null);
            spent += await sleep(still ? 0 : 1100, mine);
          } else if ('press' in step) {
            const control = await until(step.press, mine);
            spent += await press(control, step.frame?.() ?? control, mine, still);
          } else {
            for (let i = 0; i < 4; i++) {
              const control = i === 0 ? await until(step.pressWhile, mine) : step.pressWhile();
              if (!control) break;
              spent += await press(control, step.frame?.() ?? control, mine, still);
              spent += await sleep(still ? 0 : 700, mine);
            }
          }
        }
        if (!still) {
          await sleep(Math.max(1600, holdOf(beat) - spent), mine);
          /* The beat moves on once its words have been said, however long the voice takes. */
          await narrator.idle();
          if (token.current !== mine) throw CANCELLED;
          await sleep(300, mine);
        }
        done.current = true;
        if (index === BEATS.length - 1) {
          aim(null, null);
          setStatus('ended');
          if (voicedRef.current) narrator.say([CLOSING.caption, CLOSING.why]);
        } else if (still) {
          setStatus('paused', true);
        } else {
          again.current(index + 1, false);
        }
      } catch (problem) {
        if (problem === CANCELLED || token.current !== mine) return;
        /* A control the tour presses is not where it was: someone pressed
           something in the page, most likely. Put the beat back once, and if
           that fails too, hand the page over rather than hang. */
        if (retried) leave();
        else again.current(index, true, true);
      }
    },
    [aim, cycleDo, leave, narrator, press, setAt, setStatus, sleep, until],
  );

  useEffect(() => {
    again.current = (index, seeded, retried) => void run(index, seeded, retried);
  }, [run]);

  const start = useCallback(() => void run(0, true), [run]);
  const next = useCallback(() => {
    const i = atRef.current;
    if (statusRef.current === 'ended' || i >= BEATS.length - 1) return;
    void run(i + 1, !done.current);
  }, [run]);
  const back = useCallback(() => {
    const i = statusRef.current === 'ended' ? BEATS.length : atRef.current;
    if (i > 0) void run(i - 1, true);
  }, [run]);
  const playPause = useCallback(() => {
    const s = statusRef.current;
    if (s === 'ended') start();
    else if (s === 'playing') setStatus('paused');
    else if (token.current === 0) void run(atRef.current, true); /* opened on a beat that was never played */
    else if (done.current) next(); /* a beat that finished and waited, as every beat does under reduced motion */
    else setStatus('playing');
  }, [next, run, setStatus, start]);

  /* Narration on or off, remembered. Turned off, the voice stops and the
     beat moves on by its own clock; turned on, it reads the line on screen. */
  const setVoiced = useCallback(
    (on: boolean) => {
      voicedRef.current = on;
      setVoicedState(on);
      rememberNarration(on);
      if (!on) return narrator.stop();
      const s = statusRef.current;
      const words = s === 'ended' ? [CLOSING.caption, CLOSING.why] : [BEATS[atRef.current].caption, BEATS[atRef.current].why ?? ''];
      narrator.setPaused(s === 'paused' && !done.current);
      narrator.say(words);
    },
    [narrator],
  );

  const active = status !== 'off';

  /* The ring and the pointer follow what they mark while the page settles under them. */
  useEffect(() => {
    if (!active) return;
    const id = setInterval(measure, 100);
    window.addEventListener('resize', measure);
    return () => {
      clearInterval(id);
      window.removeEventListener('resize', measure);
    };
  }, [active, measure]);

  /* Room at the foot of the page for the bar, so the last thing on a screen can be scrolled clear of it. */
  useEffect(() => {
    if (!active) return;
    document.documentElement.dataset.tour = '';
    return () => {
      delete document.documentElement.dataset.tour;
    };
  }, [active]);

  /* Focus goes to the bar when the tour opens, and stays there through the
     tour's own presses. A press on the page by the person pauses the tour:
     two hands on one screen is a fight, and theirs wins. */
  useEffect(() => {
    if (!active) return;
    toggle.current?.focus({ preventScroll: true });
    let theirs = 0;
    let held: HTMLElement | null = toggle.current;
    /* Only Tab and a pointer move focus by a person's own hand. An arrow or
       Space pressed in the bar does not, so focus that leaves just after one
       left because the tour pressed something, and it comes back. */
    const user = (e: Event) => {
      if (!e.isTrusted) return;
      if (e.type === 'pointerdown' || (e as KeyboardEvent).key === 'Tab') theirs = performance.now();
      if (e.type === 'pointerdown' && !bar.current?.contains(e.target as Node) && statusRef.current === 'playing') setStatus('paused');
    };
    const onFocus = (e: FocusEvent) => {
      const to = e.target as HTMLElement;
      if (bar.current?.contains(to)) held = to;
      else if (performance.now() - theirs < 200) held = null; /* they moved it: leave it where they put it */
      else if (held?.isConnected) held.focus({ preventScroll: true });
      else if (held) toggle.current?.focus({ preventScroll: true });
    };
    const onKey = (e: KeyboardEvent) => {
      user(e);
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      if (document.querySelector('dialog[open], [aria-modal="true"]')) return;
      const here = document.activeElement;
      if (here !== document.body && !bar.current?.contains(here)) return;
      /* The settings menu keeps its own keys: Escape closes it, not the tour, and its arrows move a choice, not a step. */
      if (settingsOpenRef.current) {
        if (e.key !== 'Escape') return;
        setSettingsOpen(false);
        e.preventDefault();
        return;
      }
      if (e.key === 'Escape') leave();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') back();
      else return;
      e.preventDefault();
    };
    document.addEventListener('pointerdown', user, true);
    document.addEventListener('focusin', onFocus);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', user, true);
      document.removeEventListener('focusin', onFocus);
      window.removeEventListener('keydown', onKey);
    };
  }, [active, back, leave, next, setSettingsOpen, setStatus]);

  /* The bar's own controls change with the tour (Replay where Pause was), and
     a control that leaves the page takes focus with it, silently. */
  useEffect(() => {
    if (active && document.activeElement === document.body) toggle.current?.focus({ preventScroll: true });
  }, [active, status]);

  const api = useMemo<TourApi>(() => ({ available: true, active, epoch, start }), [active, epoch, start]);

  const ended = status === 'ended';
  const beat = BEATS[at];
  const caption = ended ? CLOSING.caption : beat.caption;
  const why = ended ? CLOSING.why : beat.why;
  const decision = !ended && !!beat.decision;
  const stageAt: StageId = beat.stage;

  return (
    <TourContext.Provider value={api}>
      {children}
      <div ref={layer} className="tour-layer" data-surface="review" aria-hidden="true">
        <div ref={probe} className="tour-layer__probe" />
        {active && ring ? (
          <div
            className="tour-layer__ring"
            data-decision={decision || undefined}
            style={{ translate: `${ring.x}px ${ring.y}px`, width: ring.w, height: ring.h }}
          />
        ) : null}
        {active && tip && !reduced() ? (
          <div className="tour-layer__pointer" data-pressing={pressing || undefined} style={{ translate: `${tip.x + tip.w / 2}px ${tip.y + tip.h / 2}px` }}>
            <Icon name="cursor" size={20} />
          </div>
        ) : null}
      </div>
      {active ? (
        <section ref={bar} className="tour" data-surface="review" data-decision={decision || undefined} aria-label="Guided tour">
          {/* The plain way out (2026-11-18), in the corner where a reader looks for
              one: the same as Escape, the page left where the tour got to. First
              in the bar, so a keyboard meets it as an eye does. Until the same
              day a "Take over" button beside the transport did the same thing;
              with the close there, it was the second way to say one thing. */}
          <IconButton className="tour__close" icon="x" label="Close the tour" tooltip="end" onClick={() => leave()} />
          <ol className="tour__chapters" role="list">
            {STAGES.map((st, i) => {
              const first = firstBeatOf(st.id);
              const count = BEATS.filter((b) => b.stage === st.id).length;
              const filled = ended ? 1 : Math.min(1, Math.max(0, (at - first + 1) / count));
              const current = !ended && st.id === stageAt;
              return (
                <li key={st.id}>
                  <Button
                    className="tour__chapter"
                    size="compact"
                    variant="ghost"
                    aria-current={current ? 'step' : undefined}
                    onClick={() => void run(first, true)}
                  >
                    <span className="tour__chapter-num">{i + 1}</span>
                    <span className="tour__chapter-name">{st.name}</span>
                    <span className="tour__chapter-track">
                      <span className="tour__chapter-fill" style={{ scale: `${filled} 1` }} />
                    </span>
                  </Button>
                </li>
              );
            })}
          </ol>
          <div className="tour__body">
            <div className="tour__says" aria-live="polite" aria-atomic="true">
              <div key={ended ? 'end' : at} className="tour__beat">
                {decision ? (
                  <Badge className="tour__mark" tone="accent" icon="user">
                    The designer decides
                  </Badge>
                ) : null}
                <p className="tour__caption">{caption}</p>
                {why ? <p className="tour__why">{why}</p> : null}
              </div>
            </div>
            <div className="tour__controls">
              {canNarrate ? (
                <span className="tour__narration">
                  <IconButton className="tour__voice" icon={voiced ? 'speaker' : 'speaker-off'} label="Narration" pressed={voiced} onClick={() => setVoiced(!voiced)} />
                  {/* It stays with narration off, disabled: hidden, a reader who
                      never turned narration on never learned it existed. */}
                  <span ref={settings} className="tour__settings">
                    <Button
                      ref={settingsButton}
                      className="tour__settings-open"
                      variant="ghost"
                      size="compact"
                      trailingIcon="chevron-down"
                      aria-haspopup="dialog"
                      aria-expanded={settingsOpen}
                      disabled={!voiced}
                      onClick={() => setSettingsOpen(!settingsOpen)}
                    >
                      <span className="visually-hidden">Voice and speed: </span>
                      <span className="tour__settings-voice">{voiceName ? voiceLabel({ name: voiceName }) : 'Voice'}</span>
                      <span aria-hidden="true"> · </span>
                      <span className="visually-hidden">, </span>
                      {rate}×
                    </Button>
                    {settingsOpen && voiced ? (
                      <div className="tour__menu" role="dialog" aria-label="Voice and speed">
                        <p className="tour__menu-label">Speed</p>
                        <SegmentedControl
                          className="tour__rates"
                          label="Speed"
                          options={SPEEDS}
                          value={String(rate)}
                          onChange={(v) => chooseRate(Number(v))}
                        />
                        <p className="tour__menu-label">Voice</p>
                        <div className="tour__voices" role="radiogroup" aria-label="Voice" onKeyDown={onVoiceKey}>
                          {(voices.length ? voices : [{ name: voiceName, label: voiceName ? voiceLabel({ name: voiceName }) : 'System voice' }]).map((v) => {
                            const checked = v.name === voiceName;
                            return (
                              <button
                                key={v.name}
                                type="button"
                                role="radio"
                                aria-checked={checked}
                                data-voice={v.name}
                                tabIndex={checked ? 0 : -1}
                                className="tour__voice-option"
                                onClick={() => chooseVoice(v.name)}
                              >
                                <span>{v.label}</span>
                                {checked ? <Icon name="check" size={16} /> : null}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </span>
                </span>
              ) : null}
              {/* The transport, apart from the voice's switch by a gap, with
                  play and pause the one filled control, so it is the first
                  thing found and a pause shows on it. */}
              <span className="tour__transport">
              {ended ? (
                <>
                  <Button variant="primary" trailingIcon="arrow-right" onClick={() => leave(true)}>
                    Explore the prototype
                  </Button>
                  <Button ref={toggle} variant="ghost" leadingIcon="undo" onClick={start}>
                    Replay
                  </Button>
                </>
              ) : (
                <>
                  <IconButton className="tour__step" icon="arrow-left" label="Previous step" disabled={at === 0} onClick={back} />
                  <IconButton ref={toggle} className="tour__toggle" icon={status === 'playing' ? 'pause' : 'play'} label={status === 'playing' ? 'Pause the tour' : 'Play the tour'} onClick={playPause} />
                  <IconButton className="tour__step" icon="arrow-right" label="Next step" tooltip="end" disabled={at === BEATS.length - 1} onClick={next} />
                </>
              )}
              </span>
            </div>
          </div>
          <div className="tour__foot">
            <Badge variant="quiet" icon="play">
              Simulated demo
            </Badge>
            <span className="tour__where">
              {ended ? 'The end' : `Step ${at + 1} of ${BEATS.length}`}
              {status === 'paused' ? ' · Paused' : ''}
            </span>
          </div>
        </section>
      ) : null}
    </TourContext.Provider>
  );
}
