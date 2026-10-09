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

/** The three things a boundary can say about an action, which are the
    three kinds of work the screen tells apart (2026-10-09, one word per
    kind everywhere, as the case study names them): the agent proceeds on
    its own; it stops for a person's judgment, a question of meaning or
    intent no check settles; or it stops for a person's approval, an action
    past what this delegation lets it do. Judgment and approval are not the
    same stop: an agent can know exactly what a change does and still not be
    allowed to make it. */
export type BoundaryGroup = 'own' | 'asks' | 'outside';

export const BOUNDARY_GROUP_LABEL: Record<BoundaryGroup, string> = {
  own: 'Proceeds on its own',
  asks: 'Asks for your judgment',
  outside: 'Needs your approval',
};

/** Which group a question's kind belongs to, and the status a change
    stopped on it shows: a question of intent wants judgment, a question
    of scope wants approval. */
export const KIND_GROUP: Record<Question['kind'], BoundaryGroup> = { intent: 'asks', scope: 'outside' };
export const KIND_STATUS: Record<Question['kind'], string> = { intent: 'Needs judgment', scope: 'Needs approval' };

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

/** The delegated runs the product can play, each its own scenario. */
export type RunId = 'billing' | 'shared-table';

/** The words a run counts and reports its work in, where they differ by job.
    The billing run counts the literals the lint reported; the shared-table
    run counts the fixes the request asked for. */
export interface Words {
  /** What the job counts, one and many: ['literal', 'literals']. */
  unit: [string, string];
  /** Said of the merged ones, after "4 of 6 literals": "are tokens now, and none moved a pixel". */
  done: string;
  /** A completed change with nothing to look at, one and many, as the folded row counts it: ['routine swap', 'routine swaps']. */
  routine: [string, string];
  /** What a completed change's record counts its lines as: "value". */
  line: string;
}

export const BILLING_WORDS: Words = {
  unit: ['literal', 'literals'],
  done: 'are tokens now, and none moved a pixel',
  routine: ['routine swap', 'routine swaps'],
  line: 'value',
};

export interface Brief {
  id: RunId;
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
  /** What the job counted when the run started: the literals the token lint
      reported, or the fixes the request asked for. Every item below accounts
      for some of it. */
  literals: number;
  /** The words this run counts in; the billing run's when absent. */
  words?: Words;
}

export const wordsOf = (b: Brief): Words => b.words ?? BILLING_WORDS;

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

/** A line written outside the screen's own stylesheet: a new token, a label
    in the screen's markup, or a line in the design system's exceptions. */
export interface Addition {
  file: string;
  text: string;
  /** What the line is, as its hunk is headed: "a new token" when absent. */
  header?: string;
}

/** A case an answer can be kept for: a value struck through beside the value
    that replaced it, or on its own; or a fix that would reach past the
    screen asked about into a shared component. */
export type Pattern = 'replaced' | 'removed' | 'shared';

export const PATTERN_LABEL: Record<Pattern, string> = {
  replaced: 'a value struck through beside the one that replaced it',
  removed: 'a value struck through with nothing replacing it',
  shared: 'a fix that would change a shared component',
};

/** What an answer becomes if a person keeps it for similar cases. A rule
    always says where it applies, what it leaves out and why, because a rule
    nobody can read the reason for is a rule nobody can safely revoke. */
export interface RuleDraft {
  /** The rule in words, when it is not built from the patterns it covers (ruleText). */
  text?: string;
  /** Where it applies, in a few words: "The billing screens". */
  scope: string;
  /** What it doesn't cover. */
  excludes: string;
  /** Why, in a sentence. */
  why: string;
}

/** What follows from choosing an option, when it is more than the run's
    usual clean pass: the checks as they came back, what no check could
    establish, what stays open in the account, and the record's words. */
