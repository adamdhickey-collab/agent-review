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
revoked, and completed work that can be inspected and reverted. A start
screen at `#/` says what that is and what a person will do in it before
they meet it. Two runs show the two kinds of stop: the billing run
(`#/runs/billing`), where "Cancel
subscription" is the one action built by hand, small and gray, among the
system's Buttons, and the agent's faithful fix (a quiet Button variant)
would make hiding an action a supported style, so it asks whether cancel
should stay quiet, which no check can tell; and the shared
table (`#/runs/shared-table`), where the fix that fits is in a component
forty screens share and is not the agent's to make. Both are simulated,
and say so; the experiment's review queue is at `#/queue`. Each decision
is made in a workspace (Preview Studio): the interface it changes rendered
large, with the element marked, beside an inspector holding the decision;
selecting a direction previews it, proposed and not applied. On a laptop
(from 76rem) the workspace is a desk the height of the window: the run's
work in a queue on the left, the interface in the middle, and the decision
on the right under a deep-teal band, its steps (Compare, Choose, Preview,
Apply) the panel's pages, with Back and Next at its foot.

Its third iteration (2026-10-25) asks the question the first two left
open: if an agent can build the interface, what does the designer spend
the day doing? The front door is now a design cycle (`#/cycle/discover`
to `#/cycle/learn`): one feature, archiving customers on Relay's table,
followed through six stages, Discover, Define, Explore, Evaluate,
Delegate and Learn. Each says what the designer does and what the agent
does, and asks for one choice a later stage reads: whether the agent's
summary of the evidence holds up, what wins when speed and safety pull
apart, which of three working archive directions to build and what it
must do, the agent's one question, and what to measure and keep. The
three directions are real screens built from the system
(`src/product/customers/ArchiveFlow.tsx`); the evidence, the session
notes and the agent's build are simulated and labelled so. Since
2026-10-26 the cycle is a guided path: `#/` opens Discover, each stage
opens once the one before it is decided, and the bar drops the product's
other places. The two runs above are still there, linked where the cycle
ends.

- The product: https://adamdhickey-collab.github.io/agent-review/
- The Storybook: https://adamdhickey-collab.github.io/agent-review/storybook/
- The case study: https://adamhickey.com/lab/agent-review.html
- The decisions and the record: [PROJECT.md](PROJECT.md), [docs/experiment](docs/experiment/), [docs/exploration](docs/exploration/)
- The theme guidance and the workspace's screens: [docs/preview-studio](docs/preview-studio/)

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
tests/             Playwright: visual baselines, the 768 overflow check, the phone check and where a screen arrives
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
controls are a fingertip tall. `tests/scroll.spec.ts` holds a screen, on a
phone, to arriving at the top, and a reload or a step back to where the
reader left it. CI runs all of them on every push and deploys `main` to
GitHub Pages.

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
