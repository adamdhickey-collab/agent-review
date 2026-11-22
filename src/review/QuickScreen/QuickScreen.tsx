import { useState, type ReactNode } from 'react';
import { Badge, Button, Cell, Checkbox, HeaderCell, Icon, Row, SegmentedControl, Table, Tabs, Toolbar } from '../../components';
import { href, navigate, type QuickBatch } from '../../app/router';
import type { DirectionId } from '../../data/cycle';
import { DECISION, DECISION_RULE, FIXES, QUICK_CUSTOMERS, RISKY_BATCH, RISKY_CUSTOMERS, ROUTINE_BATCH } from '../../data/quick';
import { ArchiveFlow } from '../../product/customers/ArchiveFlow';
import { formatMrr, STATUS_LABEL } from '../../product/customers/customers';
import { LaterRun, Product } from '../CycleScreen/stages';
import { useTour } from '../Tour/Tour';
import '../CycleScreen/CycleScreen.css';
import './QuickScreen.css';

/* THE QUICK PATH (2026-11-22): four screens in front of the design cycle,
   for a hiring manager who should understand the project before investing
   in the six stages. The problem ("/"), the alternatives ("/compare"), the
   decision ("/decision"), and the experiment as depth ("/about").

   WHY IT IS BACK. On 2026-11-18 a three-beat short path was the front door
   for a day and Adam took it out: it summarized the prototype and put
   nothing working in front of the reader. This one is his brief of
   2026-11-22 and differs where that one failed: its second screen is the
   three working fixes themselves (ArchiveFlow, the screens Explore uses),
   and the six stages are one quiet link away, untouched.

   WHAT IT REUSES. Every surface is the system's: the Product frame and the
   later-run panel from the cycle (stages.tsx), the Tabs' options look that
   Explore's directions use, the SegmentedControl, Table, Toolbar, Badge,
   Checkbox and Button. It adds no component and no interaction pattern.
   The type is the cycle's classes, so the two read as one product; the
   container is this path's own (the cycle's becomes a two-column grid on
   a wide screen, for the move beside the work).

   WHAT IT DOES NOT TOUCH. The cycle's state. Which fix is open and which
   batch the decision is shown on are in the address; the saved-rule box is
   this screen's own state, gone on a reload, and says it is simulated. A
   visitor who has decided three stages of the cycle and comes here finds
   them as they were, and nothing here is recorded as their choice: the
   decision on "/decision" is Adam's, and the screen says so.

   WHO IS WHO. The coding agent built the fixes; the designer, Adam, set
   the rules, compared them and decided; the account manager is the person
   archiving customers in Relay. "Active customer selected?" is a product
   rule Relay applies, not something an agent checks. */

const RECORD = 'https://github.com/adamdhickey-collab/agent-review/blob/main/docs/experiment/README.md';
const CHANGES = 'https://github.com/adamdhickey-collab/agent-review/blob/main/docs/experiment/changes';
const STUDY = 'https://github.com/adamdhickey-collab/agent-review/blob/main/docs/validation/README.md#a-second-study-the-archive-itself';
const SOURCE = 'https://github.com/adamdhickey-collab/agent-review';
const CASE_STUDY = 'https://adamhickey.com/lab/agent-review.html';

const go = (hash: string) => () => {
  location.hash = hash;
};

function Out({ to, children }: { to: string; children: ReactNode }) {
  return (
    <a href={to} target="_blank" rel="noopener">
      {children}
      <Icon name="arrow-up-right" size={12} />
      <span className="visually-hidden"> (opens in a new tab)</span>
    </a>
  );
}

/* ---------- 1. THE PROBLEM ---------- */

/** The selection that went wrong, as Relay draws it and out of reach: a
    picture of the mistake, with its words for a screen reader beside it. */
