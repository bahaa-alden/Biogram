import apiClient from './client';
import { API_ENDPOINTS } from './endpoints';
import { ApiResponse, GetMessagesParams, Message, SendMessageRequest } from './types';

export const messageService = {
  getMessages: async (chatId: string, params?: GetMessagesParams): Promise<ApiResponse<{ data: Message[] }>> => {
    const response = await apiClient.get(API_ENDPOINTS.GET_MESSAGES(chatId), { params });
    return response.data;
  },

  sendMessage: async (chatId: string, data: SendMessageRequest): Promise<ApiResponse<{ data: Message }>> => {
    const response = await apiClient.post(API_ENDPOINTS.SEND_MESSAGE(chatId), data);
    return response.data;
  },

  getMessage: async (chatId: string, messageId: string): Promise<ApiResponse<{ data: Message }>> => {
    const response = await apiClient.get(API_ENDPOINTS.GET_MESSAGE(chatId, messageId));
    return response.data;
  },

  updateMessage: async (chatId: string, messageId: string, content: string): Promise<ApiResponse<{ data: Message }>> => {
    const response = await apiClient.patch(API_ENDPOINTS.UPDATE_MESSAGE(chatId, messageId), { content });
    return response.data;
  },

  deleteMessage: async (chatId: string, messageId: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(API_ENDPOINTS.DELETE_MESSAGE(chatId, messageId));
    return response.data;
  },
};

