import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: attach Bearer token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('staffora_token') || localStorage.getItem('peoplepay360_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: extract response.data.data where applicable
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't auto-redirect if already on login page
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('staffora_token');
        localStorage.removeItem('staffora_user');
        localStorage.removeItem('peoplepay360_token');
        localStorage.removeItem('peoplepay360_user');
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
