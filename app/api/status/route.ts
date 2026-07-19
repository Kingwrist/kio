import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

async function pageContains(url: string, phrases: string[]) {
  try {
    const response = await fetch(url, { next: { revalidate: 60 }, headers: { 'User-Agent': 'KrimpenInOut/1.0' } });
    const html = (await response.text()).toLowerCase();
    return phrases.find((p) => html.includes(p.toLowerCase())) ?? null;
  } catch { return null; }
}

export async function GET() {
  const [kinderdijk, lekkerkerk] = await Promise.all([
    pageContains('https://veerdienstkinderdijk.nl/nl/', ['vaart volgens het normale dienstrooster','vaart niet','stremming']),
    pageContains('https://www.veerdienstlekkerkerk.nl/', ['dienstregeling','vaart niet','stremming'])
  ]);

  return NextResponse.json({
    updatedAt: new Date().toISOString(),
    ferries: [
      { id:'kinderdijk', name:'Krimpen a/d Lek – Kinderdijk', status: kinderdijk?.includes('vaart niet') || kinderdijk?.includes('stremming') ? 'storing' : kinderdijk ? 'vaart' : 'onbekend', source:'https://veerdienstkinderdijk.nl/nl/' },
      { id:'lekkerkerk', name:'Lekkerkerk – Nieuw-Lekkerland', status: lekkerkerk?.includes('vaart niet') || lekkerkerk?.includes('stremming') ? 'storing' : lekkerkerk ? 'vaart' : 'onbekend', source:'https://www.veerdienstlekkerkerk.nl/' },
      { id:'ouderkerk', name:'Ouderkerk fietsveer', status:'controleer', source:'https://www.pontjes.nl/' }
    ]
  });
}
