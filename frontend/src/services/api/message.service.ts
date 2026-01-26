import apiClient from './client';
import { API_ENDPOINTS } from './endpoints';
import {
  ApiResponse,
  GetMessagesParams,
  Message,
  SendMessageRequest,
  CursorPaginatedMessagesResponse,
  CenterMessageResponse,
  ReadStateResponse,
} from './types';

export const messageService = {
  /**
   * Get messages with offset-based pagination (legacy)
   */
  getMessages: async (
    chatId: string,
    params?: GetMessagesParams
  ): Promise<ApiResponse<{ data: Message[] }>> => {
    const response = await apiClient.get(API_ENDPOINTS.GET_MESSAGES(chatId), {
      params,
    });
    return response.data;
  },

  /**
   * Get messages with cursor-based pagination
   */
  getMessagesWithCursor: async (
    chatId: string,
    params?: GetMessagesParams
  ): Promise<ApiResponse<CursorPaginatedMessagesResponse>> => {
    const response = await apiClient.get(
      `${API_ENDPOINTS.GET_MESSAGES(chatId)}/cursor`,
      { params }
    );
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

  markMessagesAsRead: async (
    chatId: string,
    lastMessageId?: string
  ): Promise<ApiResponse<{ modifiedCount: number }>> => {
    const response = await apiClient.patch(API_ENDPOINTS.MARK_MESSAGES_READ(chatId), {
      lastMessageId,
    });
    return response.data;
  },

  saveLastVisibleMessage: async (
    chatId: string,
    messageId: string
  ): Promise<ApiResponse<{ lastVisibleMessageId: string }>> => {
    const response = await apiClient.patch(API_ENDPOINTS.SAVE_LAST_VISIBLE_MESSAGE(chatId), {
      messageId,
    });
    return response.data;
  },

  saveCenterMessage: async (
    chatId: string,
    messageId: string
  ): Promise<ApiResponse<CenterMessageResponse>> => {
    const response = await apiClient.patch(API_ENDPOINTS.SAVE_CENTER_MESSAGE(chatId), {
      messageId,
    });
    return response.data;
  },

  getReadState: async (
    chatId: string
  ): Promise<ApiResponse<ReadStateResponse>> => {
    const response = await apiClient.get(API_ENDPOINTS.GET_READ_STATE(chatId));
    return response.data;
  },

  updateReadState: async (
    chatId: string,
    messageId: string
  ): Promise<ApiResponse<ReadStateResponse>> => {
    const response = await apiClient.patch(API_ENDPOINTS.UPDATE_READ_STATE(chatId), {
      messageId,
    });
    return response.data;
  },
};

