// index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { SomaLux } from './SomaLux';
import SpeedTracker from './SpeedTracker';

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
