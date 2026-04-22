import axios from './axios';

export const getMedicines = async () => {
  const response = await axios.get('/medicines');
  return response.data;
};

export const getMedicine = async (id) => {
  const response = await axios.get(`/medicines/${id}`);
  return response.data;
};

export const getMedicinesByBranch = async (branchId) => {
  const response = await axios.get(`/medicines?branchId=${branchId}`);
  return response.data;
};

export const createMedicine = async (medicineData) => {
  const response = await axios.post('/medicines', medicineData);
  return response.data;
};

export const updateMedicine = async (id, medicineData) => {
  const response = await axios.put(`/medicines/${id}`, medicineData);
  return response.data;
};

export const deleteMedicine = async (id) => {
  const response = await axios.delete(`/medicines/${id}`);
  return response.data;
};