export interface Then {
  checks?: Check[];
  unchecked?: string;
  /** What stays unresolved once it is merged, for the account. */
  open?: string;
  /** What the agent did, for the record, in place of the usual three lines. */
  history?: string[];
  /** What it did when a rule applied the option to a later change, in place of history: no new follow-up, no new decision. */
  ruled?: string[];
  /** For gathering evidence, what the notice says once it has: in place of the usual "Nothing decided yet". */
  notice?: string;
}

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
  /** Choosing it lets the agent past the boundary that stopped it, for this
      change only: the work is "allowed once", not answered. */
  grants?: boolean;
  /** The choice, as its card is headed: "Keep it to the customer table". */
  title?: string;
  /** What happens after it is chosen, in a sentence, on the card. */
  outcome?: string;
  /** Choosing it decides nothing: the agent gathers this evidence and asks again with this question. */
  asks?: Question;
  /** Where this option writes, when not the change's own lines: a local override in place of a shared one. */
  file?: string;
  lines?: Line[];
  /** The change's title in the record once this is made, and where, when that is not the screen asked about. */
  record?: string;
  screen?: string;
  /** What follows from it, when it is more than the run's usual clean pass. */
  then?: Then;
  /** What it becomes if kept for similar cases; no draft, no rule offered. */
  rule?: RuleDraft;
  /** Said in the confirmation, in place of the question's note. */
  note?: string;
  /** For one of two defensible directions: what it is good for and what it
      costs, three each, so the two cards weigh the same. */
  benefits?: string[];
  risks?: string[];
  /** What the agent will do if it is applied, in order, as the person reads
      it before Apply. */
  plan?: string[];
  /** The same plan, done, as the decision record lists it. */
  done?: string[];
  /** The record a decision for this direction leaves. */
  decision?: DecisionDraft;
}

/** What a decision records beyond the choice: what it traded for what, the
    risk it leaves, the follow-up it opens, and the reason the agent drafts
    for the person to keep or rewrite. The record says which they did. */
export interface DecisionDraft {
  tradeoff: string;
  risk: string;
  followUp: string;
  reason: string;
}

/** A decision a person made, as the screen keeps it: the direction, their
    reason, what they accepted, what is still a risk, what it leaves to do,
    what the agent did, and the guidance it became, if they kept it for
    similar cases. Nothing here is learned: it is a record, and a later
    change consults it only through a rule the person made. */
export interface Decision {
  id: string;
  /** The change it was made on. */
  from: string;
  option: string;
  /** The question it answered, and the direction chosen, in words. */
  question: string;
  direction: string;
  reason: string;
  /** Whether the reason is the agent's draft, kept as written, or the person's own words. */
  reasonBy: 'you' | 'draft';
  tradeoff: string;
  risk: string;
  followUp: string;
  /** What the agent did, in order: the plan, done. */
  did: string[];
  /** The rule it made or widened, when kept for similar cases. */
  rule?: string;
  at: string;
}

/** What the agent found when a person asked for evidence before deciding a
    trade-off: where the thing in question is used, what each direction
    would change, what depends on it, what it could not verify, and a way to
    find out, proposed and not run. */
export interface Gathered {
  uses: { what: string; places: string }[];
  changes: { direction: string; text: string }[];
  depends: string[];
  unverified: string[];
  validation: string;
}

/** Everything a fix in a shared component would reach, for a question about scope. */
export interface Reach {
  /** The component, as a person names it: "Table". */
  component: string;
  /** Who owns it, and so who could let an agent change it for good. */
  owner: { name: string; role: string };
  /** The screens that draw it, by area. The one asked about is first. */
  areas: { area: string; screens: { name: string; baseline?: boolean; fixed?: boolean; asked?: boolean }[] }[];
  /** What has been checked, each a result. */
  checked: { state: TestState; text: string }[];
  /** What has not, each a sentence. */
  unknown: string[];
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
  /** What the value in question is, as its tile is headed: "Replaced value". */
  means?: string;
  /** What its red means, in a sentence a person who has never heard of a
      token can read: "Red means this value was replaced." */
  says?: string;
  /** The meaning as a noun, for what each answer does to it: "Replacement
      stays the same". */
  noun?: string;
  note?: string;
  /** For a scope question, what the agent was asked to do, in a sentence. */
  asked?: string;
  /** For a scope question, the change it would make, in a sentence. */
  proposes?: string;
  /** For a scope question about a shared component: who else it reaches, and what is known. */
  reach?: Reach;
  /** The one line that says why a person is needed, louder than the gap. */
  verdict?: string;
  /** Why it stopped, in a clause for the account's scope line: "it needs a new token". */
  edge?: string;
  /** For a trade-off between two defensible directions: what the agent can't
      determine that could change its recommendation, and what it inferred
      rather than checked. Said beside the recommendation, so the reason a
      person is needed is the agent's own words. */
  unknown?: string;
  inferred?: string;
  /** What it found when asked for evidence. */
  gathered?: Gathered;
}

