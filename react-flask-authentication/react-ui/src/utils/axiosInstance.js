import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_SERVER || 'http://127.0.0.1:5000/api'
});

export default axiosInstance;