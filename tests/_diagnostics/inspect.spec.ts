import { test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { env } from '../../src/config/env';
import { LoginPage } from '../../src/pages/LoginPage';
import { RegisterPage } from '../../src/pages/RegisterPage';
import { DataFactory } from '../../src/utils/dataFactory';

/**
 * Run ONLY when you need to discover the real DOM:
 *   PowerShell:  $env:INSPECT="true"; npx playwright test tests/_diagnostics --project=chromium
 *   bash:        INSPECT=true npx playwright test tests/_diagnostics --project=chromium
 * Output goes to ./diagnostics-output (json + screenshots).
 */
const OUT = path.resolve('diagnostics-output');

async function snapshot(page: Page, label: string): Promise<void> {
  fs.mkdirSync(OUT, { recursive: true });
  const data = await page.evaluate(() => {
    const attr = (el: Element, n: string) => el.getAttribute(n) ?? '';
    const text = (el: Element) => (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 80);
    return {
      url: location.href,
      title: document.title,
      formCount: document.querySelectorAll('form').length,
      headings: Array.from(document.querySelectorAll("h1,h2,h3,h4,[role='heading']")).map((e) => `${e.tagName.toLowerCase()}: ${text(e)}`),
      controls: Array.from(document.querySelectorAll('input,select,textarea')).map((e) => ({
        tag: e.tagName.toLowerCase(),
        type: attr(e, 'type'),
        name: attr(e, 'name'),
        id: attr(e, 'id'),
        placeholder: attr(e, 'placeholder'),
        ariaLabel: attr(e, 'aria-label'),
        testId: attr(e, 'data-testid'),
        required: e.hasAttribute('required'),
        insideForm: !!e.closest('form'),
      })),
      buttons: Array.from(document.querySelectorAll("button,[role='button'],input[type='submit']")).map((e) => ({
        text: text(e),
        type: attr(e, 'type'),
        id: attr(e, 'id'),
        testId: attr(e, 'data-testid'),
        insideForm: !!e.closest('form'),
      })),
      links: Array.from(document.querySelectorAll('a')).map((e) => ({ text: text(e), href: attr(e, 'href') })),
      cardCandidates: Array.from(document.querySelectorAll('article,[class*="card" i],[data-testid]'))
        .slice(0, 12)
        .map((e) => `${e.tagName.toLowerCase()}.${attr(e, 'class').slice(0, 60)} [${attr(e, 'data-testid')}]`),
      alerts: Array.from(document.querySelectorAll("[role='alert'],[class*='error' i],[class*='success' i],[class*='toast' i]")).map(text),
      bodyText: document.body.innerText.replace(/\s+/g, ' ').slice(0, 700),
    };
  });
  fs.writeFileSync(path.join(OUT, `${label}.json`), JSON.stringify(data, null, 2));
  await page.screenshot({ path: path.join(OUT, `${label}.png`), fullPage: true }).catch(() => undefined);
  // eslint-disable-next-line no-console
  console.log(`\n===== ${label} =====\n${JSON.stringify(data, null, 2)}`);
}

test('inspect login page', async ({ page }) => {
  await page.goto(env.paths.login, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await snapshot(page, '1-login');
});

test('inspect register -> login -> events -> bookings', async ({ page }) => {
  test.setTimeout(180_000);
  const user = DataFactory.randomUser();

  await page.goto(env.paths.register, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await snapshot(page, '2-register-before');

  const register = new RegisterPage(page);
  await register.register(user.name, user.email, user.password);
  await page.waitForTimeout(4000);
  await snapshot(page, '3-register-after-submit');

  // try to log in with the account we just created
  const login = new LoginPage(page);
  await login.open();
  await login.login(user.email, user.password);
  await page.waitForTimeout(4000);
  await snapshot(page, '4-after-login');

  for (const [label, route] of [
    ['5-events', env.paths.events],
    ['6-bookings', env.paths.bookings],
  ] as const) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await snapshot(page, label);
  }

  // open the first event card/link if any, to capture the detail + booking UI
  await page.goto(env.paths.events, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  const firstLink = page.locator("main a[href*='event' i], article a, [class*='card' i] a").first();
  if (await firstLink.count()) {
    await firstLink.click().catch(() => undefined);
    await page.waitForTimeout(3000);
    await snapshot(page, '7-event-detail');
    const book = page.locator("button:has-text('book'), a:has-text('book')").first();
    if (await book.count()) {
      await book.click().catch(() => undefined);
      await page.waitForTimeout(2500);
      await snapshot(page, '8-booking-form');
    }
  }
  // eslint-disable-next-line no-console
  console.log(`\nTest user used: ${user.email} / ${user.password}\nFiles written to: ${OUT}`);
});