/** An element in the same color as the one in question, whose meaning was settled. */
export interface Twin {
  /** The element as it reads: "Payment failed". */
  text: string;
  /** What it is, as its tile is headed and as a noun: "Failure". */
  means: string;
  /** The screen it is on: "Payment history". */
  screen: string;
  /** What its red means, in a sentence: "Red means something went wrong." */
  says: string;
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
  /** What stays unresolved once it is merged, for the account. */
  open?: string;
  /** What reverting it does, when it is not putting literals back. */
  undo?: string;
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
  /** The rule in words, when it is not built from what it covers. */
  text?: string;
  /** Where it applies, what it leaves out, and why: from the answer's RuleDraft. */
  scope?: string;
  excludes?: string;
  why?: string;
}

export interface DelegationState {
  brief: Brief;
  boundaries: Boundary[];
  work: Work[];
  rules: Rule[];
  /** The decisions a person made on a trade-off, newest last. */
  decisions: Decision[];
  /** Minutes after the scenario's now (14:26) at which the next thing a person does happens. */
  clock: number;
  /** The last thing that happened, for the live region and the screen's notice. */
  notice?: string;
  /** What kind of thing it was: work done or settled, something taken back, or a question left open. */
  noticeKind?: 'done' | 'back' | 'open';
  /** The rule the last answer made, widened or applied, if one did, so the notice can point at it. */
  noticeRule?: string;
  /** The decision the last answer recorded, so the notice can point at it. */
  noticeDecision?: string;
}

export type Action =
  | { type: 'answer'; id: string; option: string; makeRule: boolean; reason?: string }
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

/** What a rule says, in words, from what it covers and what it chooses. A
    rule written in its own words (the shared-table run's) says those. The
    billing run's two directions: separate the meanings, so red is a
    failure's alone, or keep the red for now, as a written exception. */
export function ruleText(rule: Pick<Rule, 'answer' | 'covers' | 'text'>): string {
  if (rule.text) return rule.text;
  const both = rule.covers.includes('replaced') && rule.covers.includes('removed');
  const what = both ? 'a value replaced or removed' : rule.covers.includes('removed') ? 'a value removed with nothing in its place' : 'a value replaced by another';
  if (rule.answer === 'separate') return `On the billing screens, ${what} is neutral and struck through, with a label that says what happened. Red is for failures.`;
  return `On the billing screens, ${what} stays red for now, with a label that says what happened: an exception to red meaning a failure, to review once a neutral style is tested.`;
}

