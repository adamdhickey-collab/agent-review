import { useEffect, useId, useRef, useState } from 'react';
import { Badge, Button, Checkbox, Disclosure, Icon, TestStatus } from '../../components';
import { BOUNDARY_GROUP_ICON, RULE_EXCLUDES, type Boundary, type Check, type Option, type Reach, type Sample, type Twin, type Work } from '../../data/delegation';
import { DiffViewer } from '../DiffViewer/DiffViewer';
import { plural } from '../format';
import './DecisionRequest.css';
import { Inline } from '../Inline';

/* A change the agent stopped on, asking for one decision. Two kinds, said
   in the badge because they want different things from the person, and
   named as the case study names them (since 2026-10-07; they were "What a
   value means" and "Outside the delegation"):

   - Missing intent (intent): a person decides. The agent can make the
     change and cannot tell which change is meant. The card says what no
     check can settle, lays the evidence for each reading side by side, and
     recommends one. Not a failure: nothing is broken.
   - Permission boundary (scope): a person authorizes. The agent knows
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
   would need. */

/* Whether choosing an option ties the element to --color-danger, so that a
   change to danger's red would reach it. Read from the values the option
   writes, not from its label. */
const followsDanger = (o: Option) => o.after.some((v) => v.includes('--color-danger)'));

/* The twin as it renders: the status text in the red both names draw. */
function TwinSpecimen({ twin, loud }: { twin: Twin; loud?: boolean }) {
  return (
    <p className={['ask__sample', loud ? 'ask__sample--loud' : ''].filter(Boolean).join(' ')}>
      <span className="ask__sample-status">{twin.text}</span>
    </p>
  );
}

/* A token name out of the value an option writes: "var(--color-danger)" is
   --color-danger. */
const tokenOf = (value: string) => value.replace(/^var\((.*)\)$/, '$1');


/* A check's result as a badge: a pass is quiet, anything else is said. */
function CheckBadge({ check }: { check: Check }) {
  const passed = check.state === 'passed';
  return (
    <Badge size="large" tone={passed ? 'success' : 'neutral'} variant={passed ? 'quiet' : 'tint'} icon={passed ? 'status-passed' : 'status-inconclusive'}>
      {check.name}: {check.label}
    </Badge>
  );
}

