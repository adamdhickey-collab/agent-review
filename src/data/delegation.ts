import type { IconName, TestState } from '../components';
import type { AgentIdentity, Person } from './types';

/* Delegated work: the shape of a run an agent was handed, and the rules for
   how it moves. The review queue (types.ts) is built around one change and
   one decision about it. This is built around the opposite case: an agent
   that has done most of a job on its own, inside boundaries a person set, and
   stopped only where those boundaries say it must.

   Everything that changes state is in `reduce`, a pure function, so the
   screen, the stories and the tests all drive the same machine and a given
   sequence of presses always ends in the same place. Nothing here learns.
   A rule exists because a person made one, says in words what it covers,
   and stops applying the moment it is revoked. */

/** The three things a boundary can say about an action. */
export type BoundaryGroup = 'own' | 'asks' | 'outside';

export const BOUNDARY_GROUP_LABEL: Record<BoundaryGroup, string> = {
  own: 'Does on its own',
  asks: 'Asks you first',
  outside: 'Outside this delegation',
};

/** Each group's mark, the same in the boundaries panel and on a paused change. */
export const BOUNDARY_GROUP_ICON: Record<BoundaryGroup, IconName> = {
  own: 'circle-check',
  asks: 'message-question',
  outside: 'lock',
};

export interface Boundary {
  /** Numbered, so a paused change can say which one stopped it. */
  n: number;
  group: BoundaryGroup;
  text: string;
}

export interface Brief {
  title: string;
  /** The request, as the person who delegated it wrote it. */
  request: string;
  by: Person;
  agent: AgentIdentity;
  repo: string;
  /** Where the agent may work. */
  area: string;
  delegatedAt: string;
  /** When the agent last did anything. */
  lastActive: string;
  /** What the token lint reported when the run started. Every item below accounts for some of it. */
  literals: number;
}

/** On what authority a change was made. */
export type Basis =
  | { kind: 'boundary'; boundaries: number[] }
  | { kind: 'rule'; ruleId: string }
  | { kind: 'answer'; at: string }
  | { kind: 'allowed-once'; at: string };

export type CheckName = 'Token lint' | 'Visual baselines' | 'Stories with axe';

export interface Check {
  name: CheckName;
  state: TestState;
  /** What to say instead of the state's own word: "0 of 4 frames moved". */
  label: string;
  /** What the result shows, in a sentence. */
  established: string;
  /** A result from an earlier run of the same check, when it differed. */
  earlier?: { state: TestState; label: string };
}

export interface Entry {
  at: string;
  who: 'agent' | 'you';
  text: string;
}

/** One declaration the change touches. `after` is filled in when it is made. */
export interface Line {
  selector: string;
  property: string;
  before: string;
  after?: string;
}

/** A line written outside the screen's own stylesheet: a new token. */
export interface Addition {
  file: string;
  text: string;
}

/** A value shown struck through: beside the value that replaced it, or on its own. */
export type Pattern = 'replaced' | 'removed';

export const PATTERN_LABEL: Record<Pattern, string> = {
  replaced: 'a value struck through beside the one that replaced it',
  removed: 'a value struck through with nothing replacing it',
};

export interface Option {
  id: string;
  /** The button: "Use the diff pair". */
  label: string;
  /** The value each line takes, in order, if this is chosen. */
  after: string[];
  /** What choosing it does, for the confirmation. */
  effect: string;
  recommended?: boolean;
  /** Lines written elsewhere if this is chosen. */
  adds?: Addition[];
  /** Choosing it leaves the code as it is. */
  leaves?: boolean;
}

export interface Question {
  /** Intent: the agent can act but cannot tell what is meant. Scope: it knows what to do and may not. */
  kind: 'intent' | 'scope';
  ask: string;
  /** What the agent found. */
  found: string;
  /** For intent, what no check can say; for scope, why it stopped. */
  gap: string;
  /** Competing evidence, for an intent question. */
  evidence?: { for: string; says: string }[];
  /** Why the recommended option. */
  recommendation: string;
  /** The boundaries that stopped it. */
  paused: number[];
  options: Option[];
  /** The struck-through pattern this is an instance of, so an answer can become a rule for it. */
  pattern?: Pattern;
  /** For a question about what a value means: an element drawn in the same
      value whose meaning is not in question, so the person sees one color
      with two meanings side by side before reading a token's name. */
  twin?: Twin;
  /** The checks, run with each answer in place in turn, when every answer
      gave the same result: the record that no check can choose between them. */
  tried?: Check[];
  /** What the value in question is, in plain words, set against the twin's
      meaning: "A replaced value". */
  means?: string;
  /** What each answer does if the twin's token changes later, in a sentence
      over the answers: both change, or only the twin does. */
  later?: string;
  note?: string;
}

