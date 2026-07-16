'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bell, Bike, Camera, Car, ExternalLink, Gauge, Map, RefreshCw, Ship, TriangleAlert, Wifi, WifiOff } from 'lucide-react';

type FerryItem = { id:string; name:string; status:'vaart'|'storing'|'onbekend'|'controleer'; source:string };
type LiveFeed = { id:string; label:string; ok:boolean; bytes:number; matches:{keyword:string;hits:number}[]; error?:string };
type LiveData = { updatedAt:string; source:string; availableFeeds:number; totalFeeds:number; matchedHits:number; feeds:LiveFeed[] };

const roads = [
  {name:'Algerabrug / N210', detail:'NDW live feeds + officiële projectinformatie', level:'groen', href:'https://www.rwsverkeersinfo.nl/'},
  {name:'Stormpolder / Industrieweg', detail:'Controleer actuele snelheid en incidenten', level:'geel', href:'https://www.rwsverkeersinfo.nl/'},
  {name:'N210 richting Capelle', detail:'Actuele files, snelheid en incidenten', level:'groen', href:'https://www.rwsverkeersinfo.nl/'},
  {name:'A16 / A20 aansluiting', detail:'Actuele verkeerskaart Rijkswaterstaat', level:'groen', href:'https://www.rwsverkeersinfo.nl/'}
];

function Dot({status}:{status:string}) { return <span className={`dot ${status}`} /> }

