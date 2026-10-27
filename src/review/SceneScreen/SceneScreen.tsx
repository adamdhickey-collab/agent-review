import { useEffect, useRef, type ReactNode } from 'react';
import { Badge, Icon, IconSetContext } from '../../components';
import {
  buildOf,
  DIRECTIONS,
  directionOf,
  DISPUTED,
  outcomeOf,
  PRIORITY,
  READINGS,
  REQUIREMENT,
  STAGES,
  stageIndex,
  stopOf,
  type DirectionId,
  type StageId,
} from '../../data/cycle';
import { ArchiveFlow } from '../../product/customers/ArchiveFlow';
import { customers } from '../../product/customers/customers';
import { STORY, type SceneId } from './scenes';
import '../Shell/Shell.css';
import '../CycleScreen/CycleScreen.css';
import './SceneScreen.css';

/* THE SCENES (2026-10-26). Each stage of the design cycle drawn as one
   picture, 16:9, for the case study and the homepage card to capture. They
   used to be drawn on the site in its own type and colors, so the prototype
   a reader met after the case study did not look like the one it described.
   A scene is this app, drawn by its own components and stylesheets: the
   bar, the stage rail, and the stage's one point, at a size that still
   reads when the picture is printed 600 to 700px wide.

   A scene is the stage after the case study's calls (STORY), not a live
   stage: nothing in it is for pressing, and its words are the scenario's
   own, read through the cycle's functions. Each one is captured at its own
   size, 800 by 450, which is below the first zoom step, so the root is
   never scaled. */

/** The batch every direction meets: three active customers, a trial, and
    Monarch Dental Group, which can't be archived (stages.tsx has the same). */
const BATCH = ['c_01HZK3', 'c_01HZK7', 'c_01HZKB', 'c_01HZKF', 'c_01HZKN'];
const BATCH_ROWS = customers.filter((c) => BATCH.includes(c.id));

