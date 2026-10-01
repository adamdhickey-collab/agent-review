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
  /* Baselines are per platform: Chromium on macOS and on Linux rasterise
     text differently enough to fail a 0.2% threshold, so the Linux set
     CI compares against is recorded by CI (.github/workflows/baselines.yml)
     and committed beside the macOS set a person records locally. */
  snapshotPathTemplate: '{testDir}/__screenshots__/{platform}/{testFilePath}/{arg}{ext}',
  fullyParallel: true,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.002, animations: 'disabled' },
  },
  use: {
    baseURL: 'http://localhost:4173/agent-review/',
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
    deviceScaleFactor: 1,
  },
  /* The tests always start their own server, on a port nothing else uses,
     for the tree they are run in. `reuseExistingServer` was true on 5173
     until the experiment's first visual run found a dev server from a
     different checkout on that port and measured the wrong tree, passing.
     A test that can pass against someone else's tree is not a test. */
  webServer: {
    command: 'npm run dev -- --port 4173 --strictPort',
    url: 'http://localhost:4173/agent-review/',
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
