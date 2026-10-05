import type { Change, Finding } from './types';

/* The review queue and the two changes the product is built around.

   rv-2041 is Run 1 of the experiment in docs/experiment/README.md: the
   agent with CLAUDE.md and the ui-quality skill in context. Its files,
   its diff excerpts, its findings, its figures and the words in its
   rationale are transcribed from the branch (agent/bulk-actions-customers
   at e50a20e), its CHANGE.md and the checks run on it. rv-2042 is Run 2,
   the same request without the rules, recorded the same way. rv-2043 is
   the branch broken by hand. The other five changes exist so the queue is
   a queue, and are invented throughout: their names, branches, figures
   and decisions. Each is marked `sample`, and the queue and the change's
   own screen say so on the row, because a reader who follows the case
   study here should not have to guess which rows are a record. */

const dana = { name: 'Dana Whitfield', role: 'Product design' };
const tomas = { name: 'Tomas Reyes', role: 'Engineering' };
const priya = { name: 'Priya Natarajan', role: 'Product' };

const story = (id: string, title: string, name: string, isNew?: boolean) => ({ id, title, name, isNew });

/* ------------------------------------------------------------------------
   Run 1: with the rules. Clean in every way the checks measure; two
   things for a person to decide.
   ------------------------------------------------------------------------ */

const run1Findings: Finding[] = [
  {
    id: 'f1-shared-table',
    kind: 'shared',
    severity: 'decision',
    title: 'The Table’s control column changed, for every table',
    summary:
      'Twelve lines in Table.css: the control column’s padding, and the checkbox inside it set to flex, so a 1rem checkbox fits a 2rem head without growing the row. Every table with a control column renders differently now, which is rule 9’s question: a local need solved in a shared place, or a defect in the Table that this feature exposed?',
    rules: [9, 7],
    evidence: {
      kind: 'shared',
      file: 'src/components/Table/Table.css',
      lines: 12,
      reason:
        'Rule 7 says a control in a row does not change the row’s height, and measured on the real screen it did. The head is 2rem with --space-2 above and below and a hairline, which leaves 15px for a 1rem checkbox; and the Checkbox is inline-flex, so its box sits on the baseline and drags a descender’s worth of line box under it. The head row grew from 32px to about 34px. This is not local to the customer table: the Table’s own SelectedRows story has the same composition and the same growth. The fix is where the control column is defined.',
      measured:
        'Head row 32px before and after the change at 768 (34px without the fix); body rows unchanged at 36.95 and 37.45; the frame 556.94px either way. Measured by the agent against a worktree of the base commit.',
      consumers: [
        story('system-table--selectedrows', 'System/Table', 'SelectedRows'),
        story('product-customertable--selected', 'Product/CustomerTable', 'Selected', true),
      ],
    },
    reproduce: { screen: 'customers', side: 'after', viewport: 1280, withSelection: true },
    correction:
      'Keep the Table.css change: it corrects the Table’s own SelectedRows story. Move its reason from CHANGE.md into a comment on the rule, and add the before/after measurement to the SelectedRows story’s description.',
  },
  {
    id: 'f1-new-pattern',
    kind: 'pattern',
    severity: 'decision',
    title: 'A new interaction pattern: the toolbar becomes the confirmation',
    summary:
      'Archive does nothing on first press. The selection toolbar’s text becomes “Archive 3 customers?”, its actions become Cancel and the confirming danger button, Escape cancels, and focus lands on the confirming button. Rule 6 is satisfied by the confirmation route; rule 12 says whether this shape enters the system is a person’s call, and the agent listed it rather than deciding it.',
    rules: [12, 6],
    evidence: {
      kind: 'pattern',
      description: 'An inline confirmation inside the selection toolbar, replacing the actions that offered the destructive step.',
      builtFrom: ['Toolbar tone="accent"', 'Button variant="danger" size="compact"', 'Button variant="ghost"'],
      alternative:
        'Undo after the fact: archive on first press and offer Undo in the same toolbar. The agent chose the question because Relay has no Archived view to restore from, so an undo would have had to invent one; onArchive is the hook if the reviewer prefers it.',
      story: story('product-customertable--archiveconfirmation', 'Product/CustomerTable', 'ArchiveConfirmation', true),
    },
    reproduce: { screen: 'customers', side: 'after', viewport: 1280, withSelection: true, target: 'bulk-archive' },
    correction:
      'The inline confirmation is accepted as the system’s pattern for a destructive bulk action with no view to restore from. Document it in skills/ui-quality/SKILL.md under rule 6 as the second shape, with the ArchiveConfirmation story as its reference.',
  },
  {
    id: 'f1-visual',
    kind: 'visual',
    severity: 'note',
    title: 'Four frames changed, all of them the feature',
    summary:
      'The two customers frames gain the control column; the two review-screen frames render the same table with a selection up, so the selection toolbar is in them and the page is 26px taller. Nothing changed where the agent was not working.',
    rules: [],
    evidence: {
      kind: 'visual',
      story: story('product-customertable--selected', 'Product/CustomerTable', 'Selected', true),
      diffPixels: 70_626,
      diffPercent: 0.03,
      expected: true,
      where: 'The control column at the left of every row, and the selection toolbar under the title toolbar when rows are selected.',
      frames: [
        { name: 'customers, before, at 1280', diffPixels: 7_077, diffPercent: 0.03 },
        { name: 'customers, before, at 768', diffPixels: 17_592, diffPercent: 0.05 },
        { name: 'the change, with the first finding open, at 1280', diffPixels: 23_598, diffPercent: 0.02, sizeChanged: '1286 to 1312px tall' },
        { name: 'the change, with the first finding open, at 768', diffPixels: 22_359, diffPercent: 0.02, sizeChanged: '2122 to 2147px tall' },
      ],
    },
    reproduce: { screen: 'customers', side: 'after', viewport: 1280, withSelection: true, target: 'bulk-bar' },
    correction: 'Accept the four frames as the new baselines when the change is accepted.',
  },
  {
    id: 'f1-states',
    kind: 'state',
    severity: 'note',
    title: 'Seven new states, each with a story',
    summary:
      'Rows selected, all selected, the archive question, archived, exported, everything archived, and the selection up at 768. Every one has a story with a play function that reaches it and asserts what it finds, so every one ran through axe.',
    rules: [3],
    evidence: {
      kind: 'state',
      component: 'CustomerTable',
      state: 'Selected, SelectAll, ArchiveConfirmation, Archived, Exported, AllArchived, NarrowSelected',
      hasStory: true,
      reachedBy: 'Checking a row or the head checkbox; pressing Archive, then confirming or cancelling; pressing Export.',
    },
    reproduce: { screen: 'customers', side: 'after', viewport: 768, withSelection: true },
    correction: '',
  },
  {
    id: 'f1-interaction',
    kind: 'interaction',
    severity: 'note',
    title: 'Every story passes, with axe on each',
    summary: '92 stories, 92 passed: the 85 the system had, and the seven new ones. No accessibility violation on any of them.',
    rules: [11],
    evidence: {
      kind: 'interaction',
      tests: [
        { name: 'Selected: two rows checked, select-all partial, toolbar says 2 selected', state: 'passed' },
        { name: 'SelectAll: twelve selected, then none and the toolbar gone', state: 'passed' },
        { name: 'ArchiveConfirmation: the question, focus on the confirming button, Escape cancels', state: 'passed' },
        { name: 'Archived: ten rows left, the status announced, focus on select-all', state: 'passed' },
        { name: 'Exported: onExport called with the two rows in table order', state: 'passed' },
        { name: 'AllArchived: the head and an empty state, focus on Add customer', state: 'passed' },
        { name: 'NarrowSelected: the toolbar wraps at 768, nothing overflows', state: 'passed' },
      ],
    },
    correction: '',
  },
];

