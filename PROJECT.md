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
  data/              the scenario: the change, the findings, the validation report
  app/               the shell and the hash router
skills/ui-quality/   the rules an agent reads before touching UI
docs/exploration/    the three directions
docs/experiment/     the controlled experiment, as it happened
scripts/             the token lint and the findings collector
tests/               Playwright: visual baselines and the viewport check
```

## Component inventory

Filled in as components land. Each entry: name, what it is for, the states
its stories cover.

(see the end of this file; updated as the build proceeds)

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

- Whether the experiment agent can be given the Storybook MCP server.
  The addon ships; whether a nested session here can reach it is to be
  tested, not assumed. If not, the experiment runs without it and this
  file says what would be required.
- How much of the scenario's validation output can be collected by script
  rather than transcribed.

## Discoveries

(as they happen)

## Deferred on purpose

- A second scenario. One complete, convincing scenario first.
- A custom domain for the product (lab.adamhickey.com). The github.io
  address works and the site embeds it; a domain is a DNS decision for later.
- Real repository integration (reading a PR from GitHub). The product reads
  a static scenario; the shape of the data is what a real integration would
  produce, and the README says what it would take.
- Dark mode. The product has a light canvas by decision; the tokens are
  semantic so a dark set is a second block, not a rewrite.
