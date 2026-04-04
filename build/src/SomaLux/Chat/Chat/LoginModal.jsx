import React from 'react';
import { FiX } from 'react-icons/fi';
import './LoginModal.css';

export const LoginModal = ({
  showLogin,
  setShowLogin,
  isAuthenticating = false,
  setIsAuthenticating = () => {},
  authError = '',
  setAuthError = () => {},
  onGoogleSignIn = null,
}) => {
  if (!showLogin) return null;

  const handleGoogleSignIn = async () => {
    // Prevent double clicks
    if (isAuthenticating) return;

    setIsAuthenticating(true);
    setAuthError('');

    try {
      if (onGoogleSignIn) {
        await onGoogleSignIn();
      } else {
        // Firebase sign-in removed - using Supabase auth instead
        throw new Error('Please use onGoogleSignIn prop for Supabase authentication');
      }
      setShowLogin(false);
    } catch (error) {
      // This catches ALL errors including popup closed, blocked, etc.
      if (error.code !== 'auth/popup-closed-by-user') {
        console.error('Google sign-in error:', error);
        setAuthError(error.message || 'Failed to sign in with Google');
      }
      // Always clear error on user cancel — don't show red box
    } finally {
      // Always reset loading state — this prevents the Firebase internal assertion bug
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="login-modal-overlay" onClick={() => setShowLogin(false)}>
      <div
        className="login-modal-inner"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          className="close-btn"
          onClick={() => setShowLogin(false)}
          aria-label="Close"
        >
          <FiX size={22} />
        </button>

        <div className="welcome-title">
          <span className="welcome-main">Welcome</span>
          <span className="welcome-sub">to ChatMe</span>
        </div>

        {authError && <div className="error-message">{authError}</div>}

        <button
          onClick={handleGoogleSignIn}
          disabled={isAuthenticating}
          className="google-button"
        >
          <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path fill="#EA4335" d="M24 9.5c3.9 0 7.1 1.3 9.3 3.1l6.9-6.9C35.6 2.6 30.1 0 24 0 14.7 0 6.9 5.4 3 13.3l7.9 6.1C12.9 13 18 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-2.8-.4-4.1H24v8.1h12.7c-.6 3.2-2.6 5.8-5.6 7.4l8.6 6.6c5-4.6 7.8-11.6 7.8-18z"/>
            <path fill="#FBBC05" d="M10.9 28.9c-.5-1.6-.8-3.2-.8-4.9s.3-3.3.8-4.9L3 13.3C1 17 0 20.9 0 24.8s1 7.8 3 11.5l7.9-6.4z"/>
            <path fill="#34A853" d="M24 48c6.1 0 11.6-2 15.5-5.4l-7.3-5.6c-2.1 1.4-5 2.3-8.2 2.3-6 0-11.1-3.5-13-8.6l-7.9 6.1C6.9 42.6 14.7 48 24 48z"/>
          </svg>
          <span>{isAuthenticating ? 'Signing in…' : 'Continue with Google'}</span>
        </button>

        <p className="legal-text">
          By signing in, you agree to our{' '}
          <a href="/terms" target="_blank" rel="noopener">Terms</a> and{' '}
          <a href="/privacy" target="_blank" rel="noopener">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
};