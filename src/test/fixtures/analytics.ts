import type { AnalyticsData } from '@/hooks/usePresence';

export const analyticsFixture: AnalyticsData = {
  visitors: {
    total: 1234,
    today: 12,
    week: 85,
    month: 320,
    totalVisits: 2400,
    returningPct: 34,
    onlineNow: 3,
    onlineByDevice: [{ name: 'Desktop', value: 2 }],
  },
  reach: {
    countries: 4,
    topCountry: 'IN',
    latestCountry: 'US',
    unknown: 2,
    countriesList: [
      { name: 'IN', value: 800 },
      { name: 'US', value: 200 },
    ],
    browsers: [{ name: 'Chrome', value: 700 }],
    operatingSystems: [{ name: 'Windows', value: 500 }],
    devices: [{ name: 'Desktop', value: 900 }],
  },
  reading: {
    totalPageViews: 5678,
    avgPagesPerVisit: 4,
    topPages: [{ name: 'tools/crypto/sha', value: 400 }],
    topTools: [{ name: 'crypto/sha', value: 400 }],
    topCategories: [{ name: 'crypto', value: 500 }],
  },
  recent: [
    {
      visitorId: 'visitor-1',
      country: 'IN',
      browser: 'Chrome',
      os: 'Windows',
      ago: 2,
      online: true,
    },
  ],
  lastActivity: '2026-11-12T12:00:00.000Z',
  trends: {
    weekly: [{ date: '2026-11-12', value: 12 }],
    monthly: [{ date: '2026-11-12', value: 12 }],
  },
};
