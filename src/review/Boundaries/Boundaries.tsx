import { forwardRef, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { Badge, Button, Checkbox, Disclosure, Icon } from '../../components';
import {
  BOUNDARY_GROUP_ICON,
  BOUNDARY_GROUP_LABEL,
  PATTERN_LABEL,
  RULE_EXCLUDES,
  ruleText,
  type Boundary,
  type BoundaryGroup,
  type Pattern,
  type Rule,
  type Work,
} from '../../data/delegation';
import type { Person } from '../../data/types';
import { plural } from '../format';
import './Boundaries.css';
import { Inline } from '../Inline';

/* What the agent may do here, in the delegation's own words, and the rules
   the person has added since. Not a policy editor and not an autonomy
   slider: seven sentences in three groups, numbered so a paused change can
   say "boundary 5" and the reader can find it.

   A rule is the one thing a person changes here, and only one made from an
   answer. It reads as a sentence, says what it does not cover, lists the
   changes it has made, and has two actions, both a second step: Edit opens
   what it covers as two boxes, with Save and Cancel; Revoke asks first,
   saying what revoking does and does not do (the changes it made stay; a
   matching case asks again). Escape is Cancel in both. A revoked rule stays
   in the list as a record, because the changes it made are still there.

   Since 2026-10-04 the three groups are closed to a line each: the group's
   mark, its name and how many boundaries it holds, open to the sentences.
   Seven sentences beside the work were the panel's whole height and were
   read once, and every paused change already quotes its own boundary in
   place, so the panel is a reference rather than something a decision
   depends on reaching. Your rules stay open, because they are the one thing
   here a person changes. */

export interface BoundariesProps {
  boundaries: Boundary[];
  by: Person;
  rules: Rule[];
  /** The work, to name the changes a rule made. */
  work: Work[];
  onEditRule: (id: string, covers: Pattern[]) => void;
  onRevokeRule: (id: string) => void;
  /** Open a rule in a mode, for a story. */
  initialMode?: 'edit' | 'revoke';
}

const GROUPS: BoundaryGroup[] = ['own', 'asks', 'outside'];

export const Boundaries = forwardRef<HTMLElement, BoundariesProps>(function Boundaries({ boundaries, by, rules, work, onEditRule, onRevokeRule, initialMode }, ref) {
  const active = rules.filter((r) => r.status === 'active').length;
  return (
    <section ref={ref} className="bounds" id="boundaries" aria-labelledby="bounds-title" tabIndex={-1}>
      <h2 id="bounds-title" className="bounds__title">
        What Claude Code may do here
      </h2>
      <p className="bounds__lead">Set by {by.name} for this delegation.</p>
      <div className="bounds__groups">
        {GROUPS.map((g) => {
          const items = boundaries.filter((b) => b.group === g);
          return (
            <Disclosure
              key={g}
              className="bounds__group"
              data-group={g}
              summary={
                <span className="bounds__head">
                  <Icon name={BOUNDARY_GROUP_ICON[g]} size={16} />
                  {BOUNDARY_GROUP_LABEL[g]}
                </span>
              }
              meta={
                <>
                  {items.length}
                  <span className="visually-hidden"> {items.length === 1 ? 'boundary' : 'boundaries'}</span>
                </>
              }
            >
              <ul className="bounds__list">
                {items.map((b) => (
                  <li key={b.n}>
                    <span className="bounds__n" aria-hidden="true">
                      {b.n}
                    </span>
                    <span>
                      <span className="visually-hidden">Boundary {b.n}: </span>
                      {b.text}
                    </span>
                  </li>
                ))}
              </ul>
            </Disclosure>
          );
        })}
      </div>
      <div className="bounds__rules">
        <h3 className="bounds__head">
          Your rules <span className="bounds__count">{active}</span>
        </h3>
        {rules.length === 0 ? (
          <p className="bounds__empty">None yet. An answer about what a value means can become a rule for similar cases, never by default.</p>
        ) : (
          rules.map((r) => <RuleCard key={r.id} rule={r} work={work} onEdit={(covers) => onEditRule(r.id, covers)} onRevoke={() => onRevokeRule(r.id)} initialMode={initialMode} />)
        )}
      </div>
    </section>
  );
});

export interface RuleCardProps {
  rule: Rule;
  work: Work[];
  onEdit: (covers: Pattern[]) => void;
  onRevoke: () => void;
  initialMode?: 'edit' | 'revoke';
}

export function RuleCard({ rule, work, onEdit, onRevoke, initialMode }: RuleCardProps) {
  const id = useId();
  const [mode, setMode] = useState<'view' | 'edit' | 'revoke'>(rule.status === 'active' ? (initialMode ?? 'view') : 'view');
  const [covers, setCovers] = useState<Pattern[]>(rule.covers);
  const first = useRef<HTMLInputElement>(null);
  const confirm = useRef<HTMLButtonElement>(null);
  const edit = useRef<HTMLButtonElement>(null);
  const revoke = useRef<HTMLButtonElement>(null);
  const back = useRef<'edit' | 'revoke' | 'gone' | undefined>(undefined);
  const gone = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (mode === 'edit') first.current?.focus();
    else if (mode === 'revoke') confirm.current?.focus();
    else if (back.current === 'edit') edit.current?.focus();
    else if (back.current === 'revoke') revoke.current?.focus();
    else if (back.current === 'gone') gone.current?.focus();
  }, [mode, rule.status]);

  const leave = () => {
    back.current = mode === 'view' ? undefined : mode;
    setMode('view');
    setCovers(rule.covers);
  };
  const escape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      leave();
    }
  };

  const applied = rule.applied.map((wid) => work.find((w) => w.id === wid)).filter(Boolean) as Work[];
  const reverted = applied.filter((w) => w.status === 'reverted').length;
  const active = rule.status === 'active';
  const made = rule.history[0];
  const toggle = (p: Pattern, on: boolean) => setCovers((c) => (on ? Array.from(new Set([...c, p])) : c.filter((x) => x !== p)));

  return (
    <article className="rule" data-status={rule.status} aria-labelledby={`${id}-text`}>
      <p className="rule__head">
        <Badge tone={active ? 'accent' : 'neutral'}>{active ? 'Active' : 'Revoked'}</Badge>
        <span>Made by you at {made?.at}</span>
      </p>
      <p className="rule__text" id={`${id}-text`}>
        <Inline text={ruleText(rule)} />
      </p>
      <dl className="rule__facts">
        <div>
          <dt>It doesn’t cover</dt>
          <dd>{RULE_EXCLUDES}</dd>
        </div>
        <div>
          <dt>What it has done</dt>
          <dd>
            {applied.length
              ? `${plural(applied.length, 'change')}, on the ${Array.from(new Set(applied.map((w) => w.screen.toLowerCase()))).join(', ')}.`
              : 'Nothing yet.'}
            {reverted ? ` ${reverted === 1 ? 'One' : reverted} since reverted by you.` : ''}
          </dd>
        </div>
        <div>
          <dt>History</dt>
          <dd>
            <ul className="rule__history">
              {rule.history.map((e, i) => (
                <li key={i}>
                  <time>{e.at}</time> {e.text}
                </li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>

      {mode === 'edit' ? (
        <form
          className="rule__form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!covers.length) return;
            onEdit(covers);
            back.current = 'edit';
            setMode('view');
          }}
          onKeyDown={escape}
        >
          <fieldset className="rule__fieldset">
            <legend>It covers</legend>
            {(['replaced', 'removed'] as Pattern[]).map((p, i) => (
              <Checkbox
                key={p}
                ref={i === 0 ? first : undefined}
                label={PATTERN_LABEL[p].replace(/^a /, 'A ')}
                checked={covers.includes(p)}
                onChange={(e) => toggle(p, e.target.checked)}
              />
            ))}
          </fieldset>
          <p className="rule__hint" aria-live="polite">
            {covers.length ? 'Changes it already made stay as they are. Revert any of them under completed work.' : 'Choose at least one, or revoke the rule instead.'}
          </p>
          <div className="rule__actions">
            <Button size="compact" variant="ghost" onClick={leave}>
              Cancel
            </Button>
            <Button size="compact" variant="primary" type="submit" disabled={covers.length === 0}>
              Save
            </Button>
          </div>
        </form>
      ) : mode === 'revoke' ? (
        <div className="rule__confirm" role="group" aria-label="Revoke the rule?" onKeyDown={escape}>
          <p>
            Revoke this rule? A matching case will ask you again. The {plural(applied.length, 'change')} it made {applied.length === 1 ? 'stays' : 'stay'} merged; revert any of them
            under completed work.
          </p>
          <div className="rule__actions">
            <Button size="compact" variant="ghost" onClick={leave}>
              Cancel
            </Button>
            <Button
              ref={confirm}
              size="compact"
              variant="danger"
              onClick={() => {
                back.current = 'gone';
                onRevoke();
                setMode('view');
              }}
            >
              Revoke the rule
            </Button>
          </div>
        </div>
      ) : active ? (
        <div className="rule__actions">
          <Button ref={edit} size="compact" variant="secondary" onClick={() => setMode('edit')}>
            Edit
          </Button>
          <Button ref={revoke} size="compact" variant="danger" onClick={() => setMode('revoke')}>
            Revoke
          </Button>
        </div>
      ) : (
        <p ref={gone} className="rule__gone" tabIndex={-1}>
          It no longer applies. The changes it made stay merged until you revert them.
        </p>
      )}
    </article>
  );
}
