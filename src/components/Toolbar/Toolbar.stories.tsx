import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../Button/Button';
import { IconButton } from '../IconButton/IconButton';
import { Toolbar, ToolbarSeparator } from './Toolbar';

const meta = {
  title: 'System/Toolbar',
  component: Toolbar,
  args: { label: 'Customers' },
  parameters: {
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'A row of controls over a region: a title or a count at the start, actions at the end. It exists because a toolbar written inline overflows at 768; this one wraps its actions under the start when there is no room. It has role toolbar and a name, so a screen reader knows the controls belong together. The accent tone is for a toolbar that appears in response to a selection and goes away with it.',
      },
    },
  },
} satisfies Meta<typeof Toolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { start: <span>Customers</span> },
  render: (args) => (
    <Toolbar {...args}>
      <Button size="compact" leadingIcon="filter">Filter</Button>
      <Button size="compact" leadingIcon="external">Export</Button>
      <Button size="compact" variant="primary" leadingIcon="plus">Add customer</Button>
    </Toolbar>
  ),
};

export const Accent: Story = {
  args: { label: 'Selected customers', tone: 'accent', start: <span>3 selected</span> },
  render: (args) => (
    <Toolbar {...args}>
      <Button size="compact" variant="danger">Archive</Button>
      <Button size="compact">Export</Button>
      <Button size="compact" variant="ghost">Clear selection</Button>
    </Toolbar>
  ),
  parameters: {
    docs: { description: { story: 'The toolbar a selection brings up. Archive is a danger button; the screen that places it owns the "Archive 3 customers?" step that follows.' } },
  },
};

export const WithSeparator: Story = {
  args: { start: <span>Customers</span> },
  render: (args) => (
    <Toolbar {...args}>
      <IconButton icon="filter" label="Filter customers" size="compact" />
      <IconButton icon="columns" label="Choose columns" size="compact" />
      <ToolbarSeparator />
      <Button size="compact" variant="primary" leadingIcon="plus">Add customer</Button>
    </Toolbar>
  ),
};

export const Narrow: Story = {
  ...Accent,
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: { description: { story: 'The Accent toolbar in a 360px frame. The actions wrap under the count rather than overflowing the frame.' } },
  },
};
