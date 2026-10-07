import type { Locator, Page } from '@playwright/test';

/**
 * Shared behaviour for every page object.
 * Selectors passed to loc() are comma-separated fallbacks so a small markup change does not break
 * the suite; tune the constants at the top of each page class once the real DOM is confirmed.
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /** First match of a (possibly comma-separated) selector. */
  protected loc(selector: string): Locator {
    return this.page.locator(selector).first();
  }

  protected async visible(locator: Locator, timeout = 3_000): Promise<boolean> {
    try {
      await locator.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  // ---------- navigation ----------
  async goto(path: string): Promise<void> {
    await this.page.goto(path, { waitUntil: 'domcontentloaded' });
  }

  /** Best-effort wait for the SPA to stop fetching; never throws. */
  async settle(timeout = 4_000): Promise<void> {
    await this.page.waitForLoadState('networkidle', { timeout }).catch(() => undefined);
  }

  async waitForUrlContaining(fragment: string, timeout = 8_000): Promise<boolean> {
    try {
      await this.page.waitForURL((u) => u.toString().includes(fragment), { timeout });
      return true;
    } catch {
      return false;
    }
  }

  async waitForUrlNotContaining(fragment: string, timeout = 8_000): Promise<boolean> {
    try {
      await this.page.waitForURL((u) => !u.toString().includes(fragment), { timeout });
      return true;
    } catch {
      return false;
    }
  }

  url(): string {
    return this.page.url();
  }

  async title(): Promise<string> {
    return this.page.title();
  }

  async reload(): Promise<void> {
    await this.page.reload({ waitUntil: 'domcontentloaded' });
  }

  async goBack(): Promise<void> {
    await this.page.goBack({ waitUntil: 'domcontentloaded' });
  }

  async goForward(): Promise<void> {
    await this.page.goForward({ waitUntil: 'domcontentloaded' });
  }

  async hasHorizontalScroll(): Promise<boolean> {
    return this.page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
  }

  async bodyText(): Promise<string> {
    return this.page.locator('body').innerText();
  }
}