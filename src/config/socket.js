// Socket.io configuration
const SOCKET_CONFIG = {
  // Base URL for socket connection
  baseUrl: import.meta?.env?.VITE_SOCKET_URL || 'http://localhost:5174',
  
  // Connection options
  options: {
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 5,
    timeout: 15000,
    reconnectionDelay: 1000,
    transports: ['websocket', 'polling']
  }
};

export default SOCKET_CONFIG;