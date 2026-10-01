# Bulk actions on the customer table

**Request.** Add bulk actions to the customer table using the existing
component system. A person should be able to select several customers
and archive or export them.

**Branch** `agent/bulk-actions-no-rules`, four files, all under
`src/product/customers/`: `CustomerTable.tsx`, `CustomerTable.css` and
`CustomerTable.stories.tsx` modified, `exportCsv.ts` added. Nothing under
`src/components/` changed.

## What a person can do now

- **Select.** Every row has a Checkbox in a control column, labelled
  "Select <company>" for a screen reader, and the head has "Select all
  customers", which is indeterminate while the selection is partial,
  checked when it is whole, and disabled when there are no rows. A
  selected row says so with `aria-selected` and the Table's tinted ground.
- **See what is selected.** Selecting a row swaps the title toolbar for
  the system's accent Toolbar in the same slot: "3 selected", then
  Archive, Export and Clear selection. The slot is the same height, so
  the row under the pointer does not move. The "Customers" heading stays
  in the tree, visually hidden, so the section keeps its name.
- **Archive.** Archive is the one action that cannot be taken back, so it
  asks first, in that same slot: "Archive 3 customers? They leave this
  list." with Cancel and a danger button that repeats the number. Focus
  moves to Cancel, so a second Enter does nothing; Escape withdraws the
  question and puts focus back on Archive; changing the selection
  withdraws it too, since its number would be stale. Confirming removes
  the rows for the session, drops the count, brings the title toolbar
  back, says "Archived 3 customers." in a status line, and puts focus on
  the select-all box.
- **Export.** Writes the selected rows to `customers.csv` through a Blob
  URL (same seven columns as the table, raw figures rather than "$3,840"),
  says "Exported 3 customers to customers.csv." in the status line, and
  keeps the selection, so the same rows can be archived next.
- **Start mid-task.** A new `initialSelection` prop (ids) opens the screen
  with rows selected, for a story or for the review's preview, which was
  already passing it.

## Decisions

1. **Swap the toolbar in place rather than add a second bar.** A bar that
   appears under the toolbar pushes every row down the moment a box is
   ticked. The Toolbar's accent tone exists for "a toolbar that appears
   in response to a selection and goes away with it", so that is what it
   does here, in the slot the title toolbar occupies.
2. **The archive question is inline, not a dialog.** The system has no
   Dialog (a scrim token and nothing else), and the Toolbar story says
   the screen that places Archive owns the "Archive 3 customers?" step.
   Building it from Toolbar and Button keeps it in the system; the focus
   handling (to Cancel, back to Archive, Escape) is what a dialog would
   have given for free and is done by hand.
3. **Full ink for the selection count.** The tokens promise muted ink
   clears 4.5:1 on the four grounds; the accent ground is not one of
   them, so the count uses `--color-text`, and the hint half of the
   question uses `--color-text-secondary`.
4. **The status line is a live region that is always in the tree**, with
   no box until there is text, so a status that arrives is announced
   rather than inserted silently. After an archive, focus goes to the
   select-all box rather than to the status, so the screen reader hears
   the status once and lands somewhere useful.
5. **Archiving is for the session only, and says so nowhere in the UI
   beyond "They leave this list."** There is no Archived view and no
   undo; the question is the one guard. Both are listed below.
6. **No row press to select.** The Table's `interactive` rows are
   pointer-only on their own; the checkbox is reachable by keyboard and
   is enough for twelve rows.

## Reused, changed, new states, new patterns

- **Reused:** Checkbox (`hideLabel`, `indeterminate`, `disabled`),
  HeaderCell and Cell (`control`), Row (`selected`), Toolbar
  (`tone="accent"`), Button (`danger`, `secondary`, `ghost`, all
  `compact`, `leadingIcon="external"`), Table, Badge, IconButton as
  before.
- **Changed in `src/components/`:** nothing.
- **New states on CustomerTable**, each with a story: rows selected
  (Selected), all selected (AllSelected), selected at 768
  (SelectedNarrow), the archive question open (ArchiveConfirm), the
  question withdrawn (ArchiveCancelled), after an archive (Archived),
  after an export (Exported), and the select-all round trip (SelectAll).
  Eight new stories, thirteen in the file; seven of the eight have play
  functions that assert the toolbar's name and text, the checkbox states,
  `aria-selected` counts, focus and the status line.
- **New patterns:** an inline confirmation in the toolbar slot. No screen
  had one; it is built from Toolbar and Button and adds no component.

## Verification

- `tsc -p tsconfig.app.json`: clean. (`tsc -b`, which `npm run check`
  starts with, fails on the base tree before this change in
  `.storybook/vitest.setup.ts` and `tests/visual.spec.ts` under
  `tsconfig.node.json`; untouched here.)
- `npm run lint`: nothing in the changed files; the five pre-existing
  fast-refresh warnings elsewhere are unchanged.
- `npm run lint:tokens`: 31 stylesheets, every value is a token.
- Story tests with axe at `error`: 15 files, **93 of 93 stories pass**,
  the 13 CustomerTable stories among them. (The worktree's `node_modules`
  is a symlink outside the project root, which Vite refuses to serve; the
  run used a local config that allows that path, not committed.)
- Visual: **"nothing overflows the customers screen at 768" passes** on
  both sides; the two queue baselines are unchanged; the four screenshots
  that show the customer table differ, as they must: customers-before at
  1280 (8,345 px, 3%) and 768 (19,238 px, 5%), the change screen at 1280
  (17,222 px, 2%) and 768 (16,280 px, 1%). The baselines are not updated:
  they are the "before" by name and are what the review compares against.
  Almost all of the difference is the columns shifting right by one
  control column; the rest is below.
- Measured on the preview route: the **head row is 34.25px with the
  select-all box in it, against 32px before**; body rows are unchanged.
  A 16px checkbox sits on the head's 13.75px line inside a 2rem cell and
  extends the line box. The system's own Table / SelectedRows story
  renders the same way, so this is a Table.css fact rather than this
  screen's; it is left for the system rather than fixed with an override
  from a product stylesheet.

## Not done, and for the reviewer

- **The empty table.** When every customer is archived the head stays
  with nothing under it, which is what the Empty story documents for the
  screen already; an EmptyState under the head is a separate change.
- **No Archived view and no undo.** Archived rows are gone for the
  session. If undo is wanted, the status line is where it would go.
- **The head row's 2.25px**, above.
- **No `data-finding` hooks.** The review's preview outlines targets by
  that attribute; the product screen has none and this change adds none,
  so a finding that points at "bulk-count" or "bulk-actions" will not
  outline until the review's scenario is written against this build.
