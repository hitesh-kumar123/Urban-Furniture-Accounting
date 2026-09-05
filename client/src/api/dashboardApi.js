import api from './client';

export const dashboardApi = {
  getPayrollMetrics: async (params = {}) => {
    const res = await api.get('/dashboard/payroll', { params });
    return res.data;
  },
  getAttendanceOverview: async (params = {}) => {
    const res = await api.get('/dashboard/attendance-overview', { params });
    return res.data;
  }
};