export const bulkActionsWithRules: Change = {
  id: 'rv-2041',
  title: 'Add bulk actions to the customer table',
  repo: 'relay/web',
  branch: 'agent/bulk-actions-customers',
  base: 'main',
  commit: 'e50a20e',
  agent: { name: 'Claude Code', run: 'run 1, with the rules' },
  requester: dana,
  openedAt: '2026-10-01T11:46:00-05:00',
  state: 'needs-review',
  componentsTouched: ['CustomerTable', 'Checkbox', 'Toolbar', 'Button', 'EmptyState', 'Table'],
  files: [
    { path: 'src/product/customers/CustomerTable.tsx', status: 'modified', additions: 196, deletions: 15, shared: false },
    { path: 'src/product/customers/CustomerTable.stories.tsx', status: 'modified', additions: 146, deletions: 5, shared: false },
    { path: 'src/product/customers/customers.ts', status: 'modified', additions: 25, deletions: 0, shared: false },
    { path: 'src/components/Table/Table.css', status: 'modified', additions: 12, deletions: 0, shared: true },
    { path: 'CHANGE.md', status: 'added', additions: 219, deletions: 0, shared: false },
  ],
  validation: {
    visual: { state: 'changed', label: '4 changes', count: 4 },
    accessibility: { state: 'passed', label: 'Passed', count: 0 },
    interaction: { state: 'passed', label: 'Passed', count: 0 },
    components: { state: 'changed', label: '1 shared change', count: 1 },
    tokens: { state: 'passed', label: 'Passed', count: 0 },
  },
  findings: run1Findings,
  stories: [
    story('product-customertable--selected', 'Product/CustomerTable', 'Selected', true),
    story('product-customertable--selectall', 'Product/CustomerTable', 'SelectAll', true),
    story('product-customertable--archiveconfirmation', 'Product/CustomerTable', 'ArchiveConfirmation', true),
    story('product-customertable--archived', 'Product/CustomerTable', 'Archived', true),
    story('product-customertable--exported', 'Product/CustomerTable', 'Exported', true),
    story('product-customertable--allarchived', 'Product/CustomerTable', 'AllArchived', true),
    story('product-customertable--narrowselected', 'Product/CustomerTable', 'NarrowSelected', true),
    story('system-table--selectedrows', 'System/Table', 'SelectedRows'),
  ],
  diff: [
    {
      file: 'src/components/Table/Table.css',
      header: '@@ -65,6 +65,18 @@ .table__cell--control {',
      lines: [
        { kind: 'context', text: '.table__cell--control {' },
        { kind: 'context', text: '  width: 1px; /* shrink to the control */' },
        { kind: 'context', text: '  padding-right: 0;' },
        { kind: 'add', text: '  padding-top: var(--space-1);', findingId: 'f1-shared-table' },
        { kind: 'add', text: '  padding-bottom: var(--space-1);', findingId: 'f1-shared-table' },
        { kind: 'add', text: '}' },
        { kind: 'add', text: '' },
        { kind: 'add', text: '.table__cell--control .checkbox {', findingId: 'f1-shared-table' },
        { kind: 'add', text: '  display: flex;', findingId: 'f1-shared-table' },
        { kind: 'context', text: '}' },
      ],
    },
    {
      file: 'src/product/customers/CustomerTable.tsx',
      header: '@@ -199,0 +200,34 @@ the selection toolbar',
      lines: [
        { kind: 'add', text: '{count > 0 ? (' },
        { kind: 'add', text: '  <Toolbar', findingId: 'f1-new-pattern' },
        { kind: 'add', text: '    label="Selected customers"' },
        { kind: 'add', text: '    tone="accent"' },
        { kind: 'add', text: '    start={<span>{confirming ? `Archive ${plural(count)}?` : `${count} selected`}</span>}', findingId: 'f1-new-pattern' },
        { kind: 'add', text: '    onKeyDown={(e) => {' },
        { kind: 'add', text: '      if (confirming && e.key === \'Escape\') {' },
        { kind: 'add', text: '        e.preventDefault();' },
        { kind: 'add', text: '        cancelArchive();' },
        { kind: 'add', text: '      }' },
        { kind: 'add', text: '    }}' },
        { kind: 'add', text: '  >' },
        { kind: 'add', text: '    {confirming ? (' },
        { kind: 'add', text: '      <>' },
        { kind: 'add', text: '        <Button size="compact" variant="ghost" onClick={cancelArchive}>Cancel</Button>' },
        { kind: 'add', text: '        <Button ref={confirmButton} size="compact" variant="danger" onClick={archiveSelected}>', findingId: 'f1-new-pattern' },
        { kind: 'add', text: '          Archive {plural(count)}' },
        { kind: 'add', text: '        </Button>' },
        { kind: 'add', text: '      </>' },
        { kind: 'add', text: '    ) : (' },
        { kind: 'add', text: '      <>' },
        { kind: 'add', text: '        <Button ref={archiveButton} size="compact" variant="danger" onClick={() => setConfirming(true)}>Archive</Button>' },
        { kind: 'add', text: '        <Button size="compact" variant="secondary" leadingIcon="external" onClick={exportSelected}>Export</Button>' },
        { kind: 'add', text: '        <Button size="compact" variant="ghost" onClick={clearSelection}>Clear selection</Button>' },
        { kind: 'add', text: '      </>' },
        { kind: 'add', text: '    )}' },
        { kind: 'add', text: '  </Toolbar>' },
        { kind: 'add', text: ') : null}' },
      ],
    },
  ],
  rationale: {
    request:
      'Add bulk actions to the customer table using the existing component system. A person should be able to select several customers and archive or export them.',
    summary:
      'A control column of checkboxes selects rows, with select-all in the head (indeterminate while partial). A selection brings up a second Toolbar in the accent tone with the count, Archive, Export and Clear selection. Archive does nothing on first press: the same toolbar asks “Archive 3 customers?” with Cancel beside the confirming danger button, Escape cancels, and the rows leave the table on confirmation. Export hands the selected customers to onExport or downloads customers.csv. An emptied table renders EmptyState, and a hidden status region announces what happened.',
    decisions: [
      'The selection toolbar appears under the title toolbar, not in its place, so the title, the count and Add customer stay where they were. It is the Toolbar’s own Accent story, placed.',
      'Select-all selects what is showing, so archived rows never come back into a selection.',
      'The first press of Archive archives nothing; the toolbar becomes the question. There is no Archived view in Relay to restore from, so an undo would have had to invent one.',
      'initialSelection was adopted as the prop name because the review preview already spreads it onto this screen; it was adopted rather than invented.',
      'One shared change, to Table.css, so a 1rem checkbox fits a 2rem head without growing the row, measured against a worktree of the base commit.',
    ],
    reported: {
      reused: ['Checkbox', 'Table', 'HeaderCell control', 'Cell control', 'Row selected', 'Toolbar', 'Button', 'EmptyState', 'Badge', 'IconButton'],
      changed: ['Table (control column, 12 lines)'],
      newStates: ['Selected', 'SelectAll', 'ArchiveConfirmation', 'Archived', 'Exported', 'AllArchived', 'NarrowSelected'],
      newPatterns: 'One, for review: an inline confirmation inside the selection toolbar.',
    },
  },
};

