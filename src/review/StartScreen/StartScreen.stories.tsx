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
          'The front door, at "/": one screen before the delegated work that says what it is and what a person will do in it, and asks for one press. The situation in a line, in the words the next screen uses ("Needs you"); who the person is in it and what the agent did, counted from the billing run as it starts; the steps, the same ones Start here names over the workspace, each with a few words on what it means; the way in; and that it is simulated. Beside it, where the next screen is the desk, a map of the desk names its three parts in words under each, and its decision panel carries the steps on its tabs by the words the list starts with, so nothing on it is a number to look up. The shapes are hidden from a screen reader, which hears the map’s title and the three notes. Under the desk’s width there is no map, because the next screen is another shape and Start here walks a person through it.',
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
  args: { map: true },
  parameters: {
    docs: { description: { story: 'The steps are the ones Start here names over the workspace for the billing run’s first decision, read from the same function (DelegationScreen/steps.ts), so the words a person read here are the words they meet there. The map’s tabs name them by their first words, as the desk does.' } },
  },
  play: async ({ canvasElement }) => {
    const named = Array.from(canvasElement.querySelectorAll('.start__steps strong')).map((s) => s.textContent);
    await expect(named).toEqual(startSteps(start.asking[0]).map((s) => `${s.label}.`));
    const tabs = Array.from(canvasElement.querySelectorAll('.start__map-tab')).map((t) => t.textContent);
    await expect(tabs).toEqual(named.map((n, i) => `${i + 1}${n!.split(' ')[0]}`));
  },
};

export const TheMapIsADrawing: Story = {
  args: { map: true },
  parameters: {
    docs: { description: { story: 'The map of the desk, drawn whatever the width. Its three panels are shapes hidden from a screen reader; its title and the note under each part are what one hears. Nothing in it can be focused or pressed.' } },
  },
  play: async ({ canvasElement }) => {
    const map = canvasElement.querySelector('.start__map')! as HTMLElement;
    for (const panel of map.querySelectorAll('.start__map-panel')) await expect(panel).toHaveAttribute('aria-hidden', 'true');
    await expect(within(map).getByText('What you’ll see next')).toBeVisible();
    const notes = Array.from(map.querySelectorAll('.start__map-note')).map((n) => n.textContent);
    await expect(notes).toEqual([`The ${start.asking.length} decisions left for you`, 'The changes, marked where they are', 'Where you take the steps, one at a time']);
    await expect(map.querySelectorAll('a, button, input, [tabindex]').length).toBe(0);
  },
};

export const NoMapUnderTheDesk: Story = {
  args: { map: false },
  parameters: {
    docs: { description: { story: 'Under the desk’s width the next screen is another shape, so no map is drawn and the words stand alone at their reading measure.' } },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('.start__map')).toBeNull();
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
  args: { map: true },
  globals: { theme: 'dark' },
  parameters: { docs: { description: { story: 'The start screen in the dark theme. The map is drawn in the review’s own tokens, so it turns with the rest.' } } },
};
