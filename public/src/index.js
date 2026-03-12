import React from 'react';
import ReactDOM from 'react-dom/client';
import ELib from './eLib';
import SpeedTracker from './SpeedTracker';
import GlobalCallListener from './FuckOff/Calls/GlobalCallListener';

const root = ReactDOM.createRoot(document.getElementById('root'));

const AppEntry = () => (window.location.pathname === '/speed' ? <SpeedTracker /> : <ELib />);

root.render(
  <React.StrictMode>
    <>
      <AppEntry />
      <GlobalCallListener />
    </>
  </React.StrictMode>
);