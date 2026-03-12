import React, { useState, useRef, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { FiPaperclip, FiX } from 'react-icons/fi';
import { FaMicrophone, FaPaperPlane } from 'react-icons/fa';
import { FaCamera, FaImage, FaFileAlt, FaPoll, FaUserCircle, FaMapMarkerAlt } from 'react-icons/fa';
import { useTyping } from './useTyping';
import { ColorPicker } from './ColorPicker';
import { PollModal } from './PollModal';
import './InputArea.css';
// Removed TextFormatter preview CSS

export const InputArea = ({
  newMessage = '', 
  setNewMessage, 
  onSendMessage,
  enableVoiceMessages = true, 
  onFileUpload,
  onSendPoll,
  replyingTo,
  setReplyingTo,
  editingMessage = null,
  onCancelEdit = () => {},
  currentUser,
  contact,
  onUserTyping,
  voiceNoteRecording = false,
  toggleVoiceNoteRecording,
  voiceNoteDuration = 0,
  inputRef,
  groupMembers = []
}) => {
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerPosition, setColorPickerPosition] = useState(null);
  const [highlightText, setHighlightText] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [showPollModal, setShowPollModal] = useState(false);
  const textareaRef = useRef(null);
  const containerRef = useRef(null);
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStart, setMentionStart] = useState(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [showFormatToolbar, setShowFormatToolbar] = useState(false);
  const [selectionStart, setSelectionStart] = useState(null);
  const [selectionEnd, setSelectionEnd] = useState(null);
  const [toolbarPos, setToolbarPos] = useState({ top: 0, left: 0 });
  const [showHighlightPalette, setShowHighlightPalette] = useState(false);
  const highlightBtnRef = useRef(null);
  const [palettePos, setPalettePos] = useState({ top: 0, left: 0, above: false });

  const normalizedMembers = useMemo(() => {
    const members = Array.isArray(groupMembers) ? groupMembers : [];
    const mapped = members.map(m => ({
      id: m.uid || m.id,
      name: m.displayName || m.name || (m.email ? m.email.split('@')[0] : 'User'),
      photoURL: m.photoURL || m.avatar || m.profilePicture || null
    })).filter(m => m.id && m.name);
    const all = { id: 'all', name: 'All', photoURL: null };
    const dedup = Array.from(new Map(mapped.map(x => [String(x.id), x])).values());
    return [...dedup, all];
  }, [groupMembers]);

  // Fixed: Safe self-chat detection with fallback
  const isSelfChat = useMemo(() => {
    try {
      if (!currentUser?.id || !contact?.id) return false;
      return currentUser.id.toString().toLowerCase() === contact.id.toString().toLowerCase();
    } catch (error) {
      console.warn('Error in self-chat detection:', error);
      return false;
    }
  }, [currentUser?.id, contact?.id]);

  const { sendTypingEvent } = useTyping(currentUser, contact);

  // Fixed: Typing indicator logic with voice recording check
  useEffect(() => {
    const isTyping = inputFocused && newMessage.trim() !== '' && !voiceNoteRecording;
    
    if (isSelfChat || !isTyping) {
      sendTypingEvent(false);
      if (onUserTyping) onUserTyping(false);
      return;
    }
    
    sendTypingEvent(true);
    if (onUserTyping) onUserTyping(true);
    
    const timeout = setTimeout(() => {
      sendTypingEvent(false);
      if (onUserTyping) onUserTyping(false);
    }, 1000);
    
    return () => clearTimeout(timeout);
  }, [inputFocused, newMessage, voiceNoteRecording, sendTypingEvent, isSelfChat, onUserTyping]);

  const handleInputFocus = () => setInputFocused(true);
  const handleInputBlur = () => setTimeout(() => setInputFocused(false), 100);

  const handleKeyDown = (e) => {
    if (showMentionList) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const filtered = normalizedMembers.filter(m => m.name.toLowerCase().includes(mentionQuery.toLowerCase()));
        setMentionIndex(prev => (prev + 1) % Math.max(filtered.length, 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const filtered = normalizedMembers.filter(m => m.name.toLowerCase().includes(mentionQuery.toLowerCase()));
        setMentionIndex(prev => (prev - 1 + Math.max(filtered.length, 1)) % Math.max(filtered.length, 1));
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const filtered = normalizedMembers.filter(m => m.name.toLowerCase().includes(mentionQuery.toLowerCase()));
        const item = filtered[mentionIndex] || filtered[0];
        if (item) {
          const value = typeof newMessage === 'string' ? newMessage : '';
          const start = mentionStart ?? 0;
          const end = cursorPosition;
          const before = value.substring(0, start);
          const after = value.substring(end);
          let inserted = `@${item.name} `;
          if (item.id === 'all') {
            const members = normalizedMembers.filter(x => x.id !== 'all');
            if (members.length > 20) {
              const ok = window.confirm(`Insert mentions for all ${members.length} members?`);
              if (!ok) return;
            }
            inserted = `${members.map(x => `@${x.name}`).join(' ')} `;
          }
          const next = before + inserted + after;
          setNewMessage(next);
          setShowMentionList(false);
          setMentionQuery('');
          setMentionIndex(0);
          setMentionStart(null);
          setTimeout(() => {
            const textarea = inputRef?.current || textareaRef.current;
            if (textarea) {
              const pos = before.length + inserted.length;
              textarea.selectionStart = pos;
              textarea.selectionEnd = pos;
              textarea.focus();
            }
          }, 0);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentionList(false);
        return;
      }
    }
    // Cancel edit on Escape
    if (e.key === 'Escape' && editingMessage) {
      onCancelEdit();
      return;
    }
    // Close color picker on Escape
    if (e.key === 'Escape' && showColorPicker) {
      setShowColorPicker(false);
      return;
    }
    
    // Close color picker if we backspace the backtick
    if (e.key === 'Backspace' && showColorPicker) {
      const value = newMessage;
      const cursorPos = e.target.selectionStart;
      if (cursorPos > 0 && value[cursorPos - 1] === '`') {
        setShowColorPicker(false);
      }
    }
    
    if (e.key === 'Enter' && !e.shiftKey && !voiceNoteRecording) {
      e.preventDefault();
      if (newMessage.trim() !== '') {
        onSendMessage();
        setShowColorPicker(false);
        setHighlightText('');
        setShowFormatToolbar(false);
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
    }
  };

  const onSelectInput = (e) => {
    const el = e.target;
    const selLen = el.selectionEnd - el.selectionStart;
    setSelectionStart(el.selectionStart);
    setSelectionEnd(el.selectionEnd);
    if (selLen > 0) {
      const rect = el.getBoundingClientRect();
      setToolbarPos({ top: rect.top - 46, left: rect.left + 60 });
      setShowFormatToolbar(true);
    } else {
      setShowFormatToolbar(false);
      setShowHighlightPalette(false);
    }
  };

  const wrapSelection = (prefix, suffix = prefix) => {
    const value = typeof newMessage === 'string' ? newMessage : '';
    const start = selectionStart ?? 0;
    const end = selectionEnd ?? start;
    if (end <= start) return;
    const before = value.substring(0, start);
    const selected = value.substring(start, end);
    const after = value.substring(end);
    const next = before + prefix + selected + suffix + (suffix.endsWith(' ') ? '' : '');
    setNewMessage(next);
    setShowFormatToolbar(false);
    setShowHighlightPalette(false);
    setTimeout(() => {
      const textarea = inputRef?.current || textareaRef.current;
      if (textarea) {
        const pos = before.length + prefix.length + selected.length + suffix.length;
        textarea.selectionStart = pos;
        textarea.selectionEnd = pos;
        textarea.focus();
      }
    }, 0);
  };

  const applyBold = () => wrapSelection('*', '*');
  const applyItalic = () => wrapSelection('_', '_');
  const applyStrike = () => wrapSelection('~', '~');
  const applyCode = () => wrapSelection('`', '`');
  const computePalettePos = () => {
    const btn = highlightBtnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const paletteWidth = 140;
    const paletteHeight = 120;
    const centerX = rect.left + rect.width / 2;
    let left = centerX - paletteWidth / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - 8 - paletteWidth));
    const top = Math.max(8, rect.top - 8 - paletteHeight);
    setPalettePos({ top, left, above: true });
  };

  const toggleHighlightPalette = () => {
    setShowHighlightPalette(v => {
      const next = !v;
      if (next) {
        computePalettePos();
        setTimeout(computePalettePos, 0);
      }
      return next;
    });
  };

  useEffect(() => {
    if (!showHighlightPalette) return;
    const handler = () => computePalettePos();
    window.addEventListener('resize', handler);
    window.addEventListener('scroll', handler, true);
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('scroll', handler, true);
    };
  }, [showHighlightPalette]);
  const applyHighlight = (colorToken) => {
    const value = typeof newMessage === 'string' ? newMessage : '';
    const start = selectionStart ?? 0;
    const end = selectionEnd ?? start;
    if (end <= start) return;
    const before = value.substring(0, start);
    const selected = value.substring(start, end);
    const after = value.substring(end);
    const next = `${before}\`${colorToken}|${selected}\`${after}`;
    setNewMessage(next);
    setShowFormatToolbar(false);
    setShowHighlightPalette(false);
    setTimeout(() => {
      const textarea = inputRef?.current || textareaRef.current;
      if (textarea) {
        const pos = before.length + 1 + colorToken.length + 1 + selected.length + 1;
        textarea.selectionStart = pos;
        textarea.selectionEnd = pos;
        textarea.focus();
      }
    }, 0);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    setNewMessage(value);
    setCursorPosition(cursorPos);
    setSelectionStart(e.target.selectionStart);
    setSelectionEnd(e.target.selectionEnd);
    if (e.target.selectionEnd - e.target.selectionStart > 0) {
      const rect = e.target.getBoundingClientRect();
      setToolbarPos({ top: rect.top - 46, left: rect.left + 60 });
      setShowFormatToolbar(true);
    } else {
      setShowFormatToolbar(false);
      setShowHighlightPalette(false);
    }
    
    // Check for backtick to trigger color picker
    if (value[cursorPos - 1] === '`' && !showColorPicker) {
      // Get position for color picker
      const textarea = e.target;
      const rect = textarea.getBoundingClientRect();
      setColorPickerPosition({
        bottom: window.innerHeight - rect.top + 10,
        left: rect.left + 20
      });
      setHighlightText('');
      setShowColorPicker(true);
    }
    
    // Update highlight text preview
    if (showColorPicker) {
      const lastBacktick = value.lastIndexOf('`');
      if (lastBacktick >= 0 && cursorPos > lastBacktick) {
        const textAfterBacktick = value.substring(lastBacktick + 1, cursorPos);
        // Check if it has color| format
        const pipeIndex = textAfterBacktick.indexOf('|');
        if (pipeIndex > 0) {
          setHighlightText(textAfterBacktick.substring(pipeIndex + 1));
        } else {
          setHighlightText(textAfterBacktick);
        }
      }
    }
    
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 100)}px`;

    const before = value.slice(0, cursorPos);
    const atPos = before.lastIndexOf('@');
    if (atPos >= 0) {
      const prevChar = atPos > 0 ? before[atPos - 1] : ' ';
      const boundary = /\s|[\(\[\{,:;]/.test(prevChar);
      const segment = before.slice(atPos + 1);
      const hasSpace = /\s|\n/.test(segment);
      if (boundary && !hasSpace) {
        setShowMentionList(true);
        setMentionStart(atPos);
        setMentionQuery(segment);
        setMentionIndex(0);
      } else if (showMentionList) {
        setShowMentionList(false);
      }
    } else if (showMentionList) {
      setShowMentionList(false);
    }
  };

  const handleSendClick = () => {
    if (!voiceNoteRecording && newMessage.trim() !== '') {
      onSendMessage();
      setShowColorPicker(false);
      setHighlightText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  // Handle color selection from picker
  const handleColorSelect = (colorValue) => {
    const lastBacktick = newMessage.lastIndexOf('`');
    if (lastBacktick >= 0) {
      // Insert color| after the backtick
      const before = newMessage.substring(0, lastBacktick + 1);
      const after = newMessage.substring(lastBacktick + 1);
      const newText = before + colorValue + '|' + after;
      setNewMessage(newText);
      
      // Move cursor after the pipe
      setTimeout(() => {
        const textarea = inputRef?.current || textareaRef.current;
        if (textarea) {
          const newPos = lastBacktick + 1 + colorValue.length + 1;
          textarea.selectionStart = newPos;
          textarea.selectionEnd = newPos;
          textarea.focus();
        }
      }, 0);
    }
    setShowColorPicker(false);
  };

  const handleVoiceClick = () => {
    if (toggleVoiceNoteRecording) {
      toggleVoiceNoteRecording();
    }
  };

  const shouldShowVoiceButton = enableVoiceMessages && 
    (!newMessage || newMessage.trim() === '') && 
    !voiceNoteRecording;

  const handleFileSelection = (type) => {
    if (!onFileUpload) return;
    
    const input = document.createElement('input');
    input.type = 'file';
    
    switch (type) {
      case 'camera':
        input.accept = 'image/*';
        input.capture = 'environment';
        break;
      case 'gallery':
        input.accept = 'image/*';
        break;
      case 'document':
        input.accept = '.pdf,.doc,.docx,.txt';
        break;
      default:
        break;
    }
    
    input.onchange = (e) => {
      if (e.target.files && e.target.files.length > 0) {
        onFileUpload(e, type);
      }
    };
    
    input.click();
    setShowAttachmentOptions(false);
  };

  const isReplying = replyingTo && Object.keys(replyingTo).length > 0;

  // Handle mentions
  const handleMentionTrigger = (e) => {
    if (e.target.value.includes('@') && groupMembers.length > 0) {
      // This would typically open a mention dropdown
      console.log('Mention triggered');
    }
  };

  // Handle poll creation
  const handleCreatePoll = (poll) => {
    if (onSendPoll) {
      onSendPoll(poll);
    }
    setShowAttachmentOptions(false);
  };

  return (
    <div className="input-area-group-footer-vibe">
      {showAttachmentOptions && (
        <div className="input-area-group-attachment-options-vibe">
          <div className="input-area-group-options-grid-vibe">
            <div className="input-area-group-option-vibe" onClick={() => handleFileSelection('camera')}>
              <div className="input-area-group-option-icon camera-vibe">
                <FaCamera />
              </div>
              <span>Camera</span>
            </div>
            <div className="input-area-group-option-vibe" onClick={() => handleFileSelection('gallery')}>
              <div className="input-area-group-option-icon gallery-vibe">
                <FaImage />
              </div>
              <span>Gallery</span>
            </div>
            <div className="input-area-group-option-vibe" onClick={() => handleFileSelection('document')}>
              <div className="input-area-group-option-icon document-vibe">
                <FaFileAlt />
              </div>
              <span>Document</span>
            </div>
            <div className="input-area-group-option-vibe" onClick={() => setShowPollModal(true)}>
              <div className="input-area-group-option-icon poll-vibe">
                <FaPoll />
              </div>
              <span>Vote</span>
            </div>
            <div className="input-area-group-option-vibe">
              <div className="input-area-group-option-icon contact-vibe">
                <FaUserCircle />
              </div>
              <span>Contact</span>
            </div>
            <div className="input-area-group-option-vibe">
              <div className="input-area-group-option-icon location-vibe">
                <FaMapMarkerAlt />
              </div>
              <span>Location</span>
            </div>
          </div>
        </div>
      )}

      <div className="input-area-group-footer-content-container">
        <div className="input-area-group-footer-content-vibe">
          <button
            className="input-area-group-icon-button-vibe"
            onClick={() => setShowAttachmentOptions(!showAttachmentOptions)}
            aria-label="Attachment options"
            disabled={voiceNoteRecording}
          >
            <FiPaperclip />
          </button>

          {isReplying ? (
            <div className="input-area-group-reply-input-container">
              {editingMessage && (
                <div className="input-area-edit-banner">
                  <div className="input-area-edit-label">Editing message</div>
                  <button
                    className="input-area-edit-cancel"
                    onClick={onCancelEdit}
                    aria-label="Cancel edit"
                    disabled={voiceNoteRecording}
                  >
                    <FiX />
                  </button>
                </div>
              )}
              <div className="input-area-group-reply-preview">
                <div className="input-area-group-reply-content">
                  <span className="input-area-group-reply-sender">
                    {replyingTo.sender === currentUser?.id ? 'You' : (contact?.name || 'Someone')}
                  </span>
                  <span className="input-area-group-reply-text" style={{ whiteSpace: 'pre-wrap' }}>
                    {replyingTo.text || '[Media]' || '\u00A0'}
                  </span>
                </div>
                <button
                  className="input-area-group-reply-cancel-button"
                  onClick={() => setReplyingTo(null)}
                  aria-label="Cancel reply"
                  disabled={voiceNoteRecording}
                >
                  <FiX />
                </button>
              </div>

              <div className="input-area-group-message-input-section">
                <textarea
                  ref={inputRef || textareaRef}
                  className="input-area-group-message-input-vibe"
                  value={typeof newMessage === 'string' ? newMessage : ''}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  placeholder={editingMessage ? 'Edit message' : 'Type a message'}
                  aria-label="Message input"
                  rows="1"
                  disabled={voiceNoteRecording}
                  style={{
                    resize: 'none',
                    overflowY: 'auto',
                    maxHeight: '100px',
                    minHeight: '32px',
                    lineHeight: '1.5',
                    padding: '8px',
                    whiteSpace: 'pre-wrap',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="input-area-group-input-wrapper" style={{ flex: 1, maxWidth: 'calc(100% - 98px)' }}>
              {editingMessage && (
                <div className="input-area-edit-banner">
                  <div className="input-area-edit-label">Editing message</div>
                  <button
                    className="input-area-edit-cancel"
                    onClick={onCancelEdit}
                    aria-label="Cancel edit"
                    disabled={voiceNoteRecording}
                  >
                    <FiX />
                  </button>
                </div>
              )}
              <textarea
                ref={inputRef || textareaRef}
                className="input-area-group-message-input-vibe"
                value={typeof newMessage === 'string' ? newMessage : ''}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                onInput={handleMentionTrigger}
                onSelect={onSelectInput}
                placeholder={voiceNoteRecording ? 'Recording voice message...' : (editingMessage ? 'Edit message...' : 'Type a message...')}
                aria-label="Message input"
                rows="1"
                disabled={voiceNoteRecording}
                style={{
                  resize: 'none',
                  overflowY: 'auto',
                  maxHeight: '100px',
                  minHeight: '32px',
                  lineHeight: '1.5',
                  padding: '8px',
                  whiteSpace: 'pre-wrap',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
              {showFormatToolbar && (
                <div style={{ position: 'fixed', top: toolbarPos.top, left: toolbarPos.left, transform: 'translateY(-100%)', background: '#111827', color: '#fff', borderRadius: 10, padding: '6px 8px', display: 'flex', gap: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.25)', zIndex: 1000 }}>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={applyBold} style={{ background: 'transparent', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>B</button>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={applyItalic} style={{ background: 'transparent', border: 'none', color: '#fff', fontStyle: 'italic', cursor: 'pointer' }}>I</button>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={applyStrike} style={{ background: 'transparent', border: 'none', color: '#fff', textDecoration: 'line-through', cursor: 'pointer' }}>S</button>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={applyCode} style={{ background: 'transparent', border: 'none', color: '#00e6b8', fontFamily: 'monospace', cursor: 'pointer' }}>code</button>
                  <div style={{ position: 'relative' }}>
                    <button ref={highlightBtnRef} type="button" onMouseDown={(e) => e.preventDefault()} onClick={toggleHighlightPalette} style={{ background: 'transparent', border: '1px solid #374151', color: '#fff', borderRadius: 6, padding: '2px 6px', cursor: 'pointer' }}>Highlight</button>
                  </div>
                </div>
              )}
              {showFormatToolbar && showHighlightPalette && (
                <div style={{ position: 'fixed', top: palettePos.top, left: palettePos.left, width: 140, height: 120, background: '#1f2937', border: '1px solid #374151', borderRadius: 8, padding: 6, display: 'grid', gridTemplateColumns: 'repeat(5, 20px)', gap: 6, zIndex: 1001 }}>
                  {['yellow','blue','green','red','purple','pink','orange','teal','indigo','violet'].map(c => (
                    <div key={c} onMouseDown={(e) => e.preventDefault()} onClick={() => applyHighlight(c)} title={c} style={{ width: 20, height: 20, borderRadius: 4, background: c, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.2)' }} />
                  ))}
                  <div onMouseDown={(e) => e.preventDefault()} onClick={() => applyHighlight('#ffd43b')} title="#ffd43b" style={{ width: 20, height: 20, borderRadius: 4, background: '#ffd43b', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.2)' }} />
                </div>
              )}
              {showMentionList && (
                <div style={{ position: 'absolute', bottom: '56px', left: '54px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 50, maxHeight: 220, overflowY: 'auto', minWidth: 240 }}>
                  {normalizedMembers.filter(m => m.name.toLowerCase().includes(mentionQuery.toLowerCase())).map((m, idx) => (
                    <div
                      key={m.id}
                      onMouseDown={(ev) => {
                        ev.preventDefault();
                        const valueNow = typeof newMessage === 'string' ? newMessage : '';
                        const start = mentionStart ?? 0;
                        const end = cursorPosition;
                        const beforeTxt = valueNow.substring(0, start);
                        const afterTxt = valueNow.substring(end);
                        let inserted = `@${m.name} `;
                        if (m.id === 'all') {
                          const members = normalizedMembers.filter(x => x.id !== 'all');
                          if (members.length > 20) {
                              const ok = window.confirm(`Insert mentions for all ${members.length} members?`);
                              if (!ok) return;
                          }
                          inserted = `${members.map(x => `@${x.name}`).join(' ')} `;
                        }
                        const next = beforeTxt + inserted + afterTxt;
                        setNewMessage(next);
                        setShowMentionList(false);
                        setMentionQuery('');
                        setMentionIndex(0);
                        setMentionStart(null);
                        setTimeout(() => {
                          const textarea = inputRef?.current || textareaRef.current;
                          if (textarea) {
                            const pos = beforeTxt.length + inserted.length;
                            textarea.selectionStart = pos;
                            textarea.selectionEnd = pos;
                            textarea.focus();
                          }
                        }, 0);
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', cursor: 'pointer', background: idx === mentionIndex ? '#f3f4f6' : 'transparent' }}
                    >
                      <div style={{ width: 28, height: 28, borderRadius: 14, background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#374151' }}>
                        {(m.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ fontSize: 14, color: '#111827' }}>@{m.id === 'all' ? 'all' : m.name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            className={`input-area-group-send-button-vibe ${voiceNoteRecording ? 'recording' : ''}`}
            onClick={shouldShowVoiceButton ? handleVoiceClick : handleSendClick}
            aria-label={voiceNoteRecording ? 'Stop recording' : (shouldShowVoiceButton ? 'Record voice message' : 'Send message')}
            disabled={!newMessage?.trim() && !voiceNoteRecording}
          >
            {voiceNoteRecording ? (
              <span className="recording-indicator">● {voiceNoteDuration}s</span>
            ) : shouldShowVoiceButton ? (
              <FaMicrophone />
            ) : (
              <FaPaperPlane />
            )}
          </button>
        </div>
      </div>

      {/* Color Picker Popup */}
      {showColorPicker && (
        <ColorPicker
          position={colorPickerPosition}
          onColorSelect={handleColorSelect}
          onClose={() => setShowColorPicker(false)}
          currentText={highlightText}
        />
      )}

      {/* Poll Modal */}
      {showPollModal && (
        <PollModal
          onClose={() => setShowPollModal(false)}
          onCreatePoll={handleCreatePoll}
          currentUser={currentUser}
        />
      )}

      {/* Preview removed as requested */}
    </div>
  );
};

InputArea.propTypes = {
  newMessage: PropTypes.string,
  setNewMessage: PropTypes.func.isRequired,
  onSendMessage: PropTypes.func.isRequired,
  enableVoiceMessages: PropTypes.bool,
  onFileUpload: PropTypes.func,
  onSendPoll: PropTypes.func,
  replyingTo: PropTypes.object,
  setReplyingTo: PropTypes.func,
  editingMessage: PropTypes.object,
  onCancelEdit: PropTypes.func,
  currentUser: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string
  }),
  contact: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string
  }),
  onUserTyping: PropTypes.func,
  voiceNoteRecording: PropTypes.bool,
  toggleVoiceNoteRecording: PropTypes.func,
  voiceNoteDuration: PropTypes.number,
  inputRef: PropTypes.object,
  groupMembers: PropTypes.array
};

InputArea.defaultProps = {
  enableVoiceMessages: true,
  newMessage: '',
  currentUser: { id: '', name: 'You' },
  contact: { id: '', name: 'Chat' },
  groupMembers: []
};