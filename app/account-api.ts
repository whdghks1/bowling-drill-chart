export type User={id:string;name:string;role:'member'|'editor'|'admin';active:boolean;created_at:string};
export const roleName={member:'일반 회원',editor:'편집자',admin:'관리자'};
export async function api(path:string,body?:unknown){const r=await fetch('/api/'+path,body===undefined?undefined:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await r.json();if(!r.ok)throw Error(data.error||'요청을 처리하지 못했습니다.');return data;}
