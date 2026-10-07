import { test, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

const NAME = "input[name*='name' i], input[placeholder*='name' i]";
const EMAIL = "input[type='email'], input[name*='email' i], input[placeholder*='email' i]";
const PHONE = "input[type='tel'], input[name*='phone' i], input[placeholder*='phone' i]";
const QUANTITY =
  "input[type='number'], input[name*='quantity' i], input[name*='ticket' i], input[name*='seat' i]";
const SUBMIT =
  "form button[type='submit'], button:has-text('confirm'), button:has-text('submit'), button:has-text('book now')";
const ERROR =
  "[role='alert'], [data-testid*='error' i], .error, .error-message, .alert-danger, .text-red-500, .text-red-600, [class*='error' i]";
const SUCCESS = /confirmed|success|booked|thank you/i;

/** Booking form (page or modal) reached from an event's details. */
export class BookingPage extends BasePage {
  readonly name: Locator;
  readonly email: Locator;
  readonly phone: Locator;
  readonly quantity: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.name = this.loc(NAME);
    this.email = this.loc(EMAIL);
    this.phone = this.loc(PHONE);
    this.quantity = this.loc(QUANTITY);
    this.submitButton = this.loc(SUBMIT);
  }

  private async has(selector: string): Promise<boolean> {
    return (await this.page.locator(selector).count()) > 0;
  }

  async isFormVisible(): Promise<boolean> {
    return (
      (await this.visible(this.submitButton, 8_000)) &&
      ((await this.has(EMAIL)) || (await this.has(NAME)) || (await this.has(QUANTITY)))
    );
  }

  async hasQuantityField(): Promise<boolean> {
    return this.has(QUANTITY);
  }

  async fillDetails(name: string, email: string, phone: string, quantity?: number): Promise<this> {
    await test.step(`Fill booking form for ${email}`, async () => {
      if (await this.has(NAME)) await this.name.fill(name);
      if (await this.has(EMAIL)) await this.email.fill(email);
      if (await this.has(PHONE)) await this.phone.fill(phone);
      if (quantity !== undefined && (await this.has(QUANTITY))) await this.quantity.fill(String(quantity));
    });
    return this;
  }

  async submit(): Promise<void> {
    await test.step('Submit booking form', async () => {
      await this.submitButton.click();
      await this.settle();
    });
  }

  async isSuccessDisplayed(timeout = 8_000): Promise<boolean> {
    try {
      await this.page.getByText(SUCCESS).first().waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  async isErrorDisplayed(): Promise<boolean> {
    return this.visible(this.loc(ERROR));
  }

  async isEmailInvalidByBrowser(): Promise<boolean> {
    if (!(await this.has(EMAIL))) return false;
    return this.email.evaluate((el) => {
      const input = el as HTMLInputElement;
      return input.validity ? !input.validity.valid : false;
    });
  }
}