import api from './client';

export const payrunApi = {
  getAll: async (params = {}) => {
    const res = await api.get('/payruns', { params });
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/payruns/${id}`);
    return res.data;
  },
  getEligibleEmployees: async (salaryStructureId, periodStart, periodEnd) => {
    const res = await api.get('/payruns/eligible-employees', {
      params: { salaryStructureId, periodStart, periodEnd }
    });
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/payruns', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/payruns/${id}`, data);
    return res.data;
  },
  compute: async (id) => {
    const res = await api.post(`/payruns/${id}/compute`);
    return res.data;
  },
  validate: async (id) => {
    const res = await api.post(`/payruns/${id}/validate`);
    return res.data;
  },
  markPaid: async (id) => {
    const res = await api.post(`/payruns/${id}/mark-paid`);
    return res.data;
  },
  sendPayslips: async (id) => {
    const res = await api.post(`/payruns/${id}/send-payslips`);
    return res.data;
  }
};
