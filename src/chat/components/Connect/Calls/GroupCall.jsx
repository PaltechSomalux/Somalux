import React from 'react';
import { Users, Phone, VideoCamera, X } from 'phosphor-react';

export default function GroupCall({ call, mode = 'voice', onClose = () => {} }) {
  return (
    <div className="active-call-overlay">
      <div className="group-call">
        <div className="group-call-header">
          <h4>{call?.name || 'Group Call'}</h4>
          <button className="close" onClick={onClose}><X /></button>
        </div>
        <div className="group-call-body">
          <div className="group-icon"><Users size={48} /></div>
          <div className="group-mode">{mode === 'voice' ? <Phone /> : <VideoCamera />} {mode.toUpperCase()}</div>
          <p>Participants: (mock) Alice, Ben, You</p>
        </div>
        <div className="group-call-controls">
          <button className="hangup" onClick={onClose}>Leave</button>
        </div>
      </div>
    </div>
  );
}
