# Bulk actions on the customer table

Branch `agent/bulk-actions-customers`, cut from `129fa90`. Written against
`skills/ui-quality/SKILL.md`, in the order it asks for.

## 1. What was asked

> Add bulk actions to the customer table using the existing component
> system. A person should be able to select several customers and archive
> or export them.

## 2. What was done

| File | What it touches |
| --- | --- |
| `src/product/customers/CustomerTable.tsx` | The screen. A control column of checkboxes selects rows; a selection brings up a second `Toolbar` with the count, Archive, Export and Clear selection; Archive asks first, in the same toolbar; Export hands the rows to `onExport` or downloads a CSV; an empty table renders `EmptyState`; a visually hidden `role="status"` announces what happened. Three new props: `initialSelection`, `onExport`, `onArchive`. |
| `src/product/customers/customers.ts` | `customersToCsv(rows)`: the seven columns in the table's order, raw figures, quoted where the grammar needs it. |
| `src/product/customers/CustomerTable.stories.tsx` | Six new stories with play functions, one new Narrow story, and the Empty story's description brought up to date. |
| `src/components/Table/Table.css` | The one shared change, under 4. |

How the screen behaves, in the order a person meets it:

- **Select.** Each row has a `Checkbox` in a control `Cell`, labelled
  "Select {company}" for a screen reader and hidden to the eye; the row
  carries `aria-selected` and the Table's tinted ground. The head has
  "Select all customers", indeterminate while the selection is partial,
  disabled when there is nothing to select. Select-all selects what is
  showing, so archived rows never come back into a selection.
- **The selection toolbar.** Appears under the title toolbar, not in its
  place, so the title, the count and Add customer stay where they were.
  `tone="accent"`, labelled "Selected customers", start text "3 selected",
  actions Archive (danger, compact), Export (secondary, compact, external
  icon), Clear selection (ghost, compact). It is the Toolbar's own Accent
  story, placed.
- **Archive.** The first press archives nothing. The toolbar's start text
  becomes "Archive 3 customers?" and its actions become Cancel (ghost) and
  "Archive 3 customers" (danger), which takes focus, as the DecisionBar's
  confirm does. Escape is Cancel. Cancel puts focus back on Archive.
  Confirming takes the rows out of the table, drops the count, closes the
  toolbar, calls `onArchive(rows)`, announces "3 customers archived." and
  puts focus on the select-all box, or on Add customer when the table is
  now empty. Changing the selection while the question is up withdraws it.
- **Export.** Calls `onExport(rows)` if the screen was given one;
  otherwise writes `customers.csv` through a Blob and an anchor. The
  selection stays, so the same rows can be archived next. Announces
  "2 customers exported as CSV."
