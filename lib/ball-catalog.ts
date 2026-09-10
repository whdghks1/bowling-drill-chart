export type BallProduct={id:string;brand:string;name:string;core:string;coreKey:string;weights:number[];releaseDate:string|null;source:string;checkedAt:string|null};
export type Catalog={products:BallProduct[];lastAttempt:string|null;lastSuccess:string|null;errors:string[];cursor:number};
export const brands=[['storm','Storm'],['roto-grip','Roto Grip'],['900-global','900 Global'],['hammer','Hammer'],['motiv','MOTIV'],['brunswick','Brunswick'],['radical','Radical']] as const;
const product=(slug:string,name:string,core:string,key:string):BallProduct=>({id:`storm/${slug}`,brand:'storm',name,core,coreKey:key,weights:[15],releaseDate:null,source:`https://www.bowwwl.com/bowling-ball-database/storm/${slug}`,checkedAt:null});
export const seedProducts:BallProduct[]=[product('iq-tour-edition','!Q Tour','C³ Centripetal Control','c3-centripetal-control'),product('motor-30','Motor 30','Torque A.I.','torque-ai'),product('the-code','The Code','RAD4','rad4')];
export const emptyCatalog=():Catalog=>({products:seedProducts,lastAttempt:null,lastSuccess:null,errors:[],cursor:0});
export function releaseBadge(date:string|null,now=Date.now()):'NEW'|'출시 예정'|null{if(!date)return null;const t=Date.parse(date+'T00:00:00Z');if(!Number.isFinite(t))return null;const days=(now-t)/86400000;return days<0?'출시 예정':days<=60?'NEW':null;}
export const coreModels={
 'c3-v1':{name:'C³ Centripetal Control',brand:'storm',key:'c3-centripetal-control',image:'storm/S_C3C_00000.png'},
 'capacitor-v1':{name:'Capacitor',brand:'storm',key:'capacitor',image:'storm/CapacitorCore_00000.png'},
 'hustle-v1':{name:'Hustle',brand:'roto-grip',key:'hustle',image:'roto/Hustle_00000.png'},
 'surge-v1':{name:'Surge',brand:'storm',key:'surge',image:'storm/SurgeCore_00000.png'},
 'id-ai-v1':{name:'ID A.I.',brand:'storm',key:'id-ai',image:'storm/Identity%20Core_00000.png'},
 'c3-ai-v1':{name:'C³ A.I.',brand:'storm',key:'c3-ai',image:'storm/C3CC_AI_00000.png'},
 'centripetal-hd-ai-v1':{name:'Centripetal HD A.I.',brand:'storm',key:'centripetal-hd-ai',image:'storm/Centripetal_hd_ai_00000.png'},
 'ikon-ai-v1':{name:'Ikon A.I.',brand:'roto-grip',key:'ikon-ai',image:'roto/Ikon_00000.png'},
 'wrecker-ai-v1':{name:'Wrecker A.I.',brand:'roto-grip',key:'wrecker-ai',image:'roto/R_Wrecker_AI.png'},
 'meditate-ai-v1':{name:'Meditate A.I.',brand:'900-global',key:'meditate-ai',image:'global/G_Meditate_AI_00000.png'},
} as const;
export type CoreModelId=keyof typeof coreModels;
export function modelFor(p:BallProduct|undefined,weight:number):CoreModelId|null{if(!p||weight!==15)return null;return (Object.keys(coreModels) as CoreModelId[]).find(id=>coreModels[id].brand===p.brand&&coreModels[id].key===p.coreKey)??null;}
