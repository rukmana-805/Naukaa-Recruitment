import api from './api';

export const organizationService = {
  createOrganization: (data) => api.post('/organizations/create-organization', data),
  getMyOrganizations: () => api.get('/organizations/my-organizations'),
  getOrganizationById: (id) => api.get(`/organizations/organization/${id}`),
  updateOrganization: (id, data) => api.patch(`/organizations/update-organization/${id}`, data),
  deleteOrganization: (id) => api.delete(`/organizations/delete-organization/${id}`),
  uploadLogo: (id, formData) =>
    api.post(`/organizations/upload-logo/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  uploadCoverImage: (id, formData) =>
    api.post(`/organizations/upload-cover/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  followOrganization: (id) => api.post(`/organizations/follow/${id}`),
  unfollowOrganization: (id) => api.post(`/organizations/unfollow/${id}`),
};
