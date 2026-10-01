import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { Button } from './Button';

const row: CSSProperties = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)' };

const meta = {
  title: 'System/Button',
  component: Button,
  args: { children: 'Approve change', variant: 'secondary', size: 'default' },
  parameters: {
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'The one button in the system. The variant says what pressing it means: primary is the step forward and there is one per screen, secondary is an ordinary action, danger is something that cannot be taken back without a second step, and ghost sits beside text without competing with it. Compact is for a control inside a row or a toolbar. A loading button keeps its width and its label and refuses a second press; a disabled one uses the real attribute, so it leaves the tab order and the browser can say why.',
      },
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { variant: 'primary', children: 'Approve change' },
};

export const Secondary: Story = {
  args: { variant: 'secondary', children: 'Request changes' },
};

export const Danger: Story = {
  args: { variant: 'danger', children: 'Archive 3 customers' },
  parameters: {
    docs: { description: { story: 'The danger variant names what it will do to what. The screen that places it owns the confirmation or the undo; the button only says the action is one a person would want back.' } },
  },
};

export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Dismiss' },
};

export const Compact: Story = {
  render: () => (
    <div style={row}>
      <Button size="compact" variant="primary">Approve</Button>
      <Button size="compact" variant="secondary">Request changes</Button>
      <Button size="compact" variant="danger">Archive</Button>
      <Button size="compact" variant="ghost">Dismiss</Button>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div style={row}>
      <Button leadingIcon="plus">Add customer</Button>
      <Button variant="primary" trailingIcon="arrow-right">Next finding</Button>
      <Button variant="ghost" leadingIcon="external">Open in Relay</Button>
      <Button size="compact" leadingIcon="filter">Filter</Button>
    </div>
  ),
};

export const Loading: Story = {
  args: { variant: 'primary', loading: true, children: 'Approving' },
  parameters: {
    docs: { description: { story: 'The spinner takes the leading icon\'s place, the label stays for the screen reader, and the press is blocked with aria-disabled rather than disabled so focus does not fall off the control mid-action.' } },
  },
};

export const Disabled: Story = {
  args: { variant: 'primary', disabled: true, children: 'Approve change' },
};

export const KeyboardFocus: Story = {
  args: { variant: 'secondary', children: 'Request changes' },
  parameters: {
    docs: { description: { story: 'Tabs to the button so the base stylesheet\'s focus ring is visible. The ring is an outline, offset from the border, and no variant removes it.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Request changes' })).toHaveFocus();
  },
};

export const LongLabel: Story = {
  args: { variant: 'primary', children: 'Approve the change and merge it into the main branch of Relay' },
  decorators: [
    (Story) => (
      <div style={{ width: 200 }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: { description: { story: 'A 61-character label in a 200px frame. The label does not wrap or break mid-word; the button keeps one line and overflows the frame, which is the screen\'s problem to solve by shortening the label, never the button\'s by wrapping it.' } },
  },
};