function Rail({ at }: { at: StageId }) {
  const i = stageIndex(at);
  return (
    <nav className="cycle__rail scene__rail" aria-label="Stages">
      <ol role="list">
        {STAGES.map((st, n) => {
          const inner = (
            <>
              <span className="cycle__rail-num" aria-hidden="true">
                {n < i ? <Icon name="check" size={12} /> : n + 1}
              </span>
              <span className="cycle__rail-name">{st.name}</span>
            </>
          );
          return (
            <li key={st.id}>
              {n > i ? (
                <span className="cycle__rail-locked">{inner}</span>
              ) : (
                <a aria-current={n === i ? 'step' : undefined} data-done={n < i || undefined}>
                  {inner}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function Frame({ at, label, rail = true, children }: { at: StageId; label: string; rail?: boolean; children: ReactNode }) {
  return (
    <div className="scene" data-surface="review">
      <header className="shell__bar scene__bar">
        <span className="shell__brand">
          <span className="shell__mark" aria-hidden="true">
            <Icon name="check" size={14} />
          </span>
          <span>Agent Review</span>
        </span>
        <span className="scene__scenario">
          <Badge variant="quiet" icon="play">
            Simulated
          </Badge>
          Archiving customers without losing control
        </span>
      </header>
      <main className="scene__body">
        {rail ? <Rail at={at} /> : null}
        <h1 className="visually-hidden">{label}</h1>
        {children}
      </main>
    </div>
  );
}

/** Relay inside the review, as a stage frames it. */
function Product({ label, children }: { label: string; children: ReactNode }) {
  return (
    <figure className="cycle__product scene__product">
      <figcaption className="cycle__product-label">
        <Icon name="monitor" size={14} />
        {label}
      </figcaption>
      <div className="cycle__product-frame" data-surface="product">
        <IconSetContext.Provider value="product">{children}</IconSetContext.Provider>
      </div>
    </figure>
  );
}

/** A direction's screen after its own next step: the question, the review,
    or, for undo, the bar after the press, which the scene presses for. */
function Tried({ direction }: { direction: DirectionId }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (direction !== 'undo') return;
    ref.current?.querySelector<HTMLButtonElement>('.btn--danger')?.click();
  }, [direction]);
  return (
    <div ref={ref}>
      <ArchiveFlow direction={direction} customers={BATCH_ROWS} initialSelection={BATCH} initialStep={direction !== 'undo'} />
    </div>
  );
}

/* ---------- the scenes ---------- */

/* The case study's opener: Relay's customers, the batch selected, the
   Archive button one press away. */
function Batch() {
  return (
    <Product label="Relay · customers · five selected">
      <ArchiveFlow direction="undo" customers={customers.slice(0, 7)} initialSelection={BATCH} />
    </Product>
  );
}

/* The three directions side by side, each after its own next step, with
   the one the designer chose marked in the primary: a check beside its name
   and a ring round its screen, so the three names stay on one line (a chip
   above the first screen pushed it down, 2026-10-27): the homepage card. Three columns need
   the rail's height, so this one scene goes without it. */
function Three() {
  return (
    <div className="scene__three">
      {DIRECTIONS.map((x, i) => (
        <section key={x.id} className="scene__way" data-chosen={x.id === STORY.direction || undefined}>
          <h2 className="scene__way-name">
            {x.id === STORY.direction ? (
              <span className="scene__way-pick">
                <Icon name="check" size={14} />
                <span className="visually-hidden">Chosen: </span>
              </span>
            ) : null}
            {i + 1}. {x.name}
          </h2>
          <div className="scene__way-screen">
            <div className="cycle__product-frame" data-surface="product">
              <IconSetContext.Provider value="product">
                <Tried direction={x.id} />
              </IconSetContext.Provider>
            </div>
          </div>
          <p className="scene__way-cost">{x.costs}</p>
        </section>
      ))}
    </div>
  );
}

/* ---------- the stages, simplified (2026-10-27) ----------

   A stage scene is read in the three seconds a case-study figure gets, so it
   carries three things: where the stage sits in the cycle (the bar), the one
   decision, as the title, and the one fact behind it. Everything else the
   stage says is in the case study's text, where it can be read. The rules:
   one question per screen; the person's answer is the only filled element,
   in the primary, and the agent's is an outline in the review's slate; a
   number set large replaces a paragraph. Words come from the cycle's data
   where it has them short enough; the few shorter labels are written here,
   beside the scene that uses them. */

function StageBar({ at }: { at: StageId }) {
  const i = stageIndex(at);
  return (
    <header className="stage-scene__bar">
      <span className="shell__mark" aria-hidden="true">
        <Icon name="check" size={14} />
      </span>
      <ol className="stage-scene__rail" role="list" aria-label="Stages">
        {STAGES.map((st, n) => (
          <li key={st.id} data-state={n < i ? 'done' : n === i ? 'now' : 'later'} aria-current={n === i ? 'step' : undefined}>
            <span className="stage-scene__dot" aria-hidden="true" />
            {st.name}
          </li>
        ))}
      </ol>
      <span className="stage-scene__chip">Simulated</span>
    </header>
  );
}

function StageFrame({ at, title, children }: { at: StageId; title: string; children: ReactNode }) {
  return (
    <div className="scene stage-scene" data-surface="review">
      <StageBar at={at} />
      <main className="stage-scene__body">
        <h1 className="stage-scene__title">{title}</h1>
        {children}
      </main>
    </div>
  );
}

type Who = 'agent' | 'you' | 'stop' | 'quiet';

function Chip({ who, children }: { who: Who; children: ReactNode }) {
  return (
    <span className="stage-scene__chip" data-who={who}>
      {children}
    </span>
  );
}

/** One side of a call: who holds it, the position in the serif, and a line. */
function Side({ who, label, says, why, struck }: { who: Who; label: string; says: string; why?: string; struck?: boolean }) {
  return (
    <div className="stage-scene__side" data-who={who}>
      <Chip who={who}>{label}</Chip>
      <p className="stage-scene__says" data-struck={struck || undefined}>
        {says}
      </p>
      {why ? <p className="stage-scene__why">{why}</p> : null}
    </div>
  );
}

/** The one fact behind the call: a figure set large, and a line under it. */
function Fact({ figure, children }: { figure: string; children: ReactNode }) {
  return (
    <p className="stage-scene__fact">
      <span className="stage-scene__figure">{figure}</span>
      <span>{children}</span>
    </p>
  );
}

/* Discover: the agent's claim, struck, against the correction. */
function Discover() {
  const claim = READINGS.find((r) => r.id === DISPUTED.reading)!;
  return (
    <StageFrame at="discover" title="Does the agent’s summary hold up?">
      <div className="stage-scene__versus">
        <Side who="agent" label="Agent’s summary" says={claim.says} struck />
        <Side who="you" label="You corrected it" says="Records are kept for 90 days." why="Nobody can see them or put them back." />
      </div>
      <Fact figure="6 of 9">archive tickets ask to get a record back</Fact>
    </StageFrame>
  );
}

/* Define: the two priorities, and the one that leads the brief. */
function Define() {
  return (
    <StageFrame at="define" title="Speed or safety: which one wins?">
      <div className="stage-scene__versus">
        <Side who="quiet" label="Option" says={PRIORITY.pace.name} why="Fewer presses for bulk cleanup" />
        <Side who="you" label="You chose" says={PRIORITY.recovery.name} why="Even if it costs a press" />
      </div>
      <Fact figure="1 in 14">archived customers was Active, almost always swept up in a batch</Fact>
    </StageFrame>
  );
}

/** Each direction's next step, drawn as its shape: a bar after the press, a
    question over the table, a panel beside it. */
const SHAPE: Record<DirectionId, string> = { undo: 'bar', confirm: 'question', review: 'panel' };
const SHORT_COST: Record<DirectionId, string> = {
  undo: 'Fast, but relies on noticing',
  confirm: 'People press through it',
  review: 'The most steps',
};

/* Explore: the three directions, each tried on the same batch. */
function Explore() {
  return (
    <StageFrame at="explore" title="Three ways to archive, tried on one batch">
      <ul className="stage-scene__trio" role="list">
        {DIRECTIONS.map((d) => (
          <li key={d.id} className="stage-scene__way">
            <span className="stage-scene__shape" data-shape={SHAPE[d.id]} aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="stage-scene__way-name">{d.name}</span>
            <span className="stage-scene__why">{SHORT_COST[d.id]}</span>
          </li>
        ))}
      </ul>
      <p className="stage-scene__note">
        <Chip who="quiet">Tried all three</Chip>
      </p>
    </StageFrame>
  );
}

/* Evaluate: the agent's recommendation against the call, and why. */
function Evaluate() {
  return (
    <StageFrame at="evaluate" title="Which direction ships?">
      <div className="stage-scene__versus">
        <Side who="agent" label="Agent recommends" says={directionOf('review').name} why="Fits the brief: recovery first" />
        <Side who="you" label="You chose" says={directionOf(STORY.direction!).name} why={`Plus: ${REQUIREMENT['names-active'].replace(/\.$/, '').toLowerCase()}`} />
      </div>
      <Fact figure="2×">the review step doubled the quarterly cleanup</Fact>
    </StageFrame>
  );
}

const TALLY: { state: 'passed' | 'changed' | 'inconclusive'; say: (n: number) => string }[] = [
  { state: 'passed', say: (n) => `${n} passed` },
  { state: 'changed', say: (n) => `${n} changed, as intended` },
  { state: 'inconclusive', say: (n) => `${n} can’t tell yet` },
];

/* Delegate: the checks as three counts, and the one stop. */
function Delegate() {
  const build = buildOf(STORY)!;
  const stop = stopOf(STORY.direction!);
  return (
    <StageFrame at="delegate" title="The agent built it. One stop for you.">
      <ul className="stage-scene__tally" role="list">
        {TALLY.map((t) => {
          const n = build.verified.filter((v) => v.state === t.state).length;
          return n ? (
            <li key={t.state} data-state={t.state}>
              <span className="stage-scene__dot" aria-hidden="true" />
              {t.say(n)}
            </li>
          ) : null;
        })}
      </ul>
      <div className="stage-scene__ask">
        <Chip who="stop">Needs you</Chip>
        <p className="stage-scene__says">{stop.question}</p>
        <p className="stage-scene__answers">
          {stop.answers.map((a) => (
            <span key={a.id} className="stage-scene__answer" data-chosen={a.id === STORY.answer || undefined}>
              {a.name}
            </span>
          ))}
        </p>
      </div>
    </StageFrame>
  );
}

/* Learn: the rule kept for the next agent, and what is still unknown. */
function Learn() {
  const outcome = outcomeOf(STORY)!;
  return (
    <StageFrame at="learn" title="Keep this rule for the next agent?">
      <div className="stage-scene__side stage-scene__rule" data-who="you">
        <Chip who="you">Kept, for customer screens</Chip>
        <p className="stage-scene__says">{outcome.guidance}</p>
      </div>
      <p className="stage-scene__fact stage-scene__fact--open">
        <Chip who="stop">Not known yet</Chip>
        <span>Whether people notice the undo bar. Nothing here was tested with people.</span>
      </p>
    </StageFrame>
  );
}

const DRAWN: Record<SceneId, () => ReactNode> = {
  batch: () => (
    <Frame at="explore" label="Relay’s customers, five selected">
      <Batch />
    </Frame>
  ),
  three: () => (
    <Frame at="evaluate" label="Three ways to archive" rail={false}>
      <Three />
    </Frame>
  ),
  discover: Discover,
  define: Define,
  explore: Explore,
  evaluate: Evaluate,
  delegate: Delegate,
  learn: Learn,
};

export function SceneScreen({ id }: { id: SceneId }) {
  const Drawn = DRAWN[id];
  /* A press or a next step puts focus on a button, which rings it and
     scrolls its frame; a picture has no focus, and starts at the top. It
     waits for the press's own focus, which lands a render later. */
  useEffect(() => {
    const settle = setTimeout(() => {
      (document.activeElement as HTMLElement | null)?.blur();
      for (const el of document.querySelectorAll('.scene, .scene *')) el.scrollTop = 0;
      window.scrollTo(0, 0);
    }, 100);
    return () => clearTimeout(settle);
  }, [id]);
  return <Drawn />;
}
