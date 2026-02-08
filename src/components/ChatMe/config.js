// ChatMe Configuration
// Centralized config for WebSocket and API endpoints

// Helper to determine WebSocket protocol based on current location
function getWebSocketURL(baseURL) {
  if (!baseURL) return null;
  const isSecure = baseURL.startsWith('https');
  const domain = baseURL.replace(/^https?:\/\//, '');
  return `${isSecure ? 'wss' : 'ws'}://${domain}/chatme`;
}

// Helper to get API base URL with proper protocol
function getAPIBase() {
  // Use environment variable if available
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  // Fallback to localhost for development
  return 'http://localhost:5000';
}

const ENV = process.env.NODE_ENV || 'development';
const apiBaseUrl = getAPIBase();

const API_CONFIG = {
  // Development
  development: {
    WEBSOCKET_URL: getWebSocketURL(apiBaseUrl),
    API_BASE: apiBaseUrl,
  },
  // Production
  production: {
    WEBSOCKET_URL: getWebSocketURL(apiBaseUrl),
    API_BASE: apiBaseUrl,
  }
};

const CONFIG = API_CONFIG[ENV] || API_CONFIG.development;

export const WEBSOCKET_URL = CONFIG.WEBSOCKET_URL;
export const API_BASE = CONFIG.API_BASE;

console.log(`🔧 [ChatMe Config] Using ${ENV} environment`);
console.log(`   WebSocket: ${WEBSOCKET_URL}`);
console.log(`   API Base: ${API_BASE}`);

export default CONFIG;
