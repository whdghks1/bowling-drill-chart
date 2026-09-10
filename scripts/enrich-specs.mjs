import fs from 'node:fs';
import {parseProduct} from '../server/catalog-sync.ts';
const [input,output]=process.argv.slice(2);
if(!input||!output)throw Error('Usage: enrich-specs.mjs catalog.json output.json');
const catalog=JSON.parse(fs.readFileSync(input,'utf8'));
const result=fs.existsSync(output)?JSON.parse(fs.readFileSync(output,'utf8')):{};
let index=0,failed=0;
await Promise.all(Array.from({length:4},async()=>{while(index<catalog.products.length){const p=catalog.products[index++];if(result[p.id]&&!process.argv.includes('--refresh'))continue;try{const r=await fetch(p.source,{signal:AbortSignal.timeout(25000),headers:{'User-Agent':'BowlingFitCatalog/1.0 (+https://bowling-drill-chart.netlify.app/test)'}});if(!r.ok)throw Error();const html=await r.text();if(html.length>3000000)throw Error();const parsed=parseProduct(html,p,new Date().toISOString());if(Object.values(parsed.specs).some(s=>s.rg!==null||s.diff!==null)){result[p.id]={specs:parsed.specs,checkedAt:parsed.checkedAt,source:p.source};}else failed++;}catch{failed++;}if(index%40===0){fs.writeFileSync(output,JSON.stringify(result));console.log(`${index}/${catalog.products.length}, ${Object.keys(result).length} collected`);}}}));
fs.writeFileSync(output,JSON.stringify(result));console.log({collected:Object.keys(result).length,failed});
