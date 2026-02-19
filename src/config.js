// Centralized configuration for API endpoints
const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';

// Determine API URL based on environment
let defaultApiUrl;
if (isDevelopment) {
  // Local development: use localhost
  defaultApiUrl = 'http://localhost:5000';
} else {
  // Production: use same domain as frontend (backend served on same domain)
  // or use explicit domain if provided via environment variable
  defaultApiUrl = window.location.origin; // Use same domain as frontend
}

export const API_URL = process.env.REACT_APP_API_URL || defaultApiUrl;

console.log('🔧 API Configuration:', {
  NODE_ENV: process.env.NODE_ENV,
  isDevelopment,
  defaultApiUrl,
  API_URL: API_URL || '(using relative paths)',
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  isProduction: process.env.NODE_ENV === 'production',
  currentOrigin: typeof window !== 'undefined' ? window.location.origin : 'N/A'
});
