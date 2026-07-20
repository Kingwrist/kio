import { NextResponse } from 'next/server';
import { CACHE_TTL_MS, ROUTES, type TrafficStatus } from '../../lib/routes';
import { createAdminClient } from '../../lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type CacheRow = {
  route_id: string;
  route_name: string;
  status: TrafficStatus;
  delay_minutes: number | null;
  travel_time_minutes: number | null;
  free_flow_minutes: number | null;
  average_speed: number | null;
  updated_at: string;
};

type TomTomSummary = {
  lengthInMeters?: number;
  travelTimeInSeconds?: number;
  trafficDelayInSeconds?: number;
  noTrafficTravelTimeInSeconds?: number;
};

type RefreshResult = { rows: CacheRow[]; errors: string[] };

let refreshPromise: Promise<RefreshResult> | null = null;
let memoryCache: CacheRow[] = [];


function minutes(seconds?: number) {
  return typeof seconds === 'number' ? Math.max(0, Math.round(seconds / 60)) : null;
}

function getStatus(delay: number | null): TrafficStatus {
  if (delay === null) return 'onbekend';
  if (delay < 5) return 'groen';
  if (delay < 15) return 'oranje';
  return 'rood';
}

function getAverageSpeed(length?: number, travelTime?: number) {
  if (!length || !travelTime) return null;
  return Math.max(1, Math.round((length / travelTime) * 3.6));
}

function isFresh(rows: CacheRow[]) {
  if (rows.length !== ROUTES.length) return false;
  const oldest = Math.min(...rows.map((row) => new Date(row.updated_at).getTime()));
  return Number.isFinite(oldest) && Date.now() - oldest < CACHE_TTL_MS;
}

async function readCache() {
  const supabase = createAdminClient();
  if (!supabase) return memoryCache;
  const { data, error } = await supabase.from('route_cache').select('*').order('route_name');
  if (error) throw new Error(`Supabase lezen mislukt: ${error.message}`);
  return (data || []) as CacheRow[];
}

async function writeCache(rows: CacheRow[]) {
  memoryCache = rows;
  const supabase = createAdminClient();
  if (!supabase) return;
  const { error } = await supabase.from('route_cache').upsert(rows, { onConflict: 'route_id' });
  if (error) throw new Error(`Supabase opslaan mislukt: ${error.message}`);
}

async function fetchRoute(route: (typeof ROUTES)[number]): Promise<CacheRow> {
  const key = process.env.TOMTOM_API_KEY;
  if (!key) throw new Error('TOMTOM_API_KEY ontbreekt');

  const points = [route.start, ...(route.via || []), route.destination]
    .map(([lat, lon]) => `${lat},${lon}`)
    .join(':');
  const url = new URL(`https://api.tomtom.com/routing/1/calculateRoute/${points}/json`);
  url.searchParams.set('key', key);
  url.searchParams.set('traffic', 'true');
  url.searchParams.set('travelMode', 'car');
  url.searchParams.set('routeType', 'fastest');
  url.searchParams.set('computeTravelTimeFor', 'all');
  url.searchParams.set('routeRepresentation', 'summaryOnly');

  const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(12_000) });
  if (!response.ok) throw new Error(`TomTom ${response.status} voor ${route.name}`);
  const body = await response.json();
  const summary = body?.routes?.[0]?.summary as TomTomSummary | undefined;
  if (!summary) throw new Error(`Geen TomTom-route voor ${route.name}`);

  const travel = minutes(summary.travelTimeInSeconds);
  const delay = minutes(summary.trafficDelayInSeconds);
  const freeFlow = minutes(summary.noTrafficTravelTimeInSeconds) ??
    (travel !== null && delay !== null ? Math.max(0, travel - delay) : null);

  return {
    route_id: route.id,
    route_name: route.name,
    status: getStatus(delay),
    delay_minutes: delay,
    travel_time_minutes: travel,
    free_flow_minutes: freeFlow,
    average_speed: getAverageSpeed(summary.lengthInMeters, summary.travelTimeInSeconds),
    updated_at: new Date().toISOString(),
  };
}

async function refreshAll(): Promise<RefreshResult> {
  const settled = await Promise.allSettled(ROUTES.map(fetchRoute));
  const previous = await readCache().catch(() => memoryCache);
  const previousById = new Map(previous.map((row) => [row.route_id, row]));
  const errors: string[] = [];

  const rows = settled.map((result, index): CacheRow => {
    if (result.status === 'fulfilled') return result.value;
    const route = ROUTES[index];
    const message = result.reason instanceof Error ? result.reason.message : String(result.reason);
    errors.push(`${route.name}: ${message}`);
    const old = previousById.get(route.id);
    return old || {
      route_id: route.id,
      route_name: route.name,
      status: 'onbekend',
      delay_minutes: null,
      travel_time_minutes: null,
      free_flow_minutes: null,
      average_speed: null,
      updated_at: new Date().toISOString(),
    };
  });

  await writeCache(rows);
  return { rows, errors };
}

function toPayload(rows: CacheRow[], source: 'cache' | 'tomtom' | 'admin', errors: string[] = []) {
  const sorted = ROUTES.map((route) => rows.find((row) => row.route_id === route.id)).filter(Boolean) as CacheRow[];
  const newest = sorted.length
    ? Math.max(...sorted.map((row) => new Date(row.updated_at).getTime()))
    : Date.now();

  return {
    updatedAt: new Date(newest).toISOString(),
    cacheSeconds: CACHE_TTL_MS / 1000,
    source,
    routes: sorted.map((row) => ({
      id: row.route_id,
      name: row.route_name,
      status: row.status,
      delayMinutes: row.delay_minutes,
      travelTimeMinutes: row.travel_time_minutes,
      freeFlowMinutes: row.free_flow_minutes,
      averageSpeed: row.average_speed,
      updatedAt: row.updated_at,
    })),
    ...(errors.length ? { diagnostics: errors } : {}),
  };
}

export async function GET(request: Request) {
  try {
    const cached = await readCache();
    const mode = new URL(request.url).searchParams.get('mode');
    const mayRefresh = mode !== 'cache';
    let rows = cached;
    let source: 'cache' | 'tomtom' = 'cache';
    let errors: string[] = [];

    if (mayRefresh && !isFresh(cached)) {
      if (!refreshPromise) {
        refreshPromise = refreshAll().finally(() => {
          refreshPromise = null;
        });
      }
      const refreshed = await refreshPromise;
      rows = refreshed.rows;
      errors = refreshed.errors;
      source = 'tomtom';
    }

    return NextResponse.json(toPayload(rows, source, errors), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return NextResponse.json(
      {
        updatedAt: new Date().toISOString(),
        cacheSeconds: CACHE_TTL_MS / 1000,
        source: 'error',
        routes: memoryCache,
        error: error instanceof Error ? error.message : 'Onbekende fout',
      },
      { status: memoryCache.length ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const configuredCode = process.env.ADMIN_REFRESH_CODE;

    if (!configuredCode) {
      return NextResponse.json(
        { error: 'ADMIN_REFRESH_CODE ontbreekt in Vercel.' },
        { status: 500, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    if (String(body?.code ?? '') !== configuredCode) {
      return NextResponse.json(
        { error: 'Onjuiste admincode.' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    if (!refreshPromise) {
      refreshPromise = refreshAll().finally(() => {
        refreshPromise = null;
      });
    }
    const refreshed = await refreshPromise;

    return NextResponse.json(toPayload(refreshed.rows, 'admin', refreshed.errors), {
      status: refreshed.errors.length === ROUTES.length ? 502 : 200,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Handmatig vernieuwen mislukt.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
