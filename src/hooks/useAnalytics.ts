'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

import { sendHeartbeat, trackPageView } from '@/lib/analytics';

export const useAnalytics = () => {
  const pathname = usePathname();
  const previous = useRef('');

  useEffect(() => {
    if (pathname === previous.current) {
      return;
    }
    previous.current = pathname;
    trackPageView(pathname);
  }, [pathname]);

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat();
      }
    }, 30000);

    return () => clearInterval(id);
  }, []);
};
