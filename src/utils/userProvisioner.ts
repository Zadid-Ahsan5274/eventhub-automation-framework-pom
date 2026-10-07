import type { Browser } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { env } from '../config/env';
import { RegisterPage } from '../pages/RegisterPage';
import type { TestUser } from '../types';
import { DataFactory } from './dataFactory';
import { createLogger } from './logger';

const log = createLogger('userProvisioner');

/**
 * Returns a valid account for the current worker.
 * - TEST_EMAIL / TEST_PASSWORD set  -> reuse that account (no registration needed)
 * - otherwise                       -> register a brand-new user through the UI
 */
export async function provisionUser(browser: Browser): Promise<TestUser> {
  if (env.testEmail && env.testPassword) {
    log.info(`Using configured test user ${env.testEmail}`);
    return { name: 'QA Automation', email: env.testEmail, password: env.testPassword };
  }

  const user = DataFactory.randomUser();
  const context = await browser.newContext({ baseURL: env.baseUrl, ignoreHTTPSErrors: true });
  try {
    const page = await context.newPage();
    const register = new RegisterPage(page);
    await register.open();
    await register.register(user.name, user.email, user.password);

    const outcome = await register.registrationOutcome(15_000);
    if (!outcome.ok) {
      const dir = path.resolve('test-results');
      fs.mkdirSync(dir, { recursive: true });
      const shot = path.join(dir, `provision-failure-${Date.now()}.png`);
      await page.screenshot({ path: shot, fullPage: true }).catch(() => undefined);
      throw new Error(
        `Auto-registration of ${user.email} was not confirmed.\n` +
          `  Page state: ${outcome.reason}\n` +
          `  Screenshot: ${shot}\n` +
          `  Quick fix: register once manually and set TEST_EMAIL / TEST_PASSWORD in .env, ` +
          `or run the diagnostics (INSPECT=true) and fix the RegisterPage locators.`,
      );
    }
    log.info(`Registered new test user ${user.email} (${outcome.reason})`);
  } finally {
    await context.close();
  }
  return user;
}