import { gunzipSync } from 'node:zlib';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SOURCES = {
  situations: 'https://opendata.ndw.nu/actueel_beeld.xml.gz',
  bridges: 'https://opendata.ndw.nu/planningsfeed_brugopeningen.xml.gz',
};

const AREAS = [
  { id: 'algerabrug', label: 'Algerabrug', words: ['algerabrug', 'algera'] },
  { id: 'stormpolder', label: 'Stormpolder', words: ['stormpolder', 'industrieweg'] },
  { id: 'n210-west', label: 'N210 → Capelle', words: ['n210', 'capelle aan den ijssel'] },
  { id: 'n210-east', label: 'N210 → Krimpenerwaard', words: ['n210', 'krimpenerwaard', 'ouderkerk aan den ijssel'] },
];

async function readGzipText(url: string) {
  const response = await fetch(url, {
    cache: 'no-store',
    headers: { 'User-Agent': 'KIO-Nu/2.0 (+https://kio-nu.vercel.app)' },
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return gunzipSync(Buffer.from(await response.arrayBuffer())).toString('utf8');
}

function cleanXml(value: string) {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function snippets(text: string, words: string[], radius = 700) {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const word of words) {
    let start = 0;
    while (found.length < 8) {
      const index = lower.indexOf(word, start);
      if (index < 0) break;
      const snippet = cleanXml(text.slice(Math.max(0, index - radius), Math.min(text.length, index + radius)));
      if (snippet && !found.some((item) => item.slice(0, 120) === snippet.slice(0, 120))) found.push(snippet);
      start = index + word.length;
    }
  }
  return found;
}

function isDisruptive(value: string) {
  const s = value.toLowerCase();
  return ['accident', 'ongeval', 'queue', 'file', 'obstruction', 'afgesloten', 'closure', 'blocked', 'stremming', 'roadworks'].some((word) => s.includes(word));
}

function bridgeState(items: string[]) {
  if (!items.length) return { status: 'onbekend', label: 'Geen actuele brugmelding gevonden' };
  const joined = items.join(' ').toLowerCase();
  const now = Date.now();
  const times = [...joined.matchAll(/20\d\d-\d\d-\d\dt\d\d:\d\d:\d\d(?:\.\d+)?z/g)].map((m) => Date.parse(m[0]));
  const nearNow = times.some((time) => Math.abs(time - now) < 20 * 60 * 1000);
  const indicatesOpen = ['bridge open', 'brug open', 'open voor scheepvaart', 'road closed', 'unavailable for road traffic'].some((word) => joined.includes(word));
  if (nearNow && indicatesOpen) return { status: 'rood', label: 'Brug waarschijnlijk open voor scheepvaart' };
  return { status: 'groen', label: 'Geen actieve opening gevonden' };
}

export async function GET() {
  try {
    const [situations, bridges] = await Promise.all([
      readGzipText(SOURCES.situations),
      readGzipText(SOURCES.bridges),
    ]);

    const bridgeItems = snippets(bridges, ['algerabrug', 'algera']);
    const bridge = bridgeState(bridgeItems);
    const routes = AREAS.map((area) => {
      const matches = snippets(situations, area.words);
      const disruptions = matches.filter(isDisruptive);
      return {
        id: area.id,
        label: area.label,
        status: disruptions.length ? 'oranje' : 'groen',
        flowMinutes: null,
        message: disruptions.length
          ? `${disruptions.length} relevante NDW-melding${disruptions.length === 1 ? '' : 'en'} gevonden`
          : 'Geen lokale verstoring gevonden',
        details: disruptions.slice(0, 3).map((item) => item.slice(0, 280)),
      };
    });

    const algeraRoute = routes.find((route) => route.id === 'algerabrug');
    if (algeraRoute && bridge.status === 'rood') {
      algeraRoute.status = 'rood';
      algeraRoute.message = bridge.label;
      algeraRoute.details = bridgeItems.slice(0, 2).map((item) => item.slice(0, 280));
    }

    return NextResponse.json({
      updatedAt: new Date().toISOString(),
      source: 'NDW Open Data',
      bridge,
      routes,
      limitations: 'Doorstroomminuten worden pas getoond wanneer een exact NDW-reistijdvak aan deze corridor is gekoppeld.',
    });
  } catch (error) {
    return NextResponse.json({
      updatedAt: new Date().toISOString(),
      source: 'NDW Open Data',
      bridge: { status: 'onbekend', label: 'NDW tijdelijk niet bereikbaar' },
      routes: AREAS.map((area) => ({ id: area.id, label: area.label, status: 'onbekend', flowMinutes: null, message: 'Live data tijdelijk niet beschikbaar', details: [] })),
      error: error instanceof Error ? error.message : 'Onbekende fout',
    }, { status: 200 });
  }
}