/** An element in the same color as the one in question, whose meaning was settled. */
export interface Twin {
  /** The element as it reads: "Payment failed". */
  text: string;
  /** What it is, in plain words: "A failure". */
  means: string;
  /** The screen it is on, in words. */
  screen: string;
  /** The token it was given. */
  token: string;
  /** What that token is for, in a word, as an answer names it: "danger". */
  role: string;
}

/** A rendered specimen of the element in question, so a designer sees it as well as reads it. */
export interface Sample {
  label: string;
  old: string;
  replacement?: string;
}

export type WorkStatus = 'made' | 'asking' | 'waiting' | 'reverted' | 'left';

export interface Work {
  id: string;
  file: string;
  /** The screen, in words: "Invoice detail". */
  screen: string;
  /** Past tense, for the record. */
  title: string;
  status: WorkStatus;
  lines: Line[];
  adds?: Addition[];
  basis?: Basis;
  /** Why the agent did it, in its words. */
  reason?: string;
  checks?: Check[];
  /** What no check could establish about it. */
  unchecked?: string;
  commit?: string;
  history: Entry[];
  question?: Question;
  /** A change held because another question's answer may settle it. */
  waitsOn?: string;
  sample?: Sample;
  /** How many frames and stories the checks cover on this screen. */
  frames: number;
  stories: number;
}

export interface Rule {
  id: string;
  /** The option it chooses, by id, for every case it covers. */
  answer: string;
  covers: Pattern[];
  status: 'active' | 'revoked';
  /** The question it was made from. */
  from: string;
  /** The changes it settled, in order. */
  applied: string[];
  history: Entry[];
}

export interface DelegationState {
  brief: Brief;
  boundaries: Boundary[];
  work: Work[];
  rules: Rule[];
  /** Minutes after the scenario's now (14:26) at which the next thing a person does happens. */
  clock: number;
  /** The last thing that happened, for the live region and the screen's notice. */
  notice?: string;
}

export type Action =
  | { type: 'answer'; id: string; option: string; makeRule: boolean }
  | { type: 'revert'; id: string }
  | { type: 'restore'; id: string }
  | { type: 'edit-rule'; id: string; covers: Pattern[] }
  | { type: 'revoke-rule'; id: string }
  | { type: 'reset'; to: DelegationState };

/* ------------------------------------------------------------------------
   Reading the state
   ------------------------------------------------------------------------ */

const NOW = { h: 14, m: 26 };

