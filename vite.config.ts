/// <reference types="vitest/config" />
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/* `base` is the GitHub Pages path for this repository. The build is served
   at adamdhickey-collab.github.io/agent-review/, and the Storybook build
   lands under dist/storybook/ so one artifact carries both. Locally,
   `vite dev` serves at /agent-review/ too, so a path that works here works
   there. */
export default defineConfig({
  base: '/agent-review/',
  plugins: [react()],
  test: {
    projects: [
      {
        extends: true,
        plugins: [storybookTest({ configDir: path.join(dirname, '.storybook') })],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
          setupFiles: ['.storybook/vitest.setup.ts'],
        },
      },
    ],
  },
});
