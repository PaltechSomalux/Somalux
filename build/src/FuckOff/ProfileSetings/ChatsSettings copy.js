import React, { useState } from 'react';
import "./ChatsSettings.css";
import { Wallpaper } from "./Wallpaper";
import { FontSize } from "./FontSize";
import { ChatBackup } from "./ChatBackup";
import { ChatHistory } from "./ChatHistory";
import { ArchiveAll } from "./ArchiveAll";
import { ClearAll } from "./ClearAll";

export const ChatsSettings = ({ user }) => {
  const [showWallpaper, setShowWallpaper] = useState(false);
  const [showFontSize, setShowFontSize] = useState(false);
  const [showChatBackup, setShowChatBackup] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [showArchiveAll, setShowArchiveAll] = useState(false);
  const [showClearAll, setShowClearAll] = useState(false);

  return (
    <div className="chats-settings-container">
      {/* Wallpaper Modal */}
      {showWallpaper && (
        <div className="settings-modal">
          <div className="modal-content">
            <Wallpaper 
              currentWallpaper={user.chatWallpaper}
              onClose={() => setShowWallpaper(false)}
            />
          </div>
        </div>
      )}

      {/* Font Size Modal */}
      {showFontSize && (
        <div className="settings-modal">
          <div className="modal-content">
            <FontSize 
              currentSize={user.fontSize}
              onClose={() => setShowFontSize(false)}
            />
          </div>
        </div>
      )}

      {/* Chat Backup Modal */}
      {showChatBackup && (
        <div className="settings-modal">
          <div className="modal-content">
            <ChatBackup 
              lastBackup={user.lastBackup}
              onClose={() => setShowChatBackup(false)}
            />
          </div>
        </div>
      )}

      {/* Chat History Modal */}
      {showChatHistory && (
        <div className="settings-modal">
          <div className="modal-content">
            <ChatHistory 
              currentSetting={user.chatHistory}
              onClose={() => setShowChatHistory(false)}
            />
          </div>
        </div>
      )}

      {/* Archive All Modal */}
      {showArchiveAll && (
        <div className="settings-modal">
          <div className="modal-content">
            <ArchiveAll 
              onClose={() => setShowArchiveAll(false)}
            />
          </div>
        </div>
      )}

      {/* Clear All Modal */}
      {showClearAll && (
        <div className="settings-modal">
          <div className="modal-content">
            <ClearAll 
              onClose={() => setShowClearAll(false)}
            />
          </div>
        </div>
      )}

      {/* Settings List */}
      <div className="settings-section">
        {/* Wallpaper Setting */}
        <div 
          className="settings-item clickable" 
          onClick={() => setShowWallpaper(true)}
        >
          <div className="settings-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#075E54">
              <path d="M19 3H5c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
            </svg>
          </div>
          <div className="settings-content">
            <h3>Chat wallpaper</h3>
            <p>{user.chatWallpaper === 'default' ? 'Default' : 'Custom'}</p>
          </div>
          <div className="settings-arrow">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#075E54">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
          </div>
        </div>
        
        {/* Font Size Setting */}
        <div 
          className="settings-item clickable" 
          onClick={() => setShowFontSize(true)}
        >
          <div className="settings-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#075E54">
              <path d="M9 4v3h5v12h3V7h5V4H9zm-6 8h3v7h3v-7h3V9H3v3z"/>
            </svg>
          </div>
          <div className="settings-content">
            <h3>Font size</h3>
            <p>{user.fontSize === 'small' ? 'Small' : user.fontSize === 'medium' ? 'Medium' : 'Large'}</p>
          </div>
          <div className="settings-arrow">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#075E54">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
          </div>
        </div>
        
        {/* Chat Backup Setting */}
        <div 
          className="settings-item clickable" 
          onClick={() => setShowChatBackup(true)}
        >
          <div className="settings-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#075E54">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
            </svg>
          </div>
          <div className="settings-content">
            <h3>Chat backup</h3>
            <p>Last backup: {user.lastBackup || 'Never'}</p>
          </div>
          <div className="settings-arrow">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#075E54">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
          </div>
        </div>
        
        {/* Chat History Setting */}
        <div 
          className="settings-item clickable" 
          onClick={() => setShowChatHistory(true)}
        >
          <div className="settings-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#075E54">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
            </svg>
          </div>
          <div className="settings-content">
            <h3>Chat history</h3>
            <p>{user.chatHistory === 'keep' ? 'Keep messages' : 'Delete messages'}</p>
          </div>
          <div className="settings-arrow">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#075E54">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
          </div>
        </div>
        
        {/* Archive All Chats Setting */}
        <div 
          className="settings-item clickable" 
          onClick={() => setShowArchiveAll(true)}
        >
          <div className="settings-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#075E54">
              <path d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z"/>
            </svg>
          </div>
          <div className="settings-content">
            <h3>Archive all chats</h3>
          </div>
          <div className="settings-arrow">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#075E54">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
          </div>
        </div>
        
        {/* Clear All Chats Setting */}
        <div 
          className="settings-item clickable" 
          onClick={() => setShowClearAll(true)}
        >
          <div className="settings-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#075E54">
              <path d="M15 4V3H9v1H4v2h1v13c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V6h1V4h-5zm2 15H7V6h10v13z"/>
              <path d="M9 8h2v9H9zm4 0h2v9h-2z"/>
            </svg>
          </div>
          <div className="settings-content">
            <h3>Clear all chats</h3>
          </div>
          <div className="settings-arrow">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#075E54">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};