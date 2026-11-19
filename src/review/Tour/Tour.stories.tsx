import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within, userEvent } from 'storybook/test';
import { StoreProvider } from '../../app/store';
import { CycleScreen } from '../CycleScreen/CycleScreen';
import { TourProvider } from './Tour';
import { TourFeature } from './TourFeature';
import { BEATS, stateBefore } from './script';

/* The tour's bar, opened on a beat without playing it: the cycle is put
   where the earlier beats' actions leave it (script.ts, stateBefore), which
   is how the tour itself starts a beat from anywhere. The playing is held
   by tests/tour.spec.ts, in a browser, with the app's own router. */

function At({ beat, ended = false }: { beat: number; ended?: boolean }) {
  const at = Math.min(beat, BEATS.length - 1);
  return (
    <StoreProvider cycle={stateBefore(ended ? BEATS.length : at)}>
      <TourProvider opening={{ at, status: ended ? 'ended' : 'paused' }}>
        <CycleScreen stage={BEATS[at].stage} />
      </TourProvider>
    </StoreProvider>
  );
}

const meta = {
  title: 'Review/Tour',
  component: At,
  parameters: {
    layout: 'fullscreen',
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'The guided tour: a bar at the foot of the window that plays the design cycle by pressing its real controls, one line at a time. Six chapters, one for each stage, each a press that goes there; pause, step, and close. A beat where the designer decides is labeled and carries a line of reasoning. Simulated demo, said on the bar for as long as it is open.',
      },
    },
  },
} satisfies Meta<typeof At>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A beat that narrates: one line, the chapters, the controls. */
export const Narrating: Story = {
  args: { beat: 2 },
  play: async ({ canvasElement }) => {
    const bar = within(canvasElement).getByRole('region', { name: 'Guided tour' });
    await waitFor(() => expect(within(bar).getByText('Simulated demo')).toBeVisible()); /* the bar fades in */
    await expect(within(bar).getByText(BEATS[2].caption)).toBeVisible();
    await expect(within(bar).getByText('Simulated demo')).toBeVisible();
    await expect(within(bar).getByRole('button', { name: 'Play the tour' })).toBeVisible();
    await expect(within(bar).getByRole('button', { name: 'Close the tour' })).toBeVisible();
    await expect(within(bar).queryByRole('button', { name: 'Take over' })).toBeNull();
    await expect(within(bar).getAllByRole('listitem')).toHaveLength(6);
    await expect(within(bar).queryByText('Orchestration')).toBeNull();
    /* Narration is off until it is turned on, and its settings wait with it. */
    const voice = within(bar).getByRole('button', { name: 'Narration' });
    const settings = within(bar).getByRole('button', { name: /^Voice and speed: / });
    await expect(voice).toHaveAttribute('aria-pressed', 'false');
    await expect(settings).toBeDisabled();
    await userEvent.click(voice);
    await expect(voice).toHaveAttribute('aria-pressed', 'true');
    /* One button says the voice and the speed and opens the menu that changes them. */
    await expect(settings).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(settings);
    const menu = within(bar).getByRole('dialog', { name: 'Voice and speed' });
    await expect(within(menu).getByRole('radio', { name: '1×' })).toBeChecked();
    await waitFor(() => expect(within(menu).getByRole('radiogroup', { name: 'Voice' })).toBeVisible()); /* it fades in */
    await userEvent.keyboard('{Escape}');
    await expect(within(bar).queryByRole('dialog')).toBeNull();
    await expect(settings).toHaveFocus();
    await userEvent.click(voice); /* off again, so the next story starts silent */
    await expect(voice).toHaveAttribute('aria-pressed', 'false');
  },
};

/** A beat where the designer decides: labeled with the stage's kind of work, with its reasoning under the line. */
export const Decision: Story = {
  args: { beat: 6 },
  play: async ({ canvasElement }) => {
    const bar = within(canvasElement).getByRole('region', { name: 'Guided tour' });
    await waitFor(() => expect(within(bar).getByText('Simulated demo')).toBeVisible()); /* the bar fades in */
    await expect(within(bar).getByText('Orchestration')).toBeVisible();
    await expect(within(bar).getByText(BEATS[6].why!)).toBeVisible();
    await expect(within(bar).getByRole('button', { name: /Define/ })).toHaveAttribute('aria-current', 'step');
  },
};

/** The end: the larger idea, and the way into the prototype with the tour's choices in it. */
export const Ended: Story = {
  args: { beat: BEATS.length - 1, ended: true },
  play: async ({ canvasElement }) => {
    const bar = within(canvasElement).getByRole('region', { name: 'Guided tour' });
    await waitFor(() => expect(within(bar).getByText('Simulated demo')).toBeVisible()); /* the bar fades in */
    await expect(within(bar).getByRole('button', { name: 'Explore the prototype' })).toBeVisible();
    await expect(within(bar).getByRole('button', { name: 'Replay' })).toBeVisible();
  },
};

/** The way in, featured on Discover: the stages it plays drawn under it, and one button. */
export const Feature: StoryObj = {
  render: () => (
    <div style={{ padding: 'var(--space-6)' }}>
      <TourFeature onStart={() => {}} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const feature = within(canvasElement).getByRole('region', { name: /Watch a designer orchestrate an agent/ });
    await expect(within(feature).getByRole('button', { name: 'Watch the tour' })).toBeVisible();
    await expect(within(feature).getAllByRole('button')).toHaveLength(1);
  },
};
