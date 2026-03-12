import React, { useState, useEffect, useRef } from 'react';
import { 
  PaperPlaneRight, X, Phone, DotsThree, Paperclip,
  CheckCircle, Circle
} from 'phosphor-react';
import { createClient } from '@supabase/supabase-js';
import './RentalChat.css';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

export const RentalChat = ({ user, landlordId, landlordName, listingTitle, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const messagesEndRef = useRef(null);
  const chatId = `${user.uid}_${landlordId}_chat`;

  useEffect(() => {
    loadMessages();
    subscribeToMessages();
    
    // Check landlord online status (simulated)
    checkOnlineStatus();
    const interval = setInterval(checkOnlineStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('rental_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const subscribeToMessages = () => {
    const subscription = supabase
      .channel(`rental_chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'rental_messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const checkOnlineStatus = () => {
    // In real app, check from presence table
    setIsOnline(Math.random() > 0.5); // Simulated
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const messageData = {
        chat_id: chatId,
        sender_id: user.uid,
        receiver_id: landlordId,
        message: newMessage.trim(),
        listing_title: listingTitle,
        is_read: false,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('rental_messages')
        .insert([messageData]);

      if (error) throw error;

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const initiateCall = () => {
    // Open WhatsApp or direct call
    window.open(`tel:${landlordId}`, '_blank');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <div className="rental-chat-modal">
      <div className="rental-chat-container">
        {/* Chat Header */}
        <div className="chat-header">
          <div className="chat-header-info">
            <div className="landlord-avatar">
              {landlordName.charAt(0).toUpperCase()}
            </div>
            <div className="landlord-details">
              <h4>{landlordName}</h4>
              <div className="online-status">
                {isOnline ? (
                  <>
                    <CheckCircle size={12} weight="fill" color="#00a884" />
                    <span>Online</span>
                  </>
                ) : (
                  <>
                    <Circle size={12} color="#8696a0" />
                    <span>Offline</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="chat-header-actions">
            <button className="chat-action-btn" onClick={initiateCall}>
              <Phone size={20} />
            </button>
            <button className="chat-action-btn">
              <DotsThree size={20} weight="bold" />
            </button>
            <button className="chat-action-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Listing Context */}
        <div className="chat-context">
          <span className="context-label">About:</span>
          <span className="context-title">{listingTitle}</span>
        </div>

        {/* Messages Area */}
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="chat-empty">
              <p>Start a conversation about this property</p>
              <p className="hint">Ask about availability, rent, or schedule a viewing</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`message ${msg.sender_id === user.uid ? 'sent' : 'received'}`}
              >
                <div className="message-bubble">
                  <p>{msg.message}</p>
                  <span className="message-time">{formatTime(msg.created_at)}</span>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Replies */}
        {messages.length === 0 && (
          <div className="quick-replies">
            <button onClick={() => setNewMessage("Hi! Is this property still available?")}>
              Is it available?
            </button>
            <button onClick={() => setNewMessage("Can I schedule a viewing?")}>
              Schedule viewing
            </button>
            <button onClick={() => setNewMessage("What's included in the rent?")}>
              What's included?
            </button>
          </div>
        )}

        {/* Input Area */}
        <form className="chat-input-area" onSubmit={sendMessage}>
          <button type="button" className="attach-btn">
            <Paperclip size={20} />
          </button>
          
          <input
            type="text"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sending}
          />
          
          <button type="submit" className="send-btn" disabled={!newMessage.trim() || sending}>
            <PaperPlaneRight size={20} weight={sending ? 'regular' : 'fill'} />
          </button>
        </form>
      </div>
    </div>
  );
};

// Migration for rental_messages table - add this to your SQL
/*
CREATE TABLE IF NOT EXISTS rental_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id TEXT NOT NULL,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  receiver_id UUID NOT NULL REFERENCES auth.users(id),
  message TEXT NOT NULL,
  listing_title TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rental_messages_chat ON rental_messages(chat_id);
CREATE INDEX idx_rental_messages_sender ON rental_messages(sender_id);
CREATE INDEX idx_rental_messages_receiver ON rental_messages(receiver_id);

-- Enable RLS
ALTER TABLE rental_messages ENABLE ROW LEVEL SECURITY;

-- Users can see messages they sent or received
CREATE POLICY "Users can view their messages" ON rental_messages
  FOR SELECT USING (
    sender_id = auth.uid() OR receiver_id = auth.uid()
  );

-- Users can send messages
CREATE POLICY "Users can send messages" ON rental_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
  );

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE rental_messages;
*/
