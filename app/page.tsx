'use client';

import { useEffect, useState } from 'react';
import { Camera, ChevronRight, Clock3, RefreshCw, Route, Ship, X } from 'lucide-react';

type RouteItem = { id:string; label:string; status:'groen'|'oranje'|'rood'|'onbekend'; flowMinutes:number|null; message:string; details:string[] };
type LiveData = { updatedAt:string; bridge:{status:string;label:string}; routes:RouteItem[]; limitations:string };
type CameraData = { cameras:{id:string;type:string;name:string;url:string}[]; images:string[]; source:string };
type FerryItem = { id:string; name:string; status:string; source:string };

const paths: Record<string,string> = {
  'n210-west':'M55 128 C115 126 160 120 218 111',
  'algerabrug':'M218 111 C244 105 265 88 284 62',
  'stormpolder':'M218 111 C249 126 272 144 302 169',
  'n210-east':'M55 128 C98 157 137 176 191 188 C239 199 283 199 335 188',
};

const fallbackRoutes: RouteItem[] = [
  {id:'n210-west',label:'N210 → Capelle',status:'onbekend',flowMinutes:null,message:'Live data laden…',details:[]},
  {id:'algerabrug',label:'Algerabrug',status:'onbekend',flowMinutes:null,message:'Live data laden…',details:[]},
  {id:'stormpolder',label:'Stormpolder',status:'onbekend',flowMinutes:null,message:'Live data laden…',details:[]},
  {id:'n210-east',label:'N210 → Krimpenerwaard',status:'onbekend',flowMinutes:null,message:'Live data laden…',details:[]},
];

