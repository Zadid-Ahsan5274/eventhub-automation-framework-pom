import { defineConfig, devices, type ReporterDescription } from '@playwright/test';
import { env } from './src/config/env';

const reporters: ReporterDescription[] = [
  ['list'],
  ['html', { open: 'never', outputFolder: 'playwright-report' }],
  [
    'allure-playwright',
    {
      resultsDir: 'allure-results',
      detail: true,
      suiteTitle: true,
      environmentInfo: {
        base_url: env.baseUrl,
        node: process.version,
        os: process.platform,
      },
    },
  ],
];
if (env.isCI) reporters.push(['github']);

export default defineConfig({
  testDir: './tests',
  outputDir: 'test-results',
  fullyParallel: true,
  forbidOnly: env.isCI,
  retries: env.retries,
  workers: env.workers,
  timeout: env.timeouts.test,
  expect: { timeout: env.timeouts.expect },
  reporter: reporters,

  use: {
    baseURL: env.baseUrl,
    headless: env.headless,
    viewport: env.viewport,
    actionTimeout: env.timeouts.action,
    navigationTimeout: env.timeouts.navigation,
    ignoreHTTPSErrors: true,
    locale: 'en-US',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: env.viewport } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'], viewport: env.viewport } },
    { name: 'webkit', use: { ...devices['Desktop Safari'], viewport: env.viewport } },
  ],
});