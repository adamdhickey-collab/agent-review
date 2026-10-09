import type { ReactNode } from 'react';
import { Badge, Button, Disclosure, TestStatus, type BadgeTone, type TestState } from '../../components';
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
   written: nothing changed.

   ONE MARK A ROW, SINCE 2026-10-09. Closed, a row was three marks in three
   columns named once over the list (Lint, Pixels, Axe), and a reader
   counted columns to find the one that was not a pass. Every checklist the
   visual research looked at (Klaviyo's review submission, Linear's issues)
   gives a row one mark, its title and one grey line, and says the
   exception in words. So: the row's worst check is its mark, beside the
   title, and the grey line under it names any check that did not plainly
   pass ("Axe inconclusive") and a fix after a failed first try. The three
   checks one by one are what the open record says first. Nothing a row
   said is gone; what was a pattern of marks is a phrase. */

/* The checks' short names, as the old columns had them. */
const SHORT: Record<string, string> = { 'Token lint': 'Lint', 'Visual baselines': 'Pixels', 'Stories with axe': 'Axe' };
const WORST: TestState[] = ['failed', 'inconclusive', 'changed'];

/* One mark for a row: its worst check, labelled with what it is, and the
   words the grey line adds when a check did not plainly pass or passed
   only after a failed first try. */
export function verdict(work: Work): { state: TestState; label: string; note?: string } {
  if (work.status === 'left') return { state: 'skipped', label: 'Nothing changed' };
  const checks = work.checks ?? [];
  const worst = WORST.find((s) => checks.some((c) => c.state === s)) ?? 'passed';
  const odd = checks.filter((c) => c.state !== 'passed').map((c) => `${SHORT[c.name] ?? c.name} ${c.state}`);
  const fixed = checks.some((c) => c.state === 'passed' && c.earlier?.state === 'failed');
  const note = [...odd, fixed ? 'fixed after a failed first try' : ''].filter(Boolean).join(', ');
  return {
    state: worst,
    label: odd.length ? odd.join(', ') : 'Every check passed',
    note: note ? note.charAt(0).toUpperCase() + note.slice(1) : undefined,
  };
}

/* A row's head: the mark beside the title, and the grey line under it,
   aligned with the title. The routine swaps' row uses it too. */
export function RecordHead({ state, label, title, where }: { state: TestState; label: string; title: ReactNode; where: ReactNode }) {
  return (
    <span className="record__summary">
      <span className="record__line">
        <TestStatus state={state} label={label} iconOnly className="record__mark" />
        <span className="record__title">{title}</span>
      </span>
      <span className="record__where">{where}</span>
    </span>
  );
}

export interface WorkRecordProps {
  work: Work;
  boundaries: Boundary[];
  /** The rule that made it, when a rule did. */
  rule?: Rule;
  /** What the run counts a line as, for the summary: "value", "declaration". */
  line?: string;
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
  answer: { label: 'Your decision', tone: 'accent' },
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
  /* Lines written elsewhere, a hunk per file, headed by what they are: a
     new token, a label in the screen's markup, an exception written down. */
  const added = new Map<string, { header: string; texts: string[] }>();
  for (const a of work.adds ?? []) {
    const had = added.get(a.file);
    added.set(a.file, { header: had?.header ?? a.header ?? 'a new token', texts: [...(had?.texts ?? []), a.text] });
  }
  return [own, ...Array.from(added, ([file, { header, texts }]) => ({ file, header, lines: texts.map((text) => ({ kind: 'add' as const, text })) }))];
}

export function WorkRecord({ work, boundaries, rule, line = 'value', onRevert, onRestore, open }: WorkRecordProps) {
  const basis = work.basis;
  const badge = work.status === 'left' ? { label: 'Left as written', tone: 'neutral' as BadgeTone } : basis ? BASIS[basis.kind] : undefined;
  const cited = basis?.kind === 'boundary' ? boundaries.filter((b) => basis.boundaries.includes(b.n)) : [];
  const n = work.lines.length;
  const v = verdict(work);

  return (
    <Disclosure
      className="record"
      data-status={work.status}
      open={open}
      summary={
        <RecordHead
          state={v.state}
          label={v.label}
          title={<Inline text={work.title} />}
          where={
            <>
              {work.screen} <span aria-hidden="true">·</span> {plural(n, line)}
              {work.commit && work.status !== 'left' ? (
                <>
                  {' '}
                  <span aria-hidden="true">·</span> <code>{work.commit}</code>
                </>
              ) : null}
              {v.note ? (
                <>
                  {' '}
                  <span aria-hidden="true">·</span> <span className="record__note" data-state={v.state}>{v.note}</span>
                </>
              ) : null}
            </>
          }
        />
      }
      /* Only when there is a badge to show: an empty meta still took a
         line of its own under the title on a phone. */
      meta={
        work.status === 'reverted' || badge ? (
          <span className="record__meta">
            {work.status === 'reverted' ? (
              <Badge tone="neutral" icon="undo">
                Reverted
              </Badge>
            ) : null}
            {badge ? <Badge tone={badge.tone}>{badge.label}</Badge> : null}
          </span>
        ) : undefined
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
            <p>Your decision at {basis.at}, for this change only. The agent had asked under boundary {work.question?.paused.join(' and ')}.</p>
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
          {/* A timeline, since 2026-10-09: a dot per event on one rail, what
              happened as the line, and when and who beside it, the way an
              agent run's activity reads elsewhere (Mintlify's). It was a
              three-column table of time, who and what, where the reader met
              the clock first and the event last. A dot is the person's when
              the person did it. */}
          <ol className="record__history">
            {work.history.map((e, i) => (
              <li key={i} data-who={e.who}>
                <span className="record__what">
                  <Inline text={e.text} />
                </span>
                <span className="record__when">
                  <time>{e.at}</time> <span aria-hidden="true">·</span> {e.who === 'you' ? 'You' : 'Claude Code'}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {work.status === 'made' || work.status === 'reverted' ? (
          <div className="record__part record__undo">
            <p>
              {work.status === 'made' && work.undo
                ? work.undo
                : work.status === 'made'
                ? `Reverting adds a commit to main that puts the ${n === 1 ? 'literal' : 'literals'} back${work.adds?.length ? ` and takes ${work.adds.some((a) => (a.header ?? 'a new token') === 'a new token') ? 'the new token' : 'what it added'} out` : ''}. The lint will report ${n === 1 ? 'it' : 'them'} again, and the agent won’t redo it.`
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
