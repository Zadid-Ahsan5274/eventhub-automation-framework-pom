import { test, type Locator, type Page } from '@playwright/test';
import { env } from '../config/env';
import { BasePage } from './BasePage';

// ---------- locators (single place to tune) ----------
const EMAIL = "input[type='email'], input[name='email'], input#email, input[placeholder*='email' i]";
const PASSWORD = "input[type='password']";
const SUBMIT = "button[type='submit'], button:has-text('login'), button:has-text('sign in')";
const ERROR =
  "[role='alert'], [data-testid*='error' i], .error, .error-message, .alert-danger, .text-red-500, .text-red-600, .toast, [class*='error' i]";
const REGISTER_LINK =
  "a[href*='register' i], a[href*='signup' i], a:has-text('register'), a:has-text('sign up')";
const HEADING = "h1, h2, h3, [role='heading'], [class*='title' i]";

export class LoginPage extends BasePage {
  readonly email: Locator;
  readonly password: Locator;
  readonly submit: Locator;
  readonly error: Locator;
  readonly registerLink: Locator;
  readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    this.email = this.loc(EMAIL);
    this.password = this.loc(PASSWORD);
    this.submit = this.loc(SUBMIT);
    this.error = this.loc(ERROR);
    this.registerLink = this.loc(REGISTER_LINK);
    this.heading = this.loc(HEADING);
  }

  /** Prefer a submit button inside a <form> so a nav "Login" button is never clicked by mistake. */
  private async submitButton(): Promise<Locator> {
    const scoped = this.page.locator('form').locator(SUBMIT).first();
    return (await scoped.count()) > 0 ? scoped : this.submit;
  }

  async open(): Promise<this> {
    await test.step('Open login page', async () => {
      await this.goto(env.paths.login);
      await this.email.waitFor({ state: 'visible', timeout: 15_000 });
    });
    return this;
  }

  async login(email: string, password: string): Promise<this> {
    await test.step(`Login as '${email}'`, async () => {
      await this.email.fill(email);
      await this.password.fill(password);
      await (await this.submitButton()).click();
    });
    return this;
  }

  async typeCredentials(email: string, password: string): Promise<this> {
    await this.email.fill(email);
    await this.password.fill(password);
    return this;
  }

  async submitWithEnter(): Promise<void> {
    await test.step('Submit login form with Enter key', async () => {
      await this.password.press('Enter');
    });
  }

  async clickLogin(): Promise<void> {
    await test.step('Click login button', async () => {
      await (await this.submitButton()).click();
    });
  }

  async clickRegisterLink(): Promise<void> {
    await test.step("Click 'Register' link", async () => {
      await this.registerLink.click();
    });
  }

  // ---------- state ----------
  async isFormDisplayed(): Promise<boolean> {
    return (
      (await this.visible(this.email)) && (await this.visible(this.password)) && (await this.visible(this.submit))
    );
  }

  async passwordFieldType(): Promise<string | null> {
    return this.password.getAttribute('type');
  }

  async isErrorDisplayed(): Promise<boolean> {
    return this.visible(this.error);
  }

  /** True once the browser has left the login route (authentication succeeded). */
  async isLoggedIn(timeout = 10_000): Promise<boolean> {
    return this.waitForUrlNotContaining(env.paths.login, timeout);
  }

  async isStillOnLogin(): Promise<boolean> {
    return !(await this.isLoggedIn(3_000));
  }
}