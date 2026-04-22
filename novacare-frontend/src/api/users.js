import axios from './axios';

export const getUsers = async () => {
  const response = await axios.get('/users');
  return response.data;
};

export const getUser = async (id) => {
  const response = await axios.get(`/users/${id}`);
  return response.data;
};

export const createUser = async (userData) => {
  const response = await axios.post('/users', userData);
  return response.data;
};

export const updateUser = async (id, userData) => {
  const response = await axios.put(`/users/${id}`, userData);
  return response.data;
};

export const updateMyProfile = async (userData) => {
  const response = await axios.put('/users/profile', userData);
  return response.data;
};

export const changeMyPassword = async (currentPassword, newPassword) => {
  const response = await axios.post('/users/change-password', { currentPassword, newPassword });
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await axios.delete(`/users/${id}`);
  return response.data;
};
