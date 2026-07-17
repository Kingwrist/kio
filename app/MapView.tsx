'use client';

import { Fragment } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, ZoomControl } from 'react-leaflet';
import type { Corridor, CorridorStatus } from './corridors';

type LiveCorridor = Corridor & {
  status: CorridorStatus;
  delayMinutes: number | null;
  totalMinutes: number | null;
  message: string;
  details: string[];
};

const colors: Record<CorridorStatus, string> = {
  groen: '#16a565', oranje: '#ef8d24', rood: '#dc3f43', onbekend: '#8f9b95',
};

export default function MapView({ items, onSelect }: { items: LiveCorridor[]; onSelect: (item: LiveCorridor) => void }) {
  return (
    <MapContainer center={[51.923, 4.648]} zoom={11} minZoom={10} maxZoom={16} zoomControl={false} className="osmMap">
      <ZoomControl position="bottomright" />
      <TileLayer
        attribution='&copy; OpenStreetMap-bijdragers'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {items.map((item) => (
        <Fragment key={item.id}>
          <Polyline
            positions={item.route}
            pathOptions={{ color: '#ffffff', weight: 11, opacity: 0.9 }}
            eventHandlers={{ click: () => onSelect(item) }}
          />
          <Polyline
            positions={item.route}
            pathOptions={{ color: colors[item.status], weight: 6, opacity: 0.92, dashArray: item.status === 'onbekend' ? '8 9' : undefined }}
            eventHandlers={{ click: () => onSelect(item) }}
          />
          <CircleMarker
            center={item.point}
            radius={10}
            pathOptions={{ color: '#fff', weight: 3, fillColor: colors[item.status], fillOpacity: 1 }}
            eventHandlers={{ click: () => onSelect(item) }}
          >
            <Tooltip direction="top" offset={[0, -9]} permanent className="corridorLabel">
              <strong>{item.name}</strong>
              <span>{item.totalMinutes === null ? '—' : `± ${item.totalMinutes} min`}</span>
            </Tooltip>
          </CircleMarker>
        </Fragment>
      ))}
    </MapContainer>
  );
}
