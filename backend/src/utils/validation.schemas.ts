import { z } from 'zod';

// Common schemas
export const mongoIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ID');

// Auth schemas
export const signupSchema = {
  body: z
    .object({
      name: z
        .string()
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name must be less than 50 characters'),
      email: z.email('Invalid email address'),
      password: z.string().min(8, 'Password must be at least 8 characters'),
      passwordConfirm: z.string().optional(),
      photo: z.url('Photo must be a valid URL').optional(),
    })
    .refine(
      (data) => !data.passwordConfirm || data.password === data.passwordConfirm,
      {
        message: 'Passwords do not match',
        path: ['passwordConfirm'],
      }
    ),
};

export const loginSchema = {
  body: z.object({
    email: z.email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
};

export const forgotPasswordSchema = {
  body: z.object({
    email: z.email('Invalid email address'),
  }),
};

export const resetPasswordSchema = {
  params: z.object({
    token: z.string().min(1, 'Token is required'),
  }),
  body: z
    .object({
      password: z.string().min(8, 'Password must be at least 8 characters'),
      passwordConfirm: z.string(),
    })
    .refine((data) => data.password === data.passwordConfirm, {
      message: 'Passwords do not match',
      path: ['passwordConfirm'],
    }),
};

export const updatePasswordSchema = {
  body: z
    .object({
      passwordCurrent: z.string().min(1, 'Current password is required'),
      password: z.string().min(8, 'Password must be at least 8 characters'),
      passwordConfirm: z.string(),
    })
    .refine((data) => data.password === data.passwordConfirm, {
      message: 'Passwords do not match',
      path: ['passwordConfirm'],
    }),
};

// User schemas
export const getUserSchema = {
  params: z.object({
    id: mongoIdSchema,
  }),
};

export const updateUserSchema = {
  params: z.object({
    id: mongoIdSchema,
  }),
  body: z.object({
    name: z.string().min(2).max(50).optional(),
    email: z.email().optional(),
    role: z.enum(['user', 'admin']).optional(),
    photo: z.url().optional(),
  }),
};

export const updateMeSchema = {
  body: z.object({
    name: z.string().min(2).max(50).optional(),
    email: z.email().optional(),
    photo: z.url().optional(),
  }),
};

export const getAllUsersSchema = {
  query: z.object({
    search: z.string().optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    sort: z.string().optional(),
  }),
};

// Chat schemas
export const accessChatSchema = {
  body: z.object({
    userId: mongoIdSchema,
  }),
};

export const createGroupChatSchema = {
  body: z.object({
    name: z
      .string()
      .min(1, 'Group name is required')
      .max(50, 'Group name must be less than 50 characters'),
    users: z
      .array(mongoIdSchema)
      .min(2, 'At least 2 users are required for a group chat'),
  }),
};

export const renameGroupSchema = {
  body: z.object({
    chatId: mongoIdSchema,
    name: z
      .string()
      .min(1, 'Group name is required')
      .max(50, 'Group name must be less than 50 characters')
      .trim(),
  }),
};

export const addToGroupSchema = {
  body: z.object({
    chatId: mongoIdSchema,
    userId: mongoIdSchema,
  }),
};

export const removeFromGroupSchema = {
  body: z.object({
    chatId: mongoIdSchema,
    userId: mongoIdSchema,
  }),
};

export const getChatSchema = {
  params: z.object({
    id: mongoIdSchema,
  }),
};

export const updateChatSchema = {
  params: z.object({
    id: mongoIdSchema,
  }),
  body: z.object({
    name: z.string().min(1).max(50).optional(),
    users: z.array(mongoIdSchema).optional(),
  }),
};

export const getAllChatsSchema = {
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
};

// Message schemas
export const createMessageSchema = {
  body: z.object({
    content: z
      .string()
      .min(1, 'Message content is required')
      .max(5000, 'Message must be less than 5000 characters'),
  }),
  params: z.object({
    chatId: mongoIdSchema,
  }),
};

export const getMessageSchema = {
  params: z.object({
    id: mongoIdSchema,
    chatId: mongoIdSchema,
  }),
};

export const updateMessageSchema = {
  params: z.object({
    id: mongoIdSchema,
    chatId: mongoIdSchema,
  }),
  body: z.object({
    content: z
      .string()
      .min(1, 'Message content is required')
      .max(5000, 'Message must be less than 5000 characters'),
  }),
};

export const deleteMessageSchema = {
  params: z.object({
    id: mongoIdSchema,
    chatId: mongoIdSchema,
  }),
};

export const getAllMessagesSchema = {
  params: z.object({
    chatId: mongoIdSchema,
  }),
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
};

// Notification schemas
export const getNotificationsSchema = {
  params: z.object({
    userId: mongoIdSchema,
  }),
  query: z.object({
    read: z
      .enum(['true', 'false'])
      .transform((val) => val === 'true')
      .optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
};

export const markNotificationReadSchema = {
  params: z.object({
    chatId: mongoIdSchema,
  }),
};

export const markNotificationsReadByIdsSchema = {
  params: z.object({
    userId: mongoIdSchema,
  }),
  body: z.object({
    notificationIds: z
      .array(mongoIdSchema)
      .min(1, 'At least one notification ID is required'),
  }),
};
