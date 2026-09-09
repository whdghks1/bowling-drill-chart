import { createHmac } from 'node:crypto';
import { chartSchema } from '../lib/drill-chart.ts';
import { z } from 'zod';
import { assertConfigured,equals,makeSession,passwordFor,readSession,sessionCookie,type AuthEnv } from './auth.ts';
import type { Store } from './store.ts';
const schema=chartSchema.extend({shared:z.boolean().default(false)});
const response=(data:unknown,status=200,extra:Record<string,string>={})=>Response.json(data,{status,headers:{'Cache-Control':'no-store, private','Vary':'Cookie',...extra}});
export function createHandler(options:{env:()=>AuthEnv;store:()=>Store}){
 return async function handle(req:Request,context:{ip?:string}={}){
  const url=new URL(req.url);const path=url.pathname.replace(/^\/\.netlify\/functions\/api/,'').replace(/^\/api/,'');
  if(!['GET','POST'].includes(req.method))return response({error:'지원하지 않는 요청입니다.'},405);
  if(req.method==='POST'&&(req.headers.get('origin')!==url.origin||!req.headers.get('content-type')?.startsWith('application/json')))return response({error:'허용되지 않는 요청입니다.'},403);
  const env=options.env();try{assertConfigured(env);}catch{return response({error:'관리자가 Netlify 환경변수 설정을 완료해야 합니다.',code:'AUTH_CONFIG'},503);}
  const secure=url.protocol==='https:';const role=readSession(req.headers.get('cookie'),env);
  if(path==='/session'&&req.method==='GET')return response({role});
  if(path==='/logout'&&req.method==='POST')return response({ok:true},200,{'Set-Cookie':sessionCookie('',secure)});
  try{
   if(path==='/login'&&req.method==='POST'){
    const raw=await req.text();if(raw.length>4096)return response({error:'요청이 너무 큽니다.'},413);
    const parsed=z.object({role:z.enum(['admin','club']),password:z.string().min(1).max(512)}).safeParse(JSON.parse(raw));if(!parsed.success)return response({error:'로그인 정보를 확인해주세요.'},400);
    const {role:requested,password}=parsed.data;const key=createHmac('sha256',env.SESSION_SECRET!).update((context.ip||'unknown')+':'+requested).digest('hex');
    if(!await options.store().attempt(key))return response({error:'로그인 시도가 많습니다. 15분 후 다시 시도해주세요.'},429,{'Retry-After':'900'});
    if(!equals(password,passwordFor(requested,env)))return response({error:'비밀번호가 올바르지 않습니다.'},401);
    return response({role:requested},200,{'Set-Cookie':sessionCookie(makeSession(requested,env),secure)});
   }
   if(path==='/charts'){
    if(!role)return response({error:'로그인이 필요합니다.'},401);
    if(req.method==='GET')return response(await options.store().list(role==='admin'));
    if(role!=='admin')return response({error:'관리자만 수정할 수 있습니다.'},403);
    const raw=await req.text();if(raw.length>30000)return response({error:'작업표가 너무 큽니다.'},413);
    const parsed=schema.safeParse(JSON.parse(raw));if(!parsed.success)return response({error:parsed.error.issues[0]?.message||'작업 수치를 확인해주세요.'},400);
    return response(await options.store().save(parsed.data));
   }
   return response({error:'요청한 기능을 찾을 수 없습니다.'},404);
  }catch(e){if(e instanceof SyntaxError)return response({error:'요청 형식이 올바르지 않습니다.'},400);return response({error:'DB 연결 또는 테이블 설정을 확인해주세요.',code:'DATABASE_UNAVAILABLE'},503);}
 };
}
