import { useEffect, useId, useRef, useState } from 'react';
import { Badge, Button, Checkbox, Disclosure, Icon, TestStatus, TextArea, type IconName } from '../../components';
import {
  BOUNDARY_GROUP_ICON,
  BOUNDARY_GROUP_LABEL,
  KIND_GROUP,
  KIND_STATUS,
  RULE_EXCLUDES,
  type Boundary,
  type Check,
  type Gathered,
  type Option,
  type Reach,
  type Sample,
  type Twin,
  type Work,
} from '../../data/delegation';
import { DiffViewer } from '../DiffViewer/DiffViewer';
import { plural } from '../format';
import './DecisionRequest.css';
import { Inline } from '../Inline';

/* A change the agent stopped on, asking for one decision. Two kinds, said
   in the badge because they want different things from the person, and
   named as the case study names them (since 2026-10-09 the badge is the
   status, "Needs judgment" or "Needs approval", in the amber the account
   gives what waits on the person; it read "Missing intent" and "Permission
   boundary" from 2026-10-07, and "What a value means" and "Outside the
   delegation" before that):

   - Needs judgment (intent): a person decides. The agent can make the
     change and cannot tell which change is meant. The card says what no
     check can settle, lays the evidence for each reading side by side, and
     recommends one. Not a failure: nothing is broken.
   - Needs approval (scope): a person authorizes. The agent knows
     exactly what to do and is not allowed to. The card says what it would
     do and why that is past its authority, and asks for that one change
     only. Not a technical problem: the checks it could run pass.

   Routine work, the third kind, never reaches this card: the agent does it
   inside its boundaries and the completed work records it.

   Both say which boundary stopped it, in the boundary's own words, so the
   pause explains itself where it happens rather than in a settings page.

   Answering is two steps, the system's inline confirmation (rule 6, the
   shape Run 1 introduced): choosing an answer turns the answers into the
   question "apply this?", with Cancel beside it, Escape as Cancel, and
   focus on Apply. That second step is where an answer can become a rule,
   and it is never one by default: the box starts unchecked, and checking it
   shows the rule in words, what it does not cover, and anything it would
   settle at once. A scope decision offers no rule. Allowing a step past the
   boundary once is not the same as moving the boundary.

   LAID OUT TO BE READ AT A GLANCE (2026-10-04). The card was ten blocks in
   a column: the kind, the question, a specimen, what was found, the code,
   what no check can say, the evidence, why it paused, the recommendation
   and the changes waiting, and only then the answers. Now the answers are
   the body of the card. Each is a card of its own with the button in it,
   and for a value whose meaning is in question each shows the specimen as
   it would render if --color-danger were made louder later, which is the
   whole difference between the two answers and was a sentence before: one
   stays as it is, one follows. The recommended answer carries the badge.

   THE ACCENT, SPENT ONCE (2026-10-09). The recommended answer was blue
   three times over: its edge, its badge and its button, and choosing it
   turned the answers into a blue-tinted panel with a blue Apply. Every
   product the visual research looked at that asks a person to approve an
   agent's work (Cofounder, Replit, Klaviyo, Linear) spends its one colour
   on the act and nothing else. So the blue is the act alone: the
   recommended answer's button, then Apply. Both answers are the same card,
   and "Recommended" is a quiet label; which one the agent recommends is
   still said, in words and by which button is solid. The confirmation is
   a step of ground, not a tint, and its Cancel and Apply sit in a bar at
   its foot that stays in view while the rule's preview is longer than the
   window, with what Apply will do beside them, so the act is never
   scrolled away from the words that say what it is.
   Above them, the question and the one paragraph that says why a person is
   needed (for a scope question, the line of code it would change); under
   them, the boundary that stopped it, on one line. What was found, the
   code, the evidence, the reason for the recommendation and the changes
   held behind it are in one Disclosure, closed, with the count of held
   changes in the card's head where it can be seen without opening it.

   ONE RED, TWO MEANINGS, SHOWN BEFORE IT IS NAMED (2026-10-06). The
   question used to be a sentence: "Both answers are the same pixels, so
   every check passes either way." That sentence is the whole reason the
   agent stopped, and a person who does not think in tokens read past it.
   Now, for a value whose meaning is in question, the card shows it beside
   the twin it is confused with: the element the agent settled on its own
   because its meaning was never in doubt ("Payment failed", a failure),
   and this one, in the same red, under the two names either could take.
   Under them, the checks as they came back with each name in place, every
   one passed, and then the one line that says what that means: nothing
   failed, and no check can say what the red means. The answers then show
   both elements as they would render if danger were made louder later,
   because the difference between the answers is not this element alone,
   it is whether this element keeps company with the failure.

   THE MEANING BEFORE THE NAME (2026-10-06, later). The card showed all of
   that and still had to be decoded: a tile called the plan change "this
   change", the answers were headed by a token name ("If --color-danger is
   made louder later:"), and nothing said which answer kept the two
   meanings apart. Now each tile says what its red is, in words, before its
   token ("A failure", "A replaced value"); the answers sit under "Now
   imagine the failure style gets stronger." and one sentence saying what
   each does; each answer names the choice it makes ("Separate the
   meanings", "Keep the meanings coupled") over what follows from it; and
   under its two specimens it says what each element takes, the meaning
   first and the token after it as the detail.

   WHAT IT WANTS TO CHANGE, AND WHY THAT STOPPED IT (2026-10-07). Read
   aloud, the card still did not say the two things a person explaining it
   says first: the agent wants to change this red, and it stopped because
   the same red is already an existing pattern. The question asked whether
   "the red in a plan change" was "a value that was replaced", which reads
   as a change of plan and a word only a developer uses. Now the question
   names the element and asks why it is red ("Is the old plan red because
   something failed, or because it was replaced?"), the element comes first
   under "What the agent wants to change", and its twin second under "An
   existing pattern with the same red".

   TWO REDS THAT LOOK THE SAME (2026-10-07, later). That question still made
   a reader diagnose why something was red before they knew what was being
   decided. Now the card asks the decision itself, "These two reds look the
   same. Should they mean the same thing?", and reads top to bottom as the
   argument: the two reds, each headed by its meaning ("Replaced value",
   "Failure") with a sentence saying what its red means and its one token
   under that, quietly, no longer a choice between two; the checks, under
   "Both approaches pass the automated checks."; then the one line that
   says why a person is needed, "So this isn't a testing problem. It's a
   meaning decision.", louder than the sentence explaining it. The answers
   sit under "Should these meanings stay separate?" and "Imagine the danger
   style becomes stronger later." Each is headed by the choice in words
   ("Keep the meanings separate", "Keep the meanings linked"), says what it
   does without a token's name, and shows both elements as they would
   render, each beside what happens to it ("Failure changes", "Replacement
   stays the same"); "Only the failure gets louder" and "Both get louder"
   come last, as the summary of what is shown rather than the explanation.
   The replaced value's specimen draws an arrow from the old value to the
   new, so "replaced" can be seen before it is read.

   A FIX THAT REACHES PAST THE SCREEN (2026-10-07, the shared-table run). A
   scope question about a shared component carries its reach (Reach), and
   the card reads as the case for a permission decision: what the agent was
   asked and what it proposes, the change as a diff, who else it reaches (the
   screens by area, every one named under a fold, and the component's
   owner), what has been checked beside what hasn't, and the one line that
   says what kind of decision this is, as the intent card has its own. Its
   answers are headed by what they choose and say what happens after; an
   answer that only gathers evidence decides nothing, so it acts on the
   first press with no confirmation, and the question comes back with what
   was found. Only an answer within the agent's authority can become a rule,
   and the one that grants past it says whose permission a standing version
   would need.

   READ IN THE ORDER A DECISION IS MADE (2026-10-09). Three changes, each
   so that a reader who has never seen the product knows within a few
   lines what kind of stop this is and what each answer costs. The badge is
   the status and carries the amber of "waiting on you", not the grey of a
   label. The three checks that passed with either token fold to one line,
   "All 3 automated checks passed, with either token.", with the results
   one press away: three green badges in a row were the loudest thing on a
   card whose point is that passing is not the answer. And where the
   answers differ in kind, each says what it means for the system beyond
   this change, under its own heading: within the agent's authority and
   able to become a rule; allowed once, with the boundary left where it
   is; or deciding nothing yet. The two-reds card's answers are the same
   kind, so they say nothing there and the confirmation's rule box carries
   it.

   A TRADE-OFF, NOT A RIDDLE (2026-10-09, later). Every version above asked
   a question whose right answer was obvious once read: two token names
   that drew the same pixels, one of them recommended, and nothing on the
   other side. A stop that only a careless person could get wrong shows an
   agent that asks for permission, not a decision that needs a person. Now
   the billing run's question is a trade-off with two defensible directions
   (data/billing.ts), and the card is built to weigh them:

   - What the agent found, as before: the two reds side by side, each
     headed by its meaning and the screen it is on, and under the value in
     question the literal it is today. The checks, folded, say they pass
     with either direction and that only this value moves.
   - The agent's read, in two tiles: what it recommends and why, and what
     it can't determine, which could change that, with what it inferred
     rather than checked. That tile carries the warning's ground, the one
     colour on the screen that means "waiting on a person", because it is
     the reason the person is here. Beside it, a way to ask for evidence
     before deciding, which decides nothing.
   - The two directions as two cards of one shape: the direction, what it
     does in a sentence, both elements as they would look, then three
     benefits and three risks, so neither card is the longer argument.
     "Recommended" is a quiet label on one of them and nothing else: both
     buttons are the same, and the accent stays the act's (Apply).
   - Choosing is not deciding. A card's button marks it chosen
     (aria-pressed) and opens, under the cards, what the agent will do if
     it is applied, in order, the person's reason, and the rule box; the
     other card stays where it was, so a person can compare, switch, and
     read the other plan with one press. Switching keeps what was typed
     for each direction and clears the rule box, which is never on by
     default. Focus goes to the plan's heading, so it is read before Apply.
   - The reason starts as the agent's draft for that direction, and the
     record says whether the person kept it or wrote their own. It is the
     person's words that the record and any rule carry.

   The other questions (a new token, a shared component) keep the shape
   above: choosing an answer turns the answers into its confirmation. */