export function clockTime(minutes: number): string {
  const total = NOW.h * 60 + NOW.m + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export const valuesIn = (ws: Work[]) => ws.reduce((n, w) => n + w.lines.length, 0);

export function activeRule(s: DelegationState): Rule | undefined {
  return s.rules.find((r) => r.status === 'active');
}

export function find(s: DelegationState, id: string): Work | undefined {
  return s.work.find((w) => w.id === id);
}

/** The changes held behind a question. */
export function waitingOn(s: DelegationState, id: string): Work[] {
  return s.work.filter((w) => w.status === 'waiting' && w.waitsOn === id);
}

/** What a rule says, in words, from what it covers and what it chooses. */
export function ruleText(rule: Pick<Rule, 'answer' | 'covers'>): string {
  const diff = rule.answer === 'diff';
  const old = diff ? '--color-diff-remove-ink' : '--color-danger';
  const replacement = diff ? '--color-diff-add-ink' : '--color-success';
  const both = rule.covers.includes('replaced') && rule.covers.includes('removed');
  if (both) return `On the billing screens, a value struck through takes ${old}, whether or not a new value stands beside it; a new value beside it takes ${replacement}.`;
  if (rule.covers.includes('removed')) return `On the billing screens, a value struck through with nothing replacing it takes ${old}.`;
  return `On the billing screens, a value struck through beside the one that replaced it takes ${old}, and the new value takes ${replacement}.`;
}

export const RULE_EXCLUDES = 'Any other red or green, a row’s background, shared components, and every screen outside billing.';

/** The changes still asking whose pattern a rule would settle, other than the one being answered. */
export function wouldSettle(s: DelegationState, rule: Pick<Rule, 'covers'>, except?: string): Work[] {
  const asking = s.work.filter((w) => w.id !== except && w.status === 'asking' && w.question?.pattern && rule.covers.includes(w.question.pattern));
  const waiting = s.work.filter((w) => w.id !== except && w.status === 'waiting' && w.waitsOn === except && w.question?.pattern && rule.covers.includes(w.question.pattern));
  return [...asking, ...waiting];
}

/** Why a change is asking now, in a sentence, from the state rather than from when it was written. */
export function whyAsking(s: DelegationState, w: Work): string {
  const q = w.question;
  if (!q) return '';
  const cite = q.paused.map((n) => `boundary ${n}`).join(' and ');
  if (!w.waitsOn || !q.pattern) return `It stopped under ${cite}.`;
  const first = find(s, w.waitsOn);
  const rule = activeRule(s);
  if (rule && !rule.covers.includes(q.pattern)) {
    return `Close to your rule, but outside it. Your rule covers ${rule.covers.map((p) => PATTERN_LABEL[p]).join(' and ')}; this is ${PATTERN_LABEL[q.pattern]}.`;
  }
  const revoked = s.rules.find((r) => r.status === 'revoked' && r.covers.includes(q.pattern!));
  if (!rule && revoked) {
    const at = revoked.history[revoked.history.length - 1]?.at;
    return `Your rule for this was revoked at ${at}, so it asks again.`;
  }
  const answered = first?.history.find((e) => e.who === 'you');
  return `You answered the same question for the ${first?.screen.toLowerCase()} at ${answered?.at ?? 'an earlier time'}, once. A one-time answer doesn’t carry over to another change.`;
}

/** The account the screen opens on. Every number is counted from the work, never carried. */
export function account(s: DelegationState) {
  const by = (st: Work['status']) => s.work.filter((w) => w.status === st);
  const made = by('made');
  const asking = by('asking');
  const waiting = by('waiting');
  const reverted = by('reverted');
  const left = by('left');
  const checked = [...made, ...reverted];
  const fixed = checked.filter((w) => w.checks?.some((c) => c.earlier?.state === 'failed'));
  const inconclusive = checked.filter((w) => w.checks?.some((c) => c.state === 'inconclusive'));
  const allowedOnce = made.filter((w) => w.basis?.kind === 'allowed-once');
  const byRule = made.filter((w) => w.basis?.kind === 'rule');
  return {
    made,
    asking,
    waiting,
    reverted,
    left,
    fixed,
    inconclusive,
    allowedOnce,
    byRule,
    valuesMade: valuesIn(made),
    literalsLeft: valuesIn([...asking, ...waiting, ...reverted, ...left]),
    total: valuesIn(s.work),
    scopeAsks: asking.filter((w) => w.question?.kind === 'scope'),
  };
}

/* ------------------------------------------------------------------------
   Changing it
   ------------------------------------------------------------------------ */

const hash = (seed: string) => {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0).toString(16).padStart(8, '0').slice(0, 7);
};

/** The checks on a change that moved no pixel, with the result each one gives and what it shows. */
export function cleanChecks(frames: number, stories: number): Check[] {
  return [
    { name: 'Token lint', state: 'passed', label: 'Passed', established: 'These lines name tokens now, and every token they name exists.' },
    { name: 'Visual baselines', state: 'passed', label: `0 of ${frames} frames moved`, established: 'Nothing on the screen moved, at 1280 and at 768.' },
    { name: 'Stories with axe', state: 'passed', label: `${stories} of ${stories} passed`, established: 'Every story of the screen renders, and axe found no violation.' },
  ];
}

