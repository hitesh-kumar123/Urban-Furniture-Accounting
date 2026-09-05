import api from './client';

export const dashboardApi = {
  getPayrollMetrics: async (params = {}) => {
    const res = await api.get('/dashboard/payroll', { params });
    return res.data;
  }
};
