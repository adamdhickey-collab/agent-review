# The experiment, as it happened

Two runs of the same request, by the same model, on the same tree, on
2026-10-01. The only difference between them is what the agent could
read before it started. Both branches are in this repository, verbatim,
and the versions they produced are frozen under
`src/product/customers/history/` so Agent Review renders them as they
were.

| | Run 1, with the rules | Run 2, without |
| --- | --- | --- |
| Branch | `agent/bulk-actions-customers` at `e50a20e` | `agent/bulk-actions-no-rules` |
| Cut from | `129fa90` | `129fa90`, then `CLAUDE.md`, `skills/`, `PROJECT.md`, `docs/` and `README.md` removed in one commit |
| Context the agent had | The tree, `CLAUDE.md`, `skills/ui-quality/SKILL.md`, the Storybook's stories | The tree and the Storybook's stories only |
| Its own description | `CHANGE.md` on the branch | `CHANGE.md` on the branch |
| In Agent Review | `rv-2041` | `rv-2042` |

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

(recorded when the run finishes)

## What the system learned

(recorded after the review)
