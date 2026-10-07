import { test as base, type ConsoleMessage } from '@playwright/test';
import * as allure from 'allure-js-commons';
import fs from 'node:fs';
import path from 'node:path';
import { env } from '../config/env';
import { BookingPage } from '../pages/BookingPage';
import { EventDetailPage } from '../pages/EventDetailPage';
import { EventsPage } from '../pages/EventsPage';
import { LoginPage } from '../pages/LoginPage';
import { MyBookingsPage } from '../pages/MyBookingsPage';
import { RegisterPage } from '../pages/RegisterPage';
import { NavBar } from '../pages/components/NavBar';
import type { TestUser } from '../types';
import { createLogger } from '../utils/logger';
import { provisionUser } from '../utils/userProvisioner';

const log = createLogger('fixtures');

interface PageFixtures {
  loginPage: LoginPage;
  registerPage: RegisterPage;
  eventsPage: EventsPage;
  eventDetailPage: EventDetailPage;
  bookingPage: BookingPage;
  myBookingsPage: MyBookingsPage;
  navBar: NavBar;
  /** auto fixture: Allure labels + failure diagnostics */
  allureAndDiagnostics: void;
}

interface WorkerFixtures {
  /** One valid account per worker (registered via UI, or taken from TEST_EMAIL/TEST_PASSWORD). */
  testUser: TestUser;
  /** Path to a storageState file holding that user's logged-in session. */
  workerStorageState: string;
}

/** Guest (unauthenticated) test. */
export const test = base.extend<PageFixtures, WorkerFixtures>({
  // ---------- worker-scoped ----------
  testUser: [
    async ({ browser }, use) => {
      await use(await provisionUser(browser));
    },
    { scope: 'worker' },
  ],

  workerStorageState: [
    async ({ browser, testUser }, use, workerInfo) => {
      const dir = path.resolve('.auth');
      fs.mkdirSync(dir, { recursive: true });
      const file = path.join(dir, `worker-${workerInfo.parallelIndex}.json`);

      const context = await browser.newContext({ baseURL: env.baseUrl, ignoreHTTPSErrors: true });
      try {
        const page = await context.newPage();
        const login = new LoginPage(page);
        await login.open();
        await login.login(testUser.email, testUser.password);
        if (!(await login.isLoggedIn(15_000))) {
          throw new Error(`Could not log in as ${testUser.email} to create the shared session.`);
        }
        await context.storageState({ path: file });
        log.info(`Saved session for worker ${workerInfo.parallelIndex}`);
      } finally {
        await context.close();
      }
      await use(file);
    },
    { scope: 'worker' },
  ],

  // ---------- page objects ----------
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  registerPage: async ({ page }, use) => use(new RegisterPage(page)),
  eventsPage: async ({ page }, use) => use(new EventsPage(page)),
  eventDetailPage: async ({ page }, use) => use(new EventDetailPage(page)),
  bookingPage: async ({ page }, use) => use(new BookingPage(page)),
  myBookingsPage: async ({ page }, use) => use(new MyBookingsPage(page)),
  navBar: async ({ page }, use) => use(new NavBar(page)),

  // ---------- auto: Allure labels + diagnostics ----------
  allureAndDiagnostics: [
    async ({ page }, use, testInfo) => {
      const consoleErrors: string[] = [];
      const onConsole = (msg: ConsoleMessage) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      };
      page.on('console', onConsole);

      await allure.epic('EventHub');
      for (const a of testInfo.annotations) {
        if (a.type === 'feature' && a.description) await allure.feature(a.description);
        if (a.type === 'story' && a.description) await allure.story(a.description);
        if (a.type === 'severity' && a.description) await allure.severity(a.description);
      }

      await use();

      page.off('console', onConsole);
      if (testInfo.status !== testInfo.expectedStatus) {
        await testInfo.attach('page-url', { body: page.url(), contentType: 'text/plain' }).catch(() => undefined);
        if (consoleErrors.length > 0) {
          await testInfo
            .attach('browser-console-errors', { body: consoleErrors.join('\n'), contentType: 'text/plain' })
            .catch(() => undefined);
        }
      }
    },
    { auto: true },
  ],
});

/** Same fixtures, but the browser context starts already logged in as the worker's user. */
export const authTest = test.extend({
  storageState: async ({ workerStorageState }, use) => {
    await use(workerStorageState);
  },
});

export { expect } from '@playwright/test';