import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { initialDelegation } from '../../data/billing';
import { account } from '../../data/delegation';
import { startSteps } from '../DelegationScreen/steps';
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
          'The front door, at "/": one screen before the delegated work that says what it is and what a person will do in it, and asks for one press. The situation in a line, in the words the next screen uses ("Needs you"); who the person is in it and what the agent did, counted from the billing run as it starts; the steps, the same ones Start here names over the workspace, each with a few words on what it means; the way in; and that it is simulated. Beside it, where the workspace has two columns, a map of the workspace marks where each step happens; the map is a drawing, hidden from a screen reader, which hears its caption. Under 56rem there is no map, because the workspace is one column and there is no left and right to point at.',
      },
    },
  },
} satisfies Meta<typeof StartScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: { description: { story: 'The screen as a person arriving from a link meets it: the title, what happened and who they are, the four steps, Start the review, and the map beside them.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('A coding agent did most of the work. The rest needs you.');
    /* Counted from the run, so it cannot disagree with the account the next screen opens on. */
    await expect(canvasElement.querySelector('.start__lead')).toHaveTextContent(`It made ${start.own.length} changes`);
    await expect(canvasElement.querySelector('.start__lead')).toHaveTextContent(`left ${start.asking.length} for you`);
    await expect(canvas.getByRole('button', { name: 'Start the review' })).toBeVisible();
  },
};

export const SameStepsAsStartHere: Story = {
  parameters: {
    docs: { description: { story: 'The steps are the ones Start here names over the workspace for the billing run’s first decision, read from the same function (DelegationScreen/steps.ts), so the words a person read here are the words they meet there. The map pins the same numbers where each step happens.' } },
  },
  play: async ({ canvasElement }) => {
    const named = Array.from(canvasElement.querySelectorAll('.start__steps strong')).map((s) => s.textContent);
    await expect(named).toEqual(startSteps(start.asking[0]).map((s) => `${s.label}.`));
    const pins = Array.from(canvasElement.querySelectorAll('.start__pin')).map((p) => p.textContent);
    await expect([...pins].sort()).toEqual(['1', '2', '3', '4']);
  },
};

export const TheMapIsADrawing: Story = {
  parameters: {
    docs: { description: { story: 'The map says nothing the list does not, so its shapes are hidden from a screen reader and its caption is what one hears. Nothing in it can be focused or pressed.' } },
  },
  play: async ({ canvasElement }) => {
    const map = canvasElement.querySelector('.start__map')!;
    await expect(map.querySelector('.start__map-screen')).toHaveAttribute('aria-hidden', 'true');
    await expect(within(map as HTMLElement).getByText('Where each step happens on the next screen.')).toBeVisible();
    await expect(map.querySelectorAll('a, button, input, [tabindex]').length).toBe(0);
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
  parameters: { docs: { description: { story: 'The start screen in the dark theme. The map is drawn in the review’s own tokens, so it turns with the rest.' } } },
};
