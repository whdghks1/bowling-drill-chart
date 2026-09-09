import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './app/auth-app';
import './app/globals.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
