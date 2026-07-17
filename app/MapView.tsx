'use client';
import { Fragment, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, ZoomControl, useMap } from 'react-leaflet';
import type { Corridor, CorridorStatus } from './corridors';

type LiveCorridor = Corridor & { status: CorridorStatus; delayMinutes: number|null; totalMinutes: number|null; message:string; details:string[] };
const colors: Record<CorridorStatus,string> = { groen:'#16a565', oranje:'#ef8d24', rood:'#dc3f43', onbekend:'#8f9b95' };

function Focus({item}:{item:LiveCorridor|null}){
  const map=useMap();
  useEffect(()=>{ if(item){ map.flyTo(item.id.startsWith('algera')?[51.91461,4.58426]:item.point,item.id.startsWith('algera')?16:14,{duration:.7}); } },[item,map]);
  return null;
}

export default function MapView({items,selected,onSelect}:{items:LiveCorridor[];selected:LiveCorridor|null;onSelect:(item:LiveCorridor)=>void}){
 return <MapContainer center={[51.923,4.648]} zoom={11} minZoom={10} maxZoom={18} zoomControl={false} className="osmMap">
  <ZoomControl position="bottomright"/><Focus item={selected}/>
  <TileLayer attribution='&copy; OpenStreetMap-bijdragers' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
  {items.map(item=><Fragment key={item.id}>
    <Polyline positions={item.route} pathOptions={{color:'#fff',weight:11,opacity:.9}} eventHandlers={{click:()=>onSelect(item)}}/>
    <Polyline positions={item.route} pathOptions={{color:colors[item.status],weight:selected?.id===item.id?9:6,opacity:.94,dashArray:item.status==='onbekend'?'8 9':undefined}} eventHandlers={{click:()=>onSelect(item)}}/>
    <CircleMarker center={item.point} radius={selected?.id===item.id?12:10} pathOptions={{color:'#fff',weight:3,fillColor:colors[item.status],fillOpacity:1}} eventHandlers={{click:()=>onSelect(item)}}>
      <Tooltip direction="top" offset={[0,-9]} permanent className="corridorLabel"><strong>{item.name}</strong><span>{item.kind==='weg'?(item.delayMinutes===null?'onbekend':item.delayMinutes===0?'0 min':`+${item.delayMinutes} min`):(item.totalMinutes===null?'onbekend':`± ${item.totalMinutes} min`)}</span></Tooltip>
    </CircleMarker>
  </Fragment>)}
 </MapContainer>
}