/* ------------------------------------------------------------------------
   Run 2: without the rules. The same request on the same tree with
   CLAUDE.md, the skill and the project documents removed from what the
   agent could read. Also clean on every check. What differs is judgment
   at the edges, which is what the findings below are about.
   ------------------------------------------------------------------------ */

const run2Findings: Finding[] = [
  {
    id: 'f2-toolbar-replaced',
    kind: 'pattern',
    severity: 'decision',
    title: 'Selecting a row replaces the title toolbar',
    summary:
      'The accent toolbar takes the title toolbar’s slot while rows are selected, so nothing below moves; the “Customers” heading stays in the tree, visually hidden. Run 1 put the bar under the title instead. Both are built from the Toolbar; which one Relay uses is a product decision, not a check’s.',
    rules: [12],
    evidence: {
      kind: 'pattern',
      description: 'A selection toolbar that swaps in for the title toolbar, in the same slot, rather than appearing beneath it.',
      builtFrom: ['Toolbar tone="accent"', 'Button variant="danger" size="compact"', 'a visually hidden heading'],
      alternative: 'A second toolbar under the title, as Run 1 built it: the title, the count and Add customer stay visible while rows are selected, at the cost of the rows moving down when the first box is ticked.',
      story: story('product-customertable--selected', 'Product/CustomerTable', 'Selected', true),
    },
    reproduce: { screen: 'customers', side: 'after', viewport: 1280, withSelection: true, target: 'bulk-bar' },
    correction:
      'Use the second-toolbar arrangement from the accepted change (rv-2041): the title toolbar stays, the selection toolbar appears under it. The pattern in the system is one toolbar per job.',
  },
  {
    id: 'f2-no-empty-state',
    kind: 'state',
    severity: 'decision',
    title: 'Archiving every customer leaves a head and nothing under it',
    summary:
      'The screen can now reach a state the baseline could not: no rows. It renders the column head over an empty body, with no EmptyState. The agent listed it as not done. Rule 8 says the region state is the system’s, so it is a correction rather than a rejection.',
    rules: [8, 3],
    evidence: {
      kind: 'state',
      component: 'CustomerTable',
      state: 'every customer archived',
      hasStory: false,
      reachedBy: 'Select all, Archive, confirm.',
    },
    reproduce: { screen: 'customers', side: 'after', viewport: 1280, withSelection: true },
    correction: 'Render EmptyState after the head when the list is empty (“All customers archived”), and add an AllArchived story that reaches it, as rv-2041 did.',
  },
  {
    id: 'f2-head-growth',
    kind: 'shared',
    severity: 'note',
    title: 'The head row grows with the checkbox in it, and the agent said so rather than patched it',
    summary:
      'A 1rem checkbox on the head’s line grows the row from 32 to 34.25px. The agent measured it, found the Table’s own SelectedRows story has the same growth, and flagged it as a Table.css matter instead of fixing it from a product stylesheet. Run 1 fixed it in Table.css with the reason written; this run left the shared component alone. Both are defensible readings of rule 9, and the fix lands with rv-2041.',
    rules: [9, 7],
    evidence: {
      kind: 'shared',
      file: 'src/components/Table/Table.css',
      lines: 0,
      reason: 'Flagged in CHANGE.md as a Table.css matter, with the measurement; not changed from the product stylesheet.',
      measured: 'Head row 32px without the select-all checkbox, 34.25px with it, at 768; the same in the Table’s SelectedRows story.',
      consumers: [story('system-table--selectedrows', 'System/Table', 'SelectedRows')],
    },
    correction: '',
  },
  {
    id: 'f2-visual',
    kind: 'visual',
    severity: 'note',
    title: 'Four frames changed, all of them the feature',
    summary: 'The control column, and the selection toolbar in the review’s own preview. Nothing changed where the agent was not working.',
    rules: [],
    evidence: {
      kind: 'visual',
      story: story('product-customertable--selected', 'Product/CustomerTable', 'Selected', true),
      diffPixels: 61_085,
      diffPercent: 0.02,
      expected: true,
      where: 'The control column at the left of every row, and the selection toolbar in place of the title toolbar when rows are selected.',
      frames: [
        { name: 'customers, before, at 1280', diffPixels: 8_345, diffPercent: 0.03, sizeChanged: '350 to 351px tall' },
        { name: 'customers, before, at 768', diffPixels: 19_238, diffPercent: 0.05, sizeChanged: '558 to 560px tall' },
        { name: 'the change, with the first finding open, at 1280', diffPixels: 17_222, diffPercent: 0.02, sizeChanged: '1286 to 1287px tall' },
        { name: 'the change, with the first finding open, at 768', diffPixels: 16_280, diffPercent: 0.01, sizeChanged: '2122 to 2123px tall' },
      ],
    },
    reproduce: { screen: 'customers', side: 'after', viewport: 1280, withSelection: true, target: 'bulk-bar' },
    correction: '',
  },
  {
    id: 'f2-interaction',
    kind: 'interaction',
    severity: 'note',
    title: 'Every story passes, with axe on each',
    summary: '93 stories, 93 passed: the 85 the system had and eight new ones, seven with play functions. No accessibility violation.',
    rules: [11, 3],
    evidence: {
      kind: 'interaction',
      tests: [
        { name: 'Selected, AllSelected, SelectedNarrow: the toolbar name and text, the checkbox states', state: 'passed' },
        { name: 'SelectAll: twelve aria-selected rows, then none', state: 'passed' },
        { name: 'ArchiveConfirm, ArchiveCancelled: the question, focus on Cancel, Escape back to Archive', state: 'passed' },
        { name: 'Archived: rows gone, the status line, focus on select-all', state: 'passed' },
        { name: 'Exported: the status line, the selection kept', state: 'passed' },
      ],
    },
    correction: '',
  },
];

