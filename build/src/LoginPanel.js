import './LoginPanel.css';
import { useState } from 'react';
import { FiX } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { supabase } from './supabase';

function LoginPanel({ isOpen, onClose, onLogin }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + window.location.pathname,
        },
      });

      clearTimeout(timeoutId);

      if (signInError) throw signInError;

      // Success - panel will close when auth state updates
      onClose();
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

  if (!isOpen) return null;

  return (
    <div className="login-panel-overlay" onClick={onClose}>
      <div className="login-panel" onClick={(e) => e.stopPropagation()}>
        <button className="login-panel-close" onClick={onClose}>
          <FiX size={24} />
        </button>

        <div className="login-panel-content">
          <h2>Welcome to Joblink</h2>

          {error && <div className="login-error">{error}</div>}

          <div className="auth-features">
            <p>Get started with:</p>
            <ul>
              <li>Find amazing job opportunities</li>
              <li>Connect with employers</li>
              <li>Build your professional profile</li>
              <li>Grow your network</li>
            </ul>
          </div>

          <button
            className="google-sign-in-btn"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <FcGoogle size={24} />
            <span>{loading ? 'Signing in...' : 'Continue with Google'}</span>
          </button>

          <p className="login-footer">
            By signing in, you agree to our <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPanel;
