export type CorridorStatus = 'groen' | 'oranje' | 'rood' | 'onbekend';
export type CorridorKind = 'weg' | 'veer';
export type ScheduleRow = { days:string; hours:string; note?:string };
export type Corridor = {
  id:string; name:string; subtitle:string; mode:'auto'|'fiets'|'water'; kind:CorridorKind;
  point:[number,number]; schedule?:ScheduleRow[]; scheduleNote?:string;
  frequencyMinutes?:number;
};

export type TrafficSegment = {
  id:string;
  corridorId:string;
  name:string;
  direction:string;
  path:[number,number][];
  accessNote?:string;
  heightLimitMeters?:number;
  switchLane?:boolean;
};

export const trafficSegments: TrafficSegment[] = [
  {
    id:'segment-industrieweg', corridorId:'algera-industrieweg', name:'Industrieweg', direction:'Krimpen uit → hoofdrijbaan',
    path:[[51.9094,4.6064],[51.9111,4.6048],[51.9131,4.6019],[51.9147,4.5966],[51.9158,4.5897],[51.9168,4.58032]],
    accessNote:'Alleen naar de hoofdrijbaan; geen toegang tot de wisselstrook.'
  },
  {
    id:'segment-cg-roosweg', corridorId:'algera-cg-roosweg', name:'C.G. Roosweg', direction:'Krimpen uit → hoofdrijbaan',
    path:[[51.9251,4.6110],[51.9230,4.6078],[51.9207,4.6028],[51.9189,4.5968],[51.9178,4.5898],[51.9168,4.58032]],
    accessNote:'Alleen naar de hoofdrijbaan; geen toegang tot de wisselstrook.'
  },
  {
    id:'segment-nieuwe-tiendweg', corridorId:'algera-nieuwe-tiendweg', name:'Nieuwe Tiendweg', direction:'Krimpen uit → hoofdrijbaan',
    path:[[51.9280,4.6258],[51.9268,4.6220],[51.9253,4.6172],[51.9235,4.6113],[51.9212,4.6049],[51.9193,4.5982],[51.9179,4.5907],[51.9168,4.58032]],
    accessNote:'Aanvoer voor zowel de hoofdrijbaan als de wisselstrook.'
  },
  {
    id:'segment-hoofdrijbaan', corridorId:'algera-main', name:'Algerabrug hoofdrijbaan', direction:'Krimpen uit → Capelle',
    path:[[51.9168,4.58032],[51.9168,4.5779],[51.9167,4.5749],[51.9165,4.5718]],
  },
  {
    id:'segment-wisselstrook', corridorId:'algera-lane', name:'Wisselstrook', direction:'Krimpen uit',
    path:[[51.9211,4.6092],[51.9195,4.6037],[51.9182,4.5974],[51.9174,4.5904],[51.9169,4.5835],[51.9168,4.58032],[51.9167,4.5768],[51.9165,4.5736]],
    accessNote:'Alleen bereikbaar via de Nieuwe Tiendweg. Niet via C.G. Roosweg of Industrieweg.',
    heightLimitMeters:1.8,
    switchLane:true,
  },
];

export const corridors: Corridor[] = [
 {id:'algera-main',name:'Algerabrug',subtitle:'Hoofdweg auto',mode:'auto',kind:'weg',point:[51.9168,4.58032]},
 {id:'algera-lane',name:'Algerabrug',subtitle:'Wisselstrook',mode:'auto',kind:'weg',point:[51.9168,4.58032]},
 {id:'algera-bike',name:'Algerabrug',subtitle:'Fietsbrug',mode:'fiets',kind:'weg',point:[51.9168,4.58032]},
 {id:'algera-industrieweg',name:'Industrieweg',subtitle:'Aanvoer naar Algerabrug · Krimpen uit',mode:'auto',kind:'weg',point:[51.9127,4.6048]},
 {id:'algera-cg-roosweg',name:'C.G. Roosweg',subtitle:'Aanvoer naar Algerabrug · Krimpen uit',mode:'auto',kind:'weg',point:[51.9206,4.6073]},
 {id:'algera-nieuwe-tiendweg',name:'Nieuwe Tiendweg',subtitle:'Aanvoer naar Algerabrug · Krimpen uit',mode:'auto',kind:'weg',point:[51.9252,4.6185]},
 {id:'krimpen-lek',name:'Krimpen aan de Lek',subtitle:'Autopont Kinderdijk',mode:'auto',kind:'veer',point:[51.8938,4.6260],frequencyMinutes:10,schedule:[{days:'Ma–za',hours:'06:00–24:00'},{days:'Zo & feestdagen',hours:'07:00–24:00'}],scheduleNote:'Vaart doorlopend, gemiddeld circa 6 afvaarten per uur.'},
 {id:'storm-fast',name:'Stormpolder',subtitle:'Waterbus / Fast Ferry',mode:'water',kind:'veer',point:[51.8957,4.5845],schedule:[{days:'Dagelijks',hours:'Volgens actuele Waterbus-dienstregeling'}],scheduleNote:'Lijn 20; exacte vertrektijden verschillen per dag en richting.'},
 {id:'storm-taxi',name:'Stormpolder',subtitle:'Watertaxi',mode:'water',kind:'veer',point:[51.8963,4.5853],schedule:[{days:'Op aanvraag',hours:'Reservering vereist'}],scheduleNote:'Geen vaste afvaarttijden.'},
 {id:'lekkerkerk',name:'Lekkerkerk',subtitle:'Pont Nieuw-Lekkerland',mode:'auto',kind:'veer',point:[51.8992,4.6845],schedule:[{days:'Ma–vr',hours:'06:30–19:30'},{days:'Za',hours:'09:00–19:00'},{days:'Zo',hours:'Gesloten'}]},
 {id:'ouderkerk',name:'Ouderkerk',subtitle:'Fietsveer',mode:'fiets',kind:'veer',point:[51.936305,4.631767],schedule:[{days:'Ma–vr',hours:'06:30–19:00'},{days:'Za',hours:'07:30–18:00'},{days:'Zo (apr–sep)',hours:'09:00–18:00'}],scheduleNote:'In het weekend kunnen langere pauzes voorkomen.'},
 {id:'bergstoep',name:'Bergstoep',subtitle:'Veerpont',mode:'auto',kind:'veer',point:[51.9448,4.7390],schedule:[{days:'Ma–vr',hours:'06:00–23:00'},{days:'Za, zo & feestdagen',hours:'07:00–23:00'}]},
 {id:'gouderak',name:'Gouderak',subtitle:'Autopont Moordrecht',mode:'auto',kind:'veer',point:[51.9852,4.6712],schedule:[{days:'Ma–vr',hours:'06:30–19:30'},{days:'Za',hours:'09:00–19:00'},{days:'Zo 1 apr–31 okt',hours:'09:00–19:00'},{days:'Zo winter',hours:'Gesloten'}]},
];
