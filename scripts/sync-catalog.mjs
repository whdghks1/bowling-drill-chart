import {synchronize} from '../server/catalog-sync.ts';
import {emptyCatalog} from '../lib/ball-catalog.ts';
import {readCatalog,saveCatalog} from '../server/catalog-store.ts';
const url=process.env.DATABASE_URL||process.env.NETLIFY_DATABASE_URL;
if(!url)throw Error('DATABASE_URL is required');
const result=await synchronize(await readCatalog(url).catch(()=>emptyCatalog()));
await saveCatalog(url,result);
console.log(JSON.stringify({products:result.products.length,lastSuccess:result.lastSuccess,errors:result.errors}));
