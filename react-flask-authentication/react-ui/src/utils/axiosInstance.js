import axios from 'axios';

// SINGLE PORT SOLUTION: Smart backend URL detection with enhanced debugging
const getBackendURL = () => {
  console.log('🔥 DETECTING ENVIRONMENT FOR SINGLE PORT SOLUTION');
  console.log('🔥 CURRENT HOSTNAME:', window.location.hostname);
  console.log('🔥 CURRENT PORT:', window.location.port);
  console.log('🔥 CURRENT ORIGIN:', window.location.origin);
  console.log('🔥 CURRENT PATHNAME:', window.location.pathname);
  console.log('🔥 CURRENT PROTOCOL:', window.location.protocol);
  console.log('🔥 CURRENT HREF:', window.location.href);
  console.log('🔥 USER AGENT:', navigator.userAgent);
  console.log('🔥 NETWORK CONNECTION:', navigator.connection ? navigator.connection.effectiveType : 'unknown');

  // CRITICAL DEBUG: Check all possible VPN indicators
  console.log('🔥 VPN DETECTION DEBUG:');
  console.log('🔥   - hostname === sslvpn1.calzedonia.com:', window.location.hostname === 'sslvpn1.calzedonia.com');
  console.log('🔥   - pathname starts with /web_forward:', window.location.pathname.startsWith('/web_forward_CuttingApplicationAPI'));
  console.log('🔥   - href includes sslvpn1:', window.location.href.includes('sslvpn1.calzedonia.com'));
  console.log('🔥   - protocol is https:', window.location.protocol === 'https:');
  console.log('🔥   - VM hostname check 1:', window.location.hostname === '172.27.57.210');
  console.log('🔥   - VM hostname check 2:', window.location.hostname === 'gab-navint01p.csg1.sys.calzedonia.com');

  // ENHANCED VPN DETECTION: Check multiple indicators for VPN environment
  // CRITICAL FIX: VPN proxy might rewrite hostname, so check URL and referrer too
  const isVPNEnvironment = typeof window !== 'undefined' && (
    // Primary check: VPN hostname (this is the main indicator)
    window.location.hostname === 'sslvpn1.calzedonia.com' ||
    // Secondary check: VPN path pattern (for cases where hostname detection fails)
    window.location.pathname.startsWith('/web_forward_CuttingApplicationAPI') ||
    // Tertiary check: HTTPS with VPN-like path structure
    (window.location.protocol === 'https:' &&
     (window.location.pathname.includes('web_forward') ||
      window.location.href.includes('sslvpn1.calzedonia.com'))) ||
    // CRITICAL: Check if we're being served through VPN proxy (referrer or original URL)
    (document.referrer && document.referrer.includes('sslvpn1.calzedonia.com')) ||
    // Check if we're on HTTPS and NOT on the known VM hostnames (likely VPN)
    (window.location.protocol === 'https:' &&
     window.location.hostname !== '172.27.57.210' &&
     window.location.hostname !== 'gab-navint01p.csg1.sys.calzedonia.com' &&
     window.location.hostname !== 'localhost')
  );

  if (isVPNEnvironment) {
    console.log('🔥 VPN ENVIRONMENT DETECTED - USING VPN PROXY API PATHS (SINGLE PORT)');
    console.log('🔥 VPN DETECTION REASONS:');
    console.log('🔥   - Hostname match:', window.location.hostname === 'sslvpn1.calzedonia.com');
    console.log('🔥   - Path match:', window.location.pathname.startsWith('/web_forward_CuttingApplicationAPI'));
    console.log('🔥   - HTTPS + VPN pattern:', window.location.protocol === 'https:' && window.location.href.includes('sslvpn1.calzedonia.com'));
    console.log('🔥   - Referrer check:', document.referrer && document.referrer.includes('sslvpn1.calzedonia.com'));
    console.log('🔥   - HTTPS non-VM check:', window.location.protocol === 'https:' && window.location.hostname !== '172.27.57.210' && window.location.hostname !== 'gab-navint01p.csg1.sys.calzedonia.com');
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

// REQUEST INTERCEPTOR: Add debugging information to all requests
axiosInstance.interceptors.request.use(
  (config) => {
    console.log('🔥 AXIOS REQUEST:', config.method?.toUpperCase(), config.url);
    console.log('🔥 REQUEST BASE URL:', config.baseURL);
    console.log('🔥 REQUEST HEADERS:', config.headers);
    console.log('🔥 REQUEST TIMEOUT:', config.timeout);

    // Add timestamp for request tracking
    config.metadata = { startTime: new Date() };

    // Add additional debugging headers
    config.headers['X-Request-ID'] = Math.random().toString(36).substring(2, 11);
    config.headers['X-Client-Timestamp'] = new Date().toISOString();
    config.headers['X-Client-URL'] = window.location.href;

    return config;
  },
  (error) => {
    console.error('🔥 AXIOS REQUEST ERROR:', error);
    return Promise.reject(error);
  }
);

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

// ENHANCED RESPONSE INTERCEPTOR: Handle VPN redirects and network issues
axiosInstance.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const duration = response.config.metadata ?
      new Date() - response.config.metadata.startTime : 'unknown';

    console.log('🔥 AXIOS RESPONSE SUCCESS:', response.status, response.config.url);
    console.log('🔥 RESPONSE TIME:', duration, 'ms');
    console.log('🔥 RESPONSE HEADERS:', response.headers);
    console.log('🔥 RESPONSE DATA TYPE:', typeof response.data);
    console.log('🔥 RESPONSE SIZE:', JSON.stringify(response.data).length, 'bytes');

    // Check if response is HTML instead of JSON (VPN redirect issue)
    if (typeof response.data === 'string' && response.data.includes('<html')) {
      console.error('🔥 RECEIVED HTML INSTEAD OF JSON - VPN REDIRECT DETECTED!');
      console.error('🔥 HTML CONTENT:', response.data.substring(0, 500));
      console.error('🔥 This indicates VPN proxy is not forwarding to Flask API correctly');
      console.error('🔥 POSSIBLE CAUSES:');
      console.error('🔥   1. VPN proxy configuration issue');
      console.error('🔥   2. Backend server not responding');
      console.error('🔥   3. Network routing problem');
      console.error('🔥   4. Authentication required at VPN level');

      // Create a custom error for HTML responses
      const error = new Error('VPN Proxy returned HTML instead of JSON');
      error.response = response;
      error.isVPNRedirect = true;
      throw error;
    }

    return response;
  },
  (error) => {
    console.error('🔥 AXIOS ERROR OCCURRED:', error.message);
    console.error('🔥 ERROR CONFIG:', error.config);
    console.error('🔥 ERROR RESPONSE:', error.response);
    console.error('🔥 ERROR CODE:', error.code);

    // Network-specific error analysis
    if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
      console.error('🔥 NETWORK ERROR DETECTED - POSSIBLE CAUSES:');
      console.error('🔥   1. VPN connection lost or unstable');
      console.error('🔥   2. Firewall blocking requests');
      console.error('🔥   3. DNS resolution failure');
      console.error('🔥   4. Proxy server not responding');
      console.error('🔥   5. Backend server down');

      // Add network diagnostics
      console.error('🔥 NETWORK DIAGNOSTICS:');
      console.error('🔥   - Online status:', navigator.onLine);
      console.error('🔥   - Connection type:', navigator.connection ? navigator.connection.effectiveType : 'unknown');
      console.error('🔥   - Request URL:', error.config?.url);
      console.error('🔥   - Base URL:', error.config?.baseURL);
    }

    // Handle specific VPN proxy errors
    if (error.response?.status === 302) {
      console.error('🔥 VPN PROXY 302 REDIRECT DETECTED!');
      console.error('🔥 Location header:', error.response.headers?.location);
      console.error('🔥 This indicates VPN proxy authentication is required');
      console.error('🔥 SOLUTION: User must click "Cutting API" tile first');
    }

    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.error('🔥 REQUEST TIMEOUT - NETWORK TOO SLOW OR UNSTABLE');
      console.error('🔥 Consider increasing timeout or checking network connection');
    }

    // Handle CORS errors
    if (error.message.includes('CORS') || error.message.includes('Access-Control')) {
      console.error('🔥 CORS ERROR - BACKEND NOT ALLOWING REQUESTS FROM THIS ORIGIN');
      console.error('🔥 Check Flask CORS configuration');
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;