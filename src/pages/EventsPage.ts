import { test, type Locator, type Page } from '@playwright/test';
import { env } from '../config/env';
import { BasePage } from './BasePage';

const CARD =
  "[data-testid*='event-card' i], [class*='event-card' i], [class*='EventCard'], main article";
const CARD_TITLE = "h1, h2, h3, h4, [class*='title' i]";
const CARD_ACTION = "a, button:has-text('view'), button:has-text('details'), button:has-text('book')";
const SEARCH = "input[type='search'], input[placeholder*='search' i], input[name*='search' i]";
const EMPTY_STATE = "[data-testid*='empty' i], [class*='empty' i]";
const EMPTY_TEXT = /no (events|results)|nothing found|not found/i;

export class EventsPage extends BasePage {
  readonly cards: Locator;
  readonly searchBox: Locator;

  constructor(page: Page) {
    super(page);
    this.cards = page.locator(CARD);
    this.searchBox = this.loc(SEARCH);
  }

  async open(): Promise<this> {
    await test.step('Open events page', async () => {
      await this.goto(env.paths.events);
      await this.cards.first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => undefined);
      await this.settle();
    });
    return this;
  }

  async count(): Promise<number> {
    return this.cards.count();
  }

  async titles(): Promise<string[]> {
    const n = await this.cards.count();
    const result: string[] = [];
    for (let i = 0; i < n; i++) {
      const card = this.cards.nth(i);
      const title = card.locator(CARD_TITLE).first();
      result.push(((await title.count()) > 0 ? await title.innerText() : await card.innerText()).trim());
    }
    return result;
  }

  async firstTitle(): Promise<string> {
    const [first] = await this.titles();
    return first ?? '';
  }

  async firstCardText(): Promise<string> {
    return this.cards.first().innerText();
  }

  async isSearchAvailable(): Promise<boolean> {
    return this.visible(this.searchBox);
  }

  async isEmptyStateVisible(): Promise<boolean> {
    return (
      (await this.visible(this.loc(EMPTY_STATE))) || (await this.page.getByText(EMPTY_TEXT).count()) > 0
    );
  }

  async search(keyword: string): Promise<this> {
    await test.step(`Search events for '${keyword}'`, async () => {
      await this.searchBox.fill(keyword);
      await this.searchBox.press('Enter');
      await this.page.waitForTimeout(800); // debounce window of client-side filtering
      await this.settle();
    });
    return this;
  }

  async clearSearch(): Promise<this> {
    return this.search('');
  }

  async openFirstEvent(): Promise<void> {
    await test.step('Open first event', async () => {
      const card = this.cards.first();
      const action = card.locator(CARD_ACTION).first();
      if ((await action.count()) > 0) await action.click();
      else await card.click();
      await this.settle();
    });
  }
}