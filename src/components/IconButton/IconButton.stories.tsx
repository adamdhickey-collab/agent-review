import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type CSSProperties } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { ICON_NAMES } from '../Icon/Icon';
import { IconButton } from './IconButton';

const row: CSSProperties = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)' };

const meta = {
  title: 'System/IconButton',
  component: IconButton,
  args: { icon: 'filter', label: 'Filter customers' },
  parameters: {
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'A button that is only an icon, for a control that sits in a toolbar or a row where a word would cost too much width. The label is required: it is the accessible name, and the same string shows as a tooltip on hover and on keyboard focus, so nothing is learnable by pointer alone. A toggle says its state with aria-pressed and a tinted ground, not a different icon.',
      },
    },
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Compact: Story = {
  args: { size: 'compact', icon: 'columns', label: 'Choose columns' },
};

export const Pressed: Story = {
  args: { icon: 'eye', label: 'Show changed only', pressed: true },
  render: function Render(args) {
    const [pressed, setPressed] = useState(args.pressed ?? false);
    return <IconButton {...args} pressed={pressed} onClick={() => setPressed((p) => !p)} />;
  },
  parameters: {
    docs: { description: { story: 'A toggle. Press it to flip aria-pressed; the ground tints when on. The label stays the same in both states, which is what makes the state readable rather than a second icon to learn.' } },
  },
};

export const Disabled: Story = {
  args: { icon: 'undo', label: 'Undo', disabled: true },
};

export const TooltipOnFocus: Story = {
  args: { icon: 'search', label: 'Search findings' },
  parameters: {
    docs: { description: { story: 'Tabs to the control. The tooltip that shows on hover shows here too, on focus-visible, drawn from the same string as aria-label.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Search findings' })).toHaveFocus();
  },
};

export const AllIcons: Story = {
  render: () => (
    <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(7rem, 1fr))', gap: 'var(--space-3)' }}>
      {ICON_NAMES.map((name) => (
        <li key={name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-1)' }}>
          <IconButton icon={name} label={name} />
          <code style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{name}</code>
        </li>
      ))}
    </ul>
  ),
  parameters: {
    docs: { description: { story: 'Every icon in the set, each as an IconButton labelled with its own name. The line set is inline SVG on a 24 grid at a 1.75 stroke. The six status-* marks at the end are the other drawing: solid, on a 16 grid, for the sizes a status is read at (TestStatus has them in use). A new icon goes into Icon.tsx and appears here.' } },
  },
};

export const InRow: Story = {
  render: () => (
    <div style={row}>
      <IconButton icon="filter" label="Filter customers" size="compact" />
      <IconButton icon="columns" label="Choose columns" size="compact" />
      <IconButton icon="dots" label="More actions" size="compact" />
    </div>
  ),
};
