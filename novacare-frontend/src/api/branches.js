import axios from './axios';

export const getBranches = async () => {
  const response = await axios.get('/branches');
  return response.data;
};

export const getBranch = async (id) => {
  const response = await axios.get(`/branches/${id}`);
  return response.data;
};

export const createBranch = async (branchData) => {
  const response = await axios.post('/branches', branchData);
  return response.data;
};

export const updateBranch = async (id, branchData) => {
  const response = await axios.put(`/branches/${id}`, branchData);
  return response.data;
};
