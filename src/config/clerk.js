// Clerk configuration
const CLERK_CONFIG = {
  // Disable telemetry to fix the net::ERR_ABORTED error
  options: {
    telemetry: false,
    // Add additional options to fix authentication errors
    allowedRedirectOrigins: [
      'http://localhost:5173',
      'http://localhost:5174'
    ],
    // Increase timeout for network requests
    networkTimeout: 15000
  }
};

export default CLERK_CONFIG;