/** The decision a rule was made from, if a person made it from one. */
export function decisionOf(s: DelegationState, ruleId: string): Decision | undefined {
  return s.decisions.find((d) => d.rule === ruleId);
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
  return `You decided the same question for the ${first?.screen.toLowerCase()} at ${answered?.at ?? 'an earlier time'}, for that change only. A one-time decision doesn’t carry over to another change.`;
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
  /* The three kinds of work, as the screen counts them: proceeded on its
     own, under a boundary alone; stopped for judgment; stopped for
     approval. What a person settled, by an answer, a rule, an allowance, a
     revert or leaving a line, is the fourth count, and the only one that
     grows. */
  const own = made.filter((w) => w.basis?.kind === 'boundary');
  const settled = [...made.filter((w) => w.basis?.kind !== 'boundary'), ...reverted, ...left];
  return {
    made,
    asking,
    own,
    settled,
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
    intentAsks: asking.filter((w) => w.question?.kind === 'intent'),
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

/* Make a change as an option says. An option that writes elsewhere (a local
   override in place of a shared one) brings its own file, lines and title,
   and one whose checks are not the usual clean pass brings what they said
   (Then), so the record shows what was run on the change that was made. */
function make(w: Work, option: Option, basis: Basis, at: string, how: string, unchecked: string): Work {
  const commit = hash(`${w.id}:${option.id}:${basis.kind}`);
  const lines = (option.lines ?? w.lines).map((l, i) => ({ ...l, after: option.after[i] }));
  const then = option.then;
  const ran = (basis.kind === 'rule' ? then?.ruled : undefined) ?? then?.history ?? [`Ran the checks: the token lint passed, 0 of ${w.frames} frames moved, ${w.stories} of ${w.stories} stories passed.`];
  return {
    ...w,
    status: 'made',
    file: option.file ?? w.file,
    title: option.record ?? w.title,
    screen: option.screen ?? w.screen,
    lines,
    adds: option.adds,
    basis,
    checks: then?.checks ?? cleanChecks(w.frames, w.stories),
    unchecked: then?.unchecked ?? unchecked,
    open: then?.open,
    commit,
    history: [
      ...w.history,
      { at, who: 'agent', text: `${how} ${option.effect}` },
      ...ran.map((text) => ({ at, who: 'agent' as const, text })),
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
      /* A change a rule settles says which decision the rule came from, so
         the record shows the person's reasoning being consulted, not an
         agent that has learned something. */
      const from = decisionOf(state, rule.id);
      const done = make(
        w,
        option,
        { kind: 'rule', ruleId: rule.id },
        at,
        from ? `Followed your rule, from your decision at ${from.at} (${from.direction.toLowerCase()}): this is the case it covers.` : 'Followed your rule.',
        'Whether your rule fits this case. No check can tell; your rule decided it.',
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

      /* Asking for more evidence decides nothing. The change stays where it
         is, asking, and the question comes back with what was gathered. */
      if (option.asks) {
        const again: Work = {
          ...w,
          question: option.asks,
          history: [
            ...w.history,
            { at, who: 'you', text: `Asked for more evidence before deciding.` },
            ...(option.then?.history ?? []).map((text) => ({ at, who: 'agent' as const, text })),
            { at, who: 'agent', text: 'Asked again, with what it found.' },
          ],
        };
        return {
          ...s,
          ...tick,
          work: s.work.map((x) => (x.id === w.id ? again : x)),
          notice: option.then?.notice ?? 'Nothing decided yet. It gathered the evidence you asked for, and is asking again.',
          noticeKind: 'open',
          noticeRule: undefined,
          noticeDecision: undefined,
        };
      }

      /* A direction of a trade-off leaves a record: the person's reason, in
         their words or the agent's draft kept as written (the record says
         which), what they accepted, what is still a risk, and what it
         leaves to do. Cleared, the reason is none, and the record says so
         rather than putting the draft back. */
      const draft = option.decision;
      const typed = a.reason?.trim();
      const reason = draft ? (a.reason === undefined ? draft.reason : typed ?? '') : '';
      const reasonBy: Decision['reasonBy'] = draft && (a.reason === undefined || typed === draft.reason) ? 'draft' : 'you';
      const direction = option.title ?? option.label;

      let rules = s.rules;
      let ruleNote = '';
      const current = activeRule(s);
      if (a.makeRule && q.pattern && option.rule && (!current || current.answer === option.id)) {
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
            {
              id,
              answer: option.id,
              covers: [q.pattern],
              status: 'active',
              from: w.id,
              applied: [],
              history: [{ at, who: 'you', text: draft ? `Made it from your decision: ${direction.toLowerCase()}.` : `Made it from the ${w.screen.toLowerCase()}’s question.` }],
              ...option.rule,
              /* A rule made from a decision gives the person's reason as its
                 why, so the reason travels with the guidance it became. */
              ...(draft && reason ? { why: reason } : {}),
            },
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
      } else if (option.grants) {
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
          {
            ...w,
            history: [
              ...w.history,
              {
                at,
                who: 'you',
                text: draft
                  ? `Decided: ${direction.toLowerCase()}.${ruleNote}${reason ? ` Your reason: “${reason}”` : ''}`
                  : `Answered: ${option.label.toLowerCase()}.${ruleNote}`,
              },
            ],
          },
          option,
          { kind: 'answer', at },
          at,
          'Applied your answer.',
          draft ? 'Whether this was the right trade-off. No check can tell; that was your decision.' : 'Whether that is the right meaning. No check can tell; that was your answer.',
        );
      }

      const madeRule = ruleNote ? activeRule({ ...s, rules })?.id : undefined;
      const decision: Decision | undefined = draft
        ? {
            id: `decision-${s.decisions.length + 1}`,
            from: w.id,
            option: option.id,
            question: q.ask,
            direction,
            reason,
            reasonBy,
            tradeoff: draft.tradeoff,
            risk: draft.risk,
            followUp: draft.followUp,
            did: option.done ?? option.plan ?? [],
            rule: madeRule,
            at,
          }
        : undefined;
      const decisions = decision ? [...s.decisions, decision] : s.decisions;
      const next = { ...s, ...tick, rules, decisions, work: s.work.map((x) => (x.id === w.id ? done : x)) };
      const { state, settled, asked } = settle(next, at);
      const ruled = ruleNote === ' You made it a rule.' ? ', and made a rule' : ruleNote ? ', and added the case to your rule' : '';
      const lead = option.leaves
        ? 'Left as written.'
        : option.grants
          ? 'Allowed once, made and merged.'
          : decision
            ? `Decided: ${direction.toLowerCase()}${ruled}. The agent applied it and recorded your reason.`
            : `Answered${ruled}.`;
      const quiet = state.work.some((x) => x.status === 'asking') ? '' : 'Nothing else needs you.';
      const rule = ruleNote || settled.length ? activeRule(state)?.id : undefined;
      return { ...state, notice: [lead, tell(settled, asked), quiet].filter(Boolean).join(' '), noticeKind: 'done', noticeRule: rule, noticeDecision: decision?.id };
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
            ? { ...x, status: 'reverted', history: [...x.history, { at, who: 'you', text: w.undo ? `Reverted it: ${commit} on main undoes it. The agent won’t redo it.` : `Reverted it: ${commit} on main puts the ${w.lines.length === 1 ? 'literal' : 'literals'} back. The agent won’t redo it.` }] }
            : x,
        ),
        notice: `Reverted: ${w.title}.`,
        noticeKind: 'back',
        noticeRule: undefined,
        noticeDecision: undefined,
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
        noticeKind: 'done',
        noticeRule: undefined,
        noticeDecision: undefined,
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
      return { ...state, notice: ['Rule saved.', tell(settled, asked)].filter(Boolean).join(' '), noticeKind: 'done', noticeRule: r.id, noticeDecision: undefined };
    }

    case 'revoke-rule': {
      const r = s.rules.find((x) => x.id === a.id);
      if (!r || r.status !== 'active') return s;
      return {
        ...s,
        ...tick,
        rules: s.rules.map((x) => (x.id === r.id ? { ...x, status: 'revoked', history: [...x.history, { at, who: 'you', text: 'Revoked it.' }] } : x)),
        notice: `Rule revoked. The ${plural(r.applied.length, 'change')} it made ${r.applied.length === 1 ? 'stays' : 'stay'} merged; a matching case will ask you again.`,
        noticeKind: 'back',
        noticeRule: undefined,
        noticeDecision: undefined,
      };
    }
  }
}

/** The state after a sequence of actions, so a story or a test can open on any point in the loop. */
export function play(start: DelegationState, ...actions: Action[]): DelegationState {
  return actions.reduce(reduce, start);
}
