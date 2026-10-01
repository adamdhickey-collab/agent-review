import type { Change, Finding } from './types';

/* The review queue and the one change the product is built around. The
   bulk-actions change is filled from the experiment in docs/experiment/:
   the file list, the diff excerpts, the findings and the validation
   figures are what the branch and the checks produced, transcribed. Where
   a figure is invented this file says so beside it. The other five
   changes exist so the queue is a queue, and are invented throughout.

   PROVISIONAL until the experiment runs; see docs/experiment/README.md. */

const dana = { name: 'Dana Whitfield', role: 'Product design' };
const tomas = { name: 'Tomas Reyes', role: 'Engineering' };
const priya = { name: 'Priya Natarajan', role: 'Product' };

const story = (id: string, title: string, name: string, isNew?: boolean) => ({ id, title, name, isNew });

const bulkFindings: Finding[] = [
  {
    id: 'f-contrast',
    kind: 'accessibility',
    severity: 'blocking',
    title: 'The selection count does not meet contrast',
    summary:
      'The "3 selected" label in the new bulk-action bar is a muted ink on the accent ground. It measures 3.38:1; text this size needs 4.5:1.',
    rules: [11, 2],
    evidence: {
      kind: 'accessibility',
      rule: 'color-contrast',
      impact: 'serious',
      element: '.bulk-bar__count',
      measured: '3.38:1',
      required: '4.5:1',
      message: 'Element has insufficient color contrast of 3.38 (foreground color: #7a8db8, background color: #e9effc, font size: 9.8pt (13px), font weight: normal). Expected contrast ratio of 4.5:1',
    },
    reproduce: { screen: 'customers', side: 'after', viewport: 1280, target: 'bulk-count', withSelection: true },
    correction:
      'Use `--color-text` or `--color-text-secondary` for the selection count in the bulk-action bar; both clear 4.5:1 on `--color-accent-subtle`. Do not introduce a new ink.',
  },
  {
    id: 'f-local-button',
    kind: 'component',
    severity: 'decision',
    title: 'A local button treatment instead of Button',
    summary:
      'The bar’s three actions are a <button class="bulk-bar__btn"> with its own padding, border and radius. Button / secondary / compact already covers this use.',
    rules: [1, 10],
    evidence: {
      kind: 'component',
      wrote: {
        file: 'src/product/customers/BulkActionBar.tsx',
        excerpt: '<button type="button" className="bulk-bar__btn" onClick={onArchive}>\n  Archive\n</button>',
      },
      existing: {
        component: 'Button',
        variant: 'secondary',
        props: 'size="compact"',
        story: story('system-button--compact', 'System/Button', 'Compact'),
      },
      recommendation: 'Existing Button / secondary / compact already covers this use case: 24px high, 8px horizontal padding, the system border and focus ring.',
    },
    reproduce: { screen: 'customers', side: 'after', viewport: 1280, target: 'bulk-actions', withSelection: true },
    correction:
      'Replace the local `.bulk-bar__btn` with `<Button variant="secondary" size="compact">` for Archive and Export, and `<Button variant="ghost" size="compact">` for Clear selection. Delete the local styles.',
  },
  {
    id: 'f-padding-literal',
    kind: 'token',
    severity: 'decision',
    title: 'padding: 10px 14px is not on the spacing scale',
    summary: 'The local button declares a padding no token produces. The scale has 8 and 12; the Button component already uses them.',
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
    reproduce: { screen: 'customers', side: 'after', viewport: 1280, target: 'bulk-actions', withSelection: true },
    correction: 'Do not introduce a local padding value. If the Button is used (above), this goes away with the local styles.',
  },
  {
    id: 'f-overflow',
    kind: 'visual',
    severity: 'decision',
    title: 'The bulk-action bar overflows at 768',
    summary:
      'At a tablet width the bar’s count and three actions do not fit on one line and run past the table’s edge. The baseline toolbar wraps; the new bar does not.',
    rules: [7, 3],
    evidence: {
      kind: 'visual',
      story: story('product-customertable--narrow', 'Product/CustomerTable', 'Narrow'),
      diffPixels: 18_204, // provisional: replaced by the measured figure
      diffPercent: 2.6,
      expected: false,
      where: 'The right edge of the toolbar region, from the selection count to the last action.',
    },
    reproduce: { screen: 'customers', side: 'after', viewport: 768, target: 'bulk-bar', withSelection: true },
    correction:
      'Build the bar on `<Toolbar tone="accent">`, which wraps its actions under the count at narrow widths. Add a `Narrow` story for the selected state so the width is covered.',
  },
  {
    id: 'f-shared-padding',
    kind: 'visual',
    severity: 'blocking',
    title: 'Shared Button padding changed; two other screens moved',
    summary:
      'Button.css now pads compact buttons 0 10px instead of 0 8px so they line up in the new bar. The Invoices toolbar and the Review queue changed with it.',
    rules: [9],
    evidence: {
      kind: 'visual',
      story: story('product-invoicelist--default', 'Product/InvoiceList', 'Default'),
      diffPixels: 1_112, // provisional
      diffPercent: 0.4,
      expected: false,
      where: 'Every compact Button: Filter, Export and New invoice are each 4px wider.',
    },
    reproduce: { screen: 'invoices', side: 'after', viewport: 1280, target: 'invoice-actions' },
    correction:
      'Revert the change to `src/components/Button/Button.css`. The bar’s alignment comes from using Button, not from changing it.',
  },
  {
    id: 'f-new-states',
    kind: 'state',
    severity: 'note',
    title: 'Two new states have no stories',
    summary:
      'The customer table now has a selected-rows state and a select-all (indeterminate) state. Neither has a story, so neither is in the baseline or the a11y run.',
    rules: [3],
    evidence: {
      kind: 'state',
      component: 'CustomerTable',
      state: 'rows selected; all rows selected (indeterminate header)',
      hasStory: false,
      reachedBy: 'Checking a row checkbox; checking the header checkbox.',
    },
    reproduce: { screen: 'customers', side: 'after', viewport: 1280, withSelection: true },
    correction: 'Add `SomeSelected` and `AllSelected` stories to CustomerTable.stories.tsx, with a play function that checks the boxes, so both states run through axe and get a baseline.',
  },
  {
    id: 'f-interaction',
    kind: 'interaction',
    severity: 'note',
    title: 'Interaction tests passed',
    summary: 'Select one, select all, clear selection: all three pass. The behaviour is right; the findings above are about how it is built.',
    rules: [],
    evidence: {
      kind: 'interaction',
      tests: [
        { name: 'selects a row and shows the bar', state: 'passed', ms: 412 },
        { name: 'select all checks every row', state: 'passed', ms: 388 },
        { name: 'clear selection hides the bar', state: 'passed', ms: 301 },
      ],
    },
    correction: '',
  },
];

