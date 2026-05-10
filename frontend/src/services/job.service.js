import api from './api';

export const jobService = {
  getFilteredJobs: (params) => api.get('/jobs/get-filtered-jobs', { params }),
  getOpenJobs: () => api.get('/jobs/get-open-jobs'),
  getMyJobs: () => api.get('/jobs/get-my-jobs'),
  getJobById: (id) => api.get(`/jobs/get-job/${id}`),
  getRecommendedJobs: () => api.get('/jobs/recommended-jobs'),
  createJob: (data) => api.post('/jobs/create-job', data),
  updateJob: (id, data) => api.patch(`/jobs/update-job/${id}`, data),
  deleteJob: (id) => api.delete(`/jobs/delete-job/${id}`),
  createQuestion: (jobId, data) => api.post(`/jobs/create-question/${jobId}`, data),
  updateQuestion: (jobId, questionId, data) => api.patch(`/jobs/update-question/${jobId}/${questionId}`, data),
  deleteQuestion: (jobId, questionId) => api.delete(`/jobs/delete-question/${jobId}/${questionId}`),
};