function RiskySelection() {
  return (
    <figure className="quick__selection">
      <p className="visually-hidden">
        Three customers are selected to archive: {RISKY_CUSTOMERS.map((c) => `${c.company}, ${STATUS_LABEL[c.status]}`).join('; ')}.
      </p>
      <div className="quick__selection-frame" data-surface="product" inert aria-hidden="true">
        <Toolbar label="Selected customers" tone="accent" start={<span className="quick__selected">3 customers selected to archive</span>} />
        <Table caption="The selected customers" density="compact">
          <thead>
            <tr>
              <HeaderCell control>
                <span className="visually-hidden">Selected</span>
              </HeaderCell>
              <HeaderCell>Company</HeaderCell>
              <HeaderCell>Status</HeaderCell>
              <HeaderCell numeric>MRR</HeaderCell>
            </tr>
          </thead>
          <tbody>
            {RISKY_CUSTOMERS.map((c) => (
              <Row key={c.id} selected className={c.status === 'active' ? 'quick__row--active' : undefined}>
                <Cell control>
                  <Checkbox label={`${c.company}, selected`} hideLabel checked readOnly tabIndex={-1} />
                </Cell>
                <Cell rowHeader>{c.company}</Cell>
                <Cell>
                  <Badge tone={c.status === 'active' ? 'success' : c.status === 'trial' ? 'accent' : 'neutral'}>{STATUS_LABEL[c.status]}</Badge>
                </Cell>
                <Cell numeric>{formatMrr(c.mrr)}</Cell>
              </Row>
            ))}
          </tbody>
        </Table>
      </div>
      <figcaption className="quick__caption">Archiving this selection also removes a paying customer from the list.</figcaption>
    </figure>
  );
}

export function Start() {
  const tour = useTour();
  return (
    <div className="quick quick--start">
      <p className="quick__label">Working prototype · Simulated scenario</p>
      <h1 className="cycle__title" tabIndex={-1}>
        A paying customer was archived by mistake.
      </h1>
      <p className="cycle__setup">I set the design rules. A coding agent built three fixes. Compare the tradeoffs.</p>
      <RiskySelection />
      <div className="quick__actions">
        <Button variant="primary" trailingIcon="arrow-right" onClick={go(href({ name: 'compare' }))}>
          Compare the fixes
        </Button>
        <a className="quick__quiet" href={href({ name: 'cycle', stage: 'discover' })}>
          Explore the full design process
        </a>
      </div>
      {tour.available && !tour.active ? (
        <p className="quick__more">
          <Button size="compact" variant="ghost" leadingIcon="play" onClick={tour.start}>
            Watch the walkthrough
          </Button>
        </p>
      ) : null}
    </div>
  );
}

/* ---------- 2. THE ALTERNATIVES ---------- */

export function Compare({ fix }: { fix: DirectionId }) {
  const f = FIXES.find((x) => x.id === fix) ?? FIXES[0];
  /* Remounts the working screen, selection and all, on Try again. */
  const [run, setRun] = useState(0);
  return (
    <div className="quick">
      <div className="quick__head">
        <p className="quick__label">Simulated scenario · Working screens</p>
        <h1 className="cycle__title" tabIndex={-1}>
          Three fixes, each a working screen.
        </h1>
        <p className="cycle__setup">
          An account manager selected three customers to archive. One of them, Northside Trucking, is active and paying. Press Archive in each fix to see what
          the account manager is asked to do.
        </p>
      </div>

      <Tabs
        className="cycle__tabs"
        variant="options"
        label="Fixes"
        tabs={FIXES.map((x) => ({ value: x.id, label: x.name }))}
        value={f.id}
        onChange={(id) => {
          setRun(0);
          navigate({ name: 'compare', fix: id }, true);
        }}
      >
        <div className="quick__fix">
          <div className="quick__fix-says">
            <p className="quick__fix-does">{f.does}</p>
            <p className="quick__fix-tradeoff">{f.tradeoff}</p>
          </div>
          <Product label={`Relay · customers · ${f.name}, working`}>
            <ArchiveFlow key={`${f.id}-${run}`} direction={f.id} customers={QUICK_CUSTOMERS} initialSelection={RISKY_BATCH} />
          </Product>
          <p className="quick__again">
            <Button size="compact" variant="ghost" leadingIcon="undo" onClick={() => setRun(run + 1)}>
              Reset this screen
            </Button>
          </p>
        </div>
      </Tabs>

      <p className="quick__framing">
        <strong>All three passed the automated checks.</strong> Each asks something different of the person using it. A passing check is not a usability test, and
        not a full accessibility review.
      </p>

      <div className="quick__actions">
        <Button variant="primary" trailingIcon="arrow-right" onClick={go(href({ name: 'decision' }))}>
          See my design decision
        </Button>
        <a className="quick__quiet" href={href({ name: 'start' })}>
          Back to the problem
        </a>
      </div>
    </div>
  );
}

