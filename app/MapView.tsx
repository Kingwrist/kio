'use client';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, ZoomControl, useMap, Polyline, CircleMarker, Popup } from 'react-leaflet';
import { DivIcon } from 'leaflet';
import type { Corridor, CorridorStatus } from './corridors';

type LiveCorridor=Corridor&{status:CorridorStatus;delayMinutes:number|null;message:string;details:string[]};
const colors:Record<CorridorStatus,string>={groen:'#16a565',oranje:'#ef8d24',rood:'#dc3f43',onbekend:'#8f9b95'};

type NdwFeature={id:string;name:string;road:string|null;coordinates:[number,number][];speedKmh:number|null;travelTimeSeconds:number|null;measurementTime:string|null;status:CorridorStatus};
function NdwLayer(){
 const [features,setFeatures]=useState<NdwFeature[]>([]);
 useEffect(()=>{let alive=true;const load=()=>fetch('/api/ndw-traffic',{cache:'no-store'}).then(r=>r.json()).then(d=>{if(alive)setFeatures(d.features||[])}).catch(()=>{});load();const t=setInterval(load,60000);return()=>{alive=false;clearInterval(t)}},[]);
 return <>{features.map(f=>{
  const c=colors[f.status]; const body=<Popup><div className="trafficPopup"><b>{f.road||f.name}</b>{f.speedKmh!==null&&<span>Actuele snelheid: {Math.round(f.speedKmh)} km/u</span>}{f.travelTimeSeconds!==null&&<span>Reistijd: {Math.round(f.travelTimeSeconds/60)} min</span>}<small>NDW meetlocatie {f.id}</small></div></Popup>;
  return f.coordinates.length>1?<Polyline key={f.id} positions={f.coordinates} pathOptions={{color:c,weight:8,opacity:.9}}>{body}</Polyline>:<CircleMarker key={f.id} center={f.coordinates[0]} radius={7} pathOptions={{color:'#fff',weight:2,fillColor:c,fillOpacity:1}}>{body}</CircleMarker>
 })}</>;
}


function Focus({item}:{item:LiveCorridor|null}){
 const map=useMap();
 useEffect(()=>{
   if(item) map.flyTo(item.id.startsWith('algera')?[51.9168,4.58032]:item.point,item.id.startsWith('algera')?15:15,{duration:.65});
   else map.flyTo([51.932,4.650],11,{duration:.65});
 },[item,map]);
 return null;
}
function markerIcon(item:LiveCorridor){
 const value=item.delayMinutes===null?'?':String(item.delayMinutes);
 return new DivIcon({
  className:'kioMarkerWrap',
  html:`<div class="kioMarker" style="--marker:${colors[item.status]}"><span>${value}</span><small>min</small></div>`,
  iconSize:[52,52],iconAnchor:[26,26]
 });
}
function algeraIcon(items:LiveCorridor[]){
 const main=items.find(i=>i.id==='algera-main');
 const value=main?.delayMinutes===null||main?.delayMinutes===undefined?'?':String(main.delayMinutes);
 return new DivIcon({className:'kioMarkerWrap',html:`<div class="kioMarker algera" style="--marker:${colors[main?.status??'onbekend']}"><span>${value}</span><small>min</small></div>`,iconSize:[58,58],iconAnchor:[29,29]});
}
export default function MapView({items,selected,onSelect}:{items:LiveCorridor[];selected:LiveCorridor|null;onSelect:(item:LiveCorridor)=>void}){
 const transportKey=process.env.NEXT_PUBLIC_THUNDERFOREST_API_KEY;
 const tileUrl=transportKey?`https://tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=${transportKey}`:'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
 const attribution=transportKey?'&copy; OpenStreetMap-bijdragers · Tiles Thunderforest':'&copy; OpenStreetMap-bijdragers';
 const algera=items.filter(i=>i.id.startsWith('algera'));
 const others=items.filter(i=>!i.id.startsWith('algera'));
 return <MapContainer center={[51.932,4.650]} zoom={11} minZoom={10} maxZoom={18} zoomControl={false} className="osmMap">
  <ZoomControl position="bottomright"/><Focus item={selected}/>
  <TileLayer attribution={attribution} url={tileUrl}/>
  <NdwLayer/>
  <Marker position={[51.9168,4.58032]} icon={algeraIcon(algera)} eventHandlers={{click:()=>onSelect(algera.find(i=>i.id==='algera-main')!)}}>
   <Tooltip direction="top" offset={[0,-28]}><strong>Algerabrug</strong><br/>Tik voor live info</Tooltip>
  </Marker>
  {others.map(item=><Marker key={item.id} position={item.point} icon={markerIcon(item)} eventHandlers={{click:()=>onSelect(item)}}>
   <Tooltip direction="top" offset={[0,-25]}><strong>{item.name}</strong><br/>{item.subtitle}</Tooltip>
  </Marker>)}
 </MapContainer>;
}
