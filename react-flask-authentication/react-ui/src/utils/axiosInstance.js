import axios from 'axios';
import { store } from '../store';

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_SERVER || 'http://127.0.0.1:5000/api'
});

// Add request interceptor to automatically include JWT token
axiosInstance.interceptors.request.use(
  (config) => {
    // Try to get token from localStorage first
    let token = localStorage.getItem('token');

    // If not found in localStorage, try Redux store
    if (!token) {
      const state = store.getState();
      token = state.account?.token;
    }

    if (token) {
      // Remove any extra quotes that might be around the token
      token = token.replace(/^"(.*)"$/, '$1');
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 400) {
      if (error.response?.data?.msg?.includes('Token expired')) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;