/* ---------- 3. THE DECISION ---------- */

const BATCH_OPTIONS = [
  { value: 'routine' as const, label: 'No active customers' },
  { value: 'active' as const, label: 'Active customer included' },
];

export function Decision({ batch }: { batch: QuickBatch }) {
  const [run, setRun] = useState(0);
  const [kept, setKept] = useState(false);
  const active = batch === 'active';
  return (
    <div className="quick">
      <div className="quick__head">
        <p className="quick__label">My design decision · Adam Hickey, designer</p>
        <h1 className="cycle__title" tabIndex={-1}>
          Ask for review when an active customer is included.
        </h1>
      </div>

      <dl className="quick__conditions">
        <div data-on={!active || undefined}>
          <dt>No active customers selected</dt>
          <dd>Archive immediately, with Undo.</dd>
        </div>
        <div data-on={active || undefined}>
          <dt>An active customer is selected</dt>
          <dd>Pause and name the customer before archiving. Let the account manager review and adjust the selection.</dd>
        </div>
      </dl>

      <section className="cycle__section" aria-labelledby="quick-try">
        <div className="quick__try-head">
          <h2 id="quick-try" className="cycle__h2">
            Try both conditions
          </h2>
          <SegmentedControl
            label="Selection"
            options={BATCH_OPTIONS}
            value={batch}
            onChange={(b) => {
              setRun(0);
              navigate({ name: 'decision', batch: b }, true);
            }}
          />
        </div>
        <Product label={`Relay · customers · ${active ? 'a selection with Northside Trucking, active' : 'a routine cleanup, nobody active'}, working`}>
          <ArchiveFlow
            key={`${batch}-${run}`}
            direction={DECISION.direction}
            features={DECISION.features}
            customers={QUICK_CUSTOMERS}
            initialSelection={active ? RISKY_BATCH : ROUTINE_BATCH}
          />
        </Product>
        <p className="quick__again">
          <Button size="compact" variant="ghost" leadingIcon="undo" onClick={() => setRun(run + 1)}>
            Reset this screen
          </Button>
        </p>
      </section>

      <section className="cycle__section quick__limits" aria-labelledby="quick-limits">
        <h2 id="quick-limits" className="cycle__h2">
          What this is, and isn’t yet
        </h2>
        <ul className="quick__limits-list" role="list">
          <li>
            <Badge variant="outline">Design hypothesis</Badge>
            <span>
              A review that appears only for an active customer should get read, where one on every cleanup gets pressed through. That is untested: nobody has
              used this with account managers. <Out to={STUDY}>The research plan</Out>
            </span>
          </li>
          <li>
            <Badge variant="outline">Not deletion</Badge>
            <span>
              Archiving removes a customer from the list; Relay keeps it for 90 days. Undo lasts until the next action. After that, restoring is still a support
              request: this prototype has no restore screen.
            </span>
          </li>
        </ul>
      </section>

      <section className="cycle__section" aria-labelledby="quick-rule">
        <h2 id="quick-rule" className="cycle__h2">
          That decision becomes a rule for the next build.
        </h2>
        <p className="cycle__lead">A coding agent doesn’t learn from one answer. Written down as a rule, the decision reaches the next build without being asked again.</p>
        <blockquote className="cycle__rule">{DECISION_RULE}</blockquote>
        <Checkbox label="Save the rule for customer screens (simulated)" checked={kept} onChange={(e) => setKept(e.currentTarget.checked)} />
        <LaterRun kept={kept} mine />
      </section>

      <div className="quick__actions">
        <Button variant="primary" trailingIcon="arrow-right" onClick={go(href({ name: 'cycle', stage: 'discover' }))}>
          Explore the full design process
        </Button>
        <a className="quick__quiet" href={href({ name: 'compare' })}>
          Back to the three fixes
        </a>
        <a className="quick__quiet" href={href({ name: 'about' })}>
          About the experiment
        </a>
      </div>
    </div>
  );
}

/* ---------- ABOUT THE EXPERIMENT ---------- */

/* What led Discover until 2026-11-22 (CycleScreen's Outcomes), with the
   one thing a reader kept mixing up said first: the experiment is two
   agent runs and a faulty fixture; the comparison is three archive fixes.
   The fixture is never one of the three. */
