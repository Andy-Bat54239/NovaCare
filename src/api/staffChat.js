import api from './axios';

export const getStaffConversations = () =>
  api.get('/staff-chats').then(r => r.data);

export const openStaffConversation = (otherUserId) =>
  api.post('/staff-chats', { otherUserId }).then(r => r.data);

export const getStaffMessages = (conversationId, page = 1) =>
  api.get(`/staff-chats/${conversationId}/messages`, { params: { page, pageSize: 50 } }).then(r => r.data);

export const getStaffUnreadCount = () =>
  api.get('/staff-chats/unread-count').then(r => r.data);

export const getColleagues = () =>
  api.get('/staff-chats/colleagues').then(r => r.data);
