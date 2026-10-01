import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type CSSProperties } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { Checkbox } from './Checkbox';

const column: CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--space-2)' };

const meta = {
  title: 'System/Checkbox',
  component: Checkbox,
  args: { label: 'Include archived customers' },
  parameters: {
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'A native checkbox with a drawn box. The input stays in the tree for the keyboard and the screen reader; the box is for the eye. Indeterminate is the real property on the input, not a third icon, so a select-all box that is half-checked says so to assistive technology. The label is required; hideLabel keeps it for a screen reader when the row beside the box is the visible label, as in a table.',
      },
    },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {};

export const Checked: Story = {
  args: { defaultChecked: true },
};

export const Indeterminate: Story = {
  args: { label: 'Select all customers', indeterminate: true },
};

export const Disabled: Story = {
  render: () => (
    <div style={column}>
      <Checkbox label="Include archived customers" disabled />
      <Checkbox label="Include active customers" disabled defaultChecked />
    </div>
  ),
};

export const HiddenLabel: Story = {
  args: { label: 'Select Halvorsen Freight', hideLabel: true },
  parameters: {
    docs: { description: { story: 'The label is visually hidden and names the row the box belongs to, which is how a select-row checkbox in a table reads.' } },
  },
};

export const KeyboardFocus: Story = {
  parameters: {
    docs: { description: { story: 'Tabs to the box. The ring is drawn on the visible box rather than on the invisible input, with the same focus tokens.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await expect(canvas.getByRole('checkbox', { name: 'Include archived customers' })).toHaveFocus();
  },
};

const CHILDREN = ['Halvorsen Freight', 'Brightwater Clinics', 'Alder & Finch'];

export const Interactive: Story = {
  render: function Render() {
    const [checked, setChecked] = useState<boolean[]>([true, false, false]);
    const all = checked.every(Boolean);
    const some = checked.some(Boolean) && !all;
    return (
      <div style={column}>
        <Checkbox
          label="Select all customers"
          checked={all}
          indeterminate={some}
          onChange={(e) => setChecked(CHILDREN.map(() => e.currentTarget.checked))}
        />
        <div style={{ ...column, paddingLeft: 'var(--space-6)' }}>
          {CHILDREN.map((name, i) => (
            <Checkbox
              key={name}
              label={name}
              checked={checked[i]}
              onChange={(e) => {
                const next = [...checked];
                next[i] = e.currentTarget.checked;
                setChecked(next);
              }}
            />
          ))}
        </div>
      </div>
    );
  },
  parameters: {
    docs: { description: { story: 'A select-all box over three rows. Some checked makes it indeterminate; all checked makes it checked; pressing it sets all three either way.' } },
  },
};
