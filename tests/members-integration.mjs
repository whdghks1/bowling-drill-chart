// Opt-in integration test. Run only against an isolated Neon validation branch.
import assert from 'node:assert/strict';
import {randomUUID,randomBytes} from 'node:crypto';
import {postgresAccounts} from '../server/account-store.ts';
import {postgresStore} from '../server/store.ts';
import {createHandler} from '../server/handler.ts';
import {emptyChart} from '../lib/drill-chart.ts';
const url=process.env.MEMBERS_TEST_DATABASE_URL;
if(!url||process.env.MEMBERS_TEST_BRANCH!=='br-icy-tooth-a4lh5iua')throw Error('An isolated validation branch must be explicitly selected.');
const accounts=postgresAccounts(url),store=postgresStore(url);
const env={ADMIN_PASSWORD:randomBytes(20).toString('hex'),SESSION_SECRET:randomBytes(32).toString('hex')};
const h=createHandler({env:()=>env,accounts:()=>accounts,store:()=>store});
const password=randomBytes(16).toString('hex'),prefix='QA-'+randomBytes(4).toString('hex');
const request=(path,body,cookie)=>new Request('https://integration.example/api/'+path,{method:body===undefined?'GET':'POST',headers:{origin:'https://integration.example','content-type':'application/json',...(cookie?{cookie}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
const call=(path,body,cookie)=>h(request(path,body,cookie),{ip:'192.0.2.'+prefix});
const cookie=r=>r.headers.get('set-cookie')?.split(';')[0];
try{
 assert.equal(await accounts.setupAvailable(),true);
 const results=await Promise.all([0,1].map(i=>call('setup',{name:prefix+'admin'+i,password,setupPassword:env.ADMIN_PASSWORD})));
 assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
 const adminResult=results.find(r=>r.status===200),adminCookie=cookie(adminResult),admin=(await adminResult.json()).user;
 assert.equal(await accounts.setupAvailable(),false);
 const signup=await call('register',{name:prefix+'member',password});assert.equal(signup.status,200);
 const memberCookie=cookie(signup),member=(await signup.json()).user;
 const chart={...emptyChart(),id:randomUUID(),name:prefix+'볼러',shared:true};
 assert.equal((await call('charts',chart,memberCookie)).status,403);
 assert.equal((await call('users',{id:member.id,role:'editor',active:true},adminCookie)).status,200);
 assert.equal((await call('charts',chart,memberCookie)).status,403);
 const editorLogin=await call('login',{name:member.name,password});assert.equal(editorLogin.status,200);const editorCookie=cookie(editorLogin);
 assert.equal((await call('charts',chart,editorCookie)).status,200);
 assert.ok((await (await call('charts')).json()).some(c=>c.id===chart.id));
 assert.equal((await call('users',undefined,editorCookie)).status,403);
 const changed=await call('password',{currentPassword:password,newPassword:password+'new'},editorCookie);assert.equal(changed.status,200);
 assert.equal((await (await call('session',undefined,editorCookie)).json()).user,null);
 assert.equal((await call('users',{id:member.id,role:'admin',active:true},adminCookie)).status,200);
 const second=await accounts.byId(member.id),first=await accounts.byId(admin.id);
 // Two admins demote one another concurrently: the guard lock + actor recheck allows only one change.
 const mutations=await Promise.all([accounts.manage(first,second.id,'member',true),accounts.manage(second,first.id,'member',true)]);
 assert.equal(mutations.filter(Boolean).length,1);
 assert.equal((await accounts.list()).filter(u=>u.active&&u.role==='admin').length,1);
 const remaining=(await accounts.list()).find(u=>u.active&&u.role==='admin');
 const full=await accounts.byId(remaining.id);assert.equal(await accounts.manage(full,full.id,'member',false),null);
 const other=(await accounts.list()).find(u=>u.id!==remaining.id);await accounts.manage(full,other.id,'member',false);
 assert.equal((await accounts.byId(other.id)).active,false);
 const hashed=await accounts.byName(member.name.toLowerCase());assert.ok(hashed.password_hash.startsWith('scrypt$'));assert.notEqual(hashed.password_hash,password);
 console.log('PASS: real Neon signup, atomic bootstrap, role changes, chart save/read, session revocation, password change, concurrent admin protection and suspension.');
}catch(error){console.error('Integration verification failed:',error instanceof assert.AssertionError?error.message:'database or request error');process.exitCode=1;}
