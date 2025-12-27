// index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { SomaLux } from './SomaLux';
import SpeedTracker from './SpeedTracker';

// 🔧 Configure PDF.js worker BEFORE any PDF loading happens
import * as pdfjsLib from 'pdfjs-dist';
if (typeof pdfjsLib !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  // Use local worker file hosted in public folder
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

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
