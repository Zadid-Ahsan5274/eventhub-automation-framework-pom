import type { Browser } from '@playwright/test';
import { env } from '../config/env';
import { RegisterPage } from '../pages/RegisterPage';
import type { TestUser } from '../types';
import { DataFactory } from './dataFactory';
import { createLogger } from './logger';

const log = createLogger('userProvisioner');

/**
 * Returns a valid account for the current worker.
 * - TEST_EMAIL / TEST_PASSWORD set  -> reuse that account
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
    const ok = await register.hasLeftRegister(15_000);
    if (!ok) {
      throw new Error(`Auto-registration of ${user.email} did not leave the register page. Verify the RegisterPage locators.`);
    }
    log.info(`Registered new test user ${user.email}`);
  } finally {
    await context.close();
  }
  return user;
}