/* The twin as it renders: the status text in the red both names draw. */
function TwinSpecimen({ twin }: { twin: Twin }) {
  return (
    <p className="ask__sample">
      <span className="ask__sample-status">{twin.text}</span>
    </p>
  );
}

/* What an answer means for the system beyond this change, read from what
   the option does rather than from its words: gathering evidence decides
   nothing, granting lets the agent past a boundary once, and an answer
   within its authority is the only kind that can become a rule. Leaving a
   line as written says so in its own effect, and gets no second line. */
function consequence(o: Option): { icon: IconName; text: string } | undefined {
  if (o.asks) return { icon: 'search', text: 'Decides nothing yet. The question comes back with what it finds.' };
  if (o.grants) return { icon: 'lock', text: 'Allowed once. The boundary stays where it is.' };
  if (o.rule) return { icon: 'circle-check', text: `Within the agent’s authority. Can become a rule for ${o.rule.scope.charAt(0).toLowerCase()}${o.rule.scope.slice(1)}.` };
  return undefined;
}

/* A check's result as a badge: a pass is quiet, anything else is said. */
function CheckBadge({ check }: { check: Check }) {
  const passed = check.state === 'passed';
  return (
    <Badge
      size="large"
      tone={passed ? 'success' : 'neutral'}
      variant={passed ? 'quiet' : 'tint'}
      icon={passed ? 'status-passed' : check.state === 'changed' ? 'status-changed' : 'status-inconclusive'}
    >
      {check.name}: {check.label}
    </Badge>
  );
}

