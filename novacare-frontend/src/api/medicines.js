import api from './axios';

export const getMedicines = (params) =>
  api.get('/medicines', { params }).then((r) => r.data);

export const getMedicine = (id) =>
  api.get(`/medicines/${id}`).then((r) => r.data);

export const getMedicineCategories = () =>
  api.get('/medicines/categories').then((r) => r.data);

export const createMedicine = (data) =>
  api.post('/medicines', data).then((r) => r.data);

export const updateMedicine = (id, data) =>
  api.put(`/medicines/${id}`, data).then((r) => r.data);

export const deleteMedicine = (id) =>
  api.delete(`/medicines/${id}`).then((r) => r.data);

export const uploadMedicineImage = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api
    .post('/medicines/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data); // { path: '/uploads/medicines/<guid>.ext' }
};
