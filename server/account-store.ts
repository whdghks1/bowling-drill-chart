import { neon } from '@neondatabase/serverless';
import type { Account, MemberRole } from './accounts.ts';
export interface AccountStore {
 byId(id:string):Promise<Account|null>;
 byName(key:string):Promise<Account|null>;
 list():Promise<Account[]>;
 setupAvailable():Promise<boolean>;
 create(user:{id:string;name:string;name_key:string;password_hash:string},bootstrap?:boolean):Promise<Account|null>;
 changePassword(id:string,version:number,hash:string):Promise<Account|null>;
 manage(actor:Account,id:string,role:MemberRole,active:boolean):Promise<Account|null>;
}
export function postgresAccounts(url?:string):AccountStore{
 if(!url)throw Error('DATABASE_CONFIG');const sql=neon(url);
 const account=(rows:Record<string,any>[])=>rows[0] as Account|undefined ?? null;
 return {
  async byId(id){return account(await sql`SELECT * FROM bowling_fit_users WHERE id=${id}`);},
  async byName(key){return account(await sql`SELECT * FROM bowling_fit_users WHERE name_key=${key}`);},
  async list(){return await sql`SELECT id,name,role,active,created_at FROM bowling_fit_users ORDER BY created_at DESC` as Account[];},
  async setupAvailable(){const rows=await sql`SELECT NOT bootstrapped AS available FROM bowling_fit_account_guard WHERE id=1`;return rows[0]?.available===true;},
  async create(u,bootstrap=false){
   if(!bootstrap)return account(await sql`INSERT INTO bowling_fit_users(id,name,name_key,password_hash) VALUES(${u.id},${u.name},${u.name_key},${u.password_hash}) ON CONFLICT(name_key) DO NOTHING RETURNING *`);
   const rows=await sql.transaction([
    sql`UPDATE bowling_fit_account_guard SET revision=revision+1 WHERE id=1`,
    sql`INSERT INTO bowling_fit_users(id,name,name_key,password_hash,role) SELECT ${u.id},${u.name},${u.name_key},${u.password_hash},'admin' WHERE EXISTS(SELECT 1 FROM bowling_fit_account_guard WHERE id=1 AND NOT bootstrapped) ON CONFLICT(name_key) DO NOTHING RETURNING *`,
    sql`UPDATE bowling_fit_account_guard SET bootstrapped=true WHERE id=1 AND EXISTS(SELECT 1 FROM bowling_fit_users WHERE role='admin')`
   ]);return account(rows[1]);
  },
  async changePassword(id,version,hash){return account(await sql`UPDATE bowling_fit_users SET password_hash=${hash},session_version=session_version+1 WHERE id=${id} AND session_version=${version} AND active RETURNING *`);},
  async manage(actor,id,role,active){
   // Serialize changes; recheck the acting administrator after the lock is acquired.
   // Self demotion/suspension is never allowed, keeping at least one active admin.
   const rows=await sql.transaction([
    sql`UPDATE bowling_fit_account_guard SET revision=revision+1 WHERE id=1`,
    sql`UPDATE bowling_fit_users SET role=${role},active=${active},session_version=session_version+1 WHERE id=${id} AND id<>${actor.id} AND EXISTS(SELECT 1 FROM bowling_fit_users actor WHERE actor.id=${actor.id} AND actor.role='admin' AND actor.active AND actor.session_version=${actor.session_version}) RETURNING *`
   ]);return account(rows[1]);
  }
 };
}
