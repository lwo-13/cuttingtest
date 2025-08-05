import axios from 'axios';

// SINGLE PORT SOLUTION: Smart backend URL detection
const getBackendURL = () => {

  // ENHANCED VPN DETECTION: For VM + VPN Proxy setup
  // React app runs on VM but accessed through VPN proxy
  const isVPNEnvironment = typeof window !== 'undefined' && (
    // Primary check: Direct VPN hostname access
    window.location.hostname === 'sslvpn1.calzedonia.com' ||
    // CRITICAL: Check if accessed through VPN proxy (referrer contains VPN URL)
    (document.referrer && document.referrer.includes('sslvpn1.calzedonia.com')) ||
    // Check current URL for VPN proxy path
    window.location.href.includes('sslvpn1.calzedonia.com') ||
    // Check if we're on VM but with HTTPS (likely VPN proxy forwarding)
    (window.location.protocol === 'https:' &&
     (window.location.hostname === '172.27.57.210' ||
      window.location.hostname === 'gab-navint01p.csg1.sys.calzedonia.com'))
  );

  if (isVPNEnvironment) {
    return '/web_forward_CuttingApplicationAPI/api/';  // VPN proxy path + API
  }

  // SINGLE PORT: For VM deployment - ALWAYS use relative paths when on VM
  // CRITICAL FIX: Check hostname first, ignore pathname to prevent VPN path detection on VM
  if (typeof window !== 'undefined' &&
      (window.location.hostname === '172.27.57.210' ||
       window.location.hostname === 'gab-navint01p.csg1.sys.calzedonia.com')) {
    return '/api/';  // Always relative on VM since served from Flask
  }

  // For local development, check if served from Flask or dev server
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    if (window.location.port === '5000') {
      return '/api/';
    } else {
      return 'http://localhost:5000/api/';
    }
  }

  // Default fallback - assume single port if we can't determine
  return '/api/';
};

const axiosInstance = axios.create({
  baseURL: getBackendURL(),
  // ENHANCED HEADERS: Add headers to prevent VPN proxy issues and improve compatibility
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    // Prevent caching that might cause redirects
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    // Add headers that might help with VPN proxy
    'X-Requested-With': 'XMLHttpRequest',
    // Additional headers for network compatibility
    'X-Forwarded-Proto': 'https',
    'X-Real-IP': 'client',
    // User agent for debugging
    'User-Agent': navigator.userAgent
  },
  // Ensure credentials are sent (important for VPN proxy sessions)
  withCredentials: true,
  // ENHANCED TIMEOUT SETTINGS: Increase timeouts for remote connections
  timeout: 30000, // 30 seconds instead of default 5 seconds
  // Retry configuration for network issues
  retry: 3,
  retryDelay: 1000
});

// REQUEST INTERCEPTOR: Add request metadata and headers
axiosInstance.interceptors.request.use(
  (config) => {
    // Add timestamp for request tracking
    config.metadata = { startTime: new Date() };

    // Add additional headers for debugging
    config.headers['X-Request-ID'] = Math.random().toString(36).substring(2, 11);
    config.headers['X-Client-Timestamp'] = new Date().toISOString();
    config.headers['X-Client-URL'] = window.location.href;

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// NOTE: VPN uses token-based authentication with dual port rules
// Frontend and backend have separate authentication contexts
// Users must click "Cutting API" tile first to establish backend authentication

// Add request interceptor for authentication
axiosInstance.interceptors.request.use(
  (config) => {
    // Add authorization token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// RESPONSE INTERCEPTOR: Handle VPN redirects and network issues
axiosInstance.interceptors.response.use(
  (response) => {
    // Check if response is HTML instead of JSON (VPN redirect issue)
    if (typeof response.data === 'string' && response.data.includes('<html')) {
      // Create a custom error for HTML responses
      const error = new Error('VPN Proxy returned HTML instead of JSON');
      error.response = response;
      error.isVPNRedirect = true;
      throw error;
    }

    return response;
  },
  (error) => {
    // Handle specific VPN proxy errors
    if (error.response?.status === 302) {
      // VPN proxy authentication required - user should click "Cutting API" tile first
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;