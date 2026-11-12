'use client';

import {
  Activity,
  Globe2,
  MonitorSmartphone,
  RefreshCw,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Container } from '@/components/ui/Container';
import { Panel } from '@/components/ui/Panel';
import { Spinner } from '@/components/ui/Spinner';
import type { AnalyticsData } from '@/hooks/usePresence';
import { usePresence } from '@/hooks/usePresence';
import {
  analyticsConfigured,
  getVisitCount,
  getVisitorId,
  incrementVisitCount,
  isReturningVisitor,
} from '@/lib/analytics';
import { countryName, isKnownCountry } from '@/lib/analytics/countries';
import { cn } from '@/utils/cn';

const EMPTY_DATA: AnalyticsData = {
  visitors: {
    total: 0,
    today: 0,
    week: 0,
    month: 0,
    totalVisits: 0,
    returningPct: 0,
    onlineNow: 0,
    onlineByDevice: [],
  },
  reach: {
    countries: 0,
    topCountry: 'n/a',
    latestCountry: 'n/a',
    countriesList: [],
    browsers: [],
    operatingSystems: [],
    devices: [],
  },
  reading: {
    totalPageViews: 0,
    avgPagesPerVisit: 0,
    topPages: [],
    topTools: [],
    topCategories: [],
  },
  recent: [],
  lastActivity: null,
  trends: { weekly: [], monthly: [] },
};

const StatCard = ({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) => (
  <div
    className={cn(
      'rounded-md border border-border bg-canvas-subtle/40 px-3 py-2.5',
      accent && 'border-accent/40 bg-accent-subtle/30'
    )}
  >
    <p className="text-xl font-bold text-fg">{value}</p>
    <p className="mt-0.5 text-[11px] text-fg-muted">{label}</p>
  </div>
);

const HeroCard = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div className="rounded-lg border border-border bg-surface p-5">
    <p className="text-3xl font-bold tracking-tight text-fg">{value}</p>
    <p className="mt-1 text-xs uppercase tracking-wide text-fg-muted">
      {label}
    </p>
  </div>
);

const CountryBadge = ({ code }: { code: string }) => {
  if (!isKnownCountry(code)) {
    return null;
  }
  return (
    <span className="inline-flex min-w-8 justify-center rounded border border-border bg-neutral-subtle px-1.5 py-0.5 font-mono text-[10px] text-fg-muted">
      {code}
    </span>
  );
};

const CombinedCell = ({ item }: { item?: { name: string; value: number } }) => {
  if (!item) {
    return <span className="text-fg-subtle">—</span>;
  }
  return (
    <span className="flex items-center justify-between gap-1">
      <span className="truncate text-fg">{item.name}</span>
      <span className="text-[10px] text-fg-muted">{item.value}</span>
    </span>
  );
};

