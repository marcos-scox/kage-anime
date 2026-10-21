import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import { App } from './app/App';
import './styles/global.css';
import './styles/utility.css';

function NativeAndroidBackButton() {
  const navigate = useNavigate();

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return;

    let disposed = false;
    let removeListener: (() => void) | undefined;
    void import('@capacitor/app').then(async ({ App: NativeApp }) => {
      const handle = await NativeApp.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) navigate(-1);
        else if (window.location.pathname !== '/') navigate('/', { replace: true });
        else void NativeApp.exitApp();
      });
      if (disposed) void handle.remove();
      else removeListener = () => { void handle.remove(); };
    }).catch(() => undefined);

    return () => {
      disposed = true;
      removeListener?.();
    };
  }, [navigate]);

  return null;
}

if (import.meta.env.PROD) registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <NativeAndroidBackButton />
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
