import { gunzipSync } from 'node:zlib';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NDW_BASE = 'https://opendata.ndw.nu';
const OSRM_BASE = 'https://router.project-osrm.org';
const BBOX = { minLat: 51.895, maxLat: 51.94, minLon: 4.55, maxLon: 4.64 };

type LatLng = [number, number];
type Site = { id: string; name: string; coordinates: LatLng[]; road?: string };
type Reading = { speed?: number; travelTime?: number; time?: string };
type RouteSpec = {
  id: string;
  corridorId: string;
  name: string;
  subtitle: string;
  points: LatLng[];
  freeFlowKmh: number;
  accessNote?: string;
};
type RouteGeometry = RouteSpec & { coordinates: LatLng[]; lengthMeters: number };

const ROUTES: RouteSpec[] = [
  {
    id: 'industrieweg', corridorId: 'algera-industrieweg', name: 'Industrieweg',
    subtitle: 'Krimpen uit → hoofdrijbaan', freeFlowKmh: 45,
    points: [[51.9089,4.6085],[51.9128,4.6042],[51.9158,4.5900],[51.9168,4.58032]],
    accessNote: 'Deze route sluit aan op de hoofdrijbaan, niet op de wisselstrook.'
  },
  {
    id: 'cg-roosweg', corridorId: 'algera-cg-roosweg', name: 'C.G. Roosweg',
    subtitle: 'Krimpen uit → hoofdrijbaan', freeFlowKmh: 50,
    points: [[51.9258,4.6170],[51.9225,4.6080],[51.9185,4.5930],[51.9168,4.58032]],
    accessNote: 'Deze route sluit aan op de hoofdrijbaan, niet op de wisselstrook.'
  },
  {
    id: 'nieuwe-tiendweg', corridorId: 'algera-nieuwe-tiendweg', name: 'Nieuwe Tiendweg',
    subtitle: 'Krimpen uit → Algerabrug', freeFlowKmh: 50,
    points: [[51.9284,4.6270],[51.9252,4.6170],[51.9216,4.6060],[51.9180,4.5920],[51.9168,4.58032]],
    accessNote: 'Aanvoer voor de hoofdrijbaan en de wisselstrook.'
  },
  {
    id: 'hoofdrijbaan', corridorId: 'algera-main', name: 'Algerabrug hoofdrijbaan',
    subtitle: 'Krimpen uit → Capelle', freeFlowKmh: 50,
    points: [[51.9172,4.5860],[51.9168,4.58032],[51.9165,4.5720]]
  },
  {
    id: 'wisselstrook', corridorId: 'algera-lane', name: 'Wisselstrook',
    subtitle: 'Krimpen uit → Capelle', freeFlowKmh: 50,
    points: [[51.9220,4.6070],[51.9185,4.5930],[51.9168,4.58032],[51.9165,4.5720]],
    accessNote: 'Alleen via Nieuwe Tiendweg, maximaal 1,80 m hoog en richting Krimpen uit geopend van 20:00 tot 14:00.'
  }
];

let siteCache: { at: number; sites: Site[] } | null = null;
let routeCache: { at: number; routes: RouteGeometry[] } | null = null;

async function gz(name: string) {
  const response = await fetch(`${NDW_BASE}/${name}`, {
    cache: 'no-store',
    headers: { 'User-Agent': 'KIO-Nu/15 (+https://kio-nu.vercel.app)' }
  });
  if (!response.ok) throw new Error(`${name}: ${response.status}`);
  return gunzipSync(Buffer.from(await response.arrayBuffer())).toString('utf8');
}

