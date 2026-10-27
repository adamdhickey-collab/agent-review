import { useEffect, useRef, type ReactNode } from 'react';
import { Badge, Cell, Checkbox, HeaderCell, Icon, IconSetContext, Row, Table, Tabs, TestStatus } from '../../components';
import {
  buildOf,
  DIRECTIONS,
  directionOf,
  DISPUTED,
  EVIDENCE,
  EVIDENCE_KIND,
  FINDING_SOURCE,
  FINDINGS,
  outcomeOf,
  PRIORITY,
  problemOf,
  READING_KIND,
  READINGS,
  REQUIREMENT,
  STAGES,
  stageIndex,
  stopOf,
  criteriaOf,
  type DirectionId,
  type Priority,
  type StageId,
} from '../../data/cycle';
import { ArchiveFlow } from '../../product/customers/ArchiveFlow';
import { customers } from '../../product/customers/customers';
import { Choice } from '../CycleScreen/stages';
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

/** The move, as a stage draws it, without the way on. */
function Move({ title, children }: { title: string; children: ReactNode }) {
  return (
    <aside className="cycle__move scene__move">
      <div className="cycle__move-head">
        <p className="cycle__move-kicker">
          <Icon name="user" size={14} />
          Your move
        </p>
        <h2 className="cycle__move-title">{title}</h2>
      </div>
      <div className="cycle__move-body">{children}</div>
    </aside>
  );
}

/** Two answers, the story's chosen. The other shows its name only: its
    meaning and its press are left off, because the picture is the call
    made, not the call to make. */
function Answers({ items }: { items: { name: string; says?: string; chosen?: boolean; recommended?: boolean }[] }) {
  return (
    <ul className="cycle__choices" role="list">
      {items.map((x) => (
        <Choice key={x.name} name={x.name} says={x.says ?? null} chosen={!!x.chosen} recommended={x.recommended} onChoose={() => {}} />
      ))}
    </ul>
  );
}

