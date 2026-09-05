import api from './client';

export const payslipApi = {
  getAll: async (params = {}) => {
    const res = await api.get('/payslips', { params });
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/payslips/${id}`);
    return res.data;
  },
  downloadPDF: async (id, filename = 'payslip.pdf') => {
    const res = await api.get(`/payslips/${id}/pdf`, {
      responseType: 'blob'
    });
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return true;
  },
  sendEmail: async (id) => {
    const res = await api.post(`/payslips/${id}/send-email`);
    return res.data;
  }
};
