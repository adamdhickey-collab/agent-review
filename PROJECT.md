# Agent Review, the project document

A running record: decisions, architecture, the component inventory, the
tokens, open questions, discoveries and what was deferred on purpose. The
README is for someone using the repository. This file is for someone asking
why it is shaped the way it is.

Started 2026-10-01. The case study at adamhickey.com/lab/agent-review.html is
written from this file, not the other way round.

## The question

If coding agents can write production UI, how does a product team make sure
those agents inherit the design decisions the team has already made, and how
does a person review what comes back before it ships?

Agent Review is the product that answers the second half. The component
system, the tokens, the Storybook and the agent-readable rules in this
repository answer the first half, and the experiment in `docs/experiment/`
is the two halves meeting.

Since 2026-10-03 there is a second question, and it is the one the product
now opens on (see "The second iteration" below): how does someone hand an
agent more of the work, and still know what it did, where its authority
ends, and which decisions are still theirs?

## Where it lives, and why not inside the site

adamhickey.com is thirty pages of hand-written HTML with no framework and no
build step, deployed by tarring the repository root, and held by ten checks
that walk every `.html` and `.css` file in the tree and measure the rendered
page: every color against a contrast floor, every type size against fourteen
steps, every card edge, every reachable state. That arrangement is the
site's whole argument and the subject of its own case study.

A React application and a Storybook cannot be dropped into that tree:

- Pages deploys the root as-is, so built output would have to be committed,
  and the checks would then walk Storybook's own UI (its sizes are not on
  the site's scale, its colors are not the site's palette) and fail by
  design, or be taught to look away from a directory, which is the exact
  shape of failure the site's CLAUDE.md spends pages warning about.
- The claim "no framework and no build step" is registered in the site's
  `counts.mjs` and asserted on four pages. It stays true only if the
  framework stays out of the tree.
- The site already has the precedent: Lucy Learns and Door County Found are
  products in their own repositories with their own deploys, and the site
  links to them and embeds one at a phone's width.

So this is its own public repository, `adamdhickey-collab/agent-review`,
deployed by its own workflow to GitHub Pages:

| Artifact | Where |
| --- | --- |
| The working product | https://adamdhickey-collab.github.io/agent-review/ |
| The public Storybook | https://adamdhickey-collab.github.io/agent-review/storybook/ |
| The source, the rules, the experiment | https://github.com/adamdhickey-collab/agent-review |
| The case study | https://adamhickey.com/lab/agent-review.html |
| The new portfolio area | https://adamhickey.com/lab/ |

The site gets two static pages in its own idiom (the lab index and the case
study), a band on the homepage, and the bookkeeping a new page costs there
(sitemap, Open Graph card, `llms.txt`, README family table, the registered
counts). Nothing in the site's build or check arrangement changes.

## Stack, and what was left out

| Chosen | Why |
| --- | --- |
| React 19, TypeScript, Vite 8 | What the project is about; Vite because nothing in the site suggested otherwise and it is what Storybook's React framework builds on |
| Storybook 10 with addon-docs, addon-a11y, addon-vitest, addon-mcp | The system's states inspectable, accessibility measured per story, stories run as tests, and the Storybook readable by an agent over MCP |
| Vitest in a real Chromium through Playwright | The story tests and a11y checks run in a browser, not jsdom |
| Playwright test | Visual baselines for the review scenario, and the viewport check |
| Plain CSS with custom properties, one file per component | Tokens in a `.css` file are inspectable by anything, including the token lint; no CSS-in-JS, no utility framework |
| A hash router in forty lines | Three routes do not need a dependency |

Left out, on purpose: any component kit (the component model is the point),
Tailwind (the tokens would hide behind utility names), react-router,
state libraries, Chromatic (a visual-testing SaaS; the project is about the
mechanism, and this must not read as a Chromatic clone), Pencil (not
available in this environment; see Exploration), Cursor (the repository
should open well in it, and Claude Code stays the agent).

## Build sequence

