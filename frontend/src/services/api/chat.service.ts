import apiClient from './client';
import { API_ENDPOINTS } from './endpoints';
import { ApiResponse, Chat, CreateChatRequest, CreateGroupChatRequest, UpdateChatRequest } from './types';

export const chatService = {
  getChats: async (): Promise<ApiResponse<Chat[]>> => {
    const response = await apiClient.get(API_ENDPOINTS.GET_CHATS);
    return response.data;
  },

  getChat: async (id: string): Promise<ApiResponse<{ data: Chat }>> => {
    const response = await apiClient.get(API_ENDPOINTS.GET_CHAT(id));
    return response.data;
  },

  createChat: async (data: CreateChatRequest): Promise<ApiResponse<{ data: Chat }>> => {
    const response = await apiClient.post(API_ENDPOINTS.CREATE_CHAT, data);
    return response.data;
  },

  updateChat: async (id: string, data: UpdateChatRequest): Promise<ApiResponse<{ data: Chat }>> => {
    const response = await apiClient.patch(API_ENDPOINTS.UPDATE_CHAT(id), data);
    return response.data;
  },

  deleteChat: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(API_ENDPOINTS.DELETE_CHAT(id));
    return response.data;
  },

  createGroupChat: async (data: CreateGroupChatRequest): Promise<ApiResponse<{ data: Chat }>> => {
    const response = await apiClient.post(API_ENDPOINTS.CREATE_GROUP_CHAT, data);
    return response.data;
  },

  renameGroup: async (chatId: string, chatName: string): Promise<ApiResponse<{ data: Chat }>> => {
    const response = await apiClient.patch(API_ENDPOINTS.RENAME_GROUP, { chatId, chatName });
    return response.data;
  },

  addToGroup: async (chatId: string, userId: string): Promise<ApiResponse<{ data: Chat }>> => {
    const response = await apiClient.patch(API_ENDPOINTS.ADD_TO_GROUP, { chatId, userId });
    return response.data;
  },

  removeFromGroup: async (chatId: string, userId: string): Promise<ApiResponse<{ data: Chat }>> => {
    const response = await apiClient.patch(API_ENDPOINTS.REMOVE_FROM_GROUP, { chatId, userId });
    return response.data;
  },
};

