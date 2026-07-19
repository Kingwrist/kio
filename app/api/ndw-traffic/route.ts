import { gunzipSync } from 'node:zlib';
import { NextResponse } from 'next/server';
import { ndwMapSegments } from '../../ndwMapSegments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NDW_BASE = 'https://opendata.ndw.nu';
const BBOX = { minLat: 51.88, maxLat: 51.95, minLon: 4.55, maxLon: 4.73 };

type LatLng = [number, number];
type Site = { id: string; name: string; coordinates: LatLng[]; road?: string };
type Reading = { speed?: number; time?: string };
let siteCache: { at: number; sites: Site[] } | null = null;

async function gz(name: string) {
  const response = await fetch(`${NDW_BASE}/${name}`, {
    cache: 'no-store',
    headers: { 'User-Agent': 'KIO-Nu/17 (+https://kio-nu.vercel.app)' }
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
      if (lats[i] >= BBOX.minLat && lats[i] <= BBOX.maxLat && lons[i] >= BBOX.minLon && lons[i] <= BBOX.maxLon) coordinates.push([lats[i], lons[i]]);
    }
    if (coordinates.length) output.push({ id, name: textBetween(record.body, 'measurementSiteName') || id, road: textBetween(record.body, 'roadName') || textBetween(record.body, 'roadNumber'), coordinates });
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
    const time = textBetween(record.body, 'measurementTimeDefault') || textBetween(record.body, 'measurementTime');
    const current = map.get(reference) || {};
    if (speed !== undefined && speed > 3 && speed <= 160) current.speed = speed;
    if (time) current.time = time;
    map.set(reference, current);
  }
  return map;
}
function distanceToSegment(point: LatLng, a: LatLng, b: LatLng) {
  const meanLat = (a[0] + b[0] + point[0]) / 3 * Math.PI / 180;
  const x = (value: LatLng) => value[1] * 111320 * Math.cos(meanLat);
  const y = (value: LatLng) => value[0] * 110540;
  const px=x(point),py=y(point),ax=x(a),ay=y(a),bx=x(b),by=y(b),dx=bx-ax,dy=by-ay;
  const t=dx===0&&dy===0?0:Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy)));
  return Math.hypot(px-(ax+t*dx),py-(ay+t*dy));
}
function distanceToLine(point: LatLng, line: LatLng[]) {
  let min=Number.POSITIVE_INFINITY;
  for(let i=1;i<line.length;i++) min=Math.min(min,distanceToSegment(point,line[i-1],line[i]));
  return min;
}
function median(values:number[]) {
  const sorted=[...values].sort((a,b)=>a-b), middle=Math.floor(sorted.length/2);
  return sorted.length%2?sorted[middle]:(sorted[middle-1]+sorted[middle])/2;
}
function trafficStatus(speed:number|null, freeFlow:number):'groen'|'oranje'|'rood'|'onbekend' {
  if(speed===null) return 'onbekend';
  const ratio=speed/freeFlow;
  if(ratio>=.85) return 'groen';
  if(ratio>=.55) return 'oranje';
  return 'rood';
}
function delayMinutes(lengthMeters:number, speed:number|null, freeFlow:number) {
  if(speed===null) return null;
  const actual=lengthMeters/(speed/3.6), free=lengthMeters/(freeFlow/3.6);
  return Math.max(0,Math.round((actual-free)/60));
}

export async function GET() {
  try {
    const sites=siteCache&&Date.now()-siteCache.at<6*60*60*1000?siteCache.sites:parseSites(await gz('measurement_current.xml.gz'));
    siteCache={at:Date.now(),sites};
    const readings=parseReadings(await gz('trafficspeed.xml.gz'));
    const segments=ndwMapSegments.map(segment=>{
      const matched=sites.flatMap(site=>{
        const reading=readings.get(site.id);
        const distance=Math.min(...site.coordinates.map(point=>distanceToLine(point,segment.coordinates)));
        return distance<=130&&reading?.speed?[{site,reading,distance}]:[];
      });
      const speeds=matched.map(item=>item.reading.speed!).filter(Boolean);
      const speedKmh=speeds.length?Math.round(median(speeds)):null;
      const status=trafficStatus(speedKmh,segment.freeFlowKmh);
      const delay=delayMinutes(segment.lengthMeters,speedKmh,segment.freeFlowKmh);
      const newest=matched.map(item=>item.reading.time).filter((value):value is string=>Boolean(value)).sort().at(-1)||null;
      const message=status==='groen'?'Vrij verkeer':status==='oranje'?'Druk verkeer':status==='rood'?'Vertraging':'Geen betrouwbare actuele meting';
      return {...segment,status,delayMinutes:delay,speedKmh,measurementTime:newest,measurementCount:matched.length,accessNote:null,message};
    });
    return NextResponse.json({updatedAt:new Date().toISOString(),source:'NDW Open Data · officiële meetvakgeometrie',segments},{headers:{'Cache-Control':'public, s-maxage=45, stale-while-revalidate=120'}});
  } catch(error) {
    return NextResponse.json({updatedAt:new Date().toISOString(),source:'NDW Open Data',segments:ndwMapSegments.map(segment=>({...segment,status:'onbekend',delayMinutes:null,speedKmh:null,measurementTime:null,measurementCount:0,accessNote:null,message:'Live NDW-bron tijdelijk niet bereikbaar'})),error:error instanceof Error?error.message:'Onbekende fout'},{status:200});
  }
}
