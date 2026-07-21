# KIO v20.5

Deze versie behoudt het bestaande v20-ontwerp en voegt toe:

- één favoriete route, lokaal opgeslagen op het toestel;
- drie TomTom-routes naar de veerponten Krimpen aan de Lek, Bergambacht/Bergstoep en Schoonhoven;
- route-details zonder totale reistijd;
- een compacte waarschuwing voor de werkzaamheden aan de Algerabrug;
- een werkzaamhedenoverzicht met de periodes 19–23 juli, 20 juli–9 augustus, 20 juli–21 september en 10 augustus–7 september 2026;
- een Algerabrug-item in het bestaande menu;
- automatische datum- en tijdsreacties voor de nachtafsluitingen van 19 t/m 23 juli, de versmalde rijstroken, de aftelling vanaf 1 augustus en de volledige afsluiting van 10 augustus tot 7 september;
- tijdens een actieve nachtafsluiting meldt KIO dat autoverkeer niet kan passeren, terwijl wandelaars, fietsers en brommers wel over de brug kunnen;
- tijdens de volledige afsluiting worden de veerroutes automatisch boven de autoroutes geplaatst;
- de camerafix uit v20.2 blijft behouden.

## Belangrijk

De live stand van de brug is nog niet gekoppeld. Het bruginformatiescherm maakt dit expliciet zichtbaar. Koppel pas een bron nadat een stabiele en toegestane officiële API is vastgesteld; de werkzaamhedeninformatie is wel direct bruikbaar.

## Installatie

Gebruik dezelfde Vercel-variabelen als v20.2:

- `TOMTOM_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_REFRESH_CODE`

De bestaande `route_cache`-tabel werkt ook voor de nieuwe veerroutes. De eerste geldige verversing voegt de drie nieuwe route-id’s via upsert toe.
