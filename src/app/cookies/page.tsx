import type { Metadata } from 'next';
import Link from 'next/link';

import { LegalPage } from '@/components/legal/LegalPage';
import { AppConfig } from '@/utils/AppConfig';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description:
    'CoderTools does not use advertising or analytics cookies. This page explains the local storage keys and the Cloudflare security cookies that may be used.',
  keywords: [
    'CoderTools cookies',
    'cookie policy',
    'local storage',
    'anonymous analytics',
  ],
  alternates: {
    canonical: '/cookies/',
  },
  openGraph: {
    type: 'website',
    title: `Cookie Policy · ${AppConfig.siteName}`,
    description:
      'How CoderTools uses local storage and why it does not use advertising or analytics cookies.',
    url: '/cookies/',
    siteName: AppConfig.siteName,
    locale: AppConfig.locale,
  },
  twitter: {
    card: 'summary_large_image',
    title: `Cookie Policy · ${AppConfig.siteName}`,
    description:
      'How CoderTools uses local storage and why it does not use advertising or analytics cookies.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function CookiesPage() {
  return (
    <LegalPage
      description="How CoderTools uses local storage and why it does not use advertising or analytics cookies."
      path="/cookies/"
      title="Cookie Policy"
    >
      <p>
        CoderTools does not use advertising cookies, cross-site tracking cookies
        or third-party analytics cookies. The tools themselves run in your
        browser.
      </p>

      <h2>What we store in your browser</h2>
      <p>
        The site uses <code>localStorage</code>, not cookies, for the following
        first-party values:
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 pr-3 font-semibold text-fg">Key</th>
              <th className="py-2 pr-3 font-semibold text-fg">Purpose</th>
              <th className="py-2 font-semibold text-fg">Lifetime</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-muted">
              <td className="py-2 pr-3 font-mono text-[11px]">
                codertools:visitor-id
              </td>
              <td className="py-2 pr-3">
                Random anonymous ID used to distinguish repeat visits.
              </td>
              <td className="py-2">Until you clear site data.</td>
            </tr>
            <tr className="border-b border-border-muted">
              <td className="py-2 pr-3 font-mono text-[11px]">
                codertools:visitor-seen
              </td>
              <td className="py-2 pr-3">
                Marks that the anonymous visitor has been counted before.
              </td>
              <td className="py-2">Until you clear site data.</td>
            </tr>
            <tr className="border-b border-border-muted">
              <td className="py-2 pr-3 font-mono text-[11px]">
                codertools:visit-count
              </td>
              <td className="py-2 pr-3">
                Stores the local visit number shown on the analytics page.
              </td>
              <td className="py-2">Until you clear site data.</td>
            </tr>
            <tr>
              <td className="py-2 pr-3 font-mono text-[11px]">ct-theme</td>
              <td className="py-2 pr-3">
                Remembers whether you prefer the light or dark theme.
              </td>
              <td className="py-2">Until you clear site data.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Analytics</h2>
      <p>
        Anonymous pageviews are sent to a Supabase Edge Function and stored in
        CoderTools-specific tables. The analytics system uses the local visitor
        ID described above. It does not set a cookie and does not store your IP
        address. Country data comes only from Cloudflare&apos;s country header.
      </p>

      <h2>Cloudflare cookies</h2>
      <p>
        Cloudflare may set security or bot-management cookies, such as{' '}
        <code>__cf_bm</code>, when its protection features are active. These
        cookies are set by Cloudflare, not by CoderTools, and are used for
        network security and abuse prevention. See Cloudflare&apos;s cookie
        documentation for details.
      </p>

      <h2>Managing local storage</h2>
      <p>
        You can clear these values at any time through your browser&apos;s site
        data settings. Clearing them resets your anonymous visitor ID and local
        visit count. The tools will continue to work.
      </p>
      <p>
        Blocking analytics requests with a content blocker does not affect the
        tools.
      </p>

      <h2>More information</h2>
      <p>
        See our <Link href="/privacy/">Privacy Policy</Link> and{' '}
        <Link href="/terms/">Terms of Service</Link> for more about how the site
        is operated.
      </p>
    </LegalPage>
  );
}
