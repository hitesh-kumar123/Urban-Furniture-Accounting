import api from './client';

export const timeOffApi = {
  // Types
  getTypes: async () => {
    const res = await api.get('/time-off/types');
    return res.data;
  },
  createType: async (data) => {
    const res = await api.post('/time-off/types', data);
    return res.data;
  },
  updateType: async (id, data) => {
    const res = await api.put(`/time-off/types/${id}`, data);
    return res.data;
  },
  deleteType: async (id) => {
    const res = await api.delete(`/time-off/types/${id}`);
    return res.data;
  },

  // Allocations
  getAllocations: async (params = {}) => {
    const res = await api.get('/time-off/allocations', { params });
    return res.data;
  },
  createAllocation: async (data) => {
    const res = await api.post('/time-off/allocations', data);
    return res.data;
  },
  approveAllocation: async (id) => {
    const res = await api.post(`/time-off/allocations/${id}/approve`);
    return res.data;
  },

  // Requests
  getRequests: async (params = {}) => {
    const res = await api.get('/time-off/requests', { params });
    return res.data;
  },
  getRequestById: async (id) => {
    const res = await api.get(`/time-off/requests/${id}`);
    return res.data;
  },
  createRequest: async (data) => {
    const res = await api.post('/time-off/requests', data);
    return res.data;
  },
  approveRequest: async (id) => {
    const res = await api.post(`/time-off/requests/${id}/approve`);
    return res.data;
  },
  refuseRequest: async (id, rejectionReason) => {
    const res = await api.post(`/time-off/requests/${id}/refuse`, { rejectionReason });
    return res.data;
  },

  // Balance
  getBalance: async (params = {}) => {
    const res = await api.get('/time-off/balance', { params });
    return res.data;
  }
};
