# Krimpen In & Out

Mobile-first Next.js/PWA dashboard voor verkeer rond Krimpen aan den IJssel.

## Starten

```bash
npm install
npm run dev
```

## Deployen op Vercel

1. Zet deze map in GitHub.
2. Importeer de repository in Vercel.
3. Framework preset: Next.js.
4. Deploy.

## Pushmeldingen

De interface vraagt al notificatierechten. Voor echte push naar alle abonnees is OneSignal voorbereid:

- Maak gratis een OneSignal Web Push app.
- Voeg de OneSignal Web SDK toe volgens hun actuele handleiding.
- Stel in Vercel in: `ONESIGNAL_APP_ID`, `ONESIGNAL_REST_API_KEY`, `NEXT_PUBLIC_SITE_URL`.
- Beveilig `/api/push` voordat je deze route publiek gebruikt, bijvoorbeeld met een admin-token of Vercel Authentication.

## Live data

- Veerstatus wordt server-side gecontroleerd op de officiële websites en elke minuut vernieuwd.
- Verkeerskaarten linken naar Rijkswaterstaat/NDW.
- Voor echte druktescores per weg kun je later NDW DATEX II of TomTom Traffic Flow koppelen.
- Camera’s staan als officiële externe bronnen. Direct embedden kan alleen wanneer de bron dit technisch en juridisch toestaat.

## Belangrijk

Websites kunnen hun HTML wijzigen. Gebruik op termijn officiële API’s of afspraken met de veerbedrijven voor een robuuste statusfeed.
