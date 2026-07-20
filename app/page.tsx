'use client';

import { ChevronRight, CircleHelp, Gauge, LockKeyhole, RefreshCw, Route, TimerReset, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type TrafficStatus = 'groen' | 'oranje' | 'rood' | 'onbekend';
type RouteData = {
  id: string;
  name: string;
  status: TrafficStatus;
  delayMinutes: number | null;
  travelTimeMinutes: number | null;
  freeFlowMinutes: number | null;
  averageSpeed: number | null;
  updatedAt: string;
};
type Payload = {
  updatedAt: string;
  cacheSeconds: number;
  source: string;
  routes: RouteData[];
  error?: string;
  diagnostics?: string[];
};

const STATUS_COPY: Record<TrafficStatus, string> = {
  groen: 'Goede doorstroming',
  oranje: 'Merkbare vertraging',
  rood: 'Veel vertraging',
  onbekend: 'Data tijdelijk onbekend',
};

function ageLabel(date?: string) {
  if (!date) return 'Nog niet bijgewerkt';
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 60000));
  if (minutes < 1) return 'Zojuist bijgewerkt';
  if (minutes === 1) return '1 minuut geleden';
  return `${minutes} minuten geleden`;
}

function delayLabel(delay: number | null) {
  if (delay === null) return '—';
  return delay === 0 ? 'Geen' : `+${delay} min`;
}

