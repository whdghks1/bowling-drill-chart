import type { Context } from '@netlify/functions';
import { createHandler } from '../../server/handler.ts';
import { postgresStore } from '../../server/store.ts';
export default async (req:Request,context:Context) => {
  const env={ADMIN_PASSWORD:Netlify.env.get('ADMIN_PASSWORD'),CLUB_PASSWORD:Netlify.env.get('CLUB_PASSWORD'),SESSION_SECRET:Netlify.env.get('SESSION_SECRET')};
  const handle=createHandler({env:()=>env,store:()=>postgresStore(Netlify.env.get('DATABASE_URL')||Netlify.env.get('NETLIFY_DATABASE_URL'))});
  return handle(req,context);
};
