import axios from 'axios';

// Smart backend URL detection
const getBackendURL = () => {
  // If we're on the actual VPN domain, use VPN API (with /api since Flask expects /api prefix)
  if (typeof window !== 'undefined' && window.location.hostname === 'sslvpn1.calzedonia.com') {
    return 'https://sslvpn1.calzedonia.com/web_forward_CuttingApplicationAPI/api/';
  }
  // If we're testing VPN path locally, use VPN API
  if (typeof window !== 'undefined' &&
      window.location.hostname === 'localhost' &&
      window.location.pathname.startsWith('/web_forward_CuttingApplication')) {
    return 'https://sslvpn1.calzedonia.com/web_forward_CuttingApplicationAPI/api/';
  }
  // For Docker deployment on VM, use the external nginx port
  if (typeof window !== 'undefined' && window.location.hostname === '172.27.57.210') {
    return 'http://172.27.57.210:5000/api/';
  }
  // For local development, use direct backend URL
  return 'http://localhost:5000/api/';
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

// Add request interceptor for debugging VPN issues
axiosInstance.interceptors.request.use(
  (config) => {
    console.log('🔥 AXIOS REQUEST:', config.method?.toUpperCase(), config.url);
    console.log('🔥 AXIOS HEADERS:', config.headers);
    console.log('🔥 AXIOS BASE URL:', config.baseURL);

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