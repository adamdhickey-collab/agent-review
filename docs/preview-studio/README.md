# Preview Studio

The visual direction of the review since 2026-10-11: a product workspace
with the interface a decision changes large on the left, and the decision
in a focused inspector on the right, so a person reads the agent's
reasoning and weighs the directions while looking at what they change. It
replaced the Stripe-inspired palette of earlier that day (agent-review#29,
whose structural work it keeps: Relay's colors frozen under `-product`
names).

This page is the theme guidance: what each token is for, the two schemes,
the type, shape and elevation, the appearance control, and the layout's
rules. The values themselves live only in `src/tokens/tokens.css`; this
page quotes them so a reader can see the scheme without opening it, and
`npm run lint:tokens` is what holds a stylesheet to them.

The visual language takes its relation between preview and reasoning from
two references on Mobbin: Ferndesk's change-review workspace and
Cofounder's output preview beside agent context. It takes nothing else:
the product logic, the copy and the components are Agent Review's.

Radix Themes was named as the foundation in the brief. Nothing Radix is
installed here, and on purpose: this repository's subject is a component
system an agent works inside, and a second system beside it would be the
drift its rules exist to catch. What is borrowed is Radix Themes' model,
not its package: an appearance that is light, dark or inherited from the
system, set on the root; a page ground with panels a step off it; a subtle
fill that reads as a fill in both schemes; and solid, tint and edge steps
per meaning. Those are expressed in the existing token layer and
components.

## The palette

The fifteen roles the brief named, to the digit, and the token each one is.

| Role | Token | Light | Dark |
| --- | --- | --- | --- |
| Workspace background | `--color-canvas` | `#edf1f5` | `#101820` |
| Main surface, inspector | `--color-surface` | `#ffffff` | `#1a242e` |
| Chrome, secondary surface | `--color-surface-chrome` (new) | `#f8fafc` | `#15202a` |
| Subtle fill | `--color-surface-sunken` | `#f2f5f8` | `#25313d` |
| Primary text | `--color-text` | `#202c37` | `#e6eef3` |
| Secondary text | `--color-text-muted` | `#596a79` | `#a4b5c3` |
| Structural border | `--color-border` | `#dce3e9` | `#33424f` |
| Accent, interactive text | `--color-accent` | `#1b6780` | `#8dc7d4` |
| Accent subtle fill | `--color-accent-subtle` | `#e6f2f5` | `#243d46` |
| Text on accent | `--color-text-on-accent` | `#ffffff` | `#14323c` |
| Success text | `--color-success` | `#236f52` | `#8dccb0` |
| Success subtle fill | `--color-success-subtle` | `#e9f5ef` | `#23382f` |
| Danger text | `--color-danger` | `#b42340` | `#f5a0b2` |
| Danger subtle fill | `--color-danger-subtle` | `#fcebef` | `#42252f` |
| Warning text | `--color-warning` | `#91610e` | `#e2bf7b` |

The brief's "secondary text" is the review's muted ink, the one for a
label, a time or a path. The review has a third ink between that and the
primary, for running text inside a card, and it and every other value
below is derived from the brief's and measured the same way:

| Token | Light | Dark | Why |
| --- | --- | --- | --- |
| `--color-text-secondary` | `#3d4c59` | `#c3d0da` | Running text in a card; muted ink for whole paragraphs read gray |
| `--color-surface-hover` | `#eef2f6` | `#222d38` | A row or a ghost control under the pointer |
| `--color-surface-hover-strong` | `#e5ebf0` | `#2b3743` | A queue row under the pointer, as far as muted ink allows |
| `--color-divider` | `#e6ebf0` | `#29353f` | The line between rows inside a panel, a step under the border |
| `--color-border-control` | `#7a8896` | `#6f8394` | The edge a reader has to find: an input, a checkbox, a secondary button |
| `--color-accent-hover` | `#155669` | `#a7d6e0` | Primary button under the pointer |
| `--color-accent-active` (new) | `#114656` | `#bfe2e9` | Primary button pressed, on the review's surface |
| `--color-accent-border` | `#a3cdd8` | `#3d6976` | The edge of an accent tint |
| `--color-warning-subtle` | `#fbf1de` | `#3a3122` | The brief gave the warning's ink and no tint |
| `--color-*-solid`, `--color-*-border` | | | A mark or a bar, and a tint's edge, per meaning |
| `--color-diff-*` | | | A line added or removed, a step lighter than a status tint |

Structural borders are not enough to find a control by: `#dce3e9` is 1.3:1
on white and 1.1:1 on the page. Every control a person has to locate draws its edge in
`--color-border-control`, which clears 3:1 on every ground (WCAG 1.4.11).

### Measured

