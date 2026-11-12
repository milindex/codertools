import { createClient } from 'npm:@supabase/supabase-js@2';

// Public, read-only aggregate endpoint. No credentials are used, so it is safe
// to allow the custom domain and Cloudflare Pages preview domains.
function getCorsHeaders(_origin: string | null) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

type Counted = { name: string; value: number };

function isKnownCountry(code: string | null | undefined): code is string {
  return (
    typeof code === 'string' &&
    /^[A-Z]{2}$/.test(code) &&
    code !== 'XX' &&
    code !== 'T1'
  );
}

function countBy(data: Array<Record<string, unknown>> | null, key: string) {
  const map: Record<string, number> = {};
  for (const row of data || []) {
    const value = (row[key] as string) || 'Unknown';
    map[value] = (map[value] || 0) + 1;
  }
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({ name, value }));
}

function topToolPaths(data: Array<{ pathname: string }> | null): Counted[] {
  const map: Record<string, number> = {};
  for (const row of data || []) {
    const slug = row.pathname.replace(/^\/tools\//, '').replace(/\/$/, '');
    if (!slug) continue;
    map[slug] = (map[slug] || 0) + 1;
  }
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));
}

function topToolCategories(
  data: Array<{ pathname: string }> | null
): Counted[] {
  const map: Record<string, number> = {};
  for (const row of data || []) {
    const slug = row.pathname.replace(/^\/tools\//, '').replace(/\/$/, '');
    const category = slug.split('/')[0];
    if (!category) continue;
    map[category] = (map[category] || 0) + 1;
  }
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));
}

