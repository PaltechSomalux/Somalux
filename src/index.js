// index.js
import React from 'react';
import ReactDOM from 'react-dom/client';

// 🔧 CRITICAL: Initialize PDF worker FIRST before any other imports
import './pdfConfig.js';

import { SomaLux } from './SomaLux';
import SpeedTracker from './SpeedTracker';

// Register Service Worker for high-speed downloads and offline caching
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      console.log('✅ Service Worker registered for fast downloads:', registration);
      
      // Listen for updates to the service worker
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'activated') {
            console.log('✅ Service Worker updated for optimal performance');
          }
        });
      });
    }).catch((error) => {
      console.warn('Service Worker registration failed:', error);
    });
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));

const AppEntry = () =>
  window.location.pathname === '/speed'
    ? <SpeedTracker />
    : <SomaLux />;

root.render(
  <React.StrictMode>
    <AppEntry />
  </React.StrictMode>
);
