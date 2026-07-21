export type RouteId =
  | 'cg-roosweg' | 'industrieweg' | 'nieuwe-tiendweg' | 'boerhaavelaan' | 'van-ostadelaan'
  | 'veer-krimpen-lek' | 'veer-bergambacht' | 'veer-schoonhoven';

export type TrafficStatus = 'groen' | 'oranje' | 'rood' | 'onbekend';
export type RouteKind = 'brug' | 'veer';
export type RouteDefinition = { id:RouteId; name:string; subtitle:string; kind:RouteKind; start:[number,number]; via?:[number,number][]; destination:[number,number] };
const WEST_OF_BRIDGE:[number,number]=[51.91645,4.5689];
export const ROUTES:RouteDefinition[]=[
{id:'cg-roosweg',name:'C.G. Roosweg',subtitle:'Via de Algerabrug',kind:'brug',start:[51.9251,4.6110],destination:WEST_OF_BRIDGE},
{id:'industrieweg',name:'Industrieweg',subtitle:'Via de Algerabrug',kind:'brug',start:[51.9094,4.6064],destination:WEST_OF_BRIDGE},
{id:'nieuwe-tiendweg',name:'Nieuwe Tiendweg',subtitle:'Via de Algerabrug',kind:'brug',start:[51.9280,4.6258],destination:WEST_OF_BRIDGE},
{id:'boerhaavelaan',name:'Boerhaavelaan',subtitle:'Via de Algerabrug',kind:'brug',start:[51.9208,4.6207],destination:WEST_OF_BRIDGE},
{id:'van-ostadelaan',name:'Van Ostadelaan',subtitle:'Via de Algerabrug',kind:'brug',start:[51.9139,4.6169],destination:WEST_OF_BRIDGE},
{id:'veer-krimpen-lek',name:'Krimpen a/d Lek',subtitle:'Auto naar de veerpont',kind:'veer',start:[51.9208,4.6207],via:[[51.9133,4.6460]],destination:[51.8947,4.6264]},
{id:'veer-bergambacht',name:'Bergambacht',subtitle:'Auto naar veer Bergstoep',kind:'veer',start:[51.9208,4.6207],via:[[51.9427,4.7110]],destination:[51.9305,4.7852]},
{id:'veer-schoonhoven',name:'Schoonhoven',subtitle:'Auto naar de veerpont',kind:'veer',start:[51.9208,4.6207],via:[[51.9500,4.7460]],destination:[51.9487,4.8561]},
];
export const CACHE_TTL_MS=5*60*1000;
