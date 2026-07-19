import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type RouteOption = {
  id: string;
  name: string;
  via: [number, number][];
  accessNote: string;
  switchLane?: boolean;
};

const BRIDGE_EXIT: [number, number] = [51.91645, 4.5724];
const OPTIONS: RouteOption[] = [
  { id: 'industrieweg', name: 'Via Industrieweg', via: [[51.9109, 4.6072], [51.9159, 4.5888], BRIDGE_EXIT], accessNote: 'Hoofdrijbaan Algerabrug.' },
  { id: 'cg-roosweg', name: 'Via C.G. Roosweg', via: [[51.9233, 4.6097], [51.9184, 4.5918], BRIDGE_EXIT], accessNote: 'Hoofdrijbaan Algerabrug.' },
  { id: 'nieuwe-tiendweg', name: 'Via Nieuwe Tiendweg', via: [[51.9271, 4.6240], [51.9200, 4.6010], BRIDGE_EXIT], accessNote: 'Hoofdrijbaan Algerabrug.' },
  { id: 'wisselstrook', name: 'Via Nieuwe Tiendweg + wisselstrook', via: [[51.9271, 4.6240], [51.9200, 4.6010], [51.9168, 4.58032], BRIDGE_EXIT], accessNote: 'Alleen voertuigen tot 1,80 m; alleen richting Krimpen uit van 20:00 tot 14:00.', switchLane: true },
];

function laneOpen() {
  const parts = new Intl.DateTimeFormat('nl-NL', { timeZone: 'Europe/Amsterdam', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
  const hour = Number(parts.find(part => part.type === 'hour')?.value || 0);
  const minute = Number(parts.find(part => part.type === 'minute')?.value || 0);
  const total = hour * 60 + minute;
  return total >= 20 * 60 || total < 14 * 60;
}

async function route(origin: [number, number], option: RouteOption) {
  const points = [origin, ...option.via].map(([lat, lon]) => `${lon},${lat}`).join(';');
  const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${points}?overview=full&geometries=geojson&steps=false`, {
    cache: 'no-store',
    headers: { 'User-Agent': 'KIO-Nu/16 (+https://kio-nu.vercel.app)' },
  });
  if (!response.ok) throw new Error(`OSRM ${response.status}`);
  const data = await response.json();
  const best = data?.routes?.[0];
  if (!best) throw new Error('Geen route gevonden');
  return {
    id: option.id,
    name: option.name,
    durationMinutes: Math.max(1, Math.round(best.duration / 60)),
    distanceKm: Math.round(best.distance / 100) / 10,
    coordinates: (best.geometry?.coordinates || []).map(([lon, lat]: [number, number]) => [lat, lon]),
    accessNote: option.accessNote,
    switchLane: Boolean(option.switchLane),
  };
}

export async function GET(request: NextRequest) {
  const lat = Number(request.nextUrl.searchParams.get('lat'));
  const lon = Number(request.nextUrl.searchParams.get('lon'));
  const height = request.nextUrl.searchParams.get('height') || 'unknown';
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < 51.7 || lat > 52.2 || lon < 4.2 || lon > 5.0) {
    return NextResponse.json({ error: 'Ongeldige of te verre locatie.' }, { status: 400 });
  }
  const open = laneOpen();
  const allowedOptions = OPTIONS.filter(option => !option.switchLane || (open && height === 'low'));
  const results = await Promise.allSettled(allowedOptions.map(option => route([lat, lon], option)));
  const routes = results.flatMap(result => result.status === 'fulfilled' ? [result.value] : []);
  routes.sort((a, b) => a.durationMinutes - b.durationMinutes);
  return NextResponse.json({
    updatedAt: new Date().toISOString(),
    origin: [lat, lon],
    laneOpen: open,
    height,
    routes,
    note: 'Basistijd via OpenStreetMap/OSRM. KIO telt op de kaart beschikbare NDW-vertraging per gekozen aanvoerweg erbij op.',
  });
}
