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
    path:[[51.9094,4.6064],[51.9111,4.6056],[51.9132,4.6048],[51.9150,4.6036],[51.9164,4.6022],[51.9170,4.6008]],
    accessNote:'Alleen naar de hoofdrijbaan; geen toegang tot de wisselstrook.'
  },
  {
    id:'segment-cg-roosweg', corridorId:'algera-cg-roosweg', name:'C.G. Roosweg', direction:'Krimpen uit → hoofdrijbaan',
    path:[[51.9251,4.6110],[51.9231,4.6097],[51.9208,4.6074],[51.9189,4.6048],[51.9177,4.6022],[51.9170,4.6008]],
    accessNote:'Alleen naar de hoofdrijbaan; geen toegang tot de wisselstrook.'
  },
  {
    id:'segment-nieuwe-tiendweg', corridorId:'algera-nieuwe-tiendweg', name:'Nieuwe Tiendweg', direction:'Krimpen uit → hoofdrijbaan',
    path:[[51.9280,4.6258],[51.9268,4.6220],[51.9254,4.6186],[51.9238,4.6145],[51.9217,4.6102],[51.9195,4.6062],[51.9178,4.6024],[51.9170,4.6008]],
    accessNote:'Aanvoer voor zowel de hoofdrijbaan als de wisselstrook.'
  },
  {
    id:'segment-hoofdrijbaan', corridorId:'algera-main', name:'Algerabrug hoofdrijbaan', direction:'Krimpen uit → Capelle',
    path:[[51.9170,4.6008],[51.9168,4.5986],[51.9165,4.5960],[51.9160,4.5933]],
  },
  {
    id:'segment-wisselstrook', corridorId:'algera-lane', name:'Wisselstrook', direction:'Krimpen uit',
    path:[[51.9211,4.6092],[51.9194,4.6058],[51.9179,4.6022],[51.9172,4.6005],[51.9168,4.5982],[51.9165,4.5956]],
    accessNote:'Alleen bereikbaar via de Nieuwe Tiendweg. Niet via C.G. Roosweg of Industrieweg.',
    heightLimitMeters:1.8,
    switchLane:true,
  },
];

export const corridors: Corridor[] = [
 {id:'algera-main',name:'Algerabrug',subtitle:'Hoofdweg auto',mode:'auto',kind:'weg',point:[51.9170,4.6008]},
 {id:'algera-lane',name:'Algerabrug',subtitle:'Wisselstrook',mode:'auto',kind:'weg',point:[51.9175,4.6003]},
 {id:'algera-bike',name:'Algerabrug',subtitle:'Fietsbrug',mode:'fiets',kind:'weg',point:[51.9163,4.6002]},
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
