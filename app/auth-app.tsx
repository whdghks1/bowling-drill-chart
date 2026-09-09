import { useEffect, useState } from 'react';
import { CircleDot, LockKeyhole } from 'lucide-react';
import Home from './page';
import ClubView from './club-view';
export default function AuthApp(){
 const [admin,setAdmin]=useState(false),[showLogin,setShowLogin]=useState(false),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{fetch('/api/session').then(async r=>{if(r.ok)setAdmin((await r.json()).role==='admin');}).catch(()=>{});},[]);
 async function login(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');try{const r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({role:'admin',password})});const d=await r.json();if(!r.ok)throw Error(d.error);setAdmin(true);setShowLogin(false);setPassword('');}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 async function logout(){try{const r=await fetch('/api/logout',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});if(!r.ok)throw Error();setAdmin(false);setShowLogin(false);setPassword('');}catch{window.alert('로그아웃하지 못했습니다. 다시 시도해주세요.');}}
 if(admin)return <Home onLogout={logout}/>;
 if(!showLogin)return <ClubView onAdminLogin={()=>{setError('');setShowLogin(true);}}/>;
 return <main className="login-page"><section className="login-card"><div className="login-logo"><CircleDot size={31}/><span>FIT STUDIO</span></div><h1>관리자 로그인</h1><p className="login-intro">차트 등록과 수정은 관리자만 할 수 있습니다.</p><form onSubmit={login}><label>관리자 비밀번호<input autoComplete="current-password" type="password" required maxLength={512} value={password} onChange={e=>setPassword(e.target.value)}/></label>{error&&<p className="login-error" role="alert">{error}</p>}<button className="save-button" disabled={busy} type="submit"><LockKeyhole size={17}/>{busy?'확인 중…':'관리자 로그인'}</button></form><button className="refresh-button" onClick={()=>{setShowLogin(false);setPassword('');}}>공개 차트로 돌아가기</button></section></main>;
}
