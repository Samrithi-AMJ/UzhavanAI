import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Register Service Worker for PWA installability & offline caching
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[UzhavanAI PWA] Service worker registered with scope:', reg.scope);
      })
      .catch((err) => {
        console.debug('[UzhavanAI PWA] Service worker registration skipped:', err);
      });
  });
}

