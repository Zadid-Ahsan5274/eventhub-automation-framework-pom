import invalidLogins from '../../src/test-data/invalid-logins.json';
import { env, urlContaining } from '../../src/config/env';
import { authTest, expect, test } from '../../src/fixtures/test-fixtures';
import { meta } from '../../src/utils/testMeta';

const LOGIN_URL = urlContaining(env.paths.login);

test.describe('Authentication - Login', { annotation: { type: 'feature', description: 'Authentication - Login' } }, () => {
  test('TC_LOGIN_01 login page loads', meta({ story: 'Login page UI', severity: 'blocker', smoke: true }), async ({ loginPage, page }) => {
    await loginPage.open();
    await expect(page).toHaveURL(LOGIN_URL);
  });

  test('TC_LOGIN_02 page title is set', meta({ story: 'Login page UI' }), async ({ loginPage }) => {
    await loginPage.open();
    expect((await loginPage.title()).trim()).not.toBe('');
  });

  test('TC_LOGIN_03 email, password and submit are visible', meta({ story: 'Login page UI', severity: 'critical', smoke: true }), async ({ loginPage }) => {
    await loginPage.open();
    await expect.soft(loginPage.email).toBeVisible();
    await expect.soft(loginPage.password).toBeVisible();
    await expect.soft(loginPage.submit).toBeVisible();
  });

  test('TC_LOGIN_04 a heading is displayed', meta({ story: 'Login page UI' }), async ({ loginPage }) => {
    await loginPage.open();
    await expect(loginPage.heading).toBeVisible();
  });

  test('TC_LOGIN_05 password input is masked', meta({ story: 'Login page UI', severity: 'critical' }), async ({ loginPage }) => {
    await loginPage.open();
    expect(await loginPage.passwordFieldType()).toBe('password');
  });

  test('TC_LOGIN_06 register link is displayed', meta({ story: 'Login page UI' }), async ({ loginPage }) => {
    await loginPage.open();
    await expect(loginPage.registerLink).toBeVisible();
  });

  test('TC_LOGIN_07 register link navigates to registration', meta({ story: 'Login page navigation' }), async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.clickRegisterLink();
    expect(await loginPage.waitForUrlNotContaining(env.paths.login)).toBe(true);
  });

  test('TC_LOGIN_08 empty submission does not log in', meta({ story: 'Login validation', severity: 'critical' }), async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.clickLogin();
    expect(await loginPage.isStillOnLogin()).toBe(true);
  });

  for (const row of invalidLogins) {
    test(`TC_LOGIN_09 invalid credentials rejected - ${row.scenario}`, meta({ story: 'Login validation', severity: 'critical' }), async ({ loginPage }) => {
      await loginPage.open();
      await loginPage.login(row.email, row.password);
      expect(await loginPage.isStillOnLogin(), `Scenario '${row.scenario}' must not authenticate`).toBe(true);
    });
  }

  test('TC_LOGIN_10 valid user can log in', meta({ story: 'Successful login', severity: 'blocker', smoke: true }), async ({ loginPage, testUser, page }) => {
    await loginPage.open();
    await loginPage.login(testUser.email, testUser.password);
    expect(await loginPage.isLoggedIn()).toBe(true);
    await expect(page).not.toHaveURL(LOGIN_URL);
  });

  test('TC_LOGIN_11 Enter key submits the form', meta({ story: 'Successful login' }), async ({ loginPage, testUser }) => {
    await loginPage.open();
    await loginPage.typeCredentials(testUser.email, testUser.password);
    await loginPage.submitWithEnter();
    expect(await loginPage.isLoggedIn()).toBe(true);
  });

  test('TC_LOGIN_15 SQL injection attempt is rejected', meta({ story: 'Login validation', severity: 'critical' }), async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.login("' OR '1'='1' --", "' OR '1'='1");
    expect(await loginPage.isStillOnLogin()).toBe(true);
  });

  test('TC_LOGIN_16 XSS payload does not execute', meta({ story: 'Login validation', severity: 'critical' }), async ({ loginPage, page }) => {
    let dialogShown = false;
    page.on('dialog', (d) => {
      dialogShown = true;
      void d.dismiss();
    });
    await loginPage.open();
    await loginPage.login('<img src=x onerror=alert(1)>@x.com', '<script>alert(1)</script>');
    await page.waitForTimeout(1200);
    expect(dialogShown, 'Injected script must not run').toBe(false);
  });
});

authTest.describe('Authentication - Session', { annotation: { type: 'feature', description: 'Authentication - Login' } }, () => {
  authTest('TC_LOGIN_12 session survives page refresh', meta({ story: 'Session handling', severity: 'critical' }), async ({ eventsPage, page }) => {
    await eventsPage.open();
    await eventsPage.reload();
    await expect(page).not.toHaveURL(LOGIN_URL);
  });

  authTest('TC_LOGIN_13 logout returns to login', meta({ story: 'Session handling', severity: 'critical', smoke: true }), async ({ eventsPage, navBar, page }) => {
    await eventsPage.open();
    await navBar.logout();
    await expect(page).toHaveURL(LOGIN_URL);
  });

  authTest('TC_LOGIN_14 back button after logout does not restore session', meta({ story: 'Session handling', severity: 'critical' }), async ({ eventsPage, navBar, page }) => {
    await eventsPage.open();
    await navBar.logout();
    await eventsPage.goBack();
    await expect(page).toHaveURL(LOGIN_URL);
  });
});