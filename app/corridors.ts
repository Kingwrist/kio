export type CorridorStatus = 'groen' | 'oranje' | 'rood' | 'onbekend';
export type CorridorKind = 'weg' | 'veer';

export type Corridor = {
  id: string;
  name: string;
  subtitle: string;
  mode: 'auto' | 'fiets' | 'water';
  kind: CorridorKind;
  point: [number, number];
  route: [number, number][];
  waitMinutes?: number;
  crossingMinutes?: number;
};

export const corridors: Corridor[] = [
  { id:'algera-main', name:'Algerabrug', subtitle:'Hoofdweg auto', mode:'auto', kind:'weg', point:[51.9170,4.6008], route:[[51.9086,4.6352],[51.9118,4.6240],[51.9144,4.6120],[51.9170,4.6008]] },
  { id:'algera-lane', name:'Algerabrug', subtitle:'Wisselstrook auto', mode:'auto', kind:'weg', point:[51.9175,4.6003], route:[[51.9091,4.6352],[51.9126,4.6210],[51.9175,4.6003]] },
  { id:'algera-bike', name:'Algerabrug', subtitle:'Fietsbrug', mode:'fiets', kind:'weg', point:[51.9163,4.6002], route:[[51.9080,4.6352],[51.9111,4.6210],[51.9163,4.6002]] },
  { id:'krimpen-lek', name:'Krimpen aan de Lek', subtitle:'Autopont Kinderdijk', mode:'auto', kind:'veer', point:[51.8938,4.6260], route:[[51.9080,4.6352],[51.9009,4.6315],[51.8938,4.6260]], waitMinutes:8, crossingMinutes:4 },
  { id:'storm-fast', name:'Stormpolder', subtitle:'Fast Ferry', mode:'water', kind:'veer', point:[51.8957,4.5845], route:[[51.9080,4.6352],[51.9025,4.6130],[51.8957,4.5845]], waitMinutes:10, crossingMinutes:10 },
  { id:'storm-taxi', name:'Stormpolder', subtitle:'Watertaxi', mode:'water', kind:'veer', point:[51.8963,4.5853], route:[[51.9080,4.6352],[51.9015,4.6110],[51.8963,4.5853]], waitMinutes:8, crossingMinutes:9 },
  { id:'lekkerkerk', name:'Lekkerkerk', subtitle:'Autopont Nieuw-Lekkerland', mode:'auto', kind:'veer', point:[51.8992,4.6845], route:[[51.9080,4.6352],[51.9040,4.6540],[51.8992,4.6845]], waitMinutes:8, crossingMinutes:5 },
  { id:'ouderkerk', name:'Ouderkerk', subtitle:'Fietsveer', mode:'fiets', kind:'veer', point:[51.9340,4.6358], route:[[51.9080,4.6352],[51.9190,4.6354],[51.9340,4.6358]], waitMinutes:8, crossingMinutes:4 },
  { id:'bergstoep', name:'Bergstoep', subtitle:'Veerpont', mode:'auto', kind:'veer', point:[51.9448,4.7390], route:[[51.9080,4.6352],[51.9200,4.6710],[51.9448,4.7390]], waitMinutes:8, crossingMinutes:5 },
  { id:'gouderak', name:'Gouderak', subtitle:'Autopont Moordrecht', mode:'auto', kind:'veer', point:[51.9852,4.6712], route:[[51.9080,4.6352],[51.9350,4.6420],[51.9852,4.6712]], waitMinutes:8, crossingMinutes:4 },
];
