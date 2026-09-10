import type {Config} from '@netlify/functions';
import {readCatalog,saveCatalog} from '../../server/catalog-store.ts';
import {synchronize} from '../../server/catalog-sync.ts';
export default async()=>{const url=Netlify.env.get('DATABASE_URL')||Netlify.env.get('NETLIFY_DATABASE_URL');if(!url)throw Error('DATABASE_CONFIG');const result=await synchronize(await readCatalog(url));await saveCatalog(url,result);console.log(JSON.stringify({products:result.products.length,errors:result.errors.length,lastSuccess:result.lastSuccess}));};
export const config:Config={schedule:'0 21 * * *'};
