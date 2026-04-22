import api from './axios';

export const getConversations = () =>
  api.get('/chats').then(r => r.data);

export const createConversation = (targetRole, branchId) =>
  api.post('/chats', { targetRole, branchId }).then(r => r.data);

export const getBranches = () =>
  api.get('/chats/branches').then(r => r.data);

export const getMessages = (conversationId, page = 1) =>
  api.get(`/chats/${conversationId}/messages`, { params: { page, pageSize: 50 } }).then(r => r.data);

export const getUnreadCount = () =>
  api.get('/chats/unread-count').then(r => r.data);

export const getChatCustomers = () =>
  api.get('/chats/customers').then(r => r.data);