export const bulkActionsWithoutRules: Change = {
  id: 'rv-2042',
  title: 'Add bulk actions to the customer table (control run: without the rules)',
  repo: 'relay/web',
  branch: 'agent/bulk-actions-no-rules',
  base: 'main',
  commit: 'b643e08',
  agent: { name: 'Claude Code', run: 'run 2, without the rules' },
  requester: dana,
  openedAt: '2026-10-01T12:05:00-05:00',
  state: 'needs-review',
  componentsTouched: ['CustomerTable', 'Checkbox', 'Toolbar', 'Button'],
  files: [
    { path: 'src/product/customers/CustomerTable.tsx', status: 'modified', additions: 174, deletions: 20, shared: false },
    { path: 'src/product/customers/CustomerTable.stories.tsx', status: 'modified', additions: 154, deletions: 4, shared: false },
    { path: 'src/product/customers/CustomerTable.css', status: 'modified', additions: 22, deletions: 0, shared: false },
    { path: 'src/product/customers/exportCsv.ts', status: 'added', additions: 35, deletions: 0, shared: false },
    { path: 'CHANGE.md', status: 'added', additions: 129, deletions: 0, shared: false },
  ],
  validation: {
    visual: { state: 'changed', label: '4 changes', count: 4 },
    accessibility: { state: 'passed', label: 'Passed', count: 0 },
    interaction: { state: 'passed', label: 'Passed', count: 0 },
    components: { state: 'changed', label: '1 state unhandled', count: 1 },
    tokens: { state: 'passed', label: 'Passed', count: 0 },
  },
  findings: run2Findings,
  stories: [
    story('product-customertable--selected', 'Product/CustomerTable', 'Selected', true),
    story('product-customertable--allselected', 'Product/CustomerTable', 'AllSelected', true),
    story('product-customertable--selectednarrow', 'Product/CustomerTable', 'SelectedNarrow', true),
    story('product-customertable--selectall', 'Product/CustomerTable', 'SelectAll', true),
    story('product-customertable--archiveconfirm', 'Product/CustomerTable', 'ArchiveConfirm', true),
    story('product-customertable--archivecancelled', 'Product/CustomerTable', 'ArchiveCancelled', true),
    story('product-customertable--archived', 'Product/CustomerTable', 'Archived', true),
    story('product-customertable--exported', 'Product/CustomerTable', 'Exported', true),
  ],
  diff: [
    {
      file: 'src/product/customers/CustomerTable.css',
      header: '@@ -14,3 +14,25 @@',
      lines: [
        { kind: 'context', text: '  font-variant-numeric: tabular-nums;' },
        { kind: 'context', text: '}' },
        { kind: 'add', text: '' },
        { kind: 'add', text: '/* The selection count sits on the accent ground, where the full ink is' },
        { kind: 'add', text: '   the one that clears 4.5:1; muted does not. */' },
        { kind: 'add', text: '.customers__selected {' },
        { kind: 'add', text: '  color: var(--color-text);' },
        { kind: 'add', text: '  font-variant-numeric: tabular-nums;' },
        { kind: 'add', text: '}' },
        { kind: 'add', text: '' },
        { kind: 'add', text: '/* The status line: the live region is always in the tree and has no box' },
        { kind: 'add', text: '   of its own; the text inside it carries the row. */' },
        { kind: 'add', text: '.customers__status-text {' },
        { kind: 'add', text: '  padding: var(--space-2) var(--space-3);' },
        { kind: 'add', text: '  border-bottom: var(--border-width) solid var(--color-border);' },
        { kind: 'add', text: '  background: var(--color-surface-sunken);' },
        { kind: 'add', text: '  color: var(--color-text-secondary);' },
        { kind: 'add', text: '}' },
      ],
    },
  ],
  rationale: {
    request:
      'Add bulk actions to the customer table using the existing component system. A person should be able to select several customers and archive or export them.',
    summary:
      'Every row has a Checkbox in a control column and the head has Select all. Selecting a row swaps the title toolbar for the system’s accent Toolbar in the same slot: “3 selected”, then Archive, Export and Clear selection. Archive asks first, in that same slot, with Cancel and a danger button that repeats the number. Export writes the selected rows to customers.csv and keeps the selection.',
    decisions: [
      'Swap the toolbar in place rather than add a second bar. A bar that appears under the toolbar pushes every row down the moment a box is ticked.',
      'The archive question is inline, not a dialog. The system has no Dialog (a scrim token and nothing else).',
      'Full ink for the selection count. The tokens promise muted ink clears 4.5:1 on the four grounds; the accent ground is not one of them.',
      'The status line is a live region that is always in the tree, so a status that arrives is announced rather than inserted silently.',
      'Archiving is for the session only. There is no Archived view and no undo; the question is the one guard. Both are listed as not done.',
    ],
    reported: {
      reused: ['Checkbox', 'HeaderCell control', 'Cell control', 'Row selected', 'Toolbar', 'Button', 'Table', 'Badge', 'IconButton'],
      changed: [],
      newStates: ['Selected', 'AllSelected', 'SelectedNarrow', 'SelectAll', 'ArchiveConfirm', 'ArchiveCancelled', 'Archived', 'Exported'],
      newPatterns: 'Not stated as such: the toolbar swap and the inline question are described under Decisions.',
    },
  },
};

