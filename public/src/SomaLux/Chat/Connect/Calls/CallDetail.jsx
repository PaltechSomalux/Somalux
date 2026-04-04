import React from 'react';
import CallControls from './CallControls';

export default function CallDetail({ call, onClose = () => {}, onStartCall = () => {} }) {
  if (!call) return null;

  return (
    <div className="call-detail">
      <div className="detail-header">
        <h3>{call.name}</h3>
        <p className="detail-sub">{call.time} • {call.status}</p>
      </div>
      <div className="detail-body">
        <div className="detail-avatar">{call.avatar ? <img src={call.avatar} alt={call.name} /> : call.name.charAt(0)}</div>
        <div className="detail-info">
          <p>Type: {call.type}</p>
          <p>Mode: {call.mode}</p>
          <p>Direction: {call.direction}</p>
        </div>
      </div>
      <div className="detail-controls">
        <CallControls onCall={(mode) => onStartCall(mode)} />
        <button className="close-detail" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
