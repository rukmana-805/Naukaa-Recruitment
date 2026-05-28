import api from './api';

export const adminService = {
  getStats: () => api.get('/admin/stats'),
  
  getCompanies: (params) => api.get('/admin/companies', { params }),
  
  getCompanyById: (id) => api.get(`/admin/companies/${id}`),
  
  verifyCompany: (id, status, rejectionReason) => 
    api.patch(`/admin/companies/${id}/verify`, { status, rejectionReason }),
  
  deleteCompany: (id) => api.delete(`/admin/companies/${id}`),
  
  getJobSeekers: (params) => api.get('/admin/job-seekers', { params }),
  
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  
  deleteJob: (id) => api.delete(`/admin/jobs/${id}`),

  getPlans: () => api.get('/admin/plans'),
  createPlan: (data) => api.post('/admin/plans', data),
  updatePlan: (id, data) => api.patch(`/admin/plans/${id}`, data),
  deletePlan: (id) => api.delete(`/admin/plans/${id}`),
  getPayments: (params) => api.get('/admin/payments', { params }),
};
