import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { initialDelegation } from '../../data/billing';
import { initialTableRun } from '../../data/table';
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
          'What the agent may do here: seven sentences in three groups (does on its own, asks you first, outside this delegation), each group closed to a line with its mark and its count, and the sentences numbered so a paused change can cite one. Under them, the rules the person has made from answers, each as a sentence with what it does not cover, what it has done, and its history. A rule is edited or revoked here, each a second step with Cancel and Escape. Revoking stops it applying and leaves what it made; a revoked rule stays as a record.',
      },
    },
  },
} satisfies Meta<typeof Boundaries>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoRules: Story = {};

export const AGroupOpen: Story = {
  parameters: {
    docs: { description: { story: 'The three groups are closed to a line each: the mark, the name and the count. Opening one shows its boundaries, numbered as the paused changes cite them.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const asks = canvas.getByText('Asks for your judgment').closest('details')!;
    await expect(asks.open).toBe(false);
    await expect(asks).toHaveTextContent('Asks for your judgment2 boundaries');
    await userEvent.click(canvas.getByText('Asks for your judgment'));
    await expect(asks.open).toBe(true);
    await expect(canvas.getByText('When no token has the value, so a swap would move pixels.')).toBeVisible();
  },
};

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

/* A rule written in its own words: the shared-table run's, scoped to the
   customer screens. */
const table = initialTableRun();
const tableRule = play(table, { type: 'answer', id: 'table-rows', option: 'local', makeRule: true });

export const RuleInItsOwnWords: Story = {
  args: { boundaries: table.boundaries, by: table.brief.by, rules: tableRule.rules, work: tableRule.work },
  parameters: {
    docs: {
      description: {
        story:
          'Every rule says where it applies, why, what it leaves out and who made it, so a person who was not there can review it. This one, from the shared-table run, is written in its own words rather than built from the cases it covers, so it can be revoked but not widened: there is no Edit.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Applies to')).toBeInTheDocument();
    await expect(canvas.getByText('The customer screens')).toBeInTheDocument();
    await expect(canvas.getByText(/A shared component is its owner’s to change/)).toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: 'Edit' })).toBeNull();
    await expect(canvas.getByRole('button', { name: 'Revoke' })).toBeInTheDocument();
  },
};