function make(w: Work, option: Option, basis: Basis, at: string, how: string, unchecked: string): Work {
  const commit = hash(`${w.id}:${option.id}:${basis.kind}`);
  const lines = w.lines.map((l, i) => ({ ...l, after: option.after[i] }));
  return {
    ...w,
    status: 'made',
    lines,
    adds: option.adds,
    basis,
    checks: cleanChecks(w.frames, w.stories),
    unchecked,
    commit,
    history: [
      ...w.history,
      { at, who: 'agent', text: `${how} ${option.effect}` },
      { at, who: 'agent', text: `Ran the checks: the token lint passed, 0 of ${w.frames} frames moved, ${w.stories} of ${w.stories} stories passed.` },
      { at, who: 'agent', text: `Merged to main as ${commit}.` },
    ],
  };
}

/** Settle what a rule now covers, and ask about what was waiting and nothing covers. Repeats until nothing moves. */
function settle(s: DelegationState, at: string): { state: DelegationState; settled: Work[]; asked: Work[] } {
  let state = s;
  const settled: Work[] = [];
  const asked: Work[] = [];
  const rule = activeRule(state);
  const work = state.work.map((w) => {
    const ready = w.status === 'asking' || (w.status === 'waiting' && w.waitsOn && find(state, w.waitsOn)?.status !== 'asking' && find(state, w.waitsOn)?.status !== 'waiting');
    if (!ready || !w.question) return w;
    if (rule && w.question.pattern && rule.covers.includes(w.question.pattern)) {
      const option = w.question.options.find((o) => o.id === rule.answer);
      if (!option) return w;
      const done = make(
        w,
        option,
        { kind: 'rule', ruleId: rule.id },
        at,
        'Followed your rule.',
        'Whether your rule fits this case. Both answers are the same pixels, so no check can tell; your rule decided it.',
      );
      settled.push(done);
      return done;
    }
    if (w.status === 'waiting') {
      const asking: Work = {
        ...w,
        status: 'asking',
        history: [...w.history, { at, who: 'agent', text: rule ? 'Asked: your rule doesn’t cover this case.' : 'Asked: the answer it was waiting on was given once, and doesn’t cover this change.' }],
      };
      asked.push(asking);
      return asking;
    }
    return w;
  });
  if (settled.length && rule) {
    state = {
      ...state,
      rules: state.rules.map((r) => (r.id === rule.id ? { ...r, applied: [...r.applied, ...settled.map((w) => w.id)] } : r)),
    };
  }
  return { state: { ...state, work }, settled, asked };
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function tell(settled: Work[], asked: Work[]): string {
  const parts: string[] = [];
  if (settled.length) parts.push(`Your rule settled ${plural(settled.length, 'waiting change')}.`);
  if (asked.length) parts.push(`${plural(asked.length, 'change')} ${asked.length === 1 ? 'is' : 'are'} asking now.`);
  return parts.join(' ');
}

export function reduce(s: DelegationState, a: Action): DelegationState {
  const at = clockTime(s.clock);
  const tick = { clock: s.clock + 1 };
  switch (a.type) {
    case 'reset':
      return a.to;

    case 'answer': {
      const w = find(s, a.id);
      const option = w?.question?.options.find((o) => o.id === a.option);
      if (!w || w.status !== 'asking' || !w.question || !option) return s;
      const q = w.question;
      let rules = s.rules;
      let ruleNote = '';
      const current = activeRule(s);
      if (a.makeRule && q.pattern && (!current || current.answer === option.id)) {
        if (current) {
          rules = rules.map((r) =>
            r.id === current.id
              ? { ...r, covers: Array.from(new Set([...r.covers, q.pattern!])), history: [...r.history, { at, who: 'you', text: `Widened it to cover ${PATTERN_LABEL[q.pattern!]}.` }] }
              : r,
          );
          ruleNote = ' Your rule now covers this case too.';
        } else {
          const id = `rule-${rules.length + 1}`;
          rules = [
            ...rules,
            { id, answer: option.id, covers: [q.pattern], status: 'active', from: w.id, applied: [], history: [{ at, who: 'you', text: `Made it from the ${w.screen.toLowerCase()}’s question.` }] },
          ];
          ruleNote = ' You made it a rule.';
        }
      }

      let done: Work;
      if (option.leaves) {
        done = {
          ...w,
          status: 'left',
          basis: { kind: 'answer', at },
          history: [...w.history, { at, who: 'you', text: `Chose: ${option.label.toLowerCase()}. ${option.effect}` }],
        };
      } else if (q.kind === 'scope') {
        done = make(
          { ...w, history: [...w.history, { at, who: 'you', text: `Allowed this one change past boundary ${q.paused[q.paused.length - 1]}.` }] },
          option,
          { kind: 'allowed-once', at },
          at,
          'Made the change you allowed.',
          'Whether the system should have this token. That was your call, for this change only; the agent still won’t add a token on its own.',
        );
      } else {
        done = make(
          { ...w, history: [...w.history, { at, who: 'you', text: `Answered: ${option.label.toLowerCase()}.${ruleNote}` }] },
          option,
          { kind: 'answer', at },
          at,
          'Applied your answer.',
          'Whether that is the right meaning. Both answers are the same pixels, so no check can tell; that was your answer.',
        );
      }

      const next = { ...s, ...tick, rules, work: s.work.map((x) => (x.id === w.id ? done : x)) };
      const { state, settled, asked } = settle(next, at);
      const ruled = ruleNote === ' You made it a rule.' ? ', and made a rule' : ruleNote ? ', and added the case to your rule' : '';
      const lead = option.leaves ? 'Left as written.' : q.kind === 'scope' ? 'Allowed once, made and merged.' : `Answered${ruled}.`;
      const quiet = state.work.some((x) => x.status === 'asking') ? '' : 'Nothing else needs you.';
      return { ...state, notice: [lead, tell(settled, asked), quiet].filter(Boolean).join(' ') };
    }

    case 'revert': {
      const w = find(s, a.id);
      if (!w || w.status !== 'made') return s;
      const commit = hash(`revert:${w.id}:${s.clock}`);
      return {
        ...s,
        ...tick,
        work: s.work.map((x) =>
          x.id === w.id
            ? { ...x, status: 'reverted', history: [...x.history, { at, who: 'you', text: `Reverted it: ${commit} on main puts the ${w.lines.length === 1 ? 'literal' : 'literals'} back. The agent won’t redo it.` }] }
            : x,
        ),
        notice: `Reverted: ${w.title}.`,
      };
    }

    case 'restore': {
      const w = find(s, a.id);
      if (!w || w.status !== 'reverted') return s;
      return {
        ...s,
        ...tick,
        work: s.work.map((x) => (x.id === w.id ? { ...x, status: 'made', history: [...x.history, { at, who: 'you', text: `Restored it: ${w.commit} is applied again.` }] } : x)),
        notice: `Restored: ${w.title}.`,
      };
    }

    case 'edit-rule': {
      const r = s.rules.find((x) => x.id === a.id);
      if (!r || r.status !== 'active' || a.covers.length === 0) return s;
      const covers = (['replaced', 'removed'] as Pattern[]).filter((p) => a.covers.includes(p));
      const next = {
        ...s,
        ...tick,
        rules: s.rules.map((x) =>
          x.id === r.id ? { ...x, covers, history: [...x.history, { at, who: 'you' as const, text: `Edited it to cover ${covers.map((p) => PATTERN_LABEL[p]).join(' and ')}.` }] } : x,
        ),
      };
      const { state, settled, asked } = settle(next, at);
      return { ...state, notice: ['Rule saved.', tell(settled, asked)].filter(Boolean).join(' ') };
    }

    case 'revoke-rule': {
      const r = s.rules.find((x) => x.id === a.id);
      if (!r || r.status !== 'active') return s;
      return {
        ...s,
        ...tick,
        rules: s.rules.map((x) => (x.id === r.id ? { ...x, status: 'revoked', history: [...x.history, { at, who: 'you', text: 'Revoked it.' }] } : x)),
        notice: `Rule revoked. The ${plural(r.applied.length, 'change')} it made ${r.applied.length === 1 ? 'stays' : 'stay'} merged; a matching case will ask you again.`,
      };
    }
  }
}

/** The state after a sequence of actions, so a story or a test can open on any point in the loop. */
export function play(start: DelegationState, ...actions: Action[]): DelegationState {
  return actions.reduce(reduce, start);
}
