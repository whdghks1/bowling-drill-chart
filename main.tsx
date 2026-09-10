import React, {lazy, Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import App from './app/auth-app';
import './app/globals.css';
const TestLab=lazy(()=>import('./app/test-lab'));
createRoot(document.getElementById('root')!).render(<React.StrictMode>{/^\/test\/?$/.test(window.location.pathname)?<Suspense fallback={<p>3D 스튜디오를 불러오는 중…</p>}><TestLab/></Suspense>:<App/>}</React.StrictMode>);
