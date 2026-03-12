import React from 'react';
import { FaVolumeUp, FaVolumeMute, FaVideoSlash } from 'react-icons/fa';

export const CallContainer = ({ 
  videoCallActive,
  audioCallActive,
  callDuration,
  endCall,
  toggleVideoMute,
  toggleAudioMute,
  videoMuted,
  audioMuted
}) => {
  const formatCallDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };

  return (
    <div className="call-container">
      <div className="call-video">
        {videoCallActive && (
          <video className="remote-video" autoPlay playsInline></video>
        )}
        <video 
          className="local-video" 
          autoPlay 
          playsInline 
          muted
        ></video>
      </div>
      <div className="call-controls">
        <div className="call-timer">
          {formatCallDuration(callDuration)}
        </div>
        <button 
          className="end-call-button"
          onClick={endCall}
        >
          End Call
        </button>
        {videoCallActive && (
          <button 
            className={`toggle-video-button ${videoMuted ? 'muted' : ''}`}
            onClick={toggleVideoMute}
          >
 
          </button>
        )}
        <button 
          className={`mute-button ${audioMuted ? 'muted' : ''}`}
          onClick={toggleAudioMute}
        >
          {audioMuted ? <FaVolumeMute /> : <FaVolumeUp />}
        </button>
      </div>
    </div>
  );
};

