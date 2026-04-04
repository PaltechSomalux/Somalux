import React from 'react';
import { Phone, VideoCamera, PhoneCall } from 'phosphor-react';

export default function CallItem({ call, onClick = () => {}, onStartCall = () => {} }) {
  return (
    <div className="call-item" onClick={onClick} role="button" tabIndex={0}>
      <div className="call-item-left">
        <div className="call-avatar">{call.avatar ? <img src={call.avatar} alt={call.name} /> : call.name.charAt(0)}</div>
        <div className="call-meta">
          <div className="call-name">{call.name}</div>
          <div className="call-time">{call.time} • {call.status}</div>
        </div>
      </div>
      <div className="call-item-right">
        <div className="call-mode">
          {call.mode === 'voice' ? <Phone size={20} /> : <VideoCamera size={20} />}
        </div>
        <div className="call-actions">
          <button className="action" onClick={(e) => { e.stopPropagation(); onStartCall(call.mode); }} title="Call back">
            <PhoneCall size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
