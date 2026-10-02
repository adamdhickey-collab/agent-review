import type { Preview } from '@storybook/react-vite';
import '../src/app/global.css';

/* The preview is the product's own canvas: the same tokens, the same base
   stylesheet, the same fonts. A story that looks right here looks right in
   the app, which is the point of having one.

   a11y is `error`: an axe violation fails the story's test run. That is
   the rule in skills/ui-quality/SKILL.md ("accessibility regressions are
   blocking") made executable. */
const preview: Preview = {
  parameters: {
    layout: 'padded',
    backgrounds: { disable: true },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'error',
      /* axe runs WCAG 2.0 and 2.1 A and AA by default; target size is the
         WCAG 2.2 AA rule (2.5.8) and is off unless asked for. Switching on
         the one rule keeps every default, and a target under 24px that has
         another target inside its 24px circle now fails a story. */
      options: { rules: { 'target-size': { enabled: true } } },
    },
    options: {
      storySort: {
        order: ['System', ['Tokens', 'Button', 'IconButton', 'Badge', 'StatusIndicator', 'TestStatus', 'Checkbox', 'SegmentedControl', 'Tabs', 'Disclosure', 'Table', 'Toolbar', 'States'], 'Product', 'Review'],
      },
    },
  },
  decorators: [
    (Story) => (
      <>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" />
        <Story />
      </>
    ),
  ],
};

export default preview;
