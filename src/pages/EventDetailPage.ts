import { test, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

const TITLE = 'h1, h2';
const BOOK_BUTTON =
  "button:has-text('book'), a:has-text('book'), button:has-text('register'), button:has-text('get tickets')";
const PRICE = "[class*='price' i], [data-testid*='price' i]";
const PRICE_TEXT = /[$₹€£]\s?\d|\bfree\b/i;

export class EventDetailPage extends BasePage {
  readonly headingLocator: Locator;
  readonly bookButton: Locator;

  constructor(page: Page) {
    super(page);
    this.headingLocator = this.loc(TITLE);
    this.bookButton = this.loc(BOOK_BUTTON);
  }

  async heading(): Promise<string> {
    return (await this.visible(this.headingLocator, 10_000)) ? (await this.headingLocator.innerText()).trim() : '';
  }

  async isBookButtonVisible(): Promise<boolean> {
    return this.visible(this.bookButton, 8_000);
  }

  async isPriceVisible(): Promise<boolean> {
    return (await this.visible(this.loc(PRICE))) || (await this.page.getByText(PRICE_TEXT).count()) > 0;
  }

  async clickBook(): Promise<void> {
    await test.step("Click 'Book' on event details", async () => {
      await this.bookButton.click();
      await this.settle();
    });
  }
}