const BarList = ({
  title,
  items,
  empty = 'No data yet',
}: {
  title: string;
  items: { name: string; value: number }[];
  empty?: string;
}) => {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
        {title}
      </h3>
      {items.length > 0 ? (
        <div className="mt-2 space-y-2">
          {items.map((item) => (
            <div key={item.name}>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="min-w-0 truncate text-fg">{item.name}</span>
                <span className="shrink-0 text-fg-muted">
                  {item.value.toLocaleString()}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-neutral-subtle">
                <div
                  className="h-full rounded-full bg-accent/70"
                  style={{ width: `${(item.value / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs text-fg-muted">{empty}</p>
      )}
    </div>
  );
};

const Sparkline = ({ data }: { data: { date: string; value: number }[] }) => {
  const max = Math.max(...data.map((item) => item.value), 1);

  if (data.length === 0) {
    return (
      <div className="mt-2 flex h-24 items-center justify-center rounded-md border border-dashed border-border text-xs text-fg-muted">
        No data yet
      </div>
    );
  }

  return (
    <div className="mt-2 flex h-24 items-end gap-1 rounded-md border border-border bg-canvas-inset p-2">
      {data.map((item, index) => (
        <div
          className="flex-1 rounded-t bg-accent/60 transition-colors hover:bg-accent"
          key={`${item.date}-${index}`}
          style={{ height: `${Math.max((item.value / max) * 100, 4)}%` }}
          title={`${item.date}: ${item.value}`}
        />
      ))}
    </div>
  );
};

const formatAgo = (minutes: number) => {
  if (minutes <= 0) {
    return 'now';
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  return `${Math.floor(hours / 24)}d ago`;
};

export default function AnalyticsPage() {
  const { data, loading, refresh } = usePresence();
  const [refreshing, setRefreshing] = useState(false);
  const [visit, setVisit] = useState({
    first: true,
    count: 1,
    id: '',
  });

  useEffect(() => {
    setVisit({
      first: !isReturningVisitor(),
      count: getVisitCount(),
      id: getVisitorId(),
    });
    incrementVisitCount();
  }, []);

  const d = data ?? EMPTY_DATA;
  const topTools = d.reading.topTools ?? [];
  const topCategories = d.reading.topCategories ?? [];
  const countries = (d.reach.countriesList ?? []).filter((country) =>
    isKnownCountry(country.name)
  );
  const combinedRows = Math.max(
    d.reach.browsers.length,
    d.reach.operatingSystems.length,
    d.reach.devices.length,
    1
  );

  const handleRefresh = () => {
    setRefreshing(true);
    refresh();
    window.setTimeout(() => setRefreshing(false), 700);
  };

  const totalLabel = useMemo(
    () => (loading ? 'Loading…' : d.visitors.total.toLocaleString()),
    [d.visitors.total, loading]
  );

  return (
    <Container className="py-8">
      <Breadcrumbs items={[{ label: 'Analytics' }]} />

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-fg">
              Live analytics
            </h1>
            <Badge variant="success">
              <Activity aria-hidden className="mr-1 h-3 w-3" />
              Live
            </Badge>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-fg-muted">
            Privacy-first, real-time analytics for CoderTools. No cookies, no IP
            storage and no fingerprinting — just anonymous visitor counts with a
            random localStorage ID.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge>No cookies</Badge>
            <Badge>No IP storage</Badge>
            <Badge>No fingerprinting</Badge>
            <Badge>Anonymous</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {loading && <Spinner />}
          <Button
            disabled={refreshing}
            onClick={handleRefresh}
            variant="default"
          >
            <RefreshCw
              aria-hidden
              className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')}
            />
            Refresh
          </Button>
        </div>
      </div>

      {!analyticsConfigured && (
        <Callout
          className="mt-4"
          title="Analytics is not connected"
          variant="warning"
        >
          Set <code>NEXT_PUBLIC_SUPABASE_TRACK_URL</code> and{' '}
          <code>NEXT_PUBLIC_SUPABASE_ANALYTICS_URL</code> at build time, then
          deploy the <code>codertools-track</code> and{' '}
          <code>codertools-analytics</code> Supabase functions. See{' '}
          <code>docs/ANALYTICS.md</code>.
        </Callout>
      )}

      {analyticsConfigured && !data && !loading && (
        <Callout
          className="mt-4"
          title="Unable to load analytics"
          variant="error"
        >
          Check the Supabase function URLs, CORS origins and the{' '}
          <code>codertools_*</code> tables.
        </Callout>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <HeroCard label="Visitors" value={totalLabel} />
        <HeroCard
          label="Page views"
          value={d.reading.totalPageViews.toLocaleString()}
        />
        <HeroCard label="Online now" value={d.visitors.onlineNow} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-md border border-border bg-success-subtle/20 px-3 py-2 text-xs text-fg-muted">
        <span className="h-2 w-2 rounded-full bg-success" />
        <span suppressHydrationWarning>
          {visit.first
            ? 'First time here — welcome.'
            : `Returning visitor, visit #${visit.count}.`}
        </span>
        <span className="ml-auto text-fg-subtle">
          Tracking anonymous page views only.
        </span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel
          description="Anonymous visitor counts, all-time and recent."
          title="Audience"
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <StatCard
              accent
              label="Total visitors"
              value={d.visitors.total.toLocaleString()}
            />
            <StatCard label="This month" value={d.visitors.month} />
            <StatCard label="This week" value={d.visitors.week} />
            <StatCard label="Today" value={d.visitors.today} />
            <StatCard
              label="Total visits"
              value={d.visitors.totalVisits.toLocaleString()}
            />
            <StatCard label="Returning" value={`${d.visitors.returningPct}%`} />
          </div>
        </Panel>

        <Panel
          description="Where visitors come from and what they use."
          title="Reach"
        >
          <div className="grid grid-cols-2 gap-2">
            <StatCard label="Countries" value={d.reach.countries} />
            <StatCard
              label="Top country"
              value={
                isKnownCountry(d.reach.topCountry)
                  ? countryName(d.reach.topCountry)
                  : '—'
              }
            />
          </div>

          <div className="mt-3 space-y-1.5">
            {countries.length > 0 ? (
              countries.map((country) => (
                <div
                  className="flex items-center gap-2 rounded-md border border-border bg-canvas-subtle/40 px-2 py-1.5"
                  key={country.name}
                >
                  <CountryBadge code={country.name} />
                  <span className="min-w-0 flex-1 truncate text-xs text-fg">
                    {countryName(country.name)}
                  </span>
                  <span className="text-xs text-fg-muted">{country.value}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-fg-muted">
                No country data yet. It will populate from production traffic
                via Cloudflare headers.
              </p>
            )}
          </div>

          {typeof d.reach.unknown === 'number' && d.reach.unknown > 0 && (
            <p className="mt-2 text-[11px] text-fg-subtle">
              {d.reach.unknown.toLocaleString()} visitor
              {d.reach.unknown === 1 ? '' : 's'} had no country data and are
              included in the totals.
            </p>
          )}

          <div className="mt-4 overflow-x-auto rounded-md border border-border">
            <div className="min-w-[480px]">
              <div className="grid grid-cols-3 border-b border-border bg-canvas-subtle/60 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-fg-muted">
                <span>Browser</span>
                <span>OS</span>
                <span>Device</span>
              </div>
              {Array.from({ length: combinedRows }).map((_, index) => (
                <div
                  className="grid grid-cols-3 gap-2 border-b border-border-muted px-2 py-1.5 text-xs last:border-0"
                  key={index}
                >
                  <CombinedCell item={d.reach.browsers[index]} />
                  <CombinedCell item={d.reach.operatingSystems[index]} />
                  <CombinedCell item={d.reach.devices[index]} />
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel
          description="What people use and which tools are popular."
          title="Content"
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatCard
              label="Page views"
              value={d.reading.totalPageViews.toLocaleString()}
            />
            <StatCard
              label="Average per visit"
              value={d.reading.avgPagesPerVisit}
            />
            <StatCard label="Top tools" value={topTools.length} />
            <StatCard label="Categories reached" value={topCategories.length} />
          </div>

          <div className="mt-4 grid gap-5 sm:grid-cols-3">
            <BarList title="Top pages" items={d.reading.topPages} />
            <BarList title="Top tools" items={topTools} />
            <BarList title="Top categories" items={topCategories} />
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel
          description="The latest anonymous visitors."
          title="Recent activity"
        >
          {d.recent.length > 0 ? (
            <div>
              {d.recent.map((visitor, index) => (
                <div
                  className="flex items-center gap-2 border-b border-border-muted py-2 text-xs last:border-0"
                  key={`${visitor.visitorId}-${index}`}
                >
                  <span
                    className={cn(
                      'h-2 w-2 shrink-0 rounded-full',
                      visitor.online ? 'bg-success' : 'bg-fg-subtle'
                    )}
                  />
                  <CountryBadge code={visitor.country} />
                  <span className="min-w-0 flex-1 truncate text-fg-muted">
                    {visitor.browser}, {visitor.os}
                    {visit.id && visitor.visitorId === visit.id && (
                      <Badge className="ml-2" variant="accent">
                        You
                      </Badge>
                    )}
                  </span>
                  <span className="shrink-0 text-fg-subtle">
                    {formatAgo(visitor.ago)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-fg-muted">No visitors yet.</p>
          )}

          <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
            <Badge>
              <Users aria-hidden className="mr-1 h-3 w-3" />
              {d.visitors.onlineNow} online
            </Badge>
            <Badge>
              <Globe2 aria-hidden className="mr-1 h-3 w-3" />
              {isKnownCountry(d.reach.latestCountry)
                ? countryName(d.reach.latestCountry)
                : 'Location unavailable'}
            </Badge>
            <Badge>
              <MonitorSmartphone aria-hidden className="mr-1 h-3 w-3" />
              {d.reach.devices[0]?.name ?? 'No device data'}
            </Badge>
          </div>
        </Panel>

        <Panel description="Anonymous page views over time." title="Trends">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
                Last 7 days
              </h3>
              <Sparkline data={d.trends.weekly} />
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
                Last 30 days
              </h3>
              <Sparkline data={d.trends.monthly} />
            </div>
          </div>
        </Panel>
      </div>

      <div className="mt-8 border-t border-border pt-5">
        <div className="flex flex-wrap gap-2">
          {[
            'Next.js 16',
            'Supabase',
            'Edge Functions',
            'Postgres',
            'Polling 30s',
            'Privacy-first',
          ].map((item) => (
            <Badge key={item}>{item}</Badge>
          ))}
        </div>
        <p className="mt-3 text-xs leading-5 text-fg-muted">
          Custom analytics built for CoderTools. No third-party trackers, no
          cookies and no PII. This page is intentionally excluded from search
          engines.
        </p>
      </div>
    </Container>
  );
}
