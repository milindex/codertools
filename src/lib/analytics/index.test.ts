import {
  getVisitCount,
  getVisitorId,
  incrementVisitCount,
  isReturningVisitor,
  markSeen,
  trackPageView,
} from '@/lib/analytics';

describe('analytics client helpers', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  it('creates a persistent 32-character visitor id', () => {
    const first = getVisitorId();
    const second = getVisitorId();

    expect(first).toMatch(/^[A-Za-z0-9]{32}$/);
    expect(second).toBe(first);
  });

  it('tracks whether a visitor has been seen', () => {
    expect(isReturningVisitor()).toBe(false);
    markSeen();
    expect(isReturningVisitor()).toBe(true);
  });

  it('tracks the local visit count', () => {
    expect(getVisitCount()).toBe(1);
    expect(incrementVisitCount()).toBe(2);
    expect(incrementVisitCount()).toBe(3);
    expect(getVisitCount()).toBe(3);
  });

  it('does not track pageviews on localhost by default', async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock;

    await trackPageView('/tools/crypto/sha/');

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
