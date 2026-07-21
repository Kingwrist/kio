# KIO v19 — Krimpen Uit

Productiegerichte herbouw van KIO. Geen GPS, kaart, persoonlijke route of handmatige verversknop. De app toont vijf vaste uitgaande routes richting de Algerabrug.

## Werking

- Bij openen leest de server de gedeelde Supabase-cache.
- Is de volledige cache jonger dan vijf minuten, dan volgen geen TomTom-aanroepen.
- Is de cache ouder, dan wordt één gedeelde verversing gestart.
- Gelijktijdige bezoekers delen dezelfde refresh-promise, zodat binnen één server-instance niet meerdere identieke updates tegelijk lopen.
- De interface toont de laatste update en legt via het vraagteken uit waarom maximaal eens per vijf minuten wordt vernieuwd.

## Vereiste Vercel-variabelen

```env
NEXT_PUBLIC_SUPABASE_URL=https://gbvxnsqvagtvesbieugo.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SECRET_KEY=...
TOMTOM_API_KEY=...
```

`SUPABASE_SECRET_KEY` is nodig voor server-side writes. Gebruik bij een ouder Supabase-project eventueel `SUPABASE_SERVICE_ROLE_KEY`; de code ondersteunt beide namen. Deel deze sleutel nooit en prefix hem niet met `NEXT_PUBLIC_`.

## Database

Open Supabase → SQL Editor en voer `supabase/setup.sql` uit.

## Installeren

```bash
npm install
npm run build
npm run dev
```

## Routepunten

De vaste start- en eindpunten staan in `app/lib/routes.ts`. Controleer de twee nieuw toegevoegde startpunten (`Boerhaavelaan` en `Van Ostadelaan`) tijdens een praktijktest en verfijn ze zo nodig naar de gewenste rijbaan.

## Volgende fase

De UI bevat alvast een visuele aankondiging voor Veer Krimpen aan de Lek. Later kan die als zesde route dezelfde statuslogica krijgen.

## Admin handmatig vernieuwen

Voeg in Vercel toe:

```env
ADMIN_REFRESH_CODE=1502
```

De knop staat onder het vraagteken rechtsboven: **Admin vernieuwen**. De code wordt uitsluitend server-side gecontroleerd. De handmatige actie vernieuwt alle routes direct en toont eventuele TomTom-foutmeldingen in het beheerscherm.

## v20.2 camerafix

- De laad-overlay verschijnt alleen bij de eerste verbinding en niet meer bij korte HLS-bufferpauzes.
- Volledig scherm gebruikt native fullscreen waar mogelijk en een schermvullende fallback op mobiele browsers.
