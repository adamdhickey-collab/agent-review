import type { TestState } from '../components';

/* The shape of a review. This is what a real integration would produce
   from a pull request, its CI run and the Storybook's test output; Agent
   Review reads it and never writes it. The scenario in scenario.ts is one
   of these, filled from the experiment in docs/experiment/. */

export type ReviewState = 'needs-review' | 'ready' | 'accepted' | 'rejected' | 'returned' | 'validating';

export const REVIEW_STATE_LABEL: Record<ReviewState, string> = {
  'needs-review': 'Needs review',
  ready: 'Ready to accept',
  accepted: 'Accepted',
  rejected: 'Rejected',
  returned: 'Returned to agent',
  validating: 'Validating',
};

export interface Person {
  name: string;
  role: string;
}

export interface AgentIdentity {
  name: string;
  /** The session or run, as the agent's own tooling names it. */
  run: string;
}

export interface ValidationLane {
  state: TestState;
  /** What to say instead of the state's word: "3 changes". */
  label: string;
  /** How many things the lane found, for the queue's compact columns. */
  count: number;
}

export interface ValidationSummary {
  visual: ValidationLane;
  accessibility: ValidationLane;
  interaction: ValidationLane;
  components: ValidationLane;
  tokens: ValidationLane;
}

export type FindingKind = 'component' | 'token' | 'visual' | 'accessibility' | 'state' | 'interaction' | 'shared' | 'pattern';

export const FINDING_KIND_LABEL: Record<FindingKind, string> = {
  component: 'Component',
  token: 'Token',
  visual: 'Visual',
  accessibility: 'Accessibility',
  state: 'State',
  interaction: 'Interaction',
  shared: 'Shared component',
  pattern: 'New pattern',
};

/** Blocking cannot be accepted as is; decision needs a person to choose;
    note is worth knowing and nothing more. */
export type Severity = 'blocking' | 'decision' | 'note';

export const SEVERITY_LABEL: Record<Severity, string> = {
  blocking: 'Blocking',
  decision: 'Needs a decision',
  note: 'Note',
};

export interface StoryRef {
  /** Storybook id, e.g. "product-customertable--narrow". */
  id: string;
  title: string;
  name: string;
  /** New in this change (no baseline to compare against). */
  isNew?: boolean;
}

export type Screen = 'customers' | 'invoices';
export type Viewport = 1280 | 1024 | 768;
export type Side = 'before' | 'after';

/** How to put the preview in the state that shows the finding. */
export interface Reproduce {
  screen: Screen;
  side: Side;
  viewport: Viewport;
  /** A data-finding value in the rendered screen to outline. */
  target?: string;
  /** A state the preview must enter first, e.g. rows selected. */
  withSelection?: boolean;
}

export interface ComponentEvidence {
  kind: 'component';
  /** The markup or style the agent wrote, as a short excerpt. */
  wrote: { file: string; excerpt: string };
  /** What already exists for this. */
  existing: { component: string; variant: string; props: string; story: StoryRef };
  recommendation: string;
}

export interface TokenEvidence {
  kind: 'token';
  file: string;
  line: number;
  property: string;
  literal: string;
  /** The tokens that cover this value, with their values. */
  tokens: { name: string; value: string }[];
  /** Nearest tokens when none is exact. */
  nearest?: { below?: string; above?: string };
}

export interface VisualEvidence {
  kind: 'visual';
  story: StoryRef;
  /** Pixels that differ from the baseline, and the fraction of the frame. */
  diffPixels: number;
  diffPercent: number;
  /** When one finding covers several frames: each, with its own figures. */
  frames?: { name: string; diffPixels: number; diffPercent: number; sizeChanged?: string }[];
  /** The change was asked for (the feature) rather than a side effect. */
  expected: boolean;
  /** Where the difference is, in words. */
  where: string;
}

export interface AccessibilityEvidence {
  kind: 'accessibility';
  rule: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  element: string;
  measured: string;
  required: string;
  /** What axe said, verbatim. */
  message: string;
}

export interface StateEvidence {
  kind: 'state';
  component: string;
  state: string;
  hasStory: boolean;
  /** Where the state is reachable from. */
  reachedBy: string;
}

export interface InteractionEvidence {
  kind: 'interaction';
  tests: { name: string; state: TestState; ms?: number }[];
}

/** A change under src/components: every screen sees it. */
export interface SharedChangeEvidence {
  kind: 'shared';
  file: string;
  lines: number;
  /** The agent's reason, as it wrote it. */
  reason: string;
  /** What the agent measured, or what the validation measured, to show the effect. */
  measured: string;
  /** Which stories render the component, so the reviewer can see the breadth. */
  consumers: StoryRef[];
}

/** A way of doing something the system did not have before. */
export interface PatternEvidence {
  kind: 'pattern';
  /** What the pattern is, in a sentence. */
  description: string;
  /** What the system already had that it was built from. */
  builtFrom: string[];
  /** The alternative the agent considered, or the reviewer might. */
  alternative: string;
  story: StoryRef;
}

export type Evidence =
  | ComponentEvidence
  | TokenEvidence
  | VisualEvidence
  | AccessibilityEvidence
  | StateEvidence
  | InteractionEvidence
  | SharedChangeEvidence
  | PatternEvidence;

export interface Finding {
  id: string;
  kind: FindingKind;
  severity: Severity;
  title: string;
  /** One or two sentences a reviewer reads first. */
  summary: string;
  /** Rule numbers in skills/ui-quality/SKILL.md. */
  rules: number[];
  evidence: Evidence;
  reproduce?: Reproduce;
  /** The instruction to send back, if the reviewer picks this finding. */
  correction: string;
}

export interface FileChange {
  path: string;
  status: 'added' | 'modified' | 'deleted';
  additions: number;
  deletions: number;
  /** Shared: under src/components, so every screen sees it. */
  shared: boolean;
}

export interface DiffHunk {
  file: string;
  header: string;
  lines: { kind: 'context' | 'add' | 'remove'; text: string; findingId?: string }[];
}

export interface Rationale {
  /** The request, as it was given to the agent. */
  request: string;
  /** What the agent said it did, in its own words. */
  summary: string;
  /** The agent's listed decisions, each a sentence. */
  decisions: string[];
  /** What the agent said it reused and what it changed, as it reported. */
  reported: { reused: string[]; changed: string[]; newStates: string[]; newPatterns: string };
}

export interface Decision {
  action: 'accept' | 'reject' | 'return';
  by: Person;
  at: string;
  /** For a return: the message sent. */
  message?: string;
  findingIds?: string[];
}

export interface Change {
  id: string;
  /** Invented, so the queue reads as a queue: its name, branch, figures and decision. Said wherever the change is shown. */
  sample?: boolean;
  title: string;
  repo: string;
  branch: string;
  base: string;
  commit: string;
  agent: AgentIdentity;
  requester: Person;
  openedAt: string;
  state: ReviewState;
  componentsTouched: string[];
  files: FileChange[];
  validation: ValidationSummary;
  findings: Finding[];
  stories: StoryRef[];
  diff: DiffHunk[];
  rationale: Rationale;
  decision?: Decision;
}
