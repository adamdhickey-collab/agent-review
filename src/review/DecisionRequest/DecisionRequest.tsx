import { useEffect, useId, useRef, useState } from 'react';
import { Badge, Button, Checkbox, Disclosure } from '../../components';
import { RULE_EXCLUDES, type Boundary, type Work } from '../../data/delegation';
import { plural } from '../format';
import './DecisionRequest.css';
import { Inline } from '../Inline';

/* A change the agent stopped on, asking for one decision. Two kinds, said
   in the badge because they want different things from the person:

   - What a value means (intent). The agent can make the change and cannot
     tell which change is meant. The card says what no check can settle,
     lays the evidence for each reading side by side, and recommends one.
   - Outside the delegation (scope). The agent knows exactly what to do and
     is not allowed to. The card says what it would do and why that is past
     its authority, and asks for that one change only.

   Both say which boundary stopped it, in the boundary's own words, so the
   pause explains itself where it happens rather than in a settings page.

   Answering is two steps, the system's inline confirmation (rule 6, the
   shape Run 1 introduced): choosing an answer turns the answers into the
   question "apply this?", with Cancel beside it, Escape as Cancel, and
   focus on Apply. That second step is where an answer can become a rule,
   and it is never one by default: the box starts unchecked, and checking it
   shows the rule in words, what it does not cover, and anything it would
   settle at once. A scope decision offers no rule. Allowing a step past the
   boundary once is not the same as moving the boundary. */

export interface RulePreview {
  /** Whether an answer here can make or widen a rule, and if not, why. */
  offer: 'make' | 'widen' | 'conflict' | 'none';
  /** The rule as it would read. */
  text?: string;
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

  return (
    <article className="ask" data-kind={q.kind} aria-labelledby={`${id}-title`}>
      <header className="ask__head">
        <Badge tone={q.kind === 'scope' ? 'warning' : 'accent'}>{q.kind === 'scope' ? 'Outside the delegation' : 'What a value means'}</Badge>
        <span className="ask__where">
          {work.screen} <span aria-hidden="true">·</span> <code>{basename(work.file)}</code>
        </span>
      </header>

      <h3 className="ask__title" id={`${id}-title`}>
        {q.ask}
      </h3>

      {work.sample ? (
        /* The element as it renders. Both names in question draw these two
           colors, so the specimen is the same whichever is chosen. */
        <p className="ask__sample">
          <span className="ask__sample-label">{work.sample.label}</span>
          <s className="ask__sample-old">
            <span className="visually-hidden">was </span>
            {work.sample.old}
          </s>
          {work.sample.replacement ? (
            <span className="ask__sample-new">
              <span className="visually-hidden">, now </span>
              {work.sample.replacement}
            </span>
          ) : (
            <span className="visually-hidden">, removed</span>
          )}
        </p>
      ) : null}

      <p className="ask__found">
        <Inline text={q.found} />
      </p>
      <pre className="ask__code">
        <code>{work.lines.map((l) => `${l.selector} { ${l.property}: ${l.before}; }`).join('\n')}</code>
      </pre>

      <dl className="ask__facts">
        <div>
          <dt>{q.kind === 'intent' ? 'What no check can say' : 'Why it stopped'}</dt>
          <dd>
            <Inline text={q.gap} />
          </dd>
        </div>
      </dl>

      {q.evidence ? (
        <Disclosure className="ask__evidence" summary="The evidence for each reading" meta={plural(q.evidence.length, 'reading')}>
          <ul className="ask__list">
            {q.evidence.map((e) => (
              <li key={e.for}>
                <strong>{e.for}:</strong> <Inline text={e.says} />
              </li>
            ))}
          </ul>
        </Disclosure>
      ) : null}

      <dl className="ask__facts">
        <div>
          <dt>Why it paused</dt>
          <dd>
            {why ? <p className="ask__why">{why}</p> : null}
            <ul className="ask__bounds">
              {boundaries.map((b) => (
                <li key={b.n}>
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
          </dd>
        </div>
        {recommended ? (
          <div>
            <dt>Recommended</dt>
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
                    <strong>It doesn’t cover:</strong> {RULE_EXCLUDES}
                  </p>
                  {p.settles.length ? (
                    <p>
                      <strong>It settles now:</strong> {plural(p.settles.length, 'change')} that match, on the{' '}
                      {Array.from(new Set(p.settles.map((w) => w.screen.toLowerCase()))).join(', ')}.
                    </p>
                  ) : null}
                  <p>You can edit or revoke it under the boundaries. Revoking it doesn’t undo what it already did.</p>
                </div>
              ) : (
                <p className="ask__once">This answer applies to this change only.</p>
              )}
            </div>
          ) : p.offer === 'conflict' ? (
            <p className="ask__once">Your rule gives a different answer for cases like this, so this one applies to this change only. To change the rule, edit or revoke it.</p>
          ) : null}
          {q.note ? (
            <p className="ask__note">
              <Inline text={q.note} />
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
        <div className="ask__options" role="group" aria-label="Answers">
          {q.options.map((o) => (
            <Button
              key={o.id}
              ref={(el) => {
                optionRefs.current[o.id] = el;
              }}
              variant={o.recommended ? 'primary' : 'secondary'}
              onClick={() => setChoice(o.id)}
            >
              {o.label}
            </Button>
          ))}
        </div>
      )}
    </article>
  );
}