1. The system: tokens, the primitives, the customer table the scenario is
   about, Storybook with meaningful states, a11y and story tests, a token
   lint, visual baselines. Commit as the clean state.
2. The rules an agent reads: `CLAUDE.md` and `skills/ui-quality/SKILL.md`.
3. The experiment: a fresh Claude Code session, with only the repository
   as context, asked to add bulk actions to the customer table. Its branch
   is kept verbatim. What it reused, where it drifted, what the validation
   caught, recorded in `docs/experiment/`.
4. The controlled regression: a second branch with the four drifts the
   workflow exists to catch (a local button treatment, an off-token value,
   a narrow-viewport overflow, a contrast regression), seeded by hand where
   the real run did not produce them, and labelled as such.
5. Agent Review itself: the queue, the change, the findings that reproduce
   themselves in the preview, component inspection, and the decision with
   a correction sent back.
6. What changed in the system afterwards: the component, the story, the
   rule, the test.
7. Deploy. Then the site: the lab index, the case study, the homepage band.

## Decisions

- **One system, not two.** The product under review (a customer table in a
  SaaS product) and Agent Review are built from the same component system
  and tokens, as an internal tool and a product at one company would be.
  That is what lets a finding say "Button / secondary / compact already
  covers this" and link to the real story.
- **The before and after are rendered, not pictured.** The preview renders
  the baseline customer table and the agent's version from code, so the
  narrow-viewport overflow is a real overflow at a real width and a
  reviewer can tab through both.
- **A finding reproduces itself.** Selecting a finding puts the preview in
  the state that shows it: the viewport width, the before/after side, the
  element outlined. This is the information-architecture decision the
  exploration below arrives at.
- **Return to agent is a composed message, not a free text box.** The
  reviewer picks findings; each contributes a precise, rule-referenced
  instruction; the reviewer edits the result. Human judgment directing the
  agent, in a form the agent can act on.
- **The validation is real where it can be.** Token lint, a11y, the
  viewport check and the visual baselines run in this repository and their
  output is what the scenario data reports. Where a number in the product
  is invented, this file says so.

## The second iteration: delegation (2026-10-03)

The first version is built around what agents could not do in that
experiment: tell an intentional choice from a mistake, so a person reviews
every change. That is a limit of the moment, not a fact about the work. As
agents get better more of those calls should be automatic, and a queue that
asks for a review of each one turns that progress into busywork. So the
design question changed: how can someone delegate more, and still
understand the results, the boundaries, and the decisions that still need
them? Human attention is the cost being spent, and fewer required reviews
is the goal, provided nothing important is hidden to get there.

The front door (`#/`) is now **delegated work**: one run, Claude Code moving
Relay's billing screens onto the token layer. The review queue the
experiment was built around is unchanged at `#/queue`.

**The run is simulated, and labelled so on the screen.** Unlike rv-2041 and
rv-2042, nothing in it was run: the billing screens, the times, the commits
and the checks' figures are written to agree with each other
(`src/data/billing.ts`) and played back through one pure reducer
(`src/data/delegation.ts`), so the same presses always end in the same
place. Nothing learns. The tokens are real, and so are the two facts the
scenario turns on: `--color-danger` and `--color-diff-remove-ink` are both
`#b42318`, and `--color-success` and `--color-diff-add-ink` are both
`#1f7a3f`, so either name passes every check.

Decisions:

- **Results first.** The screen opens on an account, not a queue: what was
  done, how it was checked, what is unresolved, what needs the person, and
  whether the work stayed inside its boundaries. Every figure is counted
  from the records, and the stories assert that the records account for
  all 36 literals the lint reported.
- **Read at a glance (2026-10-04).** The account was four sentences and
  read like a paragraph; it is a bar now, the 36 literals by where they
  are (merged, asking, waiting), the three checks as badges with their
  counts, and a line each for what is unresolved and for scope. Each
  decision leads with its answers, as cards, and for a value whose meaning
  is in question each card shows the element as it would render if
  `--color-danger` were made louder later: one stays, one follows. What was
  found, the code and the evidence fold under the card. The completed work
  names its check columns once, marks only work not done on its own, and
  folds the routine swaps into one row. The line icons take a stroke for
  the size they are shown at, because one stroke scaled to 1px at 14px.
