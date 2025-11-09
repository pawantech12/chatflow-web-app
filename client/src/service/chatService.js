// /services/chatService.js
import axios from "axios";

const API_BASE = "http://localhost:5000/api"; // Replace with your backend URL

export const fetchConversations = async (token) => {
  const res = await axios.get(`${API_BASE}/chats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const fetchMessages = async (chatId, token) => {
  const res = await axios.get(`${API_BASE}/chats/${chatId}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const createPrivateChat = async (otherUserId, token) => {
  const res = await axios.post(
    `${API_BASE}/chats/private`,
    { otherUserId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

export const createGroupChat = async (name, participantIds, token) => {
  const res = await axios.post(
    `${API_BASE}/chats/group`,
    { name, participantIds },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

export const searchUsers = async (query, token) => {
  const res = await axios.get(`${API_BASE}/users/search?q=${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.users;
};
