import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ORIGIN = 'https://stream.inmoves.nl';
const MASTER = `${ORIGIN}/rtplive/GKR_01.stream/playlist.m3u8`;

function allowed(url: URL) {
  return url.origin === ORIGIN && url.pathname.startsWith('/rtplive/GKR_01.stream/');
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('url');
  const target = raw ? new URL(raw) : new URL(MASTER);
  if (!allowed(target)) return NextResponse.json({ error: 'Ongeldige camerabron' }, { status: 400 });
  try {
    const response = await fetch(target, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 KIO/5.0',
        'Referer': 'https://krimpenaandenijssel.nl/',
        'Accept': '*/*',
      },
    });
    if (!response.ok) return NextResponse.json({ error: `Camera ${response.status}` }, { status: 502 });
    const contentType = response.headers.get('content-type') || '';
    const isPlaylist = target.pathname.endsWith('.m3u8') || contentType.includes('mpegurl');
    if (isPlaylist) {
      const text = await response.text();
      const rewritten = text.split('\n').map((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return line;
        const absolute = new URL(trimmed, target).toString();
        return `/api/camera-proxy?url=${encodeURIComponent(absolute)}`;
      }).join('\n');
      return new NextResponse(rewritten, { headers: { 'Content-Type':'application/vnd.apple.mpegurl', 'Cache-Control':'no-store' } });
    }
    return new NextResponse(await response.arrayBuffer(), { headers: { 'Content-Type': contentType || 'video/mp2t', 'Cache-Control':'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Camera niet bereikbaar' }, { status: 502 });
  }
}
