'use client';

import { Camera, ChevronRight, CircleHelp, Gauge, Info, LockKeyhole, Menu, RefreshCw, Route, TimerReset, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import HlsCamera, { type CameraFeed } from './HlsCamera';

type TrafficStatus = 'groen' | 'oranje' | 'rood' | 'onbekend';
type RouteData = { id:string; name:string; status:TrafficStatus; delayMinutes:number|null; travelTimeMinutes:number|null; freeFlowMinutes:number|null; averageSpeed:number|null; updatedAt:string };
type Payload = { updatedAt:string; cacheSeconds:number; source:string; routes:RouteData[]; error?:string; diagnostics?:string[] };

const STATUS_COPY: Record<TrafficStatus,string> = { groen:'Goede doorstroming', oranje:'Merkbare vertraging', rood:'Veel vertraging', onbekend:'Data tijdelijk onbekend' };
const HEADLINES = [
  'Even kijken of de brug meewerkt…',
  'Wordt het doorrijden of aansluiten?',
  'Nog een slok koffie, of kun je gaan?',
  'Kom je vandaag een beetje vlot weg?',
  'De brug bepaalt weer de planning.',
  'Eerst de brugcheck, dan pas de autosleutels.',
  'Kijken of Krimpen je vandaag laat gaan.',
  'Groen licht voor vertrek?'
];
const CAMERAS: CameraFeed[] = [
  {id:'GKR_01',name:'Algerabrug',description:'Overzicht Algerabrug'},
  {id:'GKR_02',name:'Algera Capelle',description:'Capelse zijde van de brug'},
  {id:'GKR_03',name:'Grote Kruispunt – Krimpen uit',description:'Verkeer dat Krimpen uit rijdt'},
  {id:'GKR_04',name:'Grote Kruispunt – Krimpen in',description:'Verkeer dat Krimpen in rijdt'},
];

function ageLabel(date?:string){ if(!date)return'Nog niet bijgewerkt'; const m=Math.max(0,Math.floor((Date.now()-new Date(date).getTime())/60000)); return m<1?'Zojuist bijgewerkt':m===1?'1 minuut geleden':`${m} minuten geleden`; }
function delayLabel(delay:number|null){ return delay===null?'—':delay===0?'Geen':`+${delay} min`; }

export default function Home(){
 const [data,setData]=useState<Payload|null>(null),[loading,setLoading]=useState(true),[selected,setSelected]=useState<RouteData|null>(null);
 const [menuOpen,setMenuOpen]=useState(false),[helpOpen,setHelpOpen]=useState(false),[cameraOpen,setCameraOpen]=useState(false),[activeCamera,setActiveCamera]=useState<CameraFeed|null>(null);
 const [now,setNow]=useState(Date.now()),[headline,setHeadline]=useState(HEADLINES[0]);
 const [adminOpen,setAdminOpen]=useState(false),[adminCode,setAdminCode]=useState(''),[adminBusy,setAdminBusy]=useState(false),[adminMessage,setAdminMessage]=useState('');

 const loadTraffic=useCallback(async(silent=false,triggerRefresh=true)=>{ if(!silent)setLoading(true); try{ const mode=triggerRefresh?'trigger':'cache'; const r=await fetch(`/api/traffic?mode=${mode}&t=${Date.now()}`,{cache:'no-store'}); const p=await r.json() as Payload; if(!r.ok&&!p.routes?.length)throw new Error(p.error||'Verkeersdata niet beschikbaar'); setData(p); return p; }catch(e){ if(!silent)setData({updatedAt:new Date().toISOString(),cacheSeconds:300,source:'error',routes:[],error:String(e)}); return null; }finally{ if(!silent)setLoading(false); } },[]);
 useEffect(()=>{ setHeadline(HEADLINES[Math.floor(Math.random()*HEADLINES.length)]); void loadTraffic(); },[loadTraffic]);
 useEffect(()=>{ const id=window.setInterval(()=>{setNow(Date.now()); void loadTraffic(true,false);},60_000); return()=>clearInterval(id); },[loadTraffic]);

 async function adminRefresh(){ setAdminBusy(true);setAdminMessage('');try{const r=await fetch('/api/traffic',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:adminCode})});const p=await r.json() as Payload;if(!r.ok)throw new Error(p.error||p.diagnostics?.join(' · ')||'Vernieuwen mislukt');setData(p);setAdminMessage(p.diagnostics?.length?`Vernieuwd met meldingen: ${p.diagnostics.join(' · ')}`:'Alle routes zijn handmatig vernieuwd.');setAdminCode('');}catch(e){setAdminMessage(e instanceof Error?e.message:'Vernieuwen mislukt');}finally{setAdminBusy(false);}}
 const summary=useMemo(()=>{const r=data?.routes||[];return(r.some(x=>x.status==='rood')?'rood':r.some(x=>x.status==='oranje')?'oranje':r.length&&r.every(x=>x.status==='groen')?'groen':'onbekend') as TrafficStatus},[data]);

 return <main className="shell">
  <section className="hero compactHero">
   <div className="brandRow"><div className="logo">K</div><button className="iconButton" onClick={()=>setMenuOpen(true)} aria-label="Menu"><Menu size={22}/></button></div>
   <p className="eyebrow">KRIMPEN UIT</p><h1>{headline}</h1>
   <div className={`overall ${summary}`}><span className="statusDot"/><span>{loading?'Verkeersbeeld ophalen…':STATUS_COPY[summary]}</span></div>
  </section>

  <section className="content">
   <div className="sectionTitle"><div><p className="eyebrow dark">UITGAANDE ROUTES</p><h2>Kies jouw aanrijroute</h2></div><span className="updated" key={now}>{ageLabel(data?.updatedAt)}</span></div>
   <div className="routeList" aria-live="polite">
    {loading&&Array.from({length:5},(_,i)=><div className="routeCard skeleton" key={i}/>)}
    {!loading&&data?.routes.map(route=><button className="routeCard" key={route.id} onClick={async()=>{const fresh=await loadTraffic(true,true);setSelected(fresh?.routes.find(r=>r.id===route.id)||route)}}><span className={`routeSignal ${route.status}`}><span/></span><span className="routeMain"><strong>{route.name}</strong><small>{STATUS_COPY[route.status]}</small></span><span className="routeMetric"><strong>{delayLabel(route.delayMinutes)}</strong><small>vertraging</small></span><ChevronRight size={20}/></button>)}
    {!loading&&!data?.routes.length&&<div className="emptyState"><strong>Verkeersinformatie niet bereikbaar</strong><p>{data?.error||'Controleer de Vercel-instellingen.'}</p></div>}
   </div>
   <div className="trustNote"><TimerReset size={18}/><p>KIO haalt alleen nieuwe TomTom-data op wanneer iemand de app opent of een route aantikt én de gedeelde meting ouder is dan vijf minuten.</p><button onClick={()=>setHelpOpen(true)}><CircleHelp size={18}/></button></div>
  </section>

  {menuOpen&&<div className="overlay" onClick={()=>setMenuOpen(false)}><aside className="sideMenu" onClick={e=>e.stopPropagation()}><div className="menuHead"><div><p className="eyebrow dark">KIO MENU</p><h2>Snel naar</h2></div><button className="close" onClick={()=>setMenuOpen(false)}><X/></button></div><button className="menuItem" onClick={()=>{setMenuOpen(false);setCameraOpen(true)}}><Camera/><span><strong>Verkeerscamera's</strong><small>Alle vier livebeelden</small></span><ChevronRight/></button><div className="menuDivider"/><button className="menuItem" onClick={()=>{setMenuOpen(false);setHelpOpen(true)}}><Info/><span><strong>Waarom elke vijf minuten?</strong><small>Over data en kosten</small></span><ChevronRight/></button><button className="menuItem adminMenu" onClick={()=>{setMenuOpen(false);setAdminOpen(true)}}><LockKeyhole/><span><strong>Beheer</strong><small>Handmatig vernieuwen</small></span><ChevronRight/></button></aside></div>}

  {cameraOpen&&<div className="overlay cameraOverlayPage" onClick={()=>{setCameraOpen(false);setActiveCamera(null)}}><section className="cameraSheet" onClick={e=>e.stopPropagation()}><div className="menuHead"><div><p className="eyebrow dark">LIVEBEELD</p><h2>Verkeerscamera's</h2></div><button className="close" onClick={()=>{setCameraOpen(false);setActiveCamera(null)}}><X/></button></div><p className="cameraIntro">Kies een camera. Het livebeeld start pas na je keuze en stopt zodra je het scherm sluit.</p>{!activeCamera?<div className="cameraChoices">{CAMERAS.map(c=><button key={c.id} className="cameraChoice" onClick={()=>setActiveCamera(c)}><span className="cameraIcon"><Camera/></span><span><strong>{c.name}</strong><small>{c.description}</small></span><em>Bekijk live</em></button>)}</div>:<HlsCamera camera={activeCamera} onClose={()=>setActiveCamera(null)}/>}</section></div>}

  {selected&&<div className="overlay" onClick={()=>setSelected(null)}><article className="sheet" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setSelected(null)}><X/></button><div className={`sheetStatus ${selected.status}`}><span/></div><p className="eyebrow dark">ROUTEDETAIL</p><h2>{selected.name}</h2><p className="detailStatus">{STATUS_COPY[selected.status]}</p><div className="metrics"><div><TimerReset/><span><small>Vertraging</small><strong>{delayLabel(selected.delayMinutes)}</strong></span></div><div><Route/><span><small>Reistijd</small><strong>{selected.travelTimeMinutes??'—'}{selected.travelTimeMinutes!==null?' min':''}</strong></span></div><div><Gauge/><span><small>Gem. snelheid</small><strong>{selected.averageSpeed??'—'}{selected.averageSpeed!==null?' km/u':''}</strong></span></div></div><p className="sheetUpdated">{ageLabel(selected.updatedAt)} · TomTom verkeersinformatie</p></article></div>}

  {helpOpen&&<div className="overlay" onClick={()=>setHelpOpen(false)}><article className="sheet helpSheet" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setHelpOpen(false)}><X/></button><div className="helpIcon"><CircleHelp/></div><p className="eyebrow dark">OVER DE METING</p><h2>Waarom elke vijf minuten?</h2><p>KIO gebruikt professionele verkeersinformatie van TomTom. Iedere nieuwe routeberekening brengt kosten met zich mee.</p><p>Alle bezoekers delen daarom dezelfde meting. Alleen bij het openen van KIO of het aantikken van een route wordt gecontroleerd of een nieuwe TomTom-meting nodig is.</p><p className="muted">Tijdens gebruik controleert de app alleen of een andere bezoeker al nieuwe data heeft opgehaald. Deze controle veroorzaakt zelf geen TomTom-aanroep.</p></article></div>}

  {adminOpen&&<div className="overlay" onClick={()=>setAdminOpen(false)}><article className="sheet adminSheet" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setAdminOpen(false)}><X/></button><div className="helpIcon"><LockKeyhole/></div><p className="eyebrow dark">BEHEER</p><h2>Handmatig vernieuwen</h2><p>Vraag alle routes direct opnieuw op bij TomTom.</p><label className="codeLabel" htmlFor="admin-code">Admincode</label><input id="admin-code" className="codeInput" type="password" inputMode="numeric" value={adminCode} onChange={e=>setAdminCode(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&adminCode&&!adminBusy)void adminRefresh()}} placeholder="••••"/><button className="adminButton" disabled={!adminCode||adminBusy} onClick={()=>void adminRefresh()}><RefreshCw size={18} className={adminBusy?'spin':''}/>{adminBusy?'Vernieuwen…':'Nu vernieuwen'}</button>{adminMessage&&<p className="adminMessage">{adminMessage}</p>}</article></div>}
 </main>
}
