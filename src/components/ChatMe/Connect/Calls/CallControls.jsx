import React from 'react';
import { Phone, VideoCamera } from 'phosphor-react';

export default function CallControls({ onCall = () => {} }) {
  return (
    <div className="call-controls">
      <button className="control voice" onClick={() => onCall('voice')} title="Voice Call">
        <Phone size={18} /> Voice
      </button>
      <button className="control video" onClick={() => onCall('video')} title="Video Call">
        <VideoCamera size={18} /> Video
      </button>
    </div>
  );
}
