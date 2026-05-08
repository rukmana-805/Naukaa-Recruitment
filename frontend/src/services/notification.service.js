import api from './api';

export const notificationService = {
  getMyNotifications: () => api.get('/notifications/get-notifications'),
  markAsRead: (id) => api.post(`/notifications/mark-as-read/${id}`),
  markAllAsRead: () => api.post('/notifications/mark-all-as-read'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
};
