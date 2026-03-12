import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

export const Logout = ({ onLogout, redirectPath = '/login', showLoadingMessage = true }) => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const performLogout = async () => {
      try {
        setIsLoggingOut(true);
        setError(null);
        
        // Call the logout function if provided
        if (typeof onLogout === 'function') {
          await onLogout();
        }

        // Only navigate if component is still mounted
        if (isMounted) {
          navigate(redirectPath, { replace: true });
        }
      } catch (err) {
        if (isMounted) {
          setError('Logout failed. Please try again.');
          console.error('Logout failed:', err);
          // Still redirect even if logout failed
          navigate(redirectPath, { replace: true });
        }
      } finally {
        if (isMounted) {
          setIsLoggingOut(false);
        }
      }
    };

    performLogout();

    return () => {
      isMounted = false;
    };
  }, [onLogout, navigate, redirectPath]);

  if (!showLoadingMessage) {
    return null;
  }

  return (
    <div className="logout-container" style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      textAlign: 'center'
    }}>
      <div className="logout-message">
        {isLoggingOut ? (
          <>
            <h2>Logging out...</h2>
            <p>Please wait while we securely log you out</p>
          </>
        ) : error ? (
          <>
            <h2>Error</h2>
            <p>{error}</p>
          </>
        ) : null}
      </div>
    </div>
  );
};

Logout.propTypes = {
  onLogout: PropTypes.func,
  redirectPath: PropTypes.string,
  showLoadingMessage: PropTypes.bool
};