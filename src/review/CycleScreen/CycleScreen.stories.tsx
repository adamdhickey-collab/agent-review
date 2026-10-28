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

/* Since 2026-10-26 a stage opens once every stage before it is decided, so
   a story of a later stage plays the earlier moves first: Explore is
   decided once each direction has been tried. */
const framed = play({ type: 'read', call: 'correct' }, { type: 'prioritize', priority: 'recovery' });
const TRIED: CycleAction[] = [
  { type: 'try', direction: 'undo', event: 'archived' },
  { type: 'try', direction: 'confirm', event: 'archived' },
  { type: 'try', direction: 'review', event: 'archived' },
];
const explored = TRIED.reduce(reduceCycle, framed);
const chosen = reduceCycle(reduceCycle(explored, { type: 'choose', direction: 'undo' }), { type: 'require', feature: 'names-active', on: true });
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
  parameters: { docs: { description: { story: 'The front door: the scenario in one line under the question, the evidence and the agent’s summary, each line marked observation, interpretation or assumption. The way on waits for the move (Continue in the move; the foot’s Next too, under 64rem), and the rail links only the stages that are open. Correcting the assumption changes the brief’s problem.' } } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('Something is wrong with archiving');
    await expect(canvasElement.querySelector('.cycle__setup')).toHaveTextContent('You’re Adam, a product designer');
    await expect(canvas.queryByRole('button', { name: /Continue to/ })).toBeNull();
    await expect(canvas.queryByRole('link', { name: /Next/ })).toBeNull();
    /* The foot’s note is in the markup for the narrow layout; the story renders wide, where it is hidden. */
    await expect(canvasElement.querySelector('.cycle__pager-wait')).toHaveTextContent('Define opens after your move');
    await expect(canvas.queryByRole('link', { name: /Define/ })).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Choose Correct it' }));
    await expect(canvas.getByRole('button', { name: 'Continue to Define' })).toBeVisible();
    await expect(canvas.getByRole('link', { name: 'Define' })).toBeVisible();
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
    await expect(canvasElement.querySelector('.cycle__consequence')).toHaveTextContent('Review batch, then archive');
  },
};

export const Explore: Story = {
  args: { stage: 'explore' },
  decorators: [inStore(framed)],
  parameters: {
    a11y: { test: 'error' },
    docs: {
      description: {
        story:
          'Three working directions, a tab each, and the comparison. Each opens with the same batch selected, and the move carries one press at a time: its button presses the screen’s next control, which is marked in the screen, so the question a direction asks is answered from the same place Archive was pressed. Once a direction is tried the move says what it showed and offers the next one.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const mark = canvasElement.querySelector<HTMLElement>('.cycle__next-mark')!;
    await expect(mark).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Press Archive' }));
    await expect(canvasElement.querySelector('.cycle__tries li[data-done]')).toHaveTextContent('nothing named them first');
    await expect(mark).not.toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: /^Try direction 2/ }));
    await expect(canvasElement.querySelector('.cycle__direction-does')).toHaveTextContent('Archive asks first');
    await expect(canvas.getByText('5 selected')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Press Archive' }));
    await expect(canvasElement.querySelector('.cycle__consequence')).toHaveTextContent('Relay asks before anything leaves');
    await expect(mark).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Press Archive 5 customers' }));
    await expect(canvasElement.querySelectorAll('.cycle__tries li[data-done]')).toHaveLength(2);
    await expect(canvas.getByRole('button', { name: /^Try direction 3/ })).toBeVisible();
  },
};

export const ExploreAllTried: Story = {
  args: { stage: 'explore' },
  decorators: [inStore(explored)],
  parameters: { docs: { description: { story: 'All three directions tried: each says what it showed, and Continue opens Evaluate.' } } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvasElement.querySelectorAll('.cycle__tries li[data-done]')).toHaveLength(3);
    await expect(canvasElement.querySelector('.cycle__consequence')).toHaveTextContent('You’ve tried all three.');
    await expect(canvas.getByRole('button', { name: 'Continue to Evaluate' })).toBeVisible();
  },
};

export const Evaluate: Story = {
  args: { stage: 'evaluate' },
  decorators: [inStore(explored)],
  parameters: { docs: { description: { story: 'The findings, each with its source, and the choice of direction. A requirement the chosen direction already meets says so instead of offering a box.' } } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvasElement.querySelector('.cycle__move-lead')).toHaveTextContent('The agent recommends Review batch, then archive');
    await userEvent.click(canvas.getByRole('button', { name: 'Choose Review batch, then archive' }));
    await expect(canvas.getAllByText('Review batch, then archive does this already.')).toHaveLength(2);
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
  decorators: [inStore(reduceCycle(reduceCycle(explored, { type: 'choose', direction: 'confirm' }), { type: 'delegate' }))],
  parameters: { a11y: { test: 'error' }, docs: { description: { story: 'A different direction, a different stop: Confirm asks a question of meaning, who counts as active, and the answer changes who the built screen names.' } } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Needs judgment')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Choose Active in the last week' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Archive' }));
    await expect(canvasElement.querySelector('.archive-flow__question')).toHaveTextContent('Alder & Finch');
  },
};

export const AStageNotOpenYet: Story = {
  args: { stage: 'delegate' },
  decorators: [inStore(framed)],
  parameters: { docs: { description: { story: 'An address further on than the reader has come: the stage’s question, and a way to the first stage still open, here Explore. The rail links Explore and the two before it, and nothing after.' } } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Start with Explore')).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Go to Explore' })).toBeVisible();
    await expect(canvas.queryByRole('link', { name: /Evaluate/ })).toBeNull();
    await expect(canvas.queryByRole('link', { name: /Next/ })).toBeNull();
  },
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
  decorators: [inStore(play({ type: 'read', call: 'keep' }, { type: 'prioritize', priority: 'pace' }, ...TRIED, { type: 'choose', direction: 'undo' }, { type: 'delegate' }, { type: 'answer', answer: 'local' }))],
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
