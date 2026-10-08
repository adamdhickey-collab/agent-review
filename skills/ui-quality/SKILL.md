---
name: ui-quality
description: The rules for changing UI in this repository. Read before adding, changing or styling any component, screen or stylesheet under src/. Every rule names what to check and what the check is, so that following it is a thing you do rather than a thing you agree with.
---

# UI quality: the rules an agent works inside

This repository is a component system and the product built from it. The
decisions in it were made on purpose, and the job of a change is to extend
them, not to re-make them locally. These rules say how. Each one states
what to do, how to tell whether you did it, and what happens when you did
not.

The commands at the end are the checks. Run them before you say a change
is done. A rule you cannot verify is a rule you have not followed yet.

## 1. Reuse an existing component before creating one

Before writing any element with a border, a background, a padding or an
interaction, look in `src/components/index.ts`. If a component there does
the job, use it, with its props. The system has: Button (four variants,
two sizes, loading), IconButton, Badge, StatusIndicator, TestStatus,
Checkbox (with indeterminate), SegmentedControl, Tabs, Disclosure, the
Table primitives (Table, HeaderCell, Cell, Row), Toolbar, and the three
region states (EmptyState, LoadingState, ErrorState).

How to check: `grep -rn "<button\|<input\|<table\|<details" src/` outside
`src/components/` should return nothing new after your change. A raw
element where a component exists is the finding.

