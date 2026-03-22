import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// User Management APIs
export const userApi = {
  register: (userData) => api.post('/users/register', userData),
  login: (credentials) => api.post('/users/login', credentials),
  getProfile: () => api.get('/users/me'),
  updateProfile: (userData) => api.put('/users/me', userData),
  deleteProfile: () => api.delete('/users/me'),
};

// Cost Management APIs
export const costApi = {
  createCost: (costData) => api.post('/costs', costData),
  getCosts: () => api.get('/costs'),
  getCostById: (id) => api.get(`/costs/${id}`),
  updateCost: (id, costData) => api.put(`/costs/${id}`, costData),
  deleteCost: (id) => api.delete(`/costs/${id}`),
  estimateCost: (estimationData) => api.post('/costs/estimate', estimationData),
  createGoal: (goalData) => api.post('/costs/goals', goalData),
  getGoals: () => api.get('/costs/goals'),
  getGoalById: (id) => api.get(`/costs/goals/${id}`),
  updateGoal: (id, goalData) => api.put(`/costs/goals/${id}`, goalData),
  deleteGoal: (id) => api.delete(`/costs/goals/${id}`),
};

// Appliance Management APIs
export const applianceApi = {
  createAppliance: (data) => api.post('/appliances', data),
  getAppliances: () => api.get('/appliances'),
  getApplianceById: (id) => api.get(`/appliances/${id}`),
  updateAppliance: (id, data) => api.put(`/appliances/${id}`, data),
  deleteAppliance: (id) => api.delete(`/appliances/${id}`),
  getApplianceStats: () => api.get('/appliances/stats'),
  getEnergyAudit: (city) => api.get(`/appliances/audit${city ? `?city=${city}` : ''}`),
};

export default api;
