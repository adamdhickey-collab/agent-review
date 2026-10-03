import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { initialDelegation } from '../../data/billing';
import { find, play, waitingOn, whyAsking, type DelegationState, type Work } from '../../data/delegation';
import type { DecisionRequestProps, RulePreview } from './DecisionRequest';
import { DecisionRequest } from './DecisionRequest';

const start = initialDelegation();
const withRule = play(start, { type: 'answer', id: 'activity-red', option: 'diff', makeRule: true });

function props(s: DelegationState, id: string, preview: RulePreview): DecisionRequestProps {
  const w = find(s, id) as Work;
  return {
    work: w,
    why: w.waitsOn ? whyAsking(s, w) : undefined,
    boundaries: s.boundaries.filter((b) => w.question!.paused.includes(b.n)),
    waiting: waitingOn(s, id),
    preview: () => preview,
    onAnswer: fn(),
  };
}

const makeRule: RulePreview = {
  offer: 'make',
  text: 'On the billing screens, a value struck through beside the one that replaced it takes --color-diff-remove-ink, and the new value takes --color-diff-add-ink.',
  settles: waitingOn(start, 'activity-red').filter((w) => w.question?.pattern === 'replaced'),
};

const meta = {
  title: 'Review/DecisionRequest',
  component: DecisionRequest,
  args: props(start, 'activity-red', makeRule),
  parameters: {
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'A change the agent stopped on, asking for one decision, and saying which kind. What a value means: the agent can make the change and cannot tell which is meant, so the card says what no check can settle, folds the evidence for each reading, and recommends one. Outside the delegation: the agent knows what to do and may not, so the card says what it would do and why that is past its authority. Both cite the boundary that stopped them in its own words. Answering is the system’s inline confirmation: the answers become "apply this?", Escape cancels, focus goes to Apply. That second step is where an intent answer can become a rule, never by default: the box starts unchecked, and checking it shows the rule in words, what it does not cover, and what it would settle at once. A scope decision offers no rule; allowing a step once is not moving the boundary.',
      },
    },
  },
} satisfies Meta<typeof DecisionRequest>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WhatAValueMeans: Story = {
  parameters: {
    docs: { description: { story: 'The first question of the billing run: the same red is two tokens, and the evidence points both ways. Four changes are held behind it, and the card lists them.' } },
  },
};

export const Choosing: Story = {
  args: { initialChoice: 'diff' },
  parameters: {
    docs: { description: { story: 'An answer chosen. The answers have become the question, focus is on Apply, and the rule box is unchecked: this answer applies to this change only until the person says otherwise. Checking it shows the rule as it will read and the three changes it would settle now. Escape cancels and puts focus back on the answer.' } },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Apply' })).toHaveFocus();
    await expect(canvas.getByText('This answer applies to this change only.')).toBeInTheDocument();
    await userEvent.click(canvas.getByText('Also use this answer for similar cases'));
    await expect(canvas.getByText('The rule, as it will read')).toBeInTheDocument();
    await expect(canvas.getByText(/It settles now:/).closest('p')).toHaveTextContent('3 changes that match');
    await userEvent.click(canvas.getByRole('button', { name: 'Apply' }));
    await expect(args.onAnswer).toHaveBeenCalledWith('diff', true);
  },
};

export const CancelWithEscape: Story = {
  args: { initialChoice: 'danger' },
  parameters: {
    docs: { description: { story: 'Escape is Cancel. The answers come back, and focus goes to the one that was chosen.' } },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.keyboard('{Escape}');
    await expect(canvas.getByRole('button', { name: 'Use danger and success' })).toHaveFocus();
    await expect(args.onAnswer).not.toHaveBeenCalled();
  },
};

export const OutsideTheDelegation: Story = {
  args: props(start, 'meter-radius', { offer: 'none', settles: [] }),
  parameters: {
    docs: { description: { story: 'The agent knows the fix (a new token, nothing moves) and the token layer is outside its delegation. It cites both boundaries, recommends allowing it, and offers no rule: allowing this once is not the same as letting it add tokens.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Outside the delegation')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Add --radius-full, this once' }));
    await expect(canvas.queryByRole('checkbox')).toBeNull();
    await expect(canvas.getByText(/doesn’t widen the delegation/)).toBeInTheDocument();
  },
};

export const OutsideYourRule: Story = {
  args: props(withRule, 'invoice-removed', {
    offer: 'widen',
    text: 'On the billing screens, a value struck through takes --color-diff-remove-ink, whether or not a new value stands beside it; a new value beside it takes --color-diff-add-ink.',
    settles: [],
  }),
  parameters: {
    docs: { description: { story: 'After a rule was made. This case is close to it and outside it, and the card says so before anything else, in the reason it paused. Answering can add the case to the rule rather than make a second one.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Close to your rule, but outside it/)).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Use the diff remove ink' }));
    await expect(canvas.getByText('Add this case to your rule')).toBeInTheDocument();
  },
};

export const AnsweredOnceElsewhere: Story = {
  args: props(play(start, { type: 'answer', id: 'activity-red', option: 'diff', makeRule: false }), 'plan-seats', makeRule),
  parameters: {
    docs: { description: { story: 'The first question answered once, without a rule. This change was waiting on it, and asks anyway, saying why: a one-time answer does not carry over.' } },
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText(/A one-time answer doesn’t carry over/)).toBeInTheDocument();
  },
};
