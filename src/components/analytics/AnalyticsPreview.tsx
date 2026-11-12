'use client';

import { Activity, ChevronDown, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { usePresence } from '@/hooks/usePresence';
import { analyticsConfigured } from '@/lib/analytics';
import { cn } from '@/utils/cn';

const format = (value: number | undefined) =>
  typeof value === 'number' ? value.toLocaleString() : '—';

export const AnalyticsPreview = () => {
  const [open, setOpen] = useState(false);
  const { data, loading } = usePresence();

  const stats = useMemo(
    () => ({
      visitors: data?.visitors?.total,
      online: data?.visitors?.onlineNow,
      today: data?.visitors?.today,
      pageViews: data?.reading?.totalPageViews,
      countries: data?.reach?.countries,
      returningPct: data?.visitors?.returningPct,
    }),
    [data]
  );

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <button
        aria-controls="analytics-preview-panel"
        aria-expanded={open}
        className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-left transition-colors hover:bg-surface-hover"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span className="flex items-center gap-2 text-xs font-semibold text-fg">
          <Activity
            aria-hidden
            className={cn(
              'h-3.5 w-3.5',
              analyticsConfigured ? 'text-success' : 'text-fg-subtle'
            )}
          />
          Live analytics
          {loading && analyticsConfigured && (
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
          )}
        </span>

        <span className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-muted">
          <span>
            <strong className="font-semibold text-fg">
              {format(stats.visitors)}
            </strong>{' '}
            visitors
          </span>
          <span>
            <strong className="font-semibold text-fg">
              {format(stats.online)}
            </strong>{' '}
            online
          </span>
          <span className="hidden sm:inline">
            <strong className="font-semibold text-fg">
              {format(stats.pageViews)}
            </strong>{' '}
            views
          </span>
          <span className="hidden sm:inline">
            <strong className="font-semibold text-fg">
              {format(stats.countries)}
            </strong>{' '}
            countries
          </span>
        </span>

        <ChevronDown
          aria-hidden
          className={cn(
            'h-4 w-4 shrink-0 text-fg-muted transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>

      <div
        aria-hidden={!open}
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
        id="analytics-preview-panel"
      >
        <div className="overflow-hidden" inert={!open}>
          <div className="border-t border-border bg-canvas-subtle/30 p-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {[
                { label: 'Visitors', value: format(stats.visitors) },
                { label: 'Today', value: format(stats.today) },
                { label: 'Page views', value: format(stats.pageViews) },
                { label: 'Countries', value: format(stats.countries) },
                {
                  label: 'Returning',
                  value:
                    typeof stats.returningPct === 'number'
                      ? `${stats.returningPct}%`
                      : '—',
                },
                { label: 'Online now', value: format(stats.online) },
              ].map((item) => (
                <div
                  className="rounded-md border border-border bg-surface px-3 py-2 transition-colors hover:border-fg-subtle"
                  key={item.label}
                >
                  <p className="text-lg font-semibold text-fg">{item.value}</p>
                  <p className="text-[11px] text-fg-muted">{item.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-fg-muted">
              <span>
                {analyticsConfigured
                  ? 'Anonymous. No cookies. No tracking.'
                  : 'Analytics is not connected for this build.'}
              </span>
              <Link
                className="inline-flex items-center gap-1 font-medium text-accent transition-colors hover:no-underline"
                href="/analytics/"
              >
                View the full dashboard
                <ExternalLink aria-hidden className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
