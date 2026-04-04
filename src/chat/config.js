// ChatMe Configuration
// Centralized config for WebSocket and API endpoints

import { API_URL } from '../config'; // Use centralized config

// Helper to determine WebSocket protocol based on current location
function getWebSocketURL(baseURL) {
  if (!baseURL) return null;
  const isSecure = baseURL.startsWith('https');
  const domain = baseURL.replace(/^https?:\/\//, '');
  return `${isSecure ? 'wss' : 'ws'}://${domain}/chatme`;
}

const ENV = process.env.NODE_ENV || 'development';

const API_CONFIG = {
  // Development
  development: {
    WEBSOCKET_URL: getWebSocketURL(API_URL),
    API_BASE: API_URL,
  },
  // Production
  production: {
    WEBSOCKET_URL: getWebSocketURL(API_URL),
    API_BASE: API_URL,
  }
};

const CONFIG = API_CONFIG[ENV] || API_CONFIG.development;

export const WEBSOCKET_URL = CONFIG.WEBSOCKET_URL;
export const API_BASE = CONFIG.API_BASE;

console.log(`🔧 [ChatMe Config] Using ${ENV} environment`);
console.log(`   WebSocket: ${WEBSOCKET_URL}`);
console.log(`   API Base: ${API_BASE}`);

export default CONFIG;