/* ------------------------------------------------------------------------
   The seeded drift. Not an agent's run: the four drifts the workflow
   exists to catch, written by hand into Run 1's screen on
   agent/bulk-actions-drift and labelled as such wherever it appears. The
   figures are what the checks reported on that branch.
   ------------------------------------------------------------------------ */

const driftFindings: Finding[] = [
  {
    id: 'f3-contrast',
    kind: 'accessibility',
    severity: 'blocking',
    title: 'The selection count does not meet contrast',
    summary:
      'The count in the new bar is a muted ink on the accent ground, and the ink is a literal rather than a token. It measures 2.87:1; text this size needs 4.5:1. The Selected story reached it, so axe reached it.',
    rules: [11, 2],
    evidence: {
      kind: 'accessibility',
      rule: 'color-contrast',
      impact: 'serious',
      element: '.bulk-bar__count',
      measured: '2.87:1',
      required: '4.5:1',
      message:
        'Element has insufficient color contrast of 2.87 (foreground color: #7a8db8, background color: #e9effc, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1',
    },
    reproduce: { screen: 'customers', side: 'after', viewport: 1280, withSelection: true, target: 'bulk-count' },
    correction:
      'Use `--color-text` or `--color-text-secondary` for the selection count; both clear 4.5:1 on `--color-accent-subtle`. Do not introduce an ink the token layer does not have.',
  },
  {
    id: 'f3-local-button',
    kind: 'component',
    severity: 'decision',
    title: 'A local button treatment instead of Button',
    summary:
      'The bar’s actions are a <button class="bulk-bar__btn"> with its own padding, border, radius and colors. Button / secondary / compact already covers this use, and the danger and ghost variants cover the other two.',
    rules: [1, 10],
    evidence: {
      kind: 'component',
      wrote: {
        file: 'src/product/customers/CustomerTable.tsx',
        excerpt: '<button type="button" className="bulk-bar__btn bulk-bar__btn--danger" onClick={() => setConfirming(true)}>\n  Archive selected\n</button>',
      },
      existing: {
        component: 'Button',
        variant: 'danger',
        props: 'size="compact"',
        story: story('system-button--compact', 'System/Button', 'Compact'),
      },
      recommendation: 'Existing Button / danger / compact already covers this use case: 24px high, the system’s border and focus ring, and the hover and disabled states the local class does not have.',
    },
    reproduce: { screen: 'customers', side: 'after', viewport: 1280, withSelection: true, target: 'bulk-archive' },
    correction:
      'Replace the local `.bulk-bar__btn` with `<Button variant="danger" size="compact">` for Archive, `<Button variant="secondary" size="compact">` for Export and Change owner, and `<Button variant="ghost" size="compact">` for Clear selection. Delete BulkActionBar.css.',
  },
  {
    id: 'f3-tokens',
    kind: 'token',
    severity: 'decision',
    title: 'Seventeen values off the token layer',
    summary:
      'The lint reports every literal in BulkActionBar.css and the one in Button.css: a padding the scale does not produce, five colors that have tokens, a radius, a font size, two weights. The first is the one to read.',
    rules: [2],
    evidence: {
      kind: 'token',
      file: 'src/product/customers/BulkActionBar.css',
      line: 22,
      property: 'padding',
      literal: '10px 14px',
      tokens: [
        { name: '--space-2', value: '8px' },
        { name: '--space-3', value: '12px' },
      ],
      nearest: { below: '--space-2', above: '--space-3' },
    },
    reproduce: { screen: 'customers', side: 'after', viewport: 1280, withSelection: true, target: 'bulk-bar' },
    correction: 'Do not introduce local values; every one of the seventeen has a token, and most go away with the Button.',
  },
  {
    id: 'f3-overflow',
    kind: 'visual',
    severity: 'decision',
    title: 'The bar overflows at 768',
    summary:
      'The bar is a single flex line that does not wrap. At a tablet width the count and four actions run past its edge and the section clips them. The Toolbar component wraps; the local bar does not, and no Narrow story was added, so only the review’s own 768 check saw it.',
    rules: [7, 3],
    evidence: {
      kind: 'visual',
      story: story('product-customertable--narrow', 'Product/CustomerTable', 'Narrow'),
      diffPixels: 0,
      diffPercent: 0,
      expected: false,
      where: 'The right end of the bar: the last actions are cut off by the section’s edge.',
    },
    reproduce: { screen: 'customers', side: 'after', viewport: 768, withSelection: true, target: 'bulk-bar' },
    correction: 'Build the bar on `<Toolbar tone="accent">`, which wraps its actions under the count at narrow widths, and add a Narrow story with the selection up.',
  },
  {
    id: 'f3-shared-button',
    kind: 'shared',
    severity: 'blocking',
    title: 'Shared Button padding changed; the Invoices screen moved',
    summary:
      'Button.css now pads compact buttons 0 10px instead of the token, so the bar’s local buttons line up with the toolbar’s. Every compact Button in Relay is 4px wider: the Invoices toolbar changed in a change that never mentioned it.',
    rules: [9, 2],
    evidence: {
      kind: 'shared',
      file: 'src/components/Button/Button.css',
      lines: 1,
      reason: 'Adjusted the compact Button padding by 2px so the table toolbar’s buttons align with the bar’s.',
      measured: 'Filter, Export and New invoice on the Invoices screen each 4px wider; the Add customer button likewise.',
      consumers: [story('product-invoicelist--default', 'Product/InvoiceList', 'Default'), story('system-button--compact', 'System/Button', 'Compact')],
    },
    reproduce: { screen: 'invoices', side: 'after', viewport: 1280, target: 'invoice-actions' },
    correction: 'Revert the change to `src/components/Button/Button.css`. The bar’s alignment comes from using Button, not from changing it.',
  },
  {
    id: 'f3-states',
    kind: 'state',
    severity: 'note',
    title: 'One story for five new states',
    summary:
      'Selected has a story; the archive question, the archived table, the export, and the bar at 768 do not. Axe reached the one and found the contrast failure; it could not reach the others.',
    rules: [3],
    evidence: {
      kind: 'state',
      component: 'CustomerTable',
      state: 'archive question; archived; exported; selected at 768',
      hasStory: false,
      reachedBy: 'Pressing Archive selected; confirming; pressing Export; a 768 frame with rows selected.',
    },
    reproduce: { screen: 'customers', side: 'after', viewport: 768, withSelection: true },
    correction: 'Add stories with play functions for the archive question, the archived table and the export, and a Narrow story with the selection up.',
  },
];

