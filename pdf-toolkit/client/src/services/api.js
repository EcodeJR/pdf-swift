import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (email, password) => {
    const response = await api.post('/auth/register', { email, password });
    return response.data;
  },
  
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },
  
  resetPassword: async (token, newPassword) => {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },
};

// Conversion API
export const conversionAPI = {
  convertFile: async (endpoint, formData) => {
    const response = await api.post(`/convert/${endpoint}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  downloadFile: (filename) => {
    return `${API_URL}/convert/download/${filename}`;
  },
};

// Payment API
export const paymentAPI = {
  createCheckout: async () => {
    const response = await api.post('/payment/create-checkout-session');
    return response.data;
  },
  
  cancelSubscription: async () => {
    const response = await api.post('/payment/cancel-subscription');
    return response.data;
  },
  
  getSubscriptionStatus: async () => {
    const response = await api.get('/payment/subscription-status');
    return response.data;
  },
};

// User API
export const userAPI = {
  getStats: async () => {
    const response = await api.get('/user/stats');
    return response.data;
  },
  
  getFiles: async () => {
    const response = await api.get('/user/files');
    return response.data;
  },
  
  deleteFile: async (fileId) => {
    const response = await api.delete(`/user/files/${fileId}`);
    return response.data;
  },
  
  getConversionHistory: async (page = 1, limit = 20) => {
    const response = await api.get(`/user/conversion-history?page=${page}&limit=${limit}`);
    return response.data;
  },
};

export default api;
