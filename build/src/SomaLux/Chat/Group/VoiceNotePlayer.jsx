import React from 'react';

export const VoiceNotePlayer = ({
  setShowVoiceNotePlayer,
  playingVoiceNote
}) => {
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="imo-voice-note-player">
      <div className="imo-voice-note-header">
        <button 
          className="imo-close-player"
          onClick={() => setShowVoiceNotePlayer(false)}
        >
          ✕
        </button>
      </div>
      
      <div className="imo-voice-note-waveform">
        {playingVoiceNote.waveform.map((amp, i) => (
          <div 
            key={i}
            className="imo-voice-note-bar"
            style={{ height: `${amp * 100}%` }}
          ></div>
        ))}
      </div>
      
      <div className="imo-voice-note-controls">
        <button className="imo-voice-control">⏮️</button>
        <button className="imo-voice-control">⏯️</button>
        <button className="imo-voice-control">⏭️</button>
      </div>
      
      <div className="imo-voice-note-duration">
        {formatDuration(playingVoiceNote.duration)}
      </div>
    </div>
  );
};
