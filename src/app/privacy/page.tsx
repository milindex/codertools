import type { Metadata } from 'next';
import Link from 'next/link';

import { LegalPage } from '@/components/legal/LegalPage';
import { AppConfig } from '@/utils/AppConfig';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How CoderTools handles anonymous analytics, local storage, country data and your privacy. No uploads, no accounts and no advertising trackers.',
  keywords: [
    'CoderTools privacy',
    'privacy policy',
    'anonymous analytics',
    'no cookies',
    'client-side tools',
  ],
  alternates: {
    canonical: '/privacy/',
  },
  openGraph: {
    type: 'website',
    title: `Privacy Policy · ${AppConfig.siteName}`,
    description:
      'How CoderTools handles anonymous analytics, local storage and your privacy.',
    url: '/privacy/',
    siteName: AppConfig.siteName,
    locale: AppConfig.locale,
  },
  twitter: {
    card: 'summary_large_image',
    title: `Privacy Policy · ${AppConfig.siteName}`,
    description:
      'How CoderTools handles anonymous analytics, local storage and your privacy.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      description="How CoderTools handles anonymous analytics, local storage and your privacy."
      path="/privacy/"
      title="Privacy Policy"
    >
      <p>
        CoderTools is a collection of browser-based developer tools. This policy
        explains what information is processed when you use the site, why it is
        processed, and the choices you have.
      </p>

      <h2>Short version</h2>
      <ul>
        <li>Your code, text and files are processed in your browser.</li>
        <li>We do not upload your tool input to a server.</li>
        <li>We do not use advertising trackers or sell personal data.</li>
        <li>
          We use a random visitor ID in local storage and anonymous usage counts
          to understand which tools are useful.
        </li>
      </ul>

      <h2>Information we process</h2>
      <p>
        When you visit a page, the analytics system records an anonymous
        pageview. The record can include the page path, timestamp, browser
        family, operating system, device type, and a two-letter country code
        supplied by Cloudflare&apos;s <code>CF-IPCountry</code> header. We do
        not store your IP address in the CoderTools analytics tables.
      </p>
      <p>
        A random 32-character visitor ID is generated in your browser and stored
        in <code>localStorage</code>. It is used to distinguish repeat visits
        and calculate aggregate visitor counts. It is not linked to your name,
        email address or account because CoderTools does not have accounts.
      </p>
      <p>
        Tool inputs are never sent to the analytics service. The tools run in
        your browser using JavaScript, Web APIs and, where needed, local
        WebAssembly modules.
      </p>

      <h2>How we use information</h2>
      <ul>
        <li>To understand aggregate traffic and popular tools.</li>
        <li>To maintain and improve the site and its tools.</li>
        <li>To detect abuse, spam or automated traffic.</li>
      </ul>
      <p>
        We do not use analytics data for advertising, profiling, or selling to
        third parties. We do not combine it with data from other websites.
      </p>

      <h2>Legal bases</h2>
      <p>
        Where data protection law requires a legal basis, we rely on our
        legitimate interest in understanding aggregate usage and keeping the
        service reliable. Where local law requires consent for analytics, we
        will ask for it before enabling non-essential analytics.
      </p>

      <h2>Service providers</h2>
      <ul>
        <li>
          <strong>Cloudflare</strong> serves the site and supplies the country
          code used by analytics. Cloudflare may process network metadata as
          part of its security and delivery services.
        </li>
        <li>
          <strong>Supabase</strong> stores anonymous analytics records in
          project-specific tables named <code>codertools_visitors</code>,{' '}
          <code>codertools_page_views</code> and{' '}
          <code>codertools_presence</code>.
        </li>
      </ul>
      <p>
        These providers process data on our behalf and may process it in
        countries other than yours. They are bound by their own data protection
        terms and applicable safeguards.
      </p>

      <h2>Retention</h2>
      <p>
        Anonymous analytics records are retained only as long as needed for
        aggregate reporting, and are reviewed periodically. Because the visitor
        ID is random and not connected to an identity, we may not be able to
        locate a specific person&apos;s record without additional information
        from you.
      </p>

      <h2>Your choices and rights</h2>
      <p>
        You can clear the visitor ID and visit count by clearing site data for
        this domain in your browser. You can block analytics requests with a
        content blocker; the tools will continue to work.
      </p>
      <p>
        Depending on where you live, you may have rights to access, correct,
        delete, restrict or object to the processing of personal data. To make a
        request, contact us through{' '}
        <a href="https://milinds.dev/contact">milinds.dev/contact</a>. We will
        respond within the time required by applicable law.
      </p>

      <h2>Children</h2>
      <p>
        CoderTools is a developer tool and is not directed at children under 13.
        We do not knowingly collect personal information from children.
      </p>

      <h2>Changes</h2>
      <p>
        We may update this policy as the site changes. The latest version is
        always available at <Link href="/privacy/">/privacy/</Link>, with the
        update date shown above.
      </p>

      <h2>Contact</h2>
      <p>
        For privacy questions, use the contact form at{' '}
        <a href="https://milinds.dev/contact">milinds.dev/contact</a>. See also
        our <Link href="/terms/">Terms of Service</Link> and{' '}
        <Link href="/cookies/">Cookie Policy</Link>.
      </p>
    </LegalPage>
  );
}
