'use client';
import dynamic from 'next/dynamic';
import { useEffect,useMemo,useState } from 'react';
import { ArrowLeftRight,Bike,Camera,CarFront,Clock,History,RefreshCw,Ship,X } from 'lucide-react';
import HlsCamera, { type CameraFeed } from './HlsCamera';
import { corridors,type Corridor,type CorridorStatus } from './corridors';

const MapView=dynamic(()=>import('./MapView'),{ssr:false,loading:()=><div className="mapLoading">Kaart laden…</div>});
type LiveRoute={id:string;status:CorridorStatus;delayMinutes?:number|null;message:string;details?:string[]};
type LiveData={updatedAt:string;routes:LiveRoute[]};
type FerryItem={id:string;status:string};
type ViewItem=Corridor&{status:CorridorStatus;delayMinutes:number|null;message:string;details:string[]};

function delayStatus(delay:number|null):CorridorStatus{if(delay===null)return'onbekend';if(delay<5)return'groen';if(delay<15)return'oranje';return'rood'}
function formatDelay(value:number|null){return value===null?'Onbekend':value===0?'0 min':`+${value} min`}
function icon(item:Corridor){if(item.id==='algera-lane')return <ArrowLeftRight/>;return item.mode==='fiets'?<Bike/>:item.mode==='water'?<Ship/>:<CarFront/>}
function nextDepartures(item:Corridor){
 if(!item.frequencyMinutes)return [];
 const now=new Date(); const step=item.frequencyMinutes;
 const next=new Date(now); next.setSeconds(0,0); next.setMinutes(Math.ceil(next.getMinutes()/step)*step);
 if(next<=now)next.setMinutes(next.getMinutes()+step);
 return Array.from({length:4},(_,i)=>{const d=new Date(next);d.setMinutes(d.getMinutes()+i*step);return d.toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'})});
}
function minutesUntil(time:string){const [h,m]=time.split(':').map(Number);const now=new Date();const d=new Date(now);d.setHours(h,m,0,0);if(d<now)d.setDate(d.getDate()+1);return Math.max(0,Math.round((d.getTime()-now.getTime())/60000))}

export default function Home(){
 const [live,setLive]=useState<LiveData|null>(null),[ferries,setFerries]=useState<FerryItem[]>([]),[selected,setSelected]=useState<ViewItem|null>(null),[loading,setLoading]=useState(false),[activeCamera,setActiveCamera]=useState<CameraFeed|null>(null),[historyMode,setHistoryMode]=useState<'live'|'file15'|'file45'>('live');
 async function load(){setLoading(true);try{const [a,b]=await Promise.all([fetch('/api/live',{cache:'no-store'}),fetch('/api/status',{cache:'no-store'})]);setLive(await a.json());setFerries((await b.json()).ferries??[])}finally{setLoading(false)}}
 useEffect(()=>{load();const t=setInterval(load,60000);return()=>clearInterval(t)},[]);
 const items=useMemo<ViewItem[]>(()=>corridors.map(c=>{
  const m=live?.routes?.find(r=>r.id===c.id);
  const demo15:Record<string,number>={'algera-main':18,'algera-lane':9,'algera-bike':2,'krimpen-lek':4,'lekkerkerk':7,'gouderak':3,'bergstoep':1,'ouderkerk':0,'storm-fast':5,'storm-taxi':0};
  const demo45:Record<string,number>={'algera-main':27,'algera-lane':16,'algera-bike':4,'krimpen-lek':11,'lekkerkerk':14,'gouderak':8,'bergstoep':3,'ouderkerk':0,'storm-fast':9,'storm-taxi':0};
  const demo=historyMode==='file15'?demo15:historyMode==='file45'?demo45:null;
  const delay=demo?.[c.id]??(c.kind==='veer'?(m?.delayMinutes??0):(m?.delayMinutes??null));
  let status=delayStatus(delay);
  const ferryId=c.id==='krimpen-lek'?'kinderdijk':c.id==='lekkerkerk'?'lekkerkerk':c.id==='ouderkerk'?'ouderkerk':null;
  const fs=ferryId?ferries.find(f=>f.id===ferryId)?.status:null;
  if(fs==='storing')status='rood';
  if(c.kind==='veer'&&fs==='onbekend'&&delay===0)status='groen';
  return{...c,status,delayMinutes:delay,message:demo?`Historische testweergave: ${delay} minuten vertraging.`:(m?.message??(c.kind==='veer'?'Geen file gevonden op de route naar het veer':'Geen betrouwbare live schatting')),details:m?.details??[]};
 }),[live,ferries,historyMode]);
 const updated=live?.updatedAt?new Date(live.updatedAt).toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'}):'—';
 const algera=items.filter(i=>i.id.startsWith('algera'));
 const selectedDepartures=selected?nextDepartures(selected):[];
 return <main>
  <header className="topbar"><div><span className="brand">KIO</span><h1>Krimpen in & uit</h1><p>Live overzicht van brug en veren</p></div><button onClick={load} aria-label="Vernieuwen"><RefreshCw className={loading?'spin':''}/></button></header>
  <section className="update"><span className="pulse"/> Bijgewerkt {updated}</section>

  <section className="mapSection"><div className="sectionHead"><div><span className="kicker">LIVE KAART</span><h2>Kies een overgang</h2></div><span className="legend"><i className="green"/> 0–5 <i className="orange"/> 5–15 <i className="red"/> 15+</span></div>
   <p className="mapIntro">Tik op een bol. In iedere bol staat de verkeersvertraging in minuten. Gebruik de testhistorie om te controleren hoe een filebeeld eruitziet.</p><div className="historyControls"><button className={historyMode==='live'?'active':''} onClick={()=>setHistoryMode('live')}><RefreshCw/> Live</button><button className={historyMode==='file15'?'active':''} onClick={()=>setHistoryMode('file15')}><History/> Filevoorbeeld</button><button className={historyMode==='file45'?'active':''} onClick={()=>setHistoryMode('file45')}><History/> Zware file</button></div>{historyMode!=='live'&&<div className="demoBanner">DEMO · geen actuele verkeersdata</div>}
   <MapView items={items} selected={selected} onSelect={setSelected}/>
  </section>

  <section className="algeraSummary"><div className="sectionHead"><div><span className="kicker">ALGERABRUG</span><h2>Drie doorgangen</h2></div></div>
   <div className="orbitDots">{algera.map(item=><button key={item.id} className={`orbit ${item.status}`} onClick={()=>setSelected(item)}><span>{icon(item)}</span><b>{item.delayMinutes===null?'?':item.delayMinutes}</b><small>{item.subtitle}</small></button>)}</div>
  </section>

  <section className="cameraSection"><div className="sectionHead"><div><span className="kicker">LIVE CAMERA'S</span><h2>Kies een beeld</h2></div><Camera/></div>
   <p className="cameraNote">Camera's laden niet automatisch. Tik alleen op het beeld dat je wilt bekijken; zo gebruikt KIO geen onnodige mobiele data.</p>
   <div className="cameraChoices">{([
    {id:'GKR_01',name:'Algerabrug',description:'Overzicht Algerabrug'},
    {id:'GKR_02',name:'Algera Capelle',description:'Capelse zijde van de brug'},
    {id:'GKR_03',name:'Grote Kruispunt – Krimpen uit',description:'Verkeer dat Krimpen uit rijdt'},
    {id:'GKR_04',name:'Grote Kruispunt – Krimpen in',description:'Verkeer dat Krimpen in rijdt'},
   ] as CameraFeed[]).map(camera=><button key={camera.id} className="cameraChoice" onClick={()=>setActiveCamera(camera)}><span><Camera/></span><div><b>{camera.name}</b><small>{camera.description}</small></div><em>Bekijk live</em></button>)}</div>
   {activeCamera&&<HlsCamera camera={activeCamera} onClose={()=>setActiveCamera(null)}/>} 
  </section>
  <footer>Groen 0–5 min · oranje 5–15 min · rood 15+ min · geen betrouwbare meting blijft grijs</footer>

  {selected&&<div className="sheetBackdrop" onClick={()=>setSelected(null)}><aside className="detailSheet" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setSelected(null)}><X/></button>
   <span className={`statusBadge ${selected.status}`}>{selected.status==='groen'?'Goede doorstroming':selected.status==='oranje'?'Vertraging':selected.status==='rood'?'Veel vertraging':'Status onbekend'}</span>
   <div className="detailTitle"><span className={`modeIcon ${selected.status}`}>{icon(selected)}</span><div><h2>{selected.name}</h2><p>{selected.subtitle}</p></div></div>
   {selected.kind==='weg'?<>
    <div className="totalTime"><small>Actuele verkeersvertraging</small><strong>{formatDelay(selected.delayMinutes)}</strong></div>
    <div className="situation"><b>Live verkeersinformatie</b><p>{selected.message}</p></div>
    {selected.id.startsWith('algera')&&<div className="miniStatusGrid">{algera.map(a=><button key={a.id} onClick={()=>setSelected(a)}><span className={`statusDot ${a.status}`}/><small>{a.subtitle}</small><b>{formatDelay(a.delayMinutes)}</b></button>)}</div>}
   </>:<>
    <div className="nextDeparture">
     <span><Clock/> Eerstvolgende vaart</span>
     {selectedDepartures.length?<><strong>{selectedDepartures[0]}</strong><em>over ongeveer {minutesUntil(selectedDepartures[0])} min</em></>:<><strong>{selected.id==='storm-taxi'?'Op aanvraag':'Zie dienstregeling'}</strong><em>Geen exacte live vertrektijd beschikbaar</em></>}
    </div>
    {selectedDepartures.length>0&&<div className="departures"><small>DAARNA</small><div>{selectedDepartures.slice(1).map(t=><b key={t}>{t}</b>)}</div></div>}
    <div className="totalTime ferryDelay"><small>Verkeer naar het veer</small><strong>{formatDelay(selected.delayMinutes)}</strong></div>
    <div className="situation"><b>Actuele verkeersinformatie</b><p>{selected.delayMinutes===0?'Geen file gevonden op de route naar het veer.':selected.message}</p></div>
    <div className="scheduleTitle"><small>VAARTIJDEN</small><h3>Dienstregeling</h3></div>
    <div className="scheduleTable">{selected.schedule?.map((r,index)=><div key={index}><span>{r.days}</span><b>{r.hours}</b>{r.note&&<small>{r.note}</small>}</div>)??<p>Geen vaartijden beschikbaar.</p>}</div>
    {selected.scheduleNote&&<p className="scheduleNote">{selected.scheduleNote}</p>}
    <p className="scheduleDisclaimer">De eerstvolgende tijd is alleen een verwachting bij doorlopende diensten. Storingen, weer en feestdagen kunnen afwijken.</p>
   </>}
   <div className="source">Laatste verkeerscontrole {updated}</div>
  </aside></div>}
 </main>;
}
