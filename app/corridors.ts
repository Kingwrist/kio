export type CorridorStatus = 'groen' | 'oranje' | 'rood' | 'onbekend';

export type Corridor = {
  id: string;
  name: string;
  subtitle: string;
  mode: 'auto' | 'fiets' | 'water';
  point: [number, number];
  route: [number, number][];
  base: { approach: number; wait: number; crossing: number };
};

export const corridors: Corridor[] = [
  {
    id: 'algera-main', name: 'Algerabrug', subtitle: 'Hoofdweg auto', mode: 'auto',
    point: [51.9170, 4.6008],
    route: [[51.9080,4.6352],[51.9120,4.6220],[51.9150,4.6100],[51.9170,4.6008]],
    base: { approach: 7, wait: 0, crossing: 2 },
  },
  {
    id: 'algera-lane', name: 'Algerabrug', subtitle: 'Wisselstrook auto', mode: 'auto',
    point: [51.9175, 4.6003],
    route: [[51.9080,4.6352],[51.9130,4.6205],[51.9175,4.6003]],
    base: { approach: 6, wait: 0, crossing: 2 },
  },
  {
    id: 'algera-bike', name: 'Algerabrug', subtitle: 'Fietsbrug', mode: 'fiets',
    point: [51.9163, 4.6002],
    route: [[51.9080,4.6352],[51.9110,4.6210],[51.9163,4.6002]],
    base: { approach: 13, wait: 0, crossing: 3 },
  },
  {
    id: 'krimpen-lek', name: 'Krimpen aan de Lek', subtitle: 'Autopont Kinderdijk', mode: 'auto',
    point: [51.8938, 4.6260],
    route: [[51.9080,4.6352],[51.9010,4.6315],[51.8938,4.6260]],
    base: { approach: 8, wait: 8, crossing: 4 },
  },
  {
    id: 'storm-fast', name: 'Stormpolder', subtitle: 'Fast Ferry', mode: 'water',
    point: [51.8957, 4.5845],
    route: [[51.9080,4.6352],[51.9030,4.6150],[51.8990,4.5980],[51.8957,4.5845]],
    base: { approach: 12, wait: 10, crossing: 10 },
  },
  {
    id: 'storm-taxi', name: 'Stormpolder', subtitle: 'Watertaxi', mode: 'water',
    point: [51.8963, 4.5853],
    route: [[51.9080,4.6352],[51.9015,4.6110],[51.8963,4.5853]],
    base: { approach: 12, wait: 8, crossing: 9 },
  },
  {
    id: 'lekkerkerk', name: 'Lekkerkerk', subtitle: 'Autopont Nieuw-Lekkerland', mode: 'auto',
    point: [51.8992, 4.6845],
    route: [[51.9080,4.6352],[51.9040,4.6540],[51.8992,4.6845]],
    base: { approach: 13, wait: 8, crossing: 5 },
  },
  {
    id: 'ouderkerk', name: 'Ouderkerk', subtitle: 'Fietsveer', mode: 'fiets',
    point: [51.9340, 4.6358],
    route: [[51.9080,4.6352],[51.9190,4.6354],[51.9340,4.6358]],
    base: { approach: 14, wait: 8, crossing: 4 },
  },
  {
    id: 'bergstoep', name: 'Bergstoep', subtitle: 'Veerpont', mode: 'auto',
    point: [51.9448, 4.7390],
    route: [[51.9080,4.6352],[51.9200,4.6710],[51.9330,4.7060],[51.9448,4.7390]],
    base: { approach: 27, wait: 8, crossing: 5 },
  },
  {
    id: 'gouderak', name: 'Gouderak', subtitle: 'Autopont Moordrecht', mode: 'auto',
    point: [51.9852, 4.6712],
    route: [[51.9080,4.6352],[51.9350,4.6420],[51.9610,4.6540],[51.9852,4.6712]],
    base: { approach: 24, wait: 8, crossing: 4 },
  },
];