export default function Home() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<RouteData | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [adminBusy, setAdminBusy] = useState(false);
  const [adminMessage, setAdminMessage] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/traffic', { cache: 'no-store' })
      .then(async (response) => {
        const payload = (await response.json()) as Payload;
        if (!response.ok && !payload.routes?.length) throw new Error(payload.error || 'Verkeersdata niet beschikbaar');
        if (active) setData(payload);
      })
      .catch((error) => {
        if (active) setData({ updatedAt: new Date().toISOString(), cacheSeconds: 300, source: 'error', routes: [], error: String(error) });
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);


  async function adminRefresh() {
    setAdminBusy(true);
    setAdminMessage('');
    try {
      const response = await fetch('/api/traffic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: adminCode }),
      });
      const payload = (await response.json()) as Payload;
      if (!response.ok) throw new Error(payload.error || payload.diagnostics?.join(' · ') || 'Vernieuwen mislukt');
      setData(payload);
      setAdminMessage(payload.diagnostics?.length
        ? `Vernieuwd, maar met meldingen: ${payload.diagnostics.join(' · ')}`
        : 'Alle routes zijn handmatig vernieuwd.');
      setAdminCode('');
    } catch (error) {
      setAdminMessage(error instanceof Error ? error.message : 'Vernieuwen mislukt');
    } finally {
      setAdminBusy(false);
    }
  }

  const summary = useMemo(() => {
    const routes = data?.routes || [];
    const worst = routes.some((route) => route.status === 'rood')
      ? 'rood'
      : routes.some((route) => route.status === 'oranje')
        ? 'oranje'
        : routes.length && routes.every((route) => route.status === 'groen')
          ? 'groen'
          : 'onbekend';
    return worst as TrafficStatus;
  }, [data]);

  return (
    <main className="shell">
      <section className="hero">
        <div className="brandRow">
          <div className="logo">K</div>
          <button className="iconButton" onClick={() => setHelpOpen(true)} aria-label="Waarom elke vijf minuten?">
            <CircleHelp size={21} />
          </button>
        </div>
        <p className="eyebrow">KRIMPEN UIT</p>
        <h1>Hoe staat het<br />richting de brug?</h1>
        <div className={`overall ${summary}`}>
          <span className="statusDot" />
          <span>{loading ? 'Verkeersbeeld ophalen…' : STATUS_COPY[summary]}</span>
        </div>
      </section>

      <section className="content">
        <div className="sectionTitle">
          <div>
            <p className="eyebrow dark">UITGAANDE ROUTES</p>
            <h2>Kies jouw aanrijroute</h2>
          </div>
          <span className="updated" key={now}>{ageLabel(data?.updatedAt)}</span>
        </div>

        <div className="routeList" aria-live="polite">
          {loading && Array.from({ length: 5 }, (_, index) => <div className="routeCard skeleton" key={index} />)}

          {!loading && data?.routes.map((route) => (
            <button className="routeCard" key={route.id} onClick={() => setSelected(route)}>
              <span className={`routeSignal ${route.status}`}><span /></span>
              <span className="routeMain">
                <strong>{route.name}</strong>
                <small>{STATUS_COPY[route.status]}</small>
              </span>
              <span className="routeMetric">
                <strong>{delayLabel(route.delayMinutes)}</strong>
                <small>vertraging</small>
              </span>
              <ChevronRight size={20} />
            </button>
          ))}

          {!loading && !data?.routes.length && (
            <div className="emptyState">
              <strong>Verkeersinformatie niet bereikbaar</strong>
              <p>{data?.error || 'Controleer de Vercel-variabelen en voer het Supabase SQL-script uit.'}</p>
            </div>
          )}
        </div>

        <div className="trustNote">
          <TimerReset size={18} />
          <p>Nieuwe TomTom-data wordt automatisch opgehaald zodra de gedeelde meting ouder is dan vijf minuten.</p>
          <button onClick={() => setHelpOpen(true)} aria-label="Meer uitleg"><CircleHelp size={18} /></button>
        </div>

        <div className="futureCard">
          <span>VOLGENDE FASE</span>
          <strong>Veer Krimpen aan de Lek</strong>
          <p>Later meten we ook de route naar het autoveer met dezelfde groene, oranje en rode status.</p>
        </div>
      </section>

      {selected && (
        <div className="overlay" onClick={() => setSelected(null)}>
          <article className="sheet" onClick={(event) => event.stopPropagation()}>
            <button className="close" onClick={() => setSelected(null)} aria-label="Sluiten"><X /></button>
            <div className={`sheetStatus ${selected.status}`}><span /></div>
            <p className="eyebrow dark">ROUTEDETAIL</p>
            <h2>{selected.name}</h2>
            <p className="detailStatus">{STATUS_COPY[selected.status]}</p>
            <div className="metrics">
              <div><TimerReset /><span><small>Vertraging</small><strong>{delayLabel(selected.delayMinutes)}</strong></span></div>
              <div><Route /><span><small>Reistijd</small><strong>{selected.travelTimeMinutes ?? '—'}{selected.travelTimeMinutes !== null ? ' min' : ''}</strong></span></div>
              <div><Gauge /><span><small>Gem. snelheid</small><strong>{selected.averageSpeed ?? '—'}{selected.averageSpeed !== null ? ' km/u' : ''}</strong></span></div>
            </div>
            <p className="sheetUpdated">{ageLabel(selected.updatedAt)} · TomTom verkeersinformatie</p>
          </article>
        </div>
      )}

      {helpOpen && (
        <div className="overlay" onClick={() => setHelpOpen(false)}>
          <article className="sheet helpSheet" onClick={(event) => event.stopPropagation()}>
            <button className="close" onClick={() => setHelpOpen(false)} aria-label="Sluiten"><X /></button>
            <div className="helpIcon"><CircleHelp /></div>
            <p className="eyebrow dark">OVER DE METING</p>
            <h2>Waarom elke vijf minuten?</h2>
            <p>KIO gebruikt professionele verkeersinformatie van TomTom. Iedere nieuwe meting gebruikt de betaalde API.</p>
            <p>Daarom delen alle bezoekers dezelfde meting en vernieuwt KIO maximaal één keer per vijf minuten. Zo blijft de informatie actueel, zonder onnodige kosten.</p>
            <p className="muted">Voor bezoekers is er geen verversknop. Zodra de meting ouder is dan vijf minuten, wordt automatisch nieuwe data opgehaald.</p>
            <button className="adminLink" onClick={() => { setHelpOpen(false); setAdminOpen(true); setAdminMessage(''); }}>
              <LockKeyhole size={17} /> Admin vernieuwen
            </button>
          </article>
        </div>
      )}


      {adminOpen && (
        <div className="overlay" onClick={() => setAdminOpen(false)}>
          <article className="sheet adminSheet" onClick={(event) => event.stopPropagation()}>
            <button className="close" onClick={() => setAdminOpen(false)} aria-label="Sluiten"><X /></button>
            <div className="helpIcon"><LockKeyhole /></div>
            <p className="eyebrow dark">BEHEER</p>
            <h2>Handmatig vernieuwen</h2>
            <p>Voer de admincode in om alle routes direct opnieuw bij TomTom op te vragen. Dit omzeilt de wachttijd van vijf minuten.</p>
            <label className="codeLabel" htmlFor="admin-code">Admincode</label>
            <input
              id="admin-code"
              className="codeInput"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              value={adminCode}
              onChange={(event) => setAdminCode(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter' && adminCode && !adminBusy) adminRefresh(); }}
              placeholder="••••"
            />
            <button className="adminButton" disabled={!adminCode || adminBusy} onClick={adminRefresh}>
              <RefreshCw size={18} className={adminBusy ? 'spin' : ''} />
              {adminBusy ? 'Vernieuwen…' : 'Nu vernieuwen'}
            </button>
            {adminMessage && <p className="adminMessage">{adminMessage}</p>}
            {data?.diagnostics?.length ? (
              <div className="diagnostics">
                <strong>Technische meldingen</strong>
                {data.diagnostics.map((item) => <span key={item}>{item}</span>)}
              </div>
            ) : null}
          </article>
        </div>
      )}
    </main>
  );
}
