import api from './client';

export const salaryRuleApi = {
  getAll: async (params = {}) => {
    const res = await api.get('/salary-rules', { params });
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/salary-rules/${id}`);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/salary-rules', data);
    return res.data;
  },
  createRule: async (data) => {
    const res = await api.post('/salary-rules', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/salary-rules/${id}`, data);
    return res.data;
  },
  updateRule: async (id, data) => {
    const res = await api.put(`/salary-rules/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/salary-rules/${id}`);
    return res.data;
  },
  deleteRule: async (id) => {
    const res = await api.delete(`/salary-rules/${id}`);
    return res.data;
  }
};

export default salaryRuleApi;
