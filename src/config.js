// Centralized configuration for API endpoints
const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
// Use relative API paths (will use same domain as frontend) or localhost for dev
const defaultApiUrl = isDevelopment ? 'http://localhost:5000' : '';
export const API_URL = process.env.REACT_APP_API_URL || defaultApiUrl;

console.log('🔧 API Configuration:', {
  NODE_ENV: process.env.NODE_ENV,
  isDevelopment,
  defaultApiUrl,
  API_URL: API_URL || '(using relative paths)',
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  isProduction: process.env.NODE_ENV === 'production'
});
