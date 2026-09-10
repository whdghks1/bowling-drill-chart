import {brands,emptyCatalog,type BallProduct,type Catalog} from '../lib/ball-catalog.ts';
const origin='https://www.bowwwl.com';
const clean=(s:string)=>s.replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&#039;|&apos;/g,"'").replace(/&quot;/g,'"').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
export function parseListing(html:string,brand:string){const found=new Map<string,{id:string;name:string;source:string}>();for(const m of html.matchAll(/<a\b[^>]*href="([^"?#]+)"[^>]*class="[^"]*card-link[^"]*"[^>]*>([\s\S]*?)<\/a>/g)){const prefix=`/bowling-ball-database/${brand}/`;if(m[1].startsWith(prefix)&&!m[1].slice(prefix.length).includes('/')){const id=`${brand}/${m[1].slice(prefix.length)}`;found.set(id,{id,name:clean(m[2]),source:origin+m[1]});}}return [...found.values()];}
export function parseCoreListing(html:string,brand:string){const found=new Map<string,{id:string;name:string;source:string}>();for(const m of html.matchAll(/<a\b[^>]*href="([^"?#]+)"[^>]*hreflang="en"[^>]*>([^<]+)<\/a>/g)){const prefix=`/bowling-ball-database/${brand}/`,name=clean(m[2]);if(name&&m[1].startsWith(prefix)&&!m[1].slice(prefix.length).includes('/')){const id=`${brand}/${m[1].slice(prefix.length)}`;found.set(id,{id,name,source:origin+m[1]});}}return [...found.values()];}
export function parseProduct(html:string,input:{id:string;name:string;source:string},now:string):BallProduct{
 const brand=input.id.split('/')[0];const core=html.match(/<a[^>]+href="\/bowling-ball-database\/[^/]+\/cores\/([^"/]+)"[^>]*>([\s\S]*?)<\/a>/);
 const date=html.match(/field--name-field-release-date[\s\S]*?<time[^>]*datetime="(\d{4}-\d{2}-\d{2})/);
 const weights=[...new Set([...html.matchAll(/<h6[^>]*>\s*(\d+) pounds\s*<\/h6>/g)].map(m=>Number(m[1])))];
 if(!core||!weights.length)throw Error('제품 구조를 확인할 수 없습니다');
 const specs:NonNullable<BallProduct['specs']>={};
 const blocks=[...html.matchAll(/<h6[^>]*>\s*(\d+) pounds\s*<\/h6>([\s\S]*?)(?=<h6|<\/section>|$)/g)];
 for(const b of blocks){const value=(field:string,min:number,max:number)=>{const m=b[2].match(new RegExp('field--name-field-'+field+'\\s[\\s\\S]*?field__item[^>]*>\\s*([0-9.]+)'));const n=m?Number(m[1]):NaN;return Number.isFinite(n)&&n>=min&&n<=max?n:null;};specs[b[1]]={rg:value('rg',2,3),diff:value('differential',0,.1),intermediate:value('mass-bias-differential',0,.1)};}
 return {...input,brand,core:clean(core[2]).replace(/ Core$/,''),coreKey:core[1],weights,releaseDate:date?.[1]??null,checkedAt:now,specs};
}
async function read(url:string,signal:AbortSignal){const response=await fetch(url,{signal,headers:{'User-Agent':'BowlingFitCatalog/1.0 (+https://bowling-drill-chart.netlify.app/test)'}});if(!response.ok)throw Error(`HTTP ${response.status}`);const text=await response.text();if(text.length>3000000)throw Error('응답 크기 초과');return text;}
export function archivePage(html:string,cursor:number){const pages=[...html.matchAll(/href="\?page=(\d+)"/g)].map(m=>Number(m[1]));const last=Math.max(0,...pages);return last?1+Math.floor(cursor/12)%last:null;}
export async function synchronize(previous:Catalog=emptyCatalog()):Promise<Catalog>{
 const now=new Date().toISOString(),deadline=AbortSignal.timeout(22000),products=new Map(previous.products.map(p=>[p.id,p])),errors:string[]=[];
 const queues:ReturnType<typeof parseListing>[]=[];
 await Promise.all(brands.map(async([brand])=>{try{const url=`${origin}/bowling-ball-database/${brand}`,html=await read(url,deadline),list=parseListing(html,brand);if(!list.length)throw Error('목록 형식 변경');queues.push(list);const page=archivePage(html,previous.cursor);if(page!==null){try{queues.push(parseListing(await read(`${url}?page=${page}`,deadline),brand));}catch{errors.push(`${brand}: 이전 제품 목록 갱신 실패`);}}}catch{errors.push(`${brand}: 목록 갱신 실패`);}}));
 // Two latest + two archive products per brand; each archive page gets 12 daily
 // passes so a full 24-product page can be backfilled before moving onward.
 for(const queue of queues)queue.sort((a,b)=>(products.get(a.id)?.checkedAt??'').localeCompare(products.get(b.id)?.checkedAt??''));
 const jobs:ReturnType<typeof parseListing>=[],seen=new Set<string>();for(let round=0;round<2;round++)for(const queue of queues){const p=queue[round];if(p&&!seen.has(p.id)){jobs.push(p);seen.add(p.id);}}
 let successes=0,index=0;
 await Promise.all(Array.from({length:5},async()=>{while(index<jobs.length&&!deadline.aborted){const p=jobs[index++];try{const item=parseProduct(await read(p.source,deadline),p,now);products.set(p.id,item);successes++;}catch{errors.push(`${p.name}: 상세 갱신 실패`);}}}));
 if(deadline.aborted)errors.push('제한 시간 내 일부 제품만 확인했습니다');
 return {products:[...products.values()],lastAttempt:now,lastSuccess:successes?now:previous.lastSuccess,errors,cursor:previous.cursor+1};
}
