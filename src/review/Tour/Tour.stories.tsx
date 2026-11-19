import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
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
    await expect(within(bar).queryByText('The designer decides')).toBeNull();
    await expect(within(bar).getByRole('button', { name: 'Narration' })).toHaveAttribute('aria-pressed', 'true');
    await expect(within(bar).getByRole('button', { name: 'Speed 1×' })).toBeVisible();
    await expect(within(bar).getByRole('combobox', { name: 'Voice' })).toBeVisible();
  },
};

/** A beat where the designer decides: labeled, with its reasoning under the line. */
export const Decision: Story = {
  args: { beat: 6 },
  play: async ({ canvasElement }) => {
    const bar = within(canvasElement).getByRole('region', { name: 'Guided tour' });
    await waitFor(() => expect(within(bar).getByText('Simulated demo')).toBeVisible()); /* the bar fades in */
    await expect(within(bar).getByText('The designer decides')).toBeVisible();
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
    const feature = within(canvasElement).getByRole('region', { name: /Watch an agent do the work/ });
    await expect(within(feature).getByRole('button', { name: 'Watch the tour' })).toBeVisible();
    await expect(within(feature).getAllByRole('button')).toHaveLength(1);
  },
};