Common misses: an icon drawn inline or a path copied from somewhere (that is
`<Icon name="...">`; the review's icons are one family, Phosphor, written to
`src/components/Icon/family.ts` by `scripts/icons.mjs`, and a name that is not
in it is a finding about the family: add it to the script's map, never an
`<svg>` beside it), a "small button" (that is `<Button size="compact">`), a
"link that looks like a button" (that is still a Button), a pill with a
status word (that is a Badge with a tone), a row of controls over a table
(that is a Toolbar), and a bar of actions that appears when rows are
selected (that is `<Toolbar tone="accent">` holding Buttons; the
Toolbar's Accent story is that bar). A Button whose default height looks
too tall for a bar is a Button at `size="compact"`, not a local one.

## 2. Never write a value where a token exists

All spacing, type, color, radius, shadow, focus and motion values are
custom properties in `src/tokens/tokens.css`, and the names are listed in
`src/tokens/tokens.ts`. A stylesheet writes `var(--space-3)`, not `12px`;
`var(--color-border)`, not `#e4e4e8`; `var(--motion-fast)`, not `120ms`.

How to check: `npm run lint:tokens`. It reads every stylesheet under
`src/` and reports each literal where a token exists, with the file and
line. It passes on a clean tree; a change that makes it fail has
introduced an arbitrary value.

If no token fits, that is a finding about the token layer, not a reason
to write a literal. Say so in the change description, and either add the
token to `tokens.css` and `tokens.ts` together with a reason, or use the
nearest existing one. `padding: 10px 14px` is not on the scale; `8px 12px`
(`--space-2 --space-3`) is.

## 3. A new state needs a story

Any new visual state of a component, including a new prop value, a new
class, a selected or indeterminate or loading state, or a new breakpoint
behaviour, gets a story in the component's `*.stories.tsx` that renders
it. A state without a story is a state nobody can inspect, test or compare
against later.

How to check: `npm run test:stories` renders every story in Chromium and
runs axe on each. After your change, the story list for the component you
touched should include the state you added, by name.

## 4. Keyboard first, and nothing by pointer alone

Every action must be reachable and operable with the keyboard: Tab to it,
Enter or Space to press it, arrow keys inside a group (tabs, a segmented
control, a menu). Nothing may be available only on hover: a tooltip also
shows on focus, a row action also has a focusable control.

A keyboard shortcut is a second way to do something a control already does,
and the few the review has are listed in `src/app/shortcuts.ts`, which is
also what the shortcut sheet shows: add one there or not at all. A
single-character shortcut only works while the thing it acts on has focus,
or can be switched off (WCAG 2.1.4); it never fires while a person is
typing; and it never decides anything. Accept, Reject, Return and an answer
to a decision have no shortcut.

How to check: open the Storybook, put the pointer away, and Tab through
the story. Every control you can click, you can reach. For a tooltip, Tab
to the control and it appears. For a shortcut, `tests/keyboard.spec.ts`
presses real keys: a question mark typed into a message stays a question
mark.

## 5. Every interactive element shows focus

The base stylesheet draws one focus ring (`:focus-visible` in
`src/app/global.css`) on every interactive element. Do not remove it
(`outline: none`) and do not cover it (a parent with `overflow: hidden` and
no room for the offset). A control that draws its own ring uses the same
tokens: `--focus-ring-color`, `--focus-ring-width`, `--focus-ring-offset`.

How to check: `grep -rn "outline: none\|outline:none\|outline: 0" src/`
returns nothing. In the Storybook, Tab to the control and look.

## 6. A destructive action needs a second step or a way back

Deleting, archiving, sending, or anything a person would want to undo
uses `<Button variant="danger">` and either a confirmation that names what
will happen to what ("Archive 3 customers?") or an undo that is offered
immediately afterwards. A danger button that acts on first press, with no
recovery, is a defect.

How to check: the story for the action shows the confirmation or the undo.

Two shapes are in the system. A dialog, for an action taken from a
detail (the ReturnPanel). And, since the bulk-actions review
(docs/experiment/, Run 1), an inline question: the toolbar that offered
the action becomes the question, with Cancel beside the confirming
danger button, Escape as Cancel, and focus on the confirming button;
the CustomerTable's ArchiveConfirmation story is the reference. Use the
inline shape for a bulk action on a selection where there is no view to
restore from; use undo where there is one.

## 7. Table actions keep the table's alignment and density

Controls in a table row use the compact size (`size="compact"`), sit in a
`Cell` and do not change the row's height. A toolbar over a table is a
`Toolbar`, which wraps at narrow widths rather than overflowing; the row
density (`density="compact"`) is the Table's, not the screen's.

On a phone the same holds a size down: nothing makes the page wider than the
screen at 320, 360, 375 and 414, and a table that cannot fit becomes a list
rather than a sideways scroll that hides its columns (the review's queue
does this below 48rem). `tests/phone.spec.ts` measures it on a touch device,
and measures that the chrome's controls are 44px; the preview frame is the
one place that is not, for the reason in rule 11.

How to check: the component's `Narrow` story at 768px shows no horizontal
overflow beyond the table's own scroll region, and `npm run test:visual`
holds every `role="toolbar"` on the customers screen to its own box at
768 (`scrollWidth <= clientWidth`, each bar measured on its own, because
a clipping parent hides an overflow from the frame). A toolbar that
overflows at 768 is a finding, and a bar written as one flex line with
`white-space: nowrap` is the usual cause.

## 8. Loading, empty and error use the established patterns

A region with no content yet renders `LoadingState`; with no content at
all, `EmptyState` with what to do; when something failed, `ErrorState`
with what happened and what to try. No spinner written inline, no
"No results" paragraph, no red text.

How to check: the screen's stories include Loading, Empty and Error, and
each renders one of the three components.

## 9. Do not change a shared component to solve a local need

A change to anything in `src/components/` changes every screen that uses
it. If a feature needs a variant, add a prop or a size with a story, and
leave the default behaviour as it was. Changing a Button's padding so it
lines up in one toolbar changes the Button in every toolbar.

How to check: `git diff --stat src/components/` is empty, or every file
in it is one you meant to change and the change description says why. The
visual baselines (`npm run test:visual`) will show the screens that moved.

A shared change with a reason in writing is allowed, and the reason has
a shape: what you measured, on which story, before and after. Run 1 of
the bulk-actions experiment changed twelve lines of `Table.css` so a
checkbox fits a table head without growing the row, measured the head
at 32px before and after against the base commit, and showed the
Table's own SelectedRows story had the defect. That was accepted. "So
the buttons line up" is not a reason; that is a local need, and the
local need is solved by using the component, not by changing it.

## 10. A new component needs a reason in writing

If no existing component can do the job, say why in the component's
header comment: which component you considered, and what it could not do.
Then build it from the tokens, with stories for its states, and export it
from `src/components/index.ts`. A new component without that paragraph is
assumed to be a duplicate until shown otherwise.

## 11. An accessibility regression is blocking

The stories run axe (`@storybook/addon-a11y`) with `test: 'error'`: a
violation fails the test. Contrast under 4.5:1 for text, a control without
a name, a table without headers, a state said only by color, a focus ring
removed: any of these blocks the change. There is no "minor" accessibility
finding in this repository.

Target size is part of that. The stories run axe's WCAG 2.2 target-size
rule (2.5.8): a control is at least 24 by 24px, or has room around it for a
24px circle. A control that is a small pill (a marker, a tag you can press)
is a compact Button, which is 24px tall, around a Badge if it should look
like one; it is not a button restyled down to 18px. One screen is measured
differently: the review's preview frame scales the product to fit its
column, so Relay's controls are smaller there than they are, and the stories
that render the frame turn the rule off, with the reason beside it. Those
controls are checked at their real size in their own stories, and the frame
offers Actual size, which draws them at it and lets browser zoom enlarge the
product's text (WCAG 1.4.4), so fitting is a view a reviewer can leave.

How to check: `npm run test:stories` is green.

## 12. A new interaction pattern needs a person to look at it

A new way of doing something (a drag, a gesture, a keyboard shortcut, a
new kind of menu, a confirmation shape not already in the system) is not
decided by the agent. Build it behind a story, describe it in the change,
and mark the change for review. The reviewer decides whether the pattern
enters the system.

How to check: the change description has a section "New interaction
patterns", and it is either "none" or a list.

## The checks

```bash
npm run typecheck      # the types
npm run lint           # the linter
npm run lint:tokens    # rule 2
npm run test:stories   # rules 3 and 11: every story renders, axe passes
npm run test:visual    # rule 9: every screen against its baseline
```

`npm run check` runs the first four. Run it before saying a change is
done, and put its output in the change description.

## How to describe a change

The description is what the reviewer reads first. In this order:

1. What was asked.
2. What you did, as a list of files and the component each touches.
3. Which existing components you reused, by name and prop.
4. Which shared components you changed, if any, and why (rule 9).
5. New states and their stories (rule 3).
6. New interaction patterns (rule 12), or "none".
7. The output of `npm run check`.
