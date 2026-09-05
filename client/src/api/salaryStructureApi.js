import api from './client';

export const salaryStructureApi = {
  getAll: async (params = {}) => {
    const res = await api.get('/salary-structures', { params });
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/salary-structures/${id}`);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/salary-structures', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/salary-structures/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/salary-structures/${id}`);
    return res.data;
  }
};

export default salaryStructureApi;
