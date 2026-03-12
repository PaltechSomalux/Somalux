import React, { useState, useEffect, createContext, useContext } from 'react';
import { UserCircle } from "phosphor-react";
import "./UserProfile.css";

// Create auth context
const UserProfileAuthContext = createContext();

const UserProfileAuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        setIsLoggedIn(true);
      } catch (error) {
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  const mockAuth = {
    signInWithEmailAndPassword: async (email, password) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (email === 'user@gmail.com' && password === '123') {
            const user = { 
              email, 
              uid: 'user1',
              name: 'Demo User',
              avatar: 'https://i.pravatar.cc/150?img=3' 
            };
            localStorage.setItem('currentUser', JSON.stringify(user));
            resolve(user);
          } else {
            reject(new Error('Invalid email or password'));
          }
        }, 1000);
      });
    },
    signOut: async () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          localStorage.removeItem('currentUser');
          resolve();
        }, 500);
      });
    }
  };

  const login = async (email, password) => {
    setIsAuthenticating(true);
    setAuthError('');

    try {
      const user = await mockAuth.signInWithEmailAndPassword(email, password);
      setCurrentUser(user);
      setIsLoggedIn(true);
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const logout = async () => {
    try {
      await mockAuth.signOut();
      setCurrentUser(null);
      setIsLoggedIn(false);
    } catch (error) {
      setAuthError(error.message);
    }
  };

  return (
    <UserProfileAuthContext.Provider value={{
      currentUser,
      authError,
      isAuthenticating,
      isLoggedIn,
      login,
      logout,
      setAuthError
    }}>
      {children}
    </UserProfileAuthContext.Provider>
  );
};

const useUserProfileAuth = () => {
  const context = useContext(UserProfileAuthContext);
  if (!context) {
    throw new Error('useUserProfileAuth must be used within UserProfileAuthProvider');
  }
  return context;
};

// Main UserProfile component that uses the auth context
const UserProfileContent = ({ 
  size = 32, 
  isMobile = false,
  className = '',
  onProfileClick,
  activeTab,
  setActiveTab = () => {}
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState('user@gmail.com');
  const [loginPassword, setLoginPassword] = useState('123');
  const [showLoginForm, setShowLoginForm] = useState(false);
  
  const {
    currentUser,
    isLoggedIn,
    login,
    logout,
    authError,
    isAuthenticating
  } = useUserProfileAuth();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => {
    setIsMenuOpen(false);
    setShowLoginForm(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.user-avatar-container')) {
        closeMenu();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProfileAction = () => {
    setActiveTab('user');
    closeMenu();
    onProfileClick?.();
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    login(loginEmail, loginPassword);
  };

  const handleLogout = () => {
    logout();
    closeMenu();
  };

  return (
    <div className={`user-avatar-container ${className}`}>
      <button 
        className={`user-avatar-button ${isMenuOpen ? 'active' : ''} ${activeTab === 'user' ? 'tab-active' : ''}`}
        onClick={toggleMenu}
        aria-label="User menu"
      >
        {currentUser?.avatar ? (
          <img 
            src={currentUser.avatar} 
            alt={currentUser.name || 'User'} 
            className="avatar-image"
            onError={(e) => {
              e.target.onerror = null; 
              e.target.style.display = 'none';
            }}
            style={{ width: size, height: size }}
          />
        ) : (
          <UserCircle size={24} weight="fill" color="#aebac1" />
        )}
      </button>

      <div className={`user-panel ${isMenuOpen ? 'open' : ''} ${isMobile ? 'mobile' : 'desktop'}`}>
        {isLoggedIn ? (
          <>
            <div className="user-name">{currentUser?.name || 'User'}</div>
            <div className="user-email">{currentUser?.email || 'user@example.com'}</div>
            
            <button 
              className="panel-item" 
              onClick={handleProfileAction}
            >
              My Profile
            </button>
            
            <button 
              className="panel-item" 
              onClick={handleLogout}
              disabled={isAuthenticating}
            >
              {isAuthenticating ? 'Logging out...' : 'Logout'}
            </button>
          </>
        ) : (
          <>
            <div className="user-name">Guest</div>
            
            {showLoginForm ? (
              <form onSubmit={handleLoginSubmit} className="login-form">
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="Email"
                  required
                  className="panel-input"
                />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="panel-input"
                />
                <button 
                  type="submit"
                  className="panel-item primary"
                  disabled={isAuthenticating}
                >
                  {isAuthenticating ? 'Logging in...' : 'Login'}
                </button>
                <button
                  type="button"
                  className="panel-item secondary"
                  onClick={() => setShowLoginForm(false)}
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button 
                className="panel-item primary" 
                onClick={() => setShowLoginForm(true)}
              >
                Login
              </button>
            )}
          </>
        )}
        
        {authError && (
          <div className="auth-error">{authError}</div>
        )}
      </div>
    </div>
  );
};

// Export the main component wrapped with the provider
export const UserProfile = (props) => {
  return (
    <UserProfileAuthProvider>
      <UserProfileContent {...props} />
    </UserProfileAuthProvider>
  );
};