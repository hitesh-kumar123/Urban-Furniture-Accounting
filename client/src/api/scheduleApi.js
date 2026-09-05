import api from './client';

export const scheduleApi = {
  getAll: async () => {
    const res = await api.get('/schedules');
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/schedules/${id}`);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/schedules', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/schedules/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/schedules/${id}`);
    return res.data;
  }
};
