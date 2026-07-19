import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PAGE = 'https://krimpenaandenijssel.nl/verkeerscameras/';

function absoluteUrl(value: string) {
  try { return new URL(value, PAGE).toString(); } catch { return null; }
}

export async function GET() {
  try {
    const response = await fetch(PAGE, { cache: 'no-store', headers: { 'User-Agent': 'KIO-Nu/2.0' } });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    const html = await response.text();
    const iframeUrls = [...html.matchAll(/<iframe[^>]+src=["']([^"']+)["']/gi)]
      .map((match) => absoluteUrl(match[1]))
      .filter((value): value is string => Boolean(value));
    const imageUrls = [...html.matchAll(/<(?:img|source)[^>]+(?:src|data-src)=["']([^"']+)["']/gi)]
      .map((match) => absoluteUrl(match[1]))
      .filter((value): value is string => Boolean(value))
      .filter((url) => !/logo|icon|avatar|dossier-verkeer-en-vervoer/i.test(url));

    return NextResponse.json({
      updatedAt: new Date().toISOString(),
      cameras: iframeUrls.map((url, index) => ({ id: `embed-${index + 1}`, type: 'iframe', name: `Verkeerscamera ${index + 1}`, url })),
      images: imageUrls.slice(0, 8),
      source: PAGE,
    });
  } catch (error) {
    return NextResponse.json({ updatedAt: new Date().toISOString(), cameras: [], images: [], source: PAGE, error: error instanceof Error ? error.message : 'Onbekende fout' });
  }
}
