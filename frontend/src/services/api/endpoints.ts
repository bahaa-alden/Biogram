export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/users/login',
  SIGNUP: '/users/signup',
  LOGOUT: '/users/logout',
  FORGOT_PASSWORD: '/users/forgotPassword',
  RESET_PASSWORD: (token: string) => `/users/resetPassword/${token}`,
  UPDATE_PASSWORD: '/users/updateMyPassword',
  
  // User
  GET_ME: '/users/me',
  GET_USER: (id: string) => `/users/${id}`,
  GET_USERS: '/users',
  UPDATE_ME: '/users/updateMe',
  UPDATE_USER: (id: string) => `/users/${id}`,
  DELETE_ME: '/users/deleteMe',
  DELETE_USER: (id: string) => `/users/${id}`,
  
  // Chat
  GET_CHATS: '/chats',
  GET_CHAT: (id: string) => `/chats/${id}`,
  CREATE_CHAT: '/chats',
  UPDATE_CHAT: (id: string) => `/chats/${id}`,
  DELETE_CHAT: (id: string) => `/chats/${id}`,
  CREATE_GROUP_CHAT: '/chats/group',
  RENAME_GROUP: '/chats/groupRename',
  ADD_TO_GROUP: '/chats/groupAdd',
  REMOVE_FROM_GROUP: '/chats/groupRemove',
  
  // Messages
  GET_MESSAGES: (chatId: string) => `/chats/${chatId}/messages`,
  SEND_MESSAGE: (chatId: string) => `/chats/${chatId}/messages`,
  GET_MESSAGE: (chatId: string, messageId: string) => `/chats/${chatId}/messages/${messageId}`,
  UPDATE_MESSAGE: (chatId: string, messageId: string) => `/chats/${chatId}/messages/${messageId}`,
  DELETE_MESSAGE: (chatId: string, messageId: string) => `/chats/${chatId}/messages/${messageId}`,
  
  // Notifications
  GET_NOTIFICATIONS: (userId: string) => `/users/${userId}/notifications`,
  MARK_NOTIFICATION_READ: (chatId: string) => `/chats/${chatId}/notifications/read`,
  GET_NOTIFICATION: (userId: string, notificationId: string) => `/users/${userId}/notifications/${notificationId}`,
  UPDATE_NOTIFICATION: (userId: string, notificationId: string) => `/users/${userId}/notifications/${notificationId}`,
  DELETE_NOTIFICATION: (userId: string, notificationId: string) => `/users/${userId}/notifications/${notificationId}`,
} as const;

