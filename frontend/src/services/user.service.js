import api from './api';

export const userService = {
  getProfile: () => api.get('/users/profile'),
  updatePersonalDetails: (data) => api.put('/users/personal-details', data),
  updateEducation: (data) => api.put('/users/education', data),
  updateExperience: (data) => api.put('/users/experience', data),
  updateWorkExperience: (data) => api.put('/users/work-experience', data),
  updateSkills: (data) => api.put('/users/skills', data),
  updateCareerPreferences: (data) => api.put('/users/career-preferences', data),
  updatePreferredLocations: (data) => api.put('/users/preferred-locations', data),
  updateLanguages: (data) => api.put('/users/languages', data),
  updateProfileSummary: (data) => api.put('/users/profile-summary', data),
  updateProfessionalStatus: (data) => api.put('/users/professional-status', data),
  uploadResume: (formData) =>
    api.post('/users/upload-resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  changePassword: (data) => api.put('/users/change-password', data),
  saveJob: (jobId) => api.put(`/users/save-job/${jobId}`),
  unsaveJob: (jobId) => api.delete(`/users/unsave-job/${jobId}`),
  getSavedJobs: () => api.get('/users/saved-jobs'),
  forgetPassword: (data) => api.post('/users/forget-password', data),
  resetPassword: (token, data) => api.post(`/users/reset-password/${token}`, data),
};