export default function Home(){
  const [live,setLive]=useState<LiveData|null>(null);
  const [ferries,setFerries]=useState<FerryItem[]>([]);
  const [cameras,setCameras]=useState<CameraData|null>(null);
  const [selected,setSelected]=useState<RouteItem|null>(null);
  const [loading,setLoading]=useState(false);

  async function load(){
    setLoading(true);
    try{
      const [l,s,c]=await Promise.all([fetch('/api/live',{cache:'no-store'}),fetch('/api/status',{cache:'no-store'}),fetch('/api/cameras',{cache:'no-store'})]);
      setLive(await l.json());
      const status=await s.json(); setFerries(status.ferries??[]);
      setCameras(await c.json());
    } finally { setLoading(false); }
  }
  useEffect(()=>{load();const t=setInterval(load,60000);return()=>clearInterval(t)},[]);

  const routes=live?.routes??fallbackRoutes;
  const updated=live?.updatedAt?new Date(live.updatedAt).toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'}):'—';

  return <main>
    <header className="topbar"><div><span className="brand">KIO</span><h1>Krimpen in & uit</h1><p>Actuele doorstroming rond de Algerabrug</p></div><button onClick={load} aria-label="Vernieuwen"><RefreshCw className={loading?'spin':''}/></button></header>

    <section className="update"><span className="pulse"/> Live bronnen · bijgewerkt {updated}</section>

    <section className="mapCard">
      <div className="sectionHead"><div><span className="kicker">OVERZICHT</span><h2>Ingangen en uitgangen</h2></div><span className="legend"><i className="green"/> vrij <i className="orange"/> hinder <i className="red"/> dicht</span></div>
      <div className="routeMap">
        <svg viewBox="0 0 390 245" role="img" aria-label="Schematische verkeerskaart rond Krimpen">
          <path className="river" d="M0 72 C85 40 140 77 205 58 C273 38 321 19 390 33 L390 0 L0 0Z"/>
          <text x="26" y="45" className="waterLabel">Hollandsche IJssel</text>
          {routes.map(route=><g key={route.id} onClick={()=>setSelected(route)} className="clickRoad">
            <path d={paths[route.id]} className="roadBase"/>
            <path d={paths[route.id]} className={`roadFlow ${route.status}`}/>
          </g>)}
          <circle cx="55" cy="128" r="8" className="node"/><text x="20" y="112">Capelle</text>
          <circle cx="218" cy="111" r="10" className="hub"/><text x="176" y="96">Krimpen</text>
          <circle cx="284" cy="62" r="8" className="node"/><text x="292" y="60">Rotterdam</text>
          <circle cx="302" cy="169" r="8" className="node"/><text x="307" y="164">Stormpolder</text>
          <circle cx="335" cy="188" r="8" className="node"/><text x="275" y="218">Krimpenerwaard</text>
          <text x="228" y="78" className="bridgeLabel">Algerabrug</text>
        </svg>
        <div className="routeChips">{routes.map(route=><button key={route.id} onClick={()=>setSelected(route)}><span className={`statusDot ${route.status}`}/><b>{route.label}</b><small>{route.flowMinutes!==null?`${route.flowMinutes} min`:route.message}</small><ChevronRight/></button>)}</div>
      </div>
      <p className="dataNote">Minuten verschijnen alleen bij een exact gekoppeld NDW-reistijdvak. KIO toont geen verzonnen wachttijden.</p>
    </section>

    <section><div className="sectionHead"><div><span className="kicker">OVERSTEKEN</span><h2>Veerponten</h2></div><Ship/></div><div className="ferryGrid">
      {ferries.map(f=><article key={f.id}><span className={`statusDot ${f.status==='vaart'?'groen':f.status==='storing'?'rood':'onbekend'}`}/><div><b>{f.name}</b><small>{f.status==='vaart'?'Vaart volgens actuele publicatie':f.status==='storing'?'Uit de vaart / storing':'Status niet betrouwbaar vastgesteld'}</small></div></article>)}
      {!ferries.length&&<article><span className="statusDot onbekend"/><div><b>Pontstatus laden</b><small>Even geduld…</small></div></article>}
    </div></section>

    <section><div className="sectionHead"><div><span className="kicker">LIVE BEELD</span><h2>Verkeerscamera’s</h2></div><Camera/></div>
      {cameras?.cameras?.length ? <div className="cameraGrid">{cameras.cameras.slice(0,2).map(cam=><div className="cameraFrame" key={cam.id}><iframe src={cam.url} title={cam.name} allow="autoplay; fullscreen"/><span>{cam.name} · officiële bron</span></div>)}</div> :
      cameras?.images?.length ? <div className="cameraGrid">{cameras.images.slice(0,2).map((src,i)=><div className="cameraFrame" key={src}><img src={src} alt={`Verkeerscamera ${i+1}`}/><span>Camera {i+1} · officiële bron</span></div>)}</div> :
      <div className="cameraUnavailable"><Camera/><b>Camera-embed niet gevonden</b><p>De gemeentepagina levert momenteel geen herbruikbare stream of snapshot aan de server. KIO toont daarom geen kapotte iframe.</p></div>}
    </section>

    <footer>NDW wordt iedere minuut gecontroleerd · geen puntenscore · onbekende data blijft onbekend</footer>

    {selected&&<div className="sheetBackdrop" onClick={()=>setSelected(null)}><aside className="detailSheet" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setSelected(null)}><X/></button><span className={`statusBadge ${selected.status}`}>{selected.status==='groen'?'Goede doorstroming':selected.status==='oranje'?'Hinder':selected.status==='rood'?'Afgesloten / zware hinder':'Onbekend'}</span><h2>{selected.label}</h2><div className="timeBox"><Clock3/><div><small>Doorstroomtijd</small><strong>{selected.flowMinutes!==null?`${selected.flowMinutes} minuten`:'Nog geen exact reistijdvak'}</strong></div></div><p>{selected.message}</p>{selected.details.length>0&&<div className="details"><b>Actuele NDW-meldingen</b>{selected.details.map((d,i)=><p key={i}>{d}</p>)}</div>}<div className="source"><Route/> Bron: NDW Open Data · laatste controle {updated}</div></aside></div>}
  </main>
}
