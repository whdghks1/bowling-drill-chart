import {readCatalog} from '../../server/catalog-store.ts';
import {emptyCatalog} from '../../lib/ball-catalog.ts';
export default async(req:Request)=>{if(req.method!=='GET')return new Response(null,{status:405});try{const url=Netlify.env.get('DATABASE_URL')||Netlify.env.get('NETLIFY_DATABASE_URL');if(!url)throw Error('CONFIG');return Response.json({...await readCatalog(url),available:true},{headers:{'Cache-Control':'public, max-age=120'}});}catch{return Response.json({...emptyCatalog(),available:false,errors:['카탈로그 연결 실패 · 기본 목록 표시']},{headers:{'Cache-Control':'no-store'}});}};
