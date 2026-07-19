# KIO v1

Werkende Next.js-prototype met:
- echte NDW-meetvakgeometrieën uit de aangeleverde shapefile;
- drie verkeerskleuren;
- aparte wisselstrookstatus;
- Algerabrug en aanrijroute pont;
- automatische verversing iedere minuut.

## Installeren
1. Kopieer deze bestanden over de bestaande repository.
2. `npm install`
3. `npm run dev`
4. Commit en push naar GitHub; Vercel bouwt automatisch.

## Belangrijk
`app/api/traffic/route.ts` draait nu in zichtbare demomodus. De geometrie is echt; de snelheden en wisselstrookrichting zijn nog demo. Koppel daar later de officiële live bronnen.
