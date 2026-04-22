import api from './axios';

export const getMessages = (params) =>
  api.get('/contactmessages', { params }).then((r) => r.data);

export const getContactUnreadCount = () =>
  api.get('/contactmessages/unread-count').then((r) => r.data);

export const getMessage = (id) =>
  api.get(`/contactmessages/${id}`).then((r) => r.data);

export const createMessage = (data) =>
  api.post('/contactmessages', data).then((r) => r.data);

export const replyMessage = (id, replyText) =>
  api.patch(`/contactmessages/${id}/reply`, { replyText }).then((r) => r.data);

export const markRead = (id) =>
  api.patch(`/contactmessages/${id}/read`).then((r) => r.data);

export const deleteMessage = (id) =>
  api.delete(`/contactmessages/${id}`).then((r) => r.data);
