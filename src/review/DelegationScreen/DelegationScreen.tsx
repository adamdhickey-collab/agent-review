import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { Badge, Button, Disclosure, Icon, IconButton } from '../../components';
import { useStore } from '../../app/store';
import { href } from '../../app/router';
import { account, activeRule, ruleText, waitingOn, whyAsking, wordsOf, wouldSettle, type Action, type DelegationState, type Pattern, type RunId, type Work } from '../../data/delegation';
import { plural, relativeTime } from '../format';
import { OutcomeFacts, OutcomeSummary } from '../OutcomeSummary/OutcomeSummary';
import { DecisionHead, DecisionRead, DecisionRequest, type RulePreview } from '../DecisionRequest/DecisionRequest';
import { DecisionPreview, type PreviewView } from '../DecisionPreview/DecisionPreview';
import { DecisionRecord } from '../DecisionRecord/DecisionRecord';
import { RecordHead, WorkRecord } from '../WorkRecord/WorkRecord';
import { Boundaries } from '../Boundaries/Boundaries';
import './DelegationScreen.css';
import { Inline } from '../Inline';
import { startSteps, type StartStep } from './steps';

/* Work an agent was handed, and what came of it. It was the front door
   until 2026-10-23, when a start screen went in front of it (StartScreen):
   it is at "/runs/billing" now, and "/" says what this screen is before a
   person meets it. The
   review queue asks a person to look at every change; this screen is built
   for the case that should become ordinary as agents get better, where
   most of the work needed nobody, and says so first.

   In order: that this is a simulation, and a way back to its start; what
   was delegated, by whom; the account (OutcomeSummary); the decisions that
   need the person, each a DecisionRequest; and the completed work, each a
   WorkRecord, newest first. Beside it, or under it on a narrow screen, the
   boundaries the agent works inside and the rules the person has added.

   When nothing needs the person, the "Needs you" section is not there at
   all. The account says "Nothing needs your attention." and the work is
   below it. Nothing is invented to fill the space.

   The screen owns behaviour, the components own markup. Every change of
   state is an action on the store's reducer (data/delegation.ts). After an
   answer the card that asked is gone, so focus goes to what comes next: the
   next question's section, or the account once none is left. What happened
   is said in a visible line that is also a live region.

   READ AT A GLANCE, SINCE 2026-10-04. The screen said everything in
   sentences, and a person arriving at it read a paragraph before they knew
   how the run had gone. Now: the simulation is a labelled strip with a
   real button to reset it; the header is who and when on one line and the
   title, with the request one press away; the account is a bar and badges
   (OutcomeSummary); each decision is its answers (DecisionRequest); the
   completed work labels its check columns once, marks only the work that
   was not done on its own, and folds the routine swaps, where every check
   passed and nothing needed judgment, into one row; and the boundaries are
   three counted rows (Boundaries). Nothing was removed that the person can
   act on, and nothing simulated is said as if it were real.

   TWO RUNS, SINCE 2026-10-07. The billing run's decision is missing
   intent: an action built by hand to be quiet, "Cancel subscription", and
   no check can say whether it should stay that way (two reds until
   2026-10-21; data/billing.ts, THE TRADE-OFF). A second
   run, the shared table, is a permission boundary: the agent knows exactly
   how to make the fix, and the fix is in a component forty screens share.
   The strip that says this is a simulation also says which one is playing,
   and switches between them. They are links, not the system's
   SegmentedControl, because a run is a place with an address
   (#/runs/shared-table), so it can be linked to, bookmarked and gone back
   from, and following one moves focus to the new run's title the way any
   change of screen does; a radio group that navigated would take focus
   away from the arrow key that moved it. Each run keeps its own state while
   the other is on screen, and Reset puts back the one shown.

   WHAT HAPPENED NEXT, SINCE 2026-10-09. After a decision the card that
   asked is gone, and what used to stand in its place was one grey line.
   It is a result now: a mark for the kind of thing that happened (done,
   taken back, or left open), the sentence, and, when the answer made or
   used a rule, a button to the rule under the boundaries, so a person who
   has just decided can see what the decision became without hunting for
   it. The sentence is still the live region. Nothing is claimed that the
   reducer did not do: the agent merged what the answer settled, and a rule
   exists because the person made one.

   YOUR DECISIONS, SINCE 2026-10-09, LATER. A decision on a trade-off
   leaves a record (DecisionRecord): what the agent did, the person's
   reason, the trade-off they accepted, the risk that remains, the
   follow-up it opened and whether it became a rule. The records are a
   section of their own under the decisions still asking, newest first,
   so the card that asked turns into what it decided a few lines down, and
   the notice points at it.

   PREVIEW STUDIO, SINCE 2026-10-11 (LATER). The screen was a document: the
   decisions were cards in a column, each drawing its two reds as tiles, and
   a person weighed a change to an interface without ever seeing the
   interface. It is a workspace now, in three bands:

   - The chrome: a bar under the app's, on the same ground, holding which
     sample run this is (the links that switch between them), that it is
     simulated, in one quiet line, and the reset. Then the job: who
     delegated it, its title, the request, and the account, counted from
     the fixtures as before, as a band rather than a block.
   - The workspace, for whatever needs the person. On the left, about two
     thirds of it, the interface the decision changes (DecisionPreview),
     with the element marked; under it, what the agent read and found
     (DecisionRead). On the right, the inspector (DecisionRequest): which
     decision this is and of how many, with a way to the others, then the
     decision itself. Selecting a direction there previews it on the left,
     labelled as proposed and not applied; Apply goes through the reducer,
     as every answer always has. One decision at a time, so the preview is
     always of the decision being read; the account and the pager say how
     many others there are.
   - The rest of the run, under the workspace, as it was: the decisions
     made, what the checks established, the completed work, and beside them
     the boundaries and the rules.

   Under 56rem the workspace is one column, the inspector first, then the
   preview, then the read, and nothing is dropped. Nothing is fixed to the
   window's height and nothing scrolls inside anything else: the page grows.

   FIRST MINUTE, SINCE 2026-10-23. Most people who open this have never
   supervised an agent, arrive from a link, and give it a minute. They met a
   run bar, an account of four tiles and a bar of literals, and a preview
   whose buttons looked pressable and did nothing; the buttons that move the
   demo were under the fold of a laptop, three screens down on a phone; and
   applying the first decision made "2 decisions need you" read "4". So:

   - The question first. The account's sentence stays over the workspace;
     its tiles and bar lead the rest of the run (OutcomeSummary, `part`).
     The inspector comes before the preview in the document, so a phone
     opens on the question and a screen reader hears it first; on a wide
     screen the grid still draws the interface on the left.
   - Start here takes you there. Each step is a button that brings what it
     names into view and focuses it, ringed: the interface, the directions,
     the proposed interface, the plan and Apply (StartHere).
   - The picture of the product is a picture. Its buttons keep their look
     and lose their press and their tab stop (Sketch.tsx); the customer
     list, which is the real screen, stays usable.
   - The interface stays beside the choice. When the preview and the read
     together are too tall to follow, the preview follows alone (useFollow),
     so selecting a direction and reading its plan keeps the proposed
     interface in view.
   - The first answer ends something. In place of the workspace, one panel
     says what the answer did, in the reducer's words, why more may be
     asking now, and two ways on: the other run, or the next decision here
     (FirstMinute). The next decision comes after it, not instead of it. */

