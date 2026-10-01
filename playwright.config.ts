import { defineConfig, devices } from '@playwright/test';

/* Visual baselines and the viewport check, against the Vite dev server.
   Screenshots are compared to tests/__screenshots__/ (committed). A
   change that moves pixels fails here and says where, which is what
   "visual regression" means in this repository: the mechanism, in the
   open, with no service behind it.

   Fonts: Inter is loaded from Google Fonts by the page; the tests wait
   for document.fonts.ready so a baseline is not taken in the fallback. */
export default defineConfig({
  testDir: './tests',
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}{ext}',
  fullyParallel: true,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.002, animations: 'disabled' },
  },
  use: {
    baseURL: 'http://localhost:5173/agent-review/',
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
    deviceScaleFactor: 1,
  },
  webServer: {
    command: 'npm run dev -- --port 5173 --strictPort',
    url: 'http://localhost:5173/agent-review/',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
