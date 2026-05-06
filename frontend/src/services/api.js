import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 15000,
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('gf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('gf_token');
      localStorage.removeItem('gf_usuario');
    }
    return Promise.reject(err);
  }
);

export default api;
