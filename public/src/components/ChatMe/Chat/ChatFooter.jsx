import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FiPaperclip, FiX } from 'react-icons/fi';
import { FaMicrophone, FaPaperPlane } from 'react-icons/fa';
import { FaCamera, FaImage, FaFileAlt, FaPoll, FaUserCircle, FaMapMarkerAlt } from 'react-icons/fa';
import './ChatFooter.css';

export const ChatFooter = ({
  newMessage = '',
  setNewMessage,
  onSendMessage,
  enableVoiceMessages,
  onFileUpload,
  replyingTo,
  setReplyingTo,
  currentUser,
  contact,
  onUserTyping,
  allUsers = [],
  sendJsonMessage, // For WS typing events
  chatId, // For WS message context
  isRecording,
  startRecording,
  stopRecording,
  recordingTime,
}) => {
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [detectedUrls, setDetectedUrls] = useState([]);
  const [showFormatToolbar, setShowFormatToolbar] = useState(false);
  const [selectionStart, setSelectionStart] = useState(null);
  const [selectionEnd, setSelectionEnd] = useState(null);
  const [toolbarPos, setToolbarPos] = useState({ top: 0, left: 0 });
  const [showHighlightPalette, setShowHighlightPalette] = useState(false);
  const highlightBtnRef = useRef(null);
  const [palettePos, setPalettePos] = useState({ top: 0, left: 0 });
  const textareaRef = useRef(null);
  const mentionsRef = useRef(null);
  const typingTimeoutRef = useRef(null); // For debounce
  const [attachments, setAttachments] = useState([]); // [{ id, file, url, kind }]
  const isSelfChat = currentUser?.id?.toLowerCase() === contact?.id?.toLowerCase();

  // FIXED: Improved typing events: Debounce start/stop properly, only if !selfChat
  useEffect(() => {
    if (isSelfChat) {
      if (onUserTyping) onUserTyping(false);
      return;
    }

    const isTypingNow = inputFocused && newMessage.trim() !== '' && !isRecording;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (isTypingNow) {
      // Send start immediately on first type
      if (sendJsonMessage && chatId) {
        sendJsonMessage({ type: 'typing_start', chatId, userId: currentUser.id });
      }
      if (onUserTyping) onUserTyping(true);

      // FIXED: Debounce stop: 1.5s after last input (better UX)
      typingTimeoutRef.current = setTimeout(() => {
        if (sendJsonMessage && chatId) {
          sendJsonMessage({ type: 'typing_stop', chatId, userId: currentUser.id });
        }
        if (onUserTyping) onUserTyping(false);
      }, 1500);
    } else {
      // Stop immediately on blur/empty
      if (sendJsonMessage && chatId) {
        sendJsonMessage({ type: 'typing_stop', chatId, userId: currentUser.id });
      }
      if (onUserTyping) onUserTyping(false);
    }

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [inputFocused, newMessage, isRecording, isSelfChat, onUserTyping, sendJsonMessage, chatId, currentUser.id]);

  // Filter users for mentions
  const taggedUsers = newMessage.match(/@([a-zA-Z0-9_]+)/g)?.map(tag => tag.slice(1).toLowerCase()) || [];
  const filteredUsers = allUsers.filter(user =>
    user.name.toLowerCase().startsWith(mentionQuery.toLowerCase()) &&
    !taggedUsers.includes(user.name.toLowerCase())
  );

  // Extract URLs for preview
  useEffect(() => {
    const extractUrls = (text) => {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      return text ? text.match(urlRegex) || [] : [];
    };

    const urls = extractUrls(newMessage);
    setDetectedUrls(urls);
    if (urls.length > 0 && !previewData) {
      const url = urls[0];
      setLoadingPreview(true);
      fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`)
        .then((res) => res.json())
        .then((data) => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(data.contents, 'text/html');
          const title = doc.querySelector('title')?.textContent ||
                        doc.querySelector('meta[name="og:title"]')?.getAttribute('content') ||
                        doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
          const desc = doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
                       doc.querySelector('meta[name="og:description"]')?.getAttribute('content') ||
                       doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';
          const image = doc.querySelector('meta[name="og:image"]')?.getAttribute('content') ||
                        doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';
          setPreviewData({ title, description: desc, image, url });
          setLoadingPreview(false);
        })
        .catch((err) => {
          console.error('Link preview fetch error:', err);
          setLoadingPreview(false);
          setPreviewData(null);
        });
    } else if (urls.length === 0) {
      setPreviewData(null);
      setLoadingPreview(false);
    }
  }, [newMessage, previewData]);

  // Live preview for input: render only colored segments (not bold/italic/underline)
  const renderInputPreview = (text) => {
    if (typeof text !== 'string' || text.length === 0) return null;
    const nodes = [];
    let i = 0;
    let key = 0;

    while (i < text.length) {
      // color backtick `color|text`
      if (text[i] === '`') {
        const startIdx = i;
        i++;
        let color = '';
        while (i < text.length && /[a-zA-Z]/.test(text[i])) { color += text[i]; i++; }
        if (color && text[i] === '|') {
          i++;
          let j = i;
          while (j < text.length && text[j] !== '`') j++;
          const hasClosing = j < text.length && text[j] === '`';
          const contentEnd = hasClosing ? j : text.length;
          const content = text.slice(i, contentEnd);
          nodes.push(<span key={`hl-${key++}`} className={`inline-highlight color-${color.toLowerCase()}`}>{content || '\u00A0'}</span>);
          i = hasClosing ? contentEnd + 1 : contentEnd;
          continue;
        } else {
          // Not a color pattern, render as plain text
          nodes.push(<span key={`t-${key++}`}>{text.slice(startIdx, i)}</span>);
          continue;
        }
      }

      // Plain text until next backtick
      const nextTick = text.indexOf('`', i);
      const endPlain = nextTick === -1 ? text.length : nextTick;
      if (endPlain > i) {
        nodes.push(<span key={`t-${key++}`}>{text.slice(i, endPlain)}</span>);
      }
      i = endPlain;
    }
    return <span className="input-preview-content">{nodes}</span>;
  };

  const handleInputFocus = () => setInputFocused(true);
  const handleInputBlur = () => setInputFocused(false); // Remove timeout for instant stop

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isRecording) {
      e.preventDefault();
      if (newMessage.trim() !== '') {
        onSendMessage();
        setNewMessage('');
        // Clear reply banner immediately so it doesn't hang
        if (setReplyingTo) setReplyingTo(null);
        setShowMentions(false);
        setShowFormatToolbar(false);
        setShowHighlightPalette(false);
        setMentionQuery('');
        setPreviewData(null);
        setDetectedUrls([]);
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
      }
    }
    if (e.key === 'Escape') {
      setShowMentions(false);
      setShowFormatToolbar(false);
      setShowHighlightPalette(false);
      setMentionQuery('');
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    const match = value.match(/@([a-zA-Z0-9_]*)$/);
    if (match) {
      setMentionQuery(match[1]);
      setShowMentions(true);
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }

    // Selection toolbar positioning
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

    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 100)}px`;
  };

  const handleMentionSelect = (selectedUser) => {
    const match = newMessage.match(/@([a-zA-Z0-9_]*)$/);
    if (match) {
      const beforeMention = newMessage.slice(0, newMessage.length - match[0].length);
      const afterMention = newMessage.slice(newMessage.length);
      setNewMessage(beforeMention + `@${selectedUser.name}` + afterMention);
    }
    setShowMentions(false);
    setMentionQuery('');
    textareaRef.current?.focus();
  };

  const handleTagAll = () => {
    const allMentions = allUsers.map(user => `@${user.name}`).join(' ');
    const match = newMessage.match(/@([a-zA-Z0-9_]*)$/);
    if (match) {
      const beforeMention = newMessage.slice(0, newMessage.length - match[0].length);
      setNewMessage(beforeMention + allMentions);
    } else {
      setNewMessage(newMessage + (newMessage.trim() ? ' ' : '') + allMentions);
    }
    setShowMentions(false);
    setMentionQuery('');
    textareaRef.current?.focus();
  };

  const handleSendClick = async () => {
    if (isRecording) return;
    const hasText = !!newMessage.trim();
    const hasFiles = attachments.length > 0;
    if (!hasText && !hasFiles) return;

    try {
      let attachmentData = [];

      // Step 1: Upload all files/attachments first (without sending individual messages)
      if (hasFiles) {
        console.log('ChatFooter: Uploading', attachments.length, 'attachments...');
        
        for (const att of attachments) {
          try {
            // Use the new unified upload that returns URL without creating separate message
            const result = await onFileUpload(att.file, { skipMessageCreation: true });
            if (result && result.fileURL) {
              attachmentData.push({
                url: result.fileURL,
                type: att.kind,
                name: att.name
              });
            }
          } catch (e) {
            console.error('ChatFooter: Failed to upload attachment:', e);
          }
        }
        
        // Revoke object URLs after upload
        attachments.forEach((att) => URL.revokeObjectURL(att.url));
      }

      // Step 2: Send message with attachments in one unified message (like WhatsApp)
      // Pass attachment data to the send function so text and images are sent together
      if (hasText || attachmentData.length > 0) {
        // Store attachment data in window/session context for handleSendMessage to access
        if (attachmentData.length > 0) {
          sessionStorage.setItem('pendingAttachments', JSON.stringify(attachmentData));
        }
        onSendMessage();
      }

      // Step 3: Clear UI state
      setAttachments([]);
      setNewMessage('');
      if (setReplyingTo) setReplyingTo(null);
      setShowMentions(false);
      setShowFormatToolbar(false);
      setShowHighlightPalette(false);
      setMentionQuery('');
      setPreviewData(null);
      setDetectedUrls([]);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    } catch (error) {
      console.error('ChatFooter: Error in handleSendClick:', error);
      alert('Error sending message: ' + error.message);
    }
  };

  const handleVoiceClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleRemovePreview = () => {
    const url = detectedUrls[0];
    setNewMessage(newMessage.replace(url, '').trim());
    setPreviewData(null);
    setDetectedUrls([]);
  };

  const shouldShowVoiceButton = enableVoiceMessages && (!newMessage || newMessage.trim() === '') && !isRecording;

  // Formatting helpers
  const wrapSelection = (prefix, suffix = prefix) => {
    const value = typeof newMessage === 'string' ? newMessage : '';
    const start = selectionStart ?? 0;
    const end = selectionEnd ?? start;
    if (end <= start) return;
    const before = value.substring(0, start);
    const selected = value.substring(start, end);
    const after = value.substring(end);
    const next = before + prefix + selected + suffix;
    setNewMessage(next);
    setShowFormatToolbar(false);
    setShowHighlightPalette(false);
    setTimeout(() => {
      const ta = textareaRef.current;
      if (ta) {
        const pos = before.length + prefix.length + selected.length + suffix.length;
        ta.selectionStart = pos;
        ta.selectionEnd = pos;
        ta.focus();
      }
    }, 0);
  };

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
      const ta = textareaRef.current;
      if (ta) {
        const pos = before.length + 1 + colorToken.length + 1 + selected.length + 1;
        ta.selectionStart = pos;
        ta.selectionEnd = pos;
        ta.focus();
      }
    }, 0);
  };

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
    setPalettePos({ top, left });
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

  const handleFileSelection = (type) => {
    const input = document.createElement('input');
    input.type = 'file';
    switch (type) {
      case 'camera':
        input.accept = 'image/*';
        input.capture = 'environment';
        break;
      case 'gallery':
        input.accept = 'image/*';
        input.multiple = true;
        break;
      case 'document':
        input.accept = '.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.zip,.rar,application/*,audio/*,video/*';
        input.multiple = true;
        break;
      default:
        break;
    }
    input.onchange = (e) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;
      const next = files.map((file, idx) => {
        const url = URL.createObjectURL(file);
        let kind = 'doc';
        if (file.type.startsWith('image/')) kind = 'image';
        else if (file.type.startsWith('video/')) kind = 'video';
        else if (file.type.startsWith('audio/')) kind = 'audio';
        return { id: `${Date.now()}-${idx}-${file.name}` , file, url, kind, name: file.name };
      });
      setAttachments((prev) => [...prev, ...next]);
    };
    input.click();
    setShowAttachmentOptions(false);
  };

  const isReplying = replyingTo && Object.keys(replyingTo).length > 0;

  useEffect(() => {
    return () => {
      // cleanup previews
      attachments.forEach((att) => URL.revokeObjectURL(att.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeAttachment = (id) => {
    setAttachments((prev) => {
      const att = prev.find((a) => a.id === id);
      if (att) URL.revokeObjectURL(att.url);
      return prev.filter((a) => a.id !== id);
    });
  };

  const renderAttachmentPreviews = () => {
    if (attachments.length === 0 || isReplying) return null;
    
    // Show full-width image preview for the first image
    const firstImage = attachments.find(att => att.kind === 'image');
    if (firstImage) {
      return (
        <div className="link-preview">
          <button className="preview-remove-btn" onClick={() => removeAttachment(firstImage.id)} aria-label="Remove">
            <FiX />
          </button>
          <img src={firstImage.url} alt={firstImage.name} className="preview-image" />
        </div>
      );
    }
    
    // For non-image attachments, show small chips
    return (
      <div className="attachment-previews">
        {attachments.map((att) => (
          <div key={att.id} className="attachment-chip" title={att.name}>
            <button className="attachment-remove" onClick={() => removeAttachment(att.id)} aria-label="Remove attachment">
              <FiX />
            </button>
            {att.kind === 'video' ? (
              <div className="attachment-thumb video">
                <span>🎞️</span>
              </div>
            ) : att.kind === 'audio' ? (
              <div className="attachment-thumb audio">
                <span>🎵</span>
              </div>
            ) : (
              <div className="attachment-thumb doc">
                <span>📄</span>
              </div>
            )}
            <div className="attachment-name">{att.name}</div>
          </div>
        ))}
      </div>
    );
  };

  const renderLinkPreview = () => {
    if (loadingPreview || detectedUrls.length === 0 || isReplying) return null;
    if (!previewData) {
      return (
        <div className="link-preview fallback">
          <a href={detectedUrls[0]} target="_blank" rel="noopener noreferrer" className="fallback-link">
            {detectedUrls[0]}
          </a>
        </div>
      );
    }

    const isXLink = previewData.url.includes('x.com') || previewData.url.includes('twitter.com');
    let xName, xHandle;
    if (isXLink) {
      const match = previewData.title.match(/(.+?)\s*\(@(.+?)\)\s*(on\s*X|\/ Twitter)/i);
      if (match) {
        xName = match[1].trim();
        xHandle = match[2].trim();
      }
    }

    const postText = isXLink ? previewData.description : previewData.title;
    const previewTitle = isXLink ? postText : previewData.title;
    const previewDesc = isXLink ? '' : previewData.description;

    return (
      <div className="link-preview">
        <button className="preview-remove-btn" onClick={handleRemovePreview}>
          <FiX />
        </button>
        {previewData.image && (
          <img src={previewData.image} alt={previewTitle} className="preview-image" />
        )}
        <div className="preview-content">
          {isXLink && xName && (
            <div className="x-header">
              <span className="x-name">{xName}</span>
              <span className="x-handle">@{xHandle}</span>
              <span className="x-platform">on X</span>
            </div>
          )}
          <h4 className="preview-title">{previewTitle}</h4>
          {previewDesc && <p className="preview-desc">{previewDesc}</p>}
          <a
            href={previewData.url}
            target="_blank"
            rel="noopener noreferrer"
            className="preview-link"
          >
            {new URL(previewData.url).host}
          </a>
        </div>
      </div>
    );
  };

  return (
    <div className="chat-footer-vibe">
      {showAttachmentOptions && (
        <div className="whatsapp-attachment-options-vibe">
          <div className="whatsapp-options-grid-vibe">
            <div className="whatsapp-option-vibe" onClick={() => handleFileSelection('camera')}>
              <div className="whatsapp-option-icon camera-vibe">
                <FaCamera />
              </div>
              <span>Camera</span>
            </div>
            <div className="whatsapp-option-vibe" onClick={() => handleFileSelection('gallery')}>
              <div className="whatsapp-option-icon gallery-vibe">
                <FaImage />
              </div>
              <span>Gallery</span>
            </div>
            <div className="whatsapp-option-vibe" onClick={() => handleFileSelection('document')}>
              <div className="whatsapp-option-icon document-vibe">
                <FaFileAlt />
              </div>
              <span>Document</span>
            </div>
            <div className="whatsapp-option-vibe">
              <div className="whatsapp-option-icon poll-vibe">
                <FaPoll />
              </div>
              <span>Vote</span>
            </div>
            <div className="whatsapp-option-vibe">
              <div className="whatsapp-option-icon contact-vibe">
                <FaUserCircle />
              </div>
              <span>Contact</span>
            </div>
            <div className="whatsapp-option-vibe">
              <div className="whatsapp-option-icon location-vibe">
                <FaMapMarkerAlt />
              </div>
              <span>Location</span>
            </div>
          </div>
        </div>
      )}

      <div className="footer-content-container">
        {renderLinkPreview()}
        {renderAttachmentPreviews()}
        <div className="footer-content-vibe">
          <button
            className="icon-button-vibe attachment-icon"
            onClick={() => setShowAttachmentOptions(!showAttachmentOptions)}
            aria-label="Attachment options"
            disabled={isRecording}
          >
            <FiPaperclip size={6} color="red" />
          </button>

          {isReplying ? (
            <div className="reply-input-container">
              <div className="reply-preview">
                <div className="reply-content">
                  <span className="reply-sender">
                    {replyingTo.sender === currentUser.id ? 'You' : contact.name}
                  </span>
                  <span className="reply-text" style={{ whiteSpace: 'pre-wrap' }}>
                    {replyingTo.text || '\u00A0'}
                  </span>
                </div>
                <button
                  className="reply-cancel-button"
                  onClick={() => setReplyingTo(null)}
                  aria-label="Cancel reply"
                  disabled={isRecording}
                >
                  <FiX />
                </button>
              </div>

              <div className="message-input-section">
                <div className="input-preview-wrapper">
                  <div className="input-preview">
                    {newMessage && newMessage.length > 0 ? (
                      renderInputPreview(newMessage)
                    ) : (
                      <span className="input-placeholder">Type a message</span>
                    )}
                  </div>
                  <textarea
                    className="message-input-vibe with-preview"
                    ref={textareaRef}
                    value={typeof newMessage === 'string' ? newMessage : ''}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    placeholder="Text Honest Message"
                    aria-label="Message input"
                    rows="1"
                    disabled={isRecording}
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
                      background: 'transparent',
                      color: 'transparent',
                      caretColor: '#90EE90',
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="input-wrapper" style={{ flex: 1, maxWidth: 'calc(100% - 98px)', position: 'relative' }}>
              <div className="input-preview-wrapper">
                <div className="input-preview">
                  {newMessage && newMessage.length > 0 ? (
                    renderInputPreview(newMessage)
                  ) : (
                    <span className="input-placeholder">{isRecording ? 'Recording voice message...' : 'Type a message...'}</span>
                  )}
                </div>
                <textarea
                  className="message-input-vibe with-preview"
                  ref={textareaRef}
                  value={typeof newMessage === 'string' ? newMessage : ''}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  onSelect={(e) => {
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
                  }}
                  placeholder="Text Honest Message"
                  aria-label="Message input"
                  rows="1"
                  disabled={isRecording}
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
                    background: 'transparent',
                    color: 'transparent',
                    caretColor: '#90EE90',
                  }}
                />
              </div>
              {showFormatToolbar && (
                <div style={{ position: 'fixed', top: toolbarPos.top, left: toolbarPos.left, transform: 'translateY(-100%)', background: '#111827', color: '#fff', borderRadius: 10, padding: '6px 8px', display: 'flex', gap: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.25)', zIndex: 1000 }}>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => wrapSelection('*','*')} style={{ background: 'transparent', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>B</button>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => wrapSelection('_','_')} style={{ background: 'transparent', border: 'none', color: '#fff', fontStyle: 'italic', cursor: 'pointer' }}>I</button>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => wrapSelection('~','~')} style={{ background: 'transparent', border: 'none', color: '#fff', textDecoration: 'line-through', cursor: 'pointer' }}>S</button>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => wrapSelection('`','`')} style={{ background: 'transparent', border: 'none', color: '#00e6b8', fontFamily: 'monospace', cursor: 'pointer' }}>code</button>
                  <button ref={highlightBtnRef} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { setShowHighlightPalette(v => { const next = !v; if (next) { computePalettePos(); setTimeout(computePalettePos, 0);} return next; }); }} style={{ background: 'transparent', border: '1px solid #374151', color: '#fff', borderRadius: 6, padding: '2px 6px', cursor: 'pointer' }}>Highlight</button>
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
              {showMentions && (
                <div ref={mentionsRef} className="mentions-dropdown">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <div
                        key={user.uid}
                        className="mention-item"
                        onClick={() => handleMentionSelect(user)}
                      >
                        <img src={user.photoURL} alt={user.name} className="mention-avatar" />
                        <span>{user.name}</span>
                      </div>
                    ))
                  ) : (
                    <div className="no-mentions">No users found</div>
                  )}
                  {allUsers.length > 0 && (
                    <div
                      className="mention-item"
                      onClick={handleTagAll}
                    >
                      <FaUserCircle className="mention-avatar" />
                      <span>All</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <button
            className={`send-button-vibe send-icon ${isRecording ? 'recording' : ''}`}
            onClick={shouldShowVoiceButton ? handleVoiceClick : handleSendClick}
            aria-label={isRecording ? 'Stop recording' : (shouldShowVoiceButton ? 'Record voice message' : 'Send message')}
            disabled={!newMessage?.trim() && !isRecording && attachments.length === 0}
          >
            {isRecording ? (
              <span className="recording-indicator">● {recordingTime}s</span>
            ) : shouldShowVoiceButton ? (
              <FaMicrophone />
            ) : (
              <FaPaperPlane />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

ChatFooter.propTypes = {
  newMessage: PropTypes.string,
  setNewMessage: PropTypes.func.isRequired,
  onSendMessage: PropTypes.func.isRequired,
  enableVoiceMessages: PropTypes.bool,
  onFileUpload: PropTypes.func.isRequired,
  replyingTo: PropTypes.object,
  setReplyingTo: PropTypes.func,
  currentUser: PropTypes.object,
  contact: PropTypes.object,
  onUserTyping: PropTypes.func,
  allUsers: PropTypes.array,
  sendJsonMessage: PropTypes.func,
  chatId: PropTypes.string,
  isRecording: PropTypes.bool,
  startRecording: PropTypes.func,
  stopRecording: PropTypes.func,
  recordingTime: PropTypes.number,
};

export default ChatFooter;