import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { TextArea } from './TextArea';

const meta = {
  title: 'System/TextArea',
  component: TextArea,
  args: { label: 'Your reason', hint: 'Kept with the decision, so whoever reads it later knows why.' },
  parameters: {
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'A few lines of a person’s own words: a visible label, the field, and a hint under it that a screen reader reads with the field. Built from the control tokens (its edge, radius and ground) with the base focus ring. Added for the reason a person gives when they decide a trade-off.',
      },
    },
  },
} satisfies Meta<typeof TextArea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('textbox', { name: 'Your reason' });
    await expect(field).toHaveAccessibleDescription('Kept with the decision, so whoever reads it later knows why.');
    await userEvent.click(field);
    await userEvent.keyboard('Cancel gets its own change.');
    await expect(field).toHaveValue('Cancel gets its own change.');
  },
};

export const Filled: Story = {
  args: { defaultValue: 'How easy it is to cancel is a product decision, so it gets its own change. A quiet variant would let any agent make any action this hard to find.' },
};

export const WithoutHint: Story = {
  args: { hint: undefined, label: 'Note for the agent' },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 'Recorded at 14:26.' },
};
