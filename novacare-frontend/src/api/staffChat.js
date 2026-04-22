import axios from './axios';

export const getStaffConversations = async () => {
  const response = await axios.get('/staff-chats');
  return response.data;
};

export const openStaffConversation = async (otherUserId) => {
  const response = await axios.post('/staff-chats', { otherUserId });
  return response.data;
};

export const getStaffMessages = async (conversationId, page = 1, pageSize = 50) => {
  const response = await axios.get(`/staff-chats/${conversationId}/messages`, {
    params: { page, pageSize }
  });
  return response.data;
};

export const sendStaffMessage = async (conversationId, content) => {
  const response = await axios.post(`/staff-chats/${conversationId}/messages`, { content });
  return response.data;
};

export const getStaffUnreadCount = async () => {
  const response = await axios.get('/staff-chats/unread-count');
  return response.data;
};

export const getColleagues = async () => {
  const response = await axios.get('/staff-chats/colleagues');
  return response.data;
};
