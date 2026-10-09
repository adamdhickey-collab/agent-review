import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { initialDelegation } from '../../data/billing';
import { find, play, type Work } from '../../data/delegation';
import { WorkRecord } from './WorkRecord';

const start = initialDelegation();
const work = (id: string, s = start) => find(s, id) as Work;
const withRule = play(start, { type: 'answer', id: 'activity-red', option: 'separate', makeRule: true });
const reverted = play(withRule, { type: 'revert', id: 'plan-seats' });
const left = play(start, { type: 'answer', id: 'meter-radius', option: 'leave', makeRule: false });
const allowed = play(start, { type: 'answer', id: 'meter-radius', option: 'add', makeRule: false });

const meta = {
  title: 'Review/WorkRecord',
  component: WorkRecord,
  args: { work: work('invoice-routine'), boundaries: start.boundaries, onRevert: fn(), onRestore: fn(), open: true },
  decorators: [
    (Story) => (
      <ul style={{ maxWidth: '48rem', border: 'var(--border-width) solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)' }}>
        <li>
          <Story />
        </li>
      </ul>
    ),
  ],
  parameters: {
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'One piece of completed work. Closed, a line: what it was, on what authority (on its own, your rule, your answer, allowed once), and the three checks as marks. Open, the five things a person asks of work they did not watch: what changed, why, on what authority, what the checks established, and whether it can be taken back. A check’s word is a fact about the code and never about intent, so a change whose meaning was chosen says separately what no check can vouch for. Revert is offered on every merged change and Restore after it, in the same button, so focus stays.',
      },
    },
  },
} satisfies Meta<typeof WorkRecord>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OnItsOwn: Story = {
  parameters: { docs: { description: { story: 'Six values, each exactly one token’s value, merged under boundaries 1 and 4. Nothing for a person to have decided, and the record says so by having nothing under "what no check establishes".' } } },
};

export const Closed: Story = {
  args: { open: false },
  parameters: { docs: { description: { story: 'The record as a row in the completed work: one mark, its worst check, beside the title, and a grey line under the title with where, how many and the commit. Since 2026-10-09 the three checks are not three marks in columns; a check that did not plainly pass is said in the grey line instead.' } } },
  play: async ({ canvasElement }) => {
    const summary = canvasElement.querySelector('summary')!;
    await expect(summary.querySelectorAll('.record__mark')).toHaveLength(1);
    await expect(summary.querySelector('.record__mark [data-icon="status-passed"]')).toBeTruthy();
    await expect(summary.querySelector('.record__note')).toBeNull();
  },
};

export const ChosenByMeaning: Story = {
  args: { work: work('payment-failed') },
  parameters: { docs: { description: { story: 'The agent’s own judgment, under boundary 2: two tokens are this red, and it chose danger because the element says “Payment failed”. Every check passes, and the record says which part of that no check could establish.' } } },
};

export const FixedAfterAFailure: Story = {
  args: { work: work('plan-routine') },
  parameters: { docs: { description: { story: 'A problem the agent caused and fixed inside its boundaries: it named a token that does not exist, the lint and the visual check both failed, it looked the value up and corrected the name. Closed, the row says so in its grey line. Open, each check shows its first run beside its last, and the history is a timeline with every step: a dot per event, the event, and when and who.' } } },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('.record__note')).toHaveTextContent('Fixed after a failed first try');
    const history = canvasElement.querySelector('.record__history')!;
    await expect(history.querySelectorAll('li')).toHaveLength(5);
    await expect(history.querySelector('li')).toHaveTextContent('Replaced 4 values with their tokens.13:20 · Claude Code');
  },
};

export const Inconclusive: Story = {
  args: { work: work('meter-routine') },
  parameters: { docs: { description: { story: 'A check that ran and could not answer: axe cannot measure a label that crosses the meter’s fill. It is shown as inconclusive, never as passed, and the record says what is still unknown.' } } },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('.record__mark [data-icon="status-inconclusive"]')).toBeTruthy();
    await expect(canvasElement.querySelector('.record__note')).toHaveTextContent('Axe inconclusive');
  },
};

export const ByYourRule: Story = {
  args: { work: work('invoice-amount', withRule), rule: withRule.rules[0] },
  parameters: { docs: { description: { story: 'Settled by a rule the person made. The authority is the rule, in its own words.' } } },
};

export const Reverted: Story = {
  args: { work: work('plan-seats', reverted), rule: reverted.rules[0] },
  parameters: { docs: { description: { story: 'Reverted by the person. The history keeps the merge and the revert, and Restore applies the change again.' } } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Restore it' }));
    await expect(args.onRestore).toHaveBeenCalled();
  },
};

export const AllowedOnce: Story = {
  args: { work: work('meter-radius', allowed) },
  parameters: { docs: { description: { story: 'A change past the delegation’s boundary that the person allowed, once: a new token, in two shared files as well as the screen’s own. Reverting it takes the token out again.' } } },
};

export const LeftAsWritten: Story = {
  args: { work: work('meter-radius', left) },
  parameters: { docs: { description: { story: 'The person chose to leave the line as it is. Nothing changed, so nothing is offered to revert, and the record says the lint still reports it.' } } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('button', { name: 'Revert this change' })).toBeNull();
  },
};
