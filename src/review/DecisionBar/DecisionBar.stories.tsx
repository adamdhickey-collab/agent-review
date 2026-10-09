import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { bulkActionsWithRules, findChange } from '../../data/scenario';
import type { Change } from '../../data/types';
import { DecisionBar } from './DecisionBar';

function change(id: string): Change {
  const c = findChange(id);
  if (!c) throw new Error(`The scenario has no change ${id}`);
  return c;
}

const meta = {
  title: 'Review/DecisionBar',
  component: DecisionBar,
  args: { change: bulkActionsWithRules, onAccept: fn(), onReject: fn(), onReturn: fn() },
  parameters: {
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'The three decisions a reviewer can make, and the rules around each. Accept is refused while a blocking finding stands, and the bar says why in words beside the button rather than greying it out and leaving the reviewer to guess. Accept asks once more, naming the branch and what it merges into, because a merge is the one step here with no way back. Reject asks for a reason and will not go without one, because a rejection with no reason teaches the agent nothing. Return opens the composer, where the message is built from the findings. Once a decision is made the bar becomes a record of it, with the decider and the first line of the message, and an Undo while the store still offers one. That is rule 6 of the quality rules applied to the review itself.',
      },
    },
  },
} satisfies Meta<typeof DecisionBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { change: change('rv-2043') },
  parameters: {
    docs: {
      description: {
        story:
          'The seeded-drift bulk-actions change (rv-2043) has two blocking findings, so Accept is disabled and the bar says "2 blocking findings: cannot accept as is". Those words are the disabled button\'s description too, so a screen reader that finds it hears why. Return and Reject stay available.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Accept' })).toHaveAccessibleDescription(/2 blocking findings: cannot accept as is/);
  },
};

export const NoBlocking: Story = {
  args: { change: change('rv-2040') },
  parameters: {
    docs: { description: { story: 'The invoices empty-state change: nothing blocking, so Accept is enabled and there is no reason text to show.' } },
  },
};

export const ConfirmAccept: Story = {
  args: { change: change('rv-2040') },
  parameters: {
    docs: { description: { story: 'Presses Accept on a change that can be accepted. The bar asks once more, naming the title, the branch and the base, and focus moves to Accept and merge.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Accept' }));
    const confirm = canvas.getByRole('button', { name: 'Accept and merge' });
    await expect(confirm).toBeInTheDocument();
    await expect(confirm).toHaveFocus();
    await expect(canvas.getByText(/agent\/invoices-empty-state/)).toBeInTheDocument();
  },
};

export const ConfirmReject: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Presses Reject. A reason field appears with focus, under its question, which stays on screen as a label rather than going with the placeholder at the first letter. The Reject that sends can be pressed; without a reason it says why it will not go (the next story).',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Reject' }));
    const reason = canvas.getByRole('textbox', { name: 'Why this change is rejected' });
    await expect(reason).toBeInTheDocument();
    await expect(reason).toHaveFocus();
    await expect(canvas.getByText('Why this change is rejected')).toBeVisible();
  },
};

export const RejectWithoutReason: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Presses the confirming Reject with the field empty. Nothing is sent: the field is marked invalid, the reason it needs is said under it and announced, and focus stays in the field. Typing a reason takes the message away.',
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Reject' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Reject' }));
    const reason = canvas.getByRole('textbox', { name: 'Why this change is rejected' });
    await expect(args.onReject).not.toHaveBeenCalled();
    await expect(reason).toHaveAttribute('aria-invalid', 'true');
    await expect(reason).toHaveAccessibleDescription(/Write the reason first/);
    await expect(reason).toHaveFocus();
    await expect(canvas.getByRole('alert')).toBeInTheDocument();
  },
};

export const EscapeBacksOut: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Presses Reject, then Escape. The question closes, nothing is sent, and focus goes back to the Reject that asked it, as Cancel does. The shortcut sheet lists Escape for this.',
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Reject' }));
    await userEvent.keyboard('{Escape}');
    await expect(canvas.queryByRole('textbox')).not.toBeInTheDocument();
    await expect(args.onReject).not.toHaveBeenCalled();
    await expect(canvas.getByRole('button', { name: 'Reject' })).toHaveFocus();
  },
};

export const Accepted: Story = {
  args: { change: change('rv-2033') },
  parameters: {
    docs: { description: { story: 'A decision already made: accepted, by whom. The record is a status, and there is no Undo because the store no longer offers one.' } },
  },
};

export const Rejected: Story = {
  args: { change: change('rv-2029') },
  parameters: {
    docs: { description: { story: 'Rejected, with the first line of the reason quoted so the record says why, not only that.' } },
  },
};

export const Returned: Story = {
  args: { change: change('rv-2036') },
};

export const ReturnedWithUndo: Story = {
  args: { change: change('rv-2036'), canUndo: true, onUndo: fn() },
  parameters: {
    docs: { description: { story: 'The same record in the moment after the decision, while the store still holds the previous state: Undo is offered beside it.' } },
  },
};
