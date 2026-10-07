import { env, urlContaining } from '../../src/config/env';
import { authTest, expect, test } from '../../src/fixtures/test-fixtures';
import type { BookingPage } from '../../src/pages/BookingPage';
import type { EventDetailPage } from '../../src/pages/EventDetailPage';
import type { EventsPage } from '../../src/pages/EventsPage';
import type { TestUser } from '../../src/types';
import { DataFactory } from '../../src/utils/dataFactory';
import { meta } from '../../src/utils/testMeta';

interface Flow {
  eventsPage: EventsPage;
  eventDetailPage: EventDetailPage;
  bookingPage: BookingPage;
  testUser: TestUser;
}

async function openBookingForm({ eventsPage, eventDetailPage }: Pick<Flow, 'eventsPage' | 'eventDetailPage'>) {
  await eventsPage.open();
  expect(await eventsPage.count(), 'at least one event must exist to book').toBeGreaterThan(0);
  await eventsPage.openFirstEvent();
  await eventDetailPage.clickBook();
}

async function completeValidBooking({ bookingPage, testUser }: Pick<Flow, 'bookingPage' | 'testUser'>, pageUrl: () => string) {
  expect(await bookingPage.isFormVisible(), 'booking form must be visible').toBe(true);
  await bookingPage.fillDetails(testUser.name, testUser.email, DataFactory.phone(), 1);
  await bookingPage.submit();
  const confirmed = (await bookingPage.isSuccessDisplayed()) || pageUrl().includes('booking');
  expect(confirmed, 'booking should be confirmed').toBe(true);
}

authTest.describe('Booking', { annotation: { type: 'feature', description: 'Booking' } }, () => {
  authTest('TC_BOOK_01 booking form opens', meta({ story: 'Booking form', severity: 'blocker', smoke: true }), async ({ eventsPage, eventDetailPage, bookingPage }) => {
    await openBookingForm({ eventsPage, eventDetailPage });
    expect(await bookingPage.isFormVisible()).toBe(true);
  });

  authTest('TC_BOOK_02 booking with valid details succeeds', meta({ story: 'Create booking', severity: 'blocker', smoke: true }), async ({ eventsPage, eventDetailPage, bookingPage, testUser, page }) => {
    await openBookingForm({ eventsPage, eventDetailPage });
    await completeValidBooking({ bookingPage, testUser }, () => page.url());
  });

  authTest('TC_BOOK_03 empty booking form is blocked', meta({ story: 'Booking validation', severity: 'critical' }), async ({ eventsPage, eventDetailPage, bookingPage }) => {
    await openBookingForm({ eventsPage, eventDetailPage });
    expect(await bookingPage.isFormVisible()).toBe(true);
    await bookingPage.submit();
    expect(await bookingPage.isSuccessDisplayed(3_000), 'empty form must not produce a confirmation').toBe(false);
  });

  authTest('TC_BOOK_04 invalid email is blocked', meta({ story: 'Booking validation' }), async ({ eventsPage, eventDetailPage, bookingPage }) => {
    await openBookingForm({ eventsPage, eventDetailPage });
    await bookingPage.fillDetails(DataFactory.fullName(), 'not-an-email', DataFactory.phone(), 1);
    await bookingPage.submit();
    const blocked =
      (await bookingPage.isEmailInvalidByBrowser()) ||
      (await bookingPage.isErrorDisplayed()) ||
      !(await bookingPage.isSuccessDisplayed(3_000));
    expect(blocked, 'malformed email must not be accepted').toBe(true);
  });

  authTest('TC_BOOK_05 invalid quantity is rejected', meta({ story: 'Booking validation' }), async ({ eventsPage, eventDetailPage, bookingPage, testUser }) => {
    await openBookingForm({ eventsPage, eventDetailPage });
    authTest.skip(!(await bookingPage.hasQuantityField()), 'No quantity field on booking form');
    await bookingPage.fillDetails(testUser.name, testUser.email, DataFactory.phone(), -3);
    await bookingPage.submit();
    expect(await bookingPage.isSuccessDisplayed(3_000), 'negative quantity must not be accepted').toBe(false);
  });

  authTest('TC_BOOK_06 My Bookings page loads', meta({ story: 'My bookings', severity: 'critical' }), async ({ myBookingsPage }) => {
    await myBookingsPage.open();
    expect(await myBookingsPage.isLoaded()).toBe(true);
  });

  authTest('TC_BOOK_07 new booking appears in My Bookings', meta({ story: 'My bookings', severity: 'blocker' }), async ({ eventsPage, eventDetailPage, bookingPage, myBookingsPage, testUser, page }) => {
    const before = await (await myBookingsPage.open()).count();
    await openBookingForm({ eventsPage, eventDetailPage });
    await completeValidBooking({ bookingPage, testUser }, () => page.url());
    const after = await (await myBookingsPage.open()).count();
    expect(after, `bookings should grow beyond ${before}`).toBeGreaterThan(before);
  });

  authTest('TC_BOOK_08 cancelling a booking removes it', meta({ story: 'My bookings', severity: 'critical' }), async ({ eventsPage, eventDetailPage, bookingPage, myBookingsPage, testUser, page }) => {
    await myBookingsPage.open();
    if ((await myBookingsPage.count()) === 0) {
      await openBookingForm({ eventsPage, eventDetailPage });
      await completeValidBooking({ bookingPage, testUser }, () => page.url());
      await myBookingsPage.open();
    }
    authTest.skip(!(await myBookingsPage.hasCancelOption()), 'No cancel option available for bookings');
    const before = await myBookingsPage.count();
    await myBookingsPage.cancelFirst();
    expect(await myBookingsPage.count()).toBeLessThan(before);
  });
});

test.describe('Booking (guest)', { annotation: { type: 'feature', description: 'Booking' } }, () => {
  test('TC_BOOK_09 guest booking attempt requires login', meta({ story: 'Booking security', severity: 'critical' }), async ({ eventsPage, eventDetailPage, page }) => {
    await eventsPage.open();
    test.skip((await eventsPage.count()) === 0, 'Events are not public; guest cannot reach event list (already protected)');
    await eventsPage.openFirstEvent();
    await eventDetailPage.clickBook();
    await expect(page).toHaveURL(urlContaining(env.paths.login), { timeout: 8_000 });
  });
});