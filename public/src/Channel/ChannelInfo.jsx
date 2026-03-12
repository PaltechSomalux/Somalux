import React, { useState, useEffect } from 'react';

export const ChannelInfo = ({
  channel,
  isOwner,
  following,
  onToggleFollow,
  localDesc,
  onSaveDescription,
  onBack,
}) => {
  const [desc, setDesc] = useState(localDesc || '');

  useEffect(() => {
    setDesc(localDesc || '');
  }, [localDesc]);

  return (
    <div className="channel-info-view" style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div className="channel-view-header">
        <div className="left">
          <button className="cv-back" onClick={onBack} aria-label="Back">⟵</button>
          <div className="cv-title" style={{ background: channel.avatarColor || '#1f2c33' }}>
            {(channel.name || 'C')[0].toUpperCase()}
          </div>
          <div className="cv-meta">
            <div className="name">{channel.name}</div>
          </div>
        </div>
        <div className="right">
          {!isOwner && (
            <button className={`cv-follow ${following ? 'following' : ''}`} onClick={onToggleFollow}>
              {following ? 'Unfollow' : 'Follow'}
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: 16, display:'flex', flexDirection:'column', gap:12 }}>
        <div style={{ color:'#8696a0', fontSize:12 }}>{channel.followersCount || 0} followers</div>

        {isOwner ? (
          <div>
            <label style={{ display:'block', marginBottom:6 }}>Description</label>
            <textarea
              className="cv-desc-input"
              placeholder="Describe your channel"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
            <div style={{ marginTop: 10 }}>
              <button className="btn-primary" onClick={() => onSaveDescription(desc)}>Save</button>
            </div>
          </div>
        ) : (
          (desc ? (
            <div style={{ padding:12, background:'#0b1216', border:'1px solid #2a3942', borderRadius:8 }}>
              {desc}
            </div>
          ) : (
            <div style={{ color:'#8696a0' }}>No description</div>
          ))
        )}
      </div>
    </div>
  );
}
