import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { title, message } = await req.json();
  const appId = process.env.ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;
  if (!appId || !apiKey) return NextResponse.json({ error:'OneSignal is nog niet ingesteld.' }, { status:503 });

  const response = await fetch('https://api.onesignal.com/notifications', {
    method:'POST',
    headers:{ 'Content-Type':'application/json', Authorization:`Key ${apiKey}` },
    body:JSON.stringify({ app_id:appId, included_segments:['Subscribed Users'], headings:{ nl:title }, contents:{ nl:message }, url:process.env.NEXT_PUBLIC_SITE_URL || '/' })
  });
  return NextResponse.json(await response.json(), { status: response.status });
}
