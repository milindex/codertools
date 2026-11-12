import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: { absolute: 'Live Analytics · CoderTools' },
  description:
    'Privacy-first, real-time analytics for CoderTools. No cookies, no IP storage, no fingerprinting — just anonymous visitor stats.',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: '/analytics/',
  },
};

export default function AnalyticsLayout({ children }: { children: ReactNode }) {
  return children;
}
