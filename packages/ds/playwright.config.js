/**
 * The accessibility tests of the design system (tests/*.test.a11y.js), with Playwright Test: they render in the Chromium
 * of Playwright's Docker image (tests/docker-browser.js), so that the screenshots are the same on every computer and in
 * CI. Docker is needed.
 *
 * Usage: pnpm --filter @dume/ds build && pnpm --filter @dume/ds test:a11y [--update-snapshots]
 */
import process from 'node:process';
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  testMatch: '*.test.a11y.js',
  // The reference screenshots, named after the test's argument: tests/screenshots/light.png
  snapshotPathTemplate: '{testDir}/screenshots/{arg}{ext}',
  globalSetup: './tests/docker-browser.js',
  forbidOnly: Boolean(process.env.CI),
  reporter: 'list',
  use: { viewport: { width: 1200, height: 600 } },
});
