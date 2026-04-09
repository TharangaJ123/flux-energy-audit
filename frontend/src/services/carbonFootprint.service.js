// Thin service wrapper around carbon footprint endpoints used by dashboard components.
import api from './api';

const CARBON_URL = '/carbon';

const carbonService = {
  getRecords: async () => {
    const response = await api.get(CARBON_URL);
    return response.data;
  },

  getRecordById: async (id) => {
    const response = await api.get(`${CARBON_URL}/${id}`);
    return response.data;
  },

  createRecord: async (data) => {
    const response = await api.post(CARBON_URL, data);
    return response.data;
  },

  updateRecord: async (id, data) => {
    const response = await api.put(`${CARBON_URL}/${id}`, data);
    return response.data;
  },

  deleteRecord: async (id) => {
    const response = await api.delete(`${CARBON_URL}/${id}`);
    return response.data;
  }
};

export default carbonService;