function Consequence({ children }: { children: ReactNode }) {
  return (
    <p className="cycle__consequence">
      <Icon name="arrow-right" size={14} />
      <span>{children}</span>
    </p>
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

/* Discover: the summary's claims, the one the move asks about on its
   warning ground, and the note that settles it. */
function Discover() {
  const shown = READINGS.filter((r) => r.id === 'r-batch' || r.id === DISPUTED.reading);
  const note = EVIDENCE.find((e) => e.id === DISPUTED.by)!;
  return (
    <div className="scene__work scene__work--long-move">
      <section className="scene__main">
        <h2 className="cycle__h2">The agent’s summary</h2>
        <ul className="cycle__readings" role="list">
          {shown.map((r) => (
            <li key={r.id} className="cycle__reading" data-kind={r.kind} data-disputed={r.id === DISPUTED.reading || undefined}>
              <Badge tone={r.kind === 'observation' ? 'neutral' : r.kind === 'interpretation' ? 'accent' : 'warning'} variant="outline">
                {READING_KIND[r.kind]}
              </Badge>
              <p className="cycle__reading-says">{r.says}</p>
            </li>
          ))}
        </ul>
        <div className="cycle__ev" data-opened>
          <p className="cycle__ev-kind">
            {EVIDENCE_KIND[note.kind]} <span>· {note.from}</span>
          </p>
          <p className="cycle__ev-says">{note.says}</p>
        </div>
      </section>
      <Move title="The summary says archiving deletes data. Does that hold up?">
        <Answers
          items={[
            { name: 'Correct it', says: 'Archived records are kept for 90 days. The problem is that nobody can see them or put them back.', chosen: true },
            { name: 'Keep it' },
          ]}
        />
      </Move>
    </div>
  );
}

/* Define: the brief the call writes, and the priority that sets it. */
function Define() {
  const criteria = criteriaOf(STORY.priority, STORY.reading);
  const order: Priority[] = ['pace', 'recovery'];
  return (
    <div className="scene__work">
      <article className="cycle__brief scene__brief">
        <p className="cycle__brief-kicker">Brief · drafted by the agent, edited by Alex</p>
        <dl className="cycle__facts">
          <div>
            <dt>The problem</dt>
            <dd>{problemOf(STORY.reading)}</dd>
          </div>
          <div>
            <dt>Success looks like</dt>
            <dd>
              <ul className="cycle__list" role="list">
                {criteria.map((c) => (
                  <li key={c.id}>{c.says}</li>
                ))}
              </ul>
            </dd>
          </div>
        </dl>
      </article>
      <Move title="When speed and safety pull apart, which wins?">
        <Answers items={order.map((p) => ({ name: PRIORITY[p].name, says: p === STORY.priority ? PRIORITY[p].says : undefined, chosen: p === STORY.priority }))} />
      </Move>
    </div>
  );
}

/* Explore: one direction working, the first, after the press: four gone at
   once, Monarch refused after it, and Undo. */
function Explore() {
  const d = directionOf('undo');
  return (
    <div className="scene__explore">
      <Tabs className="cycle__tabs" label="Directions" tabs={DIRECTIONS.map((x, i) => ({ value: x.id, label: `${i + 1}. ${x.name}` }))} value="undo" onChange={() => {}}>
        <div className="scene__direction">
          <dl className="cycle__tradeoff">
            <div>
              <dt>
                <Icon name="plus" size={14} />
                Gains
              </dt>
              <dd>{d.gains}</dd>
            </div>
            <div>
              <dt>
                <Icon name="minus" size={14} />
                Costs
              </dt>
              <dd>{d.costs}</dd>
            </div>
          </dl>
          <Product label="Relay · customers · direction 1, working">
            <Tried direction="undo" />
          </Product>
        </div>
      </Tabs>
    </div>
  );
}

/* The three directions side by side, each after its own next step, with
   the one the designer chose marked: the homepage card. Three columns need
   the rail's height, so this one scene goes without it. */
function Three() {
  return (
    <div className="scene__three">
      {DIRECTIONS.map((x, i) => (
        <section key={x.id} className="scene__way">
          <h2 className="scene__way-name">
            {i + 1}. {x.name}
            {x.id === STORY.direction ? (
              <Badge tone="accent" variant="quiet" icon="check">
                Chosen
              </Badge>
            ) : null}
          </h2>
          <div className="cycle__product-frame" data-surface="product">
            <IconSetContext.Provider value="product">
              <Tried direction={x.id} />
            </IconSetContext.Provider>
          </div>
          <p className="scene__way-cost">{x.costs}</p>
        </section>
      ))}
    </div>
  );
}

/* Evaluate: what came back on the left, the two sessions that decided it,
   and the call on the right, made against the agent's recommendation. What
   the call did sits under the findings, where the picture has room for it. */
function Evaluate() {
  const shown = FINDINGS.filter((f) => f.id === 'f-active' || f.id === 'f-bulk');
  return (
    <div className="scene__work">
      <section className="scene__main">
        <h2 className="cycle__h2">What came back</h2>
        <ul className="cycle__findings" role="list">
          {shown.map((f) => (
            <li key={f.id} className="cycle__finding">
              <p className="cycle__finding-head">
                <Badge tone="warning" variant="outline">
                  {FINDING_SOURCE[f.source]}
                </Badge>
                {f.about ? <span className="cycle__finding-about">About {directionOf(f.about[0]).name.toLowerCase()}</span> : null}
              </p>
              <p className="cycle__finding-says">{f.says}</p>
              {f.becomes ? <Checkbox label={`Require: ${REQUIREMENT[f.becomes]}`} checked={STORY.required[f.becomes]} readOnly /> : null}
            </li>
          ))}
        </ul>
        <Consequence>You chose against the agent’s recommendation, and your reason says why.</Consequence>
      </section>
      <Move title="Which direction, and why?">
        <Answers
          items={(['undo', 'review'] as const).map((id) => ({
            name: directionOf(id).name,
            says: id === STORY.direction ? directionOf(id).costs : undefined,
            chosen: id === STORY.direction,
            recommended: id === 'review',
          }))}
        />
      </Move>
    </div>
  );
}

/* Delegate: what the checks established on the agent's build, and the one
   place it stopped. */
function Delegate() {
  const build = buildOf(STORY)!;
  const stop = stopOf(STORY.direction!);
  return (
    <div className="scene__work scene__work--long-move">
      <section className="scene__main">
        <h2 className="cycle__h2">What the checks established</h2>
        <ul className="cycle__checks scene__checks" role="list">
          {build.verified.map((v) => (
            <li key={v.says}>
              <TestStatus state={v.state} />
              <span>{v.says}</span>
            </li>
          ))}
        </ul>
      </section>
      <Move title={stop.question}>
        <p className="cycle__move-kind">
          <Badge tone="warning" icon="lock">
            Needs approval
          </Badge>
        </p>
        <Answers items={stop.answers.map((a) => ({ name: a.name, chosen: a.id === STORY.answer, recommended: a.recommended }))} />
      </Move>
    </div>
  );
}

/* Learn: what to measure once it ships, and the rule kept for the next agent. */
function Learn() {
  const outcome = outcomeOf(STORY)!;
  return (
    <div className="scene__work">
      <section className="scene__main">
        <h2 className="cycle__h2">What to measure once it ships</h2>
        <Table caption="Measures and the direction each should move" density="compact">
          <thead>
            <tr>
              <HeaderCell>Measure</HeaderCell>
              <HeaderCell>What would count as working</HeaderCell>
            </tr>
          </thead>
          <tbody>
            {outcome.measures
              .filter((m) => !m.what.startsWith('Restores'))
              .map((m) => (
                <Row key={m.what}>
                  <Cell rowHeader>{m.what}</Cell>
                  <Cell>{m.target}</Cell>
                </Row>
              ))}
          </tbody>
        </Table>
        <p className="cycle__from">Targets, not results. Nothing has shipped.</p>
        <h2 className="cycle__h2">What isn’t known</h2>
        <ul className="cycle__list cycle__list--open" role="list">
          {outcome.unknowns.map((u) => (
            <li key={u}>{u}</li>
          ))}
        </ul>
      </section>
      <Move title="Keep this for the next agent?">
        <blockquote className="cycle__rule">{outcome.guidance}</blockquote>
        <Checkbox label="Keep it as guidance, for customer screens" checked={STORY.kept} readOnly />
      </Move>
    </div>
  );
}

const DRAWN: Record<SceneId, { at: StageId; label: string; rail?: boolean; Body: () => ReactNode }> = {
  batch: { at: 'explore', label: 'Relay’s customers, five selected', Body: Batch },
  discover: { at: 'discover', label: 'Discover', Body: Discover },
  define: { at: 'define', label: 'Define', Body: Define },
  explore: { at: 'explore', label: 'Explore', Body: Explore },
  three: { at: 'evaluate', label: 'Three ways to archive', rail: false, Body: Three },
  evaluate: { at: 'evaluate', label: 'Evaluate', Body: Evaluate },
  delegate: { at: 'delegate', label: 'Delegate', Body: Delegate },
  learn: { at: 'learn', label: 'Learn', Body: Learn },
};

export function SceneScreen({ id }: { id: SceneId }) {
  const { at, label, rail, Body } = DRAWN[id];
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
  return (
    <Frame at={at} label={label} rail={rail}>
      <Body />
    </Frame>
  );
}
