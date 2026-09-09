import { z } from 'zod';
export type Measure = number | null;
export function parseInches(raw: string): Measure {
 const s=raw.trim().replaceAll('−','-').replace(/[″"]/g,'').trim();
 if(!s)return null;
 const mixed=s.match(/^([+-]?)(?:(\d+)\s+)?(\d+)\/(\d+)$/);
 let n:number;
 if(mixed){const denominator=Number(mixed[4]);if(!denominator)throw Error('분모는 0일 수 없습니다.');n=(Number(mixed[2]||0)+Number(mixed[3])/denominator)*(mixed[1]==='-'?-1:1);}
 else if(/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s))n=Number(s);
 else throw Error('소수 또는 분수로 입력하세요. 예: 4.375, 4 3/8');
 if(!Number.isFinite(n)||Math.abs(n*1e6-Math.round(n*1e6))>.00001)throw Error('소수점 6자리 이내 또는 1/64 단위로 입력하세요.');
 return n;
}
export function formatInches(n:Measure):string {
 if(n===null||!Number.isFinite(n))return '—';
 if(Math.abs(n*64-Math.round(n*64))>1e-8)return String(n);
 const sign=n<0?'−':'';const ticks=Math.round(Math.abs(n)*64);const whole=Math.floor(ticks/64);let a=ticks%64,b=64;
 if(!a)return sign+whole;while(a%2===0){a/=2;b/=2;}return sign+(whole?whole+' ':'')+a+'/'+b;
}
const measurement=(min:number,max:number)=>z.number().finite().min(min).max(max).nullable();
export const holeSchema=z.object({diameter:measurement(.01,2),depth:measurement(.01,4),forward:measurement(-2,2),lateral:measurement(-2,2),insertStyle:z.string().max(120).default(''),insertSize:z.string().max(120).default(''),bevel:z.string().max(120).default('')});
export type Hole=z.infer<typeof holeSchema>;
export const specSchema=z.object({version:z.literal(2),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),driller:z.string().max(100),weight:measurement(1,20),serial:z.string().max(100),spanBasis:z.enum(['cut','finished','unknown']),pitchReference:z.string().max(200),papHorizontal:measurement(-10,10),papVertical:measurement(-10,10),layout:z.string().max(300),ovalShape:z.enum(['round','oval','unknown']),ovalLong:measurement(.01,2),ovalShort:measurement(.01,2),ovalAngle:measurement(0,180),ovalReference:z.string().max(200),depthReference:z.string().max(200),finish:z.string().max(200)}).superRefine((s,ctx)=>{if(s.ovalShape==='oval'&&s.ovalLong!==null&&s.ovalShort!==null&&s.ovalLong<s.ovalShort)ctx.addIssue({code:z.ZodIssueCode.custom,message:'엄지 타원의 장축은 단축 이상이어야 합니다.',path:['ovalLong']});});
export const chartSchema=z.object({id:z.string().uuid(),name:z.string().trim().min(1).max(80),ball:z.string().max(100),hand:z.enum(['right','left']),grip:z.enum(['finger','conventional','two']),middleSpan:measurement(.01,7),ringSpan:measurement(.01,7),bridge:measurement(.01,2),middle:holeSchema,ring:holeSchema,thumb:holeSchema,notes:z.string().max(3000),spec:specSchema});
export type Chart=z.infer<typeof chartSchema>&{updated?:string;shared?:boolean};
const newHole=():Hole=>({diameter:null,depth:null,forward:null,lateral:null,insertStyle:'',insertSize:'',bevel:''});
export const newSpec=():Chart['spec']=>({version:2,date:new Date().toLocaleDateString('sv-SE'),driller:'',weight:null,serial:'',spanBasis:'cut',pitchReference:'',papHorizontal:null,papVertical:null,layout:'',ovalShape:'round',ovalLong:null,ovalShort:null,ovalAngle:null,ovalReference:'그립 중심선 0° · 볼 표면을 바라보고 시계방향',depthReference:'볼 표면에서 홀 바닥까지, 드릴 축 방향 실측',finish:''});
export function emptyChart():Chart{return {shared:false,id:'',name:'',ball:'',hand:'right',grip:'finger',middleSpan:null,ringSpan:null,bridge:null,middle:newHole(),ring:newHole(),thumb:newHole(),notes:'',spec:newSpec()};}
export function normalizeChart(raw:Partial<Chart>):Chart{const base=emptyChart();return {...base,...raw,middle:{...newHole(),...raw.middle},ring:{...newHole(),...raw.ring},thumb:{...newHole(),...raw.thumb},spec:{...newSpec(),...(!raw.spec?{spanBasis:'unknown' as const,ovalShape:'unknown' as const,depthReference:''}:{}),...raw.spec}};}
export function missingSpecs(c:Chart):string[]{const missing:string[]=[];if(!c.name.trim())missing.push('이름');if(!c.ball.trim())missing.push('볼 이름');if(!c.spec.driller.trim())missing.push('작업자');if(!c.spec.pitchReference.trim())missing.push('피치 게이지 / 기준');if(!c.spec.depthReference.trim())missing.push('깊이 측정 기준');if(c.bridge===null)missing.push('브리지');if(c.grip!=='two'){if(c.middleSpan===null)missing.push('중지 스팬');if(c.ringSpan===null)missing.push('약지 스팬');if(c.spec.spanBasis==='unknown')missing.push('스팬 측정 기준');if(c.spec.ovalShape==='unknown')missing.push('엄지 형상');if(c.spec.ovalShape==='oval'){for(const k of ['ovalLong','ovalShort','ovalAngle'] as const)if(c.spec[k]===null)missing.push({ovalLong:'엄지 장축',ovalShort:'엄지 단축',ovalAngle:'엄지 타원 각도'}[k]);if(!c.spec.ovalReference.trim())missing.push('타원 각도 기준');}}for(const k of (c.grip==='two'?['middle','ring']:['middle','ring','thumb']) as ('middle'|'ring'|'thumb')[])for(const f of ['diameter','depth','forward','lateral'] as const)if(c[k][f]===null)missing.push(({middle:'중지',ring:'약지',thumb:'엄지'}[k])+' '+({diameter:'드릴경',depth:'깊이',forward:'전후 피치',lateral:'좌우 피치'}[f]));return missing;}
export function pitchLabel(n:Measure,axis:'forward'|'lateral'):string{if(n===null)return '미입력';if(n===0)return '0 · 중립';return `${axis==='forward'?(n>0?'F · 포워드':'R · 리버스'):(n>0?'오른쪽':'왼쪽')} ${formatInches(Math.abs(n))}″`;}
