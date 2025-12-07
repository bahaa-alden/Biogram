import { User, Chat, Message, Notification } from '../../types/interfaces';

export type { User, Chat, Message, Notification };

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  passwordConfirm?: string;
  photo?: string;
}

export interface CreateChatRequest {
  userId: string;
}

export interface CreateGroupChatRequest {
  name: string;
  users: string[];
}

export interface SendMessageRequest {
  content: string;
}

export interface UpdateChatRequest {
  name?: string;
  users?: string[];
}

export interface SearchUsersParams {
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface GetMessagesParams {
  page?: number;
  limit?: number;
}

