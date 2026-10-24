import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { initialDelegation } from '../../data/billing';
import { account } from '../../data/delegation';
import { StartScreen } from './StartScreen';

const run = initialDelegation();
const start = account(run);

const meta = {
  title: 'Review/StartScreen',
  component: StartScreen,
  parameters: {
    layout: 'fullscreen',
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'The front door, at "/": one screen before the delegated work, so a person arriving from a link is not dropped into the middle of a scenario. It says this is simulated and short, sets up the situation in a line, in the words the next screen uses ("Needs you"), says who the person is and what the agent did, counted from the billing run as it starts, says where to begin, and asks for one press. The desk takes a person through the steps itself, so this screen does not list them or draw the screen to come.',
      },
    },
  },
} satisfies Meta<typeof StartScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: { description: { story: 'The screen as a person arriving from a link meets it: the title, what happened and who they are, where to begin, and Start the review.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('A coding agent did most of the work. The rest needs you.');
    /* Counted from the run, so it cannot disagree with the account the next screen opens on. */
    await expect(canvasElement.querySelector('.start__lead')).toHaveTextContent(`It made ${start.own.length} changes`);
    await expect(canvasElement.querySelector('.start__lead')).toHaveTextContent(`left ${start.asking.length} for you`);
    await expect(canvasElement.querySelector('.start__where')).toHaveTextContent('Start with the first decision.');
    await expect(canvas.getByRole('button', { name: 'Start the review' })).toBeVisible();
    /* One press, and nothing else to do here. */
    await expect(canvasElement.querySelectorAll('a, button, input, [tabindex="0"]').length).toBe(1);
  },
};

export const StartGoesToTheRun: Story = {
  parameters: {
    docs: { description: { story: 'Start the review goes to the billing run at its own address, "/runs/billing", which the router shows as a new screen. The story puts the address back after.' } },
  },
  play: async ({ canvasElement }) => {
    const was = location.hash;
    try {
      await userEvent.click(within(canvasElement).getByRole('button', { name: 'Start the review' }));
      await expect(location.hash).toBe('#/runs/billing');
    } finally {
      history.replaceState(history.state, '', `${location.pathname}${location.search}${was}`);
    }
  },
};

export const Dark: Story = {
  globals: { theme: 'dark' },
  parameters: { docs: { description: { story: 'The start screen in the dark theme.' } } },
};
