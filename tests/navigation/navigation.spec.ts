import { env, urlContaining } from '../../src/config/env';
import { authTest, expect, test } from '../../src/fixtures/test-fixtures';
import { meta } from '../../src/utils/testMeta';

test.describe('Navigation & Responsiveness', { annotation: { type: 'feature', description: 'Navigation & Responsiveness' } }, () => {
  test('TC_NAV_01 site responds successfully', meta({ story: 'Availability', severity: 'blocker', smoke: true }), async ({ page }) => {
    const response = await page.goto(env.paths.login);
    expect(response, 'navigation should produce a response').not.toBeNull();
    expect(response!.status()).toBeLessThan(400);
  });

  test('TC_NAV_02 title contains brand', meta({ story: 'Availability' }), async ({ loginPage }) => {
    await loginPage.open();
    expect((await loginPage.title()).toLowerCase()).toContain('eventhub');
  });

  test('TC_NAV_03 site is served over HTTPS', meta({ story: 'Availability', severity: 'critical' }), async ({ loginPage }) => {
    await loginPage.open();
    expect(loginPage.url().startsWith('https://')).toBe(true);
  });

  test('TC_NAV_04 unknown route is handled gracefully', meta({ story: 'Error handling' }), async ({ page, loginPage }) => {
    await page.goto(`/this-route-does-not-exist-${Date.now()}`);
    await loginPage.settle();
    expect((await loginPage.bodyText()).trim()).not.toBe('');
  });

  test('TC_NAV_05 browser back/forward works', meta({ story: 'Browser navigation' }), async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.clickRegisterLink();
    expect(await loginPage.waitForUrlNotContaining(env.paths.login)).toBe(true);
    await loginPage.goBack();
    expect(await loginPage.waitForUrlContaining(env.paths.login)).toBe(true);
    await loginPage.goForward();
    expect(await loginPage.waitForUrlNotContaining(env.paths.login)).toBe(true);
  });

  test('TC_NAV_06 login is usable on a mobile viewport', meta({ story: 'Responsive design', severity: 'critical' }), async ({ page, loginPage }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await loginPage.open();
    expect(await loginPage.isFormDisplayed()).toBe(true);
    expect(await loginPage.hasHorizontalScroll(), 'no horizontal scroll on mobile').toBe(false);
  });

  test('TC_NAV_07 login is usable on a tablet viewport', meta({ story: 'Responsive design' }), async ({ page, loginPage }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await loginPage.open();
    expect(await loginPage.isFormDisplayed()).toBe(true);
    expect(await loginPage.hasHorizontalScroll(), 'no horizontal scroll on tablet').toBe(false);
  });

  test('TC_NAV_08 login page loads within 10 seconds', meta({ story: 'Performance' }), async ({ loginPage }) => {
    const start = Date.now();
    await loginPage.open();
    expect(Date.now() - start).toBeLessThan(10_000);
  });
});

authTest.describe('Navbar (authenticated)', { annotation: { type: 'feature', description: 'Navigation & Responsiveness' } }, () => {
  authTest('TC_NAV_09 navbar is visible after login', meta({ story: 'Navbar', severity: 'critical', smoke: true }), async ({ eventsPage, navBar }) => {
    await eventsPage.open();
    await expect(navBar.header).toBeVisible();
  });

  authTest('TC_NAV_10 logo is visible after login', meta({ story: 'Navbar' }), async ({ eventsPage, navBar }) => {
    await eventsPage.open();
    await expect(navBar.logo).toBeVisible();
  });

  authTest('TC_NAV_11 navbar has links after login', meta({ story: 'Navbar' }), async ({ eventsPage, navBar }) => {
    await eventsPage.open();
    expect(await navBar.links.count()).toBeGreaterThan(0);
  });

  authTest('TC_NAV_12 events reachable from navbar', meta({ story: 'Navbar', severity: 'critical' }), async ({ page, navBar, myBookingsPage }) => {
    await myBookingsPage.open();
    await navBar.openEvents();
    await expect(page).toHaveURL(urlContaining('event'));
  });

  authTest('TC_NAV_13 My Bookings reachable from navbar', meta({ story: 'Navbar', severity: 'critical' }), async ({ page, navBar, eventsPage }) => {
    await eventsPage.open();
    await navBar.openMyBookings();
    await expect(page).toHaveURL(urlContaining('booking'));
  });
});