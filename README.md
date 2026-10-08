# Agent Review

Delegate UI work to a coding agent, and know what came back.

A coding agent can change a product's interface in minutes. The harder
question is whether the result inherits the decisions the team already
made: the components, the tokens, the states, the accessibility floor.
This repository is one answer, built end to end: a React component
system with its tokens and Storybook, the rules an agent reads before
touching it, a controlled experiment where Claude Code was asked to add a
feature inside that system, the validation that caught where it drifted,
and Agent Review, the tool a person uses to inspect the consequences and
send a precise correction back.

Its second iteration asks what happens as agents need less supervision.
The product now opens on delegated work: an account of what an agent did
inside written boundaries, the few decisions that still need a person and
why, a way to turn an answer into a scoped rule that can be edited or
revoked, and completed work that can be inspected and reverted. Two runs
show the two kinds of stop: the billing run (`#/`), where two reds look the
same and no check can say which meaning the product wants, and the shared
table (`#/runs/shared-table`), where the fix that fits is in a component
forty screens share and is not the agent's to make. Both are simulated,
and say so; the experiment's review queue is at `#/queue`.

- The product: https://adamdhickey-collab.github.io/agent-review/
- The Storybook: https://adamdhickey-collab.github.io/agent-review/storybook/
- The case study: https://adamhickey.com/lab/agent-review.html
- The decisions and the record: [PROJECT.md](PROJECT.md), [docs/experiment](docs/experiment/), [docs/exploration](docs/exploration/)

## What is here

```
src/tokens/        tokens.css, the single token layer; tokens.ts, its names, typed
src/components/    the system: Button, IconButton, Badge, StatusIndicator, TestStatus,
                   Checkbox, SegmentedControl, Tabs, Disclosure, Table, Toolbar, States
src/product/       Relay, the product under review: the customer table, the invoice list
src/review/        Agent Review: the delegated work, the queue, the change, the findings, the preview, the decision
src/data/          the review scenario, filled from the experiment; the two delegated runs, simulated
skills/ui-quality/ the twelve rules an agent works inside, each with its check
scripts/           the token lint
tests/             Playwright: visual baselines, the 768 overflow check and the phone check
docs/exploration/  three information architectures, drawn before the build
docs/experiment/   the controlled experiment, as it happened
```

## Running it

```bash
npm install
npm run dev          # the product, at http://localhost:5173/agent-review/
npm run storybook    # the Storybook, at http://localhost:6006/
```

## The checks

```bash
npm run check        # typecheck, lint, token lint, every story as a test with axe
npm run test:visual  # Playwright screenshots against the committed baselines
```

`npm run lint:tokens` reads every stylesheet under `src/` and reports a
literal written where a token exists. `npm run test:stories` renders every
story in headless Chromium and fails on an axe violation. `npm run
test:visual` compares the review and product screens, at two widths and
on a phone, against `tests/__screenshots__/`, and `tests/phone.spec.ts`
measures that nothing overflows a 320 to 414px screen and that the chrome's
controls are a fingertip tall. CI runs all of them on every push and
deploys `main` to GitHub Pages.

## The agent's context

`CLAUDE.md` is what a Claude Code session loads on entering the
repository; it points at `skills/ui-quality/SKILL.md`, which is the rules.
`.mcp.json` registers the Storybook's MCP server (`@storybook/addon-mcp`,
at `/mcp` on the dev server), so an agent can find a component's stories
and run them. The experiment record says which of this the agent used.

## What it is not

A static scenario, not an integration. The delegated runs in
`src/data/billing.ts` and `src/data/table.ts` are written, not recorded: no model runs behind it and
no rule is learned, only made by the person and applied as written. The
review reads one change from `src/data/scenario.ts`; a real deployment would build that object from a
pull request, its CI run and the Storybook test output, and the shape in
`src/data/types.ts` is what that integration would produce. It is also
not a product of, or affiliated with, any visual-testing service; the
mechanism is the subject, and it is built here from the parts.
