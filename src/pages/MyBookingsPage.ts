import { test, type Locator, type Page } from '@playwright/test';
import { env } from '../config/env';
import { BasePage } from './BasePage';

const ROW =
  "[data-testid*='booking' i], [class*='booking-card' i], [class*='booking-item' i], table tbody tr, main article";
const CANCEL = "button:has-text('cancel'), a:has-text('cancel')";
const CONFIRM_DIALOG_BTN =
  "[role='dialog'] button:has-text('confirm'), [role='dialog'] button:has-text('yes'), [role='alertdialog'] button:has-text('confirm'), [role='alertdialog'] button:has-text('yes')";
const HEADING = 'h1, h2';

export class MyBookingsPage extends BasePage {
  readonly rows: Locator;
  readonly heading: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.rows = page.locator(ROW);
    this.heading = this.loc(HEADING);
    this.cancelButton = this.loc(CANCEL);
  }

  async open(): Promise<this> {
    await test.step('Open My Bookings page', async () => {
      await this.goto(env.paths.bookings);
      await this.heading.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => undefined);
      await this.settle();
    });
    return this;
  }

  async isLoaded(): Promise<boolean> {
    return (await this.visible(this.heading, 8_000)) && (await this.waitForUrlContaining('booking', 3_000));
  }

  async count(): Promise<number> {
    return this.rows.count();
  }

  async hasCancelOption(): Promise<boolean> {
    return this.visible(this.cancelButton);
  }

  async cancelFirst(): Promise<void> {
    await test.step('Cancel first booking', async () => {
      this.page.once('dialog', (d) => void d.accept());
      await this.cancelButton.click();
      await this.page.waitForTimeout(500);
      const confirm = this.loc(CONFIRM_DIALOG_BTN);
      if ((await this.page.locator(CONFIRM_DIALOG_BTN).count()) > 0) await confirm.click();
      await this.settle();
    });
  }
}