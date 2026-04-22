import axios from './axios';

export const getConversations = async () => {
  const response = await axios.get('/chats');
  return response.data;
};

export const createConversation = async (targetRole) => {
  const response = await axios.post('/chats', { targetRole });
  return response.data;
};

export const getMessages = async (conversationId, page = 1, pageSize = 50) => {
  const response = await axios.get(`/chats/${conversationId}/messages`, {
    params: { page, pageSize }
  });
  return response.data;
};

export const sendMessage = async (conversationId, content) => {
  const response = await axios.post(`/chats/${conversationId}/messages`, { content });
  return response.data;
};

export const getUnreadCount = async () => {
  const response = await axios.get('/chats/unread-count');
  return response.data;
};

export const getChatCustomers = async () => {
  const response = await axios.get('/chats/customers');
  return response.data;
};

export const getBranches = async () => {
  const response = await axios.get('/branches');
  return response.data;
};
