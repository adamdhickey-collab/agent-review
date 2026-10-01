import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { SegmentedControl } from './SegmentedControl';

const meta = {
  title: 'System/SegmentedControl',
  component: SegmentedControl,
  args: {
    label: 'Compare',
    options: [
      { value: 'before', label: 'Before' },
      { value: 'after', label: 'After' },
    ],
    value: 'before',
    onChange: () => {},
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <SegmentedControl {...args} value={value} onChange={setValue} />;
  },
  parameters: {
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'One choice among a few, all visible at once: before or after, a viewport width, a density. It behaves as a radio group, which is what it is: one tab stop, arrow keys move the choice, the chosen option is aria-checked. It is for choices that change what the reader is looking at, not for actions; a Button is for actions. Icon-only options keep their label as the accessible name and as a tooltip on hover and focus.',
      },
    },
  },
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithIcons: Story = {
  args: {
    label: 'Viewport width',
    options: [
      { value: '1280', label: '1280 wide', icon: 'monitor', iconOnly: true },
      { value: '1024', label: '1024 wide', icon: 'tablet', iconOnly: true },
      { value: '768', label: '768 wide', icon: 'smartphone', iconOnly: true },
    ],
    value: '1280',
  },
  parameters: {
    docs: { description: { story: 'Three viewport widths as icons. Each option\'s label is its accessible name and its tooltip; the icon is never the only thing that says which width it is.' } },
  },
};

export const Compact: Story = {
  args: {
    label: 'Density',
    size: 'compact',
    options: [
      { value: 'default', label: 'Default' },
      { value: 'compact', label: 'Compact' },
    ],
    value: 'default',
  },
};

export const KeyboardArrows: Story = {
  parameters: {
    docs: { description: { story: 'Focuses the checked option and presses ArrowRight. The choice and the focus both move; the check asserts aria-checked moved to After.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole('radio', { checked: true }).focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getByRole('radio', { name: 'After' })).toHaveAttribute('aria-checked', 'true');
    await expect(canvas.getByRole('radio', { name: 'Before' })).toHaveAttribute('aria-checked', 'false');
    await expect(canvas.getByRole('radio', { name: 'After' })).toHaveFocus();
  },
};