export const bulkActionsDrift: Change = {
  id: 'rv-2043',
  title: 'Add bulk actions to the customer table (seeded drift: the four things the checks exist for)',
  repo: 'relay/web',
  branch: 'agent/bulk-actions-drift',
  base: 'main',
  commit: '62578ab',
  agent: { name: 'By hand', run: 'seeded, not an agent’s run' },
  requester: dana,
  openedAt: '2026-10-01T12:40:00-05:00',
  state: 'needs-review',
  componentsTouched: ['CustomerTable', 'Checkbox', 'Button'],
  files: [
    { path: 'src/product/customers/CustomerTable.tsx', status: 'modified', additions: 203, deletions: 15, shared: false },
    { path: 'src/product/customers/BulkActionBar.css', status: 'added', additions: 46, deletions: 0, shared: false },
    { path: 'src/product/customers/CustomerTable.stories.tsx', status: 'modified', additions: 4, deletions: 0, shared: false },
    { path: 'src/product/customers/customers.ts', status: 'modified', additions: 25, deletions: 0, shared: false },
    { path: 'src/components/Button/Button.css', status: 'modified', additions: 1, deletions: 1, shared: true },
    { path: 'CHANGE.md', status: 'added', additions: 8, deletions: 0, shared: false },
  ],
  validation: {
    visual: { state: 'changed', label: '4 changes', count: 4 },
    accessibility: { state: 'failed', label: '1 regression', count: 1 },
    interaction: { state: 'passed', label: 'Passed', count: 0 },
    components: { state: 'changed', label: '1 shared change', count: 1 },
    tokens: { state: 'failed', label: '17 off the layer', count: 17 },
  },
  findings: driftFindings,
  stories: [story('product-customertable--selected', 'Product/CustomerTable', 'Selected', true), story('product-invoicelist--default', 'Product/InvoiceList', 'Default')],
  diff: [
    {
      file: 'src/components/Button/Button.css',
      header: '@@ -22,7 +22,7 @@ .btn--compact {',
      lines: [
        { kind: 'context', text: '.btn--compact {' },
        { kind: 'context', text: '  height: var(--control-height-compact);' },
        { kind: 'remove', text: '  padding: 0 var(--control-padding-x-compact);', findingId: 'f3-shared-button' },
        { kind: 'add', text: '  padding: 0 10px;', findingId: 'f3-shared-button' },
        { kind: 'context', text: '  font-size: var(--text-sm);' },
        { kind: 'context', text: '}' },
      ],
    },
    {
      file: 'src/product/customers/BulkActionBar.css',
      header: '@@ -0,0 +1,46 @@',
      lines: [
        { kind: 'add', text: '.bulk-bar {' },
        { kind: 'add', text: '  display: flex;', findingId: 'f3-overflow' },
        { kind: 'add', text: '  align-items: center;' },
        { kind: 'add', text: '  gap: 12px;', findingId: 'f3-tokens' },
        { kind: 'add', text: '  padding: 8px 12px;', findingId: 'f3-tokens' },
        { kind: 'add', text: '  background: var(--color-accent-subtle);' },
        { kind: 'add', text: '  white-space: nowrap;', findingId: 'f3-overflow' },
        { kind: 'add', text: '}' },
        { kind: 'add', text: '.bulk-bar__count {' },
        { kind: 'add', text: '  color: #7a8db8;', findingId: 'f3-contrast' },
        { kind: 'add', text: '}' },
        { kind: 'add', text: '.bulk-bar__btn {', findingId: 'f3-local-button' },
        { kind: 'add', text: '  padding: 10px 14px;', findingId: 'f3-tokens' },
        { kind: 'add', text: '  border: 1px solid #d0d0d0;', findingId: 'f3-tokens' },
        { kind: 'add', text: '  border-radius: 4px;', findingId: 'f3-tokens' },
        { kind: 'add', text: '  background: #fff;', findingId: 'f3-tokens' },
        { kind: 'add', text: '  font-size: 13px;', findingId: 'f3-tokens' },
        { kind: 'add', text: '}' },
      ],
    },
  ],
  rationale: {
    request:
      'Add bulk actions to the customer table using the existing component system. A person should be able to select several customers and archive or export them.',
    summary:
      'Added a selection column to the customer table with a select-all checkbox in the header, and a bulk-action bar that appears above the table when at least one row is selected. The bar shows the count and offers Archive selected, Export selected as CSV, Change owner and Clear selection. Archive asks first.',
    decisions: [
      'Used the existing Checkbox component for the row and header boxes.',
      'Created a lightweight bar with its own buttons, since the Toolbar component is for a region’s standing controls and the existing Button’s default height was too tall for the bar.',
      'Adjusted the compact Button padding by 2px so the table toolbar’s buttons align with the bar’s.',
      'Added a Selected story.',
    ],
    reported: { reused: ['Checkbox'], changed: ['Button (compact padding)'], newStates: ['Selected'], newPatterns: 'none stated' },
  },
};

