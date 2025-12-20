// NoteModal.jsx - Enhanced note taking with categories and tagging
import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import './NoteModal.css';

const NoteModal = ({ isOpen, pageNumber, existingNote, onAddNote, onClose }) => {
  const [noteText, setNoteText] = useState('');
  const [category, setCategory] = useState('general');
  const [color, setColor] = useState('blue');
  const [tags, setTags] = useState('');
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (existingNote) {
      setNoteText(existingNote.text);
      setCategory(existingNote.category || 'general');
      setColor(existingNote.color || 'blue');
      setTags(existingNote.tags || []);
    } else {
      setNoteText('');
      setCategory('general');
      setColor('blue');
      setTags([]);
    }
  }, [existingNote, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (noteText.trim()) {
      onAddNote({
        text: noteText,
        category: category,
        color: color,
        tags: Array.isArray(tags) ? tags : []
      });
      setNoteText('');
      setCategory('general');
      setColor('blue');
      setTags([]);
    }
  };

  const handleClose = () => {
    setNoteText('');
    setCategory('general');
    setColor('blue');
    setTags([]);
    onClose();
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="nm-overlay" onClick={handleClose}>
      <div className="nm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="nm-header">
          <h2>📝 {existingNote ? 'Edit Note' : 'Add Note'} - Page {pageNumber}</h2>
          <button onClick={handleClose} className="nm-close-btn">
            <FiX size={20} />
          </button>
        </div>

        <div className="nm-content">
          {/* Category Selection */}
          <div className="nm-category-section">
            <label className="nm-label">Category</label>
            <div className="nm-category-grid">
              {['general', 'important', 'question', 'summary', 'review'].map((cat) => (
                <button
                  key={cat}
                  className={`nm-category-btn ${category === cat ? 'active' : ''}`}
                  onClick={() => setCategory(cat)}
                  title={cat.charAt(0).toUpperCase() + cat.slice(1)}
                >
                  {cat === 'general' && '📌'}
                  {cat === 'important' && '⭐'}
                  {cat === 'question' && '❓'}
                  {cat === 'summary' && '📋'}
                  {cat === 'review' && '🔄'}
                  <span>{cat}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div className="nm-color-section">
            <label className="nm-label">Color</label>
            <div className="nm-color-grid">
              {['blue', 'red', 'green', 'yellow', 'purple', 'orange'].map((c) => (
                <button
                  key={c}
                  className={`nm-color-btn nm-color-${c} ${color === c ? 'active' : ''}`}
                  onClick={() => setColor(c)}
                  title={c}
                >
                  {color === c && '✓'}
                </button>
              ))}
            </div>
          </div>

          {/* Note Text */}
          <textarea
            className="nm-textarea"
            placeholder="Write your note here... (e.g., Important concept, Key point, Question, etc.)"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            autoFocus
          />
          
          {/* Tags Section */}
          <div className="nm-tags-section">
            <label className="nm-label">Tags</label>
            <div className="nm-tag-input-row">
              <input
                type="text"
                className="nm-tag-input"
                placeholder="Add tags (e.g., 'important', 'review')"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <button className="nm-tag-add-btn" onClick={handleAddTag}>
                +
              </button>
            </div>
            {tags.length > 0 && (
              <div className="nm-tags-list">
                {tags.map((tag) => (
                  <span key={tag} className="nm-tag">
                    {tag}
                    <button 
                      className="nm-tag-remove"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="nm-char-count">
            {noteText.length} characters
          </div>
        </div>

        <div className="nm-footer">
          <button onClick={handleClose} className="nm-cancel-btn">
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            className={`nm-save-btn nm-save-${color}`}
            disabled={!noteText.trim()}
          >
            {existingNote ? '✏️ Update Note' : '💾 Save Note'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoteModal;
