import api from './client';

export const employeeApi = {
  getAll: async (params = {}) => {
    const res = await api.get('/employees', { params });
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/employees/${id}`);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/employees', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/employees/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/employees/${id}`);
    return res.data;
  }
};
