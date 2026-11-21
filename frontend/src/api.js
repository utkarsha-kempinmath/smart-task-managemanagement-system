import axios from 'axios';

const getBaseURL = () => {
  const customPort = sessionStorage.getItem('smarttask_port');
  if (customPort) {
    return `http://localhost:${customPort}/api`;
  }
  return '/api';
};

const api = axios.create();

api.interceptors.request.use((config) => {
  config.baseURL = getBaseURL();
  // Read from sessionStorage first (per-tab session isolation) with localStorage as fallback
  const token = sessionStorage.getItem('smarttask_token') || localStorage.getItem('smarttask_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      sessionStorage.removeItem('smarttask_token');
      sessionStorage.removeItem('smarttask_user');
      localStorage.removeItem('smarttask_token');
      localStorage.removeItem('smarttask_user');
      if (window.location.pathname !== '/login') {
        window.dispatchEvent(new Event('auth_logout'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
