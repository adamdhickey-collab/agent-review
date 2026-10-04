import { Badge, Button, Disclosure, TestStatus, type BadgeTone } from '../../components';
import { ruleText, type Boundary, type Rule, type Work } from '../../data/delegation';
import type { DiffHunk } from '../../data/types';
import { DiffViewer } from '../DiffViewer/DiffViewer';
import { plural } from '../format';
import './WorkRecord.css';
import { Inline } from '../Inline';

/* One piece of completed work, closed to a line and open to its record.
   Closed, it says what it was, on what authority, and the three checks as
   marks. Open, it answers the five questions a person asks of work they did
   not watch being done, in order: what changed, why, on what authority,
   what the checks established (and, said separately, what no check could),
   and whether it can be taken back.

   "What the checks established" is the point of the record. A check's
   word is a fact about the code, never about intent: a pixel-identical
   swap to the wrong one of two same-valued tokens passes everything. So a
   change whose meaning was chosen, by the agent, a rule or the person, says
   in its own line which part of it no check can vouch for.

   Revert is a real reversal in this model (a revert commit on main puts the
   literal back), so it is offered on every merged change and the record
   keeps both events. The button stays the same element when it turns into
   Restore, so focus stays on it. Nothing is offered for a line left as
   written: nothing changed. */

export interface WorkRecordProps {
  work: Work;
  boundaries: Boundary[];
  /** The rule that made it, when a rule did. */
  rule?: Rule;
  onRevert?: () => void;
  onRestore?: () => void;
  open?: boolean;
}

/* What a closed row says about its authority. Work done on its own is the
   ordinary case and carries no badge (the section says "on its own unless
   marked"): seven grey "On its own" pills in a column said nothing a reader
   needed, and made the three that did say something harder to see. */
const BASIS: Record<NonNullable<Work['basis']>['kind'], { label: string; tone: BadgeTone } | undefined> = {
  boundary: undefined,
  rule: { label: 'Your rule', tone: 'accent' },
  answer: { label: 'Your answer', tone: 'accent' },
  'allowed-once': { label: 'Allowed once', tone: 'warning' },
};

const basename = (path: string) => path.split('/').pop();

function hunks(work: Work): DiffHunk[] {
  const own: DiffHunk = {
    file: work.file,
    header: plural(work.lines.length, 'declaration'),
    lines: work.lines.flatMap((l): DiffHunk['lines'] =>
      l.after && work.status !== 'left'
        ? [
            { kind: 'remove' as const, text: `${l.selector} { ${l.property}: ${l.before}; }` },
            { kind: 'add' as const, text: `${l.selector} { ${l.property}: ${l.after}; }` },
          ]
        : [{ kind: 'context' as const, text: `${l.selector} { ${l.property}: ${l.before}; }` }],
    ),
  };
  const added = new Map<string, string[]>();
  for (const a of work.adds ?? []) added.set(a.file, [...(added.get(a.file) ?? []), a.text]);
  return [own, ...Array.from(added, ([file, texts]) => ({ file, header: 'a new token', lines: texts.map((text) => ({ kind: 'add' as const, text })) }))];
}

