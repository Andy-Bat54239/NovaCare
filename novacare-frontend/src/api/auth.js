import axios from './axios';

export const login = async (email, password) => {
  const response = await axios.post('/auth/login', { email, password });
  return response.data;
};

export const register = async (firstName, lastName, email, password) => {
  const response = await axios.post('/auth/register', { firstName, lastName, email, password });
  return response.data;
};

export const verifyOtp = async (email, otp) => {
  const response = await axios.post('/auth/verify-otp', { email, otp });
  return response.data;
};

export const resendOtp = async (email) => {
  const response = await axios.post('/auth/resend-otp', { email });
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('novacare_user');
};
