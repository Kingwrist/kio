# KIO v14 — echte NDW-verkeerslaag

Deze versie haalt rechtstreeks de openbare NDW-bestanden op:
- `measurement_current.xml.gz` voor meetlocaties en geometrie;
- `trafficspeed.xml.gz` voor actuele snelheden;
- `traveltime.xml.gz` voor actuele reistijden.

Alleen NDW-meetlocaties binnen het gebied rond Krimpen en de Algerabrug worden op de kaart gezet. Lijngeometrie uit NDW wordt als verkeerssegment weergegeven; puntmetingen als gekleurde meetpunten. Er worden geen handmatig getekende wegen gebruikt.

Kleurindeling voor puntsnelheden:
- groen: 40 km/u of sneller;
- oranje: 20–40 km/u;
- rood: lager dan 20 km/u;
- grijs: geen actuele snelheidswaarde.

De kaart blijft OpenStreetMap/Thunderforest Transport. Google Traffic is niet gebruikt omdat de live verkeerslaag niet vrij beschikbaar is voor hergebruik zonder Google Maps Platform en bijbehorende voorwaarden/kosten.