function Specimen({ sample, loud, unlabelled }: { sample: Sample; loud?: boolean; unlabelled?: boolean }) {
  /* The element as it renders. Both names in question draw these two colors
     today, so the specimen is the same whichever is chosen; `loud` draws it
     as it would look if danger's red were made louder and it followed.
     `unlabelled` leaves its label ("Plan") to the tile above, where an
     answer card shows it again beside what happens to it. */
  return (
    <p className={['ask__sample', loud ? 'ask__sample--loud' : ''].filter(Boolean).join(' ')}>
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
  onAnswer: (optionId: string, makeRule: boolean) => void;
  /** Open with an answer already chosen, for a story. */
  initialChoice?: string;
}

const basename = (path: string) => path.split('/').pop();

export function DecisionRequest({ work, why, boundaries, waiting = [], preview, onAnswer, initialChoice }: DecisionRequestProps) {
  const q = work.question!;
  const id = useId();
  const [choice, setChoice] = useState<string | undefined>(initialChoice);
  const [makeRule, setMakeRule] = useState(false);
  const apply = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const returnTo = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (choice) apply.current?.focus();
    else if (returnTo.current) optionRefs.current[returnTo.current]?.focus();
  }, [choice]);

  const option = q.options.find((o) => o.id === choice);
  const recommended = q.options.find((o) => o.recommended);
  const p = choice ? preview(choice) : undefined;

  const cancel = () => {
    returnTo.current = choice;
    setChoice(undefined);
    setMakeRule(false);
  };

  const sample = work.sample;
  const twin = q.kind === 'intent' ? q.twin : undefined;
  const contrast = sample && q.options.some(followsDanger) && q.options.some((o) => !followsDanger(o));
  /* The value in question's own token: the name an answer writes to its first
     line that is not the twin's. Its tile shows that one only, as the token
     its meaning would have, not as a choice between two. */
  const own = twin ? q.options.map((o) => o.after[0]).filter(Boolean).map(tokenOf).find((n) => n !== twin.token) : undefined;
  /* What each answer does when danger gets louder, said of the two elements
     the answer shows: "Only the failure gets louder", "Both get louder". */
  const outcome = (follows: boolean) =>
    twin ? (follows ? 'Both get louder' : `Only the ${twin.means.toLowerCase()} gets louder`) : follows ? 'Follows it' : 'Stays as it is';
  const moreLabel = q.kind === 'intent' ? (q.evidence ? 'The evidence and the code' : 'The code') : q.reach ? 'What it found' : 'Why it stopped';

  return (
    <article className="ask" data-kind={q.kind} aria-labelledby={`${id}-title`}>
      <header className="ask__head">
        {/* The kind is a label, not a state, so it is quiet; its mark is the
            boundary group's own (the panel's lock or question), in that
            group's color, so the card and the panel name it the same way. */}
        <Badge tone={q.kind === 'scope' ? 'warning' : 'neutral'} variant="quiet" icon={BOUNDARY_GROUP_ICON[q.kind === 'scope' ? 'outside' : 'asks']}>
          {q.kind === 'scope' ? 'Permission boundary' : 'Missing intent'}
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
            <p className="ask__label">{q.means}</p>
            <Specimen sample={sample} />
            <p className="ask__tile-means">{q.says}</p>
            {own ? (
              <p className="ask__tile-token">
                <Inline text={own} />
              </p>
            ) : null}
          </li>
          <li className="ask__tile">
            <p className="ask__label">{twin.means}</p>
            <TwinSpecimen twin={twin} />
            <p className="ask__tile-means">{twin.says}</p>
            <p className="ask__tile-token">
              <Inline text={twin.token} />
            </p>
          </li>
        </ul>
      ) : null}

      {q.kind === 'intent' && q.tried ? (
        <div className="ask__tried" role="group" aria-labelledby={`${id}-tried`}>
          <p className="ask__tried-label" id={`${id}-tried`}>
            Both approaches pass the automated checks.
          </p>
          <ul className="ask__checks">
            {q.tried.map((c) => (
              <li key={c.name}>
                <CheckBadge check={c} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {q.kind === 'scope' && q.reach ? (
        <ReachCase work={work} reach={q.reach} id={id} />
      ) : q.kind === 'intent' ? (
        <div className="ask__why-person">
          {/* What the checks passing means, said before why: the line a
              person should take away is that this one is theirs. */}
          {q.tried ? <p className="ask__verdict">So this isn’t a testing problem. It’s a meaning decision.</p> : null}
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
        <form
          className="ask__confirm"
          aria-label={`Apply: ${option.label}`}
          onSubmit={(e) => {
            e.preventDefault();
            onAnswer(option.id, makeRule && (p.offer === 'make' || p.offer === 'widen'));
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              cancel();
            }
          }}
        >
          <p className="ask__effect">
            <strong>
              <Inline text={option.label} />.
            </strong>{' '}
            <Inline text={option.effect} />
          </p>
          {p.offer === 'make' || p.offer === 'widen' ? (
            <div className="ask__rule">
              <Checkbox
                label={p.offer === 'widen' ? 'Add this case to your rule' : 'Also use this answer for similar cases'}
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
                    <strong>Next time:</strong> a case that matches doesn’t ask you. The agent follows the rule and says so in its record.
                  </p>
                  <p>You can {p.fixed ? 'revoke' : 'edit or revoke'} it under the boundaries. Revoking it doesn’t undo what it already did.</p>
                </div>
              ) : (
                <p className="ask__once">This answer applies to this change only.</p>
              )}
            </div>
          ) : p.offer === 'conflict' ? (
            <p className="ask__once">Your rule gives a different answer for cases like this, so this one applies to this change only. To change the rule, edit or revoke it.</p>
          ) : null}
          {option.note ?? q.note ? (
            <p className="ask__note">
              <Inline text={option.note ?? q.note ?? ''} />
            </p>
          ) : null}
          <div className="ask__actions">
            <Button variant="ghost" onClick={cancel}>
              Cancel
            </Button>
            <Button ref={apply} variant="primary" type="submit">
              Apply
            </Button>
          </div>
        </form>
      ) : (
        <div className="ask__options" role="group" aria-labelledby={contrast ? `${id}-if` : undefined} aria-label={contrast ? undefined : 'Answers'}>
          {contrast && twin ? (
            <>
              <p className="ask__if" id={`${id}-if`}>
                Should these meanings stay separate?
              </p>
              <p className="ask__later">Imagine the {twin.role} style becomes stronger later.</p>
            </>
          ) : contrast ? (
            <p className="ask__if" id={`${id}-if`}>
              If <Inline text="--color-danger" /> is made louder later:
            </p>
          ) : null}
          <ul className="ask__choices" data-count={q.options.length}>
            {q.options.map((o) => {
              const follows = followsDanger(o);
              return (
                <li key={o.id} className="ask__choice" data-recommended={o.recommended || undefined}>
                  <div className="ask__choice-head">
                    {contrast && twin ? (
                      <p className="ask__choice-title">{follows ? 'Keep the meanings linked' : 'Keep the meanings separate'}</p>
                    ) : o.title ? (
                      <p className="ask__choice-title">{o.title}</p>
                    ) : contrast ? (
                      <p className="ask__outcome">
                        <Icon name={follows ? 'alert' : 'check'} size={16} />
                        <span>{outcome(follows)}</span>
                      </p>
                    ) : null}
                    {o.recommended ? (
                      <Badge tone="accent" className="ask__recommended">
                        Recommended
                      </Badge>
                    ) : null}
                  </div>
                  {contrast && twin && sample ? (
                    <>
                      <p className="ask__choice-says">
                        {follows ? `Both meanings continue using the ${twin.role} token.` : `${q.noun} and ${twin.means.toLowerCase()} use different semantic tokens.`}
                      </p>
                      {/* Both elements as they would render with a stronger
                          danger, each beside what happens to it. */}
                      <ul className="ask__then" aria-label={`If the ${twin.role} style becomes stronger`}>
                        <li>
                          <TwinSpecimen twin={twin} loud />
                          <span className="ask__then-what">{twin.means} changes</span>
                        </li>
                        <li>
                          <Specimen sample={sample} loud={follows} unlabelled />
                          <span className="ask__then-what">
                            {q.noun} {follows ? 'changes too' : 'stays the same'}
                          </span>
                        </li>
                      </ul>
                      <p className="ask__outcome">
                        <Icon name={follows ? 'alert' : 'check'} size={16} />
                        <span>{outcome(follows)}</span>
                      </p>
                    </>
                  ) : contrast && sample ? (
                    <div className="ask__samples">
                      <Specimen sample={sample} loud={follows} />
                    </div>
                  ) : o.outcome ? (
                    <p className="ask__effect-line">
                      <Inline text={o.outcome} />
                    </p>
                  ) : (
                    <p className="ask__effect-line">
                      <Inline text={o.effect} />
                    </p>
                  )}
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
              );
            })}
          </ul>
        </div>
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
              {b.group === 'asks' ? 'Asks you first: ' : b.group === 'outside' ? 'Outside this delegation: ' : ''}
              {b.text}
            </span>
          </li>
        ))}
      </ul>

      <Disclosure className="ask__more" summary={moreLabel}>
        <div className="ask__more-body">
          {q.kind === 'intent' ? (
            <>
              {!contrast && sample ? <Specimen sample={sample} /> : null}
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
            {recommended ? (
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
                  {plural(waiting.length, 'change')} {waiting.length === 1 ? 'is' : 'are'} held until you answer, because the same answer may settle {waiting.length === 1 ? 'it' : 'them'}:
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
