import React, { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { format, parse } from 'date-fns';
import {
  FiChevronDown,
  FiChevronUp,
  FiEye,
  FiEyeOff,
  FiCornerUpLeft,
  FiDownload,
  FiCheck,
  FiX,
  FiCornerUpRight,
  FiCopy,
  FiTrash2,
  FiStar,
  FiShare2,
} from 'react-icons/fi';
import { BsPinFill } from 'react-icons/bs';
import { MdDone, MdDoneAll } from 'react-icons/md';
import { DeviceDetection } from '../utils/deviceDetection';
import './MessageItem.css';
import './MessageActionsMenu.css';

// Updated parseInlineText function in MessageItem.jsx with improved phone detection
const parseInlineText = (text) => {
  if (!text) return null;
  const tokens = [];
  let i = 0;
  while (i < text.length) {
    // Bold ** or *
    if (text.substr(i, 2) === '**' || text[i] === '*') {
      const isDouble = text.substr(i, 2) === '**';
      const openLen = isDouble ? 2 : 1;
      let j = i + openLen;
      const closeToken = isDouble ? '**' : '*';
      while (j < text.length && (isDouble ? text.substr(j, 2) !== closeToken : text[j] !== closeToken)) j += text[j] === '\\' ? 2 : 1; // Escape handling
      const validClose = isDouble ? j + 2 <= text.length : j < text.length;
      if (validClose && (isDouble || (!isDouble && j > i + 1))) {
        const endIndex = isDouble ? j : j;
        tokens.push(<strong key={tokens.length}>{parseInlineText(text.slice(i + openLen, endIndex))}</strong>);
        i = isDouble ? j + 2 : j + 1;
        continue;
      }
    }
    // Italic _
    else if (text[i] === '_') {
      let j = i + 1;
      while (j < text.length && text[j] !== '_') j += text[j] === '\\' ? 2 : 1;
      if (j < text.length && text[j] === '_') {
        tokens.push(<em key={tokens.length}>{parseInlineText(text.slice(i + 1, j))}</em>);
        i = j + 1;
        continue;
      }
    }
    // Strikethrough ~~ or ~
    else if (text.substr(i, 2) === '~~' || text[i] === '~') {
      const isDouble = text.substr(i, 2) === '~~';
      const openLen = isDouble ? 2 : 1;
      let j = i + openLen;
      const closeToken = isDouble ? '~~' : '~';
      while (j < text.length && (isDouble ? text.substr(j, 2) !== closeToken : text[j] !== closeToken)) j += text[j] === '\\' ? 2 : 1;
      const validClose = isDouble ? j + 2 <= text.length : j < text.length;
      if (validClose && (isDouble || (!isDouble && j > i + 1))) {
        const endIndex = isDouble ? j : j;
        tokens.push(<del key={tokens.length}>{parseInlineText(text.slice(i + openLen, endIndex))}</del>);
        i = isDouble ? j + 2 : j + 1;
        continue;
      }
    }
    // Underline __ (treat as bold italic or custom underline)
    else if (text.substr(i, 2) === '__') {
      let j = i + 2;
      while (j < text.length && text.substr(j, 2) !== '__') j += text[j] === '\\' ? 2 : 1;
      if (j + 2 <= text.length) {
        tokens.push(<u key={tokens.length}>{parseInlineText(text.slice(i + 2, j))}</u>);
        i = j + 2;
        continue;
      }
    }
    // Inline code ` with optional color: `color|text`
    else if (text[i] === '`') {
      let j = i + 1;
      while (j < text.length && text[j] !== '`') j += text[j] === '\\' ? 2 : 1;
      if (j < text.length) {
        const inner = text.slice(i + 1, j);
        const colorMatch = inner.match(/^([^|]+)\|(.*)$/s); // support names, hex, rgb/rgba
        if (colorMatch) {
          const colorToken = colorMatch[1].trim();
          const content = colorMatch[2];
          const isNamed = /^[a-zA-Z]+$/.test(colorToken);
          const className = `inline-highlight${isNamed ? ` color-${colorToken.toLowerCase()}` : ''}`;
          const style = isNamed ? undefined : { backgroundColor: colorToken };
          tokens.push(
            <span key={tokens.length} className={className} style={style}>
              {content}
            </span>
          );
        } else {
          tokens.push(<code key={tokens.length} className="inline-code">{inner}</code>);
        }
        i = j + 1;
        continue;
      }
    }
    // Email detection
    else if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text.slice(i))) {
      const emailMatch = text.slice(i).match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      if (emailMatch) {
        const email = emailMatch[0];
        tokens.push(<a
          key={tokens.length}
          href={`mailto:${email}`}
          className="inline-link"
        >{email}</a>);
        i += email.length;
        continue;
      }
    }
    // Phone number detection (improved to handle numbers starting with 0 or +)
    else if (/[\+]?[0-9][\d\s\-\(\)]{0,15}/.test(text.slice(i))) {
      const phoneMatch = text.slice(i).match(/([\+]?[0-9][\d\s\-\(\)]{7,20})/);
      if (phoneMatch) {
        const phone = phoneMatch[0].replace(/\s/g, ''); // Clean for link
        tokens.push(<a
          key={tokens.length}
          href={`tel:${phone}`}
          className="inline-link"
        >{phoneMatch[0]}</a>);
        i += phoneMatch[0].length;
        continue;
      }
    }
    // URL detection (enhanced)
    else if (/https?:\/\/|www\./.test(text.slice(i))) {
      let urlStart = i;
      let j = i;
      while (j < text.length && !/\s/.test(text[j])) j++;
      const potentialUrl = text.slice(urlStart, j);
      const urlRegex = /(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?/;
      const urlMatch = potentialUrl.match(urlRegex);
      if (urlMatch) {
        const fullUrl = urlMatch[1] ? potentialUrl : `https://${potentialUrl}`;
        tokens.push(<a
          key={tokens.length}
          href={fullUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-link"
        >{potentialUrl}</a>);
        i = j;
        continue;
      }
    }
    // Hashtag #topic
    else if (text[i] === '#' && /[a-zA-Z]/.test(text[i + 1])) {
      let j = i + 1;
      while (j < text.length && /[\w]/.test(text[j])) j++;
      const hashtag = text.slice(i, j);
      tokens.push(<span
        key={tokens.length}
        className="hashtag"
      >{hashtag}</span>);
      i = j;
      continue;
    }
    // Mention @username (already handled, but ensure)
    else if (text[i] === '@' && /[a-zA-Z0-9_]/.test(text[i + 1])) {
      let j = i + 1;
      while (j < text.length && /[a-zA-Z0-9_]/.test(text[j])) j++;
      const mention = text.slice(i, j);
      tokens.push(<span
        key={tokens.length}
        className="mention"
      >{mention}</span>);
      i = j;
      continue;
    }
    // Command /help
    else if (text[i] === '/' && /[a-zA-Z]/.test(text[i + 1])) {
      let j = i + 1;
      while (j < text.length && /\w/.test(text[j])) j++;
      const command = text.slice(i, j);
      tokens.push(<code key={tokens.length} className="inline-code">{command}</code>);
      i = j;
      continue;
    }
    // Money $45.99
    else if (text[i] === '$' && /\d/.test(text[i + 1])) {
      let j = i + 1;
      while (j < text.length && /[\d.,]/.test(text[j])) j++;
      const money = text.slice(i, j);
      tokens.push(<span
        key={tokens.length}
        className="money"
      >{money}</span>);
      i = j;
      continue;
    }
    // Time @12:30pm or similar
    else if (text[i] === '@' && /\d/.test(text[i + 1])) {
      const timeMatch = text.slice(i).match(/(@\d{1,2}:\d{2}(am|pm))/i);
      if (timeMatch) {
        tokens.push(<span
          key={tokens.length}
          className="time-tag"
        >{timeMatch[0]}</span>);
        i += timeMatch[0].length;
        continue;
      }
    }
    // Date patterns like 2025-10-21 or Tomorrow
    else if (/202\d-\d{2}-\d{2}/.test(text.slice(i)) || text.slice(i, i + 8).toLowerCase().includes('tomorrow')) {
      let j = i;
      while (j < text.length && !/\s/.test(text[j])) j++;
      const date = text.slice(i, j);
      tokens.push(<span
        key={tokens.length}
        className="date-tag"
      >{date}</span>);
      i = j;
      continue;
    }
    // Emoji shortcodes (basic, e.g., :smile: → 😄) - use a simple map or library if needed
    else if (text.substr(i, 7) === ':smile:') {
      tokens.push(<span key={tokens.length}>😄</span>);
      i += 7;
      continue;
    } // Add more as needed, or integrate emoji-mart for full support
    tokens.push(text[i]);
    i++;
  }
  return <span>{tokens}</span>;
};

const splitAndFormatLines = (text) => {
  if (!text) return [];
  return text.split('\n').map((line, index) => {
    if (line.startsWith('> ')) {
      return { type: 'quote', content: line.slice(2) };
    } else if (line.startsWith('```')) {
      // Simple code block detection - assume single block for MVP
      const codeEnd = text.indexOf('```', index * 2 + 3);
      if (codeEnd !== -1) {
        const code = text.slice(index * 2 + 3, codeEnd).trim();
        return { type: 'codeblock', content: code, isLast: true };
      }
    }
    return { type: 'text', content: line };
  }).filter(Boolean);
};

export const MessageItem = ({
  message,
  currentUser,
  contact,
  messages,
  enableReadReceipts = true,
  enableReactions = true,
  expandedMessages = {},
  replyingTo,
  editingMessageId,
  onToggleExpand,
  onClick, // Only for regular message clicks (with event)
  onEditSave, // New: For save (id, text)
  onCancelEdit, // New: For cancel
  onReply,
  onNavigateToMessage
}) => {
  const [isSwiping, setIsSwiping] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [showReplyPrompt, setShowReplyPrompt] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [detectedUrls, setDetectedUrls] = useState([]);
  const [showActions, setShowActions] = useState(false);
  const [actionPosition, setActionPosition] = useState({ x: 0, y: 0 });
  const messageRef = useRef(null);
  const editRef = useRef(null);
  const longPressTimer = useRef(null);
  const touchStart = useRef(null);
  
  // Get device-specific gesture config
  const gestureConfig = DeviceDetection.getGestureConfig();

  const isExpanded = expandedMessages[message.id] || false;
  const isLongMessage = message.text && message.text.length > 300;
  const displayContent = isLongMessage && !isExpanded
    ? `${message.text.substring(0, 300)}...`
    : message.text;

  // FIXED: Check both 'sender' and 'sender_id' fields for compatibility
  const messageSender = message.sender || message.sender_id;
  const currentUserId = currentUser?.id || currentUser?.uid;
  const isCurrentUser = messageSender?.toLowerCase() === currentUserId?.toLowerCase();
  const isSelfChat = currentUser?.id === contact?.id;
  const isEditing = editingMessageId === message.id && isCurrentUser;

  // Debug log for message alignment (suppressed in StrictMode to avoid duplicates)
  // Note: React.StrictMode intentionally double-invokes functions in dev mode
  const logKey = `${message.id}-logged`;
  if (process.env.NODE_ENV === 'development' && message.text && !window[logKey]) {
    console.debug('MessageItem debug:', {
      messageId: message.id,
      messageSender,
      currentUserId,
      isCurrentUser,
      messageText: message.text?.substring(0, 30),
    });
    window[logKey] = true; // Mark as logged to prevent duplicates
  }

  // Use forwardedContent if present, else fallback to original
  const displayMessage = message.forwardedContent || message;
  const displayText = displayMessage.text;

  // Extract URLs for preview
  useEffect(() => {
    const extractUrls = (text) => {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      return text ? text.match(urlRegex) || [] : [];
    };

    if (displayText && !isEditing) {
      const urls = extractUrls(displayText);
      setDetectedUrls(urls);
      if (urls.length > 0 && !previewData) {
        const url = urls[0]; // Take the first URL for preview
        setLoadingPreview(true);
        // Use a CORS proxy to fetch the page (note: this is a workaround; in production, use a backend proxy)
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
            // console.error('Link preview fetch error:', err);
            setLoadingPreview(false);
            setPreviewData(null);
          });
      }
    } else {
      setDetectedUrls([]);
      setPreviewData(null);
      setLoadingPreview(false);
    }
  }, [displayText, isEditing, previewData]);

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    
    if (onReply && gestureConfig.enableSwipe) {
      setStartX(touch.clientX);
      setCurrentX(touch.clientX);
    }
    
    // Start long-press timer for mobile
    if (gestureConfig.enableLongPress) {
      longPressTimer.current = setTimeout(() => {
        setIsSwiping(false);
        setShowActions(true);
        setActionPosition({ x: touch.clientX, y: touch.clientY });
        
        // Vibrate if supported
        DeviceDetection.vibrate(50);
      }, gestureConfig.longPressDuration);
    }
  };

  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    
    if (!touchStart.current) return;
    
    const deltaX = touch.clientX - touchStart.current.x;
    const deltaY = touch.clientY - touchStart.current.y;
    
    // If vertical movement > horizontal, it's scrolling - cancel gestures
    if (Math.abs(deltaY) > 20) {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      setIsSwiping(false);
      setCurrentX(0);
      setShowReplyPrompt(false);
      return;
    }
    
    // Horizontal swipe detected
    if (Math.abs(deltaX) > 10 && onReply && gestureConfig.enableSwipe) {
      // Cancel long press when swiping
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      
      setIsSwiping(true);
      setCurrentX(touch.clientX);
      
      const diff = touch.clientX - startX;
      if (diff > 30) {
        setShowReplyPrompt(true);
      } else {
        setShowReplyPrompt(false);
      }
    }
  };

  const handleTouchEnd = () => {
    // Clear long-press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    // Handle swipe-to-reply
    if (isSwiping && onReply) {
      const diff = currentX - startX;
      
      if (diff > gestureConfig.swipeThreshold) {
        onReply(message);
      }
      
      setIsSwiping(false);
      setTimeout(() => {
        setShowReplyPrompt(false);
        setCurrentX(0);
      }, 250);
    }
    
    touchStart.current = null;
  };

  // Right-click handler for desktop
  const handleContextMenu = (e) => {
    if (gestureConfig.enableRightClick) {
      e.preventDefault();
      setShowActions(true);
      setActionPosition({ x: e.clientX, y: e.clientY });
    }
  };

  // Double-click handler for desktop
  const handleDoubleClick = (e) => {
    if (gestureConfig.enableDoubleClick && !isEditing) {
      setShowActions(true);
      setActionPosition({ x: e.clientX, y: e.clientY });
    }
  };

  // Message action handlers
  const handleCopyMessage = () => {
    if (message.text) {
      navigator.clipboard.writeText(message.text);
      setShowActions(false);
    }
  };

  const handleDeleteMessage = () => {
    setShowActions(false);
    // TODO: Implement delete functionality
  };

  const handleStarMessage = () => {
    setShowActions(false);
    // TODO: Implement star functionality
  };

  const handleForwardMessage = () => {
    setShowActions(false);
    // TODO: Implement forward functionality
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  // Close actions menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showActions && messageRef.current && !messageRef.current.contains(e.target)) {
        setShowActions(false);
      }
    };

    if (showActions) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showActions]);

  // Auto-mark sent messages as read when they're displayed
  useEffect(() => {
    // Only mark as read if:
    // 1. This is sent by current user (isCurrentUser)
    // 2. Message status is 'delivered' (not yet 'read')
    // 3. Not a self-chat (those are handled separately)
    // 4. Message has an ID and is_read is false
    if (
      isCurrentUser &&
      message.status === 'delivered' &&
      !isSelfChat &&
      message.id &&
      !message.is_read &&
      enableReadReceipts
    ) {
      console.log('📖 [MessageItem] Auto-marking message as read:', {
        messageId: message.id,
        status: message.status,
        is_read: message.is_read
      });

      // Call the read endpoint
      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      fetch(`${API_BASE}/api/messages/${message.id}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId })
      })
        .then(res => res.json())
        .then(data => {
          console.log('✅ [MessageItem] Message marked as read:', data);
        })
        .catch(err => {
          console.error('❌ [MessageItem] Failed to mark as read:', err);
        });
    }
  }, [message.id, message.status, message.is_read, isCurrentUser, isSelfChat, enableReadReceipts, currentUserId]);

  const getTransform = () => {
    if (!isSwiping || !onReply) return 'translateX(0)';

    const diff = currentX - startX;
    if (diff > 0) {
      return `translateX(${Math.min(diff, 100)}px)`;
    }
    return 'translateX(0)';
  };

  const renderMessageStatus = () => {
    // Always show status for sent messages
    if (!isCurrentUser) {
      return null;
    }

    // Debug log (once per message to avoid spam)
    const debugKey = `msg-status-debug-${message.id}`;
    if (!window[debugKey]) {
      console.log(`📍 Message status check [${message.id.substring(0, 8)}]:`, {
        contactId: contact?.id,
        currentUserId: currentUser?.id,
        messageStatus: message.status,
        messageIsRead: message.is_read,
        contactIdType: typeof contact?.id,
        currentUserIdType: typeof currentUser?.id,
      });
      window[debugKey] = true;
    }

    // 🟦 Case 1: Chatting with yourself — always show blue double ticks
    if (contact.id === currentUser.id) {
      return (
        <span
          className="status-indicator chatme-status-read"
          aria-label="Message read (self-chat)"
          title="Double tick - Blue"
        >
          <MdDoneAll size={16} />
        </span>
      );
    }

    // 🟩 Case 2: Normal chat - determine status: sent → delivered → read
    // Check multiple possible status fields in order of priority
    let status = 'sent'; // Default to sent
    
    if (message.is_read) {
      status = 'read';
    } else if (message.status === 'delivered') {
      status = 'delivered';
    } else if (message.status === 'read') {
      status = 'read';
    } else if (message.status === 'sent') {
      status = 'sent';
    }
    // If no status field at all, keep default 'sent' status
    
    if (status === 'read') {
      // Blue double tick for read messages
      return (
        <span 
          className="status-indicator chatme-status-read" 
          aria-label="Message read"
          title="Double tick - Blue (Read)"
        >
          <MdDoneAll size={16} />
        </span>
      );
    } else if (status === 'delivered') {
      // Grey double tick for delivered but not read messages
      return (
        <span 
          className="status-indicator chatme-status-delivered" 
          aria-label="Message delivered"
          title="Double tick - Grey (Delivered)"
        >
          <MdDoneAll size={16} />
        </span>
      );
    } else {
      // Single grey tick for sent but not delivered
      return (
        <span 
          className="status-indicator chatme-status-sent" 
          aria-label="Message sent"
          title="Single tick - Grey (Sent)"
        >
          <MdDone size={16} />
        </span>
      );
    }
  };


  const renderReactions = (reactions) => {
    if (!enableReactions || !reactions || reactions.length === 0) return null;

    const reactionGroups = reactions.reduce((acc, reaction) => {
      acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
      return acc;
    }, {});

    return (
      <div className="reactions-container">
        {Object.entries(reactionGroups).map(([emoji, count]) => (
          <span key={emoji} className="reaction-bubble">
            {emoji} {count > 1 ? count : ''}
          </span>
        ))}
      </div>
    );
  };

  const getFileIcon = (type) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('word')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('zip') || type.includes('compressed')) return '🗜️';
    if (type.includes('video')) return '🎬';
    return '📎';
  };

  const repliedToMessage = message.replyingTo && messages.find(m => m.id === message.replyingTo);
  const hasReplyContext = !!message.replyContext;

  const handleReplyClick = (e) => {
    e.stopPropagation();
    if (onNavigateToMessage && repliedToMessage) {
      onNavigateToMessage(repliedToMessage, true);
    }
  };

  const formatTimestamp = (timestamp) => {
    try {
      let date;

      if (timestamp instanceof Date && !isNaN(timestamp.getTime())) {
        date = timestamp;
      } else if (typeof timestamp === 'string') {
        const cleaned = timestamp.replace(' at ', ' ');
        date = parse(cleaned, 'd MMMM yyyy HH:mm:SS \'UTC\'XXX', new Date());
      } else if (timestamp && typeof timestamp === 'object') {
        if (timestamp.seconds) {
          date = new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1e6);
        } else if (timestamp._seconds) {
          date = new Date(timestamp._seconds * 1000 + (timestamp._nanoseconds || 0) / 1e6);
        } else {
          date = new Date(timestamp);
        }
      } else {
        date = new Date(timestamp);
      }

      if (isNaN(date.getTime())) {
        // console.warn('Active: Invalid timestamp in MessageItem:', timestamp);
        return 'Invalid Time';
      }
      return format(date, 'h:mm a');
    } catch (error) {
      // console.warn('Error formatting timestamp:', error, 'Timestamp:', timestamp);
      return 'Invalid Time';
    }
  };

  const renderReplyContext = () => {
    // Case A: Original message exists in this 1:1 chat
    if (repliedToMessage) {
      const isReplyingToSelf = repliedToMessage.sender?.toLowerCase() === currentUser?.id?.toLowerCase();
      const senderName = isReplyingToSelf ? 'You' : contact.name;

      const getContentPreview = () => {
        if (repliedToMessage.file) {
          return repliedToMessage.file.name.length > 30
            ? `${repliedToMessage.file.name.substring(0, 27)}...`
            : repliedToMessage.file.name;
        }
        if (repliedToMessage.audio) {
          return 'Voice message';
        }
        if (repliedToMessage.text) {
          return repliedToMessage.text.length > 50
            ? `${repliedToMessage.text.substring(0, 47)}...`
            : repliedToMessage.text;
        }
        return 'Media';
      };

      return (
        <div
          className="reply-preview"
          onClick={handleReplyClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleReplyClick(e);
            }
          }}
          aria-label={`Navigate to original message from ${senderName}`}
        >
          <div className="reply-content">
            <span className="reply-sender">{senderName}</span>
            <span className="reply-text" style={{ whiteSpace: 'pre-wrap' }}>
              {getContentPreview()}
            </span>
            {repliedToMessage.file && (
              <span className="reply-type">📎 {repliedToMessage.file.type.split('/')[1]?.toUpperCase() || 'FILE'}</span>
            )}
            {repliedToMessage.audio && (
              <span className="reply-type">🔊 Audio</span>
            )}
          </div>
        </div>
      );
    }

    // Case B: Fallback to embedded replyContext (e.g., DM from group)
    if (message.replyContext && message.replyContext.fromGroup) {
      const groupName = message.replyContext.groupName || 'Group';
      const text = (message.replyContext.text || '').trim();
      const preview = text.length > 50 ? `${text.substring(0, 47)}...` : (text || 'Message');
      const handleDeepLink = (e) => {
        e.stopPropagation();
        try {
          localStorage.setItem('group_message_deeplink', JSON.stringify({
            groupId: message.replyContext.groupId || null,
            messageId: message.replyContext.id || message.replyContext.messageId || null,
            createdAt: Date.now(),
          }));
        } catch (_) {}
        try {
          window.location.assign('/ConnectMe#groups');
        } catch (_) {
          window.location.hash = '#groups';
        }
      };
      return (
        <div
          className="reply-preview"
          role="link"
          aria-label={`Open original in ${groupName}`}
          onClick={handleDeepLink}
          style={{ cursor: 'pointer' }}
        >
          <div className="reply-content">
            <span className="reply-sender">{`From Group(${groupName})`}</span>
            <span className="reply-text" style={{ whiteSpace: 'pre-wrap' }}>
              {preview}
            </span>
          </div>
        </div>
      );
    }

    return null;
  };

  // New: Render forwarded indicator
  const renderForwardedIndicator = () => {
    if (!message.isForwarded) return null;
    return (
      <div className="forwarded-indicator">
        <FiCornerUpRight className="forward-icon" />
        <span>Forwarded {message.forwardedFromName ? `from ${message.forwardedFromName}` : ''}</span>
      </div>
    );
  };

  const handleEditSave = () => {
    if (editRef.current && onEditSave) {
      const newText = editRef.current.value.trim();
      if (newText) {
        onEditSave(message.id, newText);
      }
    }
  };

  const handleEditCancel = () => {
    if (onCancelEdit) onCancelEdit();
  };

  const renderEditUI = () => {
    if (!isEditing) return null;
    return (
      <div className="message-edit-container">
        <textarea
          ref={editRef}
          defaultValue={message.text}
          className="message-edit-textarea"
          placeholder="Edit message..."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleEditSave();
            }
          }}
        />
        <button className="edit-save-btn" onClick={handleEditSave}>
          <FiCheck />
        </button>
        <button className="edit-cancel-btn" onClick={handleEditCancel}>
          <FiX />
        </button>
      </div>
    );
  };

  const renderFormattedText = () => {
    if (!displayText) return null;
    const lines = splitAndFormatLines(displayText);
    return lines.map((line, idx) => {
      if (line.type === 'quote') {
        return (
          <blockquote key={idx} className="message-quote">
            <p>{parseInlineText(line.content)}</p>
          </blockquote>
        );
      } else if (line.type === 'codeblock') {
        return (
          <pre key={idx} className="message-codeblock">
            <code>{line.content}</code>
          </pre>
        );
      } else {
        return (
          <p key={idx} className="message-paragraph">
            {parseInlineText(line.content)}
          </p>
        );
      }
    });
  };

  const renderLinkPreview = () => {
    if (loadingPreview || detectedUrls.length === 0) return null;
    if (!previewData) {
      // Fallback to simple link if fetch failed
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

  // System message: render special banner row
  if (message?.type === 'system' || message?.sender === 'system') {
    return (
      <div className="system-message-row">
        <div className="system-message-banner" role="status">
          <div className="system-message-text">{message?.text}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={messageRef}
      className={`message ${isCurrentUser ? 'sent' : 'received'} ${message.isPinned ? 'pinned' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onContextMenu={handleContextMenu}
      onDoubleClick={handleDoubleClick}
      style={{
        transform: getTransform(),
        transition: isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
      aria-label={`Message from ${isCurrentUser ? 'you' : contact.name}`}
      id={`message-${message.id}`}
      role="article"
    >
      {showReplyPrompt && onReply && (
        <div className="reply-prompt">
          <div className="reply-prompt-content">
            <FiCornerUpLeft className="reply-icon" />
          </div>
        </div>
      )}

      {/* Message Actions Menu */}
      {showActions && (
        <div 
          className="message-actions-menu"
          style={{
            position: 'fixed',
            top: `${actionPosition.y}px`,
            left: `${actionPosition.x}px`,
            zIndex: 1000
          }}
        >
          {onReply && (
            <button className="action-btn" onClick={() => { onReply(message); setShowActions(false); }}>
              <FiCornerUpLeft /> Reply
            </button>
          )}
          <button className="action-btn" onClick={handleCopyMessage}>
            <FiCopy /> Copy
          </button>
          <button className="action-btn" onClick={handleForwardMessage}>
            <FiShare2 /> Forward
          </button>
          <button className="action-btn" onClick={handleStarMessage}>
            <FiStar /> Star
          </button>
          {isCurrentUser && (
            <button className="action-btn delete" onClick={handleDeleteMessage}>
              <FiTrash2 /> Delete
            </button>
          )}
        </div>
      )}

      <div className="message-content">
        {(repliedToMessage || (message.replyContext && message.replyContext.fromGroup)) && (
          <div className="message-reply-container">
            {renderReplyContext()}
            <div className="reply-border"></div>
          </div>
        )}

        {/* New: Forwarded indicator */}
        {renderForwardedIndicator()}

        <div className="message-body" onClick={isEditing ? undefined : (e) => onClick?.(e, message)}>
          {isEditing ? (
            renderEditUI()
          ) : null}

          {/* Display attachments from attachment_urls (new Supabase structure) - SHOW FIRST */}
          {(message.attachment_urls && message.attachment_urls.length > 0) && (
            <div className="message-attachments">
              {message.attachment_urls.map((attachmentUrl, idx) => {
                const fileMetadata = message.metadata;
                const fileType = fileMetadata?.fileType || '';
                const fileName = fileMetadata?.fileName || 'Attachment';
                const fileSize = fileMetadata?.fileSize || 0;
                const isImage = fileType.startsWith('image/') || attachmentUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                
                return (
                  <div 
                    key={idx} 
                    className={`message-attachment ${isImage ? 'attachment-image' : 'attachment-file'}`}
                  >
                    {isImage ? (
                      <div className="image-attachment-container" style={{ position: 'relative' }}>
                        <img 
                          src={attachmentUrl} 
                          alt={fileName} 
                          className="attachment-image-preview"
                          title={fileName}
                          style={{ 
                            display: 'block',
                            maxWidth: '100%',
                            height: 'auto',
                          }}
                          onError={(e) => {
                            console.error('Failed to load image:', attachmentUrl);
                            e.target.style.display = 'none';
                          }}
                        />
                        
                        {/* Text caption BELOW image with timestamp on same line */}
                        {displayText && !displayText.startsWith('[File]') && (
                          <div className="image-caption-with-footer">
                            <span className="image-caption-text">
                              {parseInlineText(displayText)}
                            </span>
                            <span className="timestamp">{formatTimestamp(message.timestamp)}</span>
                            {renderMessageStatus()}
                          </div>
                        )}
                        
                        {/* If no caption, just show footer below image */}
                        {(!displayText || displayText.startsWith('[File]')) && (
                          <div className="image-footer-only">
                            <span className="timestamp">{formatTimestamp(message.timestamp)}</span>
                            {renderMessageStatus()}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="file-attachment-container">
                        <div className="attachment-file-icon">{getFileIcon(fileType)}</div>
                        <div className="attachment-file-info">
                          <div className="attachment-file-name">{fileName}</div>
                          <div className="attachment-file-meta">
                            {fileSize > 0 ? `${Math.round(fileSize / 1024)} KB` : ''} 
                            {fileType ? ` • ${fileType.split('/')[1]?.toUpperCase() || 'FILE'}` : ''}
                          </div>
                        </div>
                        <a
                          href={attachmentUrl}
                          download={fileName}
                          className="attachment-download-btn"
                          title="Download"
                        >
                          <FiDownload />
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Display text content with inline footer - show only if not just a file message and no image attachment */}
          {displayText && !displayText.startsWith('[File]') && 
            !(message.attachment_urls && message.attachment_urls.length > 0 && 
              (message.metadata?.fileType?.startsWith('image/') || 
               (message.attachment_urls[0] && message.attachment_urls[0].match(/\.(jpg|jpeg|png|gif|webp)$/i)))) && (
            <div className="message-text-with-footer">
              <div className="message-text">
                {renderFormattedText()}
                {isLongMessage && (
                  <button
                    className="expand-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onToggleExpand) {
                        onToggleExpand(message.id);
                      }
                    }}
                    aria-label={isExpanded ? 'Show less' : 'Show more'}
                  >
                    <span className="expand-icon">
                      {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                    </span>
                    <span className="expand-text">{isExpanded ? 'Show less' : 'Show more'}</span>
                  </button>
                )}
              </div>
              {renderLinkPreview()}
              {/* Footer inline with text */}
              <div className="message-footer-inline">
                <span className="timestamp">{formatTimestamp(message.timestamp)}</span>
                {renderMessageStatus()}
              </div>
            </div>
          )}

          {displayMessage.audio && (
            <div className="message-audio">
              <button
                className="play-button"
                onClick={(e) => e.stopPropagation()}
                aria-label="Play audio"
              >
                <i className="fas fa-play"></i>
              </button>
              <div className="audio-waveform">
                <div className="waveform-placeholder"></div>
              </div>
              <span className="audio-duration">{displayMessage.audio.duration}s</span>
            </div>
          )}

          {renderReactions(message.reactions)}
        </div>

        {/* Only show footer outside if no text and no image attachment (text-only messages embed footer, image messages handle it) */}
        {!displayText && !(message.attachment_urls && message.attachment_urls.length > 0 && 
          (message.metadata?.fileType?.startsWith('image/') || 
           (message.attachment_urls[0] && message.attachment_urls[0].match(/\.(jpg|jpeg|png|gif|webp)$/i)))) && (
          <div className="message-footer">
            <span className="timestamp">{formatTimestamp(message.timestamp)}</span>
            {renderMessageStatus()}
          </div>
        )}
      </div>

      {(message.isPinned || message.edited || message.isPrivate) && (
        <div className="message-meta">
          {message.isPinned && <BsPinFill className="pinned-icon" aria-label="Pinned message" />}
          {message.edited && (
            <span className="edited-badge" title={`Edited at ${formatTimestamp(message.editedAt)}`}>
              Edited
            </span>
          )}
          {message.isPrivate && (
            <span className="private-badge" title="Private message">
              {isCurrentUser ? <FiEyeOff /> : <FiEye />}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

MessageItem.propTypes = {
  message: PropTypes.shape({
    id: PropTypes.string.isRequired,
    sender: PropTypes.string.isRequired,
    text: PropTypes.string,
    timestamp: PropTypes.oneOfType([
      PropTypes.instanceOf(Date),
      PropTypes.string,
      PropTypes.shape({ seconds: PropTypes.number, nanoseconds: PropTypes.number })
    ]).isRequired,
    status: PropTypes.oneOf(['sent', 'delivered', 'read']),
    readBy: PropTypes.arrayOf(PropTypes.string),
    reactions: PropTypes.array,
    isPinned: PropTypes.bool,
    isPrivate: PropTypes.bool,
    replyingTo: PropTypes.string,
    edited: PropTypes.bool,
    editedAt: PropTypes.oneOfType([
      PropTypes.instanceOf(Date),
      PropTypes.string,
      PropTypes.shape({ seconds: PropTypes.number, nanoseconds: PropTypes.number })
    ]),
    file: PropTypes.shape({
      name: PropTypes.string,
      type: PropTypes.string,
      size: PropTypes.number,
      url: PropTypes.string
    }),
    audio: PropTypes.shape({
      url: PropTypes.string,
      duration: PropTypes.number
    }),
    isForwarded: PropTypes.bool, // New
    forwardedIndicator: PropTypes.bool, // New
    forwardedFromName: PropTypes.string, // New
    forwardedContent: PropTypes.shape({ // New
      text: PropTypes.string,
      file: PropTypes.object,
      audio: PropTypes.object
    })
  }).isRequired,
  currentUser: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired
  }).isRequired,
  contact: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired
  }).isRequired,
  messages: PropTypes.array.isRequired,
  enableReadReceipts: PropTypes.bool,
  enableReactions: PropTypes.bool,
  expandedMessages: PropTypes.object,
  replyingTo: PropTypes.string,
  editingMessageId: PropTypes.string,
  onToggleExpand: PropTypes.func,
  onClick: PropTypes.func,
  onEditSave: PropTypes.func,
  onCancelEdit: PropTypes.func,
  onReply: PropTypes.func,
  onNavigateToMessage: PropTypes.func
};

export default MessageItem;