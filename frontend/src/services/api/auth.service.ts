import apiClient from './client';
import { API_ENDPOINTS } from './endpoints';
import { ApiResponse, AuthResponse, LoginRequest, SignupRequest } from './types';

export const authService = {
  login: async (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiClient.post(API_ENDPOINTS.LOGIN, data);
    return response.data;
  },

  signup: async (data: SignupRequest): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiClient.post(API_ENDPOINTS.SIGNUP, data);
    return response.data;
  },

  forgotPassword: async (email: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post(API_ENDPOINTS.FORGOT_PASSWORD, { email });
    return response.data;
  },

  resetPassword: async (token: string, password: string, passwordConfirm: string): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiClient.patch(API_ENDPOINTS.RESET_PASSWORD(token), { password, passwordConfirm });
    return response.data;
  },

  updatePassword: async (passwordCurrent: string, password: string, passwordConfirm: string): Promise<ApiResponse<{ user: User }>> => {
    const response = await apiClient.patch(API_ENDPOINTS.UPDATE_PASSWORD, { passwordCurrent, password, passwordConfirm });
    return response.data;
  },
};

import { User } from '../../types/interfaces';

