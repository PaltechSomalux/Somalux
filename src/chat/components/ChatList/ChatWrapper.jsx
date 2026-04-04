import React, { useState } from 'react';
import { Navbar1 } from './Navbar1';
import { ChatMe } from './ChatMe';

export const ChatWrapper = () => {
  const [user, setUser] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    profilePicture: ''
  });
  const [hideMobileNav, setHideMobileNav] = useState(false);

  const handleLogout = () => {
    console.log('Logging out...');
    setUser(null);
  };

  const handleChatSelect = (chat) => {
    console.log('Selected chat:', chat);
  };

  return (
    <div className="app-container">
      <Navbar1 
        user={user} 
        onLogout={handleLogout} 
        hideMobileNav={hideMobileNav}
      />
      
      <main className="main-content">
        <ChatMe 
          onChatSelect={handleChatSelect}
          searchQuery=""
          isMobileView={window.innerWidth < 768}
          setHideMobileNav={setHideMobileNav}
        />
      </main>
    </div>
  );
};