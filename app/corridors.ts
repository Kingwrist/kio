export type CorridorStatus = 'groen' | 'oranje' | 'rood' | 'onbekend';
export type CorridorKind = 'weg' | 'veer';
export type ScheduleRow = { days:string; hours:string; note?:string };
export type Corridor = {
  id:string; name:string; subtitle:string; mode:'auto'|'fiets'|'water'; kind:CorridorKind;
  point:[number,number]; route:[number,number][]; schedule?:ScheduleRow[]; scheduleNote?:string;
};
export const corridors: Corridor[] = [
 {id:'algera-main',name:'Algerabrug',subtitle:'Hoofdweg auto',mode:'auto',kind:'weg',point:[51.9170,4.6008],route:[[51.9086,4.6352],[51.9118,4.6240],[51.9144,4.6120],[51.9170,4.6008]]},
 {id:'algera-lane',name:'Algerabrug',subtitle:'Wisselstrook',mode:'auto',kind:'weg',point:[51.9175,4.6003],route:[[51.9091,4.6352],[51.9126,4.6210],[51.9175,4.6003]]},
 {id:'algera-bike',name:'Algerabrug',subtitle:'Fietsbrug',mode:'fiets',kind:'weg',point:[51.9163,4.6002],route:[[51.9080,4.6352],[51.9111,4.6210],[51.9163,4.6002]]},
 {id:'krimpen-lek',name:'Krimpen aan de Lek',subtitle:'Autopont Kinderdijk',mode:'auto',kind:'veer',point:[51.8938,4.6260],route:[[51.9080,4.6352],[51.9009,4.6315],[51.8938,4.6260]],schedule:[{days:'Ma–za',hours:'06:00–24:00'},{days:'Zo & feestdagen',hours:'07:00–24:00'}],scheduleNote:'Doorlopend, gemiddeld circa 6 afvaarten per uur.'},
 {id:'storm-fast',name:'Stormpolder',subtitle:'Waterbus / Fast Ferry',mode:'water',kind:'veer',point:[51.8957,4.5845],route:[[51.9080,4.6352],[51.9025,4.6130],[51.8957,4.5845]],schedule:[{days:'Dagelijks',hours:'Volgens actuele Waterbus-dienstregeling'}],scheduleNote:'Lijn 20; tijden verschillen per dag en richting.'},
 {id:'storm-taxi',name:'Stormpolder',subtitle:'Watertaxi',mode:'water',kind:'veer',point:[51.8963,4.5853],route:[[51.9080,4.6352],[51.9015,4.6110],[51.8963,4.5853]],schedule:[{days:'Op aanvraag',hours:'Reservering vereist'}],scheduleNote:'Geen vaste afvaarttijden.'},
 {id:'lekkerkerk',name:'Lekkerkerk',subtitle:'Pont Nieuw-Lekkerland',mode:'auto',kind:'veer',point:[51.8992,4.6845],route:[[51.9080,4.6352],[51.9040,4.6540],[51.8992,4.6845]],schedule:[{days:'Ma–vr',hours:'06:30–19:30'},{days:'Za',hours:'09:00–19:00'},{days:'Zo',hours:'Gesloten'}]},
 {id:'ouderkerk',name:'Ouderkerk',subtitle:'Fietsveer',mode:'fiets',kind:'veer',point:[51.9340,4.6358],route:[[51.9080,4.6352],[51.9190,4.6354],[51.9340,4.6358]],schedule:[{days:'Ma–vr',hours:'06:30–19:00'},{days:'Za',hours:'07:30–18:00'},{days:'Zo & feestdagen',hours:'09:00–18:00'}],scheduleNote:'Binnen deze uren gelden op sommige momenten kwartierdiensten of pauzes.'},
 {id:'bergstoep',name:'Bergstoep',subtitle:'Veerpont',mode:'auto',kind:'veer',point:[51.9448,4.7390],route:[[51.9080,4.6352],[51.9200,4.6710],[51.9448,4.7390]],schedule:[{days:'Ma–vr',hours:'06:00–23:00'},{days:'Za, zo & feestdagen',hours:'07:00–23:00'}]},
 {id:'gouderak',name:'Gouderak',subtitle:'Autopont Moordrecht',mode:'auto',kind:'veer',point:[51.9852,4.6712],route:[[51.9080,4.6352],[51.9350,4.6420],[51.9852,4.6712]],schedule:[{days:'Ma–vr',hours:'06:30–19:30'},{days:'Za',hours:'09:00–19:00'},{days:'Zo 1 apr–31 okt',hours:'09:00–19:00'},{days:'Zo winter',hours:'Gesloten'}]},
];
