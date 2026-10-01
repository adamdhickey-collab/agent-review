import type { StorybookConfig } from '@storybook/react-vite';

/* The Storybook is three things at once: the place the system's states are
   inspected, the test runner for those states (addon-vitest renders every
   story in Chromium and addon-a11y runs axe on each), and a server an agent
   can read over MCP (addon-mcp, at /mcp on the dev server). The components
   manifest is what lets the MCP docs tools describe a component's props
   and stories without the agent reading the source. */
const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-vitest',
    '@storybook/addon-mcp',
  ],
  framework: '@storybook/react-vite',
  features: {
    componentsManifest: true,
  },
};
export default config;
