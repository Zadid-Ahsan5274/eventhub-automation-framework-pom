import { test, type Locator, type Page } from '@playwright/test';
import { env } from '../config/env';
import { BasePage } from './BasePage';

const NAME = "input[name='name'], input[name*='full' i], input#name, input[placeholder*='name' i]";
const EMAIL = "input[type='email'], input[name='email'], input#email, input[placeholder*='email' i]";
const CONFIRM = "input[name*='confirm' i], input[placeholder*='confirm' i], input#confirmPassword";
const PASSWORD =
  "input[type='password']:not([name*='confirm' i]):not([placeholder*='confirm' i])";
const SUBMIT =
  "button[type='submit'], button:has-text('register'), button:has-text('sign up'), button:has-text('create account')";
const ERROR =
  "[role='alert'], [data-testid*='error' i], .error, .error-message, .alert-danger, .text-red-500, .text-red-600, .toast, [class*='error' i]";
const LOGIN_LINK = "a[href*='login' i], a:has-text('login'), a:has-text('sign in')";
const SUCCESS_TEXT = /success|registered|account (has been )?created|welcome|check your email|verify/i;

export interface RegistrationOutcome {
  ok: boolean;
  reason: string;
}

export class RegisterPage extends BasePage {
  readonly name: Locator;
  readonly email: Locator;
  readonly password: Locator;
  readonly confirm: Locator;
  readonly submit: Locator;
  readonly error: Locator;
  readonly loginLink: Locator;

  constructor(page: Page) {
    super(page);
    this.name = this.loc(NAME);
    this.email = this.loc(EMAIL);
    this.password = this.loc(PASSWORD);
    this.confirm = this.loc(CONFIRM);
    this.submit = this.loc(SUBMIT);
    this.error = this.loc(ERROR);
    this.loginLink = this.loc(LOGIN_LINK);
  }

  /**
   * Prefer a submit button that lives inside a <form>, so a header/nav button
   * such as "Register" can never be clicked by mistake.
   */
  private async submitButton(): Promise<Locator> {
    const scoped = this.page.locator('form').locator(SUBMIT).first();
    return (await scoped.count()) > 0 ? scoped : this.submit;
  }

  async open(): Promise<this> {
    await test.step('Open registration page', async () => {
      await this.goto(env.paths.register);
      await this.email.waitFor({ state: 'visible', timeout: 15_000 });
    });
    return this;
  }

  async hasConfirmField(): Promise<boolean> {
    return (await this.page.locator(CONFIRM).count()) > 0;
  }

  async register(name: string, email: string, password: string, confirm: string = password): Promise<this> {
    await test.step(`Register user '${email}'`, async () => {
      if ((await this.page.locator(NAME).count()) > 0) await this.name.fill(name);
      await this.email.fill(email);
      await this.password.fill(password);
      if (await this.hasConfirmField()) await this.confirm.fill(confirm);
      await (await this.submitButton()).click();
    });
    return this;
  }

  async clickRegister(): Promise<void> {
    await test.step('Click register button', async () => {
      await (await this.submitButton()).click();
    });
  }

  async clickLoginLink(): Promise<void> {
    await test.step('Click login link', async () => {
      await this.loginLink.click();
    });
  }

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

  async hasLeftRegister(timeout = 10_000): Promise<boolean> {
    return this.waitForUrlNotContaining(env.paths.register, timeout);
  }

  async isStillOnRegister(): Promise<boolean> {
    return !(await this.hasLeftRegister(3_000));
  }

  /** Human-readable snapshot of what the page looks like right now (used in failure messages). */
  async describeState(): Promise<string> {
    const alerts = (await this.page.locator(ERROR).allInnerTexts().catch(() => [] as string[]))
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 5);
    const body = (await this.bodyText().catch(() => '')).replace(/\s+/g, ' ').trim().slice(0, 300);
    return `url=${this.page.url()} | visible messages=${JSON.stringify(alerts)} | page text="${body}"`;
  }

  /**
   * Registration counts as successful when the browser leaves the register route
   * OR a success message appears. Returns the reason either way (great for debugging).
   */
  async registrationOutcome(timeout = 15_000): Promise<RegistrationOutcome> {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      if (!this.page.url().includes(env.paths.register)) {
        return { ok: true, reason: `navigated to ${this.page.url()}` };
      }
      const success = this.page.getByText(SUCCESS_TEXT).first();
      if (await success.isVisible().catch(() => false)) {
        return { ok: true, reason: `success message: "${(await success.innerText().catch(() => '')).trim()}"` };
      }
      await this.page.waitForTimeout(250);
    }
    return { ok: false, reason: await this.describeState() };
  }
}