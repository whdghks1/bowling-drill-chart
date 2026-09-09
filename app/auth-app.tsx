import { useEffect, useState } from 'react';
import { CircleDot, LockKeyhole } from 'lucide-react';
import { Tabs,TabsList,TabsTrigger } from '@/components/ui/tabs';
import Home from './page';
import ClubView from './club-view';
type Role='admin'|'club';
export default function AuthApp(){const [role,setRole]=useState<Role|null>(null);const [ready,setReady]=useState(false);const [mode,setMode]=useState<Role>('club');const [password,setPassword]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 useEffect(()=>{fetch('/api/session').then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error);setRole(d.role);}).catch(e=>setError(e.message||'연결 상태를 확인해주세요.')).finally(()=>setReady(true));},[]);
 async function login(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');try{const r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({role:mode,password})});const d=await r.json();if(!r.ok)throw Error(d.error);setRole(d.role);setPassword('');}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 async function logout(){try{const r=await fetch('/api/logout',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});if(!r.ok)throw Error();setRole(null);setPassword('');setError('');}catch{window.alert('로그아웃하지 못했습니다. 다시 시도해주세요.');}}
 if(!ready)return <div className="login-page"><p>접속 상태를 확인하는 중…</p></div>;
 if(role==='admin')return <Home onLogout={logout}/>;
 if(role==='club')return <ClubView onLogout={logout}/>;
 return <main className="login-page"><section className="login-card"><div className="login-logo"><CircleDot size={31}/><span>FIT STUDIO</span></div><p className="eyebrow">BOWLING CLUB</p><h1>우리 클럽 지공차트</h1><p className="login-intro">내 볼의 치수와 지공 기록을 확인하세요.</p><Tabs value={mode} onValueChange={v=>{setMode(v as Role);setError('');setPassword('');}}><TabsList className="login-tabs"><TabsTrigger value="club">클럽원 조회</TabsTrigger><TabsTrigger value="admin">관리자</TabsTrigger></TabsList></Tabs><form onSubmit={login}><label>{mode==='club'?'클럽 공용 비밀번호':'관리자 비밀번호'}<input autoComplete="current-password" type="password" required maxLength={512} value={password} onChange={e=>setPassword(e.target.value)} placeholder="비밀번호 입력"/></label>{error&&<p className="login-error" role="alert">{error}</p>}<button className="save-button" disabled={busy} type="submit"><LockKeyhole size={17}/>{busy?'확인 중…':mode==='club'?'공유 차트 보기':'관리자 로그인'}</button></form><p className="login-footnote">{mode==='club'?'공용 비밀번호는 클럽 관리자에게 문의하세요.':'관리자는 차트를 등록·수정하고 공유 여부를 설정할 수 있습니다.'}</p></section></main>;
}
