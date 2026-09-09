import { createHmac,randomUUID } from 'node:crypto';
import { chartSchema } from '../lib/drill-chart.ts';
import { z } from 'zod';
import { equals,type AuthEnv } from './auth.ts';
import { accountCookie,accountToken,readAccountToken,publicAccount,nameSchema,nameKey,passwordSchema,loginPasswordSchema,hashPassword,verifyPassword,DUMMY_HASH,requireSecret } from './accounts.ts';
import type { Store } from './store.ts';
import type { AccountStore } from './account-store.ts';
const schema=chartSchema.extend({shared:z.boolean().default(false)});
const credentials=z.object({name:nameSchema,password:passwordSchema}).strict();
const response=(data:unknown,status=200,extra:Record<string,string>={})=>Response.json(data,{status,headers:{'Cache-Control':'no-store, private','Vary':'Cookie',...extra}});
export function createHandler(options:{env:()=>AuthEnv;store:()=>Store;accounts:()=>AccountStore}){
 return async function handle(req:Request,context:{ip?:string}={}){
  const url=new URL(req.url),path=url.pathname.replace(/^\/\.netlify\/functions\/api/,'').replace(/^\/api/,'');
  if(!['GET','POST'].includes(req.method))return response({error:'지원하지 않는 요청입니다.'},405);
  if(req.method==='POST'&&(req.headers.get('origin')!==url.origin||!req.headers.get('content-type')?.startsWith('application/json')))return response({error:'허용되지 않는 요청입니다.'},403);
  const env=options.env(),secure=url.protocol==='https:';
  if(path==='/logout'&&req.method==='POST')return response({ok:true},200,{'Set-Cookie':accountCookie('',secure)});
  try {
   let raw='';if(req.method==='POST'){raw=await req.text();if(raw.length>(path==='/charts'?1800000:4096))return response({error:'요청이 너무 큽니다.'},413);}
   const token=readAccountToken(req.headers.get('cookie'),env);
   const found=token?await options.accounts().byId(token.id):null;
   const user=found?.active&&found.session_version===token?.v?found:null;
   const canEdit=user?.role==='admin'||user?.role==='editor';
   const session=(u:NonNullable<typeof user>)=>response({user:publicAccount(u),role:u.role},200,{'Set-Cookie':accountCookie(accountToken(u,env),secure)});
   async function limit(key:string){requireSecret(env);return options.store().attempt(createHmac('sha256',env.SESSION_SECRET!).update(key).digest('hex'));}
   const limited=()=>response({error:'시도가 많습니다. 15분 후 다시 시도해주세요.'},429,{'Retry-After':'900'});
   if(path==='/session'&&req.method==='GET')return response({user:user?publicAccount(user):null,role:user?.role??null,setupAvailable:await options.accounts().setupAvailable()});
   if(path==='/register'||path==='/login'||path==='/setup'){
    if(req.method!=='POST')return response({error:'지원하지 않는 요청입니다.'},405);
    requireSecret(env);
    if(!await limit(`account:${context.ip||'unknown'}:${path}`))return limited();
    const value=JSON.parse(raw);
    const parsed=(path==='/setup'?credentials.extend({setupPassword:z.string().min(1).max(512)}):path==='/login'?credentials.extend({password:loginPasswordSchema}):credentials).safeParse(value);
    if(!parsed.success)return response({error:parsed.error.issues[0]?.message||'이름과 비밀번호를 확인해주세요.'},400);
    const {name,password}=parsed.data,key=nameKey(name);
    if(path==='/login'){
     if(!await limit('name:'+key))return limited();
     const u=await options.accounts().byName(key);
     const correct=await verifyPassword(password,u?.password_hash||DUMMY_HASH);
     if(!correct||!u?.active)return response({error:'이름 또는 비밀번호가 올바르지 않거나 정지된 계정입니다.'},401);
     return session(u);
    }
    if(path==='/setup'){
     if((env.ADMIN_PASSWORD?.length??0)<12)throw Error('AUTH_CONFIG');
     if(!equals(value.setupPassword,env.ADMIN_PASSWORD!))return response({error:'기존 관리자 비밀번호가 올바르지 않습니다.'},401);
     if(!await options.accounts().setupAvailable())return response({error:'첫 관리자 등록이 이미 완료됐습니다.'},409);
    }
    const u=await options.accounts().create({id:randomUUID(),name,name_key:key,password_hash:await hashPassword(password)},path==='/setup');
    if(!u)return response({error:'이미 사용 중인 이름이거나 관리자 등록이 완료됐습니다.'},409);
    return session(u);
   }
   if(path==='/password'&&req.method==='POST'){
    if(!user)return response({error:'로그인이 필요합니다.'},401);
    if(!await limit('password:'+user.id))return limited();
    const p=z.object({currentPassword:loginPasswordSchema,newPassword:passwordSchema}).strict().safeParse(JSON.parse(raw));
    if(!p.success)return response({error:p.error.issues[0]?.message},400);
    if(!await verifyPassword(p.data.currentPassword,user.password_hash))return response({error:'현재 비밀번호가 올바르지 않습니다.'},401);
    const changed=await options.accounts().changePassword(user.id,user.session_version,await hashPassword(p.data.newPassword));
    if(!changed)return response({error:'다시 로그인해주세요.'},401);
    return session(changed);
   }
   if(path==='/users'){
    if(user?.role!=='admin')return response({error:'관리자만 회원을 관리할 수 있습니다.'},403);
    if(req.method==='GET')return response((await options.accounts().list()).map(publicAccount));
    const p=z.object({id:z.string().uuid(),role:z.enum(['member','editor','admin']),active:z.boolean()}).strict().safeParse(JSON.parse(raw));
    if(!p.success)return response({error:'권한 설정을 확인해주세요.'},400);
    if(p.data.id===user.id)return response({error:'본인의 권한이나 계정 상태는 변경할 수 없습니다.'},409);
    const changed=await options.accounts().manage(user,p.data.id,p.data.role,p.data.active);
    if(!changed)return response({error:'권한이 변경됐거나 회원을 찾을 수 없습니다. 새로고침해주세요.'},409);
    return response(publicAccount(changed));
   }
   if(path==='/charts'){
    if(req.method==='GET')return response(await options.store().list(canEdit));
    if(!canEdit)return response({error:'관리자 또는 편집자만 수정할 수 있습니다.'},403);
    const parsed=schema.safeParse(JSON.parse(raw));if(!parsed.success)return response({error:parsed.error.issues[0]?.message||'작업 수치를 확인해주세요.'},400);
    return response(await options.store().save(parsed.data));
   }
   return response({error:'요청한 기능을 찾을 수 없습니다.'},404);
  }catch(e){
   if(e instanceof SyntaxError)return response({error:'요청 형식이 올바르지 않습니다.'},400);
   if(e instanceof Error&&e.message==='AUTH_CONFIG')return response({error:'관리자 로그인 설정이 필요합니다.',code:'AUTH_CONFIG'},503);
   return response({error:'DB 연결 또는 테이블 설정을 확인해주세요.',code:'DATABASE_UNAVAILABLE'},503);
  }
 };
}
