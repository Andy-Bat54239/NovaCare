import api from './axios';

export const login = (email, password) =>
  api.post('/auth/login', { email, password }).then((r) => r.data);

export const register = (data) =>
  api.post('/auth/register', data).then((r) => r.data);

export const verifyOtp = (email, otpCode) =>
  api.post('/auth/verify-otp', { email, otpCode }).then((r) => r.data);

export const resendOtp = (email) =>
  api.post('/auth/resend-otp', { email }).then((r) => r.data);

export const logout = () =>
  api.post('/auth/logout').catch(() => {});
