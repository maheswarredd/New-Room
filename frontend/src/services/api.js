import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL || '';
// If rawApiUrl is provided (e.g. 'https://room-manager-backend.onrender.com'), ensure '/api' suffix is appended if not present
const getBaseURL = () => {
  if (!rawApiUrl) return '/api';
  const cleanUrl = rawApiUrl.replace(/\/+$/, '');
  return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
};

const api = axios.create({
  baseURL: getBaseURL(),
});

// Intercept requests and attach Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('room_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept responses for auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isLoginRequest = error.config.url.includes('/auth/login');
      if (!isLoginRequest) {
        localStorage.removeItem('room_token');
        localStorage.removeItem('room_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
