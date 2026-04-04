import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { supabase } from '../../../supabase';
import './LoginModal.css';

export const LoginModal = ({
  showLogin,
  setShowLogin,
  isAuthenticating = false,
  setIsAuthenticating = () => {},
  authError = '',
  setAuthError = () => {},
  onGoogleSignIn = null,
  action = 'action',
}) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(authError);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15sec timeout
      
      const { data, error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + window.location.pathname,
        },
      });

      clearTimeout(timeoutId);

      if (signInError) throw signInError;
      
      // Success callback will be handled by auth state change listener
      setShowLogin(false);
    } catch (err) {
      console.error('Sign in error:', err);
      if (err?.name === 'AbortError') {
        setError('Sign in took too long. Please try again.');
      } else {
        setError(err.message || 'Failed to sign in. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {showLogin && (
        <motion.div
          className="auth-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowLogin(false)}
        >
          <motion.div
            className="auth-modal-content"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="auth-modal-close" onClick={() => setShowLogin(false)}>
              <FiX size={24} />
            </button>

            <div className="auth-container">
              <h3>Sign in to:</h3>
              <ul className="auth-features">
                <li>Chat with friends and groups</li>
                <li>Share messages and media</li>
                <li>Send and receive calls</li>
                <li>Stay connected in real-time</li>
              </ul>

              {error && <div className="auth-error">{error}</div>}

              <button
                className="google-sign-in-btn"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <FcGoogle size={24} />
                <span>{loading ? 'Signing in...' : 'Continue with Google'}</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};