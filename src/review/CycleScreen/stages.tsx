import { useState, type ReactNode } from 'react';
import { Badge, Button, Cell, Checkbox, EmptyState, HeaderCell, Icon, IconSetContext, Row, Table, Tabs, TestStatus, TextArea } from '../../components';
import { href } from '../../app/router';
import { useStore } from '../../app/store';
import {
  activeRule,
  BOUNDARIES,
  briefOf,
  buildOf,
  BUILT_IN,
  CONSTRAINTS,
  decided,
  criteriaOf,
  DIRECTIONS,
  directionOf,
  DISPUTED,
  draftReason,
  EVIDENCE,
  EVIDENCE_KIND,
  featuresOf,
  FINDING_SOURCE,
  FINDINGS,
  NOT_SOLVING,
  OPEN_QUESTIONS,
  outcomeOf,
  PEOPLE,
  PRIORITY,
  problemOf,
  READING_KIND,
  READINGS,
  recommendedFor,
  REQUIREMENT,
  SHOWED,
  STAGES,
  stageIndex,
  stageOf,
  stopOf,
  type CycleState,
  type DirectionId,
  type FeatureId,
  type Priority,
  type ReadingCall,
  type StageId,
} from '../../data/cycle';
import { ArchiveFlow, type ArchiveFeatures } from '../../product/customers/ArchiveFlow';

/* The six stages' content (CycleScreen.tsx frames them). Each is the work
   on the left, large, and the person's move on the right: one choice, said
   as a question, whose consequence a later stage shows. Data and the
   functions that carry a choice forward are in data/cycle.ts; this file
   only draws them. */

/* ---------- parts ---------- */

/** The person's move: the one raised panel on a stage, as the decision is on
    the desk, and like the desk's its question sits on the band, the one solid
    ground the light scheme has, so it is the first thing the eye finds. Once
    the stage's call is made, the way on is here too, where the eye already
    is, rather than only at the foot of a long page. */
function Move({ stage, title, children }: { stage: StageId; title: string; children: ReactNode }) {
  const { cycle } = useStore();
  const next = STAGES[stageIndex(stage) + 1];
  return (
    <aside className="cycle__move" aria-labelledby="cycle-move">
      <div className="cycle__move-head">
        <p className="cycle__move-kicker">
          <Icon name="user" size={14} />
          Your move
        </p>
        <h2 id="cycle-move" className="cycle__move-title">
          {title}
        </h2>
      </div>
      <div className="cycle__move-body">
        {children}
        {next && decided(cycle, stage) ? (
          <Button className="cycle__move-next" variant="primary" trailingIcon="arrow-right" onClick={() => (location.hash = href({ name: 'cycle', stage: next.id }))}>
            Continue to {next.name}
          </Button>
        ) : null}
      </div>
    </aside>
  );
}

/* An answer, as the delegated work draws one: what it is and means, and a
   Button that says whether it is chosen (aria-pressed), because a card is
   not a control and the Button is the system's one way to press. */
function Choice({ name, says, chosen, recommended, onChoose, children }: { name: string; says: ReactNode; chosen: boolean; recommended?: boolean; onChoose: () => void; children?: ReactNode }) {
  return (
    <li className="cycle__choice" data-chosen={chosen || undefined}>
      <p className="cycle__choice-name">
        {name}
        {recommended ? (
          <Badge variant="quiet" tone="accent" icon="bot">
            Agent recommends
          </Badge>
        ) : null}
      </p>
      <p className="cycle__choice-says">{says}</p>
      {children}
      <Button className="cycle__choice-pick" variant="secondary" aria-pressed={chosen} leadingIcon={chosen ? 'check' : undefined} onClick={onChoose}>
        {chosen ? 'Chosen' : 'Choose'}
        <span className="visually-hidden"> {name}</span>
      </Button>
    </li>
  );
}

/** What a choice did, said once it is made. */
function Consequence({ children }: { children: ReactNode }) {
  return (
    <p className="cycle__consequence" role="status">
      <Icon name="arrow-right" size={14} />
      <span>{children}</span>
    </p>
  );
}

