import { authTest as test, expect } from '../../src/fixtures/test-fixtures';
import type { EventsPage } from '../../src/pages/EventsPage';
import { meta } from '../../src/utils/testMeta';

const NO_MATCH = 'zzzxxqq_no_such_event_9876';

async function openWithData(eventsPage: EventsPage): Promise<EventsPage> {
  await eventsPage.open();
  test.skip((await eventsPage.count()) === 0, 'No events are listed; cannot run this scenario');
  return eventsPage;
}

test.describe('Events', { annotation: { type: 'feature', description: 'Events' } }, () => {
  test('TC_EVT_01 events page loads', meta({ story: 'Event listing', severity: 'blocker', smoke: true }), async ({ eventsPage, page }) => {
    await eventsPage.open();
    expect(page.url()).toContain('event');
  });

  test('TC_EVT_02 event cards are displayed', meta({ story: 'Event listing', severity: 'blocker', smoke: true }), async ({ eventsPage }) => {
    await eventsPage.open();
    expect(await eventsPage.count()).toBeGreaterThan(0);
  });

  test('TC_EVT_03 every card has a non-empty title', meta({ story: 'Event listing' }), async ({ eventsPage }) => {
    await openWithData(eventsPage);
    for (const title of await eventsPage.titles()) expect(title.trim()).not.toBe('');
  });

  test('TC_EVT_04 card shows more than just a title', meta({ story: 'Event listing' }), async ({ eventsPage }) => {
    await openWithData(eventsPage);
    const lines = (await eventsPage.firstCardText()).split(/\r?\n/).filter((l) => l.trim() !== '');
    expect(lines.length, 'card should display extra details (date/venue/price)').toBeGreaterThanOrEqual(2);
  });

  test('TC_EVT_05 search box is available', meta({ story: 'Event search' }), async ({ eventsPage }) => {
    await eventsPage.open();
    expect(await eventsPage.isSearchAvailable()).toBe(true);
  });

  test('TC_EVT_06 search returns matching event', meta({ story: 'Event search', severity: 'critical', smoke: true }), async ({ eventsPage }) => {
    await openWithData(eventsPage);
    const keyword = (await eventsPage.firstTitle()).split(/\s+/)[0];
    await eventsPage.search(keyword);
    expect(await eventsPage.count()).toBeGreaterThanOrEqual(1);
    expect((await eventsPage.firstCardText()).toLowerCase()).toContain(keyword.toLowerCase());
  });

  test('TC_EVT_07 search with no match shows empty state', meta({ story: 'Event search' }), async ({ eventsPage }) => {
    await openWithData(eventsPage);
    await eventsPage.search(NO_MATCH);
    const ok = (await eventsPage.count()) === 0 || (await eventsPage.isEmptyStateVisible());
    expect(ok, 'no cards or an empty-state message expected').toBe(true);
  });

  test('TC_EVT_08 clearing search restores the list', meta({ story: 'Event search' }), async ({ eventsPage }) => {
    await openWithData(eventsPage);
    const initial = await eventsPage.count();
    await eventsPage.search(NO_MATCH);
    await eventsPage.clearSearch();
    expect(await eventsPage.count()).toBe(initial);
  });

  test('TC_EVT_09 search is case-insensitive', meta({ story: 'Event search' }), async ({ eventsPage }) => {
    await openWithData(eventsPage);
    const keyword = (await eventsPage.firstTitle()).split(/\s+/)[0].toUpperCase();
    await eventsPage.search(keyword);
    expect(await eventsPage.count()).toBeGreaterThanOrEqual(1);
  });

  test('TC_EVT_10 opening an event shows its details', meta({ story: 'Event details', severity: 'critical', smoke: true }), async ({ eventsPage, page }) => {
    await openWithData(eventsPage);
    const listUrl = page.url();
    await eventsPage.openFirstEvent();
    expect(page.url()).not.toBe(listUrl);
  });

  test('TC_EVT_11 detail heading matches the selected card', meta({ story: 'Event details' }), async ({ eventsPage, eventDetailPage }) => {
    await openWithData(eventsPage);
    const firstWord = (await eventsPage.firstTitle()).split(/\s+/)[0].toLowerCase();
    await eventsPage.openFirstEvent();
    expect((await eventDetailPage.heading()).toLowerCase()).toContain(firstWord);
  });

  test('TC_EVT_12 detail page offers a booking action', meta({ story: 'Event details', severity: 'critical' }), async ({ eventsPage, eventDetailPage }) => {
    await openWithData(eventsPage);
    await eventsPage.openFirstEvent();
    expect(await eventDetailPage.isBookButtonVisible()).toBe(true);
  });

  test('TC_EVT_13 detail page shows price information', meta({ story: 'Event details' }), async ({ eventsPage, eventDetailPage }) => {
    await openWithData(eventsPage);
    await eventsPage.openFirstEvent();
    expect(await eventDetailPage.isPriceVisible()).toBe(true);
  });

  test('TC_EVT_14 back from details restores the list', meta({ story: 'Event details' }), async ({ eventsPage }) => {
    await openWithData(eventsPage);
    await eventsPage.openFirstEvent();
    await eventsPage.goBack();
    await eventsPage.settle();
    expect(await eventsPage.count()).toBeGreaterThan(0);
  });

  test('TC_EVT_15 events persist after refresh', meta({ story: 'Event listing' }), async ({ eventsPage }) => {
    await openWithData(eventsPage);
    const before = await eventsPage.count();
    await eventsPage.reload();
    await eventsPage.settle();
    expect(await eventsPage.count()).toBe(before);
  });
});