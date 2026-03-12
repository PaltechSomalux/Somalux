// Components/TimeFormatters.js
import React, { useEffect } from 'react'; // FIXED: Import useEffect

// FIXED: Format time for chat list display using absolute timestamps
export const FormatTime = (timestamp) => {
  if (!timestamp || isNaN(new Date(timestamp).getTime())) {
    return 'Never';
  }
  
  const messageDate = new Date(timestamp);
  const now = new Date();
  const diffInMs = now - messageDate;
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  
  // console.log(`⏰ FormatTime(${timestamp.toLocaleString()}): diff=${diffInDays}d ${diffInHours}h ${diffInMinutes}m`);
  
  // Today - show actual time (12-hour format)
  if (diffInDays === 0) {
    return messageDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  } 
  // Yesterday
  else if (diffInDays === 1) {
    return 'Yesterday';
  } 
  // This week - show day name
  else if (diffInDays < 7) {
    return messageDate.toLocaleDateString('en-US', { weekday: 'short' });
  } 
  // Older - show date
  else {
    return messageDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }
};

// Format time for individual messages (24-hour format)
export const FormatMessageTime = (timestamp) => {
  if (!timestamp || isNaN(new Date(timestamp).getTime())) {
    return '00:00';
  }
  
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

// Format relative time for last seen status
export const FormatLastSeen = (timestamp) => {
  if (!timestamp || isNaN(new Date(timestamp).getTime())) {
    return 'Never';
  }
  
  const now = new Date();
  const diffInMs = now - new Date(timestamp);
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else {
    return new Date(timestamp).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }
};

// Enhanced time display component
export const TimeDisplay = ({ 
  timestamp, 
  format = 'chatlist', 
  className = '',
  showTooltip = true 
}) => {
  if (!timestamp || isNaN(new Date(timestamp).getTime())) {
    return <span className={`chatme-time ${className}`}>—</span>;
  }
  
  const formattedTime = format === 'chatlist' 
    ? FormatTime(timestamp) 
    : FormatMessageTime(timestamp);
    
  const fullDateTime = new Date(timestamp).toLocaleString();
  
  return (
    <time 
      dateTime={timestamp} 
      className={`chatme-time ${className}`}
      title={showTooltip ? fullDateTime : ''}
    >
      {formattedTime}
    </time>
  );
};

// FIXED: log component with proper useEffect import
export const Timestamplogger = ({ chats }) => {
  useEffect(() => {
    if (chats && chats.length > 0) {
      console.table(
        chats.map(chat => ({
          'Chat Name': chat.name,
          'Display Time': chat.time,
          'Last Activity': chat.lastActivity ? new Date(chat.lastActivity).toLocaleString() : 'N/A',
          'Timestamp (ms)': chat.lastActivity ? new Date(chat.lastActivity).getTime() : 'N/A',
          'Messages': chat.messages?.length || 0,
          'Last Message': chat.messages?.[chat.messages.length - 1]?.timestamp ? 
            new Date(chat.messages[chat.messages.length - 1].timestamp).toLocaleString() : 'N/A',
          'Unread': chat.unreadCount || 0,
          'Pinned': chat.isPinned ? 'Yes' : 'No'
        }))
      );
      
      // Additional console log for timestamp verification
      console.log('🔍 Timestamplogger - Detailed breakdown:');
      chats.forEach((chat, index) => {
        const lastActivity = chat.lastActivity ? new Date(chat.lastActivity) : null;
        const lastMessageTime = chat.messages?.[chat.messages.length - 1]?.timestamp ? 
          new Date(chat.messages[chat.messages.length - 1].timestamp) : null;
        
        console.log(`  ${index + 1}. ${chat.name.padEnd(15)} | Display: ${chat.time?.padEnd(12)} | Last Activity: ${lastActivity?.toLocaleString().padEnd(25)} | Matches Last Message: ${lastActivity?.getTime() === lastMessageTime?.getTime()}`);
      });
    }
  }, [chats]);
  
  return null;
};

// Utility function to validate and fix timestamps
export const validateTimestamps = (chats) => {
  return chats.map(chat => {
    // Ensure lastActivity is a valid date
    const validLastActivity = chat.lastActivity && !isNaN(new Date(chat.lastActivity).getTime()) 
      ? new Date(chat.lastActivity) 
      : new Date();
    
    // Ensure messages have valid timestamps
    const validMessages = (chat.messages || []).map(msg => ({
      ...msg,
      timestamp: msg.timestamp && !isNaN(new Date(msg.timestamp).getTime()) 
        ? new Date(msg.timestamp) 
        : new Date()
    }));
    
    return {
      ...chat,
      lastActivity: validLastActivity,
      messages: validMessages
    };
  });
};

// Export default for easy import
export default {
  FormatTime,
  FormatMessageTime,
  FormatLastSeen,
  TimeDisplay,
  Timestamplogger,
  validateTimestamps
};