import { gunzipSync } from 'node:zlib';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 60;

const KEYWORDS = ['krimpen', 'algerabrug', 'n210', 'stormpolder', 'capelle aan den ijssel'];

async function readGzipText(url: string) {
  const response = await fetch(url, {
    next: { revalidate: 60 },
    headers: { 'User-Agent': 'KIO-Nu/1.1 (+https://kio-nu.vercel.app)' },
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  return gunzipSync(bytes).toString('utf8');
}

function keywordSummary(text: string) {
  const lower = text.toLowerCase();
  return KEYWORDS.map((keyword) => ({ keyword, hits: lower.split(keyword).length - 1 })).filter((item) => item.hits > 0);
}

export async function GET() {
  const feeds = [
    { id: 'situations', label: 'Incidenten & actuele situaties', url: 'https://opendata.ndw.nu/actueel_beeld.xml.gz' },
    { id: 'speed', label: 'Actuele snelheden', url: 'https://opendata.ndw.nu/trafficspeed.xml.gz' },
    { id: 'travel', label: 'Actuele reistijden', url: 'https://opendata.ndw.nu/traveltime.xml.gz' },
  ];

  const results = await Promise.all(feeds.map(async (feed) => {
    try {
      const text = await readGzipText(feed.url);
      return { id: feed.id, label: feed.label, ok: true, bytes: text.length, matches: keywordSummary(text) };
    } catch (error) {
      return { id: feed.id, label: feed.label, ok: false, bytes: 0, matches: [], error: error instanceof Error ? error.message : 'Onbekende fout' };
    }
  }));

  const matchedHits = results.reduce((total, feed) => total + feed.matches.reduce((sum, match) => sum + match.hits, 0), 0);
  const availableFeeds = results.filter((feed) => feed.ok).length;

  return NextResponse.json({ updatedAt: new Date().toISOString(), source: 'NDW Open Data', availableFeeds, totalFeeds: results.length, matchedHits, feeds: results });
}