function textBetween(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<(?:\\w+:)?${tag}[^>]*>([\\s\\S]*?)<\\/(?:\\w+:)?${tag}>`, 'i'));
  return match?.[1]?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function numberBetween(xml: string, tags: string[]) {
  for (const tag of tags) {
    const value = Number(textBetween(xml, tag));
    if (Number.isFinite(value)) return value;
  }
  return undefined;
}

function records(xml: string, tag: string) {
  return [...xml.matchAll(new RegExp(`<(?:\\w+:)?${tag}\\b([^>]*)>([\\s\\S]*?)<\\/(?:\\w+:)?${tag}>`, 'gi'))]
    .map(match => ({ attrs: match[1], body: match[2] }));
}

function attr(attrs: string, name: string) {
  return attrs.match(new RegExp(`(?:^|\\s)${name}=["']([^"']+)["']`, 'i'))?.[1];
}

function parseSites(xml: string): Site[] {
  const output: Site[] = [];
  for (const record of records(xml, 'measurementSiteRecord')) {
    const id = attr(record.attrs, 'id');
    if (!id) continue;
    const lats = [...record.body.matchAll(/<(?:\w+:)?latitude[^>]*>(-?\d+(?:\.\d+)?)<\/(?:\w+:)?latitude>/gi)].map(m => Number(m[1]));
    const lons = [...record.body.matchAll(/<(?:\w+:)?longitude[^>]*>(-?\d+(?:\.\d+)?)<\/(?:\w+:)?longitude>/gi)].map(m => Number(m[1]));
    const coordinates: LatLng[] = [];
    for (let i = 0; i < Math.min(lats.length, lons.length); i++) {
      if (lats[i] >= BBOX.minLat && lats[i] <= BBOX.maxLat && lons[i] >= BBOX.minLon && lons[i] <= BBOX.maxLon) {
        coordinates.push([lats[i], lons[i]]);
      }
    }
    if (!coordinates.length) continue;
    output.push({
      id,
      name: textBetween(record.body, 'measurementSiteName') || id,
      road: textBetween(record.body, 'roadName') || textBetween(record.body, 'roadNumber'),
      coordinates
    });
  }
  return output;
}

function parseReadings(xml: string): Map<string, Reading> {
  const map = new Map<string, Reading>();
  for (const record of records(xml, 'siteMeasurements')) {
    const reference = record.body.match(/<(?:\w+:)?measurementSiteReference\b[^>]*id=["']([^"']+)["']/i)?.[1]
      || record.body.match(/<(?:\w+:)?measurementSiteReference[^>]*>([^<]+)</i)?.[1];
    if (!reference) continue;
    const speed = numberBetween(record.body, ['speedValue', 'averageVehicleSpeed', 'vehicleSpeed']);
    const travelTime = numberBetween(record.body, ['travelTime', 'travelTimeValue']);
    const time = textBetween(record.body, 'measurementTimeDefault') || textBetween(record.body, 'measurementTime');
    const current = map.get(reference) || {};
    if (speed !== undefined && speed > 3 && speed <= 160) current.speed = speed;
    if (travelTime !== undefined && travelTime > 0) current.travelTime = travelTime;
    if (time) current.time = time;
    map.set(reference, current);
  }
  return map;
}

function haversine(a: LatLng, b: LatLng) {
  const radius = 6371000;
  const toRad = (value: number) => value * Math.PI / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * radius * Math.asin(Math.sqrt(h));
}

function distanceToSegment(point: LatLng, a: LatLng, b: LatLng) {
  const meanLat = (a[0] + b[0] + point[0]) / 3 * Math.PI / 180;
  const x = (value: LatLng) => value[1] * 111320 * Math.cos(meanLat);
  const y = (value: LatLng) => value[0] * 110540;
  const px = x(point), py = y(point), ax = x(a), ay = y(a), bx = x(b), by = y(b);
  const dx = bx - ax, dy = by - ay;
  const t = dx === 0 && dy === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function distanceToLine(point: LatLng, line: LatLng[]) {
  let min = Number.POSITIVE_INFINITY;
  for (let i = 1; i < line.length; i++) min = Math.min(min, distanceToSegment(point, line[i - 1], line[i]));
  return min;
}

function lineLength(line: LatLng[]) {
  return line.slice(1).reduce((sum, point, index) => sum + haversine(line[index], point), 0);
}

async function routeGeometry(spec: RouteSpec): Promise<RouteGeometry> {
  try {
    const coordinates = spec.points.map(([lat, lon]) => `${lon},${lat}`).join(';');
    const response = await fetch(`${OSRM_BASE}/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=false`, {
      next: { revalidate: 86400 },
      headers: { 'User-Agent': 'KIO-Nu/15 (+https://kio-nu.vercel.app)' }
    });
    if (!response.ok) throw new Error(`OSRM ${response.status}`);
    const data = await response.json();
    const raw: [number, number][] | undefined = data?.routes?.[0]?.geometry?.coordinates;
    if (!raw?.length) throw new Error('Geen routegeometrie');
    const line: LatLng[] = raw.map(([lon, lat]) => [lat, lon]);
    return { ...spec, coordinates: line, lengthMeters: Number(data.routes[0].distance) || lineLength(line) };
  } catch {
    return { ...spec, coordinates: spec.points, lengthMeters: lineLength(spec.points) };
  }
}

async function getRoutes() {
  if (routeCache && Date.now() - routeCache.at < 24 * 60 * 60 * 1000) return routeCache.routes;
  const routes = await Promise.all(ROUTES.map(routeGeometry));
  routeCache = { at: Date.now(), routes };
  return routes;
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function delayStatus(delay: number | null): 'groen' | 'oranje' | 'rood' | 'onbekend' {
  if (delay === null) return 'onbekend';
  if (delay < 5) return 'groen';
  if (delay < 15) return 'oranje';
  return 'rood';
}

export async function GET() {
  try {
    const routes = await getRoutes();
    const sites = siteCache && Date.now() - siteCache.at < 6 * 60 * 60 * 1000
      ? siteCache.sites
      : parseSites(await gz('measurement_current.xml.gz'));
    siteCache = { at: Date.now(), sites };

    const [speedXml, timeXml] = await Promise.all([gz('trafficspeed.xml.gz'), gz('traveltime.xml.gz')]);
    const speeds = parseReadings(speedXml);
    const times = parseReadings(timeXml);

    const segments = routes.map(route => {
      const matched = sites.flatMap(site => {
        const point = site.coordinates[0];
        const distance = distanceToLine(point, route.coordinates);
        const reading = { ...(times.get(site.id) || {}), ...(speeds.get(site.id) || {}) };
        return distance <= 140 && reading.speed ? [{ site, reading, distance }] : [];
      });
      const speedValues = matched.map(item => item.reading.speed!).filter(value => value > 3);
      const speedKmh = speedValues.length ? Math.round(median(speedValues)) : null;
      const freeSeconds = route.lengthMeters / (route.freeFlowKmh / 3.6);
      const actualSeconds = speedKmh ? route.lengthMeters / (speedKmh / 3.6) : null;
      const delayMinutes = actualSeconds === null ? null : Math.max(0, Math.round((actualSeconds - freeSeconds) / 60));
      const newest = matched.map(item => item.reading.time).filter(Boolean).sort().at(-1) || null;
      return {
        id: route.id,
        corridorId: route.corridorId,
        name: route.name,
        subtitle: route.subtitle,
        coordinates: route.coordinates,
        status: delayStatus(delayMinutes),
        delayMinutes,
        speedKmh,
        freeFlowKmh: route.freeFlowKmh,
        measurementTime: newest,
        measurementCount: matched.length,
        accessNote: route.accessNote || null,
        message: delayMinutes === null
          ? 'Nog geen betrouwbare actuele NDW-meting op dit wegdeel.'
          : delayMinutes === 0
            ? 'Verkeer rijdt ongeveer volgens normale doorstroming.'
            : `${delayMinutes} minuten extra reistijd ten opzichte van vrije doorstroming.`
      };
    });

    return NextResponse.json({
      updatedAt: new Date().toISOString(),
      source: 'NDW Open Data + OpenStreetMap-routegeometrie via OSRM',
      segments
    }, { headers: { 'Cache-Control': 'public, s-maxage=45, stale-while-revalidate=120' } });
  } catch (error) {
    return NextResponse.json({
      updatedAt: new Date().toISOString(),
      source: 'NDW Open Data',
      segments: [],
      error: error instanceof Error ? error.message : 'Onbekende fout'
    }, { status: 502 });
  }
}
