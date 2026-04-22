import axios from './axios';

export const getOrders = async () => {
  const response = await axios.get('/orders');
  return response.data;
};

export const getOrder = async (id) => {
  const response = await axios.get(`/orders/${id}`);
  return response.data;
};

export const uploadPrescriptionForItem = async (orderId, itemId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axios.post(`/orders/${orderId}/items/${itemId}/prescription`, formData);
  return response.data;
};

export const createOrder = async (orderData) => {
  const response = await axios.post('/orders', orderData);
  return response.data;
};

export const getCustomerOrders = async () => {
  const response = await axios.get('/orders/my');
  return response.data;
};

export const updateOrderStatus = async (id, status) => {
  const response = await axios.patch(`/orders/${id}/status`, { status });
  return response.data;
};
