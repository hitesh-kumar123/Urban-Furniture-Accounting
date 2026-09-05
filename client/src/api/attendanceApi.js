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
  clockIn: async (data = {}) => {
    const res = await api.post('/attendance', {
      ...data,
      checkIn: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      status: 'Present'
    });
    return res.data;
  },
  clockOut: async (id) => {
    const res = await api.put(`/attendance/${id}`, {
      checkOut: new Date().toISOString(),
      status: 'Present'
    });
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
