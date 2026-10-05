import type { Meta, StoryObj } from '@storybook/react-vite';
import { Disclosure } from './Disclosure';

const meta = {
  title: 'System/Disclosure',
  component: Disclosure,
  args: {
    summary: 'Why the toolbar is a Toolbar',
    children:
      'A row of controls written inline overflows at 768. The Toolbar wraps its actions under its title instead, and gives the group a role and a name so a screen reader knows the controls belong together.',
  },
  parameters: {
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'A native details and summary, styled. The browser does the open state, the keyboard and the screen reader; the chevron turns from CSS. It is for a block of explanation a reader may not need, such as a finding\'s rationale under its one-line summary. There is no custom accordion in the system because this one has nothing to get wrong. Meta is a short annotation beside the summary, a count or a status, that a reader can see without opening it.',
      },
    },
  },
} satisfies Meta<typeof Disclosure>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};

export const Open: Story = {
  args: { open: true },
};

export const WithMeta: Story = {
  args: { summary: 'Tokens', meta: '1 deviation', open: true, children: 'padding: 10px 14px in CustomerTable.css, where --space-2 --space-3 exists.' },
};

export const Stacked: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', borderBottom: 'var(--border-width) solid var(--color-border)' }}>
      <Disclosure summary="Visual" meta="3 changes">
        Three screenshots moved. Two are the feature; one is the invoice list, which the agent did not mention.
      </Disclosure>
      <Disclosure summary="Accessibility" meta="1 regression" open>
        A button with no name in the new toolbar. The icon has no label, so the control reads as &quot;button&quot;.
      </Disclosure>
      <Disclosure summary="Tokens" meta="1 deviation">
        padding: 10px 14px in CustomerTable.css, where --space-2 --space-3 exists.
      </Disclosure>
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Three in a column. Each draws its own top rule, so a stack divides itself; the frame adds the bottom one.' } },
  },
};

export const OnTheReviewSurface: Story = {
  decorators: [(Story) => <div data-surface="review"><Story /></div>],
  parameters: {
    docs: { description: { story: 'On the review’s surface a row that opens does not turn blue under the pointer: its chevron takes the ink, which is enough to say it answers. The product’s keeps the accent (Closed, above).' } },
  },
};
