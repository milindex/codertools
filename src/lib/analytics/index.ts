const TRACK_PROXY_URL = '/api/track';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const TRACK_URL =
  process.env.NEXT_PUBLIC_SUPABASE_TRACK_URL ||
  (SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/codertools-track` : '');
const ANALYTICS_URL =
  process.env.NEXT_PUBLIC_SUPABASE_ANALYTICS_URL ||
  (SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/codertools-analytics` : '');

const VISITOR_KEY = 'codertools:visitor-id';
const SEEN_KEY = 'codertools:visitor-seen';
const VISIT_KEY = 'codertools:visit-count';

const isLocalhost = () => {
  if (typeof window === 'undefined') {
    return false;
  }
  return ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
};

const trackingDisabled = () =>
  isLocalhost() && process.env.NEXT_PUBLIC_ANALYTICS_DEBUG !== 'true';

const generateId = () => {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let id = '';
  for (let index = 0; index < bytes.length; index += 1) {
    id += chars[bytes[index]! % chars.length];
  }
  return id;
};

export const analyticsConfigured = Boolean(ANALYTICS_URL);
export const trackingConfigured = Boolean(TRACK_URL);

export const getVisitorId = () => {
  if (typeof window === 'undefined') {
    return '';
  }
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = generateId();
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
};

export const isReturningVisitor = () => {
  if (typeof window === 'undefined') {
    return false;
  }
  return localStorage.getItem(SEEN_KEY) === '1';
};

export const markSeen = () => {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(SEEN_KEY, '1');
};

export const getVisitCount = () => {
  if (typeof window === 'undefined') {
    return 1;
  }
  const value = Number.parseInt(localStorage.getItem(VISIT_KEY) || '1', 10);
  return Number.isFinite(value) && value > 0 ? value : 1;
};

export const incrementVisitCount = () => {
  if (typeof window === 'undefined') {
    return 1;
  }
  const next = getVisitCount() + 1;
  localStorage.setItem(VISIT_KEY, String(next));
  return next;
};

let lastTracked = '';

export async function trackPageView(pathname: string) {
  if (typeof navigator === 'undefined' || trackingDisabled()) {
    return;
  }

  const visitorId = getVisitorId();
  const key = `${visitorId}:${pathname}`;
  if (key === lastTracked) {
    return;
  }
  lastTracked = key;

  const payload = { visitorId, pathname, type: 'pageview' };

  try {
    const response = await fetch(TRACK_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (response.ok) {
      markSeen();
      return;
    }
  } catch {
    // The Pages Function is not available in dev or on static-only hosts.
  }

  if (!TRACK_URL) {
    return;
  }

  try {
    await fetch(TRACK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    markSeen();
  } catch {
    // Analytics must never break the page.
  }
}

export async function sendHeartbeat() {
  if (!TRACK_URL || trackingDisabled()) {
    return;
  }
  try {
    await fetch(TRACK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId: getVisitorId(),
        type: 'heartbeat',
      }),
    });
  } catch {
    // Ignore network failures.
  }
}

export async function fetchAnalytics() {
  if (!ANALYTICS_URL) {
    if (
      typeof window !== 'undefined' &&
      process.env.NODE_ENV === 'development'
    ) {
      console.warn('NEXT_PUBLIC_SUPABASE_ANALYTICS_URL is not set');
    }
    return null;
  }

  try {
    const response = await fetch(ANALYTICS_URL, { cache: 'no-store' });
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch {
    return null;
  }
}