export function About() {
  return (
    <div className="quick">
      <div className="quick__head">
        <p className="quick__label">Independent project · Design and working prototype by Adam Hickey</p>
        <h1 className="cycle__title" tabIndex={-1}>
          About the experiment
        </h1>
        <p className="cycle__setup">Two different things are in this prototype. They are easy to mix up, so here they are side by side.</p>
      </div>

      <dl className="quick__conditions quick__conditions--plain">
        <div>
          <dt>
            <Badge variant="quiet" icon="circle-check">
              Real
            </Badge>
            The experiment: two agent runs and one faulty fixture
          </dt>
          <dd>
            Claude Code built one feature, bulk actions on a customer table, twice: once with twelve written design rules and once without. A third version was
            written by hand, with mistakes planted in it, to test the checks. That third version is a test fixture, not a fix.
          </dd>
        </div>
        <div>
          <dt>
            <Badge variant="quiet" icon="play">
              Simulated scenario
            </Badge>
            The comparison: three archive fixes
          </dt>
          <dd>
            Undo afterward, Confirm first, and Review the batch are three working ways to archive customers, built from the same components. The customers, the
            support ticket and the account manager are fictional. <a href={href({ name: 'compare' })}>Compare the fixes</a>
          </dd>
        </div>
      </dl>

      <section className="cycle__outcomes quick__findings" aria-labelledby="cycle-outcomes">
        <div className="cycle__outcomes-head">
          <h2 id="cycle-outcomes" className="cycle__h2">
            What the experiment showed
          </h2>
        </div>
        <ol className="cycle__outcomes-list" role="list">
          <li>
            <h3 className="cycle__h3">The agents already built good screens.</h3>
            <p>Both runs reused the components, kept every value on the tokens, and every story passed axe.</p>
          </li>
          <li>
            <h3 className="cycle__h3">The rules made the work complete.</h3>
            <p>With the rules, the agent rendered EmptyState for the emptied table and wrote down why it changed Table.css. Without them, it left the emptied table blank and only flagged the Table.css fix.</p>
          </li>
          <li>
            <h3 className="cycle__h3">Passing the checks didn’t settle what ships.</h3>
            <p>The checks caught the planted mistakes. They couldn’t decide whether archiving should ask first or offer undo after. That decision was a designer’s.</p>
          </li>
        </ol>
        <p className="cycle__from">
          Automated checks here mean the type check, the linters, the token lint, and axe on every story. Passing them is not a usability finding and not a complete
          accessibility review. Each run was a subagent session, and the record says what that changes.
        </p>
      </section>

      <div className="quick__evidence">
        <section className="cycle__section" aria-labelledby="quick-evidence">
          <h2 id="quick-evidence" className="cycle__h2">
            The evidence
          </h2>
          <ul className="cycle__links" role="list">
            <li>
              <Out to={RECORD}>The full experiment record</Out>
            </li>
            <li>
              <Out to={`${CHANGES}/run-1-with-the-rules.md`}>Run 1, with the rules: the agent’s change description</Out>
            </li>
            <li>
              <Out to={`${CHANGES}/run-2-without-the-rules.md`}>Run 2, without the rules: the agent’s change description</Out>
            </li>
            <li>
              <Out to={`${CHANGES}/seeded-drift.md`}>The faulty fixture, written by hand</Out>
            </li>
            <li>
              <a href={href({ name: 'queue' })}>All three versions in the review queue</a>
            </li>
          </ul>
        </section>
        <section className="cycle__section" aria-labelledby="quick-project">
          <h2 id="quick-project" className="cycle__h2">
            The project
          </h2>
          <ul className="cycle__links" role="list">
            <li>
              <a href={href({ name: 'cycle', stage: 'discover' })}>The full design process, in six stages</a>
            </li>
            <li>
              <a href="storybook/" target="_blank" rel="noopener">
                The component catalog, in Storybook
                <Icon name="arrow-up-right" size={12} />
                <span className="visually-hidden"> (opens in a new tab)</span>
              </a>
            </li>
            <li>
              <Out to={SOURCE}>The source, on GitHub</Out>
            </li>
            <li>
              <Out to={STUDY}>The research plan for the archive decision</Out>
            </li>
            <li>
              <a href={CASE_STUDY}>The case study</a>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
