import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import type { ReactNode } from 'react';
import { StoreProvider } from '../../app/store';
import { initialCycle, reduceCycle, type CycleAction, type CycleState } from '../../data/cycle';
import { CycleScreen } from './CycleScreen';

/* Each story opens a stage on a point in the cycle, reached by playing
   actions through the same reducer the app uses, so a story can't show a
   state the app can't reach. The play functions hold the causal chain: a
   choice in one stage changes what a later stage shows. */

function play(...actions: CycleAction[]): CycleState {
  return actions.reduce(reduceCycle, initialCycle());
}

function inStore(state: CycleState) {
  return (Story: () => ReactNode) => (
    <StoreProvider cycle={state}>
      <Story />
    </StoreProvider>
  );
}

const framed = play({ type: 'read', call: 'correct' }, { type: 'prioritize', priority: 'recovery' });
const chosen = reduceCycle(reduceCycle(framed, { type: 'choose', direction: 'undo' }), { type: 'require', feature: 'names-active', on: true });
const sent = reduceCycle(chosen, { type: 'delegate' });
const built = reduceCycle(sent, { type: 'answer', answer: 'local' });

const meta = {
  title: 'Review/CycleScreen',
  component: CycleScreen,
  parameters: {
    layout: 'fullscreen',
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'The design cycle: one feature, archiving customers in Relay, from the evidence to what to measure, in six stages. Each says what the designer does and what the agent does, and asks for one choice a later stage reads: whether the agent’s summary holds up, what wins when speed and safety pull apart, which of three working directions to build and what it must do, the agent’s one question, and whether to keep the guidance. Simulated: data/cycle.ts plays it back through one reducer.',
      },
    },
  },
} satisfies Meta<typeof CycleScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Discover: Story = {
  args: { stage: 'discover' },
  decorators: [inStore(initialCycle())],
  parameters: { docs: { description: { story: 'The evidence and the agent’s summary, each line marked observation, interpretation or assumption. Correcting the assumption changes the brief’s problem.' } } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('Something is wrong with archiving');
    await userEvent.click(canvas.getByRole('button', { name: 'Choose Correct it' }));
    await expect(canvasElement.querySelector('.cycle__consequence')).toHaveTextContent('People can’t see or undo an archive.');
    await userEvent.click(canvas.getByRole('button', { name: 'Choose Keep it' }));
    await expect(canvasElement.querySelector('.cycle__consequence')).toHaveTextContent('Archiving can permanently lose customer data');
  },
};

export const Define: Story = {
  args: { stage: 'define' },
  decorators: [inStore(play({ type: 'read', call: 'correct' }))],
  parameters: { docs: { description: { story: 'The brief. The priority sets two success criteria and the direction the agent will recommend.' } } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Choose Routine cleanup stays fast' }));
    await expect(canvasElement.querySelector('.cycle__brief')).toHaveTextContent('Archiving a page of churned customers takes two presses.');
    await expect(canvasElement.querySelector('.cycle__consequence')).toHaveTextContent('Archive now, undo after');
    await userEvent.click(canvas.getByRole('button', { name: 'Choose Nothing leaves without a way back' }));
    await expect(canvasElement.querySelector('.cycle__brief')).toHaveTextContent('No active customer is archived without being named first.');
    await expect(canvasElement.querySelector('.cycle__consequence')).toHaveTextContent('Review the batch, then archive');
  },
};

export const Explore: Story = {
  args: { stage: 'explore' },
  decorators: [inStore(framed)],
  parameters: { a11y: { test: 'error' }, docs: { description: { story: 'Three working directions, a tab each, and the comparison. What a person does in one is kept and ticked.' } } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Select a batch for me' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Archive' }));
    await expect(canvasElement.querySelector('.cycle__ticks li[data-done]')).toHaveTextContent('Archived a batch');
    await userEvent.click(canvas.getByRole('tab', { name: /Confirm first/ }));
    await expect(canvasElement.querySelector('.cycle__direction-does')).toHaveTextContent('Archive asks first');
  },
};

