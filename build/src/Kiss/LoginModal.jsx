import React from 'react';
import PropTypes from 'prop-types';
import { FiMail, FiKey, FiX } from 'react-icons/fi';
import "./LoginModal.css";

export const LoginModal = ({
  showLogin,
  setShowLogin,
  loginCredentials,
  setLoginCredentials,
  authError,
  authSuccess,
  isAuthenticating,
  onLogin,
  loginModalRef, // Added this prop
  setAuthError, // Added this prop
  setAuthSuccess // Added this prop
}) => {
  if (!showLogin) return null;

  return (
    <div className="login-modal floating-panel" ref={loginModalRef}>
      <div className="login-header">
        <h2>Login</h2>
        <button 
          onClick={() => {
            setShowLogin(false);
            setAuthError('');
            setAuthSuccess('');
          }}
          aria-label="Close login"
        >
          <FiX />
        </button>
      </div>

      <form onSubmit={onLogin}>
        {authError && <div className="auth-error">{authError}</div>}
        {authSuccess && <div className="auth-success">{authSuccess}</div>}

        <div className="input-group">
          <label>
            <FiMail /> Email
          </label>
          <input
            type="email"
            value={loginCredentials.email}
            onChange={(e) => setLoginCredentials(prev => ({ ...prev, email: e.target.value }))}
            placeholder="Enter your email"
            required
          />
        </div>

        <div className="input-group">
          <label>
            <FiKey /> Password
          </label>
          <input
            type="password"
            value={loginCredentials.password}
            onChange={(e) => setLoginCredentials(prev => ({ ...prev, password: e.target.value }))}
            placeholder="Enter your password"
            required
          />
        </div>

        <button 
          type="submit" 
          className="login-button"
          disabled={isAuthenticating}
        >
          {isAuthenticating ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div className="login-footer">
        <p>Don't have an account? <button className="text-button">Sign up</button></p>
        <button className="text-button">Forgot password?</button>
      </div>
    </div>
  );
};

LoginModal.propTypes = {
  showLogin: PropTypes.bool.isRequired,
  setShowLogin: PropTypes.func.isRequired,
  loginCredentials: PropTypes.object.isRequired,
  setLoginCredentials: PropTypes.func.isRequired,
  authError: PropTypes.string,
  authSuccess: PropTypes.string,
  isAuthenticating: PropTypes.bool,
  onLogin: PropTypes.func.isRequired,
  loginModalRef: PropTypes.oneOfType([
    PropTypes.func, 
    PropTypes.shape({ current: PropTypes.instanceOf(Element) })
  ]),
  setAuthError: PropTypes.func.isRequired,
  setAuthSuccess: PropTypes.func.isRequired
};