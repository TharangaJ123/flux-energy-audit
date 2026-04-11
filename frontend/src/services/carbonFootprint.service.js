// Service layer for carbon footprint data management
// Handles all API calls for carbon tracking functionality
import api from './api';

const CARBON_URL = '/carbon';

const carbonService = {
  // Fetch all carbon footprint records for current user
  getRecords: async () => {
    const response = await api.get(CARBON_URL);
    return response.data;
  },

  // Get single carbon footprint record by ID
  getRecordById: async (id) => {
    const response = await api.get(`${CARBON_URL}/${id}`);
    return response.data;
  },

  // Create new carbon footprint record
  createRecord: async (data) => {
    const response = await api.post(CARBON_URL, data);
    return response.data;
  },

  // Update existing carbon footprint record
  updateRecord: async (id, data) => {
    const response = await api.put(`${CARBON_URL}/${id}`, data);
    return response.data;
  },

  // Delete carbon footprint record by ID
  deleteRecord: async (id) => {
    const response = await api.delete(`${CARBON_URL}/${id}`);
    return response.data;
  }
};

export default carbonService;
