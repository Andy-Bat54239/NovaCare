import api from './axios';

export const getDashboardStats = () =>
  api.get('/dashboard/stats').then((r) => r.data);

export const getSalesChart = (days = 7) =>
  api.get('/dashboard/sales-chart', { params: { days } }).then((r) => r.data);

export const getNotifications = () =>
  api.get('/dashboard/notifications').then((r) => r.data);
