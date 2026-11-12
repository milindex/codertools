import { createClient } from 'npm:@supabase/supabase-js@2';

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://codertools.milinds.dev',
];

function getCorsHeaders(origin: string | null) {
  const allowOrigin =
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

const KNOWN_BOTS = [
  'bot',
  'crawler',
  'spider',
  'scraper',
  'curl',
  'wget',
  'headless',
  'selenium',
  'puppeteer',
  'playwright',
];

function parseUA(ua: string) {
  if (!ua) {
    return { browser: 'Bot', os: 'Bot' };
  }

  let browser = 'Unknown';
  if (/edg|edgios/i.test(ua)) browser = 'Edge';
  else if (/opr|opera/i.test(ua)) browser = 'Opera';
  else if (/samsungbrowser/i.test(ua)) browser = 'Samsung Internet';
  else if (/ucbrowser/i.test(ua)) browser = 'UC Browser';
  else if (/yaapp|yabrowser/i.test(ua)) browser = 'Yandex';
  else if (/crios/i.test(ua)) browser = 'Chrome';
  else if (/fxios/i.test(ua)) browser = 'Firefox';
  else if (/chrome|chromium/i.test(ua)) browser = 'Chrome';
  else if (/firefox/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua)) browser = 'Safari';

  let os = 'Unknown';
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/cros/i.test(ua)) os = 'Chrome OS';
  else if (/iphone|ipad|ipod|ios/i.test(ua)) os = 'iOS';
  else if (/mac os|macintosh/i.test(ua)) {
    os = /mobile\//i.test(ua) ? 'iOS' : 'macOS';
  } else if (/linux/i.test(ua)) {
    os = 'Linux';
  }

  return { browser, os };
}

function getDevice(ua: string, os: string) {
  if (!ua) return 'Bot';
  if (os === 'Android') {
    return /mobile/i.test(ua) ? 'Mobile' : 'Tablet';
  }
  if (os === 'iOS') {
    if (/iphone|ipod/i.test(ua)) return 'Mobile';
    return 'Tablet';
  }
  if (/mobile/i.test(ua)) return 'Mobile';
  if (/tablet|ipad/i.test(ua)) return 'Tablet';
  return 'Desktop';
}

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');
  const headers = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  const ua = req.headers.get('User-Agent') || '';
  if (KNOWN_BOTS.some((bot) => ua.toLowerCase().includes(bot))) {
    return new Response(JSON.stringify({ skipped: 'bot' }), {
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  const body = await req.json();
  const { visitorId, pathname, type } = body;

  if (!visitorId || typeof visitorId !== 'string' || visitorId.length > 64) {
    return new Response(JSON.stringify({ error: 'Invalid visitorId' }), {
      status: 400,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SB_URL') ||
      Deno.env.get('SUPABASE_URL') ||
      Deno.env.get('NEXT_PUBLIC_SUPABASE_URL') ||
      '',
    Deno.env.get('SB_SERVICE_ROLE_KEY') ||
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ||
      Deno.env.get('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') ||
      Deno.env.get('SUPABASE_ANON_KEY') ||
      ''
  );

  const { browser, os } = parseUA(ua);
  const device = getDevice(ua, os);

  // Country comes exclusively from the Cloudflare Pages Function. This header
  // is set by functions/api/track.js from CF-IPCountry. There is no client
  // country fallback and no IP-based geolocation here.
  const cfCountry = (
    req.headers.get('X-CoderTools-CF-Country') || ''
  ).toUpperCase();
  const country =
    /^[A-Z]{2}$/.test(cfCountry) && cfCountry !== 'XX' && cfCountry !== 'T1'
      ? cfCountry
      : 'Unknown';

  const now = new Date().toISOString();

  try {
    const { data: existing, error: lookupError } = await supabase
      .from('codertools_visitors')
      .select('visitor_id, visit_count')
      .eq('visitor_id', visitorId)
      .maybeSingle();

    if (lookupError) throw lookupError;

    if (existing) {
      if (type === 'heartbeat') {
        await supabase
          .from('codertools_visitors')
          .update({ last_seen: now })
          .eq('visitor_id', visitorId);
      } else {
        const updates: Record<string, unknown> = {
          last_seen: now,
          browser,
          os,
          device,
          visit_count: existing.visit_count + 1,
        };
        if (country !== 'Unknown') {
          updates.country = country;
        }
        await supabase
          .from('codertools_visitors')
          .update(updates)
          .eq('visitor_id', visitorId);
      }
    } else {
      await supabase.from('codertools_visitors').insert({
        visitor_id: visitorId,
        first_seen: now,
        last_seen: now,
        browser,
        os,
        device,
        country,
        visit_count: 1,
      });
    }

    await supabase
      .from('codertools_presence')
      .upsert(
        { visitor_id: visitorId, last_seen: now },
        { onConflict: 'visitor_id' }
      );

    if (pathname) {
      await supabase.from('codertools_page_views').insert({
        visitor_id: visitorId,
        pathname,
        timestamp: now,
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
});
