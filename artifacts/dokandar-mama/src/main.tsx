import React from 'react';
import ReactDOM from 'react-dom/client';
import { setBaseUrl } from '@workspace/api-client-react';
import { Capacitor } from '@capacitor/core';

import App from './App';
import './index.css';

// Automatically configure production backend API for mobile app
const customApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') || '';
const isNative =
  Capacitor.isNativePlatform() ||
  (typeof window !== 'undefined' &&
    (window.location.origin === 'https://localhost' ||
      window.location.protocol === 'capacitor:' ||
      window.location.protocol === 'file:'));

const targetApiBase = customApiUrl || (isNative ? 'https://dokandar-mama.onrender.com' : '');

if (targetApiBase) {
  setBaseUrl(targetApiBase);

  if (typeof window !== 'undefined') {
    const originalFetch = window.fetch.bind(window);
    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      let urlStr: string | null = null;
      if (typeof input === 'string') {
        urlStr = input;
      } else if (input instanceof URL) {
        urlStr = input.toString();
      } else if (typeof Request !== 'undefined' && input instanceof Request) {
        urlStr = input.url;
      }

      if (urlStr) {
        if (urlStr.startsWith('/api')) {
          return originalFetch(`${targetApiBase}${urlStr}`, init);
        }
        if (
          urlStr.startsWith('https://localhost/api') ||
          urlStr.startsWith('http://localhost/api') ||
          urlStr.startsWith('capacitor://localhost/api')
        ) {
          const apiPath = urlStr.substring(urlStr.indexOf('/api'));
          return originalFetch(`${targetApiBase}${apiPath}`, init);
        }
      }
      return originalFetch(input, init);
    };
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
