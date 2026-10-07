import invalidRegistrations from '../../src/test-data/invalid-registrations.json';
import { env, urlContaining } from '../../src/config/env';
import { expect, test } from '../../src/fixtures/test-fixtures';
import { DataFactory } from '../../src/utils/dataFactory';
import { meta } from '../../src/utils/testMeta';

test.describe('Authentication - Registration', { annotation: { type: 'feature', description: 'Authentication - Registration' } }, () => {
  test('TC_REG_01 registration page loads', meta({ story: 'Registration page UI', severity: 'blocker', smoke: true }), async ({ registerPage, page }) => {
    await registerPage.open();
    await expect(page).toHaveURL(urlContaining(env.paths.register));
  });

  test('TC_REG_02 form fields are visible', meta({ story: 'Registration page UI', severity: 'critical' }), async ({ registerPage }) => {
    await registerPage.open();
    expect(await registerPage.isFormDisplayed()).toBe(true);
  });

  test('TC_REG_03 password input is masked', meta({ story: 'Registration page UI' }), async ({ registerPage }) => {
    await registerPage.open();
    expect(await registerPage.passwordFieldType()).toBe('password');
  });

  test('TC_REG_04 login link is visible', meta({ story: 'Registration page UI' }), async ({ registerPage }) => {
    await registerPage.open();
    await expect(registerPage.loginLink).toBeVisible();
  });

  test('TC_REG_05 login link navigates to login page', meta({ story: 'Registration navigation' }), async ({ registerPage, page }) => {
    await registerPage.open();
    await registerPage.clickLoginLink();
    await expect(page).toHaveURL(urlContaining(env.paths.login));
  });

  test('TC_REG_06 empty submission is blocked', meta({ story: 'Registration validation', severity: 'critical' }), async ({ registerPage }) => {
    await registerPage.open();
    await registerPage.clickRegister();
    expect(await registerPage.isStillOnRegister()).toBe(true);
  });

  for (const row of invalidRegistrations) {
    test(`TC_REG_07 invalid registration rejected - ${row.scenario}`, meta({ story: 'Registration validation', severity: 'critical' }), async ({ registerPage }) => {
      await registerPage.open();
      await registerPage.register(row.name, row.email, row.password);
      expect(await registerPage.isStillOnRegister(), `Scenario '${row.scenario}' must not register`).toBe(true);
    });
  }

  test('TC_REG_08 new user can register', meta({ story: 'Successful registration', severity: 'blocker', smoke: true }), async ({ registerPage }) => {
    const user = DataFactory.randomUser();
    await registerPage.open();
    await registerPage.register(user.name, user.email, user.password);
    const outcome = await registerPage.registrationOutcome(10_000);
    expect(outcome.ok, outcome.reason).toBe(true);
  });

  test('TC_REG_09 duplicate email is rejected', meta({ story: 'Registration validation', severity: 'critical' }), async ({ registerPage, testUser }) => {
    await registerPage.open();
    await registerPage.register(testUser.name, testUser.email, testUser.password);
    const rejected = (await registerPage.isStillOnRegister()) || (await registerPage.isErrorDisplayed());
    expect(rejected, 'Registering an existing email must be rejected').toBe(true);
  });

  test('TC_REG_10 password mismatch is rejected', meta({ story: 'Registration validation' }), async ({ registerPage }) => {
    await registerPage.open();
    test.skip(!(await registerPage.hasConfirmField()), 'No confirm-password field on this form');
    const user = DataFactory.randomUser();
    await registerPage.register(user.name, user.email, user.password, `${user.password}X`);
    expect(await registerPage.isStillOnRegister()).toBe(true);
  });

  test('TC_REG_11 XSS payload in name does not execute', meta({ story: 'Registration validation', severity: 'critical' }), async ({ registerPage, page }) => {
    let dialogShown = false;
    page.on('dialog', (d) => {
      dialogShown = true;
      void d.dismiss();
    });
    const user = DataFactory.randomUser();
    await registerPage.open();
    await registerPage.register('<script>alert(1)</script>', user.email, user.password);
    await page.waitForTimeout(1500);
    expect(dialogShown, 'Injected script must not run').toBe(false);
  });

  test('TC_REG_12 registered user can log in afterwards', meta({ story: 'Successful registration', severity: 'blocker' }), async ({ registerPage, loginPage, page }) => {
    const user = DataFactory.randomUser();
    await registerPage.open();
    await registerPage.register(user.name, user.email, user.password);
    const outcome = await registerPage.registrationOutcome(10_000);
    expect(outcome.ok, outcome.reason).toBe(true);

    await page.context().clearCookies();
    await loginPage.open();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await loginPage.open();
    await loginPage.login(user.email, user.password);
    expect(await loginPage.isLoggedIn()).toBe(true);
  });
});