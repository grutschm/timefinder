import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Set the Authorization header if token exists
const token = localStorage.getItem('token');
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export const register = async (username, password) => {
  return await api.post('/register', { username, password });
};

export const login = async (username, password) => {
  const response = await api.post('/login', { username, password });
  const token = response.data.token;
  if (token) {
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  return response;
};

export const createSession = async (name) => {
  return await api.post('/sessions', { name });
};

export const getSessions = async () => {
  return await api.get('/sessions');
};

export const getGoogleAuthUrl = async () => {
  const response = await api.get('/auth/google');
  return response.data.url;
};

export const getCalendarEvents = async () => {
  return await api.get('/calendar/events');
};
