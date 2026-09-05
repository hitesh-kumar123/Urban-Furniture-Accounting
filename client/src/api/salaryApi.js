import api from './client';
import { salaryStructureApi } from './salaryStructureApi';
import { salaryRuleApi } from './salaryRuleApi';

export const salaryApi = {
  // Structures
  getStructures: async (params = {}) => {
    const res = await api.get('/salary-structures', { params });
    return res.data;
  },
  getStructureById: async (id) => {
    const res = await api.get(`/salary-structures/${id}`);
    return res.data;
  },
  createStructure: async (data) => {
    const res = await api.post('/salary-structures', data);
    return res.data;
  },
  updateStructure: async (id, data) => {
    const res = await api.put(`/salary-structures/${id}`, data);
    return res.data;
  },
  deleteStructure: async (id) => {
    const res = await api.delete(`/salary-structures/${id}`);
    return res.data;
  },

  // Rules
  getRules: async (params = {}) => {
    const res = await api.get('/salary-rules', { params });
    return res.data;
  },
  getRuleById: async (id) => {
    const res = await api.get(`/salary-rules/${id}`);
    return res.data;
  },
  createRule: async (data) => {
    const res = await api.post('/salary-rules', data);
    return res.data;
  },
  updateRule: async (id, data) => {
    const res = await api.put(`/salary-rules/${id}`, data);
    return res.data;
  },
  deleteRule: async (id) => {
    const res = await api.delete(`/salary-rules/${id}`);
    return res.data;
  },

  // Aliases for polymorphic calls
  getAll: async (params = {}) => {
    const res = await api.get('/salary-rules', { params });
    return res.data;
  }
};

export { salaryStructureApi, salaryRuleApi };
export default salaryApi;
