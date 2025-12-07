import apiClient from './client';
import { API_ENDPOINTS } from './endpoints';
import { ApiResponse, SearchUsersParams, User } from './types';

export const userService = {
  getMe: async (): Promise<ApiResponse<{ data: User }>> => {
    const response = await apiClient.get(API_ENDPOINTS.GET_ME);
    return response.data;
  },

  getUser: async (id: string): Promise<ApiResponse<{ data: User }>> => {
    const response = await apiClient.get(API_ENDPOINTS.GET_USER(id));
    return response.data;
  },

  getUsers: async (params?: SearchUsersParams): Promise<ApiResponse<{ data: User[] }>> => {
    const response = await apiClient.get(API_ENDPOINTS.GET_USERS, { params });
    return response.data;
  },

  updateMe: async (data: Partial<User> | FormData): Promise<ApiResponse<{ data: User }>> => {
    const response = await apiClient.patch(API_ENDPOINTS.UPDATE_ME, data);
    return response.data;
  },

  updateUser: async (id: string, data: Partial<User>): Promise<ApiResponse<{ data: User }>> => {
    const response = await apiClient.patch(API_ENDPOINTS.UPDATE_USER(id), data);
    return response.data;
  },

  deleteMe: async (): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(API_ENDPOINTS.DELETE_ME);
    return response.data;
  },

  deleteUser: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(API_ENDPOINTS.DELETE_USER(id));
    return response.data;
  },
};

