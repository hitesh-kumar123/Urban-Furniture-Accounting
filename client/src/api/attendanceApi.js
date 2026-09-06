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
  togglePunch: async (data = {}) => {
    const now = new Date();
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const res = await api.post('/attendance/punch', {
      date: localDate,
      ...data
    });
    return res.data;
  },
  clockIn: async (data = {}) => {
    const res = await api.post('/attendance/punch', {
      ...data,
      type: 'Regular'
    });
    return res.data;
  },
  clockOut: async (id, data = {}) => {
    if (id) {
      const res = await api.put(`/attendance/${id}`, {
        ...data,
        checkOut: new Date().toISOString()
      });
      return res.data;
    }
    const res = await api.post('/attendance/punch', data);
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
