import axios from 'axios';

// SINGLE PORT SOLUTION: Smart backend URL detection
const getBackendURL = () => {
  console.log('🔥 DETECTING ENVIRONMENT FOR SINGLE PORT SOLUTION');
  console.log('🔥 CURRENT HOSTNAME:', window.location.hostname);
  console.log('🔥 CURRENT PORT:', window.location.port);
  console.log('🔥 CURRENT ORIGIN:', window.location.origin);
  console.log('🔥 CURRENT PATHNAME:', window.location.pathname);

  // SINGLE PORT: If we're on VPN domain, use VPN proxy path
  if (typeof window !== 'undefined' && window.location.hostname === 'sslvpn1.calzedonia.com') {
    console.log('🔥 VPN ENVIRONMENT - USING VPN PROXY API PATHS (SINGLE PORT)');
    return '/web_forward_CuttingApplicationAPI/api/';  // VPN proxy path + API
  }

  // SINGLE PORT: For VM deployment - ALWAYS use relative paths when on VM
  // CRITICAL FIX: Check hostname first, ignore pathname to prevent VPN path detection on VM
  if (typeof window !== 'undefined' &&
      (window.location.hostname === '172.27.57.210' ||
       window.location.hostname === 'gab-navint01p.csg1.sys.calzedonia.com')) {
    console.log('🔥 VM ENVIRONMENT - USING RELATIVE API PATHS (SINGLE PORT)');
    console.log('🔥 VM DETECTED - IGNORING ANY VPN PATHS IN URL');
    return '/api/';  // Always relative on VM since served from Flask
  }

  // For local development, check if served from Flask or dev server
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    if (window.location.port === '5000') {
      console.log('🔥 LOCAL FLASK SERVER - USING RELATIVE API PATHS (SINGLE PORT)');
      return '/api/';
    } else {
      console.log('🔥 LOCAL DEV SERVER - USING CROSS-ORIGIN API');
      return 'http://localhost:5000/api/';
    }
  }

  // Default fallback - assume single port if we can't determine
  console.log('🔥 DEFAULT - USING RELATIVE API PATHS');
  return '/api/';
};

const axiosInstance = axios.create({
  baseURL: getBackendURL(),
  // CRITICAL FIX: Add headers to prevent VPN proxy 302 redirects
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    // Prevent caching that might cause redirects
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    // Add headers that might help with VPN proxy
    'X-Requested-With': 'XMLHttpRequest'
  },
  // Ensure credentials are sent (important for VPN proxy sessions)
  withCredentials: true
});

// NOTE: VPN uses token-based authentication with dual port rules
// Frontend and backend have separate authentication contexts
// Users must click "Cutting API" tile first to establish backend authentication

// Add request interceptor for debugging VPN issues
axiosInstance.interceptors.request.use(
  (config) => {
    console.log('🔥 AXIOS REQUEST:', config.method?.toUpperCase(), config.url);
    console.log('🔥 AXIOS HEADERS:', config.headers);
    console.log('🔥 AXIOS BASE URL:', config.baseURL);
    console.log('🔥 FINAL REQUEST URL:', config.baseURL + config.url);
    console.log('🔥 CURRENT WINDOW LOCATION:', window.location.href);

    // Add authorization token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error('🔥 AXIOS REQUEST ERROR:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle VPN redirects and debug responses
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('🔥 AXIOS RESPONSE:', response.status, response.config.url);
    console.log('🔥 RESPONSE HEADERS:', response.headers);
    console.log('🔥 RESPONSE DATA TYPE:', typeof response.data);
    console.log('🔥 RESPONSE DATA:', response.data);

    // Check if response is HTML instead of JSON
    if (typeof response.data === 'string' && response.data.includes('<html')) {
      console.error('🔥 RECEIVED HTML INSTEAD OF JSON!');
      console.error('🔥 HTML CONTENT:', response.data.substring(0, 500));
      console.error('🔥 This confirms the VPN proxy is not forwarding to Flask API');
    }

    return response;
  },
  (error) => {
    console.error('🔥 AXIOS RESPONSE ERROR:', error.response?.status, error.config?.url);
    console.error('🔥 ERROR RESPONSE DATA:', error.response?.data);

    if (error.response?.status === 302) {
      console.error('🔥 VPN PROXY 302 REDIRECT DETECTED!');
      console.error('🔥 Location header:', error.response.headers?.location);
      console.error('🔥 This indicates VPN proxy authentication is required');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;