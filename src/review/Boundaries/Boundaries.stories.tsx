import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { initialDelegation } from '../../data/billing';
import { play } from '../../data/delegation';
import { Boundaries } from './Boundaries';

const start = initialDelegation();
const withRule = play(start, { type: 'answer', id: 'activity-red', option: 'diff', makeRule: true });
const revoked = play(withRule, { type: 'revoke-rule', id: 'rule-1' });

const meta = {
  title: 'Review/Boundaries',
  component: Boundaries,
  args: { boundaries: start.boundaries, by: start.brief.by, rules: [], work: start.work, onEditRule: fn(), onRevokeRule: fn() },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '20rem' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'What the agent may do here, in seven sentences in three groups (does on its own, asks you first, outside this delegation), numbered so a paused change can cite one. Under them, the rules the person has made from answers, each as a sentence with what it does not cover, what it has done, and its history. A rule is edited or revoked here, each a second step with Cancel and Escape. Revoking stops it applying and leaves what it made; a revoked rule stays as a record.',
      },
    },
  },
} satisfies Meta<typeof Boundaries>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoRules: Story = {};

export const WithARule: Story = {
  args: { rules: withRule.rules, work: withRule.work },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText(/3 changes, on the invoice detail, plan card, billing settings/)).toBeInTheDocument();
  },
};

export const EditingARule: Story = {
  args: { rules: withRule.rules, work: withRule.work, initialMode: 'edit' },
  parameters: { docs: { description: { story: 'Edit: what the rule covers, as two boxes. Save is refused with neither checked, and says to revoke instead.' } } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText('A value struck through beside the one that replaced it'));
    await expect(canvas.getByRole('button', { name: 'Save' })).toBeDisabled();
    await expect(canvas.getByText(/Choose at least one/)).toBeInTheDocument();
    await userEvent.click(canvas.getByText('A value struck through with nothing replacing it'));
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await expect(args.onEditRule).toHaveBeenCalledWith('rule-1', ['removed']);
    await expect(canvas.getByRole('button', { name: 'Edit' })).toHaveFocus();
  },
};

export const RevokingARule: Story = {
  args: { rules: withRule.rules, work: withRule.work, initialMode: 'revoke' },
  parameters: { docs: { description: { story: 'Revoke asks first, and says what it does and does not do: a matching case asks again; the three changes the rule made stay merged.' } } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Revoke the rule' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await expect(canvas.getByRole('button', { name: 'Revoke' })).toHaveFocus();
    await expect(args.onRevokeRule).not.toHaveBeenCalled();
  },
};

export const Revoked: Story = {
  args: { rules: revoked.rules, work: revoked.work },
  parameters: { docs: { description: { story: 'A revoked rule, kept as a record of what it did, with no actions left on it.' } } },
};
