import { useEffect, useState } from 'react';
import { CircleDot, LockKeyhole } from 'lucide-react';
import Home from './page';
import ClubView from './club-view';
import AccountPage from './account-page';
import {api,roleName,type User} from './account-api';
type View='public'|'login'|'register'|'setup'|'account';
export default function AuthApp(){
 const [user,setUser]=useState<User|null>(null),[view,setView]=useState<View>('public'),[setup,setSetup]=useState(false),[name,setName]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[setupPassword,setSetupPassword]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{const refresh=()=>{api('session').then(d=>{setUser(d.user);setSetup(d.setupAvailable);if(!d.user)setView(v=>v==='account'?'login':v);}).catch(()=>{});};refresh();window.addEventListener('focus',refresh);return()=>window.removeEventListener('focus',refresh);},[]);
 function navigate(next:View){setView(next);setError('');setPassword('');setConfirm('');setSetupPassword('');}
 async function submit(e:React.FormEvent){e.preventDefault();if(view!=='login'&&password!==confirm){setError('비밀번호 확인이 일치하지 않습니다.');return;}setBusy(true);setError('');try{const d=await api(view,{name,password,...(view==='setup'?{setupPassword}:{})});setUser(d.user);if(view==='setup')setSetup(false);navigate(view==='register'?'account':'public');}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 async function logout(){try{await api('logout',{});setUser(null);navigate('public');}catch{window.alert('로그아웃하지 못했습니다. 다시 시도해주세요.');}}
 if(view==='account'&&user)return <AccountPage user={user} onUser={setUser} onBack={()=>navigate('public')} onLogout={logout}/>;
 if(view==='public'){
  if(user&&(user.role==='admin'||user.role==='editor'))return <Home onLogout={logout} onAccount={()=>navigate('account')} accountLabel={`${user.name} · ${roleName[user.role]}`}/>;
  return <ClubView onAdminLogin={()=>navigate(user?'account':'login')} accountLabel={user?`${user.name} · 내 계정`:'로그인 / 회원가입'}/>;
 }
 const signup=view==='register',initial=view==='setup';
 return <main className="login-page"><section className="login-card"><div className="login-logo"><CircleDot size={31}/><span>FIT STUDIO</span></div><h1>{initial?'첫 관리자 계정 만들기':signup?'회원가입':'로그인'}</h1><p className="login-intro">{initial?'기존 관리자 비밀번호로 확인 후 관리자 계정을 만듭니다. 등록은 한 번만 가능합니다.':signup?'이름과 비밀번호만 입력하세요. 가입하면 일반 회원으로 시작합니다.':'가입한 이름과 비밀번호를 입력하세요. 공개 차트는 로그인 없이 볼 수 있습니다.'}</p><form onSubmit={submit}><fieldset disabled={busy} className="account-fields"><label>이름<input autoComplete="username" required minLength={2} maxLength={40} value={name} onChange={e=>setName(e.target.value)} placeholder="로그인할 이름 · 중복 불가"/></label><label>{initial?'새 계정 비밀번호':'비밀번호'}<input autoComplete={signup||initial?'new-password':'current-password'} type="password" required minLength={8} maxLength={128} value={password} onChange={e=>setPassword(e.target.value)} placeholder="8자 이상"/></label>{(signup||initial)&&<label>비밀번호 확인<input autoComplete="new-password" type="password" required minLength={8} maxLength={128} value={confirm} onChange={e=>setConfirm(e.target.value)}/></label>}{initial&&<label>기존 관리자 비밀번호<input autoComplete="off" type="password" required maxLength={512} value={setupPassword} onChange={e=>setSetupPassword(e.target.value)}/><small>Netlify에 설정한 ADMIN_PASSWORD 값입니다.</small></label>}{error&&<p className="login-error" role="alert">{error}</p>}<button className="save-button" disabled={busy} type="submit"><LockKeyhole size={17}/>{busy?'처리 중…':initial?'관리자 계정 만들기':signup?'가입하기':'로그인'}</button></fieldset></form><div className="account-links"><button disabled={busy} onClick={()=>navigate(signup?'login':'register')}>{signup?'이미 계정이 있나요? 로그인':'이름과 비밀번호로 회원가입'}</button><button disabled={busy} onClick={()=>navigate('public')}>공개 차트 보기</button>{setup&&!initial&&<button disabled={busy} onClick={()=>navigate('setup')}>기존 관리자 · 첫 계정 등록</button>}</div></section></main>;
}
