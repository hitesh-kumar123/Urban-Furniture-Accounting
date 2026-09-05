import api from './client';

export const attendanceApi = {
  getAll: async (params = {}) => {
    const res = await api.get('/attendance', { params });
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/attendance/${id}`);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/attendance', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/attendance/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/attendance/${id}`);
    return res.data;
  }
};
