import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { ArchiveFlow } from './ArchiveFlow';

/* A batch that meets everything a direction can say: three active
   customers, a trial, and Monarch Dental Group, which can't be archived.
   The cycle's own batch is the case study's three (data/cycle.ts,
   STORY_BATCH); this one is wider so every state shows in one story. */
const BATCH = ['c_01HZK3', 'c_01HZK7', 'c_01HZKB', 'c_01HZKF', 'c_01HZKN'];

/* A quarterly cleanup with no active customer: two trials and two churned. */
const CLEANUP = ['c_01HZKB', 'c_01HZKV', 'c_01HZL3', 'c_01HZLB'];

const meta = {
  title: 'Product/ArchiveFlow',
  component: ArchiveFlow,
  parameters: {
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'Archiving customers, three ways: the design cycle’s three directions as working screens. Undo archives at once and offers Undo until the next action; Confirm asks first and names any active customer; Review sorts the selection into what can’t be archived, the active customers and the rest before anything happens. Five requirements can be added to any of them: name active customers first, name blocked ones first, an Archived view with Restore, who archived each one, and stop only for a batch with an active customer. Monarch Dental Group has an open invoice and can’t be archived, so each direction meets a partial failure.',
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

export const ReviewOnlyWhenActive: Story = {
  args: { direction: 'review', features: { onlyWhenActive: true }, initialSelection: BATCH, onEvent: fn(), onPhase: fn() },
  parameters: { docs: { description: { story: 'The case study’s call: the review, stopping only for a batch with an active customer. This batch has three, so Archive opens the review with them flagged, and Monarch Dental Group set aside.' } } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Archive' }));
    await expect(args.onPhase).toHaveBeenCalledWith('reviewing', 'Archive 4 customers');
    const review = within(canvasElement.querySelector<HTMLElement>('.archive-flow__review')!);
    await expect(review.getAllByRole('checkbox')).toHaveLength(3);
    await expect(review.getByText(/Monarch Dental Group/)).toBeVisible();
    await expect(args.onEvent).not.toHaveBeenCalled();
  },
};

export const ReviewSkippedForACleanup: Story = {
  args: { direction: 'review', features: { onlyWhenActive: true }, initialSelection: [...CLEANUP, 'c_01HZKF'], onEvent: fn() },
  parameters: { docs: { description: { story: 'The same build with a cleanup of two trial and two churned customers, and Monarch Dental Group. Nobody is active, so there is no review: the note names Monarch before the press, and one press archives the four, and the bar offers Undo, as undo’s does: a press that asked nothing needs a way back (rule 6). The review is the protection when there is something to say.' } } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvasElement.querySelector('.archive-flow__notes')).toHaveTextContent('Monarch Dental Group: it has an open invoice.');
    await userEvent.click(canvas.getByRole('button', { name: 'Archive' }));
    await expect(canvasElement.querySelector('.archive-flow__review')).toBeNull();
    await expect(canvasElement.querySelector('.archive-flow__result')).toHaveTextContent('4 customers archived. Monarch Dental Group wasn’t: it has an open invoice.');
    await expect(canvas.getByRole('button', { name: 'Undo' })).toHaveFocus();
    await expect(args.onEvent).toHaveBeenCalledWith('archived');
    await expect(args.onEvent).not.toHaveBeenCalledWith('active-archived');
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