export const bulkActions: Change = {
  id: 'rv-2041',
  title: 'Add bulk actions to the customer table',
  repo: 'relay/web',
  branch: 'agent/bulk-actions-customers',
  base: 'main',
  commit: '7c2e41a',
  agent: { name: 'Claude Code', run: 'run_01K6M3' },
  requester: dana,
  openedAt: '2026-10-01T14:12:00-05:00',
  state: 'needs-review',
  componentsTouched: ['Button', 'Checkbox', 'CustomerTable', 'BulkActionBar'],
  files: [
    { path: 'src/product/customers/CustomerTable.tsx', status: 'modified', additions: 58, deletions: 6, shared: false },
    { path: 'src/product/customers/BulkActionBar.tsx', status: 'added', additions: 41, deletions: 0, shared: false },
    { path: 'src/product/customers/BulkActionBar.css', status: 'added', additions: 38, deletions: 0, shared: false },
    { path: 'src/components/Button/Button.css', status: 'modified', additions: 1, deletions: 1, shared: true },
  ],
  validation: {
    visual: { state: 'changed', label: '3 changes', count: 3 },
    accessibility: { state: 'failed', label: '1 regression', count: 1 },
    interaction: { state: 'passed', label: 'Passed', count: 0 },
    components: { state: 'changed', label: '2 new states', count: 2 },
    tokens: { state: 'changed', label: '1 deviation', count: 1 },
  },
  findings: bulkFindings,
  stories: [
    story('product-customertable--default', 'Product/CustomerTable', 'Default'),
    story('product-customertable--narrow', 'Product/CustomerTable', 'Narrow'),
    story('product-customertable--compact', 'Product/CustomerTable', 'Compact'),
    story('product-invoicelist--default', 'Product/InvoiceList', 'Default'),
  ],
  diff: [
    {
      file: 'src/components/Button/Button.css',
      header: '@@ -22,7 +22,7 @@ .btn--compact {',
      lines: [
        { kind: 'context', text: '.btn--compact {' },
        { kind: 'context', text: '  height: var(--control-height-compact);' },
        { kind: 'remove', text: '  padding: 0 var(--control-padding-x-compact);', findingId: 'f-shared-padding' },
        { kind: 'add', text: '  padding: 0 10px;', findingId: 'f-shared-padding' },
        { kind: 'context', text: '  font-size: var(--text-sm);' },
        { kind: 'context', text: '}' },
      ],
    },
    {
      file: 'src/product/customers/BulkActionBar.css',
      header: '@@ -0,0 +1,38 @@',
      lines: [
        { kind: 'add', text: '.bulk-bar {' },
        { kind: 'add', text: '  display: flex;' },
        { kind: 'add', text: '  align-items: center;' },
        { kind: 'add', text: '  gap: var(--space-3);' },
        { kind: 'add', text: '  padding: var(--space-2) var(--space-3);' },
        { kind: 'add', text: '  background: var(--color-accent-subtle);' },
        { kind: 'add', text: '}' },
        { kind: 'add', text: '.bulk-bar__count {' },
        { kind: 'add', text: '  color: #7a8db8;', findingId: 'f-contrast' },
        { kind: 'add', text: '}' },
        { kind: 'add', text: '.bulk-bar__btn {' },
        { kind: 'add', text: '  padding: 10px 14px;', findingId: 'f-padding-literal' },
        { kind: 'add', text: '  border: 1px solid var(--color-border-control);', findingId: 'f-local-button' },
        { kind: 'add', text: '  border-radius: 4px;', findingId: 'f-local-button' },
        { kind: 'add', text: '  background: var(--color-surface);' },
        { kind: 'add', text: '}' },
      ],
    },
  ],
  rationale: {
    request: 'Add bulk actions to the customer table using the existing component system. A person should be able to select several customers and archive or export them.',
    summary:
      'I added a selection column to the customer table with a select-all checkbox in the header, and a bulk-action bar that appears above the table when at least one row is selected. The bar shows the count and offers Archive, Export and Clear selection.',
    decisions: [
      'Used the existing Checkbox component for the row and header boxes, with `indeterminate` on the header when some rows are selected.',
      'Created a BulkActionBar component for the bar, since the Toolbar component is for a region’s standing controls and this bar is conditional.',
      'Styled the bar’s buttons locally so they sit at a lower height than the default Button and read as secondary to the table’s own toolbar.',
      'Adjusted the compact Button padding by 2px so the table toolbar’s buttons align with the bar’s.',
    ],
    reported: {
      reused: ['Checkbox', 'Row (selected)', 'Table'],
      changed: ['Button (compact padding)'],
      newStates: ['CustomerTable: rows selected', 'CustomerTable: all selected'],
      newPatterns: 'none',
    },
  },
};

export const queue: Change[] = [
  bulkActions,
  {
    id: 'rv-2040',
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
