import type { Context } from '@netlify/functions';
import { createHandler } from '../../server/handler.ts';
import { postgresAccounts } from '../../server/account-store.ts';
import { postgresStore } from '../../server/store.ts';
export default async (req:Request,context:Context) => {
  const env={ADMIN_PASSWORD:Netlify.env.get('ADMIN_PASSWORD'),SESSION_SECRET:Netlify.env.get('SESSION_SECRET')};
  const handle=createHandler({env:()=>env,accounts:()=>postgresAccounts(Netlify.env.get('DATABASE_URL')||Netlify.env.get('NETLIFY_DATABASE_URL')),store:()=>postgresStore(Netlify.env.get('DATABASE_URL')||Netlify.env.get('NETLIFY_DATABASE_URL'))});
  return handle(req,context);
};
