import React, { useState, useRef, useEffect } from 'react';
import { FaSmile, FaMicrophone, FaPaperPlane, FaGift } from 'react-icons/fa';

export const MessageInput = ({ setShowIcebreakerModal, setShowGiftModal }) => {
  const [newMessage, setNewMessage] = useState('');
  const [recording, setRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showVoiceMessageTip, setShowVoiceMessageTip] = useState(false);
  const [showFormatToolbar, setShowFormatToolbar] = useState(false);
  const [selectionStart, setSelectionStart] = useState(null);
  const [selectionEnd, setSelectionEnd] = useState(null);
  const [toolbarPos, setToolbarPos] = useState({ top: 0, left: 0 });
  const [showHighlightPalette, setShowHighlightPalette] = useState(false);
  const highlightBtnRef = useRef(null);
  const [palettePos, setPalettePos] = useState({ top: 0, left: 0 });
  const inputRef = useRef(null);

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
      const el = inputRef.current;
      if (el) {
        const pos = before.length + prefix.length + selected.length + suffix.length;
        el.selectionStart = pos;
        el.selectionEnd = pos;
        el.focus();
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
      const el = inputRef.current;
      if (el) {
        const pos = before.length + 1 + colorToken.length + 1 + selected.length + 1;
        el.selectionStart = pos;
        el.selectionEnd = pos;
        el.focus();
      }
    }, 0);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    // Send message logic
    setNewMessage('');
    setShowEmojiPicker(false);
  };

  const startRecording = () => {
    setRecording(true);
    setShowVoiceMessageTip(true);
    setTimeout(() => setShowVoiceMessageTip(false), 3000);
  };

  const stopRecording = () => {
    setRecording(false);
    // Process and send the recorded audio
  };

  return (
    <div className="message-input">
      <button 
        className="emoji-button"
        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
      >
        <FaSmile />
      </button>
      {showEmojiPicker && (
        <div className="emoji-picker">
          {['😀', '😂', '😍', '😎', '👍', '❤️', '🔥', '🎉'].map(emoji => (
            <span 
              key={emoji} 
              className="emoji-option"
              onClick={() => {
                setNewMessage(prev => prev + emoji);
                setShowEmojiPicker(false);
              }}
            >
              {emoji}
            </span>
          ))}
        </div>
      )}
      <input
        type="text"
        ref={inputRef}
        value={newMessage}
        onChange={(e) => {
          setNewMessage(e.target.value);
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
        placeholder="Type a message..."
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSendMessage(); } }}
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
      />
      <button 
        className="gift-button"
        onClick={() => setShowGiftModal(true)}
      >
        <FaGift />
      </button>
      {recording ? (
        <button 
          className="stop-recording-button"
          onClick={stopRecording}
        >
          <FaMicrophone className="recording" />
        </button>
      ) : (
        <button 
          className="voice-button"
          onClick={startRecording}
        >
          <FaMicrophone />
        </button>
      )}
      {showVoiceMessageTip && (
        <div className="voice-message-tip">
          Hold to record, release to send
        </div>
      )}
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
      <button 
        className="send-button" 
        onClick={handleSendMessage}
        disabled={!newMessage.trim()}
      >
        <FaPaperPlane />
      </button>
    </div>
  );
};