Every ink clears 4.5:1 on every ground it sits on, and every control edge
and mark 3:1, in both schemes. Computed before any value was written, and
held by axe on every story, light and dark. A few of the pairs:

| Pair | Light | Dark |
| --- | --- | --- |
| Primary text on the page | 12.5:1 | 15.2:1 |
| Secondary (running) text on a panel | 8.8:1 | 10.0:1 |
| Muted text on the page | 4.9:1 | 8.5:1 |
| Muted text on a strong hover | 4.6:1 | 5.8:1 |
| Accent text on the page | 5.6:1 | 9.6:1 |
| Accent text on its tint | 5.6:1 | 6.2:1 |
| Text on the accent | 6.4:1 | 7.3:1 |
| Success, warning, danger on their tints | 5.4, 4.8, 5.6:1 | 6.8, 7.3, 6.9:1 |
| Control edge on the page, a panel, the fill | 3.2, 3.6, 3.3:1 | 4.6, 4.0, 3.4:1 |

### What teal is for

Teal is the review's color: what the screen asks a person to do (Apply,
the recommended answer's button), the direction they have selected, the
place they are in, a link, the focus ring, and the annotation the preview
draws around the element a decision is about. It is never a color in the
product the review shows. The gray of "Cancel subscription" in the billing
preview is Relay's own, `#6a6a76`, written by the change's own lines, so a
mark the review draws on the preview cannot settle how quiet an action in
the product should be. The link and the quiet Button a direction proposes
are drawn the same, which is the question. (Until 2026-10-21 the billing
preview's question was two reds, `#b42318`, a failure's and a replaced
plan's.)

## Two surfaces

The review and Relay, the product under review, share one token layer.
Relay renders inside the review's DOM, in the preview frame, so the review
only ever adds tokens or re-values them on its own surface:

- `[data-surface='review']` (the shell, and every non-product story) takes
  the palette above, Geist, a 14px body and the wider radii.
- `[data-surface='product']` (the preview frames, and `Product/*` stories)
  hands back Relay's frozen palette, Inter, a 13px body and its own radii,
  and is always the light scheme: Relay has one. In the dark theme the
  product in the preview is still light, as it would be in a real
  preview of a light-only product.
- The decision preview's annotation is the review's (it is drawn over the
  product), in the light scheme whatever the theme, because the product
  under it always is: the light accent is 6.4:1 on Relay's white, where the
  dark scheme's pale teal would be under 2:1. What each marked element is
  is a caption under its screen, in the screens' own columns, led by the
  same tag the mark carries (since later on 2026-10-11; it was a key under the whole
  frame, in columns of its own, led by drawn swatches a reader could not
  match to the marks).

`tests/visual.spec.ts` holds Relay's own baselines (`customers-before-*`)
to the pixel; they did not change.

## Type, shape, elevation

- **Type.** Geist on the review's surface, Geist Mono for anything a
  machine wrote. Body 14px (`--text-md-review`), labels 12px, the
  workspace's heading 24px. Relay keeps Inter at 13px. In a wide desktop
  window the app is drawn larger (`app/scale.css`): 1.0625 from 1296px and
  1.125 from 1440px, which draws the body at 14.9 and 15.75px and a heading
  at 27px. The steps were 1.125 and 1.25 while the body was 13px; the
  reading size is within a hair of what was chosen then.
- **Shape.** A 4px spacing scale. Controls 6px (`--radius-sm`), menus and
  inner panels 8px (`--radius-md`), the preview and the inspector 12px
  (`--radius-lg`).
- **Elevation.** The inspector is the one raised surface on the screen; the
  preview, the read, the completed work and the boundaries are flat panels,
  an edge and no shadow. In the dark a control casts no shadow and a card
  almost none: the panels are told apart by their grounds and edges.

## Appearance

A Light / Dark / System control in the bar, built from the system's
SegmentedControl: one tab stop, arrow keys between the three, each an icon
named by its tooltip.

- With no saved choice, the review follows the system (since 2026-10-24, by
  decision; dark from later on 2026-10-11, and following the system when
  Preview Studio opened): the root's own `color-scheme` is `light dark`, so
  a first visit is light unless the operating system is set to dark, and
  follows it live. The pictures of the review are of the light theme.
- Choosing Light or Dark puts `data-theme` on the root and remembers it,
  fixing the scheme. Choosing System takes the attribute off and remembers
  that.
- The choice is stored where the earlier toggle stored it,
  `localStorage['agent-review:theme']`, so a choice made before System
  existed reads as it was written (`light`, `dark`); `system` is the one
  new value. Nothing to migrate.
- `index.html` applies a remembered Light or Dark before the first paint.
  System needs nothing before it: it is the stylesheet's own default.
- `color-scheme` is set on the root in every case, so native controls (a
  scrollbar, a text field) follow the theme.
- Changing it changes one attribute; nothing remounts, so the run, the
  selected direction, a typed reason, open evidence and the decision state
  are kept.
- The Storybook has its own Theme toolbar and never follows the system, so
  a story looks the same on every machine and in the test run.

## The workspace

```
┌ app bar: Agent Review · Delegated work · Reviews ········ Storybook · Source · ⌨ · ☀ ☾ 🖥 · relay/web · AW ┐
├ run bar: [Quiet cancel|Shared table]  Simulated  A sample run, played back the same way each time. Reset ┤
│ Delegated to Claude Code by Alex · 1 h ago                                                              │
│ Bring the billing screens onto the design system                                                        │
│ 7 changes made and checked. 2 decisions need you.   [7 on its own] [1 judgment] [1 approval]  ▓▓▓▓░░    │
│ ┌ preview: Billing settings · BillingSettings.tsx   Current | Proposed  ┐ ┌ Needs you 2   1 of 2 ‹ › ┐   │
│ │   the screen, rendered, the element marked                            │ │ Needs judgment            │   │
│ ├ what each marked element is                                           ┤ │ the question              │   │
│ └───────────────────────────────────────────────────────────────────────┘ │ checks, and what they     │   │
│ [Recommended]   [What I can't determine · Request evidence]               │  can't say                │   │
│ ▸ The evidence and the code                                               │ two direction cards       │   │
│                                                                           │ plan · reason · rule ·    │   │
│                                                                           │  Apply                    │   │
│                                                                           └───────────────────────────┘   │
│ Your decisions · Checks · Completed work                         Boundaries · Your rules                   │
```

- **Columns.** The preview takes what the inspector leaves; the inspector
  is 21.25rem (340px), 20rem under 64rem. Under 56rem the workspace is one
  column: the preview, what the agent read, then the inspector.
- **Follow.** The shorter column follows the page while the longer one is
  read, but only when the whole of it fits the window, so following never
  holds any of it out of view. On the billing decision at 1440x1000 that is
  the preview, so it stays beside the second direction's card.
- **No fixed heights, no nested scrolling.** The page grows. The one thing
  that sticks to the window's edge is the Apply bar, while the plan above
  it is longer than the window. A fixed-width product screen (the customer
  list, laid out for 768) scales down to fit, to half at the smallest, and
  then its canvas pans, as a tab stop.
- **One decision at a time.** The inspector shows the decision the preview
  is of; the pager says which of how many, and keeps each decision's
  selection, so going to another and back finds it as it was.
- **Selecting is previewing.** A direction's "Select and preview" marks it
  (`aria-pressed`), switches the preview to it, labelled "Proposed" and
  "Not applied" in a polite live region, and opens the plan, the reason,
  the rule box and Apply. Apply goes through the reducer, as every answer
  always has.
- **The bar.** Its steps were found by sweeping its width 4px at a time for
  a label broken onto two lines: the name goes from 62rem, the project's
  branch from 56rem, the keyboard button from 44rem, and the bar is two
  rows from 50rem.

## Screens

Taken by `node scripts/preview-studio-shots.mjs <base-url>` from a
production build, at 1440 wide (the window 1000 tall; a state taller than
that is captured whole) and at a phone's 390. Each is a state reached by
pressing through the app.

| State | Light | Dark |
| --- | --- | --- |
| The billing decision, before a selection | [1-billing-before-light](screens/1-billing-before-light.png) | [1-billing-before-dark](screens/1-billing-before-dark.png) |
| Add a quiet variant, selected and previewed | [2-billing-quiet-light](screens/2-billing-quiet-light.png) | [2-billing-quiet-dark](screens/2-billing-quiet-dark.png) |
| Make it a Button in its own change, selected, a reason typed, kept as a rule | [3-billing-own-change-light](screens/3-billing-own-change-light.png) | [3-billing-own-change-dark](screens/3-billing-own-change-dark.png) |
| The same, in the real window, scrolled: the preview has followed | [3b-billing-follow-light](screens/3b-billing-follow-light.png) | [3b-billing-follow-dark](screens/3b-billing-follow-dark.png) |
| The decision applied: the record | [4-billing-record-light](screens/4-billing-record-light.png) | [4-billing-record-dark](screens/4-billing-record-dark.png) |
| The shared table, before an answer | [5-table-before-light](screens/5-table-before-light.png) | [5-table-before-dark](screens/5-table-before-dark.png) |
| The shared table, "Approve, this once" selected | [6-table-approve-light](screens/6-table-approve-light.png) | [6-table-approve-dark](screens/6-table-approve-dark.png) |
| A phone, 390, before a selection | [7-billing-phone-light](screens/7-billing-phone-light.png) | [7-billing-phone-dark](screens/7-billing-phone-dark.png) |
