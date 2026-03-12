import React, { useState, useEffect, useRef } from 'react';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { BookPanel } from '../../Books/BookPanel';
import './Registration.css';

export const Registration = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [touchedFields, setTouchedFields] = useState({});
  const [focusedField, setFocusedField] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [pullStartY, setPullStartY] = useState(null);
  const formRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (formData.password) {
      let strength = 0;
      if (formData.password.length >= 8) strength += 1;
      if (/[A-Z]/.test(formData.password)) strength += 1;
      if (/[0-9]/.test(formData.password)) strength += 1;
      if (/[^A-Za-z0-9]/.test(formData.password)) strength += 1;
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(0);
    }
  }, [formData.password]);

  useEffect(() => {
    if (formData.username.length > 3) {
      const timer = setTimeout(() => {
        const available = !['admin', 'user', 'test'].includes(formData.username.toLowerCase());
        setUsernameAvailable(available);

        if (!available) {
          setErrors((prev) => ({
            ...prev,
            username: 'Username is already taken',
          }));
        } else if (errors.username === 'Username is already taken') {
          setErrors((prev) => ({
            ...prev,
            username: '',
          }));
        }
      }, 500);

      return () => clearTimeout(timer);
    } else {
      setUsernameAvailable(null);
    }
  }, [formData.username, errors.username]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let touchStartY = 0;
    let isDragging = false;

    const handleTouchStart = (e) => {
      if (window.scrollY === 0) {
        touchStartY = e.touches ? e.touches[0].clientY : e.clientY;
        setPullStartY(touchStartY);
        isDragging = true;
      }
    };

    const handleTouchMove = (e) => {
      if (!isDragging) return;
      const touchY = e.touches ? e.touches[0].clientY : e.clientY;
      const pullDistance = touchY - touchStartY;

      if (pullDistance > 0 && window.scrollY === 0) {
        e.preventDefault();
        setIsPulling(pullDistance > 60);
      }
    };

    const handleTouchEnd = () => {
      if (isPulling) {
        window.location.reload();
      }
      setIsPulling(false);
      setPullStartY(null);
      isDragging = false;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('mousedown', handleTouchStart);
    container.addEventListener('mousemove', handleTouchMove);
    container.addEventListener('mouseup', handleTouchEnd);
    container.addEventListener('mouseleave', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('mousedown', handleTouchStart);
      container.removeEventListener('mousemove', handleTouchMove);
      container.removeEventListener('mouseup', handleTouchEnd);
      container.removeEventListener('mouseleave', handleTouchEnd);
    };
  }, [isPulling]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }

    if (name === 'username') {
      setUsernameAvailable(null);
    }
  };

  const handleFocus = (fieldName) => {
    setFocusedField(fieldName);
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouchedFields({
      ...touchedFields,
      [name]: true,
    });
    setFocusedField(null);
    validateField(name);
  };

  const validateField = (fieldName) => {
    const newErrors = { ...errors };
    let isValid = true;

    switch (fieldName) {
      case 'username':
        if (!formData.username.trim()) {
          newErrors.username = 'Username is required';
          isValid = false;
        } else if (formData.username.length < 4) {
          newErrors.username = 'Username must be at least 4 characters';
          isValid = false;
        } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
          newErrors.username = 'Only letters, numbers and underscores allowed';
          isValid = false;
        } else if (usernameAvailable === false) {
          newErrors.username = 'Username is already taken';
          isValid = false;
        } else {
          delete newErrors.username;
        }
        break;

      case 'email':
        if (!formData.email.trim()) {
          newErrors.email = 'Email is required';
          isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'Please enter a valid email';
          isValid = false;
        } else {
          delete newErrors.email;
        }
        break;

      case 'password':
        if (!formData.password) {
          newErrors.password = 'Password is required';
          isValid = false;
        } else if (formData.password.length < 8) {
          newErrors.password = 'Password must be at least 8 characters';
          isValid = false;
        } else if (!/[A-Z]/.test(formData.password)) {
          newErrors.password = 'Include at least one uppercase letter';
          isValid = false;
        } else if (!/[0-9]/.test(formData.password)) {
          newErrors.password = 'Include at least one number';
          isValid = false;
        } else {
          delete newErrors.password;
        }
        break;

      case 'confirmPassword':
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
          isValid = false;
        } else {
          delete newErrors.confirmPassword;
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
    return isValid;
  };

  const validateForm = () => {
    let isValid = true;
    Object.keys(formData).forEach((field) => {
      if (!validateField(field)) {
        isValid = false;
      }
    });
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      setIsSubmitting(true);

      try {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setSuccess(true);
        formRef.current?.reset();
        setTimeout(() => {
          setLoggedIn(true);
        }, 2000);
      } catch (error) {
        console.error('Registration error:', error);
        setErrors({
          ...errors,
          form: 'Registration failed. Please try again later.',
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleGoogleSignIn = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setLoggedIn(true);
      setIsSubmitting(false);
    }, 1000);
  };

  if (loggedIn) {
    return <BookPanel />;
  }

  if (success) {
    return (
      <div className="registration-success-reg" style={{ backgroundColor: '#111b21', color: '#e9edef' }}>
        <div className="success-icon-reg" style={{ color: '#25D366' }}>
          <FiCheck />
        </div>
        <h2>Registration Successful!</h2>
        <div className="welcome-message-reg">
          <p>Welcome to our platform, <span className="highlight-username-reg" style={{ color: '#34B7F1' }}>@{formData.username}</span>.</p>
          <p>Your account has been created successfully.</p>
        </div>
        <div className="loading-redirect-reg">
          <p>Redirecting to books library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="registration-container-reg" ref={containerRef} style={{ backgroundColor: '#111b21' }}>
      <div className={`pull-to-refresh-reg ${isPulling ? 'active-reg' : ''}`}>
        <div className="refresh-spinner-reg" aria-hidden="true"></div>
      </div>
      <div className="registration-card-reg" style={{ backgroundColor: '#2a3942', borderColor: '#2a3942' }}>
        <div className="card-header-reg">
          <h2 style={{ color: '#e9edef' }}>Create Account</h2>
          <p style={{ color: '#8696a0' }}>Into the future</p>
        </div>

        {errors.form && (
          <div className="form-error-reg" style={{ backgroundColor: '#3a4a52', color: '#e9edef' }}>
            <FiAlertCircle className="error-icon-reg" />
            <span>{errors.form}</span>
          </div>
        )}

        <div className="social-login-reg">
          <button
            type="button"
            className="social-btn-reg google-reg"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            style={{
              backgroundColor: '#2a3942',
              color: '#e9edef',
              borderColor: '#3a4a52',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="google-icon-reg">
              <path
                d="M17.64 9.2045C17.64 8.5663 17.5827 7.9527 17.4764 7.3636H9V10.845H13.8436C13.635 11.97 13.0009 12.9231 12.0477 13.5613V15.8195H14.9564C16.6582 14.2527 17.64 11.9454 17.64 9.2045Z"
                fill="#4285F4"
              />
              <path
                d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5613C11.2418 14.1013 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8372 3.96409 10.71H0.957275V13.0418C2.43818 15.9831 5.48182 18 9 18Z"
                fill="#34A853"
              />
              <path
                d="M3.96409 10.71C3.78409 10.17 3.68182 9.5931 3.68182 9C3.68182 8.4069 3.78409 7.83 3.96409 7.29V4.9582H0.957273C0.347727 6.1731 0 7.5477 0 9C0 10.4523 0.347727 11.8269 0.957273 13.0418L3.96409 10.71Z"
                fill="#FBBC05"
              />
              <path
                d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.9582L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z"
                fill="#EA4335"
              />
            </svg>
            {isSubmitting ? 'Signing in...' : 'Continue with Google'}
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate ref={formRef}>
          <div className={`form-group-reg ${errors.username ? 'has-error-reg' : ''}`}>
            <label htmlFor="username" style={{ color: '#e9edef' }}>
              Username <span className="required-reg" style={{ color: '#25D366' }}>*</span>
            </label>
            <div className="input-with-icon-reg">
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                onFocus={() => handleFocus('username')}
                onBlur={handleBlur}
                placeholder="@Username"
                required
                aria-invalid={!!errors.username}
                aria-describedby={errors.username ? 'username-error' : undefined}
                style={{
                  backgroundColor: '#2a3942',
                  borderColor: errors.username ? '#ff4444' : '#3a4a52',
                  color: '#e9edef',
                }}
              />
              {usernameAvailable !== null && formData.username.length >= 4 && (
                <span
                  className={`username-status-reg ${usernameAvailable ? 'available-reg' : 'taken-reg'}`}
                  style={{ color: usernameAvailable ? '#25D366' : '#ff4444' }}
                >
                  {usernameAvailable ? '✓ Available' : '✗ Taken'}
                </span>
              )}
            </div>
            {errors.username && (
              <span id="username-error" className="error-message-reg" style={{ color: '#ff4444' }}>
                <FiAlertCircle className="error-icon-reg" /> {errors.username}
              </span>
            )}
            {focusedField === 'username' && !errors.username && (
              <div className="input-hint-reg" style={{ color: '#8696a0' }}>
                4-20 characters, letters, numbers, and underscores
              </div>
            )}
          </div>

          <div className={`form-group-reg ${errors.email ? 'has-error-reg' : ''}`}>
            <label htmlFor="email" style={{ color: '#e9edef' }}>
              Email Address <span className="required-reg" style={{ color: '#25D366' }}>*</span>
            </label>
            <div className="input-with-icon-reg">
              <input
                placeholder="Enter your email..."
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onFocus={() => handleFocus('email')}
                onBlur={handleBlur}
                required
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                style={{
                  backgroundColor: '#2a3942',
                  borderColor: errors.email ? '#ff4444' : '#3a4a52',
                  color: '#e9edef',
                }}
              />
            </div>
            {errors.email && (
              <span id="email-error" className="error-message-reg" style={{ color: '#ff4444' }}>
                <FiAlertCircle className="error-icon-reg" /> {errors.email}
              </span>
            )}
            {focusedField === 'email' && !errors.email && (
              <div className="input-hint-reg" style={{ color: '#8696a0' }}>
                Enter a valid email address
              </div>
            )}
          </div>

          <div className={`form-group-reg ${errors.password ? 'has-error-reg' : ''}`}>
            <label htmlFor="password" style={{ color: '#e9edef' }}>
              Password <span className="required-reg" style={{ color: '#25D366' }}>*</span>
            </label>
            <div className="input-with-icon-reg">
              <input
                placeholder="Enter your password..."
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onFocus={() => handleFocus('password')}
                onBlur={handleBlur}
                required
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
                style={{
                  backgroundColor: '#2a3942',
                  borderColor: errors.password ? '#ff4444' : '#3a4a52',
                  color: '#e9edef',
                }}
              />
              <button
                type="button"
                className="toggle-password-reg"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{ color: '#8696a0' }}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {errors.password && (
              <span id="password-error" className="error-message-reg" style={{ color: '#ff4444' }}>
                <FiAlertCircle className="error-icon-reg" /> {errors.password}
              </span>
            )}
            {focusedField === 'password' && !errors.password && (
              <div className="input-hint-reg" style={{ color: '#8696a0' }}>
                <div className="password-strength-reg">
                  <div className="strength-bars-reg">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`strength-bar-reg ${passwordStrength >= level ? 'active-reg' : ''} ${
                          passwordStrength >= 3 ? 'strong-reg' : passwordStrength >= 2 ? 'medium-reg' : 'weak-reg'
                        }`}
                        style={{
                          backgroundColor: passwordStrength >= level
                            ? passwordStrength >= 3
                              ? '#25D366'
                              : passwordStrength >= 2
                              ? '#FFC107'
                              : '#FF4444'
                            : '#3a4a52',
                        }}
                      ></div>
                    ))}
                  </div>
                  <span className="strength-text-reg" style={{ color: '#8696a0' }}>
                    {passwordStrength === 0 && 'Password strength'}
                    {passwordStrength === 1 && 'Weak'}
                    {passwordStrength === 2 && 'Medium'}
                    {passwordStrength >= 3 && 'Strong'}
                  </span>
                </div>
                Minimum 8 characters with at least one number and uppercase letter
              </div>
            )}
          </div>

          <div className={`form-group-reg ${errors.confirmPassword ? 'has-error-reg' : ''}`}>
            <label htmlFor="confirmPassword" style={{ color: '#e9edef' }}>
              Confirm Password <span className="required-reg" style={{ color: '#25D366' }}>*</span>
            </label>
            <div className="input-with-icon-reg">
              <input
                placeholder="Re-enter your password..."
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                onFocus={() => handleFocus('confirmPassword')}
                onBlur={handleBlur}
                required
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                style={{
                  backgroundColor: '#2a3942',
                  borderColor: errors.confirmPassword ? '#ff4444' : '#3a4a52',
                  color: '#e9edef',
                }}
              />
              <button
                type="button"
                className="toggle-password-reg"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                style={{ color: '#8696a0' }}
              >
                {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {errors.confirmPassword && (
              <span id="confirmPassword-error" className="error-message-reg" style={{ color: '#ff4444' }}>
                <FiAlertCircle className="error-icon-reg" /> {errors.confirmPassword}
              </span>
            )}
            {focusedField === 'confirmPassword' && !errors.confirmPassword && (
              <div className="input-hint-reg" style={{ color: '#8696a0' }}>
                Must match the password above
              </div>
            )}
          </div>

          <button
            type="submit"
            className={`submit-btn-reg ${isSubmitting ? 'submitting-reg' : ''}`}
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            style={{
              backgroundColor: isSubmitting ? '#008069' : '#00a884',
              color: '#e9edef',
            }}
          >
            {isSubmitting ? (
              <>
                <span className="spinner-reg" aria-hidden="true"></span>
                <span className="sr-only-reg">Processing...</span>
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="login-link-reg" style={{ color: '#8696a0' }}>
          Already have an account?{' '}
          <a
            href="/login"
            className="login-link-text-reg"
            onClick={(e) => {
              e.preventDefault();
              setLoggedIn(true);
            }}
            style={{ color: '#34B7F1' }}
          >
            Sign in
          </a>
        </div>

        <div className="terms-notice-reg" style={{ color: '#8696a0' }}>
          By creating an account, you agree to our{' '}
          <a href="/terms" style={{ color: '#34B7F1' }}>
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" style={{ color: '#34B7F1' }}>
            Privacy Policy
          </a>.
        </div>
      </div>
    </div>
  );
}; 