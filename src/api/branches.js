import api from './axios';

export const getBranches = () =>
  api.get('/branches').then((r) => r.data);

export const getBranch = (id) =>
  api.get(`/branches/${id}`).then((r) => r.data);

export const createBranch = (data) =>
  api.post('/branches', data).then((r) => r.data);

export const updateBranch = (id, data) =>
  api.put(`/branches/${id}`, data).then((r) => r.data);