function Specimen({ sample, unlabelled }: { sample: Sample; unlabelled?: boolean }) {
  /* The element as it renders today: the old value struck through in the
     red, and the value that replaced it. `unlabelled` leaves its label
     ("Plan") to the tile above. */
  return (
    <p className="ask__sample">
      {unlabelled ? null : <span className="ask__sample-label">{sample.label}</span>}
      <s className="ask__sample-old">
        <span className="visually-hidden">was </span>
        {sample.old}
      </s>
      {sample.replacement ? (
        <>
          <Icon name="arrow-right" size={12} className="ask__sample-arrow" />
          <span className="ask__sample-new">
            <span className="visually-hidden">, now </span>
            {sample.replacement}
          </span>
        </>
      ) : (
        <span className="visually-hidden">, removed</span>
      )}
    </p>
  );
}

/* The element as a direction would draw it: the label that says what
   happened, then the value, neutral or in the red it has today. The label
   is the system's Badge with the swap mark, the same in both directions;
   the color is the whole difference between them. */
function Labelled({ sample, label, neutral }: { sample: Sample; label: string; neutral: boolean }) {
  return (
    <p className="ask__sample ask__sample--labelled" data-look={neutral ? 'neutral' : 'red'}>
      <Badge icon="swap">{label}</Badge>
      <span className="ask__sample-label">{sample.label}</span>
      <s className="ask__sample-old">
        <span className="visually-hidden">was </span>
        {sample.old}
      </s>
      {sample.replacement ? (
        <>
          <Icon name="arrow-right" size={12} className="ask__sample-arrow" />
          <span className="ask__sample-new">
            <span className="visually-hidden">, now </span>
            {sample.replacement}
          </span>
        </>
      ) : null}
    </p>
  );
}

/* What the agent found when it was asked for evidence: a short record with
   its labels in the margin, the way the permission card labels what it was
   asked. What it couldn't verify is said as plainly as what it could, and
   the way to find out is marked as proposed, because nobody has run it. */
