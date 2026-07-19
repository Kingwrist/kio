import { NextResponse } from 'next/server';

type Status='groen'|'oranje'|'rood'|'onbekend';

function demoStatus(index:number):{status:Status;speedKmh:number}{
  const phase=(Math.floor(Date.now()/300000)+index)%6;
  if(phase===0) return {status:'rood',speedKmh:18};
  if(phase<=2) return {status:'oranje',speedKmh:34};
  return {status:'groen',speedKmh:49};
}

export async function GET(){
  // Vervang deze demowaarden later door de geselecteerde NDW IDs.
  const ids=['10405','24881','19914','15311','19129','19107','66955'];
  const segments=ids.map((id,index)=>({id,...demoStatus(index)}));

  // Wisselstrook: koppel hier later de officiële bron.
  const hour=new Date().getHours();
  const direction=hour<12?'capelle':hour<20?'krimpen':'gesloten';
  const label=direction==='capelle'?'→ Capelle':direction==='krimpen'?'← Krimpen':'Gesloten';

  return NextResponse.json({
    updatedAt:new Date().toISOString(),
    demo:true,
    lane:{direction,label},
    segments
  },{headers:{'Cache-Control':'no-store'}});
}
