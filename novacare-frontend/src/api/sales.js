import axios from './axios';

export const getSales = async () => {
  const response = await axios.get('/sales');
  return response.data;
};

export const getSale = async (id) => {
  const response = await axios.get(`/sales/${id}`);
  return response.data;
};

export const createSale = async (saleData) => {
  const response = await axios.post('/sales', saleData);
  return response.data;
};

export const updateSale = async (id, saleData) => {
  const response = await axios.put(`/sales/${id}`, saleData);
  return response.data;
};

export const getSalesByBranch = async (branchId) => {
  const response = await axios.get(`/sales?branchId=${branchId}`);
  return response.data;
};
