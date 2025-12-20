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
