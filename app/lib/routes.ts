export type RouteId =
  | 'cg-roosweg'
  | 'industrieweg'
  | 'nieuwe-tiendweg'
  | 'boerhaavelaan'
  | 'van-ostadelaan';

export type TrafficStatus = 'groen' | 'oranje' | 'rood' | 'onbekend';

export type RouteDefinition = {
  id: RouteId;
  name: string;
  subtitle: string;
  start: [number, number];
  via?: [number, number][];
  destination: [number, number];
};

const WEST_OF_BRIDGE: [number, number] = [51.91645, 4.5689];

// De startpunten liggen bewust op de uitgaande rijrichting. Ze zijn centraal
// vastgelegd, zodat ze later eenvoudig met veldtests kunnen worden verfijnd.
export const ROUTES: RouteDefinition[] = [
  {
    id: 'cg-roosweg',
    name: 'C.G. Roosweg',
    subtitle: 'Via de Algerabrug',
    start: [51.9251, 4.6110],
    destination: WEST_OF_BRIDGE,
  },
  {
    id: 'industrieweg',
    name: 'Industrieweg',
    subtitle: 'Via de Algerabrug',
    start: [51.9094, 4.6064],
    destination: WEST_OF_BRIDGE,
  },
  {
    id: 'nieuwe-tiendweg',
    name: 'Nieuwe Tiendweg',
    subtitle: 'Via de Algerabrug',
    start: [51.9280, 4.6258],
    destination: WEST_OF_BRIDGE,
  },
  {
    id: 'boerhaavelaan',
    name: 'Boerhaavelaan',
    subtitle: 'Via de Algerabrug',
    start: [51.9208, 4.6207],
    destination: WEST_OF_BRIDGE,
  },
  {
    id: 'van-ostadelaan',
    name: 'Van Ostadelaan',
    subtitle: 'Via de Algerabrug',
    start: [51.9139, 4.6169],
    destination: WEST_OF_BRIDGE,
  },
];

export const CACHE_TTL_MS = 5 * 60 * 1000;
