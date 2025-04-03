import axios from 'utils/axiosInstance';

const axiosInstance = axios.create({
  baseURL: 'http://127.0.0.1:5000/api' // change here when needed
});

export default axiosInstance;