- **One red, two meanings, shown before it is named (2026-10-06).** The
  card used to say why the agent stopped in a sentence ("both answers are
  the same pixels, so every check passes either way"), and a reader who
  does not think in tokens read past it. A question about what a value
  means now shows the value beside its twin: "Payment failed", which the
  agent made `--color-danger` on its own because its meaning was never in
  doubt, and the plan change, in the same red, under the two names it
  could take. Under them, the three checks as they came back with each
  name in place, all passed (the record says it tried both), and one line:
  nothing failed, and no check can say what the red means. Each answer
  card then shows both elements as they would render if danger were made
  louder later: with the diff pair only the failure gets louder, with
  danger and success both do. The rule's preview also says what a rule is
  for: next time, a case that matches does not ask.
- **The meaning before the name (2026-10-06, later).** The card showed all
  of that and a reader still had to work out what the two answers stood
  for: a tile called the plan change "this change", the answers sat under
  a token's name ("If `--color-danger` is made louder later:"), and nothing
  said which answer kept the two meanings apart. Now each tile says what
  its red is before its token ("A failure", "A replaced value"); the line
  under the checks says they can't tell whether the two reds mean the same
  thing, and that this matters the next time the danger style changes; the
  answers sit under "Now imagine the failure style gets stronger." and one
  sentence on what each does; each answer names its choice ("Separate the
  meanings", "Keep the meanings coupled") over its outcome; and under its
  two specimens it says what each takes, "Payment failed → danger",
  "Starter → replaced value", with the token beside it as the detail. The
  tokens stay on the card for anyone who reads them; the story no longer
  needs them.
- **Two reds that look the same (2026-10-07).** The question had become
  "Is the old plan red because something failed, or because it was
  replaced?", which still made a reader diagnose a red before knowing what
  was being decided. Now every struck-through value asks the decision
  itself: "These two reds look the same. Should they mean the same thing?"
  The tiles are headed by meaning ("Replaced value", "Failure"), each says
  what its red means in a sentence, and each names its one token under
  that, quietly; the plan's tile no longer offers two. The checks sit
  under "Both approaches pass the automated checks.", followed by the line
  a person should take away, "So this isn't a testing problem. It's a
  meaning decision." The answers sit under "Should these meanings stay
  separate?" and "Imagine the danger style becomes stronger later.", are
  headed "Keep the meanings separate" and "Keep the meanings linked", and
  show each element beside what happens to it ("Failure changes",
  "Replacement stays the same"), with "Only the failure gets louder" and
  "Both get louder" last, as the summary. The lesson is not which variable
  to use: the agent found a semantic decision no check could safely make.
- **Three reasons to stop, not three tabs.** A problem the agent can solve
  with the evidence and permission it has (it named a token that does not
  exist; the lint and the visual check failed; it corrected the name) is
  fixed and recorded, and asks nobody. Missing or conflicting intent (which
  of two same-valued tokens a red means) is a narrow question with the
  evidence for each reading and a recommendation. A step past the
  delegation (a new token, which every screen and every later agent will
  reach for) asks for that one step. The first is a record in the completed
  work; the other two are the "Needs you" cards, told apart by a badge.
- **Confidence is not permission.** No card shows a confidence figure. What
  lets the agent act is a boundary, written in words, numbered, and cited
  wherever it stopped or acted.
- **Boundaries are sentences.** Seven, in three groups (does on its own,
  asks you first, outside this delegation), beside the work, each group a
  line with its mark and its count that opens to the sentences. Not a
  slider, not presets, not a policy editor.
- **An answer becomes a rule only when the person says so.** The box is
  unchecked by default. Checked, it shows the rule in words, what it does
  not cover, and what it would settle at once. A one-time answer stays one
  time: the four changes held behind the first question each ask again if
  it was answered once, and say why. A rule can be edited (what it covers)
  or revoked, each a second step; revoking stops it and leaves what it made,
  and says so. A scope decision offers no rule: allowing one step past a
  boundary is not moving the boundary.
- **A check's word is a fact about the code.** Every completed change says
  what each check established, and separately what no check could: a swap
  to the wrong one of two same-valued tokens passes everything. A check
  that ran and could not answer is `inconclusive`, a new state of
  TestStatus, and is never shown as passed.
- **Recovery is real in the model.** Every merged change can be reverted (a
  revert commit puts the literal back; the agent will not redo it) and
  restored, and its history keeps both. A line left as written offers
  nothing to revert, because nothing changed.
- **The quiet state is the result.** With nothing to decide, the "Needs
  you" section is not there and the account says "Nothing needs your
  attention." Nothing is invented to fill the space.

### A second run: the shared table (2026-10-07)

The billing run's decision is missing intent, and a reader could take the
product for a tool about token names. A second simulated run,
`#/runs/shared-table` (`src/data/table.ts`), is the other kind of stop: a
permission boundary. Claude Code is asked to fix a cramped customer table;
it makes two fixes on that screen on its own and stops at the third,
because the fix that fits is one line in the shared Table
(`--table-pad-y`, in `src/components/Table/Table.css`, which is real), and
forty screens draw it. Rule 9 of the UI rules is about exactly that file.
Relay's forty screens are written into the scenario, not built: only the
customer list exists here, and the strip says the run is simulated.

- **Two runs, one strip.** The strip that says this is a simulation names
  the run on screen and links to the other ("Two reds", "Shared table").
  They are links, not a SegmentedControl, because each run is a place with
  an address; each keeps its own state, and Reset puts back the one shown.
- **The case for a permission decision.** The card says what the agent was
  asked and what it proposes, shows the change as a diff, who else it
  reaches (forty screens by area, every one named under a fold, and the
  Table's owner), what has been checked beside what has not (12 of the 40
  have a visual baseline; 28 have none; 5 hold the table in a panel of
  fixed height, known from their CSS rather than from looking), and the
  line "So this isn't a technical problem. It's a permission decision."
- **Three answers that end differently.** Fix this screen only: a local
  override, within the agent's authority, so it is an answer; only the
  customer list moves, and the account says the other 39 keep their rows
  and the owner has a note. Approve, this once: past the boundary for this
  change only; it merges with the visual check marked changed, not passed,
  and the 28 screens nobody has looked at listed as unresolved. Show me the
  40 screens: decides nothing, needs no second step, and the question comes
  back with what the agent found (35 only get taller rows, 5 cut off their
  last row), without that answer. Approving after that lists the 5 instead.
- **A rule has a scope, a reason and an owner.** Keeping the fix on the
  screen can become a rule scoped to the customer screens, written in its
  own words, so it can be revoked but not widened. Approving the shared
  change offers no rule, and says why: a standing permission to change a
  shared component is its owner's to give, and this doesn't ask her. Every
  rule, in either run, now shows where it applies and why beside what it
  doesn't cover and who made it.
- **The kinds are named as the case study names them.** The decision
  card's badge reads "Missing intent" or "Permission boundary" (it read
  "What a value means" and "Outside the delegation"). Routine work never
  reaches a card.
- **Three modes, one word each, and the decision as the centre
  (2026-10-09).** The three kinds of work are the three modes the product
  is built around, and the screen says them the same way everywhere now:
  the agent *proceeds on its own*; it stops for the person's *judgment*, a
  question of meaning or intent no check settles; or it stops for their
  *approval*, an action past what the delegation allows. The boundaries
  panel's three groups are "Proceeds on its own", "Asks for your judgment"
  and "Needs your approval"; a decision card's badge is its status, "Needs
  judgment" or "Needs approval", in the amber the account's bar gives what
  waits on the person (it was a grey label, "Missing intent"); and the
  account opens on one line that counts the run's changes by mode, with a
  fourth count, "settled by you", once there is one. Judgment and approval
  share the amber and are told apart by their marks and their words, a
  question and a lock, never by hue alone. On the two-reds card the three
  checks that passed with either token fold to one line, "All 3 automated
  checks passed, with either token.", with the results and what each
  established one press away: three green badges in a row were the
  loudest thing on a card whose point is that passing is not the answer.
  Where a card's answers differ in kind, each says what it means for the
  system beyond this change (within the agent's authority and able to
  become a rule; allowed once, with the boundary left where it is;
  deciding nothing yet). And after a decision, what stood in the card's
  place is a result rather than a grey line: a mark for what happened, the
  sentence, and "See your rule" when the answer made or used one. Nothing
  learns, still; a rule exists because a person made one.

What would tell whether this works, none of it tested yet:

- Can a person explain what they have delegated?
- Do they understand why the agent paused?
- Can they spot an automatic action that was wrong?
- Can they correct or revoke a standing rule?
- Does it cut interruptions without hiding a failure?

## Exploration: three information architectures

Pencil is not available here (no MCP server, no application), so the
exploration is three wireframes drawn in code under `docs/exploration/`,
with the tradeoffs written beside them.

- **A. Visual-diff-first.** The before/after fills the screen; findings are
  pins on it. Optimizes for the designer's first question (what does it
  look like now?). Weak on anything that is not visual: a token deviation
  or a missing story has nowhere to pin.
