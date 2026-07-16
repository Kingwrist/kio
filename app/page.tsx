'use client';

import { useEffect, useState } from 'react';
import { Bell, Bike, Camera, Car, ExternalLink, Ship, Map, RefreshCw, TriangleAlert } from 'lucide-react';

type FerryItem = { id:string; name:string; status:'vaart'|'storing'|'onbekend'|'controleer'; source:string };

const roads = [
  {name:'Algerabrug / N210', detail:'Vanaf 10 augustus 2026 vier weken dicht voor autoverkeer', level:'rood', href:'https://www.rijkswaterstaat.nl/wegen/projectenoverzicht/n210-groot-onderhoud-algerabrug'},
  {name:'Stormpolder / Industrieweg', detail:'Open actuele verkeerskaart', level:'geel', href:'https://www.rwsverkeersinfo.nl/'},
  {name:'N210 richting Capelle', detail:'Live files en incidenten', level:'groen', href:'https://www.rwsverkeersinfo.nl/'},
  {name:'N210 richting Krimpenerwaard', detail:'Live files en werkzaamheden', level:'groen', href:'https://www.rwsverkeersinfo.nl/'}
];

const cameras = [
  {name:'Rijkswaterstaat verkeerscamera’s', href:'https://www.rwsverkeersinfo.nl/cameras/', note:'Open de dichtstbijzijnde beschikbare camera'},
  {name:'Algerabrug projectinformatie', href:'https://krimpenaandenijssel.nl/dossiers/groot-onderhoud-algerabrug/', note:'Updates, omleidingen en planning'},
  {name:'NDW actuele verkeerskaart', href:'https://www.ndw.nu/', note:'Files en wegmeldingen'}
];

function Dot({status}:{status:string}) { return <span className={`dot ${status}`} /> }

export default function Home() {
  const [ferries,setFerries] = useState<FerryItem[]>([]);
  const [updated,setUpdated] = useState('');
  const [loading,setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try { const r=await fetch('/api/status',{cache:'no-store'}); const d=await r.json(); setFerries(d.ferries); setUpdated(new Date(d.updatedAt).toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'})); }
    finally { setLoading(false); }
  }
  useEffect(()=>{ load(); const t=setInterval(load,60000); return()=>clearInterval(t); },[]);

  async function enablePush() {
    if (!('Notification' in window)) return alert('Pushmeldingen worden niet ondersteund op dit apparaat.');
    const result=await Notification.requestPermission();
    if(result==='granted') new Notification('Krimpen In & Out',{body:'Meldingen zijn ingeschakeld. Koppel OneSignal voor echte verkeersalerts.'});
  }

  return <main>
    <header className="hero">
      <div><div className="eyebrow">LIVE MOBILITEIT</div><h1>Krimpen<br/><span>In & Out</span></h1><p>Alles wat je nodig hebt om Krimpen in of uit te komen.</p></div>
      <button className="bell" onClick={enablePush} aria-label="Pushmeldingen"><Bell size={21}/></button>
    </header>

    <section className="alert"><TriangleAlert/><div><strong>Algerabrug sluit 10 augustus 2026</strong><span>Vier weken dicht voor autoverkeer. Reken gemiddeld op fors extra reistijd.</span></div></section>

    <div className="meta"><span>Bijgewerkt {updated || '—'}</span><button onClick={load}><RefreshCw size={15} className={loading?'spin':''}/> Vernieuwen</button></div>

    <section><div className="sectionTitle"><Ship/><h2>Veerponten</h2></div><div className="stack">
      {ferries.map(f=><a className="card row" key={f.id} href={f.source} target="_blank"><div><Dot status={f.status}/><strong>{f.name}</strong><small>{f.status==='vaart'?'Vaart volgens gepubliceerde informatie':f.status==='storing'?'Mogelijke stremming':'Open bron voor actuele status'}</small></div><ExternalLink size={17}/></a>)}
    </div></section>

    <section><div className="sectionTitle"><Car/><h2>Wegen & files</h2></div><div className="stack">
      {roads.map(r=><a className="card row" key={r.name} href={r.href} target="_blank"><div><Dot status={r.level}/><strong>{r.name}</strong><small>{r.detail}</small></div><ExternalLink size={17}/></a>)}
    </div></section>

    <section><div className="sectionTitle"><Camera/><h2>Camera’s & live beeld</h2></div><div className="cameraGrid">
      {cameras.map(c=><a className="camera" key={c.name} href={c.href} target="_blank"><div className="camIcon"><Camera/></div><strong>{c.name}</strong><small>{c.note}</small></a>)}
    </div></section>

    <section className="quick"><a href="https://www.rwsverkeersinfo.nl/" target="_blank"><Map/>Verkeerskaart</a><a href="https://9292.nl/" target="_blank"><Bike/>OV & fiets</a></section>

    <footer>Krimpen In & Out · publieke bronnen · controleer voor vertrek altijd de officiële bron</footer>
  </main>
}
