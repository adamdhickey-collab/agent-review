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
          'The front door, at "/": the question the prototype answers, what a designer does all day once an agent builds, the six stages of the design cycle with what the designer does in each, one way in, and the two delegated runs as links for whoever came for one moment where an agent stops.',
      },
    },
  },
} satisfies Meta<typeof StartScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: { description: { story: 'The screen as a person arriving from a link meets it: the question, who they are, the six stages with what the designer does in each, the one way in, and the two runs as links under it.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('If an agent can build the interface, what does the designer do all day?');
    await expect(canvasElement.querySelectorAll('.start__stages li')).toHaveLength(6);
    /* Counted from the run, so it cannot disagree with the account the run opens on. */
    await expect(canvasElement.querySelector('.start__or')).toHaveTextContent(`${start.own.length} changes made, ${start.asking.length} left for you`);
    await expect(canvas.getByRole('button', { name: 'Explore a product design cycle' })).toBeVisible();
  },
};

export const StartGoesToTheCycle: Story = {
  parameters: {
    docs: { description: { story: 'The button goes to the cycle’s first stage, "/cycle/discover". The story puts the address back after.' } },
  },
  play: async ({ canvasElement }) => {
    const was = location.hash;
    try {
      await userEvent.click(within(canvasElement).getByRole('button', { name: 'Explore a product design cycle' }));
      await expect(location.hash).toBe('#/cycle/discover');
    } finally {
      history.replaceState(history.state, '', `${location.pathname}${location.search}${was}`);
    }
  },
};

export const Dark: Story = {
  globals: { theme: 'dark' },
  parameters: { docs: { description: { story: 'The start screen in the dark theme.' } } },
};
