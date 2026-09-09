import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
export type Role='admin';
export type AuthEnv={ADMIN_PASSWORD?:string;SESSION_SECRET?:string};
export const COOKIE='bowling_fit_session';
export function assertConfigured(env:AuthEnv){if((env.ADMIN_PASSWORD?.length??0)<12||(env.SESSION_SECRET?.length??0)<32)throw Error('AUTH_CONFIG');}
export function equals(a:string,b:string){return timingSafeEqual(createHash('sha256').update(a).digest(),createHash('sha256').update(b).digest());}
export const passwordFor=(role:Role,env:AuthEnv)=>env.ADMIN_PASSWORD!;
function sign(text:string,env:AuthEnv){return createHmac('sha256',env.SESSION_SECRET!).update(text).digest('base64url');}
function version(role:Role,env:AuthEnv){return sign(role+':'+passwordFor(role,env),env);}
export function makeSession(role:Role,env:AuthEnv,now=Date.now()){assertConfigured(env);const data=Buffer.from(JSON.stringify({role,exp:now+12*60*60*1000,v:version(role,env)})).toString('base64url');return data+'.'+sign(data,env);}
export function readSession(cookie:string|null,env:AuthEnv,now=Date.now()):Role|null{try{assertConfigured(env);const token=cookie?.split(';').map(s=>s.trim()).find(s=>s.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);if(!token||token.length>2048)return null;const [data,sig,...extra]=token.split('.');if(!data||!sig||extra.length||!equals(sign(data,env),sig))return null;const payload=JSON.parse(Buffer.from(data,'base64url').toString('utf8'));if(!['admin'].includes(payload.role)||!Number.isFinite(payload.exp)||payload.exp<=now||payload.exp>now+12*60*60*1000||payload.v!==version(payload.role,env))return null;return payload.role;}catch{return null;}}
export function sessionCookie(token:string,secure:boolean){return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${token?43200:0}${secure?'; Secure':''}`;}
