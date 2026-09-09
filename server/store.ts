import { neon } from '@neondatabase/serverless';
import type { Chart } from '../lib/drill-chart.ts';
export type StoredChart=Chart&{shared:boolean};
export interface Store{list: (admin:boolean)=>Promise<StoredChart[]>;save:(chart:StoredChart)=>Promise<StoredChart>;attempt:(key:string)=>Promise<boolean>}
export function postgresStore(url?:string):Store{
 if(!url)throw Error('DATABASE_CONFIG');const sql=neon(url);
 return {
  async list(admin){const rows=admin?await sql`SELECT data, shared, updated_at FROM bowling_fit_charts ORDER BY updated_at DESC`:await sql`SELECT data, shared, updated_at FROM bowling_fit_charts WHERE shared = true ORDER BY updated_at DESC`;return rows.map(row=>({...row.data,shared:row.shared,updated:new Date(row.updated_at).toISOString()}));},
  async save(chart){const {updated:_updated,...data}=chart;const rows=await sql`INSERT INTO bowling_fit_charts(id,data,shared) VALUES(${chart.id},${JSON.stringify(data)}::jsonb,${chart.shared}) ON CONFLICT(id) DO UPDATE SET data=EXCLUDED.data, shared=EXCLUDED.shared, updated_at=now() RETURNING data,shared,updated_at`;const row=rows[0];return {...row.data,shared:row.shared,updated:new Date(row.updated_at).toISOString()};},
  async attempt(key){const rows=await sql`INSERT INTO bowling_fit_auth_attempts(key,attempts,window_start) VALUES(${key},1,now()) ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN bowling_fit_auth_attempts.window_start < now()-interval '15 minutes' THEN 1 ELSE bowling_fit_auth_attempts.attempts+1 END,window_start=CASE WHEN bowling_fit_auth_attempts.window_start < now()-interval '15 minutes' THEN now() ELSE bowling_fit_auth_attempts.window_start END RETURNING attempts`;return rows[0].attempts<=10;}
 };
}
