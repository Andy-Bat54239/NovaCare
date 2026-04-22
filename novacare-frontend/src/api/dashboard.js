import axios from './axios';

export const getDashboardData = async () => {
  const response = await axios.get('/dashboard');
  return response.data;
};

export const getDashboardStats = async () => {
  const response = await axios.get('/dashboard/stats');
  return response.data;
};

export const getAuditLogs = async (page = 1, pageSize = 50) => {
  const response = await axios.get('/audit-logs', { params: { page, pageSize } });
  return response.data;
};

export const getReports = async (reportType, params) => {
  const response = await axios.get(`/reports/${reportType}`, { params });
  return response.data;
};

export const getNotifications = async () => {
  const response = await axios.get('/notifications');
  return response.data;
};
