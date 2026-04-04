import React from 'react';
import ReactDOM from 'react-dom/client';
import ChatMe from './ChatMe';
import SpeedTracker from './SpeedTracker';
import GlobalCallListener from './Connect/Calls/GlobalCallListener';

const root = ReactDOM.createRoot(document.getElementById('root'));

const AppEntry = () => (window.location.pathname === '/speed' ? <SpeedTracker /> : <ChatMe />);

root.render(
  <React.StrictMode>
    <>
      <AppEntry />
      <GlobalCallListener />
    </>
  </React.StrictMode>
);