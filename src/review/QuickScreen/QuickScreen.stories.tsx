import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { About, Compare, Decision, Start } from './QuickScreen';

const meta = {
  title: 'Review/QuickScreen',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The quick path in front of the design cycle: the problem, the three working fixes, the decision, and the experiment as depth. Built from the cycle’s own parts (the Product frame, ArchiveFlow, the later-run panel) and the system’s components; it reads no cycle state and writes none.',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const TheProblem: Story = {
  render: () => <Start />,
  parameters: { docs: { description: { story: 'The front door: the mistake in a heading, the selection that caused it as Relay draws it (a picture, out of reach, with its words for a screen reader), and one primary action.' } } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('A paying customer was archived by mistake.');
    await expect(canvas.getByText(/Three customers are selected to archive: Alder & Finch, Trial; Northside Trucking, Active; Juniper Foods, Churned\./)).toBeInTheDocument();
    await expect(canvas.getByText('Archiving this selection also removes a paying customer from the list.')).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Compare the fixes' })).toBeVisible();
    await expect(canvas.getByRole('link', { name: 'Explore the full design process' })).toHaveAttribute('href', '#/cycle/discover');
    /* The picture takes no press and no focus. */
    await expect(canvas.queryAllByRole('checkbox')).toHaveLength(0);
  },
};

export const UndoAfterward: Story = {
  render: () => <Compare fix="undo" />,
  parameters: { docs: { description: { story: 'The first fix, working: Archive acts at once, the bar counts what left, and Undo puts all three back.' } } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('tab', { name: 'Undo afterward' })).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByText('Cleanup stays fast. Someone has to notice the mistake.')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Archive' }));
    await expect(canvas.getByRole('toolbar', { name: 'Last action' })).toHaveTextContent('3 of 8 customers archived.');
    await userEvent.click(canvas.getByRole('button', { name: 'Undo' }));
    await expect(canvas.queryByRole('toolbar', { name: 'Last action' })).toBeNull();
    await expect(canvas.getByText(/All three passed the automated checks\./)).toBeVisible();
  },
};

export const ConfirmFirst: Story = {
  render: () => <Compare fix="confirm" />,
  parameters: { docs: { description: { story: 'The second fix: Archive asks first and names Northside Trucking. Cancel keeps the selection.' } } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Archive' }));
    const ask = within(canvas.getByRole('alertdialog'));
    await expect(canvas.getByRole('alertdialog')).toHaveTextContent('1 is active: Northside Trucking.');
    await userEvent.click(ask.getByRole('button', { name: 'Cancel' }));
    await expect(canvas.queryByRole('alertdialog')).toBeNull();
    await expect(canvas.getByRole('toolbar', { name: 'Selected customers' })).toHaveTextContent('3 of 8 customers selected');
  },
};

export const ReviewTheBatch: Story = {
  render: () => <Compare fix="review" />,
  parameters: { docs: { description: { story: 'The third fix: Archive opens a review. Clearing Northside Trucking’s box keeps it, and the rest are archived.' } } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Archive' }));
    await userEvent.click(canvas.getByRole('checkbox', { name: /Northside Trucking, \$5,040 a month/ }));
    await userEvent.click(canvas.getByRole('button', { name: 'Archive 2 customers' }));
    await expect(canvas.getByRole('toolbar', { name: 'Last action' })).toHaveTextContent('2 of 8 customers archived.');
  },
};

export const DecisionWithAnActiveCustomer: Story = {
  render: () => <Decision batch="active" />,
  parameters: { docs: { description: { story: 'The chosen behavior on the selection with Northside Trucking in it: the review opens and names it. Marked a design hypothesis, with what archiving does and doesn’t do, and the rule it becomes.' } } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('Ask for review when an active customer is included.');
    await expect(canvas.getByRole('radio', { name: 'Active customer included' })).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(canvas.getByRole('button', { name: 'Archive' }));
    await expect(canvas.getByRole('heading', { name: 'Review 3 customers before archiving' })).toBeVisible();
    await expect(canvas.getByRole('checkbox', { name: /Northside Trucking, \$5,040 a month/ })).toBeChecked();
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));
    await expect(canvas.getByRole('toolbar', { name: 'Selected customers' })).toHaveTextContent('3 of 8 customers selected');
    await expect(canvas.getByText('Design hypothesis')).toBeVisible();
    await expect(canvas.getByText(/this prototype has no restore screen/)).toBeVisible();
    await userEvent.click(canvas.getByText('Save the rule for customer screens (simulated)'));
    await expect(canvas.getByText('Follows the rule')).toBeVisible();
  },
};

export const DecisionOnARoutineCleanup: Story = {
  render: () => <Decision batch="routine" />,
  parameters: { docs: { description: { story: 'The same behavior on a selection with nobody active: one press, with Undo.' } } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('radio', { name: 'No active customers' })).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(canvas.getByRole('button', { name: 'Archive' }));
    await expect(canvas.queryByRole('heading', { name: /before archiving/ })).toBeNull();
    await expect(canvas.getByRole('toolbar', { name: 'Last action' })).toHaveTextContent('3 of 8 customers archived.');
    await userEvent.click(canvas.getByRole('button', { name: 'Undo' }));
    await expect(canvas.getByRole('status')).toHaveTextContent('Undone: 3 customers in the table again.');
  },
};

export const AboutTheExperiment: Story = {
  render: () => <About />,
  parameters: { docs: { description: { story: 'The experiment, off the front door: the two agent runs and the faulty fixture set apart from the three archive fixes, the three findings, and the evidence.' } } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const findings = within(canvas.getByRole('region', { name: 'What the experiment showed' }));
    await expect(findings.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'The agents already built good screens.',
      'The rules made the work complete.',
      'Passing the checks didn’t settle what ships.',
    ]);
    await expect(canvas.getByText(/That third version is a test fixture, not a fix\./)).toBeVisible();
    await expect(canvas.getByRole('link', { name: /The full experiment record/ })).toHaveAttribute('href', expect.stringContaining('docs/experiment/README.md'));
    await expect(canvas.getByRole('link', { name: /The component catalog, in Storybook/ })).toBeVisible();
    await expect(canvas.getByRole('link', { name: /The source, on GitHub/ })).toBeVisible();
  },
};