- **B. Validation-first.** A ranked list of findings is the spine; the
  preview opens on demand. Optimizes for triage and for the engineer's
  question (is this blocking?). Weak when the reviewer cannot see the
  consequence without leaving the list.
- **C. Component-first.** The affected components are the spine; each
  opens to its states, stories and findings. Optimizes for the design-system
  owner. Weak for a feature review, where the question is the feature and
  the components are incidental.

Chosen: B's spine with A's evidence always in view. The findings list is the
left column and the preview the right; selecting a finding reproduces it.
Component inspection is a detail inside a finding rather than a top-level
mode, because in this scenario the component question arises from a
finding, not before it.

## Architecture

```
src/
  tokens/            tokens.css, the single token layer; tokens.ts, its names, typed
  components/        the reusable system, one directory per component, with stories
  product/           the customer table under review: the baseline and the agent's version
  review/            Agent Review's own screens and composed components
  data/              the scenario: the change, the findings, the validation report;
                     the two delegated runs (billing.ts, table.ts) and the reducer they move by (delegation.ts)
  app/               the shell and the hash router
skills/ui-quality/   the rules an agent reads before touching UI
docs/exploration/    the three directions
docs/experiment/     the controlled experiment, as it happened
scripts/             the token lint and the findings collector
tests/               Playwright: visual baselines and the viewport check
```

