import { createHash, timingSafeEqual } from 'node:crypto';
export type AuthEnv={ADMIN_PASSWORD?:string;SESSION_SECRET?:string};
export function equals(a:string,b:string){return timingSafeEqual(createHash('sha256').update(a).digest(),createHash('sha256').update(b).digest());}
