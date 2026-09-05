import api from './client';

export const contractApi = {
  getAll: async (params = {}) => {
    const res = await api.get('/contracts', { params });
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/contracts/${id}`);
    return res.data;
  },
  getApplicable: async (employeeId, startDate, endDate) => {
    const res = await api.get('/contracts/applicable', {
      params: { employeeId, startDate, endDate }
    });
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/contracts', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/contracts/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/contracts/${id}`);
    return res.data;
  }
};
