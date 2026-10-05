import type { Preview } from '@storybook/react-vite';
import '../src/app/global.css';
import { IconSetContext } from '../src/components';

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
  /* The theme, in the toolbar. Light unless a story or the toolbar says
     dark: the Storybook never follows the system setting, so a story looks
     the same on every machine and in the test run. A story that exists to
     show the dark theme sets `globals: { theme: 'dark' }`. */
  globalTypes: {
    theme: {
      description: 'The review’s theme',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'light' },
  decorators: [
    /* Each story on the surface it belongs to (app/global.css): the review's
       stories on the review's, the product's on the product's. The wrapper
       draws nothing, so a story's layout is the one it had. The theme goes
       on the root, where the app puts it, so the page behind the story
       takes it too; the product's stories are always light, as the product
       is in the review's frame. */
    (Story, context) => {
      const product = context.title.startsWith('Product/');
      document.documentElement.dataset.theme = product ? 'light' : context.globals.theme === 'dark' ? 'dark' : 'light';
      return (
        <>
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&family=Inter:opsz,wght@14..32,400..600&display=swap" />
          <div style={{ display: 'contents' }} data-surface={context.title.startsWith('Review/') ? 'review' : product ? 'product' : undefined}>
            <IconSetContext.Provider value={product ? 'product' : 'review'}>
              <Story />
            </IconSetContext.Provider>
          </div>
        </>
      );
    },
  ],
};

export default preview;
