import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:5232/api'
});

instance.interceptors.request.use(config => {
  const user = JSON.parse(localStorage.getItem('novacare_user') || '{}');
  if (user.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

instance.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('novacare_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default instance;