export const Evaluate: Story = {
  args: { stage: 'evaluate' },
  decorators: [inStore(framed)],
  parameters: { docs: { description: { story: 'The findings, each with its source, and the choice of direction. A requirement the chosen direction already meets says so instead of offering a box.' } } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvasElement.querySelector('.cycle__move-lead')).toHaveTextContent('The agent recommends Review the batch, then archive');
    await userEvent.click(canvas.getByRole('button', { name: 'Choose Review the batch, then archive' }));
    await expect(canvas.getAllByText('Review the batch, then archive does this already.')).toHaveLength(2);
    await userEvent.click(canvas.getByRole('button', { name: 'Choose Archive now, undo after' }));
    await expect(canvasElement.querySelector('.cycle__consequence')).toHaveTextContent('You chose against its recommendation');
  },
};

export const DelegateReady: Story = {
  args: { stage: 'delegate' },
  decorators: [inStore(chosen)],
  parameters: { docs: { description: { story: 'The brief written from the choices, ready to send: the direction, the reason, the requirement added in Evaluate, and the boundaries.' } } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvasElement.querySelector('.cycle__brief')).toHaveTextContent('Name any active customer before it’s archived.');
    await userEvent.click(canvas.getByRole('button', { name: 'Send the brief' }));
    await expect(canvas.getByRole('heading', { level: 2, name: /The undo bar is a new pattern/ })).toBeVisible();
  },
};

export const DelegateStopsDifferently: Story = {
  args: { stage: 'delegate' },
  decorators: [inStore(reduceCycle(reduceCycle(framed, { type: 'choose', direction: 'confirm' }), { type: 'delegate' }))],
  parameters: { a11y: { test: 'error' }, docs: { description: { story: 'A different direction, a different stop: Confirm asks a question of meaning, who counts as active, and the answer changes who the built screen names.' } } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Needs judgment')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Choose Active in the last week' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Archive' }));
    await expect(canvasElement.querySelector('.archive-flow__question')).toHaveTextContent('Alder & Finch');
  },
};

export const DelegateNeedsADirection: Story = {
  args: { stage: 'delegate' },
  decorators: [inStore(initialCycle())],
  parameters: { docs: { description: { story: 'Before a direction is chosen there is nothing to send, and the stage says where the choice is made.' } } },
};

export const Learn: Story = {
  args: { stage: 'learn' },
  decorators: [inStore(built)],
  parameters: { docs: { description: { story: 'What was decided, verified and still unknown, what to measure, and the guidance to keep. With no Archived view required, the unknowns say restoring is still a support ticket.' } } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvasElement.querySelector('.cycle__list--open')).toHaveTextContent('Restoring is still a support ticket.');
    await expect(canvasElement.querySelector('.cycle__rule')).toHaveTextContent('names what’s at risk before the press');
    await userEvent.click(canvas.getByRole('checkbox', { name: /Keep it as guidance/ }));
    await expect(canvas.getByRole('link', { name: /Learn.*decided/ })).toBeVisible();
  },
};

export const LearnOnAWrongPremise: Story = {
  args: { stage: 'learn' },
  decorators: [inStore(play({ type: 'read', call: 'keep' }, { type: 'prioritize', priority: 'pace' }, { type: 'choose', direction: 'undo' }, { type: 'delegate' }, { type: 'answer', answer: 'local' }))],
  parameters: { docs: { description: { story: 'Keeping the summary’s claim in Discover follows the work to the end: Learn says the brief rested on data loss the engineering note contradicts.' } } },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('.cycle__list--open')).toHaveTextContent('The brief rested on data loss');
  },
};

export const Dark: Story = {
  args: { stage: 'evaluate' },
  globals: { theme: 'dark' },
  decorators: [inStore(chosen)],
  parameters: { docs: { description: { story: 'A stage in the dark theme. Relay inside it stays light.' } } },
};
