'use client';
import { useEffect,useMemo,useState } from 'react';
import { ArrowLeftRight,Bike,Camera,CarFront,ChevronRight,RefreshCw,Ship,X } from 'lucide-react';
import HlsCamera from './HlsCamera';
import { corridors,type Corridor,type CorridorStatus } from './corridors';

type LiveRoute={id:string;status:CorridorStatus;delayMinutes?:number|null;message:string;details?:string[]};
type LiveData={updatedAt:string;routes:LiveRoute[]};
type FerryItem={id:string;status:string};
type ViewItem=Corridor&{status:CorridorStatus;delayMinutes:number|null;message:string;details:string[]};

const AUTO_IDS=['algera-main','algera-lane','krimpen-lek','bergstoep','lekkerkerk','gouderak'];
const BIKE_IDS=['algera-bike','krimpen-lek','bergstoep','lekkerkerk','gouderak','ouderkerk','storm-fast'];

function icon(item:Corridor){
 if(item.id==='algera-lane')return <ArrowLeftRight/>;
 return item.mode==='fiets'?<Bike/>:item.mode==='water'?<Ship/>:<CarFront/>;
}
function delayStatus(delay:number|null):CorridorStatus{
 if(delay===null)return'onbekend';
 if(delay<5)return'groen';
 if(delay<15)return'oranje';
 return'rood';
}
function scheduledNow(item:Corridor):CorridorStatus{
 if(!item.schedule)return'onbekend';
 const now=new Date();const day=now.getDay();const minutes=now.getHours()*60+now.getMinutes();
 const parse=(s:string)=>{const m=s.match(/(\d\d?):(\d\d)\s*[–-]\s*(\d\d?):(\d\d)/);return m?[+m[1]*60 + +m[2],+m[3]*60 + +m[4]]:null};
 let candidate:string|undefined;
 if(day>=1&&day<=5)candidate=item.schedule.find(r=>/Ma–vr|Ma–za/.test(r.days))?.hours;
 else if(day===6)candidate=item.schedule.find(r=>/^Za|Za,|Ma–za/.test(r.days))?.hours;
 else candidate=item.schedule.find(r=>/Zo/.test(r.days))?.hours;
 if(!candidate||/Gesloten|aanvraag|Volgens/.test(candidate))return'onbekend';
 const range=parse(candidate);return range&&minutes>=range[0]&&minutes<=range[1]?'groen':'onbekend';
}
function formatDelay(value:number|null){return value===null?'Onbekend':value===0?'0 min':`+${value} min`}

