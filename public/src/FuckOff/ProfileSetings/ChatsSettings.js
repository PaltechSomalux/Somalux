import React, { useState, useEffect } from 'react';
import "./ChatsSettings.css";
import {WallpaperUI} from "../../Kiss/Wallpaper";

export const ChatsSettings = ({ user, onWallpaperChange = () => {} }) => {
  const [showWallpaper, setShowWallpaper] = useState(false);
  const [currentWallpaper, setCurrentWallpaper] = useState(
    user.chatWallpaper || 'default'
  );

  useEffect(() => {
    // Update the wallpaper when it changes
    if (user.chatWallpaper !== currentWallpaper) {
      setCurrentWallpaper(user.chatWallpaper || 'default');
    }
  }, [user.chatWallpaper]);

  // If showWallpaper is true, render only the Wallpaper component
  if (showWallpaper) { 
    return (
      <WallpaperUI
        currentWallpaper={currentWallpaper}
        onClose={() => setShowWallpaper(false)}
        onSelect={(wallpaper) => {
          setCurrentWallpaper(wallpaper.id);
          onWallpaperChange(wallpaper.id);
          setShowWallpaper(false);
        }}
      />
    );
  }

  // Get the current wallpaper name for display
  const getWallpaperName = () => {
    switch(currentWallpaper) {
      case 'default': return 'Default';
      case 'solid_white': return 'Solid White';
      case 'solid_black': return 'Solid Black';
      case 'gradient_blue': return 'Blue Gradient';
      case 'gradient_purple': return 'Purple Gradient';
      case 'gradient_sunset': return 'Sunset';
      case 'gradient_green': return 'Green';
      default: 
        // Check if it's a custom wallpaper (starts with 'custom_')
        if (currentWallpaper.startsWith('custom_')) {
          return 'Custom Wallpaper';
        }
        return 'Default';
    }
  };

  return (
    <div className="chats-settings-container">
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
            <p>{getWallpaperName()}</p>
          </div>
          <div className="settings-arrow">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#075E54">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
          </div>
        </div>
        
        {/* Font Size Setting */}
        <div className="settings-item clickable">
          <div className="settings-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#075E54">
              <path d="M3 12h3v7h3v-7h3V9H3v3zm15-5h-3v12h3V7z"/>
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
        <div className="settings-item clickable">
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
        <div className="settings-item clickable">
          <div className="settings-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#075E54">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
              <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
            </svg>
          </div>
          <div className="settings-content">
            <h3>Chat history</h3>
            <p>Keep messages</p>
          </div>
          <div className="settings-arrow">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#075E54">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
          </div>
        </div>
        
        {/* Archive All Chats Setting */}
        <div className="settings-item clickable">
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
        <div className="settings-item clickable">
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