import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
 
  // Initialize auth state (e.g., check localStorage for persisted session)
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

  // Mock auth functions
  const mockAuth = {
    signInWithEmailAndPassword: async (email, password) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (email === 'user@gmail.com' && password === '123') {
            const user = { email, uid: 'user1' };
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
    },
    updateEmail: async (user, newEmail) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const updatedUser = { ...user, email: newEmail };
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
          resolve(updatedUser);
        }, 1000);
      });
    },
    updatePassword: async () => {
      return new Promise((resolve) => {
        setTimeout(() => resolve(), 1000);
      });
    },
    deleteUser: async () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          localStorage.removeItem('currentUser');
          resolve();
        }, 1000);
      });
    },
    reauthenticateWithCredential: async (email, password) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (email === 'user@gmail.com' && password === '123') {
            resolve();
          } else {
            reject(new Error('Reauthentication failed'));
          }
        }, 500);
      });
    }
  };

  const login = async (email, password) => {
    setIsAuthenticating(true);
    setAuthError('');
    setAuthSuccess('');

    try {
      const user = await mockAuth.signInWithEmailAndPassword(email, password);
      setCurrentUser(user);
      setIsLoggedIn(true);
      setAuthSuccess('Logged in successfully!');
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
      setAuthSuccess('Logged out successfully!');
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const updateEmail = async (newEmail, password) => {
    if (!newEmail || newEmail === currentUser?.email) return;
    
    setIsAuthenticating(true);
    setAuthError('');
    setAuthSuccess('');

    try {
      await mockAuth.reauthenticateWithCredential(currentUser.email, password);
      const updatedUser = await mockAuth.updateEmail(currentUser, newEmail);
      setCurrentUser(updatedUser);
      setAuthSuccess('Email updated successfully!');
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const updatePassword = async (currentPassword, newPassword) => {
    if (!currentPassword || !newPassword) {
      setAuthError('Please fill all fields');
      return;
    }
    
    setIsAuthenticating(true);
    setAuthError('');
    setAuthSuccess('');

    try {
      await mockAuth.reauthenticateWithCredential(currentUser.email, currentPassword);
      await mockAuth.updatePassword();
      setAuthSuccess('Password updated successfully!');
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const deactivateAccount = async (password) => {
    setIsAuthenticating(true);
    setAuthError('');
    setAuthSuccess('');

    try {
      await mockAuth.reauthenticateWithCredential(currentUser.email, password);
      await mockAuth.deleteUser();
      setCurrentUser(null);
      setIsLoggedIn(false);
      setAuthSuccess('Account deactivated successfully!');
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const value = {
    currentUser,
    authError,
    authSuccess,
    isAuthenticating,
    isLoggedIn,
    login,
    logout,
    updateEmail,
    updatePassword,
    deactivateAccount,
    setAuthError,
    setAuthSuccess
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook with proper error handling
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};