import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHmac } from 'node:crypto';
import { z } from 'zod';
import type { AuthEnv } from './auth.ts';
export type MemberRole='member'|'editor'|'admin';
export type Account={id:string;name:string;name_key:string;password_hash:string;role:MemberRole;active:boolean;session_version:number;created_at:string};
export type PublicAccount=Pick<Account,'id'|'name'|'role'|'active'|'created_at'>;
export const publicAccount=(u:Account):PublicAccount=>({id:u.id,name:u.name,role:u.role,active:u.active,created_at:u.created_at});
export const nameSchema=z.string().trim().min(2,'이름은 2자 이상 입력해주세요.').max(40).regex(/^[\p{L}\p{N} _.-]+$/u,'이름에는 문자, 숫자, 공백, 밑줄, 점, 하이픈만 사용할 수 있어요.').transform(s=>s.normalize('NFKC').replace(/\s+/g,' '));
export const nameKey=(s:string)=>s.normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();
export const passwordSchema=z.string().min(8,'비밀번호는 8자 이상 입력해주세요.').max(128,'비밀번호는 128자 이하로 입력해주세요.');
const derive=(password:string,salt:string)=>new Promise<Buffer>((resolve,reject)=>scryptCallback(password,salt,32,{N:32768,r:8,p:1,maxmem:64*1024*1024},(error,key)=>error?reject(error):resolve(key)));
export async function hashPassword(password:string){const salt=randomBytes(16).toString('hex');const hash=await derive(password,salt);return `scrypt$${salt}$${hash.toString('hex')}`;}
export async function verifyPassword(password:string,encoded:string){try{const [scheme,salt,hex]=encoded.split('$');if(scheme!=='scrypt'||!salt||!/^[a-f0-9]{64}$/.test(hex))return false;const hash=await derive(password,salt);return timingSafeEqual(hash,Buffer.from(hex,'hex'));}catch{return false;}}
// A valid fixed dummy hash ensures unknown names also incur the password KDF cost.
export const DUMMY_HASH='scrypt$00000000000000000000000000000000$'+'0'.repeat(64);
export const ACCOUNT_COOKIE='bowling_fit_account';
export function requireSecret(env:AuthEnv){if((env.SESSION_SECRET?.length??0)<32)throw Error('AUTH_CONFIG');}
function sign(s:string,env:AuthEnv){requireSecret(env);return createHmac('sha256',env.SESSION_SECRET!).update(s).digest('base64url');}
export function accountToken(user:Account,env:AuthEnv,now=Date.now()){const text=Buffer.from(JSON.stringify({id:user.id,v:user.session_version,exp:now+43200000})).toString('base64url');return text+'.'+sign(text,env);}
export function readAccountToken(cookie:string|null,env:AuthEnv,now=Date.now()):{id:string;v:number}|null{try{const token=cookie?.split(';').map(s=>s.trim()).find(s=>s.startsWith(ACCOUNT_COOKIE+'='))?.slice(ACCOUNT_COOKIE.length+1);if(!token||token.length>2048)return null;const [data,sig,...extra]=token.split('.');if(extra.length||!data||!sig)return null;const expected=Buffer.from(sign(data,env)),actual=Buffer.from(sig);if(expected.length!==actual.length||!timingSafeEqual(expected,actual))return null;const p=JSON.parse(Buffer.from(data,'base64url').toString('utf8'));if(!z.string().uuid().safeParse(p.id).success||!Number.isInteger(p.v)||!Number.isFinite(p.exp)||p.exp<=now||p.exp>now+43200000)return null;return {id:p.id,v:p.v};}catch{return null;}}
export function accountCookie(token:string,secure:boolean){return `${ACCOUNT_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${token?43200:0}${secure?'; Secure':''}`;}