/** A stage whose work depends on an earlier choice, before that choice is made. */
export function Needs({ stage, what, description }: { stage: StageId; what: string; description?: string }) {
  return (
    <div className="cycle__needs">
      <EmptyState icon="info" title={what} description={description ?? `It’s made in ${stageOf(stage).name}.`} action={{ label: `Go to ${stageOf(stage).name}`, onClick: () => (location.hash = href({ name: 'cycle', stage })) }} />
    </div>
  );
}

/** Relay, inside the review: the product's surface and icons, always light. */
function Product({ label, children }: { label: string; children: ReactNode }) {
  return (
    <figure className="cycle__product">
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

function Section({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  const h = id ?? `cycle-${title.toLowerCase().replace(/[^a-z]+/g, '-')}`;
  return (
    <section className="cycle__section" aria-labelledby={h}>
      <h2 id={h} className="cycle__h2">
        {title}
      </h2>
      {children}
    </section>
  );
}

function toFlow(f: Record<FeatureId, boolean>): ArchiveFeatures {
  return { namesActive: f['names-active'], blockedFirst: f['blocked-first'], restore: f.restore, who: f.who };
}

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 1. DISCOVER ---------- */

export function Discover() {
  const { cycle, cycleDo } = useStore();
  const [lit, setLit] = useState<string | null>(null);

  function show(id: string) {
    cycleDo({ type: 'open', evidence: id });
    setLit(id);
    const el = document.getElementById(`ev-${id}`);
    el?.scrollIntoView({ block: 'nearest', behavior: reduced() ? 'auto' : 'smooth' });
    el?.focus({ preventScroll: true });
  }

  const disputed = READINGS.find((r) => r.id === DISPUTED.reading)!;
  const calls: { id: ReadingCall; name: string; says: string }[] = [
    { id: 'correct', name: 'Correct it', says: 'Archived records are kept for 90 days. The problem is that nobody can see them or put them back.' },
    { id: 'keep', name: 'Keep it', says: 'Treat a mistaken archive as lost data, as the ticket says.' },
  ];

  return (
    <div className="cycle__work">
      <Move stage="discover" title="The summary says archiving deletes data. Does that hold up?">
        <p className="cycle__move-lead">
          It rests on one ticket. Read the <Button size="compact" variant="ghost" onClick={() => show(DISPUTED.by)}>engineering note</Button> before you answer.
        </p>
        <ul className="cycle__choices" role="list">
          {calls.map((c) => (
            <Choice key={c.id} name={c.name} says={c.says} chosen={cycle.reading === c.id} onChoose={() => cycleDo({ type: 'read', call: c.id })} />
          ))}
        </ul>
        {cycle.reading ? (
          <Consequence>
            The brief will say: “{problemOf(cycle.reading)}”
          </Consequence>
        ) : (
          <p className="cycle__move-note">
            <span className="visually-hidden">The disputed claim: </span>“{disputed.says}”
          </p>
        )}
      </Move>

      <div className="cycle__main">
        <Section title="The agent’s summary">
          <p className="cycle__lead">Each line says what kind of claim it is. Press a source to see it.</p>
          <ul className="cycle__readings" role="list">
            {READINGS.map((r) => (
              <li key={r.id} className="cycle__reading" data-kind={r.kind} data-disputed={r.id === DISPUTED.reading || undefined}>
                <Badge tone={r.kind === 'observation' ? 'neutral' : r.kind === 'interpretation' ? 'accent' : 'warning'} variant="outline">
                  {READING_KIND[r.kind]}
                </Badge>
                <p className="cycle__reading-says">{r.says}</p>
                <p className="cycle__reading-from">
                  <span>Rests on</span>
                  {r.from.map((id) => {
                    const e = EVIDENCE.find((x) => x.id === id)!;
                    return (
                      <Button key={id} size="compact" variant="ghost" onClick={() => show(id)}>
                        {EVIDENCE_KIND[e.kind]}, {e.from.toLowerCase()}
                      </Button>
                    );
                  })}
                </p>
              </li>
            ))}
          </ul>
        </Section>
        <Section title="The evidence">
          <ul className="cycle__evidence" role="list">
            {EVIDENCE.map((e) => (
              <li key={e.id} id={`ev-${e.id}`} tabIndex={-1} className="cycle__ev" data-lit={lit === e.id || undefined} data-opened={cycle.opened.includes(e.id) || undefined}>
                <p className="cycle__ev-kind">
                  {EVIDENCE_KIND[e.kind]} <span>· {e.from}</span>
                </p>
                <p className="cycle__ev-says">{e.says}</p>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}

/* ---------- 2. DEFINE ---------- */

export function Define() {
  const { cycle, cycleDo } = useStore();
  const criteria = criteriaOf(cycle.priority, cycle.reading);
  return (
    <div className="cycle__work">
      <Move stage="define" title="When speed and safety pull apart, which wins?">
        <p className="cycle__move-lead">The operations lead wants fewer steps. The account manager wants a guard. Both are in the evidence.</p>
        <ul className="cycle__choices" role="list">
          {(Object.keys(PRIORITY) as Priority[]).map((p) => (
            <Choice key={p} name={PRIORITY[p].name} says={PRIORITY[p].says} chosen={cycle.priority === p} onChoose={() => cycleDo({ type: 'prioritize', priority: p })} />
          ))}
        </ul>
        {cycle.priority ? (
          <Consequence>
            This sets two of the success criteria, and the direction the agent will recommend: <strong>{directionOf(recommendedFor(cycle.priority)).name}</strong>.
          </Consequence>
        ) : null}
      </Move>

      <div className="cycle__main">
        <article className="cycle__brief" aria-labelledby="cycle-brief">
          <p className="cycle__brief-kicker">Brief · drafted by the agent, edited by Alex</p>
          <h2 id="cycle-brief" className="cycle__brief-title">
            Archiving customers without losing control
          </h2>
          <dl className="cycle__facts">
            <div>
              <dt>The problem</dt>
              <dd>
                {problemOf(cycle.reading)}
              </dd>
            </div>
            <div>
              <dt>Who it’s for</dt>
              <dd>
                <ul className="cycle__list" role="list">
                  {PEOPLE.map((p) => (
                    <li key={p.who}>
                      <strong>{p.who}.</strong> {p.needs}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
            <div>
              <dt>Success looks like</dt>
              <dd>
                <ul className="cycle__list" role="list">
                  {criteria.map((c) => (
                    <li key={c.id}>{c.says}</li>
                  ))}
                </ul>
                {cycle.priority === null ? <p className="cycle__from">Two more come from the priority you set.</p> : null}
              </dd>
            </div>
            <div>
              <dt>Constraints</dt>
              <dd>
                <ul className="cycle__list" role="list">
                  {CONSTRAINTS.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </dd>
            </div>
            <div>
              <dt>Not solving</dt>
              <dd>{NOT_SOLVING.join(' · ')}</dd>
            </div>
            <div>
              <dt>Still open</dt>
              <dd>
                <ul className="cycle__list" role="list">
                  {OPEN_QUESTIONS.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
              </dd>
            </div>
          </dl>
        </article>
      </div>
    </div>
  );
}

/* ---------- 3. EXPLORE ---------- */

/* A batch to try: the first five rows, which hold three active customers
   (Halvorsen Freight, Brightwater Clinics and Saltmarsh Studio), a trial,
   and Monarch Dental Group, which can't be archived. Every direction meets all of it. */
const BATCH = ['c_01HZK3', 'c_01HZK7', 'c_01HZKB', 'c_01HZKF', 'c_01HZKN'];


export function Explore() {
  const { cycle, cycleDo } = useStore();
  const d = directionOf(cycle.exploring);
  /* The batch is selected whenever a direction opens (since 2026-10-26):
     the move is to press Archive and watch, not to pick rows, so the three
     directions meet the same five customers and differ only in what they
     say. A person can still change the selection; the screen is working. */
  const [seed, setSeed] = useState(0);
  const tried = (id: DirectionId) => cycle.trials[id].length > 0;
  const priority = cycle.priority;
  const upNext = DIRECTIONS.find((x) => x.id !== d.id && !tried(x.id));
  function go(id: DirectionId) {
    cycleDo({ type: 'explore', direction: id });
    setSeed(seed + 1);
  }

  const rows: { label: string; matters?: Priority; values: Record<DirectionId, string> }[] = [
    { label: 'Presses to archive a page', matters: 'pace', values: { undo: '2', confirm: '3', review: '3' } },
    { label: 'Names an active customer first', matters: 'recovery', values: { undo: 'No', confirm: 'Yes', review: 'Yes' } },
    { label: 'Says what can’t be archived first', values: { undo: 'No', confirm: 'No', review: 'Yes' } },
    { label: 'A way back after', matters: 'recovery', values: { undo: 'Undo, until the next action', confirm: 'None on screen', review: 'None on screen' } },
    { label: 'New for the system to own', values: { undo: 'An undo bar', confirm: 'Nothing', review: 'A review step' } },
  ];

  return (
    <div className="cycle__work">
      <Move stage="explore" title="Archive the same batch three ways">
        <p className="cycle__move-lead">
          Each direction opens with five customers selected: three active, a trial, and one that can’t be archived. Press Archive, finish what it asks, and see what
          it tells you, and when.
        </p>
        <ol className="cycle__tries" role="list">
          {DIRECTIONS.map((x, i) => {
            const done = tried(x.id);
            return (
              <li key={x.id} data-current={x.id === d.id || undefined} data-done={done || undefined}>
                <p className="cycle__try-name">
                  <Icon name={done ? 'circle-check' : 'circle'} size={14} />
                  <span>
                    {i + 1}. {x.name}
                    <span className="visually-hidden">{done ? ', tried' : x.id === d.id ? ', open now' : ', not tried yet'}</span>
                  </span>
                </p>
                {done ? <p className="cycle__try-showed">{SHOWED[x.id]}</p> : null}
              </li>
            );
          })}
        </ol>
        {upNext ? (
          tried(d.id) ? (
            <Button variant="primary" trailingIcon="arrow-right" onClick={() => go(upNext.id)}>
              Try {upNext.name.toLowerCase()}
            </Button>
          ) : null
        ) : tried(d.id) ? (
          <Consequence>You’ve tried all three. Evaluate lines up what came back.</Consequence>
        ) : null}
        {tried(d.id) ? (
          <Button size="compact" variant="ghost" leadingIcon="undo" onClick={() => setSeed(seed + 1)}>
            Run this one again
          </Button>
        ) : null}
      </Move>

      <div className="cycle__main">
        <Tabs
          className="cycle__tabs"
          label="Directions"
          tabs={DIRECTIONS.map((x, i) => ({ value: x.id, label: `${i + 1}. ${x.name}` }))}
          value={cycle.exploring}
          onChange={go}
        >
          <div className="cycle__direction">
            <p className="cycle__direction-does">{d.does}</p>
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
            <Product label={`Relay · customers · direction ${DIRECTIONS.indexOf(d) + 1}, working`}>
              <ArchiveFlow
                key={`${d.id}-${seed}`}
                direction={d.id}
                initialSelection={BATCH}
                onEvent={(event) => cycleDo({ type: 'try', direction: d.id, event })}
              />
            </Product>
          </div>
        </Tabs>

        <Section title="Side by side">
          <Table caption="The three directions compared" density="compact">
            <thead>
              <tr>
                <HeaderCell>
                  <span className="visually-hidden">Question</span>
                </HeaderCell>
                {DIRECTIONS.map((x, i) => (
                  <HeaderCell key={x.id}>
                    {i + 1}. {x.name}
                  </HeaderCell>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <Row key={r.label}>
                  <Cell rowHeader>
                    <span className="cycle__compare-q">
                      {r.label}
                      {priority && r.matters === priority ? (
                        <Badge tone="accent" variant="quiet">
                          Your priority
                        </Badge>
                      ) : null}
                    </span>
                  </Cell>
                  {DIRECTIONS.map((x) => (
                    <Cell key={x.id}>{r.values[x.id]}</Cell>
                  ))}
                </Row>
              ))}
            </tbody>
          </Table>
        </Section>
      </div>
    </div>
  );
}

/* ---------- 4. EVALUATE ---------- */

export function Evaluate() {
  const { cycle, cycleDo } = useStore();
  const recommended = recommendedFor(cycle.priority);
  const chosen = cycle.direction;
  return (
    <div className="cycle__work">
      <Move stage="evaluate" title="Which direction, and why?">
        {cycle.priority ? (
          <p className="cycle__move-lead">
            The agent recommends <strong>{directionOf(recommended).name}</strong>, because you set “{PRIORITY[cycle.priority].name.toLowerCase()}”. It read the brief, not the
            sessions.
          </p>
        ) : null}
        <ul className="cycle__choices" role="list">
          {DIRECTIONS.map((x) => (
            <Choice key={x.id} name={x.name} says={x.costs} chosen={chosen === x.id} recommended={cycle.priority !== null && x.id === recommended} onChoose={() => cycleDo({ type: 'choose', direction: x.id })} />
          ))}
        </ul>
        {chosen ? (
          <>
            <TextArea
              label="Your reason"
              hint="The agent’s draft until you change it. It goes in the brief and the record."
              value={cycle.reason ?? draftReason(chosen, cycle.priority)}
              onChange={(e) => cycleDo({ type: 'reason', text: e.currentTarget.value })}
            />
            <Consequence>
              The agent gets {directionOf(chosen).name.toLowerCase()} and {requirementCount(cycle)} requirement{requirementCount(cycle) === 1 ? '' : 's'}.{' '}
              {chosen !== recommended && cycle.priority ? 'You chose against its recommendation, and your reason says why.' : ''}
            </Consequence>
          </>
        ) : null}
      </Move>

      <div className="cycle__main">
        <Section title="What came back">
          <p className="cycle__lead">Each finding says where it came from. Turn the ones that matter into requirements for the build.</p>
          <ul className="cycle__findings" role="list">
            {FINDINGS.map((f) => {
              const covered = chosen && f.becomes ? !!BUILT_IN[chosen][f.becomes] : false;
              return (
                <li key={f.id} className="cycle__finding" data-source={f.source}>
                  <p className="cycle__finding-head">
                    <Badge tone={f.source === 'session' ? 'warning' : f.source === 'check' ? 'success' : 'neutral'} variant="outline">
                      {FINDING_SOURCE[f.source]}
                    </Badge>
                    {f.about ? <span className="cycle__finding-about">About {f.about.map((a) => `${DIRECTIONS.findIndex((x) => x.id === a) + 1}`).join(' and ')}</span> : null}
                  </p>
                  <p className="cycle__finding-says">{f.says}</p>
                  {f.becomes ? (
                    covered ? (
                      <p className="cycle__finding-covered">
                        <Icon name="check" size={14} />
                        {directionOf(chosen!).name} does this already.
                      </p>
                    ) : (
                      <Checkbox label={`Require: ${REQUIREMENT[f.becomes]}`} checked={cycle.required[f.becomes]} onChange={(e) => cycleDo({ type: 'require', feature: f.becomes!, on: e.currentTarget.checked })} />
                    )
                  ) : null}
                </li>
              );
            })}
          </ul>
          <p className="cycle__from">Session notes are simulated: they show what a round of testing could turn up, not what one did.</p>
        </Section>
      </div>
    </div>
  );
}

function requirementCount(s: CycleState): number {
  if (!s.direction) return 0;
  const f = featuresOf(s.direction, s.required);
  return (Object.keys(f) as FeatureId[]).filter((k) => f[k]).length;
}

/* ---------- 5. DELEGATE ---------- */

export function Delegate() {
  const { cycle, cycleDo } = useStore();
  const brief = briefOf(cycle);
  const build = buildOf(cycle);
  if (!brief || !build || !cycle.direction) return <Needs stage="evaluate" what="Choose a direction first" />;
  const stop = stopOf(cycle.direction);
  const answered = stop.answers.find((a) => a.id === cycle.answer);
  const f = featuresOf(cycle.direction, cycle.required);

  return (
    <div className="cycle__work">
      {cycle.delegated ? (
        <Move stage="delegate" title={stop.question}>
          <p className="cycle__move-kind">
            <Badge tone="warning" icon={stop.kind === 'judgment' ? 'message-question' : 'lock'}>
              {stop.kind === 'judgment' ? 'Needs judgment' : 'Needs approval'}
            </Badge>
          </p>
          <p className="cycle__move-lead">{stop.why}</p>
          <ul className="cycle__choices" role="list">
            {stop.answers.map((a) => (
              <Choice key={a.id} name={a.name} says={a.means} recommended={a.recommended} chosen={cycle.answer === a.id} onChoose={() => cycleDo({ type: 'answer', answer: a.id })} />
            ))}
          </ul>
          {answered ? <Consequence>The agent applied “{answered.name.toLowerCase()}”. The build is under the checks.</Consequence> : null}
        </Move>
      ) : (
        <Move stage="delegate" title="Hand it to the agent?">
          <p className="cycle__move-lead">The brief is written from your choices. The agent works inside the boundaries and stops where they say.</p>
          <Button variant="primary" leadingIcon="send" onClick={() => cycleDo({ type: 'delegate' })}>
            Send the brief
          </Button>
        </Move>
      )}

      <div className="cycle__main">
        <article className="cycle__brief" aria-labelledby="cycle-sent">
          <p className="cycle__brief-kicker">{cycle.delegated ? 'Sent to the agent' : 'Ready to send'}</p>
          <h2 id="cycle-sent" className="cycle__brief-title">
            {brief.title}
          </h2>
          <dl className="cycle__facts">
            <div>
              <dt>The problem</dt>
              <dd>{brief.problem}</dd>
            </div>
            <div>
              <dt>Build</dt>
              <dd>
                <strong>{brief.direction.name}.</strong> {brief.direction.does}
              </dd>
            </div>
            <div>
              <dt>Why</dt>
              <dd>{cycle.reason ?? draftReason(cycle.direction, cycle.priority)}</dd>
            </div>
            <div>
              <dt>Requirements</dt>
              <dd>
                <ul className="cycle__list" role="list">
                  {brief.requirements.map((r) => (
                    <li key={r.id}>
                      {r.says}
                      {r.builtIn ? <span className="cycle__from"> Part of the direction.</span> : null}
                    </li>
                  ))}
                  {brief.requirements.length === 0 ? <li>None beyond the direction itself.</li> : null}
                </ul>
              </dd>
            </div>
            <div>
              <dt>Boundaries</dt>
              <dd>
                <ul className="cycle__bounds" role="list">
                  {BOUNDARIES.own.map((b) => (
                    <li key={b} data-group="own">
                      <Icon name="check" size={14} />
                      <span>
                        <span className="visually-hidden">Proceeds on its own: </span>
                        {b}
                      </span>
                    </li>
                  ))}
                  {BOUNDARIES.judgment.map((b) => (
                    <li key={b} data-group="judgment">
                      <Icon name="message-question" size={14} />
                      <span>
                        <span className="visually-hidden">Asks for your judgment: </span>
                        {b}
                      </span>
                    </li>
                  ))}
                  {BOUNDARIES.approval.map((b) => (
                    <li key={b} data-group="approval">
                      <Icon name="lock" size={14} />
                      <span>
                        <span className="visually-hidden">Needs approval: </span>
                        {b}
                      </span>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          </dl>
        </article>

        {cycle.delegated ? (
          <Section title="What the agent did">
            <p className="cycle__lead">
              {build.changes.length} changes on its own, inside the boundaries. Then it stopped once.
            </p>
            <ul className="cycle__list" role="list">
              {build.changes.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
            <h3 className="cycle__h3">What the checks established</h3>
            <ul className="cycle__checks" role="list">
              {build.verified.map((v) => (
                <li key={v.says}>
                  <TestStatus state={v.state} />
                  <span>
                    {v.says} <span className="cycle__from">{v.how}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        {answered ? (
          <Section title="As built">
            <p className="cycle__lead">The build, with your answer in it. It’s working: try it again.</p>
            <Product label="Relay · customers · as built, simulated">
              <ArchiveFlow direction={cycle.direction} features={toFlow(f)} activeRule={activeRule(cycle.direction, cycle.answer)} initialSelection={BATCH} />
            </Product>
          </Section>
        ) : null}
      </div>
    </div>
  );
}

/* ---------- 6. LEARN ---------- */

export function Learn() {
  const { cycle, cycleDo } = useStore();
  const outcome = outcomeOf(cycle);
  const build = buildOf(cycle);
  if (!outcome || !build || !cycle.direction || !cycle.answer) return <Needs stage="delegate" what="Nothing’s been built yet" />;
  const stop = stopOf(cycle.direction);
  const answer = stop.answers.find((a) => a.id === cycle.answer);
  const brief = briefOf(cycle)!;

  return (
    <div className="cycle__work">
      <Move stage="learn" title="Keep this for the next agent?">
        <p className="cycle__move-lead">A rule the next agent reads before it builds a bulk action. It exists only if you make it.</p>
        <blockquote className="cycle__rule">{outcome.guidance}</blockquote>
        <Checkbox label="Keep it as guidance, for customer screens" checked={cycle.kept} onChange={(e) => cycleDo({ type: 'keep', on: e.currentTarget.checked })} />
        {cycle.kept ? <Consequence>Kept, with your reason as its why. You can revoke it; what it made stays.</Consequence> : null}
        {/* The cycle's one way out (since 2026-10-26, when the bar stopped
            offering the product's other places on the cycle): the two runs,
            for whoever wants to see the agent stop again, and the case
            study most readers came from. */}
        <h3 className="cycle__h3">Where the agent stops, in two other runs</h3>
        <ul className="cycle__links" role="list">
          <li>
            <a href={href({ name: 'delegation' })}>A cancel link the checks can’t judge</a>
          </li>
          <li>
            <a href={href({ name: 'delegation', run: 'shared-table' })}>A fix in a table 40 screens share</a>
          </li>
          <li>
            <a href="https://adamhickey.com/lab/agent-review.html">How it was made, in the case study</a>
          </li>
        </ul>
      </Move>

      <div className="cycle__main">
        <Section title="What you decided">
          <dl className="cycle__facts cycle__facts--record">
            <div>
              <dt>Discover</dt>
              <dd>{cycle.reading === 'keep' ? 'Kept the claim that archiving deletes data.' : cycle.reading === 'correct' ? 'Corrected the summary: archived records are kept 90 days.' : 'Not decided.'}</dd>
            </div>
            <div>
              <dt>Define</dt>
              <dd>{cycle.priority ? `${PRIORITY[cycle.priority].name}.` : 'No priority set.'}</dd>
            </div>
            <div>
              <dt>Evaluate</dt>
              <dd>
                <strong>{directionOf(cycle.direction).name}.</strong> {cycle.reason ?? draftReason(cycle.direction, cycle.priority)}
              </dd>
            </div>
            <div>
              <dt>Required</dt>
              <dd>{brief.requirements.length ? brief.requirements.map((r) => r.says).join(' ') : 'Nothing beyond the direction.'}</dd>
            </div>
            <div>
              <dt>The agent asked</dt>
              <dd>
                {stop.question} <strong>{answer?.name}.</strong>
              </dd>
            </div>
          </dl>
        </Section>

        <Section title="What’s verified">
          <ul className="cycle__checks" role="list">
            {build.verified.map((v) => (
              <li key={v.says}>
                <TestStatus state={v.state} />
                <span>{v.says}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="What isn’t known">
          <ul className="cycle__list cycle__list--open" role="list">
            {outcome.unknowns.map((u) => (
              <li key={u}>{u}</li>
            ))}
          </ul>
        </Section>

        <Section title="What to measure once it ships">
          <Table caption="Measures and the direction each should move" density="compact">
            <thead>
              <tr>
                <HeaderCell>Measure</HeaderCell>
                <HeaderCell>What would count as working</HeaderCell>
              </tr>
            </thead>
            <tbody>
              {outcome.measures.map((m) => (
                <Row key={m.what}>
                  <Cell rowHeader>{m.what}</Cell>
                  <Cell>{m.target}</Cell>
                </Row>
              ))}
            </tbody>
          </Table>
          <p className="cycle__from">Targets, not results. Nothing has shipped.</p>
        </Section>

        <div className="cycle__pair">
          <Section title="Research next">
            <ul className="cycle__list" role="list">
              {outcome.research.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </Section>
          <Section title="Change next time">
            <ul className="cycle__list" role="list">
              {outcome.nextTime.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </Section>
        </div>
      </div>
    </div>
  );
}
