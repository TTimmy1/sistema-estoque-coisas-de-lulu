import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  const lojaId = localStorage.getItem('@Estoque:lojaId');
  if (lojaId) {
    config.headers['x-loja-id'] = lojaId;
  }
  return config;
});

export default api;