function GatheredEvidence({ g, id }: { g: Gathered; id: string }) {
  const list = (items: string[]) => (
    <ul className="ask__gathered-list">
      {items.map((t) => (
        <li key={t}>
          <Inline text={t} />
        </li>
      ))}
    </ul>
  );
  return (
    <section className="ask__gathered" aria-labelledby={`${id}-gathered`}>
      <p className="ask__gathered-head" id={`${id}-gathered`}>
        <Icon name="search" size={16} />
        What the agent found when you asked
      </p>
      <dl className="ask__brief">
        <div>
          <dt>Where this red is used</dt>
          <dd>
            <ul className="ask__gathered-list">
              {g.uses.map((u) => (
                <li key={u.what}>
                  <strong>
                    <Inline text={u.what} />:
                  </strong>{' '}
                  {u.places}
                </li>
              ))}
            </ul>
          </dd>
        </div>
        <div>
          <dt>What each would change</dt>
          <dd>
            <ul className="ask__gathered-list">
              {g.changes.map((c) => (
                <li key={c.direction}>
                  <strong>{c.direction}:</strong> {c.text}
                </li>
              ))}
            </ul>
          </dd>
        </div>
        <div>
          <dt>What depends on it</dt>
          <dd>{list(g.depends)}</dd>
        </div>
        <div>
          <dt>Not verified</dt>
          <dd>{list(g.unverified)}</dd>
        </div>
        <div>
          <dt>A way to find out</dt>
          <dd>
            {g.validation} <span className="ask__proposed">Proposed, not run.</span>
          </dd>
        </div>
      </dl>
    </section>
  );
}

/* The case for a permission decision about a shared component, in the
   order a person would make it: what was asked and what is proposed, the
   change itself, who else it reaches, what is known beside what isn't, and
   what kind of decision that leaves. */
