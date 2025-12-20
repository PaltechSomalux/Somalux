// Centralized configuration for API endpoints
export const API_URL = process.env.REACT_APP_API_URL || 'https://somalux-q2bw.onrender.com';

console.log('🔧 API Configuration:', {
  NODE_ENV: process.env.NODE_ENV,
  API_URL: API_URL,
  isProduction: process.env.NODE_ENV === 'production'
});
