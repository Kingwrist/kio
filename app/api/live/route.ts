import { gunzipSync } from 'node:zlib';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALL_IDS = ['algera-main','algera-lane','algera-bike','krimpen-lek','storm-fast','storm-taxi','lekkerkerk','ouderkerk','bergstoep','gouderak'];
const situationsUrl = 'https://opendata.ndw.nu/actueel_beeld.xml.gz';
const bridgesUrl = 'https://opendata.ndw.nu/planningsfeed_brugopeningen.xml.gz';

async function readGzipText(url: string) {
  const response = await fetch(url, { cache: 'no-store', headers: { 'User-Agent': 'KIO-Nu/3.0 (+https://kio-nu.vercel.app)' } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return gunzipSync(Buffer.from(await response.arrayBuffer())).toString('utf8');
}

function relevantWindow(text: string, words: string[], radius = 900) {
  const lower = text.toLowerCase();
  return words.flatMap((word) => {
    const output: string[] = [];
    let from = 0;
    while (output.length < 5) {
      const index = lower.indexOf(word, from);
      if (index < 0) break;
      output.push(text.slice(Math.max(0,index-radius), Math.min(text.length,index+radius)));
      from = index + word.length;
    }
    return output;
  });
}

function clean(value: string) {
  return value.replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim().slice(0,320);
}

export async function GET() {
  type ApiRoute = { id: string; status: 'groen'|'oranje'|'rood'|'onbekend'; delayMinutes: number|null; message: string; details: string[] };
  const unknown = (message: string): ApiRoute[] => ALL_IDS.map((id) => ({ id, status: 'onbekend', delayMinutes: null, message, details: [] }));
  try {
    const [situations, bridges] = await Promise.all([readGzipText(situationsUrl), readGzipText(bridgesUrl)]);
    const bridgeParts = relevantWindow(bridges, ['algerabrug','algera']);
    const incidentParts = relevantWindow(situations, ['algerabrug','algera']).filter((part) => /ongeval|accident|afgesloten|closure|stremming|queue|file/i.test(part));
    const joined = bridgeParts.join(' ').toLowerCase();
    const now = Date.now();
    const times = [...joined.matchAll(/20\d\d-\d\d-\dt\d\d:\d\d:\d\d(?:\.\d+)?z/g)].map((match) => Date.parse(match[0]));
    const activeOpening = times.some((time) => Math.abs(time-now) < 15*60*1000) && /bridge open|brug open|road closed|unavailable for road traffic/i.test(joined);

    const routes = unknown('Nog geen exact NDW-reistijdvak gekoppeld');
    for (const id of ['algera-main','algera-lane']) {
      const route = routes.find((item) => item.id === id)!;
      if (activeOpening) {
        route.status = 'rood'; route.delayMinutes = 18; route.message = 'Brugopening rond het huidige tijdstip gevonden'; route.details = bridgeParts.slice(0,2).map(clean);
      } else if (incidentParts.length) {
        route.status = 'oranje'; route.delayMinutes = 7; route.message = 'Actuele NDW-verkeersmelding bij de Algerabrug'; route.details = incidentParts.slice(0,2).map(clean);
      } else {
        route.status = 'groen'; route.delayMinutes = 0; route.message = 'NDW gecontroleerd: geen actieve brugopening of lokale verkeersmelding gevonden';
      }
    }
    const bike = routes.find((item) => item.id === 'algera-bike')!;
    bike.status = activeOpening ? 'oranje' : 'groen';
    bike.delayMinutes = activeOpening ? 4 : 0;
    bike.message = activeOpening ? 'Fietsroute kan rond de brugopening kort hinder hebben' : 'Geen actuele hinder voor de fietsbrug gevonden';

    return NextResponse.json({ updatedAt: new Date().toISOString(), routes, source: 'NDW Open Data' });
  } catch (error) {
    return NextResponse.json({ updatedAt: new Date().toISOString(), routes: unknown('Live verkeersbron tijdelijk niet bereikbaar'), error: error instanceof Error ? error.message : 'Onbekende fout' });
  }
}