export const queue: Change[] = [
  bulkActionsWithRules,
  bulkActionsWithoutRules,
  bulkActionsDrift,
  {
    id: 'rv-2040',
    sample: true,
    title: 'Empty state for the invoices list',
    repo: 'relay/web',
    branch: 'agent/invoices-empty-state',
    base: 'main',
    commit: 'b91d0f3',
    agent: { name: 'Claude Code', run: 'run_01K6LZ' },
    requester: tomas,
    openedAt: '2026-10-01T13:40:00-05:00',
    state: 'ready',
    componentsTouched: ['InvoiceList', 'EmptyState'],
    files: [{ path: 'src/product/invoices/InvoiceList.tsx', status: 'modified', additions: 12, deletions: 2, shared: false }],
    validation: {
      visual: { state: 'changed', label: '1 change', count: 1 },
      accessibility: { state: 'passed', label: 'Passed', count: 0 },
      interaction: { state: 'passed', label: 'Passed', count: 0 },
      components: { state: 'passed', label: 'No new states', count: 0 },
      tokens: { state: 'passed', label: 'Passed', count: 0 },
    },
    findings: [],
    stories: [story('product-invoicelist--empty', 'Product/InvoiceList', 'Empty', true)],
    diff: [],
    rationale: {
      request: 'Show an empty state when there are no invoices.',
      summary: 'Rendered EmptyState below the table head when the list is empty, with a New invoice action.',
      decisions: ['Reused EmptyState with the inbox icon and the existing New invoice handler.'],
      reported: { reused: ['EmptyState', 'Button'], changed: [], newStates: [], newPatterns: 'none' },
    },
  },
  {
    id: 'rv-2038',
    sample: true,
    title: 'Fix date formatting in the activity feed',
    repo: 'relay/web',
    branch: 'agent/activity-dates',
    base: 'main',
    commit: '3e7a9c1',
    agent: { name: 'Claude Code', run: 'run_01K6LQ' },
    requester: priya,
    openedAt: '2026-10-01T12:55:00-05:00',
    state: 'validating',
    componentsTouched: ['ActivityFeed'],
    files: [{ path: 'src/product/activity/ActivityFeed.tsx', status: 'modified', additions: 6, deletions: 4, shared: false }],
    validation: {
      visual: { state: 'running', label: 'Running', count: 0 },
      accessibility: { state: 'running', label: 'Running', count: 0 },
      interaction: { state: 'passed', label: 'Passed', count: 0 },
      components: { state: 'running', label: 'Running', count: 0 },
      tokens: { state: 'passed', label: 'Passed', count: 0 },
    },
    findings: [],
    stories: [],
    diff: [],
    rationale: {
      request: 'Relative dates in the activity feed should say "Yesterday" rather than "1 day ago".',
      summary: 'Changed the formatter’s one-day case.',
      decisions: [],
      reported: { reused: [], changed: [], newStates: [], newPatterns: 'none' },
    },
  },
  {
    id: 'rv-2036',
    sample: true,
    title: 'Keyboard shortcuts for the inbox',
    repo: 'relay/web',
    branch: 'agent/inbox-shortcuts',
    base: 'main',
    commit: 'f04c2d8',
    agent: { name: 'Claude Code', run: 'run_01K6KT' },
    requester: tomas,
    openedAt: '2026-09-30T16:20:00-05:00',
    state: 'returned',
    componentsTouched: ['Inbox', 'Kbd'],
    files: [
      { path: 'src/product/inbox/Inbox.tsx', status: 'modified', additions: 44, deletions: 3, shared: false },
      { path: 'src/components/Kbd/Kbd.tsx', status: 'added', additions: 18, deletions: 0, shared: true },
    ],
    validation: {
      visual: { state: 'changed', label: '2 changes', count: 2 },
      accessibility: { state: 'passed', label: 'Passed', count: 0 },
      interaction: { state: 'passed', label: 'Passed', count: 0 },
      components: { state: 'changed', label: '1 new component', count: 1 },
      tokens: { state: 'passed', label: 'Passed', count: 0 },
    },
    findings: [],
    stories: [story('system-kbd--default', 'System/Kbd', 'Default', true)],
    diff: [],
    rationale: {
      request: 'Add j/k to move through the inbox and e to archive.',
      summary: 'Added a key handler on the inbox list and a Kbd component to show the keys in the row’s hover hint.',
      decisions: ['Introduced Kbd because no component renders a key cap.'],
      reported: { reused: [], changed: [], newStates: ['Inbox: row focused by key'], newPatterns: 'Single-key shortcuts on a list' },
    },
    decision: {
      action: 'return',
      by: dana,
      at: '2026-09-30T17:05:00-05:00',
      message: 'Single-key shortcuts are a new pattern (rule 12). Keep the Kbd component; show the shortcuts in a visible legend rather than a hover hint, and add a story for the focused row.',
    },
  },
  {
    id: 'rv-2033',
    sample: true,
    title: 'Rename "Archive" to "Close account" in the customer menu',
    repo: 'relay/web',
    branch: 'agent/close-account-copy',
    base: 'main',
    commit: 'a1c77e0',
    agent: { name: 'Claude Code', run: 'run_01K6K2' },
    requester: priya,
    openedAt: '2026-09-30T11:02:00-05:00',
    state: 'accepted',
    componentsTouched: ['CustomerMenu'],
    files: [{ path: 'src/product/customers/CustomerMenu.tsx', status: 'modified', additions: 2, deletions: 2, shared: false }],
    validation: {
      visual: { state: 'changed', label: '1 change', count: 1 },
      accessibility: { state: 'passed', label: 'Passed', count: 0 },
      interaction: { state: 'passed', label: 'Passed', count: 0 },
      components: { state: 'passed', label: 'No new states', count: 0 },
      tokens: { state: 'passed', label: 'Passed', count: 0 },
    },
    findings: [],
    stories: [],
    diff: [],
    rationale: {
      request: 'Rename the Archive action to Close account.',
      summary: 'Renamed the menu item and its confirmation title.',
      decisions: [],
      reported: { reused: [], changed: [], newStates: [], newPatterns: 'none' },
    },
    decision: { action: 'accept', by: priya, at: '2026-09-30T11:30:00-05:00' },
  },
  {
    id: 'rv-2029',
    sample: true,
    title: 'Add a density toggle to data tables',
    repo: 'relay/web',
    branch: 'agent/table-density',
    base: 'main',
    commit: '58de91b',
    agent: { name: 'Claude Code', run: 'run_01K6J8' },
    requester: tomas,
    openedAt: '2026-09-29T15:48:00-05:00',
    state: 'rejected',
    componentsTouched: ['Table', 'CustomerTable', 'InvoiceList'],
    files: [
      { path: 'src/components/Table/Table.tsx', status: 'modified', additions: 31, deletions: 9, shared: true },
      { path: 'src/components/Table/Table.css', status: 'modified', additions: 14, deletions: 4, shared: true },
    ],
    validation: {
      visual: { state: 'changed', label: '6 changes', count: 6 },
      accessibility: { state: 'failed', label: '2 regressions', count: 2 },
      interaction: { state: 'failed', label: '1 failure', count: 1 },
      components: { state: 'changed', label: '1 new state', count: 1 },
      tokens: { state: 'passed', label: 'Passed', count: 0 },
    },
    findings: [],
    stories: [],
    diff: [],
    rationale: {
      request: 'Let a person switch any table between default and compact density.',
      summary: 'Moved density into Table as state with a toggle in the caption row.',
      decisions: ['Put the toggle inside Table so every table gets it.'],
      reported: { reused: ['SegmentedControl'], changed: ['Table'], newStates: ['Table: density toggled'], newPatterns: 'none' },
    },
    decision: {
      action: 'reject',
      by: dana,
      at: '2026-09-29T16:40:00-05:00',
      message: 'Density is the screen’s decision, not the Table’s (the Table already takes it as a prop). Two tables lost their caption to the toggle. Closing this; the request needs a design first.',
    },
  },
];

export function findChange(id: string): Change | undefined {
  return queue.find((c) => c.id === id);
}
