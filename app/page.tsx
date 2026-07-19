'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, Bridge, Ship, RefreshCw } from 'lucide-react';

const TrafficMap = dynamic(() => import('./TrafficMap'), { ssr:false });

type Status = 'groen'|'oranje'|'rood'|'onbekend';
type TrafficResponse = {
  updatedAt:string;
  demo:boolean;
  lane:{direction:'krimpen'|'capelle'|'gesloten'|'onbekend'; label:string};
  segments:Array<{id:string;status:Status;speedKmh:number|null}>;
};

const statusText:Record<Status,string> = {
  groen:'Vrij', oranje:'Druk', rood:'Vertraging', onbekend:'Geen data'
};

export default function Home(){
  const [data,setData]=useState<TrafficResponse|null>(null);
  const [loading,setLoading]=useState(true);

  async function load(){
    setLoading(true);
    try {
      const r=await fetch('/api/traffic',{cache:'no-store'});
      setData(await r.json());
    } finally { setLoading(false); }
  }
  useEffect(()=>{ load(); const t=setInterval(load,60000); return()=>clearInterval(t); },[]);

  const bridgeStatus=useMemo(()=>{
    const s=data?.segments.filter(x=>['10405','24881','19914'].includes(x.id)).map(x=>x.status) ?? [];
    if(s.includes('rood')) return 'rood'; if(s.includes('oranje')) return 'oranje';
    if(s.includes('groen')) return 'groen'; return 'onbekend';
  },[data]);

  const pontStatus=useMemo(()=>{
    const s=data?.segments.filter(x=>['19129','19107'].includes(x.id)).map(x=>x.status) ?? [];
    if(s.includes('rood')) return 'rood'; if(s.includes('oranje')) return 'oranje';
    if(s.includes('groen')) return 'groen'; return 'onbekend';
  },[data]);

  return <main>
    <header>
      <div><span className="eyebrow">KRIMPEN IN & OUT</span><h1>KIO</h1></div>
      <button onClick={load} aria-label="Vernieuwen"><RefreshCw size={20} className={loading?'spin':''}/></button>
    </header>

    <section className="cards">
      <article className={`statusCard ${bridgeStatus}`}>
        <Bridge/><div><small>Algerabrug</small><strong>{statusText[bridgeStatus]}</strong></div>
      </article>
      <article className="statusCard lane">
        <ArrowLeftRight/><div><small>Wisselstrook</small><strong>{data?.lane.label ?? 'Onbekend'}</strong></div>
      </article>
      <article className={`statusCard ${pontStatus}`}>
        <Ship/><div><small>Pontroute</small><strong>{statusText[pontStatus]}</strong></div>
      </article>
    </section>

    <section className="mapShell">
      <TrafficMap live={data}/>
      <div className="legend">
        <span><i className="groen"/>Vrij</span>
        <span><i className="oranje"/>Druk</span>
        <span><i className="rood"/>Vertraging</span>
      </div>
    </section>

    <footer>
      <span>{data?.demo ? 'Demomodus — nog niet gekoppeld aan live NDW' : 'Bron: NDW'}</span>
      <span>{data ? new Date(data.updatedAt).toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'}) : '--:--'}</span>
    </footer>
  </main>;
}
