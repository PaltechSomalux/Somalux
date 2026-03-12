import React, { forwardRef, useState, useRef } from 'react';
import './MemeTemplate.css';
import { defaultMemes, memeLibrary, useMemeTemplates } from './defaultMemes';

export const MemeTemplate = forwardRef(({ currentMeme: initialMeme, onClose, onSelect }, ref) => {
  const [showLibrary, setShowLibrary] = useState(false);
  const fileInputRef = useRef(null);
  const {
    currentMeme,
    setCurrentMeme,
    customMemes,
    handleMemeUpload,
    removeCustomMeme,
    getPreviewStyle,
    allMemes,
  } = useMemeTemplates(initialMeme);

  const selectFromLibrary = (meme) => {
    setCurrentMeme(meme);
    setShowLibrary(false);
  };

  const handleApply = () => {
    if (currentMeme) {
      onSelect(currentMeme);
    }
    onClose();
  };

  const handleRemoveCustomMeme = (id, e) => {
    e.stopPropagation();
    removeCustomMeme(id);
  };

  const downloadMeme = () => {
    if (!currentMeme) return;

    if (currentMeme.value.startsWith('url(')) {
      const memeId = currentMeme.id.replace('local_', '');
      const memeFile = memeLibrary.find((m) => m.id === currentMeme.id);

      if (memeFile) {
        const url = memeFile.value.match(/url\((.*?)\)/)[1];
        const link = document.createElement('a');
        link.href = url;
        link.download = currentMeme.name || 'meme-template.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } else if (currentMeme.value.startsWith('data:image')) {
      const link = document.createElement('a');
      link.href = currentMeme.value;
      link.download = currentMeme.name || 'meme-template.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleFileChange = (e) => {
    handleMemeUpload(e);
    e.target.value = null;
  };

  if (showLibrary) {
    return (
      <div className="meme-container">
        <div className="meme-modal" ref={ref}>
          <div className="meme-modal-header">
            <button className="meme-back-button" onClick={() => setShowLibrary(false)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <div className="meme-modal-title">Meme Templates</div>
          </div>

          <div className="meme-library-grid">
            {memeLibrary.map((meme) => {
              const matchingDefault = defaultMemes.find((m) => m.id === meme.id);
              return (
                <div
                  key={meme.id}
                  className={`meme-library-item ${currentMeme?.id === meme.id ? 'meme-selected' : ''}`}
                  onClick={() => selectFromLibrary(matchingDefault || meme)}
                  style={getPreviewStyle(meme)}
                >
                  {matchingDefault && <div className="meme-library-item-name">{matchingDefault.name}</div>}
                  {currentMeme?.id === meme.id && (
                    <div className="meme-selection-check">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="meme-container">
      <div className="meme-modal" ref={ref}>
        <div className="meme-modal-header">
          <button className="meme-back-button" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <div className="meme-modal-title">Meme Template</div>
        </div>

        <div className="meme-preview-area">
          <div
            className="meme-preview-background"
            style={getPreviewStyle(currentMeme || defaultMemes[0])}
          >
            <div className="meme-text-preview"></div>
          </div>
        </div>

        <div className="meme-selection">
          <div className="meme-scroll">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              style={{ display: 'none' }}
            />
            <button className="meme-upload" onClick={() => fileInputRef.current.click()}>
              <div className="meme-upload-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5V19M5 12H19" stroke="#007AFF" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <div className="meme-upload-label">Upload</div>
            </button>

            <button className="meme-library-button" onClick={() => setShowLibrary(true)}>
              <div className="meme-library-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 6H20M4 10H20M4 14H20M4 18H20"
                    stroke="#007AFF"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div className="meme-library-label">Templates</div>
            </button>

            {allMemes.map((meme) => (
              <div
                key={meme.id}
                className={`meme-thumbnail ${currentMeme?.id === meme.id ? 'meme-selected' : ''}`}
                onClick={() => setCurrentMeme(meme)}
                style={getPreviewStyle(meme)}
              >
                {currentMeme?.id === meme.id && (
                  <div className="meme-selection-check">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                )}
                {meme.isCustom && (
                  <button
                    className="meme-remove-button"
                    onClick={(e) => handleRemoveCustomMeme(meme.id, e)}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="meme-button-group">
          <button
            className="meme-download-button"
            onClick={downloadMeme}
            disabled={!currentMeme}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15M7 10L12 15M12 15L17 10M12 15V3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Save
          </button>
          <button className="meme-apply-button" onClick={handleApply}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Edit
          </button>
        </div>
      </div>
    </div>
  );
});

MemeTemplate.displayName = 'MemeTemplate';