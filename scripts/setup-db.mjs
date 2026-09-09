import { neon } from '@neondatabase/serverless';
import { readFile } from 'node:fs/promises';
const url=process.env.DATABASE_URL||process.env.NETLIFY_DATABASE_URL;
if(!url){console.error('Set DATABASE_URL or NETLIFY_DATABASE_URL before setup.');process.exit(1);}
const sql=neon(url);const source=await readFile(new URL('../sql/001-bowling-fit.sql',import.meta.url),'utf8');
try{const statements=source.replace(/^--.*$/gm,'').split(';').map(s=>s.trim()).filter(Boolean);await sql.transaction(statements.map(s=>sql.query(s)));console.log('Bowling Fit tables are ready. Existing tables were preserved.');}catch{console.error('Database setup failed. Check connection, SSL, and database permissions. Connection credentials are not logged.');process.exit(1);}