## Component inventory

The system, `src/components/` (13):

| Component | For | Stories |
| --- | --- | --- |
| Icon | The inline icon set, decorative unless named: a line set with a stroke for each size it is shown at, and six status marks drawn solid on a 16 grid | 2, and IconButton's AllIcons |
| Button | The one button: primary, secondary, danger, ghost; default and compact; loading; disabled | 10 |
| IconButton | An icon-only button whose label is its name and its tooltip, on hover and on focus | 7 |
| Badge | A small label with a tone, never the only place a state is said; a large size for a badge read as content | 6 |
| StatusIndicator | A dot and a word; live pulses | 4 |
| TestStatus | A check's result: passed, changed, failed, running, skipped, inconclusive, each its own shape | 9 |
| Checkbox | A native checkbox with a drawn box; indeterminate is real | 7 |
| SegmentedControl | One choice among a few, all visible; a radiogroup with arrow keys | 4 |
| Tabs | The WAI tabs pattern, with counts | 4 |
| Disclosure | A native details/summary, styled | 4 |
| Table | Table, HeaderCell (sortable), Cell (numeric, control, row header), Row (selected); two densities; a focusable scroll region | 9 |
| Toolbar | A row of controls over a region that wraps rather than overflows; an accent tone for a selection | 4 |
| States | EmptyState, LoadingState, ErrorState: the three region states | 6 |

