import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('novacare_user');
  if (stored) {
    try {
      const { token } = JSON.parse(stored);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch (_) {}
  }
  return config;
});

// Global 401 handler — only redirect if the user was actually logged in
// (prevents shop pages from bouncing anonymous visitors to /login when a
// background request happens to hit an authorized endpoint).
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem('novacare_user')) {
      localStorage.removeItem('novacare_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
