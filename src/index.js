// index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { SomaLux } from './SomaLux';
import SpeedTracker from './SpeedTracker';

// 🔧 Configure PDF.js worker BEFORE any PDF loading happens
import * as pdfjsLib from 'pdfjs-dist';
if (typeof pdfjsLib !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  // Use unpkg CDN with fixed version path
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist/build/pdf.worker.min.js';
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
