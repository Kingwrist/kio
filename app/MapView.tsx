'use client';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, ZoomControl, useMap, Polyline, Popup } from 'react-leaflet';
import { DivIcon } from 'leaflet';
import type { Corridor, CorridorStatus } from './corridors';

type LiveCorridor = Corridor & { status: CorridorStatus; delayMinutes: number | null; message: string; details: string[] };
const colors: Record<CorridorStatus, string> = { groen: '#16a565', oranje: '#ef8d24', rood: '#dc3f43', onbekend: '#8f9b95' };

type TrafficSegment = {
  id: string;
  corridorId: string;
  name: string;
  subtitle: string;
  coordinates: [number, number][];
  status: CorridorStatus;
  delayMinutes: number | null;
  speedKmh: number | null;
  freeFlowKmh: number;
  measurementTime: string | null;
  measurementCount: number;
  accessNote: string | null;
  message: string;
};

function formatDelay(value: number | null) {
  return value === null ? 'Onbekend' : value === 0 ? '0 min' : `+${value} min`;
}

function NdwRoadLayer() {
  const [segments, setSegments] = useState<TrafficSegment[]>([]);
  useEffect(() => {
    let alive = true;
    const load = () => fetch('/api/ndw-traffic', { cache: 'no-store' })
      .then(response => response.json())
      .then(data => { if (alive) setSegments(data.segments || []); })
      .catch(() => {});
    load();
    const timer = setInterval(load, 60000);
    return () => { alive = false; clearInterval(timer); };
  }, []);

  return <>{segments.map(segment => <Polyline
    key={segment.id}
    positions={segment.coordinates}
    pathOptions={{ color: colors[segment.status], weight: 9, opacity: .88, lineCap: 'round', lineJoin: 'round' }}
  >
    <Tooltip sticky><strong>{segment.name}</strong><br/>{formatDelay(segment.delayMinutes)}</Tooltip>
    <Popup>
      <div className="trafficPopup roadPopup">
        <b>{segment.name}</b>
        <small>{segment.subtitle}</small>
        <strong className={`roadDelay ${segment.status}`}>{formatDelay(segment.delayMinutes)}</strong>
        <span>{segment.message}</span>
        {segment.speedKmh !== null && <span>Gemiddelde gemeten snelheid: {segment.speedKmh} km/u</span>}
        <span>Gebruikte NDW-metingen: {segment.measurementCount}</span>
        {segment.accessNote && <small>{segment.accessNote}</small>}
      </div>
    </Popup>
  </Polyline>)}</>;
}

function Focus({ item }: { item: LiveCorridor | null }) {
  const map = useMap();
  useEffect(() => {
    if (item) map.flyTo(item.id.startsWith('algera') ? [51.9168, 4.58032] : item.point, item.id.startsWith('algera') ? 15 : 15, { duration: .65 });
    else map.flyTo([51.932, 4.650], 11, { duration: .65 });
  }, [item, map]);
  return null;
}

function markerIcon(item: LiveCorridor) {
  const value = item.delayMinutes === null ? '?' : String(item.delayMinutes);
  return new DivIcon({
    className: 'kioMarkerWrap',
    html: `<div class="kioMarker" style="--marker:${colors[item.status]}"><span>${value}</span><small>min</small></div>`,
    iconSize: [52, 52], iconAnchor: [26, 26]
  });
}

function algeraIcon(items: LiveCorridor[]) {
  const main = items.find(item => item.id === 'algera-main');
  const value = main?.delayMinutes === null || main?.delayMinutes === undefined ? '?' : String(main.delayMinutes);
  return new DivIcon({
    className: 'kioMarkerWrap',
    html: `<div class="kioMarker algera" style="--marker:${colors[main?.status ?? 'onbekend']}"><span>${value}</span><small>min</small></div>`,
    iconSize: [58, 58], iconAnchor: [29, 29]
  });
}

export default function MapView({ items, selected, onSelect }: { items: LiveCorridor[]; selected: LiveCorridor | null; onSelect: (item: LiveCorridor) => void }) {
  const transportKey = process.env.NEXT_PUBLIC_THUNDERFOREST_API_KEY;
  const tileUrl = transportKey ? `https://tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=${transportKey}` : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const attribution = transportKey ? '&copy; OpenStreetMap-bijdragers · Tiles Thunderforest' : '&copy; OpenStreetMap-bijdragers';
  const algera = items.filter(item => item.id.startsWith('algera'));
  const others = items.filter(item => !item.id.startsWith('algera'));
  return <MapContainer center={[51.932, 4.650]} zoom={11} minZoom={10} maxZoom={18} zoomControl={false} className="osmMap">
    <ZoomControl position="bottomright"/><Focus item={selected}/>
    <TileLayer attribution={attribution} url={tileUrl}/>
    <NdwRoadLayer/>
    <Marker position={[51.9168, 4.58032]} icon={algeraIcon(algera)} eventHandlers={{ click: () => onSelect(algera.find(item => item.id === 'algera-main')!) }}>
      <Tooltip direction="top" offset={[0, -28]}><strong>Algerabrug</strong><br/>Tik voor live info</Tooltip>
    </Marker>
    {others.map(item => <Marker key={item.id} position={item.point} icon={markerIcon(item)} eventHandlers={{ click: () => onSelect(item) }}>
      <Tooltip direction="top" offset={[0, -25]}><strong>{item.name}</strong><br/>{item.subtitle}</Tooltip>
    </Marker>)}
  </MapContainer>;
}
