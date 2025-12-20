import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { supabase } from './supabaseClient';
import './AuthModal.css';

export const AuthModal = ({ isOpen, onClose, onSuccess, action = 'action' }) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const getActionMessage = () => {
    const messages = {
      'view': 'view book details',
      'like': 'like this book',
      'comment': 'add a comment',
      'download': 'download this book',
      'share': 'share this book',
      'action': 'continue with this action'
    };
    return messages[action] || messages['action'];
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { data, error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + window.location.pathname,
        },
      });

      if (signInError) throw signInError;
      
      // Success callback will be handled by auth state change listener
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err.message || 'Failed to sign in. Please try again.');
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="auth-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="auth-modal-content"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="auth-modal-close" onClick={onClose}>
              <FiX size={24} />
            </button>

            <div className="auth-modal-header">
              <h3>Sign in Required</h3>
            </div>

            <div className="auth-modal-body">
              <button
                className="google-sign-in-btn"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <FcGoogle size={24} />
                <span>{loading ? 'Signing in...' : 'Continue with Google'}</span>
              </button>

              {error && <div className="auth-error">{error}</div>}
 
              <div className="auth-benefits">
                <h3>Sign in to:</h3>
                <ul>
                  <li>Download and read books</li>
                  <li>Comment and interact with others</li>
                  <li>Save your favorites and reading history</li>
                  <li>Get personalized recommendations</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