function ReachCase({ work, reach, id }: { work: Work; reach: Reach; id: string }) {
  const q = work.question!;
  const proposal = q.options.find((o) => o.grants);
  const screens = reach.areas.reduce((n, a) => n + a.screens.length, 0);
  return (
    <>
      <dl className="ask__brief">
        <div>
          <dt>Asked</dt>
          <dd>{q.asked}</dd>
        </div>
        <div>
          <dt>Proposes</dt>
          <dd>
            <Inline text={q.proposes ?? ''} />
          </dd>
        </div>
      </dl>
      {proposal ? (
        <DiffViewer
          hunks={[
            {
              file: work.file,
              header: 'the change it would make',
              lines: work.lines.flatMap((l, i) => [
                { kind: 'remove' as const, text: `${l.selector} { ${l.property}: ${l.before}; }` },
                { kind: 'add' as const, text: `${l.selector} { ${l.property}: ${proposal.after[i]}; }` },
              ]),
            },
          ]}
        />
      ) : null}

      <div className="ask__reach" role="group" aria-labelledby={`${id}-reach`}>
        <p className="ask__label" id={`${id}-reach`}>
          Who else it reaches
        </p>
        <p className="ask__reach-lead">
          <strong>{screens} screens</strong> draw the shared {reach.component}, which {reach.owner.name} ({reach.owner.role}) owns.
        </p>
        <ul className="ask__areas" aria-label="Screens by area">
          {reach.areas.map((a) => (
            <li key={a.area}>
              <Badge variant="quiet">
                {a.area} <span className="ask__area-n">{a.screens.length}</span>
              </Badge>
            </li>
          ))}
        </ul>
        <Disclosure className="ask__screens" summary={`All ${screens} screens`}>
          <div className="ask__screens-body">
            <p className="ask__screens-key">
              <span>
                <Icon name="eye" size={16} /> has a visual baseline
              </span>
              <span>
                <Icon name="ruler" size={16} /> table in a panel of fixed height
              </span>
            </p>
            <div className="ask__screens-areas">
              {reach.areas.map((a) => (
                <div key={a.area}>
                  <p className="ask__screens-area">{a.area}</p>
                  <ul>
                    {a.screens.map((sc) => (
                      <li key={sc.name}>
                        <span>
                          {sc.name}
                          {sc.asked ? <span className="ask__asked"> (asked about)</span> : null}
                        </span>
                        {sc.baseline ? <Icon name="eye" size={16} label="has a visual baseline" /> : null}
                        {sc.fixed ? <Icon name="ruler" size={16} label="table in a panel of fixed height" /> : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </Disclosure>
      </div>

      <ul className="ask__pair ask__known" aria-label="What is known">
        <li className="ask__tile">
          <p className="ask__label">Checked</p>
          <ul className="ask__known-list">
            {reach.checked.map((c) => (
              <li key={c.text}>
                <TestStatus state={c.state} iconOnly />
                <span>
                  <Inline text={c.text} />
                </span>
              </li>
            ))}
          </ul>
        </li>
        <li className="ask__tile">
          <p className="ask__label">Not checked</p>
          <ul className="ask__known-list">
            {reach.unknown.map((u) => (
              <li key={u}>
                <TestStatus state="skipped" iconOnly />
                <span>{u}</span>
              </li>
            ))}
          </ul>
        </li>
      </ul>

      <div className="ask__why-person">
        {q.verdict ? <p className="ask__verdict">{q.verdict}</p> : null}
        <p className="ask__gap">
          <Inline text={q.gap} />
        </p>
      </div>
    </>
  );
}

export interface RulePreview {
  /** Whether an answer here can make or widen a rule, and if not, why. */
  offer: 'make' | 'widen' | 'conflict' | 'none';
  /** The rule as it would read. */
  text?: string;
  /** What it would not cover, and where it applies, from the answer's draft. */
  excludes?: string;
  scope?: string;
  /** A rule written in its own words can be revoked but not edited. */
  fixed?: boolean;
  /** What it would settle now, besides this change. */
  settles: Work[];
  /** For a conflict: the rule that already answers differently. */
  existing?: string;
}

export interface DecisionRequestProps {
  work: Work;
  /** Why it is asking now, when that is more than the boundary: a held change asking after an answer. */
  why?: string;
  /** The boundaries that stopped it, resolved from their numbers. */
  boundaries: Boundary[];
  /** Changes held until this is answered. */
  waiting?: Work[];
  preview: (optionId: string) => RulePreview;
  /** The answer, whether to keep it as a rule, and, for a trade-off, the person's reason. */
  onAnswer: (optionId: string, makeRule: boolean, reason?: string) => void;
  /** Open with an answer already chosen, for a story. */
  initialChoice?: string;
}

const basename = (path: string) => path.split('/').pop();

export function DecisionRequest({ work, why, boundaries, waiting = [], preview, onAnswer, initialChoice }: DecisionRequestProps) {
  const q = work.question!;
  const id = useId();
  const [choice, setChoice] = useState<string | undefined>(initialChoice);
  const [makeRule, setMakeRule] = useState(false);
  /* What the person has typed for each direction, so switching between
     them and back loses nothing. Untouched, a direction's reason is the
     agent's draft. */
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const apply = useRef<HTMLButtonElement>(null);
  const plan = useRef<HTMLParagraphElement>(null);
  const optionRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const returnTo = useRef<string | undefined>(undefined);

  /* A trade-off: two directions a person weighs, each with what it is good
     for and what it costs (data/billing.ts). */
  const tradeoff = q.options.some((o) => o.benefits);

  useEffect(() => {
    if (choice) (tradeoff ? plan.current : apply.current)?.focus();
    else if (returnTo.current) optionRefs.current[returnTo.current]?.focus();
  }, [choice, tradeoff]);

  const option = q.options.find((o) => o.id === choice);
  const recommended = q.options.find((o) => o.recommended);
  const p = choice ? preview(choice) : undefined;
  const ruleOn = makeRule && (p?.offer === 'make' || p?.offer === 'widen');

  const cancel = () => {
    returnTo.current = choice;
    setChoice(undefined);
    setMakeRule(false);
  };

  /* Choosing a direction of a trade-off: the card stays, marked, and the
     plan opens under the cards. Choosing the other switches; pressing the
     chosen one again lets it go. */
  const pick = (o: Option) => {
    if (choice === o.id) return cancel();
    returnTo.current = undefined;
    setChoice(o.id);
    setMakeRule(false);
  };

  const sample = work.sample;
  const twin = q.kind === 'intent' ? q.twin : undefined;
  const directions = q.options.filter((o) => o.benefits);
  const evidence = q.options.find((o) => o.asks);
  const moreLabel = q.kind === 'intent' ? (q.evidence ? 'The evidence and the code' : 'The code') : q.reach ? 'What it found' : 'Why it stopped';
  /* Whether the answers differ in what they mean for the system, which is
     when each says so. */
  const differ = q.options.some((o) => o.asks || o.grants || o.leaves);
  /* The value's label in a direction ("Replaced"), from its means. */
  const said = q.means?.split(' ')[0] ?? '';
  const reasonOf = (o: Option) => reasons[o.id] ?? o.decision?.reason ?? '';

  const rulePart = p ? (
    p.offer === 'make' || p.offer === 'widen' ? (
      <div className="ask__rule">
        <Checkbox
          label={p.offer === 'widen' ? 'Add this case to your rule' : tradeoff ? 'Use this decision for similar cases' : 'Also use this answer for similar cases'}
          checked={makeRule}
          onChange={(e) => setMakeRule(e.target.checked)}
        />
        {makeRule ? (
          <div className="ask__rule-preview" aria-live="polite">
            <p className="ask__rule-label">The rule, as it will read</p>
            <p className="ask__rule-text">
              <Inline text={p.text ?? ''} />
            </p>
            <p>
              <strong>It doesn’t cover:</strong> {p.excludes ?? RULE_EXCLUDES}
            </p>
            {p.settles.length ? (
              <p>
                <strong>It settles now:</strong> {plural(p.settles.length, 'change')} that match, on the{' '}
                {Array.from(new Set(p.settles.map((w) => w.screen.toLowerCase()))).join(', ')}.
              </p>
            ) : null}
            <p>
              <strong>Next time:</strong>{' '}
              {tradeoff
                ? 'a case that matches doesn’t ask you. The agent follows the rule, and its record names the decision the rule came from.'
                : 'a case that matches doesn’t ask you. The agent follows the rule and says so in its record.'}
            </p>
            <p>You can {p.fixed ? 'revoke' : 'edit or revoke'} it under the boundaries. Revoking it doesn’t undo what it already did.</p>
          </div>
        ) : (
          <p className="ask__once">{tradeoff ? 'This decision applies to this change only.' : 'This answer applies to this change only.'}</p>
        )}
      </div>
    ) : p.offer === 'conflict' ? (
      <p className="ask__once">Your rule gives a different answer for cases like this, so this one applies to this change only. To change the rule, edit or revoke it.</p>
    ) : null
  ) : null;

  const bar = option ? (
    <div className="ask__bar">
      <p className="ask__bar-what">
        <Inline text={option.label} />
        {ruleOn ? ', kept as a rule' : ''}
      </p>
      <div className="ask__actions">
        <Button variant="ghost" onClick={cancel}>
          Cancel
        </Button>
        <Button ref={apply} variant="primary" type="submit">
          Apply
        </Button>
      </div>
    </div>
  ) : null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!option) return;
    onAnswer(option.id, Boolean(ruleOn), tradeoff ? reasonOf(option) : undefined);
  };
  const escape = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
    }
  };

  return (
    <article className="ask" data-kind={q.kind} data-tradeoff={tradeoff || undefined} aria-labelledby={`${id}-title`}>
      <header className="ask__head">
        {/* The kind is the card's status, in the amber the account's bar
            gives what waits on the person; its mark is the boundary
            group's own (the panel's question or lock), so the card and the
            panel name the stop the same way. */}
        <Badge tone="warning" icon={BOUNDARY_GROUP_ICON[KIND_GROUP[q.kind]]}>
          {KIND_STATUS[q.kind]}
        </Badge>
        <span className="ask__where">
          {work.screen} <span aria-hidden="true">·</span> <code>{basename(work.file)}</code>
        </span>
        {waiting.length ? (
          <Badge className="ask__holds" icon="clock">
            {plural(waiting.length, 'change')} {waiting.length === 1 ? 'waits' : 'wait'} on this
          </Badge>
        ) : null}
      </header>

      <h3 className="ask__title" id={`${id}-title`}>
        {q.ask}
      </h3>

      {why ? <p className="ask__why">{why}</p> : null}

      {twin && sample ? (
        <ul className="ask__pair" aria-label="The two reds">
          <li className="ask__tile" data-current>
            <p className="ask__label">
              {q.means} <span className="ask__tile-where">· {work.screen}</span>
            </p>
            <Specimen sample={sample} />
            <p className="ask__tile-means">{q.says}</p>
            <p className="ask__tile-token">
              <Inline text={`Hard-coded ${work.lines[0]?.before ?? ''}, from the old billing app`} />
            </p>
          </li>
          <li className="ask__tile">
            <p className="ask__label">
              {twin.means} <span className="ask__tile-where">· {twin.screen}</span>
            </p>
            <TwinSpecimen twin={twin} />
            <p className="ask__tile-means">{twin.says}</p>
            <p className="ask__tile-token">
              <Inline text={twin.token} />
            </p>
          </li>
        </ul>
      ) : null}

      {q.kind === 'intent' && q.tried ? (
        <Disclosure
          className="ask__tried"
          summary={
            <span className="ask__tried-sum">
              <Icon name="status-passed" size={16} />
              {tradeoff ? 'Lint and accessibility pass with either direction. Only this value moves.' : `All ${q.tried.length} automated checks passed, with either token.`}
            </span>
          }
        >
          <ul className="ask__checks" aria-label={tradeoff ? 'The checks, with each direction in place' : 'The checks, with either token in place'}>
            {q.tried.map((c) => (
              <li key={c.name}>
                <CheckBadge check={c} />
                <span className="ask__check-says">{c.established}</span>
              </li>
            ))}
          </ul>
        </Disclosure>
      ) : null}

      {tradeoff ? (
        <>
          {/* THE AGENT'S READ: what it recommends, and what it can't
              determine that could change it. */}
          <ul className="ask__pair ask__read" aria-label="The agent’s read">
            {recommended ? (
              <li className="ask__tile">
                <p className="ask__label">Recommended</p>
                <p className="ask__read-head">{recommended.title}</p>
                <p className="ask__tile-means">
                  <Inline text={q.recommendation} />
                </p>
              </li>
            ) : null}
            <li className="ask__tile ask__unknown">
              <p className="ask__label">
                <Icon name="message-question" size={16} />
                What I can’t determine
              </p>
              <p className="ask__tile-means">{q.unknown}</p>
              {q.inferred ? (
                <p className="ask__tile-token">
                  <strong>Inferred, not checked:</strong> {q.inferred}
                </p>
              ) : null}
              {evidence ? (
                <Button
                  className="ask__evidence"
                  size="compact"
                  variant="secondary"
                  leadingIcon="search"
                  ref={(el) => {
                    optionRefs.current[evidence.id] = el;
                  }}
                  /* Asking for evidence decides nothing, so it needs no
                     second step: the question comes back with more. */
                  onClick={() => onAnswer(evidence.id, false)}
                >
                  {evidence.label}
                </Button>
              ) : null}
            </li>
          </ul>

          {q.gathered ? <GatheredEvidence g={q.gathered} id={id} /> : null}

          <div className="ask__options" role="group" aria-labelledby={`${id}-if`}>
            <p className="ask__if" id={`${id}-if`}>
              Which trade-off is acceptable?
            </p>
            <p className="ask__later">Both directions are defensible, and the agent can apply either. Choosing one shows what it will do.</p>
            <ul className="ask__choices ask__choices--tradeoff" data-count={directions.length}>
              {directions.map((o) => {
                const chosen = choice === o.id;
                return (
                  <li key={o.id} className="ask__choice" data-recommended={o.recommended || undefined} data-chosen={chosen || undefined}>
                    <div className="ask__choice-head">
                      <p className="ask__choice-title">{o.title}</p>
                      {o.recommended ? (
                        <Badge variant="quiet" className="ask__recommended">
                          Recommended
                        </Badge>
                      ) : null}
                    </div>
                    <p className="ask__choice-says">{o.outcome}</p>
                    {twin && sample ? (
                      <div className="ask__looks" aria-label={`How it looks: ${o.title}`} role="group">
                        <TwinSpecimen twin={twin} />
                        <Labelled sample={sample} label={said} neutral={o.id === 'separate'} />
                      </div>
                    ) : null}
                    <div className="ask__weigh">
                      <p className="ask__weigh-label" id={`${id}-${o.id}-good`}>
                        Benefits
                      </p>
                      <ul className="ask__weigh-list" data-kind="benefit" aria-labelledby={`${id}-${o.id}-good`}>
                        {o.benefits!.map((b) => (
                          <li key={b}>
                            <Icon name="plus" size={14} />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="ask__weigh-label" id={`${id}-${o.id}-cost`}>
                        Risks
                      </p>
                      <ul className="ask__weigh-list" data-kind="risk" aria-labelledby={`${id}-${o.id}-cost`}>
                        {(o.risks ?? []).map((r) => (
                          <li key={r}>
                            <Icon name="minus" size={14} />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Button
                      ref={(el) => {
                        optionRefs.current[o.id] = el;
                      }}
                      className="ask__pick"
                      variant="secondary"
                      aria-pressed={chosen}
                      leadingIcon={chosen ? 'check' : undefined}
                      onClick={() => pick(o)}
                    >
                      {chosen ? 'Chosen' : 'Choose'}
                      <span className="visually-hidden"> {o.title}</span>
                    </Button>
                  </li>
                );
              })}
            </ul>
          </div>

          {option && p ? (
            <form className="ask__confirm ask__decide" aria-labelledby={`${id}-plan`} onSubmit={submit} onKeyDown={escape}>
              <p ref={plan} className="ask__plan-head" id={`${id}-plan`} tabIndex={-1}>
                If you apply “{option.title}”, the agent will:
              </p>
              <ol className="ask__plan">
                {(option.plan ?? []).map((step) => (
                  <li key={step}>
                    <Inline text={step} />
                  </li>
                ))}
              </ol>
              {option.decision ? (
                <TextArea
                  className="ask__reason"
                  label="Your reason"
                  hint={
                    reasonOf(option) === option.decision.reason
                      ? 'Drafted by the agent from the direction you chose. Change it to what you know; the decision record keeps your words.'
                      : 'In your words. The decision record keeps them.'
                  }
                  rows={2}
                  value={reasonOf(option)}
                  onChange={(e) => setReasons((r) => ({ ...r, [option.id]: e.target.value }))}
                />
              ) : null}
              {rulePart}
              {bar}
            </form>
          ) : null}
        </>
      ) : (
        <>
          {q.kind === 'scope' && q.reach ? (
            <ReachCase work={work} reach={q.reach} id={id} />
          ) : q.kind === 'intent' ? (
            <div className="ask__why-person">
              {q.verdict ? <p className="ask__verdict">{q.verdict}</p> : null}
              <p className="ask__gap">
                <Inline text={q.gap} />
              </p>
            </div>
          ) : (
            <pre className="ask__code">
              <code>{work.lines.map((l) => `${l.selector} { ${l.property}: ${l.before}; }`).join('\n')}</code>
            </pre>
          )}

          {option && p ? (
            <form className="ask__confirm" aria-label={`Apply: ${option.label}`} onSubmit={submit} onKeyDown={escape}>
              <p className="ask__effect">
                <strong>
                  <Inline text={option.label} />.
                </strong>{' '}
                <Inline text={option.effect} />
              </p>
              {rulePart}
              {option.note ?? q.note ? (
                <p className="ask__note">
                  <Inline text={option.note ?? q.note ?? ''} />
                </p>
              ) : null}
              {bar}
            </form>
          ) : (
            <div className="ask__options" role="group" aria-label="Answers">
              <ul className="ask__choices" data-count={q.options.length}>
                {q.options.map((o) => (
                  <li key={o.id} className="ask__choice" data-recommended={o.recommended || undefined}>
                    <div className="ask__choice-head">
                      {o.title ? <p className="ask__choice-title">{o.title}</p> : null}
                      {o.recommended ? (
                        <Badge variant="quiet" className="ask__recommended">
                          Recommended
                        </Badge>
                      ) : null}
                    </div>
                    <p className="ask__effect-line">
                      <Inline text={o.outcome ?? o.effect} />
                    </p>
                    {differ && consequence(o) ? (
                      <p className="ask__choice-keeps">
                        <Icon name={consequence(o)!.icon} size={14} />
                        <span>{consequence(o)!.text}</span>
                      </p>
                    ) : null}
                    <Button
                      ref={(el) => {
                        optionRefs.current[o.id] = el;
                      }}
                      variant={o.recommended ? 'primary' : 'secondary'}
                      /* Gathering evidence decides nothing, so it needs no
                         second step: the question comes back with more. */
                      onClick={() => (o.asks ? onAnswer(o.id, false) : setChoice(o.id))}
                    >
                      {o.label}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <ul className="ask__bounds" aria-label="Why it paused">
        {boundaries.map((b) => (
          <li key={b.n} data-group={b.group}>
            <Icon name={BOUNDARY_GROUP_ICON[b.group]} size={16} />
            <span className="ask__n" aria-hidden="true">
              {b.n}
            </span>
            <span>
              <span className="visually-hidden">Boundary {b.n}, </span>
              {b.group === 'own' ? '' : `${BOUNDARY_GROUP_LABEL[b.group]}: `}
              {b.text}
            </span>
          </li>
        ))}
      </ul>

      <Disclosure className="ask__more" summary={moreLabel}>
        <div className="ask__more-body">
          {q.kind === 'intent' ? (
            <>
              {!twin && sample ? <Specimen sample={sample} /> : null}
              <p>
                <Inline text={q.found} />
              </p>
              <pre className="ask__code">
                <code>{work.lines.map((l) => `${l.selector} { ${l.property}: ${l.before}; }`).join('\n')}</code>
              </pre>
            </>
          ) : (
            <>
              <p>
                <Inline text={q.found} />
              </p>
              {q.reach ? null : (
                <dl className="ask__facts">
                  <div>
                    <dt>Why it stopped</dt>
                    <dd>
                      <Inline text={q.gap} />
                    </dd>
                  </div>
                </dl>
              )}
            </>
          )}
          <dl className="ask__facts">
            {q.evidence ? (
              <div>
                <dt>The evidence for each reading</dt>
                <dd>
                  <ul className="ask__list">
                    {q.evidence.map((e) => (
                      <li key={e.for}>
                        <strong>{e.for}:</strong> <Inline text={e.says} />
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            ) : null}
            {recommended && !tradeoff ? (
              <div>
                <dt>Why it recommends one</dt>
                <dd>
                  <strong>
                    <Inline text={recommended.label} />.
                  </strong>{' '}
                  <Inline text={q.recommendation} />
                </dd>
              </div>
            ) : null}
            {waiting.length ? (
              <div>
                <dt>Also waiting</dt>
                <dd>
                  {plural(waiting.length, 'change')} {waiting.length === 1 ? 'is' : 'are'} held until you decide, because the same decision may settle {waiting.length === 1 ? 'it' : 'them'}:
                  <ul className="ask__list">
                    {waiting.map((w) => (
                      <li key={w.id}>
                        {w.screen}: {w.sample?.label.toLowerCase()}
                        {w.question?.pattern === 'removed' ? ', struck through with nothing replacing it' : ''}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      </Disclosure>
    </article>
  );
}
