# The experiment, as it happened

Two runs of the same request, by the same model, on the same tree, on
2026-10-01. The only difference between them is what the agent could
read before it started. Both branches are in this repository, verbatim,
and the versions they produced are frozen under
`src/product/customers/history/` so Agent Review renders them as they
were.

| | Run 1, with the rules | Run 2, without | The seeded drift |
| --- | --- | --- | --- |
| Branch | `agent/bulk-actions-customers` at `e50a20e` | `agent/bulk-actions-no-rules` at `b643e08` | `agent/bulk-actions-drift` at `62578ab` |
| Cut from | `129fa90` | `129fa90`, then `CLAUDE.md`, `skills/`, `PROJECT.md`, `docs/` and `README.md` removed in one commit | `129fa90` |
| Who wrote it | Claude Code | Claude Code | A person, by hand, from Run 1's screen |
| Context the agent had | The tree, `CLAUDE.md`, `skills/ui-quality/SKILL.md`, the Storybook's stories | The tree and the Storybook's stories only | Not applicable |
| Its own description | `CHANGE.md` on the branch | `CHANGE.md` on the branch | `CHANGE.md`, written to read like an agent's |
| In Agent Review | `rv-2041` | `rv-2042` | `rv-2043` |

Two of the three are what happened. The third is what the workflow
exists to catch, and neither run produced it, so it was written in and
is labelled as such everywhere it appears.

## The request

Both runs received exactly this, and nothing else about the feature:

> Add bulk actions to the customer table using the existing component
> system. A person should be able to select several customers and archive
> or export them.
>
> When you are done, write your change description to CHANGE.md at the
> repository root, and commit your work on the current branch with a clear
> commit message. Do not push.

## How the sessions were run, honestly

The plan was a headless Claude Code session (`claude -p`) in each
worktree, so that `CLAUDE.md` loaded the way it does for any session and
`.mcp.json` connected the Storybook's MCP server. The first attempt got
that far: the session's init record lists the `storybook` MCP server as
`connected` with its eight tools (`docs-list`, `docs-show`,
`docs-show-story`, `get-storybook-story-instructions`, `stories-changed`,
`stories-find-by-component`, `stories-preview`, `test-run`). It then
failed on the first model call: `OAuth session expired and could not be
refreshed`. The command-line login on this machine had lapsed and the
session building this project could not renew it.

So each run was a subagent of the session building this project,
started with the worktree's path and the request, and in Run 1 one
sentence more: that Claude Code would normally load `CLAUDE.md`
automatically and it should read it first. That is the one way the two
runs differ from a plain session, and it is the same for both. Neither
run had the Storybook MCP tools; both had the stories as files. What a
logged-in CLI would add is the MCP's `docs-show` and `test-run`, which
let an agent read a component's documented props and run a story's tests
without reading the source; the record below says where that would have
mattered.

## Run 1: with the rules

Commit `e50a20e`, "Bulk actions on the customer table: select rows,
archive them after a confirming step, or export them as CSV". Four files:
`CustomerTable.tsx` (the screen), `customers.ts` (a CSV helper), the
table's stories, and twelve lines in `src/components/Table/Table.css`.

**What it reused, correctly.** Checkbox for the rows and the select-all
head (indeterminate while partial, disabled when empty), the Table's
`Row selected` composition from its own SelectedRows story, a second
`Toolbar tone="accent"` for the selection bar (the Toolbar's Accent
story, placed), `Button` in danger, secondary and ghost at compact size,
`EmptyState` for the table that archiving empties. No raw element where a
component existed; rule 1's grep returns nothing. Every value a token;
`npm run lint:tokens` is green. Seven new stories with play functions, so
every new state is rendered and run through axe; 92 of 92 pass.

**Where it drifted, and what caught it.** It did not, in any way the
checks measure. The two things it did that need a person are the two
things the rules say need a person:

1. *It changed a shared component.* A 1rem checkbox in a 2rem table head
   with the head's padding made the head row grow by about two pixels. The
   agent fixed it in `Table.css`, at the control column, and wrote the
   reason and the measurement in its description (rule 9's own exception:
   change a shared component only with a reason in writing). The visual
   run shows the consequence: the frozen frames that contain the table
   differ, and Agent Review marks the file as shared. Whether this is a
   local need solved in a shared place, or a defect in the Table the
   feature exposed, is the reviewer's call. It is the second: the Table's
   own SelectedRows story had the same growth.