function sparkline(data: Array<{ timestamp: string }> | null) {
  const days: Record<string, number> = {};
  for (const row of data || []) {
    const day = row.timestamp.split('T')[0]!;
    days[day] = (days[day] || 0) + 1;
  }

  const result: { date: string; value: number }[] = [];
  if (data && data.length > 0) {
    const start = new Date(data[0]!.timestamp);
    const end = new Date();
    for (
      let date = new Date(start);
      date <= end;
      date.setDate(date.getDate() + 1)
    ) {
      const key = date.toISOString().split('T')[0]!;
      result.push({ date: key, value: days[key] || 0 });
    }
  }
  return result;
}

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');
  const headers = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
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

  const now = new Date();
  const today = now.toISOString().split('T')[0]!;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);
  const monthStart = new Date(now);
  monthStart.setDate(now.getDate() - 30);
  const onlineThreshold = new Date(Date.now() - 60000).toISOString();

  try {
    const { count: totalVisitors } = await supabase
      .from('codertools_visitors')
      .select('*', { count: 'exact', head: true });
    const { count: todayVisitors } = await supabase
      .from('codertools_visitors')
      .select('*', { count: 'exact', head: true })
      .gte('last_seen', today);
    const { count: weekVisitors } = await supabase
      .from('codertools_visitors')
      .select('*', { count: 'exact', head: true })
      .gte('last_seen', weekStart.toISOString());
    const { count: monthVisitors } = await supabase
      .from('codertools_visitors')
      .select('*', { count: 'exact', head: true })
      .gte('last_seen', monthStart.toISOString());
    const { data: totalVisits } = await supabase
      .from('codertools_visitors')
      .select('visit_count');
    const { count: onlineNow } = await supabase
      .from('codertools_presence')
      .select('*', { count: 'exact', head: true })
      .gte('last_seen', onlineThreshold);
    const { data: onlineDeviceData } = await supabase
      .from('codertools_presence')
      .select('visitor_id, codertools_visitors!inner(device)')
      .gte('last_seen', onlineThreshold);
    const { data: countryData } = await supabase
      .from('codertools_visitors')
      .select('country');
    const { data: browserData } = await supabase
      .from('codertools_visitors')
      .select('browser');
    const { data: osData } = await supabase
      .from('codertools_visitors')
      .select('os');
    const { data: deviceData } = await supabase
      .from('codertools_visitors')
      .select('device');
    const { count: totalPageViews } = await supabase
      .from('codertools_page_views')
      .select('*', { count: 'exact', head: true });
    const { data: topPages } = await supabase
      .from('codertools_page_views')
      .select('pathname');
    const { data: topToolData } = await supabase
      .from('codertools_page_views')
      .select('pathname')
      .ilike('pathname', '/tools/%');
    const { data: recentVisitors } = await supabase
      .from('codertools_visitors')
      .select('visitor_id,country,browser,os,last_seen')
      .order('last_seen', { ascending: false })
      .limit(8);
    const { data: onlinePresence } = await supabase
      .from('codertools_presence')
      .select('visitor_id')
      .gte('last_seen', onlineThreshold);
    const onlineIds = new Set(
      (onlinePresence || []).map((row) => row.visitor_id)
    );
    const { count: returningVisitors } = await supabase
      .from('codertools_visitors')
      .select('*', { count: 'exact', head: true })
      .gt('visit_count', 1);
    const { data: weeklyTrend } = await supabase
      .from('codertools_page_views')
      .select('timestamp')
      .gte('timestamp', weekStart.toISOString())
      .order('timestamp', { ascending: true });
    const { data: monthlyTrend } = await supabase
      .from('codertools_page_views')
      .select('timestamp')
      .gte('timestamp', monthStart.toISOString())
      .order('timestamp', { ascending: true });

    const countryRows = (countryData || []) as Array<{
      country: string | null;
    }>;
    const knownCountryRows = countryRows.filter((row) =>
      isKnownCountry(row.country)
    );
    const unknownVisitors = countryRows.length - knownCountryRows.length;
    const knownCountryCodes = new Set(
      knownCountryRows.map((row) => row.country)
    );
    const countriesList = countBy(
      knownCountryRows as unknown as Array<Record<string, unknown>>,
      'country'
    );
    const distinctCountries = knownCountryCodes.size;
    const topCountry = countriesList[0]?.name || '—';
    const latestCountry =
      (recentVisitors || []).find((visitor) => isKnownCountry(visitor.country))
        ?.country || '—';

    const totalVisitsSum = (totalVisits || []).reduce(
      (sum, row) => sum + row.visit_count,
      0
    );
    const returningPct =
      (totalVisitors || 0) > 0
        ? Math.round(((returningVisitors || 0) / (totalVisitors || 1)) * 100)
        : 0;

    const onlineDeviceMap: Record<string, number> = {};
    for (const row of onlineDeviceData || []) {
      const device = (row as any).codertools_visitors?.device || 'Unknown';
      onlineDeviceMap[device] = (onlineDeviceMap[device] || 0) + 1;
    }
    const onlineByDevice = Object.entries(onlineDeviceMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));

    const topPageCounts: Record<string, number> = {};
    for (const row of topPages || []) {
      const path =
        row.pathname === '/' ? 'Home' : row.pathname.replace(/^\//, '');
      topPageCounts[path] = (topPageCounts[path] || 0) + 1;
    }

    return new Response(
      JSON.stringify({
        visitors: {
          total: totalVisitors || 0,
          today: todayVisitors || 0,
          week: weekVisitors || 0,
          month: monthVisitors || 0,
          totalVisits: totalVisitsSum,
          returningPct,
          onlineNow: onlineNow || 0,
          onlineByDevice,
        },
        reach: {
          countries: distinctCountries,
          topCountry,
          latestCountry,
          unknown: unknownVisitors,
          countriesList,
          browsers: countBy(browserData, 'browser'),
          operatingSystems: countBy(osData, 'os'),
          devices: countBy(deviceData, 'device'),
        },
        reading: {
          totalPageViews: totalPageViews || 0,
          avgPagesPerVisit:
            (totalVisitors || 0) > 0
              ? Math.round((totalPageViews || 0) / (totalVisitors || 1))
              : 0,
          topPages: Object.entries(topPageCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, value]) => ({ name, value })),
          topTools: topToolPaths(topToolData),
          topCategories: topToolCategories(topToolData),
        },
        recent: (recentVisitors || []).map((visitor) => ({
          visitorId: visitor.visitor_id,
          country: visitor.country,
          browser: visitor.browser,
          os: visitor.os,
          ago: Math.round(
            (Date.now() - new Date(visitor.last_seen).getTime()) / 60000
          ),
          online: onlineIds.has(visitor.visitor_id),
        })),
        lastActivity: recentVisitors?.[0]?.last_seen || null,
        trends: {
          weekly: sparkline(weeklyTrend),
          monthly: sparkline(monthlyTrend),
        },
      }),
      { headers: { ...headers, 'Content-Type': 'application/json' } }
    );
  } catch {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
});
