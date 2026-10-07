import { test, type Locator, type Page } from '@playwright/test';
import { BasePage } from '../BasePage';

/** Top navigation shown on authenticated pages. */
const HEADER = 'header, nav';
const LOGO = "header a:first-of-type, nav a:first-of-type, [class*='logo' i], a[href='/']";
const LINKS = 'header a, nav a';
const LOGOUT =
  "button:has-text('logout'), a:has-text('logout'), button:has-text('sign out'), a:has-text('sign out'), [data-testid*='logout' i]";
const EVENTS_LINK =
  "header a[href*='event' i], nav a[href*='event' i], a:has-text('Browse Events'), a:has-text('Events')";
const BOOKINGS_LINK =
  "header a[href*='booking' i], nav a[href*='booking' i], a:has-text('My Bookings'), a:has-text('Bookings')";

export class NavBar extends BasePage {
  readonly header: Locator;
  readonly logo: Locator;
  readonly links: Locator;
  readonly logoutControl: Locator;
  readonly eventsLink: Locator;
  readonly bookingsLink: Locator;

  constructor(page: Page) {
    super(page);
    this.header = this.loc(HEADER);
    this.logo = this.loc(LOGO);
    this.links = page.locator(LINKS);
    this.logoutControl = this.loc(LOGOUT);
    this.eventsLink = this.loc(EVENTS_LINK);
    this.bookingsLink = this.loc(BOOKINGS_LINK);
  }

  async logout(): Promise<void> {
    await test.step('Click logout', async () => {
      await this.logoutControl.click();
      await this.settle();
    });
  }

  async openEvents(): Promise<void> {
    await test.step('Open Events from navbar', async () => {
      await this.eventsLink.click();
      await this.settle();
    });
  }

  async openMyBookings(): Promise<void> {
    await test.step('Open My Bookings from navbar', async () => {
      await this.bookingsLink.click();
      await this.settle();
    });
  }
}