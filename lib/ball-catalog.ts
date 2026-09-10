export type BallProduct={id:string;brand:string;name:string;core:string;coreKey:string;weights:number[];releaseDate:string|null;source:string;checkedAt:string|null};
export type Catalog={products:BallProduct[];lastAttempt:string|null;lastSuccess:string|null;errors:string[];cursor:number};
export const brands=[['storm','Storm'],['roto-grip','Roto Grip'],['900-global','900 Global'],['hammer','Hammer'],['motiv','MOTIV'],['brunswick','Brunswick'],['radical','Radical']] as const;
const product=(slug:string,name:string,core:string,key:string):BallProduct=>({id:`storm/${slug}`,brand:'storm',name,core,coreKey:key,weights:[15],releaseDate:null,source:`https://www.bowwwl.com/bowling-ball-database/storm/${slug}`,checkedAt:null});
export const seedProducts:BallProduct[]=[product('iq-tour-edition','!Q Tour','C³ Centripetal Control','c3-centripetal-control'),product('motor-30','Motor 30','Torque A.I.','torque-ai'),product('the-code','The Code','RAD4','rad4')];
export const emptyCatalog=():Catalog=>({products:seedProducts,lastAttempt:null,lastSuccess:null,errors:[],cursor:0});
export function releaseBadge(date:string|null,now=Date.now()):'NEW'|'출시 예정'|null{if(!date)return null;const t=Date.parse(date+'T00:00:00Z');if(!Number.isFinite(t))return null;const days=(now-t)/86400000;return days<0?'출시 예정':days<=60?'NEW':null;}
export function modelFor(p:BallProduct|undefined,weight:number){return p?.brand==='storm'&&p.coreKey==='c3-centripetal-control'&&weight===15?'c3-v1':null;}