/* The runs, as the switch names them: what each is about, in two words. */
const RUNS: { id: RunId; label: string; kind: string }[] = [
  { id: 'billing', label: 'Quiet cancel', kind: 'missing intent' },
  { id: 'shared-table', label: 'Shared table', kind: 'a permission boundary' },
];

/* The shorter of the workspace's two columns follows the page while the
   longer one is read, so the interface stays beside the reasoning about it
   (or the decision beside a long read): but only when the whole of it fits
   the window, so following never holds any of it out of view, and only
   while there are two columns (the stylesheet says when). Measured rather
   than assumed, because which is shorter depends on the decision and on
   what is open in it; re-measured whenever either changes size.

   Since 2026-10-23 there is a third case. When the interface and the read
   under it are together too tall for the window but the decision is longer
   still, the preview follows on its own: the stage stretches to the row so
   the preview has somewhere to travel, and the read passes under it. That is
   the case a direction's plan makes, and the reason for it: the proposed
   interface stays beside the plan and Apply. The stage's height is measured
   from its contents, not its box, because the box is the row's once it
   stretches. */
function useFollow(a: RefObject<HTMLElement | null>, b: RefObject<HTMLElement | null>, key: string) {
  useLayoutEffect(() => {
    const one = a.current;
    const two = b.current;
    if (!one || !two) return;
    const decide = () => {
      const zoom = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
      const room = window.innerHeight - 2 * 16 * zoom; /* --space-4 above and below, at the page's zoom */
      const first = one.firstElementChild;
      const last = one.lastElementChild;
      const h1 = first && last ? last.getBoundingClientRect().bottom - first.getBoundingClientRect().top : one.getBoundingClientRect().height;
      const h2 = two.getBoundingClientRect().height;
      const preview = one.querySelector<HTMLElement>(':scope > .studio-preview');
      const hp = preview?.getBoundingClientRect().height ?? Infinity;
      const stage = h1 < h2 && h1 <= room;
      const inspector = h2 < h1 && h2 <= room;
      const alone = !stage && !inspector && hp < h2 && hp <= room;
      one.toggleAttribute('data-follows', stage);
      one.toggleAttribute('data-holds', alone);
      two.toggleAttribute('data-follows', inspector);
      preview?.toggleAttribute('data-follows', alone);
    };
    decide();
    const ro = new ResizeObserver(decide);
    /* The stage's contents, not its box: the box is what `decide` stretches,
       and watching it would answer its own change in the same frame. */
    for (const child of Array.from(one.children)) ro.observe(child);
    ro.observe(two);
    window.addEventListener('resize', decide);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', decide);
    };
  }, [a, b, key]);
}

