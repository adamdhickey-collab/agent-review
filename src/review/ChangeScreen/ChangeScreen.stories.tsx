import type { Meta, StoryObj } from '@storybook/react-vite';
import { StoreProvider } from '../../app/store';
import { ChangeScreen } from './ChangeScreen';

const meta = {
  title: 'Review/ChangeScreen',
  component: ChangeScreen,
  args: { id: 'rv-2041' },
  decorators: [
    (Story) => (
      <StoreProvider>
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Story />
        </div>
      </StoreProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    a11y: {
      test: 'error',
      /* The preview frame renders the product at a width and scales it to fit
         the column, so Relay's 24px controls are measured here at 18px or
         less. They are checked at their real size in their own stories; the
         rest of this screen is checked at its real size in its components'
         stories (DiffViewer, DecisionBar, FindingList). */
      options: { rules: { 'target-size': { enabled: false } } },
    },
    docs: {
      description: {
        component:
          'The review of one change. The header carries the change and the decision bar; the validation summary is one line under it; then two columns. On the left, the findings are the spine, in tabs with the files, the stories and the agent’s rationale behind them. On the right is the evidence: the preview, which follows the selected finding into the state that shows it, and the diff, which marks the finding’s lines. Selecting a finding is a route, so a URL names a finding and the back button works. The screen owns the store, the lane filter, the tab and the set of findings to return; everything it renders is a component that owns only its markup and states. A change the store does not have gets an EmptyState with the way back to the queue.',
      },
    },
  },
} satisfies Meta<typeof ChangeScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: { description: { story: 'The bulk-actions change: seven findings, two blocking, Accept refused with the reason beside it, the customers screen in the preview at 1280.' } },
  },
};

export const WithFindingOpen: Story = {
  args: { findingId: 'f1-new-pattern' },
  parameters: {
    docs: { description: { story: 'The overflow finding selected: it is open in the list, the preview has moved to 768 with rows selected, the status line says what is showing, and the diff is as it was, since that finding points at no line.' } },
  },
};

export const Clean: Story = {
  args: { id: 'rv-2040' },
  parameters: {
    docs: { description: { story: 'The invoices empty-state change: no findings, so the list is an EmptyState and Accept is enabled. The preview shows the invoices screen the change is about.' } },
  },
};

export const NotFound: Story = {
  args: { id: 'rv-0000' },
  parameters: {
    docs: { description: { story: 'An id the store does not have, from a stale link. An EmptyState names the id and offers the queue.' } },
  },
};

export const Decided: Story = {
  args: { id: 'rv-2033' },
  parameters: {
    docs: { description: { story: 'An accepted change. The decision bar is a record rather than three buttons, and the rest of the review is still there to read.' } },
  },
};

export const Dark: Story = {
  ...WithFindingOpen,
  globals: { theme: 'dark' },
  parameters: {
    ...WithFindingOpen.parameters,
    docs: { description: { story: 'A change in the dark theme. The review around the preview is dark; the product inside the frame is not, because the frame is the product’s surface and that surface is always light: the reviewer sees Relay as the checks measured it, whatever the review is wearing.' } },
  },
};
