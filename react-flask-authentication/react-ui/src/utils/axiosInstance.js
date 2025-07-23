import axios from 'axios';

// Smart backend URL detection
const getBackendURL = () => {
  // If we're on the actual VPN domain, use VPN API
  if (typeof window !== 'undefined' && window.location.hostname === 'sslvpn1.calzedonia.com') {
    return 'https://sslvpn1.calzedonia.com/web_forward_CuttingApplicationAPI/api';
  }
  // If we're testing VPN path locally, use VPN API
  if (typeof window !== 'undefined' &&
      window.location.hostname === 'localhost' &&
      window.location.pathname.startsWith('/web_forward_CuttingApplication')) {
    return 'https://sslvpn1.calzedonia.com/web_forward_CuttingApplicationAPI/api';
  }
  // For Docker deployment on VM, use the external nginx port
  if (typeof window !== 'undefined' && window.location.hostname === '172.27.57.210') {
    return 'http://172.27.57.210:5000/api';
  }
  // For local development, use relative path
  return '/api';
};

const axiosInstance = axios.create({
  baseURL: getBackendURL()
});

export default axiosInstance;