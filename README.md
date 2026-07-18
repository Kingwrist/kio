# KIO v11 — verkeerslagen Algerabrug

Deze versie voegt vijf kaartlagen toe voor Krimpen uit:

- Industrieweg → hoofdrijbaan
- C.G. Roosweg → hoofdrijbaan
- Nieuwe Tiendweg → hoofdrijbaan
- Algerabrug hoofdrijbaan
- Wisselstrook via Nieuwe Tiendweg

De wisselstrook toont de tijdsregel 20:00–14:00 (Europe/Amsterdam), de maximale voertuighoogte van 1,80 meter en de juiste toegang: uitsluitend via de Nieuwe Tiendweg.

## Belangrijk over live data

De kaart- en datastructuur is gebouwd, maar de exacte NDW-meetvak-ID's en rijrichtingen voor deze vijf segmenten zijn nog niet vastgesteld. Daarom toont Live grijs/Onbekend in plaats van verzonnen minuten. De demo-knoppen blijven beschikbaar om de kleuren en fileweergave te testen.

## Transport Map

Stel optioneel `NEXT_PUBLIC_THUNDERFOREST_API_KEY` in op Vercel. Zonder sleutel valt de app terug op standaard OpenStreetMap.


## v12 kaartcorrectie
- Algerabrug-statusmarker verplaatst naar 51.9168, 4.58032.
- Verkeerslagen eindigen nu bij deze bruglocatie en zijn opnieuw uitgelijnd.
