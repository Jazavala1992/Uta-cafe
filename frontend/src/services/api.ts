import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});

api.interceptors.request.use((config) => {
  const authRaw = localStorage.getItem('auth_store');
  const parsed = authRaw ? JSON.parse(authRaw) : null;
  const token = parsed?.state?.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
