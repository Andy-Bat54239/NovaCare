import api from './axios';

export const getOrders = (params) =>
  api.get('/orders', { params }).then((r) => r.data);

export const getOrder = (id) =>
  api.get(`/orders/${id}`).then((r) => r.data);

export const createOrder = (data) =>
  api.post('/orders', data).then((r) => r.data);

export const updateOrderStatus = (id, status) =>
  api.patch(`/orders/${id}/status`, { status }).then((r) => r.data);

export const uploadPrescriptionForItem = (orderId, itemId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/orders/${orderId}/items/${itemId}/prescription`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);
};
