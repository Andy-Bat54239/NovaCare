import api from './axios';

export const getCustomers = (params) =>
  api.get('/customers', { params }).then((r) => r.data);

export const getCustomer = (id) =>
  api.get(`/customers/${id}`).then((r) => r.data);

export const createCustomer = (data) =>
  api.post('/customers', data).then((r) => r.data);

export const updateCustomer = (id, data) =>
  api.put(`/customers/${id}`, data).then((r) => r.data);

export const deleteCustomer = (id) =>
  api.delete(`/customers/${id}`).then((r) => r.data);

export const getMyCustomerProfile = () =>
  api.get('/customers/me').then(r => r.data);

export const updateMyCustomerProfile = (data) =>
  api.put('/customers/me', data).then(r => r.data);
