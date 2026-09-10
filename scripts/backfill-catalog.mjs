// Bounded, resumable bootstrap. No database credentials or writes: review the
// generated JSON, then import through the existing catalog store.
import fs from 'node:fs';
import {brands,emptyCatalog,coreModels} from '../lib/ball-catalog.ts';
import {parseListing,parseProduct,parseCoreListing} from '../server/catalog-sync.ts';
const [input,output]=process.argv.slice(2);
if(!input||!output)throw Error('Usage: node --experimental-strip-types scripts/backfill-catalog.mjs input.json output.json');
const previous=JSON.parse(fs.readFileSync(fs.existsSync(output)?output:input,'utf8'));
const products=new Map(previous.products.map(p=>[p.id,p]));
const errors=[],now=new Date().toISOString();
async function read(url){const r=await fetch(url,{signal:AbortSignal.timeout(25000),headers:{'User-Agent':'BowlingFitCatalog/1.0 (+https://bowling-drill-chart.netlify.app/test)'}});if(!r.ok)throw Error(`HTTP ${r.status}`);const text=await r.text();if(text.length>3000000)throw Error('Response too large');return text;}
const discovered=new Map();
for(const [brand] of brands){for(let page=0;page<2;page++){try{const html=await read(`https://www.bowwwl.com/bowling-ball-database/${brand}${page?'?page='+page:''}`);for(const p of parseListing(html,brand))discovered.set(p.id,p);}catch{errors.push(`${brand} page ${page}: list failed`);}}console.log(`Discovered ${brand}: ${discovered.size} total`);}
for(const {brand,key} of Object.values(coreModels)){try{const html=await read(`https://www.bowwwl.com/bowling-ball-database/${brand}/cores/${key}`);for(const p of parseCoreListing(html,brand))discovered.set(p.id,p);}catch{errors.push(`${brand}/${key}: core listing failed`);}}
// Follow source links already present in seed records, too.
for(const p of previous.products)if(!discovered.has(p.id)&&!p.checkedAt)discovered.set(p.id,p);
const jobs=[...discovered.values()].filter(p=>!products.get(p.id)?.checkedAt);let index=0,success=0;
function checkpoint(){fs.writeFileSync(output,JSON.stringify({...emptyCatalog(),...previous,products:[...products.values()],errors,lastAttempt:now,lastSuccess:success?now:previous.lastSuccess}));}
await Promise.all(Array.from({length:4},async()=>{while(index<jobs.length){const p=jobs[index++];try{products.set(p.id,parseProduct(await read(p.source),p,now));success++;}catch{errors.push(`${p.id}: detail failed`);}if(index%20===0){checkpoint();console.log(`Read ${index}/${jobs.length}; ${products.size} products`);}}}));
checkpoint();console.log(JSON.stringify({products:products.size,added:success,errors}));
