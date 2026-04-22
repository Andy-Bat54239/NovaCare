import api from './axios';

export const getUsers = (params) =>
  api.get('/users', { params }).then((r) => r.data);

export const getUser = (id) =>
  api.get(`/users/${id}`).then((r) => r.data);

export const createUser = (data) =>
  api.post('/users', data).then((r) => r.data);

export const updateUser = (id, data) =>
  api.put(`/users/${id}`, data).then((r) => r.data);

export const deleteUser = (id) =>
  api.delete(`/users/${id}`).then((r) => r.data);

export const updateMyProfile = (data) =>
  api.put('/users/me', data).then((r) => r.data);

export const changeMyPassword = (currentPassword, newPassword) =>
  api.post('/users/me/password', { currentPassword, newPassword }).then((r) => r.data);

export const resetUserPassword = (id, newPassword) =>
  api.post(`/users/${id}/password`, { newPassword }).then((r) => r.data);

export const getUserPermissions = (id) =>
  api.get(`/users/${id}/permissions`).then((r) => r.data);

export const setUserPermissions = (id, permissionNames) =>
  api.put(`/users/${id}/permissions`, permissionNames).then((r) => r.data);
