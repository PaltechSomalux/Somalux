import React from 'react';

export const VoiceNotePreview = ({
  recordedVoiceNote,
  voiceNoteDuration,
  playVoiceNote,
  setRecordedVoiceNote
}) => {
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="imo-voice-note-preview">
      <button 
        className="imo-play-preview"
        onClick={() => playVoiceNote({ url: recordedVoiceNote, duration: voiceNoteDuration })}
      >
        ▶️
      </button>
      <div className="imo-preview-waveform">
        {Array(20).fill(0).map((_, i) => (
          <div 
            key={i}
            className="imo-preview-bar"
            style={{ height: `${Math.random() * 100}%` }}
          ></div>
        ))}
      </div>
      <div className="imo-preview-duration">
        {formatDuration(voiceNoteDuration)}
      </div>
      <button 
        className="imo-delete-preview"
        onClick={() => setRecordedVoiceNote(null)}
      >
        ✕
      </button>
    </div>
  );
};