// index.js
import React from 'react';
import ReactDOM from 'react-dom/client';

// 🔧 CRITICAL: Initialize PDF worker FIRST before any other imports
import './pdfConfig.js';

import { SomaLux } from './SomaLux';
import SpeedTracker from './SpeedTracker';
import { registerServiceWorker } from './Services/utils/serviceWorkerManager';

// Register Service Worker for high-speed downloads and offline caching
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Register main app service worker
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

    // Register feature flags service worker for smart caching
    registerServiceWorker().catch((error) => {
      console.warn('Feature flags Service Worker registration failed:', error);
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