- **Empty.** When nothing is left to show, the head stays (so the columns
  are still named, as in the Table's Empty story) and an `EmptyState`
  follows it: "All customers archived" when the archive emptied it, "No
  customers yet" when there were none. The baseline screen had no
  EmptyState and its Empty story said so; archiving can now reach that
  state, so it is filled in.

`initialSelection` is the prop name the review preview already spreads
onto this screen (`src/review/preview/screens.tsx`, line 46) when a
finding reproduces "with selection"; it was adopted rather than invented.

## 3. Components reused, by name and prop

- `Checkbox` with `label`, `hideLabel`, `checked`, `indeterminate`,
  `disabled`, `onChange`, and its `ref` for the select-all focus target.
- `Table`, `HeaderCell control`, `Cell control`, `Row selected`: the
  composition in the Table's SelectedRows story, unchanged.
- `Toolbar` with `label`, `tone="accent"`, `start`, and `onKeyDown` for
  Escape; the title toolbar as it was.
- `Button` with `variant="danger" | "secondary" | "ghost"`, all
  `size="compact"`, `leadingIcon="external"` on Export, and `ref` on the
  three focus targets (Archive, the confirming button, Add customer).
- `EmptyState` with `title` and `description`.
- `Badge`, `IconButton` as before.

No raw `<button>`, `<input>`, `<table>` or `<details>` was written
(rule 1 grep: nothing new outside `src/components/`). No stylesheet was
added to the screen; `CustomerTable.css` is untouched.

## 4. Shared components changed, and why (rule 9)

`src/components/Table/Table.css`, twelve lines, on `.table__cell--control`:

```css
.table__cell--control {
  width: 1px;
  padding-right: 0;
  padding-top: var(--space-1);
  padding-bottom: var(--space-1);
}
.table__cell--control .checkbox {
  display: flex;
}
```

Why: rule 7 says a control in a row does not change the row's height, and
measured on the real screen it did. `.table__th` is `height: 2rem` with
`--space-2` above and below and a hairline, which leaves 15px for a 1rem
checkbox; and the Checkbox is `inline-flex`, so its box sits on the
baseline and drags a descender's worth of line box under it. The head row
grew from 32px to about 34px. This is not local to the customer table: the
Table's own SelectedRows story has the same composition and the same
growth. The fix is where the control column is defined.

Measured before and after, on the Before preview at both widths, against a
worktree of `129fa90` (base / changed): at 768, head 32 / 32, body rows
36.95 and 37.45 / the same, frame 556.94 / 556.94; at 1280 (scaled 63%)
head 20 / 20, body 23.1 and 23.41 / the same, frame 348.09 / 348.09.
Before the fix the changed head measured 21.41 at 1280 and the frame was
1px taller at 1280 and 2px taller at 768 in the visual run. Body rows are
unaffected either way: a 38px row has room for the box.

Nothing else under `src/components/` changed; `git diff --stat
src/components/` is that one file.

## 5. New states and their stories (rule 3)

All in `Product/CustomerTable`:

- **Selected**: two rows checked by play; asserts `aria-selected` on
  them and not on a third, the select-all box partially checked, and the
  toolbar with "2 selected" and the three actions.
- **SelectAll**: select-all on, twelve selected rows and "12 selected";
  off again, nothing selected and the toolbar gone.
- **ArchiveConfirmation**: three preselected, Archive pressed; asserts
  "Archive 3 customers?", focus on the confirming button, rows still 13;
  Escape, "3 selected" again and focus on Archive.
- **Archived**: three preselected, Archive then confirm; asserts the
  toolbar gone, 10 rows, Halvorsen Freight gone, the status "3 customers
  archived.", `onArchive` called once with the three, focus on select-all.
- **Exported**: two preselected, Export; asserts `onExport` called with
  the two in table order, the selection kept, the status text.
- **AllArchived**: select all, Archive, confirm; asserts one row left
  (the head), "All customers archived" visible, select-all disabled,
  focus on Add customer.
- **NarrowSelected**: 768px frame with three preselected, so the
  selection toolbar is up at the width rule 7 names; the actions wrap
  under the count.
- **Empty**'s description now says the EmptyState is there.

No component gained a state. The Checkbox's indeterminate and disabled,
the Row's selected and the Toolbar's accent tone all had stories already.

## 6. New interaction patterns (rule 12)

One, for review:

- **An inline confirmation inside the selection toolbar.** The toolbar
  that offered Archive becomes the question, with Cancel and the
  confirming danger button, and Escape cancels. The system has no shared
  confirmation component; the two shapes in the tree are review-side (the
  DecisionBar's inline `<form>` confirm and the ReturnPanel's dialog), so
  this composes the Toolbar and the Button rather than adding a component.
  It satisfies rule 6 by the confirmation route ("Archive 3 customers?")
  rather than by undo: there is no Archived view in Relay to restore from,
  so an undo would have had to invent one. If the reviewer would rather
  have undo, `onArchive` is the hook and the rows are still in `customers`.

Nothing else is new: checkbox selection, a selection toolbar, a danger
button and a CSV export are all patterns the stories already describe.

## 7. The checks

`npm run check` cannot run to the end on this tree as it was before the
change: `tsc -b` fails on five pre-existing errors in
`.storybook/vitest.setup.ts` and `tests/visual.spec.ts` (the node
project's `lib` has no DOM and its `moduleResolution` wants an extension),
none under `src/`, present at `129fa90`. So the four were run one at a
time, before and after.

```
$ npx tsc -p tsconfig.app.json --noEmit        # the src project
exit 0

$ npm run lint
0 errors; 7 warnings, all react(only-export-components), all in files
this change does not touch, all present at 129fa90. No line under
src/product/customers or src/components/Table.

$ npm run lint:tokens
token-lint: 31 stylesheets under src
✓ every value is a token

$ npm run test:stories
 Test Files  15 passed (15)
      Tests  92 passed (92)        # 84 at 129fa90 + 8 new, every one with axe

$ npm run test:visual
  ✓ at 1280 › the review queue
  ✓ at 768  › the review queue
  ✓ nothing overflows the customers screen at 768      # rule 7, both sides
  ✘ customers, before, at 1280   7077 pixels (0.03) differ, same size
  ✘ customers, before, at 768   17592 pixels (0.05) differ, same size
  ✘ the change ... at 1280      1286 -> 1312px tall, 23598 pixels (0.02)
  ✘ the change ... at 768       2122 -> 2147px tall, 22359 pixels (0.02)
```

The four visual differences are the feature and are not re-recorded. The
two `customers-before` frames gain the control column (same frame size
after the Table.css fix; before it they were 1px and 2px taller). The two
change-screen pages render this same table in the preview with the first
finding's `withSelection`, so the selection toolbar is up and the page is
26px taller. Whether to accept them as the new baselines is the
reviewer's call, and the experiment plan keeps the agent's version under
`src/product/customers/after/` in any case.

Two things about running the checks in this worktree, for whoever runs
them next:

- `node_modules` here is a symlink to another checkout's, and Vite will
  not serve a file outside its root, so `npm run test:stories` fails
  every suite with "Failed to fetch dynamically imported module
  .../setup-file.js" before any story runs. The runs above used an
  untracked local config adding that real path to `server.fs.allow`,
  since deleted. Nothing in the repository changed for it.
- `playwright.config.ts` has `reuseExistingServer: true` on port 5173,
  and a dev server from `/Users/adamhickey/Projects/agent-review` was
  listening there. The first visual run measured that tree and passed
  everything, including `customers-before`, which it could not have. The
  runs above started this tree's own server on a free port through an
  untracked local config, also deleted. `playwright-report/` and
  `test-results/` are tracked; the runs rewrote them and they were
  restored to `HEAD` before the commit.