export default function Home(){
 const [live,setLive]=useState<LiveData|null>(null),[ferries,setFerries]=useState<FerryItem[]>([]),[selected,setSelected]=useState<ViewItem|null>(null),[loading,setLoading]=useState(false);
 async function load(){setLoading(true);try{const [a,b]=await Promise.all([fetch('/api/live',{cache:'no-store'}),fetch('/api/status',{cache:'no-store'})]);setLive(await a.json());setFerries((await b.json()).ferries??[])}finally{setLoading(false)}}
 useEffect(()=>{load();const t=setInterval(load,60000);return()=>clearInterval(t)},[]);
 const items=useMemo<ViewItem[]>(()=>corridors.map(c=>{
   const m=live?.routes?.find(r=>r.id===c.id);
   // Bij veren betekent geen gevonden file: 0 minuten vertraging.
   const delay=c.kind==='veer'?(m?.delayMinutes??0):(m?.delayMinutes??null);
   let status=c.kind==='weg'?delayStatus(delay):delayStatus(delay);
   const ferryId=c.id==='krimpen-lek'?'kinderdijk':c.id==='lekkerkerk'?'lekkerkerk':c.id==='ouderkerk'?'ouderkerk':null;
   const fs=ferryId?ferries.find(f=>f.id===ferryId)?.status:null;
   if(fs==='storing')status='rood';
   if(fs==='vaart'&&delay!==null)status=delayStatus(delay);
   if(c.kind==='veer'&&scheduledNow(c)==='onbekend'&&fs!=='vaart'&&fs!=='storing')status='onbekend';
   return{...c,status,delayMinutes:delay,message:m?.message??(c.kind==='veer'?'Geen file gevonden op de route naar het veer':'Geen betrouwbare live schatting'),details:m?.details??[]}
 }),[live,ferries]);
 const byId=(id:string)=>items.find(i=>i.id===id)!;
 const rank=(ids:string[])=>ids.map(byId).filter(Boolean).sort((a,b)=>{
   if(a.status==='onbekend'&&b.status!=='onbekend')return 1;
   if(b.status==='onbekend'&&a.status!=='onbekend')return-1;
   return(a.delayMinutes??999)-(b.delayMinutes??999);
 });
 const autoRoutes=rank(AUTO_IDS), bikeRoutes=rank(BIKE_IDS);
 const updated=live?.updatedAt?new Date(live.updatedAt).toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'}):'—';

 const routeList=(title:string,subtitle:string,list:ViewItem[],mode:'auto'|'fiets')=><div className="bestRouteBlock">
   <div className="routeModeTitle"><span className={`routeModeIcon ${mode}`}>{mode==='auto'?<CarFront/>:<Bike/>}</span><div><h3>{title}</h3><p>{subtitle}</p></div></div>
   <div className="rankList">{list.map((item,index)=><button key={item.id} onClick={()=>setSelected(item)} className={index===0?'winner':''}>
     <span className="rankNumber">{index+1}</span><span className={`statusDot ${item.status}`}/><span className="rankName"><b>{item.name}</b><small>{item.subtitle}</small></span><span className="rankDelay">{formatDelay(item.delayMinutes)}</span><ChevronRight/>
   </button>)}</div>
 </div>;

 return <main>
  <header className="topbar"><div><span className="brand">KIO</span><h1>Krimpen in & uit</h1><p>De snelste uitgang per vervoerstype</p></div><button onClick={load} aria-label="Vernieuwen"><RefreshCw className={loading?'spin':''}/></button></header>
  <section className="update"><span className="pulse"/> Bijgewerkt {updated}</section>

  <section className="bestRoutes"><div className="sectionHead"><div><span className="kicker">NU</span><h2>Beste route Krimpen uit</h2></div><span className="legend"><i className="green"/> 0–5 <i className="orange"/> 5–15 <i className="red"/> 15+</span></div>
   <p className="bestIntro">Gerangschikt op gevonden verkeersvertraging. Bij een veer betekent <b>0 min</b> dat er geen file op de route naar het veer is gevonden; de vaartijden zie je na aantikken.</p>
   {routeList('Met de auto','Brug, wisselstrook en autoponten',autoRoutes,'auto')}
   {routeList('Met de fiets','Fietsbrug, ponten en Fast Ferry',bikeRoutes,'fiets')}
  </section>

  <section><div className="sectionHead"><div><span className="kicker">LIVE CAMERA</span><h2>Algerabrug</h2></div><Camera/></div><HlsCamera/><p className="cameraNote">Live verkeersbeeld van de Algerabrug. Bij een tijdelijke bronstoring kun je de speler opnieuw laten verbinden.</p></section>
  <footer>Groen 0–5 min · oranje 5–15 min · rood 15+ min · onbekende data blijft grijs</footer>

  {selected&&<div className="sheetBackdrop" onClick={()=>setSelected(null)}><aside className="detailSheet" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setSelected(null)}><X/></button><span className={`statusBadge ${selected.status}`}>{selected.status==='groen'?'Goede doorstroming':selected.status==='oranje'?'Vertraging':selected.status==='rood'?'Veel vertraging':'Status onbekend'}</span><div className="detailTitle"><span className={`modeIcon ${selected.status}`}>{icon(selected)}</span><div><h2>{selected.name}</h2><p>{selected.subtitle}</p></div></div>
   <div className="totalTime"><small>Verkeersvertraging</small><strong>{formatDelay(selected.delayMinutes)}</strong></div>
   {selected.kind==='weg'?<><div className="situation"><b>Actuele verkeersinformatie</b><p>{selected.message}</p></div><div className="scaleExplain"><span className="green">0–5 min</span><span className="orange">5–15 min</span><span className="red">15+ min</span></div></>:<><div className="situation"><b>Route naar het veer</b><p>{selected.delayMinutes===0?'Geen file gevonden. Daarom staat de verkeersvertraging op 0 minuten.':selected.message}</p></div><div className="scheduleTitle"><small>DIENSTREGELING</small><h3>Vaartijden</h3></div><div className="scheduleTable">{selected.schedule?.map((r,index)=><div key={index}><span>{r.days}</span><b>{r.hours}</b>{r.note&&<small>{r.note}</small>}</div>)??<p>Geen vaartijden beschikbaar.</p>}</div>{selected.scheduleNote&&<p className="scheduleNote">{selected.scheduleNote}</p>}<p className="scheduleDisclaimer">Vaartijden kunnen bij storing, weer of feestdagen afwijken.</p></>}
   <div className="source">Laatste verkeerscontrole {updated}</div></aside></div>}
 </main>
}
