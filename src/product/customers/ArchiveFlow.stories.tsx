import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { ArchiveFlow } from './ArchiveFlow';

/* The batch every direction is tried with in the design cycle: three active
   customers, a trial, and Monarch Dental Group, which can't be archived. */
const BATCH = ['c_01HZK3', 'c_01HZK7', 'c_01HZKB', 'c_01HZKF', 'c_01HZKN'];

const meta = {
  title: 'Product/ArchiveFlow',
  component: ArchiveFlow,
  parameters: {
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'Archiving customers, three ways: the design cycle’s three directions as working screens. Undo archives at once and offers Undo until the next action; Confirm asks first and names any active customer; Review sorts the selection into what can’t be archived, the active customers and the rest before anything happens. Four requirements can be added to any of them: name active customers first, name blocked ones first, an Archived view with Restore, and who archived each one. Monarch Dental Group has an open invoice and can’t be archived, so each direction meets a partial failure.',
      },
    },
  },
} satisfies Meta<typeof ArchiveFlow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Undo: Story = {
  args: { direction: 'undo', initialSelection: BATCH, onEvent: fn(), onPhase: fn() },
  parameters: { docs: { description: { story: 'Archive acts at once. The bar says what left and that Monarch Dental Group didn’t, and Undo takes focus; Undo puts the four back. onPhase reports the batch selected with Archive as the next press, then done with none.' } } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(args.onPhase).toHaveBeenCalledWith('selected', 'Archive');
    await expect(canvas.getByRole('button', { name: 'Archive' })).toHaveAttribute('data-next');
    await userEvent.click(canvas.getByRole('button', { name: 'Archive' }));
    await expect(args.onPhase).toHaveBeenCalledWith('done', null);
    await expect(canvasElement.querySelector('.archive-flow__result')).toHaveTextContent('4 customers archived. Monarch Dental Group wasn’t: it has an open invoice.');
    await expect(canvas.getByRole('button', { name: 'Undo' })).toHaveFocus();
    await expect(args.onEvent).toHaveBeenCalledWith('archived');
    await expect(args.onEvent).toHaveBeenCalledWith('blocked');
    await expect(args.onEvent).toHaveBeenCalledWith('active-archived');
    await userEvent.click(canvas.getByRole('button', { name: 'Undo' }));
    await expect(canvas.getAllByRole('row')).toHaveLength(13);
    await expect(args.onEvent).toHaveBeenCalledWith('undone');
  },
};

export const UndoNamingActive: Story = {
  args: { direction: 'undo', initialSelection: BATCH, features: { namesActive: true, blockedFirst: true } },
  parameters: { docs: { description: { story: 'Undo with two requirements added, before the press: the active customers’ rows are shaded, and the blocked one is named under the bar with its reason.' } } },
  play: async ({ canvasElement }) => {
    const notes = canvasElement.querySelector('.archive-flow__notes');
    await expect(notes).not.toHaveTextContent('in this selection');
    await expect(notes).toHaveTextContent('Monarch Dental Group: it has an open invoice.');
    const shaded = [...canvasElement.querySelectorAll('.archive-flow__row--active th')].map((th) => th.textContent);
    await expect(shaded).toEqual(['Halvorsen Freight', 'Brightwater Clinics', 'Saltmarsh Studio']);
  },
};

export const Confirm: Story = {
  args: { direction: 'confirm', initialSelection: BATCH, initialStep: true },
  parameters: { docs: { description: { story: 'The question names the active customers. It offers all five, because without the blocked-first requirement the screen learns about Monarch Dental Group only when the archive fails.' } } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvasElement.querySelector('.archive-flow__question')).toHaveTextContent('Archive 5 customers? Halvorsen Freight, Brightwater Clinics and Saltmarsh Studio are active.');
    await expect(canvas.getByRole('button', { name: 'Archive 5 customers' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await expect(canvas.getByRole('button', { name: 'Archive' })).toBeVisible();
  },
};

export const ConfirmRecentlyActive: Story = {
  args: { direction: 'confirm', initialSelection: BATCH, initialStep: true, activeRule: 'recent' },
  parameters: { docs: { description: { story: 'The agent’s question in Delegate, answered the other way: active means any activity in the last week, so the trial is named too.' } } },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('.archive-flow__question')).toHaveTextContent('Alder & Finch');
  },
};

export const Review: Story = {
  args: { direction: 'review', initialSelection: BATCH, initialStep: true, onPhase: fn() },
  parameters: { docs: { description: { story: 'The review: Monarch Dental Group can’t be archived and stays, the three active customers each have a box, and clearing one keeps it out of the batch. The next press is the review’s Archive, and its label follows the boxes.' } } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { name: 'Review 5 customers before archiving' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Archive 4 customers' })).toHaveFocus();
    await expect(args.onPhase).toHaveBeenCalledWith('reviewing', 'Archive 4 customers');
    const review = within(canvasElement.querySelector<HTMLElement>('.archive-flow__review')!);
    await userEvent.click(review.getByRole('checkbox', { name: /Halvorsen Freight/ }));
    await expect(canvas.getByRole('button', { name: 'Archive 3 customers' })).toHaveAttribute('data-next');
    await expect(args.onPhase).toHaveBeenCalledWith('reviewing', 'Archive 3 customers');
  },
};

export const ArchivedView: Story = {
  args: { direction: 'undo', features: { restore: true, who: true }, initialArchived: ['c_01HZL3', 'c_01HZLB'], initialView: 'archived' },
  parameters: { docs: { description: { story: 'The Archived view, with who archived each customer, and Restore.' } } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByText('By you, just now')).toHaveLength(2);
    await userEvent.click(canvas.getByRole('button', { name: 'Restore Juniper Foods' }));
    await expect(canvas.queryByRole('button', { name: 'Restore Juniper Foods' })).toBeNull();
  },
};

export const NothingArchived: Story = {
  args: { direction: 'review', features: { restore: true }, initialView: 'archived' },
  parameters: { docs: { description: { story: 'The Archived view, empty.' } } },
};