2. *It introduced a new interaction pattern.* Archive does not act on
   first press; the selection toolbar becomes the question ("Archive 3
   customers?") with Cancel and the confirming danger button, and Escape
   cancels. Rule 6 was satisfied by the confirmation route; rule 12 says a
   new pattern is the reviewer's decision, and the agent listed it under
   that heading rather than deciding it.

**What the validation reported.** Visual: four frames changed, all of
them the feature (the control column; the selection toolbar in the
review's own preview), none unasked-for. Accessibility: 92 stories, no
violation. Interaction: the seven new play functions pass. Components:
one shared change. Tokens: none off the layer.

**What the run found in the tooling.** Three defects in this
repository, none in the system:

- `tsc -b` failed on five errors outside `src/`: the node TypeScript
  project had been widened to the tests without the DOM lib or Vite's
  client types. Fixed in `f2d2a3a`.
- `playwright.config.ts` reused any server on port 5173. The run's first
  visual pass found a dev server from a different checkout there,
  measured that tree, and passed, including a comparison it could not
  have passed. Fixed in `f2d2a3a`: the tests start their own server on
  4173 and never reuse one.
- `playwright-report/` and `test-results/` were tracked. Fixed in
  `c03f225`.

A fourth, about the experiment's own setup rather than the repository: a
worktree whose `node_modules` is a symlink outside Vite's root cannot run
the story tests until `server.fs.allow` includes the real path. The agent
worked around it with a local config it then deleted.

## Run 2: without the rules

Commit `b643e08`, "Bulk actions on the customer table: select rows,
archive with a question, export to CSV". Four files under
`src/product/customers/`: the screen, 22 lines in its own stylesheet, the
stories, and `exportCsv.ts`. Nothing under `src/components/`.

**What it reused, correctly.** The same components as Run 1: Checkbox,
the Table's control cells and selected row, `Toolbar tone="accent"`,
Button in three variants at compact size. Every value a token. Eight new
stories, seven with play functions; 93 of 93 pass with axe. It read the
tokens file closely enough to notice that muted ink is only promised on
the four base grounds and chose the full ink for the count on the accent
ground, which is exactly the contrast failure the seeded branch has.

**Where it differed from Run 1.** The differences are judgment, not
defects, and the checks cannot see them:

- It swapped the title toolbar out for the selection toolbar, in the same
  slot, so nothing below moves; Run 1 added a second bar under the title
  so the title and Add customer stay visible. Both are the Toolbar. Which
  one Relay uses is a product decision.
- It measured the same head-row growth Run 1 found (32 to 34.25px with
  the select-all box) and flagged it as a Table.css matter rather than
  patching it, because nothing told it a shared change with a written
  reason was allowed. Run 1, with rule 9 in front of it, made the change
  and wrote the reason. Two defensible readings of the same rule.
- It left the emptied table with a head and nothing under it, and listed
  the empty state as not done. Run 1 rendered `EmptyState`. Rule 8 is the
  difference.
- Its description is a readable account under its own headings. Run 1's
  follows the seven sections the skill asks for, so a reviewer finds the
  shared change and the new pattern where the rules say they will be.

**What the validation reported.** Visual: four frames changed, all the
feature. Accessibility: no violation. Interaction: eight stories pass.
Components: one state unhandled (the empty table). Tokens: none off the
layer. In Agent Review this is `rv-2042`, returned with two corrections
rather than rejected.

## The seeded drift

Commit `62578ab` on `agent/bulk-actions-drift`. Run 1's screen, with
four things done to it that the rules forbid and neither agent did: the
bar's three actions written as a local `<button class="bulk-bar__btn">`
with its own stylesheet; the selection count in a literal ink on the
accent ground; the bar as one flex line that does not wrap, with a
fourth action so it is wider than a tablet; and the shared Button's
compact padding changed "so the toolbar's buttons align with the bar's".
One story (Selected) and none for the other states.

**What caught it, with the output as it was printed:**

- `npm run lint:tokens`: 17 values off the token layer, with file and
  line: `padding: 10px 14px` and `border: 1px solid #d0d0d0` in
  `BulkActionBar.css`, `padding: 0 10px` in `Button.css`, and fourteen
  more.
- `npm run test:stories`: the Selected story fails axe.
  `Element has insufficient color contrast of 2.87 (foreground color:
  #7a8db8, background color: #e9effc, font size: 9.8pt (13px), font
  weight: normal). Expected contrast ratio of 4.5:1`. The other 85 pass.
  The states with no story were not tested, which is rule 3's point.
- `npm run test:visual`: four frames differ from their baselines (8,511,
  19,744, 27,499 and 26,034 pixels), and the 768 check fails: `toolbar
  "Selected customers" overflows its box (792 vs 734)`.
- The visual run also shows the Invoices screen's buttons 4px wider, in
  a change that never mentioned Invoices: the shared Button.

**What the seeded branch found in the tooling.** The 768 check's first
version measured the frame's scroll width, and the bar's parent section
clips its overflow, so a bar 58px too wide left the frame's scrollWidth
untouched and the check passed. It now measures every toolbar's own box.
A test that cannot fail on the defect it is for is the kind of thing a
seeded failure exists to find.

## What the system learned

(recorded after the review)
