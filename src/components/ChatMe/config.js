// ChatMe Configuration
// Centralized config for WebSocket and API endpoints

const API_CONFIG = {
  // Development
  development: {
    WEBSOCKET_URL: 'ws://localhost:5000/chatme',
    API_BASE: 'http://localhost:5000',
  },
  // Production
  production: {
    WEBSOCKET_URL: process.env.REACT_APP_WEBSOCKET_URL || 'wss://somalux.co.ke/chatme',
    API_BASE: process.env.REACT_APP_API_BASE || 'https://somalux.co.ke',
  }
};

const ENV = process.env.NODE_ENV || 'development';
const CONFIG = API_CONFIG[ENV] || API_CONFIG.development;

export const WEBSOCKET_URL = CONFIG.WEBSOCKET_URL;
export const API_BASE = CONFIG.API_BASE;

console.log(`🔧 [ChatMe Config] Using ${ENV} environment`);
console.log(`   WebSocket: ${WEBSOCKET_URL}`);
console.log(`   API Base: ${API_BASE}`);

export default CONFIG;
