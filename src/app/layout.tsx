import '../styles/global.css';

import type { Metadata } from 'next';
import { Barlow } from 'next/font/google';
import type { ReactNode } from 'react';

import { AnalyticsTracker } from '@/components/analytics/AnalyticsTracker';
import { Footer } from '@/components/site/Footer';
import { Header } from '@/components/site/Header';
import { ServiceWorkerRegistration } from '@/components/site/ServiceWorkerRegistration';
import { AppConfig } from '@/utils/AppConfig';

const barlow = Barlow({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-barlow',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(AppConfig.url),
  title: {
    default: AppConfig.title,
    template: `%s · ${AppConfig.siteName}`,
  },
  description: AppConfig.description,
  applicationName: AppConfig.siteName,
  authors: [{ name: AppConfig.author }],
  creator: AppConfig.author,
  keywords: [
    'developer tools',
    'formatter',
    'minifier',
    'validator',
    'converter',
    'hash generator',
    'json tools',
    'regex tester',
    'uuid generator',
  ],
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/logo-mark.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: AppConfig.locale,
    url: AppConfig.url,
    siteName: AppConfig.siteName,
    title: AppConfig.title,
    description: AppConfig.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: AppConfig.title,
    description: AppConfig.description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

const themeScript = `(function(){try{var t=localStorage.getItem('ct-theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='dark';}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html
      className={barlow.variable}
      lang={AppConfig.locale}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-screen flex-col bg-canvas text-fg antialiased">
        <Header />
        <div className="flex-1">{children}</div>
        <Footer />
        <AnalyticsTracker />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
