import { env, urlContaining } from '../../src/config/env';
import { authTest, expect, test } from '../../src/fixtures/test-fixtures';
import { meta } from '../../src/utils/testMeta';

test.describe('Security & Session (guest)', { annotation: { type: 'feature', description: 'Security & Session' } }, () => {
  test('TC_SEC_01 bookings route requires authentication', meta({ story: 'Access control', severity: 'blocker', smoke: true }), async ({ page }) => {
    await page.goto(env.paths.bookings);
    await expect(page).toHaveURL(urlContaining(env.paths.login), { timeout: 10_000 });
  });

  test('TC_SEC_02 credentials are never sent in a URL', meta({ story: 'Credential handling', severity: 'critical' }), async ({ page, loginPage }) => {
    const secret = 'Sup3rS3cret_Marker9';
    let leaked = false;
    page.on('request', (req) => {
      if (req.url().includes(secret)) leaked = true;
    });
    await loginPage.open();
    await loginPage.login('leak.check@example.com', secret);
    await page.waitForTimeout(2_000);
    expect(leaked, 'password must never appear in a request URL').toBe(false);
  });
});

authTest.describe('Security & Session (authenticated)', { annotation: { type: 'feature', description: 'Security & Session' } }, () => {
  authTest('TC_SEC_03 auth data is cleared from storage after logout', meta({ story: 'Session handling', severity: 'critical' }), async ({ page, eventsPage, navBar }) => {
    await eventsPage.open();
    await navBar.logout();
    await expect(page).toHaveURL(urlContaining(env.paths.login));
    const leftovers = await page.evaluate(
      () => Object.keys(localStorage).filter((k) => /token|jwt|auth|session/i.test(k)).length,
    );
    expect(leftovers, 'no auth/token keys should remain in localStorage').toBe(0);
  });

  authTest('TC_SEC_04 sessions are isolated between browser contexts', meta({ story: 'Session handling', severity: 'critical' }), async ({ browser, eventsPage }) => {
    await eventsPage.open();
    const other = await browser.newContext({ baseURL: env.baseUrl, ignoreHTTPSErrors: true });
    try {
      const otherPage = await other.newPage();
      await otherPage.goto(env.paths.bookings);
      await expect(otherPage).toHaveURL(urlContaining(env.paths.login), { timeout: 10_000 });
    } finally {
      await other.close();
    }
  });
});