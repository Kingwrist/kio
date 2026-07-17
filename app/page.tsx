'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { Bike, Camera, CarFront, ChevronRight, Clock3, RefreshCw, Ship, X } from 'lucide-react';
import HlsCamera from './HlsCamera';
import { corridors, type Corridor, type CorridorStatus } from './corridors';

const MapView = dynamic(() => import('./MapView'), { ssr: false, loading: () => <div className="mapLoading">OpenStreetMap laden…</div> });

type LiveRoute = { id: string; status: CorridorStatus; delayMinutes?: number | null; message: string; details?: string[] };
type LiveData = { updatedAt: string; routes: LiveRoute[] };
type FerryItem = { id: string; name: string; status: string };
type ViewItem = Corridor & { status: CorridorStatus; delayMinutes: number | null; totalMinutes: number | null; message: string; details: string[] };

const delayByStatus: Record<CorridorStatus, number | null> = { groen: 0, oranje: 7, rood: 18, onbekend: null };

function modeIcon(mode: Corridor['mode']) {
  if (mode === 'fiets') return <Bike />;
  if (mode === 'water') return <Ship />;
  return <CarFront />;
}

export default function Home() {
  const [live, setLive] = useState<LiveData | null>(null);
  const [ferries, setFerries] = useState<FerryItem[]>([]);
  const [selected, setSelected] = useState<ViewItem | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [liveResponse, statusResponse] = await Promise.all([
        fetch('/api/live', { cache: 'no-store' }),
        fetch('/api/status', { cache: 'no-store' }),
      ]);
      setLive(await liveResponse.json());
      const status = await statusResponse.json();
      setFerries(status.ferries ?? []);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); const timer = setInterval(load, 60000); return () => clearInterval(timer); }, []);

  const items = useMemo<ViewItem[]>(() => corridors.map((corridor) => {
    const match = live?.routes?.find((route) => route.id === corridor.id);
    let status: CorridorStatus = match?.status ?? 'onbekend';

    const ferryStatus = corridor.id === 'krimpen-lek'
      ? ferries.find((f) => f.id === 'kinderdijk')?.status
      : corridor.id === 'lekkerkerk'
        ? ferries.find((f) => f.id === 'lekkerkerk')?.status
        : corridor.id === 'ouderkerk'
          ? ferries.find((f) => f.id === 'ouderkerk')?.status
          : undefined;

    if (ferryStatus === 'storing') status = 'rood';
    if (ferryStatus === 'onbekend' || ferryStatus === 'controleer') status = 'onbekend';

    const delay = match?.delayMinutes ?? delayByStatus[status];
    const total = delay === null ? null : corridor.base.approach + corridor.base.wait + corridor.base.crossing + delay;
    return {
      ...corridor,
      status,
      delayMinutes: delay,
      totalMinutes: total,
      message: match?.message ?? (status === 'onbekend' ? 'Nog geen betrouwbare live schatting' : 'Actuele corridorstatus'),
      details: match?.details ?? [],
    };
  }), [live, ferries]);

  const updated = live?.updatedAt ? new Date(live.updatedAt).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }) : '—';

  return <main>
    <header className="topbar">
      <div><span className="brand">KIO</span><h1>Krimpen in & uit</h1><p>Kies de snelste oversteek naar de overkant</p></div>
      <button onClick={load} aria-label="Vernieuwen"><RefreshCw className={loading ? 'spin' : ''} /></button>
    </header>

    <section className="update"><span className="pulse" /> Live bronnen · bijgewerkt {updated}</section>

    <section className="mapCard">
      <div className="sectionHead">
        <div><span className="kicker">OPENSTREETMAP</span><h2>Ingangen en uitgangen</h2></div>
        <span className="legend"><i className="green" /> vrij <i className="orange" /> hinder <i className="red" /> zwaar <i className="unknown" /> onbekend</span>
      </div>
      <MapView items={items} onSelect={setSelected} />
      <p className="mapHint">Tik op een gekleurde route of locatie voor de opbouw van de geschatte doorstroomtijd.</p>
    </section>

    <section>
      <div className="sectionHead"><div><span className="kicker">ALLE CORRIDORS</span><h2>Oversteken vergelijken</h2></div><Clock3 /></div>
      <div className="corridorList">
        {items.map((item) => <button key={item.id} onClick={() => setSelected(item)}>
          <span className={`modeIcon ${item.status}`}>{modeIcon(item.mode)}</span>
          <span><b>{item.name}</b><small>{item.subtitle}</small></span>
          <span className="corridorTime"><b>{item.totalMinutes === null ? '—' : `± ${item.totalMinutes} min`}</b><small>{item.status === 'onbekend' ? 'geen betrouwbare schatting' : item.message}</small></span>
          <ChevronRight />
        </button>)}
      </div>
    </section>

    <section>
      <div className="sectionHead"><div><span className="kicker">LIVE BEELD</span><h2>Verkeerscamera Algerabrug</h2></div><Camera /></div>
      <HlsCamera />
      <p className="cameraCaption">Rechtstreeks HLS-livebeeld van GKR 01. Bij een tijdelijke streamstoring blijft de kaart beschikbaar.</p>
    </section>

    <footer>Kaartgegevens © OpenStreetMap-bijdragers · onbekende data blijft grijs · schattingen zijn indicatief</footer>

    {selected && <div className="sheetBackdrop" onClick={() => setSelected(null)}>
      <aside className="detailSheet" onClick={(event) => event.stopPropagation()}>
        <button className="close" onClick={() => setSelected(null)} aria-label="Sluiten"><X /></button>
        <span className={`statusBadge ${selected.status}`}>{selected.status === 'groen' ? 'Goede doorstroming' : selected.status === 'oranje' ? 'Vertraging' : selected.status === 'rood' ? 'Zware hinder / gesloten' : 'Onvoldoende live data'}</span>
        <div className="detailTitle"><span className={`modeIcon ${selected.status}`}>{modeIcon(selected.mode)}</span><div><h2>{selected.name}</h2><p>{selected.subtitle}</p></div></div>
        <div className="totalTime"><small>Geschatte tijd tot de overkant</small><strong>{selected.totalMinutes === null ? 'Geen betrouwbare schatting' : `± ${selected.totalMinutes} minuten`}</strong></div>
        <div className="timeBreakdown">
          <div><span>Aanrijden</span><b>{selected.base.approach} min</b></div>
          <div><span>Verkeersvertraging</span><b>{selected.delayMinutes === null ? 'onbekend' : `${selected.delayMinutes} min`}</b></div>
          <div><span>Verwacht wachten</span><b>{selected.base.wait} min</b></div>
          <div><span>Oversteek</span><b>{selected.base.crossing} min</b></div>
          <div className="sum"><span>Totaal</span><b>{selected.totalMinutes === null ? '—' : `${selected.totalMinutes} min`}</b></div>
        </div>
        <div className="situation"><b>Actuele situatie</b><p>{selected.message}</p></div>
        <p className="estimateNote">Aanrij-, wacht- en oversteektijden zijn indicatieve uitgangswaarden. KIO toont geen totaal wanneer de live verkeersstatus niet betrouwbaar is.</p>
        <div className="source">Laatste controle {updated}</div>
      </aside>
    </div>}
  </main>;
}
