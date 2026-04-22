import api from './axios';

export const getAuditLogs = (params) =>
  api.get('/audit-logs', { params }).then((r) => r.data);
