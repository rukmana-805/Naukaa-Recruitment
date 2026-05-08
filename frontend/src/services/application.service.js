import api from './api';

export const applicationService = {
  applyToJob: (jobId, data) => api.post(`/applications/job/${jobId}/apply`, data),
  getMyApplications: () => api.get('/applications/my-applications'),
  getApplicationById: (id) => api.get(`/applications/${id}`),
  withdrawApplication: (id) => api.patch(`/applications/withdraw/${id}`),
  // Recruiter
  getJobApplications: (jobId) => api.get(`/applications/job/${jobId}`),
  updateApplicationStatus: (id, data) => api.patch(`/applications/status/${id}`, data),
  addNote: (id, notes) => api.patch(`/applications/note/${id}`, { notes }),
  scheduleInterview: (id, data) => api.patch(`/applications/interview/${id}`, data),
  deleteApplication: (id) => api.delete(`/applications/${id}`),
  getRecruiterApplications: () => api.get('/applications/recruiter/all'),
};
