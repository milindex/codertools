import type { Metadata } from 'next';
import Link from 'next/link';

import { LegalPage } from '@/components/legal/LegalPage';
import { AppConfig } from '@/utils/AppConfig';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'The terms that apply when you use CoderTools. The tools are provided as-is, run locally in your browser, and are not a substitute for professional advice.',
  keywords: [
    'CoderTools terms',
    'terms of service',
    'acceptable use',
    'developer tools',
  ],
  alternates: {
    canonical: '/terms/',
  },
  openGraph: {
    type: 'website',
    title: `Terms of Service · ${AppConfig.siteName}`,
    description:
      'The terms that apply when you use CoderTools and its browser-based developer tools.',
    url: '/terms/',
    siteName: AppConfig.siteName,
    locale: AppConfig.locale,
  },
  twitter: {
    card: 'summary_large_image',
    title: `Terms of Service · ${AppConfig.siteName}`,
    description:
      'The terms that apply when you use CoderTools and its browser-based developer tools.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsPage() {
  return (
    <LegalPage
      description="The terms that apply when you use CoderTools and its browser-based developer tools."
      path="/terms/"
      title="Terms of Service"
    >
      <p>
        These terms apply to your use of CoderTools at{' '}
        <a href={AppConfig.url}>{AppConfig.url}</a>. By using the site, you
        agree to these terms. If you do not agree, do not use the site.
      </p>

      <h2>Use of the tools</h2>
      <p>
        CoderTools provides browser-based utilities for formatting, converting,
        validating, generating and inspecting code and data. The tools run
        locally in your browser. You are responsible for the code, text, files
        and data you process with them.
      </p>
      <p>
        You may use the tools for personal or commercial work. You may not use
        the site to break the law, infringe intellectual property, distribute
        malware, attack systems, or interfere with the site or other users.
      </p>

      <h2>No professional advice</h2>
      <p>
        The tools and content are provided for general development convenience.
        They are not legal, security, financial or other professional advice.
        Always review generated or transformed output before using it in
        production.
      </p>

      <h2>No warranty</h2>
      <p>
        The site and tools are provided &ldquo;as is&rdquo; and &ldquo;as
        available&rdquo; without warranties of any kind, express or implied,
        including merchantability, fitness for a particular purpose,
        non-infringement, accuracy, or uninterrupted availability.
      </p>
      <p>
        We do not guarantee that a formatter, validator, converter, hash or
        generator will be error-free or suitable for your specific use case.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, CoderTools and its author are
        not liable for indirect, incidental, special, consequential or punitive
        damages, or for lost profits, data, code or business opportunities,
        arising from or related to your use of the site.
      </p>

      <h2>Intellectual property</h2>
      <p>
        The CoderTools name, logo, site design and original content are owned by
        the site author. Open-source libraries used by the tools remain subject
        to their own licenses. You retain ownership of the code and data you
        process with the tools.
      </p>

      <h2>Third-party services</h2>
      <p>
        The site uses Cloudflare for delivery and Supabase for anonymous
        analytics. Links to third-party sites are provided for convenience; we
        are not responsible for their content or practices.
      </p>

      <h2>Changes and availability</h2>
      <p>
        We may add, change, suspend or remove tools and pages at any time. We
        may update these terms; the latest version is always available at{' '}
        <Link href="/terms/">/terms/</Link>.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of India, without regard to
        conflict-of-law rules. Any dispute is subject to the competent courts of
        India.
      </p>

      <h2>Contact</h2>
      <p>
        For questions about these terms, use the contact form at{' '}
        <a href="https://milinds.dev/contact">milinds.dev/contact</a>. See also
        our <Link href="/privacy/">Privacy Policy</Link> and{' '}
        <Link href="/cookies/">Cookie Policy</Link>.
      </p>
    </LegalPage>
  );
}
