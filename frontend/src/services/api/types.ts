import { User, Chat, Message, Notification } from '../../types/interfaces';

export type { User, Chat, Message, Notification };

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data: T;
  message?: string;
}

export interface ApiError {
  status: 'error' | 'fail';
  message: string;
  error?: Error | string;
  statusCode?: number;
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
  cursor?: string;
  direction?: 'before' | 'after' | 'around';
  centerCursor?: string;
  before?: number; // Number of messages to fetch before center (for 'around' direction)
  after?: number; // Number of messages to fetch after center (for 'around' direction)
}

export interface CursorPaginationResponse {
  nextCursor?: string | null;
  previousCursor?: string | null;
  hasNextPage: boolean;
  hasPreviousPage?: boolean;
  hasMoreBefore?: boolean;
  hasMoreAfter?: boolean;
}

export interface CursorPaginatedMessagesResponse {
  messages: Message[];
  unreadCount: number;
  firstUnreadMessageId: string | null;
  centerMessageIdUsed?: string; // The actual center message ID used (may differ if center invalid)
  pagination: CursorPaginationResponse;
}

export interface ReadStateResponse {
  centerMessageId: string | null;
  lastSeenMessageId: string | null;
  lastSeenAt: string | null;
}

export interface CenterMessageResponse {
  centerMessageId: string | null;
}

