import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { StoreProvider } from '../../app/store';
import { ruleFor } from '../../data/decide';
import { DecideScreen } from './DecideScreen';

/* The short path, the front door since 2026-11-18: one question in three
   beats. Fresh, before the visitor answers, and with each answer, so the
   rule and the build that follow from it can be read side by side. */

const meta = {
  title: 'Review/DecideScreen',
  component: DecideScreen,
  decorators: [
    (Story) => (
      <StoreProvider>
        <Story />
      </StoreProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'The short path: when should Archive stop and ask? What went wrong (the ticket and the engineering note), the agent’s plan working on a routine cleanup and with Northside Trucking added, the one question, and the rule the answer writes, with the build to try and the whole cycle one press away.',
      },
    },
  },
} satisfies Meta<typeof DecideScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Before the visitor answers: the plan reviews a routine cleanup with nobody to name. */
export const Fresh: Story = {
  args: { initial: null },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await expect(c.getByRole('heading', { level: 1, name: 'When should Archive stop and ask?' })).toBeVisible();
    await expect(c.getByText('Your rule appears here')).toBeVisible();
    const plan = within(c.getByRole('region', { name: 'Decide when to pause' }));
    await userEvent.click(plan.getByRole('button', { name: /^Archive$/ }));
    await expect(plan.getByRole('heading', { name: 'Review 2 customers before archiving' })).toBeVisible();
  },
};

/** Only when someone’s active: the rule, and a routine cleanup that goes through in one press. */
export const OnlyWhenActive: Story = {
  args: { initial: 'active' },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const forward = within(c.getByRole('region', { name: 'What the agent takes forward' }));
    await expect(forward.getByText(ruleFor('active'))).toBeVisible();
    await userEvent.click(forward.getByRole('button', { name: /^Archive$/ }));
    await expect(forward.getByRole('button', { name: 'Undo' })).toBeVisible();
  },
};

/** On every batch, the agent’s plan kept: its rule, and a review even with nobody to name. */
export const EveryBatch: Story = {
  args: { initial: 'every' },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await expect(c.getByText(ruleFor('every'))).toBeVisible();
  },
};
