# KIO Nu — live versie

Mobile-first Next.js dashboard voor verkeer rond Krimpen aan den IJssel.

## In deze versie
- KIO-druktescore
- Live uitlezen van openbare NDW gzip/XML-feeds
- Statuscontrole van veerdiensten
- Ingesloten officiële gemeentepagina met verkeerscamera's, plus fallback-link
- Automatisch vernieuwen iedere 60 seconden

## Publiceren
Vervang de bestanden in je lokale GitHub Desktop-map, commit en push. Vercel bouwt daarna automatisch.

## Belangrijk
De NDW-koppeling is een eerste bèta. De route `/api/live` controleert de actuele feeds en zoekt regionale tekstverwijzingen. Exacte meetpunt- en trajectkoppelingen worden in een volgende versie toegevoegd.