export function WorkRecord({ work, boundaries, rule, onRevert, onRestore, open }: WorkRecordProps) {
  const basis = work.basis;
  const badge = work.status === 'left' ? { label: 'Left as written', tone: 'neutral' as BadgeTone } : basis ? BASIS[basis.kind] : undefined;
  const cited = basis?.kind === 'boundary' ? boundaries.filter((b) => basis.boundaries.includes(b.n)) : [];
  const n = work.lines.length;

  return (
    <Disclosure
      className="record"
      data-status={work.status}
      open={open}
      summary={
        <span className="record__summary">
          <span className="record__title">
            <Inline text={work.title} />
          </span>
          <span className="record__where">
            {work.screen} <span aria-hidden="true">·</span> {plural(n, 'value')}
            {work.commit && work.status !== 'left' ? (
              <>
                {' '}
                <span aria-hidden="true">·</span> <code>{work.commit}</code>
              </>
            ) : null}
          </span>
        </span>
      }
      meta={
        <span className="record__meta">
          {work.status === 'reverted' ? (
            <Badge tone="neutral" icon="undo">
              Reverted
            </Badge>
          ) : null}
          {badge ? <Badge tone={badge.tone}>{badge.label}</Badge> : null}
          {work.checks && work.status !== 'left' ? (
            <span className="record__marks">
              {work.checks.map((c) => (
                <TestStatus key={c.name} state={c.state} label={`${c.name}: ${c.label}`} iconOnly />
              ))}
            </span>
          ) : null}
        </span>
      }
    >
      <div className="record__body">
        <div className="record__part">
          <p className="record__label">What changed</p>
          <DiffViewer hunks={hunks(work)} />
        </div>

        {work.reason ? (
          <div className="record__part">
            <p className="record__label">Why</p>
            <p>
              <Inline text={work.reason} />
            </p>
          </div>
        ) : null}

        <div className="record__part">
          <p className="record__label">On what authority</p>
          {basis?.kind === 'boundary' ? (
            <ul className="record__bounds">
              {cited.map((b) => (
                <li key={b.n}>
                  <span className="record__n" aria-hidden="true">
                    {b.n}
                  </span>
                  <span>
                    <span className="visually-hidden">Boundary {b.n}: </span>
                    {b.text}
                  </span>
                </li>
              ))}
            </ul>
          ) : basis?.kind === 'rule' && rule ? (
            <p>
              Your rule{rule.status === 'revoked' ? ', since revoked; this change stays until you revert it' : ''}: <Inline text={ruleText(rule)} />
            </p>
          ) : basis?.kind === 'answer' && work.status === 'left' ? (
            <p>Your decision at {basis.at}. Nothing was changed.</p>
          ) : basis?.kind === 'answer' ? (
            <p>Your answer at {basis.at}, for this change only. The agent had asked under boundary {work.question?.paused.join(' and ')}.</p>
          ) : basis?.kind === 'allowed-once' ? (
            <p>You allowed it at {basis.at}, past boundary {work.question?.paused[work.question.paused.length - 1]}, for this change only. The delegation is as it was.</p>
          ) : null}
        </div>

        {work.checks && work.status !== 'left' ? (
          <div className="record__part">
            <p className="record__label">What the checks established</p>
            <ul className="record__checks">
              {work.checks.map((c) => (
                <li key={c.name}>
                  <TestStatus state={c.state} label={`${c.name}: ${c.label}`} />
                  <p>
                    <Inline text={c.established} />
                  </p>
                  {c.earlier ? (
                    <p className="record__earlier">
                      <TestStatus state={c.earlier.state} label={`First run: ${c.earlier.label}`} />
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
            {work.unchecked ? (
              <p className="record__unchecked">
                <strong>What no check establishes:</strong> <Inline text={work.unchecked} />
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="record__part">
          <p className="record__label">History</p>
          <ol className="record__history">
            {work.history.map((e, i) => (
              <li key={i}>
                <time>{e.at}</time>
                <span className="record__who">{e.who === 'you' ? 'You' : 'Claude Code'}</span>
                <span className="record__what">
                  <Inline text={e.text} />
                </span>
              </li>
            ))}
          </ol>
        </div>

        {work.status === 'made' || work.status === 'reverted' ? (
          <div className="record__part record__undo">
            <p>
              {work.status === 'made'
                ? `Reverting adds a commit to main that puts the ${n === 1 ? 'literal' : 'literals'} back${work.adds?.length ? ' and takes the new token out' : ''}. The lint will report ${n === 1 ? 'it' : 'them'} again, and the agent won’t redo it.`
                : `Reverted. Restoring applies ${work.commit} again.`}
            </p>
            <Button
              size="compact"
              variant="secondary"
              leadingIcon={work.status === 'made' ? 'undo' : 'corner-up-left'}
              onClick={work.status === 'made' ? onRevert : onRestore}
            >
              {work.status === 'made' ? 'Revert this change' : 'Restore it'}
            </Button>
          </div>
        ) : work.status === 'left' ? (
          <div className="record__part record__undo">
            <p>Nothing was changed, so there is nothing to revert. The lint still reports the {n === 1 ? 'line' : 'lines'} in <code>{basename(work.file)}</code>.</p>
          </div>
        ) : null}
      </div>
    </Disclosure>
  );
}
