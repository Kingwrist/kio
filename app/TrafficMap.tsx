'use client';

import { MapContainer, TileLayer, Polyline, Popup, CircleMarker, Tooltip } from 'react-leaflet';
import { useEffect, useState } from 'react';

type Status='groen'|'oranje'|'rood'|'onbekend';
type Segment={id:string;name:string;subtitle:string;ndwName:string;length:number;coordinates:[number,number][]};
type Live={segments:Array<{id:string;status:Status;speedKmh:number|null}>}|null;

const color:Record<Status,string>={groen:'#18a66a',oranje:'#ef8b22',rood:'#d83d43',onbekend:'#8b9690'};
const text:Record<Status,string>={groen:'Vrij verkeer',oranje:'Druk',rood:'Vertraging',onbekend:'Geen data'};

export default function TrafficMap({live}:{live:Live}){
  const [segments,setSegments]=useState<Segment[]>([]);
  useEffect(()=>{fetch('/traffic-segments.json').then(r=>r.json()).then(setSegments)},[]);
  const states=new Map((live?.segments??[]).map(x=>[x.id,x]));

  return <MapContainer center={[51.913,4.615]} zoom={12} zoomControl={true} className="map">
    <TileLayer attribution="&copy; OpenStreetMap-bijdragers" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
    {segments.map(segment=>{
      const state=states.get(segment.id);
      const status=state?.status??'onbekend';
      return <Polyline key={segment.id} positions={segment.coordinates}
        pathOptions={{color:color[status],weight:10,opacity:.9,lineCap:'round',lineJoin:'round'}}>
        <Tooltip sticky><b>{segment.name}</b><br/>{text[status]}</Tooltip>
        <Popup><div className="popup"><b>{segment.name}</b><small>{segment.subtitle}</small>
          <strong className={status}>{text[status]}</strong>
          {state?.speedKmh!=null && <span>{state.speedKmh} km/u</span>}
          <small>Laatste update: zojuist</small>
        </div></Popup>
      </Polyline>
    })}
    <CircleMarker center={[51.9168,4.58032]} radius={8} pathOptions={{color:'#111',fillColor:'#fff',fillOpacity:1}}>
      <Tooltip direction="top">Algerabrug</Tooltip>
    </CircleMarker>
  </MapContainer>;
}