export default function Home() {
  const [ferries,setFerries] = useState<FerryItem[]>([]);
  const [live,setLive] = useState<LiveData|null>(null);
  const [updated,setUpdated] = useState('');
  const [loading,setLoading] = useState(true);
  const [cameraReady,setCameraReady] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [statusResponse, liveResponse] = await Promise.all([
        fetch('/api/status',{cache:'no-store'}),
        fetch('/api/live',{cache:'no-store'}),
      ]);
      const statusData = await statusResponse.json();
      const liveData = await liveResponse.json();
      setFerries(statusData.ferries ?? []);
      setLive(liveData);
      setUpdated(new Date().toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit',second:'2-digit'}));
    } finally { setLoading(false); }
  }

  useEffect(()=>{ load(); const timer=setInterval(load,60000); return()=>clearInterval(timer); },[]);

  const score = useMemo(() => {
    const ferryPenalty = ferries.reduce((sum,ferry) => sum + (ferry.status==='storing'?25:ferry.status==='onbekend'||ferry.status==='controleer'?5:0),0);
    const feedPenalty = live ? Math.max(0,(live.totalFeeds-live.availableFeeds)*10) : 15;
    const activityPenalty = live ? Math.min(30,live.matchedHits*2) : 0;
    return Math.min(100, ferryPenalty + feedPenalty + activityPenalty);
  },[ferries,live]);

  const level = score <= 20 ? {label:'Rustig',className:'calm',advice:'De bekende bronnen tonen geen grote verstoring.'}
    : score <= 40 ? {label:'Druk',className:'busy',advice:'Controleer je route en vertrek met wat extra tijd.'}
    : score <= 70 ? {label:'Erg druk',className:'heavy',advice:'Overweeg een pont of een later vertrekmoment.'}
    : {label:'Ernstige verstoring',className:'chaos',advice:'Controleer officiële bronnen voordat je vertrekt.'};

  async function enablePush() {
    if (!('Notification' in window)) return alert('Pushmeldingen worden niet ondersteund op dit apparaat.');
    const result=await Notification.requestPermission();
    if(result==='granted') new Notification('KIO meldingen ingeschakeld',{body:'Je browser mag nu meldingen tonen. De centrale pushdienst koppelen we in een volgende stap.'});
  }

  return <main>
    <header className="hero">
      <div><div className="eyebrow">KIO LIVE</div><h1>Krimpen<br/><span>In & Out</span></h1><p>Brug, ponten, wegen en camera’s op één mobiele pagina.</p></div>
      <button className="bell" onClick={enablePush} aria-label="Pushmeldingen"><Bell size={21}/></button>
    </header>

    <section className={`scoreCard ${level.className}`}>
      <div className="scoreTop"><div><span className="livePill"><span/>LIVE</span><h2>{level.label}</h2><p>{level.advice}</p></div><div className="scoreRing" style={{'--score':`${score*3.6}deg`} as React.CSSProperties}><strong>{score}</strong><small>/100</small></div></div>
      <div className="scoreBar"><span style={{width:`${score}%`}}/></div>
      <div className="sourceLine">{live?.availableFeeds===live?.totalFeeds?<Wifi size={15}/>:<WifiOff size={15}/>} NDW {live?.availableFeeds ?? 0}/{live?.totalFeeds ?? 3} feeds beschikbaar</div>
    </section>

    <section className="alert"><TriangleAlert/><div><strong>Algerabrug: groot onderhoud vanaf 10 augustus 2026</strong><span>Vier weken dicht voor autoverkeer. Controleer de officiële projectinformatie voor actuele details.</span></div></section>

    <div className="meta"><span>Bijgewerkt {updated || '—'} · automatisch elke minuut</span><button onClick={load}><RefreshCw size={15} className={loading?'spin':''}/> Vernieuwen</button></div>

    <section><div className="sectionTitle"><Gauge/><h2>NDW live verkeer</h2></div>
      <div className="liveGrid">
        {live?.feeds?.map(feed=><div className="liveCard" key={feed.id}><div className="liveHead"><Dot status={feed.ok?'groen':'rood'}/><strong>{feed.label}</strong></div><small>{feed.ok?`${Math.round(feed.bytes/1024).toLocaleString('nl-NL')} kB live data verwerkt`:`Bron tijdelijk niet bereikbaar`}</small><div className="matchLine">{feed.matches.length?feed.matches.slice(0,3).map(m=><span key={m.keyword}>{m.keyword}: {m.hits}</span>):<span>Geen lokale tekstmatch in deze feed</span>}</div></div>)}
      </div>
      <p className="betaNote">Bèta: KIO leest de openbare NDW-feeds live uit. In de volgende stap koppelen we exacte meetlocaties en reistijdvakken rond de Algerabrug.</p>
    </section>

    <section><div className="sectionTitle"><Ship/><h2>Veerponten</h2></div><div className="stack">
      {ferries.map(f=><a className="card row" key={f.id} href={f.source} target="_blank" rel="noreferrer"><div><Dot status={f.status}/><strong>{f.name}</strong><small>{f.status==='vaart'?'Vaart volgens gepubliceerde informatie':f.status==='storing'?'Mogelijke stremming':'Open officiële bron voor actuele status'}</small></div><ExternalLink size={17}/></a>)}
    </div></section>

    <section><div className="sectionTitle"><Car/><h2>Hoofdroutes</h2></div><div className="stack">
      {roads.map(r=><a className="card row" key={r.name} href={r.href} target="_blank" rel="noreferrer"><div><Dot status={r.level}/><strong>{r.name}</strong><small>{r.detail}</small></div><ExternalLink size={17}/></a>)}
    </div></section>

    <section><div className="sectionTitle"><Camera/><h2>Verkeerscamera’s</h2></div>
      <div className="cameraEmbed">
        {!cameraReady&&<div className="cameraLoading"><Camera size={34}/><strong>Gemeentecamera’s laden…</strong><small>Als insluiten wordt geblokkeerd, gebruik de knop onder het beeld.</small></div>}
        <iframe title="Verkeerscamera's Krimpen aan den IJssel" src="https://krimpenaandenijssel.nl/verkeerscameras/" onLoad={()=>setCameraReady(true)} loading="lazy" referrerPolicy="no-referrer-when-downgrade"/>
      </div>
      <a className="officialButton" href="https://krimpenaandenijssel.nl/verkeerscameras/" target="_blank" rel="noreferrer"><Camera size={18}/> Open officiële camera’s <ExternalLink size={15}/></a>
      <p className="betaNote">De camera’s blijven eigendom van de gemeente. KIO toont de officiële pagina of verwijst er rechtstreeks naartoe.</p>
    </section>

    <section className="quick"><a href="https://www.rwsverkeersinfo.nl/" target="_blank" rel="noreferrer"><Map/>Verkeerskaart</a><a href="https://9292.nl/" target="_blank" rel="noreferrer"><Bike/>OV & fiets</a></section>

    <footer>Krimpen In & Out · NDW en publieke officiële bronnen · controleer voor vertrek altijd de bron</footer>
  </main>
}
