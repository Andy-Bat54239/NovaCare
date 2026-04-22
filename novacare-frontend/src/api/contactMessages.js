import axios from './axios';

export const getContactMessages = async () => {
  const response = await axios.get('/contact-messages');
  return response.data;
};

export const getContactMessage = async (id) => {
  const response = await axios.get(`/contact-messages/${id}`);
  return response.data;
};

export const getContactUnreadCount = async () => {
  const response = await axios.get('/contact-messages/unread-count');
  return response.data;
};

export const createContactMessage = async (messageData) => {
  const response = await axios.post('/contact-messages', messageData);
  return response.data;
};

export const updateContactMessage = async (id, messageData) => {
  const response = await axios.put(`/contact-messages/${id}`, messageData);
  return response.data;
};

export const deleteContactMessage = async (id) => {
  const response = await axios.delete(`/contact-messages/${id}`);
  return response.data;
};
