import type { Meta, StoryObj } from '@storybook/react-vite';
import { InvoiceList } from './InvoiceList';

const meta = {
  title: 'Product/InvoiceList',
  component: InvoiceList,
  parameters: {
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'A second screen in Relay, small on purpose. It uses Button three times and nothing else the agent was asked to touch, so it exists to show what a change to a shared component does where nobody was looking. A review that only renders the screen the agent worked on cannot see that; this one can.',
      },
    },
  },
} satisfies Meta<typeof InvoiceList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Narrow: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: 768 }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: { description: { story: 'The list in a 768px frame. The toolbar wraps if it must, and the five columns fit.' } },
  },
};
