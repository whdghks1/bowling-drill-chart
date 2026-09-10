import {neon} from '@neondatabase/serverless';
import {emptyCatalog,type Catalog} from '../lib/ball-catalog.ts';
export async function readCatalog(url:string):Promise<Catalog>{const rows=await neon(url)`SELECT payload FROM bowling_fit_catalog WHERE key='products'`;return rows[0]?.payload??emptyCatalog();}
export async function saveCatalog(url:string,catalog:Catalog){await neon(url)`INSERT INTO bowling_fit_catalog(key,payload) VALUES('products',${JSON.stringify(catalog)}::jsonb) ON CONFLICT(key) DO UPDATE SET payload=EXCLUDED.payload,updated_at=now()`;}
