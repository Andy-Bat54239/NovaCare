import axios from './axios';

export const getCustomers = async () => {
  const response = await axios.get('/customers');
  return response.data;
};

export const getCustomer = async (id) => {
  const response = await axios.get(`/customers/${id}`);
  return response.data;
};

export const createCustomer = async (customerData) => {
  const response = await axios.post('/customers', customerData);
  return response.data;
};

export const updateCustomer = async (id, customerData) => {
  const response = await axios.put(`/customers/${id}`, customerData);
  return response.data;
};

export const getMyCustomerProfile = async () => {
  const response = await axios.get('/customers/profile');
  return response.data;
};

export const updateMyCustomerProfile = async (customerData) => {
  const response = await axios.put('/customers/profile', customerData);
  return response.data;
};

export const deleteCustomer = async (id) => {
  const response = await axios.delete(`/customers/${id}`);
  return response.data;
};