The product under review, `src/product/` (2 screens): CustomerTable (the
live one is Run 1's, with bulk actions; the baseline and all three
branch versions are frozen under `history/`), InvoiceList.

Agent Review, `src/review/` (20): Shell, DelegationScreen, OutcomeSummary,
DecisionRequest, WorkRecord, Boundaries, QueueScreen, ReviewRow,
ReviewCard (the queue's row on a phone), ChangeScreen, ValidationSummary,
FindingList, FindingEvidence (eight evidence kinds), ComponentPreview (the
frame, with loading and error), DiffViewer, AgentRationale, DecisionBar,
ReturnPanel, StoryList, FileList. 111 stories.

Every story runs through axe, with WCAG 2.2's target size on. 241 as of
2026-10-07: 88 for the system and its tokens, 14 for the product, 139 for
the review; it was 233 before the shared-table run added eight, 207 on
2026-10-04 (82, 14, 111), 203 (79, 14, 110) before the glanceable pass added four, and 173 (78,
14, 81) before the delegated work added thirty. (The
case study on adamhickey.com said 161 when it was written; the number moves
whenever a story is added, so it is read from `npm run test:stories` or from
the Storybook's `index.json`, not carried by hand.)

## Tokens

The layer is `src/tokens/tokens.css`. Spacing is a numeric scale on a 4px
grid (`--space-1` through `--space-8`), type sizes are 11, 12, 14 and 16px
(the four smallest steps of the site's own scale, chosen so the two bodies
of work share a ladder), color is semantic (canvas, surface, border, text,
muted, accent, selected, success, warning, danger, and the diff pair), radii
are 3 and 6, the shadow exists for menus and popovers only, and focus is one
ring token. The full list with values is in the file; the names in
`tokens.ts` are what the token lint checks declarations against.

## Open questions

- A second scenario, and whether the queue's four invented changes
  should become real runs too.
- Whether the token lint should parse CSS properly. It reads
  declarations with a regex and strips lengths inside `calc()`, so a
  literal inside a `calc()` passes. It caught the seventeen that
  mattered; a parser is the next step when one slips through.

## Discoveries

- **The system did most of the work, not the rules.** Two real runs, one
  with the twelve rules in context and one without, both came back
  clean on every check: no raw element where a component existed, every
  value a token, every new state with a story, no axe violation. The
  components, the tokens and the stories as files were enough to keep
  an agent inside the system. What the rules changed was judgment at
  the edges (the empty state, how to treat a shared change, the shape of
  the description) and where a reviewer finds things.
- **A seeded failure finds the test that cannot fail.** The 768 overflow
  check passed on a bar 58px too wide, because it measured a container
  whose parent clips. Without a branch built to fail, that test would
  have stayed green for as long as nothing overflowed.
- **The checks found their own defects first.** The Table's scroll
  region had no keyboard access; the diff marker sat under 4.5:1; the
  evidence excerpt scrolled without focus. All three were found by the
  story tests in this repository before any experiment ran, which is
  the same mechanism the experiment is about.
- **The headless session connected the Storybook MCP and then could not
  authenticate.** The experiment record says exactly how the runs were
  done instead, and what the MCP would have added.
- **Baselines are per platform.** Chromium on macOS and on Linux render
  text differently enough to fail a 0.2% threshold; CI records its own
  set.

## Deferred on purpose

- A second scenario. One complete, convincing scenario first.
- A custom domain for the product (lab.adamhickey.com). The github.io
  address works and the site embeds it; a domain is a DNS decision for later.
- Real repository integration (reading a PR from GitHub). The product reads
  a static scenario; the shape of the data is what a real integration would
  produce, and the README says what it would take.
- Dark mode. The product has a light canvas by decision; the tokens are
  semantic so a dark set is a second block, not a rewrite.
- An Archived view and undo for the bulk archive. Both runs listed it;
  the inline question is the guard until there is a view to restore from.
- A proper CSS parser for the token lint (see Open questions).
