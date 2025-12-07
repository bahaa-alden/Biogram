import apiClient from './client';
import { API_ENDPOINTS } from './endpoints';
import { ApiResponse, Notification } from './types';

export const notificationService = {
  getNotifications: async (userId: string, params?: { read?: boolean; page?: number; limit?: number }): Promise<ApiResponse<{ data: Notification[] }>> => {
    const response = await apiClient.get(API_ENDPOINTS.GET_NOTIFICATIONS(userId), { params });
    return response.data;
  },

  markNotificationRead: async (chatId: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.patch(API_ENDPOINTS.MARK_NOTIFICATION_READ(chatId));
    return response.data;
  },

  getNotification: async (userId: string, notificationId: string): Promise<ApiResponse<{ data: Notification }>> => {
    const response = await apiClient.get(API_ENDPOINTS.GET_NOTIFICATION(userId, notificationId));
    return response.data;
  },

  updateNotification: async (userId: string, notificationId: string, data: Partial<Notification>): Promise<ApiResponse<{ data: Notification }>> => {
    const response = await apiClient.patch(API_ENDPOINTS.UPDATE_NOTIFICATION(userId, notificationId), data);
    return response.data;
  },

  deleteNotification: async (userId: string, notificationId: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(API_ENDPOINTS.DELETE_NOTIFICATION(userId, notificationId));
    return response.data;
  },
};

