import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { bulkActions } from '../../data/scenario';
import type { Reproduce } from '../../data/types';
import { ComponentPreview } from './ComponentPreview';

function reproduce(findingId: string): Reproduce {
  const f = bulkActions.findings.find((x) => x.id === findingId);
  /* globalThis, because a story below is named Error and shadows the global in this module. */
  if (!f?.reproduce) throw new globalThis.Error(`The bulk-actions change has no reproducible finding ${findingId}`);
  return f.reproduce;
}

const meta = {
  title: 'Review/ComponentPreview',
  component: ComponentPreview,
  parameters: {
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'The affected product screen, rendered rather than pictured. The frame is the chosen viewport wide and scales down to fit its column, so choosing 768 shows the layout a tablet gets and the overflow it gets, not a desktop layout squeezed. Before and after are the baseline and the agent’s branch from code, and the frame’s content is operable: a reviewer can tab into it and select rows. A selected finding hands the preview a reproduce instruction, and the controls follow it to the screen, the side, the width and the selection state that show the finding, with its element outlined. While the branch is still building or has failed to, the frame gives way to the system’s LoadingState or ErrorState, so the preview never shows a baseline and lets it pass for the branch.',
      },
    },
  },
} satisfies Meta<typeof ComponentPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: { description: { story: 'No finding selected: the customers screen, the after side, at 1280. The screen switch shows because the change touched both screens.' } },
  },
};

export const ReproducingOverflow: Story = {
  args: { reproduce: reproduce('f-overflow') },
  parameters: {
    docs: { description: { story: 'The overflow finding: the customers screen on the after side at 768, with rows selected so the bulk-action bar shows, and the bar as the target. The width is what makes the finding visible.' } },
  },
};

export const ReproducingInvoices: Story = {
  args: { reproduce: reproduce('f-shared-padding') },
  parameters: {
    docs: { description: { story: 'The shared-padding finding, which is about a screen the agent did not touch: the preview switches to Invoices and outlines its actions.' } },
  },
};

export const NarrowColumn: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: 480 }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: { description: { story: 'The Default preview in a 480px column. The 1280 frame scales to fit and the bar says at what percentage, so the width being shown is never mistaken for the width of the column.' } },
  },
};

export const WithNote: Story = {
  args: { note: 'The agent’s branch has not been loaded into this build; the After side shows the baseline.' },
  parameters: {
    docs: { description: { story: 'A note above the frame, in the warning tone. The screen uses it to say when the after side is not really the branch.' } },
  },
};

export const Loading: Story = {
  args: { status: { kind: 'loading' } },
  parameters: {
    docs: { description: { story: 'The branch is still building. The controls stay so the reviewer can set up the view; the frame is a LoadingState.' } },
  },
};

export const Error: Story = {
  args: {
    status: {
      kind: 'error',
      message: 'vite build exited with code 1',
      detail: 'src/product/customers/BulkActionBar.tsx(14,9): error TS2322',
      onRetry: fn(),
    },
  },
  parameters: {
    docs: { description: { story: 'The build failed. An ErrorState with the message, the compiler’s own line in mono for whoever can use it, and a retry.' } },
  },
};

export const KeyboardViewport: Story = {
  parameters: {
    docs: { description: { story: 'Focuses the checked viewport option and presses ArrowRight. The width moves from 1280 to 1024, and the frame with it.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = within(canvas.getByRole('radiogroup', { name: 'Viewport width' }));
    const checked = group.getByRole('radio', { checked: true });
    await expect(checked).toHaveAccessibleName('Desktop, 1280');
    checked.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(group.getByRole('radio', { name: 'Laptop, 1024' })).toHaveAttribute('aria-checked', 'true');
    await expect(group.getByRole('radio', { name: 'Desktop, 1280' })).toHaveAttribute('aria-checked', 'false');
    await expect(canvas.getByText('1024px')).toBeInTheDocument();
  },
};