/* START HERE, SINCE 2026-10-12. A first-time reader met the workspace with
   no word on what to do in it: the preview on the left, a question and two
   cards on the right, and an account above both. One line now names the
   immediate task in the order the screen asks for it, and follows the
   person through it: the steps before the current one are marked done, the
   current one is the list's current step, so a screen reader hears the same
   progress the line shows. It names the task; it does not repeat the card's
   explanation, which it replaces (DecisionRequest's "Which trade-off is
   acceptable?" lost the paragraph that said the same thing). The label is
   "Start here" until the person has settled something in the run, and
   "Next" after that.

   A STEP TAKES YOU THERE, SINCE 2026-10-23. The line named the steps and
   could not be pressed, so it said what to do without saying where. Each
   step is a Button now (ghost, compact: chrome, not an action on the work),
   and pressing it brings what it names into view and focuses it, ringed
   (DelegationScreen.css, POINTED AT): the interface for the first step; the
   directions or answers for choosing; for previewing, the interface turned
   to Proposed; for applying, the plan and Apply. A step that needs a choice
   made first, before there is one, goes to the choice. Nothing is decided
   by a step; it only moves the person's eye and focus. */
function StartHere({ work, chosen, first, onStep }: { work: Work; chosen: boolean; first: boolean; onStep: (step: StartStep) => void }) {
  const steps = startSteps(work);
  const at = chosen ? steps.length - 1 : 0;
  return (
    <section className="studio__start" aria-labelledby="start-label">
      <p className="studio__start-label" id="start-label">
        {first ? 'Start here' : 'Next'}
      </p>
      <ol className="studio__start-steps" role="list">
        {steps.map((step, i) => (
          <li key={step.label} role="listitem" aria-current={i === at ? 'step' : undefined} data-done={i < at || undefined}>
            <Button variant="ghost" size="compact" className="studio__start-step" onClick={() => onStep(step.to)}>
              <span className="studio__start-num" aria-hidden="true">
                {i < at ? <Icon name="check" size={14} /> : i + 1}
              </span>
              {step.label}
              {i < at ? <span className="visually-hidden"> (done)</span> : null}
            </Button>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* THE DESK, SINCE 2026-10-24. On a laptop the workspace read as a page: an
   account, a line of steps, the interface, and a decision panel that ran past
   the window, so the question and Apply were never on screen together, and a
   step only ringed a box. From 76rem the workspace is a desk the height of
   the window, in three columns that scroll on their own:

   - The queue, on the left: what needs the person, numbered in the warning's
     solid, the one in view marked; and the completed work, each with its
     check, one press from its record below.
   - The interface, in the middle, as the decision would change it
     (DecisionPreview), the element and its neighbor marked.
   - The decision, on the right. Its band, in the one solid ground the light
     scheme has, holds which decision this is, its kind and the question, and
     the steps (DeskSteps). The steps are the panel's pages, not places to
     scroll to: Compare is what the agent found and why it needs a person;
     Choose is the directions; Preview turns the interface to Proposed and
     says what the agent will do; Apply adds the reason and Apply. The panel
     keeps Back and Next at its foot, so the next move is always in view.

   One DecisionRequest stays mounted under every step and shows the step's
   part (DelegationScreen.css, THE DESK), so a reason typed at Apply survives
   a look back at the directions. Under 76rem the workspace is as it was, the
   steps are places again, and nothing is hidden. */
/* The width the desk needs, in the page's own pixels: the window divided by
   the page's zoom (app/scale.css), because a zoomed page lays out narrower
   than the window a media query reads. Under it, the interface's column is
   too narrow for the billing screen's rows to stay on one line. */
const DESK_REM = 76;

function useDeskWide() {
  const measure = () => {
    if (typeof window === 'undefined') return false;
    const zoom = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    return window.innerWidth / zoom >= DESK_REM * rem;
  };
  const [on, setOn] = useState(measure);
  useEffect(() => {
    const change = () => setOn(measure());
    change();
    window.addEventListener('resize', change);
    return () => window.removeEventListener('resize', change);
  }, []);
  return on;
}

/* The desk takes the rest of the window under whatever is above it on a
   fresh load, and never less than a laptop's worth. Measured, because what
   is above it (the run's bar, the job, a notice) wraps differently by width,
   and in visual pixels divided by the page's zoom (app/scale.css). */
function useDeskHeight(desk: RefObject<HTMLElement | null>, above: RefObject<HTMLElement | null>, key: string) {
  useLayoutEffect(() => {
    const el = desk.current;
    if (!el) return;
    const fit = () => {
      const zoom = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
      const top = el.getBoundingClientRect().top + window.scrollY * zoom;
      const room = (window.innerHeight - top) / zoom - 24; /* --space-6, the body's own padding under it */
      el.style.setProperty('--desk-height', `${Math.max(room, 544)}px`); /* 34rem at least */
    };
    fit();
    const ro = new ResizeObserver(fit);
    if (above.current) ro.observe(above.current);
    window.addEventListener('resize', fit);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', fit);
    };
  }, [desk, above, key]);
}

/* The desk's steps: the same words as Start here (steps.ts), as the panel's
   pages. Done steps carry the success solid and a check, the current one the
   warning's; each says its state in words to a screen reader. A step past
   the choice, before there is one, opens Choose. */
const SHORT: Record<StartStep, string> = { look: 'Compare', choose: 'Choose', preview: 'Preview', apply: 'Apply' };

function DeskSteps({ work, at, onStep }: { work: Work; at: StartStep; onStep: (step: StartStep) => void }) {
  const steps = startSteps(work);
  const here = Math.max(0, steps.findIndex((s) => s.to === at));
  return (
    <ol className="desk__steps" aria-label="Steps">
      {steps.map((step, i) => (
        <li key={step.to} aria-current={i === here ? 'step' : undefined} data-done={i < here || undefined}>
          <Button variant="ghost" size="compact" className="desk__step" onClick={() => onStep(step.to)}>
            <span className="desk__step-num" aria-hidden="true">
              {i < here ? <Icon name="check" size={12} /> : i + 1}
            </span>
            {/* Named as a step, so it is never mistaken for the act it names: "Step 4: Apply" is not Apply. */}
            <span className="visually-hidden">Step {i + 1}: </span>
            {step.to === 'look' ? (work.question?.kind === 'scope' ? 'Look' : 'Compare') : SHORT[step.to]}
            {i < here ? <span className="visually-hidden"> (done)</span> : null}
          </Button>
        </li>
      ))}
    </ol>
  );
}

/* THE FIRST MINUTE ENDS, SINCE 2026-10-23. The first answer in a run used to
   be followed by the next question at once, and in the billing run by more
   of them than before: answered once, the three changes held behind the
   first decision each ask, so "2 decisions need you" became "4". A person
   who had just done the one thing the screen exists for met a longer list
   and no sign they had done it.

   So the first answer ends something. In the workspace's place, one panel:
   what the answer did, in the reducer's own sentence (the notice's, which
   stays the live region); the record it left, one press away; when changes
   that were held behind it are asking now, why, in a sentence; and two ways
   on, the other sample run or the next decision here. It claims nothing the
   reducer did not do, and it comes once per run: after it, the workspace is
   as it always was. */
function FirstMinute({
  state,
  answered,
  other,
  onRecord,
  onNext,
  onLeave,
  titleRef,
}: {
  state: DelegationState;
  answered: string;
  other: (typeof RUNS)[number];
  onRecord?: () => void;
  onNext: () => void;
  /** Going to the other run ends it too, so coming back finds the workspace. */
  onLeave: () => void;
  titleRef: RefObject<HTMLHeadingElement | null>;
}) {
  const asking = account(state).asking;
  const held = asking.filter((w) => w.waitsOn === answered);
  const ruled = Boolean(state.noticeRule);
  return (
    <section className="studio-end" aria-labelledby="end-title">
      <h2 ref={titleRef} id="end-title" className="studio-end__title" tabIndex={-1}>
        <Icon name="status-passed" size={20} />
        That’s the loop
      </h2>
      <p className="studio-end__lead">The agent stopped at a question only a person could answer. You answered it, and it acted on your answer.</p>
      <ul className="studio-end__facts">
        <li>
          <p>
            <strong>What happened.</strong> <Inline text={state.notice ?? ''} />
          </p>
        </li>
        {onRecord ? (
          <li>
            <p>
              <strong>On record.</strong> Your reason, the trade-off you accepted and the risk that remains are in the decision record.
            </p>
            <Button size="compact" variant="secondary" onClick={onRecord}>
              See the decision record
            </Button>
          </li>
        ) : null}
        {held.length ? (
          <li>
            <p>
              <strong>
                Why {held.length} more {held.length === 1 ? 'is' : 'are'} asking.
              </strong>{' '}
              {ruled ? whyAsking(state, held[0]) : 'You decided for this change only. A decision kept for similar cases settles the ones it covers without asking you.'}
            </p>
          </li>
        ) : null}
      </ul>
      <div className="studio-end__next">
        <Button variant="primary" onClick={onNext}>
          {asking.length ? 'Keep going here' : 'See the finished run'}
        </Button>
        <a className="studio-end__other" href={href({ name: 'delegation', run: other.id })} onClick={onLeave}>
          Try the other run: {other.label}, {other.kind}
        </a>
      </div>
    </section>
  );
}

/* Work with nothing to look at: made on its own, every check passed on the
   first run, nothing chosen by meaning. Folded into one row. */
function routine(w: Work): boolean {
  return (
    w.status === 'made' &&
    w.basis?.kind === 'boundary' &&
    !w.unchecked &&
    (w.checks ?? []).every((c) => c.state === 'passed' && !c.earlier)
  );
}

function latest(w: Work): string {
  return w.history[w.history.length - 1]?.at ?? '';
}

export function DelegationScreen({ run = 'billing', layout }: { run?: RunId; /** The desk or the one-column workspace, whatever the window: for a story. Left out, the window decides (THE DESK). */ layout?: 'desk' | 'studio' }) {
  const { runs, delegate: dispatch, resetDelegation } = useStore();
  const s = runs[run];
  const delegate = (action: Action) => dispatch(run, action);
  const words = wordsOf(s.brief);
  const a = account(s);
  const needs = useRef<HTMLHeadingElement>(null);
  const lead = useRef<HTMLParagraphElement>(null);
  const top = useRef<HTMLHeadingElement>(null);
  const bounds = useRef<HTMLElement>(null);
  const records = useRef<Record<string, HTMLElement | null>>({});
  const end = useRef<HTMLHeadingElement>(null);
  const focusNext = useRef(false);

  /* Which decision the workspace shows, and what is selected in each. The
     decision is kept by id, so an answer elsewhere doesn't move it, and by
     position, so that once it is answered the workspace shows the one that
     took its place. A selection is kept per decision, so the preview and
     the inspector read the same one, and going to another decision and
     back finds it as it was left. */
  const [at, setAt] = useState<{ id?: string; index: number }>({ index: 0 });
  const [chosen, setChosen] = useState<Record<string, string | undefined>>({});
  const [views, setViews] = useState<Record<string, PreviewView>>({});
  /* The run whose first answer is being shown its end (FirstMinute), and the
     change that answer was about, until the person moves on. */
  const [ending, setEnding] = useState<{ run: RunId; id: string } | null>(null);
  /* The desk (THE DESK): whether the window is wide enough for it, and the
     page each decision's panel is on, kept per decision like its choice. */
  const wide = useDeskWide();
  const desk = layout ? layout === 'desk' : wide;
  const [pages, setPages] = useState<Record<string, StartStep>>({});
  const header = useRef<HTMLElement>(null);
  const deskRef = useRef<HTMLElement>(null);
  const deskBody = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!focusNext.current) return;
    focusNext.current = false;
    (end.current ?? needs.current ?? lead.current)?.focus();
  });

  /* Whether an answer can become a rule, and the rule as it would read. Only
     an answer that carries a draft can (data/delegation.ts, RuleDraft): an
     answer about what a value means, or keeping a fix on the screen asked
     about. Allowing a change past a boundary never can, and says why. */
  const preview = useCallback(
    (w: Work) =>
      (optionId: string): RulePreview => {
        const pattern = w.question?.pattern;
        const draft = w.question?.options.find((o) => o.id === optionId)?.rule;
        if (!pattern || !draft) return { offer: 'none', settles: [] };
        const current = activeRule(s);
        if (current && current.answer !== optionId) return { offer: 'conflict', settles: [], existing: ruleText(current) };
        const covers: Pattern[] = current ? Array.from(new Set([...current.covers, pattern])) : [pattern];
        const rule = { answer: optionId, covers, text: draft.text, where: draft.where, does: draft.does };
        const settles = wouldSettle(s, rule, w.id).filter((x) => x.id !== w.id);
        return { offer: current ? 'widen' : 'make', text: ruleText(rule), excludes: draft.excludes, scope: draft.scope, fixed: Boolean(draft.text), settles };
      },
    [s],
  );

  const done = [...a.made, ...a.reverted, ...a.left].sort((x, y) => latest(y).localeCompare(latest(x)));
  const notable = done.filter((w) => !routine(w));
  const easy = done.filter(routine);
  const asking = a.asking;
  const found = asking.findIndex((w) => w.id === at.id);
  const index = found >= 0 ? found : Math.min(at.index, Math.max(asking.length - 1, 0));
  const current = asking[index];
  const go = (i: number) => setAt({ id: asking[i]?.id, index: i });
  const choice = current ? chosen[current.id] : undefined;
  /* What the preview can show of a selection: a direction or an answer, but
     not more evidence, which decides nothing and changes nothing. */
  const previewing = current?.question?.options.find((o) => o.id === choice && !o.asks);
  const view: PreviewView = current && previewing ? (views[current.id] ?? 'proposed') : 'current';

  const ended = ending?.run === run && a.settled.length > 0 ? ending : null;
  const other = RUNS.find((r) => r.id !== run)!;

  const stage = useRef<HTMLDivElement>(null);
  const inspector = useRef<HTMLDivElement>(null);
  useFollow(stage, inspector, `${current?.id ?? ''}:${ended ? 'ended' : ''}:${desk}`);

  const onDesk = desk && Boolean(current) && !ended;
  useDeskHeight(deskRef, header, `${onDesk}:${current?.id ?? ''}`);
  const tradeoff = Boolean(current?.question?.options.some((o) => o.benefits));
  const order = current ? startSteps(current).map((x) => x.to) : [];
  /* A page past the choice with nothing chosen (after Reset, or a choice let
     go from the card) is Choose. */
  const kept: StartStep = current ? (pages[current.id] ?? 'look') : 'look';
  const page: StartStep = (kept === 'preview' || kept === 'apply') && !previewing ? 'choose' : kept;
  const before = order[order.indexOf(page) - 1];
  const after = order[order.indexOf(page) + 1];

  /* Turning the desk's panel to a page (THE DESK). A page past the choice,
     before there is one, is Choose. Choose, for an answer rather than a
     direction, lets the answer go, because its card shows the answers or the
     chosen one, never both. The interface follows: as it is while the person
     compares and chooses, as proposed once they preview. Focus goes to the
     top of the panel's page, which is what changed. */
  const turn = (to: StartStep) => {
    if (!current) return;
    const page = (to === 'preview' || to === 'apply') && !previewing ? 'choose' : to;
    if (page === 'choose' && !tradeoff && choice) setChosen((m) => ({ ...m, [current.id]: undefined }));
    setPages((m) => ({ ...m, [current.id]: page }));
    setViews((m) => ({ ...m, [current.id]: page === 'preview' || page === 'apply' ? 'proposed' : 'current' }));
    deskBody.current?.scrollTo({ top: 0 });
    deskBody.current?.focus({ preventScroll: true });
  };

  /* A completed change, from the desk's queue: its record below, or the
     section when it is folded among the routine ones. */
  const seeWork = (w: Work) => {
    const el = document.getElementById(`work-${w.id}`);
    const target = el && el.offsetParent ? el : document.getElementById('done-title');
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target?.scrollIntoView({ block: 'start', behavior: still ? 'auto' : 'smooth' });
  };

  /* The first answer in a run that decides something (more evidence
     decides nothing) ends the first minute. */
  const answer = (w: Work, option: string, makeRule: boolean, reason?: string) => {
    focusNext.current = true;
    setAt({ index });
    if (a.settled.length === 0 && !w.question?.options.find((o) => o.id === option)?.asks) setEnding({ run, id: w.id });
    delegate({ type: 'answer', id: w.id, option, makeRule, reason });
  };

  /* Where a step of Start here takes the person (StartHere). Into view, then
     focus, which the stylesheet rings on these destinations alone; smoothly,
     unless they have asked for less motion. */
  const point = (el: HTMLElement | null | undefined) => {
    if (!el) return;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ block: 'nearest', behavior: still ? 'auto' : 'smooth' });
    el.focus({ preventScroll: true });
  };
  const step = (to: StartStep) => {
    const screen = stage.current?.querySelector<HTMLElement>('.studio-preview');
    const choices = inspector.current?.querySelector<HTMLElement>('.ask__options');
    const plan = inspector.current?.querySelector<HTMLElement>('.ask__confirm');
    if (to === 'look') return point(screen ?? choices);
    if (to === 'choose') return point(choices ?? plan);
    if (!previewing || !current) return point(choices ?? plan);
    if (to === 'preview') {
      setViews((m) => ({ ...m, [current.id]: 'proposed' }));
      return point(screen);
    }
    return point(plan);
  };

  const record = (w: Work) => (
    <WorkRecord
      work={w}
      boundaries={s.boundaries}
      line={words.line}
      rule={w.basis?.kind === 'rule' ? s.rules.find((r) => w.basis?.kind === 'rule' && r.id === w.basis.ruleId) : undefined}
      onRevert={() => delegate({ type: 'revert', id: w.id })}
      onRestore={() => delegate({ type: 'restore', id: w.id })}
    />
  );

  return (
    <div className="delegation" data-desk={onDesk || undefined}>
      {/* The run's own bar, in the chrome under the app's: which sample run
          this is, that it is one, and the way back to its start. */}
      <div className="delegation__runbar">
        <div className="delegation__runbar-inner">
          <nav className="delegation__runs" aria-label="Sample runs">
            {RUNS.map((r) => (
              <a key={r.id} className="delegation__run" href={href({ name: 'delegation', run: r.id })} aria-current={r.id === run ? 'page' : undefined}>
                {r.label}
                <span className="visually-hidden">, {r.kind}</span>
              </a>
            ))}
          </nav>
          <div className="delegation__sim" role="note" aria-label="About this screen">
            <Badge variant="quiet" icon="play" className="delegation__sim-label">
              Simulated
            </Badge>
            <p>A sample run, played back the same way every time. No model runs, and no real repository is touched.</p>
          </div>
          <Button
            size="compact"
            variant="secondary"
            leadingIcon="undo"
            onClick={() => {
              resetDelegation(run);
              setAt({ index: 0 });
              setChosen({});
              setViews({});
              setPages({});
              setEnding(null);
              top.current?.focus();
            }}
          >
            Reset the demo
          </Button>
        </div>
      </div>

      <div className="delegation__body">
        <header ref={header} className="delegation__header">
          <div className="delegation__heading">
            <p className="delegation__by">
              <Icon name="bot" size={16} />
              <span>
                Delegated to {s.brief.agent.name} by {s.brief.by.name} <span aria-hidden="true">·</span> {relativeTime(s.brief.delegatedAt)}
              </span>
            </p>
            <h1 ref={top} className="delegation__title" tabIndex={-1}>
              {s.brief.title}
            </h1>
            <Disclosure className="delegation__request" summary={`${s.brief.by.name.split(' ')[0]}’s request`}>
              <p>
                {s.brief.request} <span className="delegation__request-meta">Last active {s.brief.lastActive}, in <code>{s.brief.repo}</code>.</span>
              </p>
            </Disclosure>
          </div>

          <OutcomeSummary ref={lead} state={s} part="lead" />
        </header>

        {/* While the first minute's end is up, it says what the notice says,
            and more, and focus is on it; the notice stays in the tree, as
            the live region, and empty, so nothing is said twice. */}
        <div className="delegation__notice" data-kind={s.noticeKind} aria-live="polite">
          {s.notice && !ended ? (
            <>
              <Icon name={s.noticeKind === 'back' ? 'undo' : s.noticeKind === 'open' ? 'status-inconclusive' : 'status-passed'} size={16} />
              <p>
                <Inline text={s.notice} />
              </p>
              {s.noticeDecision && s.decisions.some((d) => d.id === s.noticeDecision) ? (
                <Button
                  size="compact"
                  variant="secondary"
                  onClick={() => {
                    const el = records.current[s.noticeDecision!];
                    el?.scrollIntoView({ block: 'nearest' });
                    el?.focus();
                  }}
                >
                  See the decision record
                </Button>
              ) : s.noticeRule && s.rules.some((r) => r.id === s.noticeRule && r.status === 'active') ? (
                <Button
                  size="compact"
                  variant="secondary"
                  onClick={() => {
                    bounds.current?.scrollIntoView({ block: 'nearest' });
                    bounds.current?.focus();
                  }}
                >
                  See your rule
                </Button>
              ) : null}
            </>
          ) : null}
        </div>

        {ended ? (
          <FirstMinute
            state={s}
            answered={ended.id}
            other={other}
            titleRef={end}
            onRecord={
              s.noticeDecision && s.decisions.some((d) => d.id === s.noticeDecision)
                ? () => {
                    const el = records.current[s.noticeDecision!];
                    el?.scrollIntoView({ block: 'nearest' });
                    el?.focus();
                  }
                : undefined
            }
            onNext={() => {
              focusNext.current = true;
              setEnding(null);
            }}
            onLeave={() => setEnding(null)}
          />
        ) : current && desk ? (
          <section ref={deskRef} className="desk" aria-labelledby="needs-title">
            <nav className="desk__queue" aria-label="The run’s work">
              <p className="desk__queue-head">
                Needs you <span className="desk__count" data-kind="asking">{asking.length}</span>
              </p>
              <ul className="desk__list">
                {asking.map((w, i) => (
                  <li key={w.id}>
                    <Button variant="ghost" className="desk__item" aria-current={i === index ? 'true' : undefined} onClick={() => go(i)}>
                      <span className="desk__mark" data-kind="asking" aria-hidden="true">
                        {i + 1}
                      </span>
                      <span className="desk__item-text">
                        <span className="desk__item-title">{w.question?.ask}</span>
                        <span className="desk__item-where">
                          {w.screen}
                          {waitingOn(s, w.id).length ? ` · ${plural(waitingOn(s, w.id).length, 'change')} wait` : ''}
                        </span>
                      </span>
                    </Button>
                  </li>
                ))}
              </ul>
              <p className="desk__queue-head">
                Done <span className="desk__count" data-kind="done">{done.length}</span>
              </p>
              <ul className="desk__list">
                {done.map((w) => (
                  <li key={w.id}>
                    <Button variant="ghost" className="desk__item" onClick={() => seeWork(w)}>
                      <span className="desk__mark" data-kind={w.status === 'made' ? 'done' : 'other'} aria-hidden="true">
                        <Icon name={w.status === 'made' ? 'check' : w.status === 'reverted' ? 'undo' : 'minus'} size={12} />
                      </span>
                      <span className="desk__item-text">
                        <span className="desk__item-title">{w.title}</span>
                        <span className="desk__item-where">{w.screen}</span>
                      </span>
                    </Button>
                  </li>
                ))}
              </ul>
            </nav>

            {/* It scrolls on its own, so it takes a tab stop of its own: a
                keyboard reaches the interface under the fold (WCAG 2.1.1). */}
            <div className="desk__stage" tabIndex={0} role="region" aria-label="The interface the decision changes">
              <DecisionPreview
                work={current}
                option={previewing}
                view={view}
                onViewChange={(v) => setViews((m) => ({ ...m, [current.id]: v }))}
                position={index + 1}
              />
            </div>

            <div className="desk__panel" data-page={page} data-tradeoff={tradeoff || undefined}>
              <div className="desk__band">
                <div className="desk__band-top">
                  <h2 ref={needs} id="needs-title" className="desk__needs" tabIndex={-1}>
                    Needs you <span className="desk__count" data-kind="asking">{asking.length}</span>
                  </h2>
                  <p className="desk__position" aria-live="polite">
                    Decision {index + 1} of {asking.length}
                  </p>
                  {asking.length > 1 ? (
                    <span className="desk__pager">
                      <IconButton icon="chevron-left" label="Previous decision" disabled={index === 0} onClick={() => go(index - 1)} />
                      <IconButton icon="chevron-right" label="Next decision" tooltip="end" disabled={index === asking.length - 1} onClick={() => go(index + 1)} />
                    </span>
                  ) : null}
                </div>
                <DecisionHead work={current} waiting={waitingOn(s, current.id)} titleId="desk-question" />
                <DeskSteps work={current} at={page} onStep={turn} />
              </div>

              <div ref={deskBody} className="desk__body" tabIndex={-1} aria-labelledby="desk-question">
                {page === 'look' ? <DecisionRead work={current} waiting={waitingOn(s, current.id)} onAnswer={(option, makeRule) => answer(current, option, makeRule)} /> : null}
                <DecisionRequest
                  key={current.id}
                  titled="desk-question"
                  work={current}
                  why={current.waitsOn ? whyAsking(s, current) : undefined}
                  boundaries={s.boundaries.filter((b) => current.question!.paused.includes(b.n))}
                  waiting={waitingOn(s, current.id)}
                  preview={preview(current)}
                  choice={choice}
                  onChoiceChange={(next) => {
                    setChosen((m) => ({ ...m, [current.id]: next }));
                    setViews((m) => ({ ...m, [current.id]: next ? 'proposed' : 'current' }));
                    setPages((m) => ({ ...m, [current.id]: next ? (tradeoff ? 'preview' : 'apply') : 'choose' }));
                  }}
                  onAnswer={(option, makeRule, reason) => answer(current, option, makeRule, reason)}
                />
              </div>

              {page === 'apply' ? null : (
                <div className="desk__foot">
                  {before ? (
                    <Button variant="ghost" onClick={() => turn(before)}>
                      Back
                    </Button>
                  ) : null}
                  {page === 'choose' && !previewing ? <p className="desk__hint">{tradeoff ? 'Select a direction to preview it.' : 'Choose an answer to apply it.'}</p> : null}
                  {after ? (
                    <Button variant="primary" className="desk__next" trailingIcon="arrow-right" disabled={page === 'choose' && !previewing} onClick={() => turn(after)}>
                      Next: {SHORT[after].toLowerCase()}
                    </Button>
                  ) : null}
                </div>
              )}
            </div>
          </section>
        ) : current ? (
          <section className="studio" aria-labelledby="needs-title">
            <StartHere work={current} chosen={Boolean(choice)} first={a.settled.length === 0} onStep={step} />
            <div ref={inspector} className="studio__inspector">
              <div className="studio__head">
                <h2 ref={needs} id="needs-title" className="delegation__h2" tabIndex={-1}>
                  Needs you <span className="delegation__count">{asking.length}</span>
                </h2>
                <div className="studio__pager">
                  <p className="studio__position" aria-live="polite">
                    Decision {index + 1} of {asking.length}
                  </p>
                  {asking.length > 1 ? (
                    <>
                      <IconButton icon="chevron-left" label="Previous decision" disabled={index === 0} onClick={() => go(index - 1)} />
                      <IconButton icon="chevron-right" label="Next decision" tooltip="end" disabled={index === asking.length - 1} onClick={() => go(index + 1)} />
                    </>
                  ) : null}
                </div>
              </div>
              <DecisionRequest
                key={current.id}
                work={current}
                why={current.waitsOn ? whyAsking(s, current) : undefined}
                boundaries={s.boundaries.filter((b) => current.question!.paused.includes(b.n))}
                waiting={waitingOn(s, current.id)}
                preview={preview(current)}
                choice={choice}
                onChoiceChange={(next) => {
                  setChosen((m) => ({ ...m, [current.id]: next }));
                  setViews((m) => ({ ...m, [current.id]: 'proposed' }));
                }}
                onAnswer={(option, makeRule, reason) => answer(current, option, makeRule, reason)}
                onSeePreview={() => step('preview')}
              />
            </div>

            <div ref={stage} className="studio__stage">
              <DecisionPreview
                work={current}
                option={previewing}
                view={view}
                onViewChange={(v) => setViews((m) => ({ ...m, [current.id]: v }))}
                position={index + 1}
              />
              <DecisionRead work={current} waiting={waitingOn(s, current.id)} onAnswer={(option, makeRule) => answer(current, option, makeRule)} />
            </div>
          </section>
        ) : null}

        <div className="delegation__layout">
          <div className="delegation__main">
            <OutcomeSummary state={s} part="counts" />
            {s.decisions.length ? (
              <section className="delegation__section" aria-labelledby="decided-title">
                <h2 id="decided-title" className="delegation__h2">
                  Your decisions <span className="delegation__count">{s.decisions.length}</span>
                </h2>
                <p className="delegation__hint">What you decided, why, and what it left to do. A later change follows one only through a rule you made from it.</p>
                <ul className="delegation__decisions">
                  {[...s.decisions].reverse().map((d) => (
                    <li key={d.id}>
                      <DecisionRecord
                        ref={(el) => {
                          records.current[d.id] = el;
                        }}
                        decision={d}
                        work={s.work.find((w) => w.id === d.from)}
                        rule={d.rule ? s.rules.find((r) => r.id === d.rule) : undefined}
                        all={s.work}
                        onSeeRule={() => {
                          bounds.current?.scrollIntoView({ block: 'nearest' });
                          bounds.current?.focus();
                        }}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <OutcomeFacts state={s} />

            <section className="delegation__section delegation__done" aria-labelledby="done-title">
              <h2 id="done-title" className="delegation__h2">
                Completed work <span className="delegation__count">{done.length}</span>
              </h2>
              <p className="delegation__hint">Done on its own unless marked. Open one for what changed, why, and what the checks established.</p>
              <ul className="delegation__records">
                {notable.map((w) => (
                  <li key={w.id} id={`work-${w.id}`}>
                    {record(w)}
                  </li>
                ))}
                {easy.length ? (
                  <li>
                    <Disclosure
                      className="delegation__routine"
                      summary={<RecordHead state="passed" label="Every check passed" title={plural(easy.length, ...words.routine)} where="Every check passed, on the first try" />}
                    >
                      <ul>
                        {easy.map((w) => (
                          <li key={w.id} id={`work-${w.id}`}>
                            {record(w)}
                          </li>
                        ))}
                      </ul>
                    </Disclosure>
                  </li>
                ) : null}
              </ul>
            </section>
          </div>

          <aside className="delegation__aside" aria-label="Boundaries and your rules">
            <Boundaries
              ref={bounds}
              boundaries={s.boundaries}
              by={s.brief.by}
              rules={s.rules}
              work={s.work}
              onEditRule={(id, covers) => delegate({ type: 'edit-rule', id, covers })}
              onRevokeRule={(id) => delegate({ type: 'revoke-rule', id })}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
