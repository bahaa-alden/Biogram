import { Message } from '../types/interfaces';
import { normalizeMessage, isValidMessage } from './messageUtils';

/**
 * Normalize socket message to ensure consistent structure
 */
export const normalizeSocketMessage = (message: unknown): Message | null => {
  if (!isValidMessage(message)) {
    return null;
  }
  return normalizeMessage(message);
};

/**
 * Check if message should be added to cache (deduplication)
 */
export const shouldAddMessage = (
  message: Message,
  existingMessages: Message[]
): boolean => {
  const messageId = message.id || message._id;
  if (!messageId) return false;

  // Check if message already exists
  const exists = existingMessages.some((msg) => {
    const msgId = msg.id || msg._id;
    return msgId && msgId === messageId && !msg.id?.startsWith('temp-');
  });

  return !exists;
};

/**
 * Find and replace temp message with real message
 */
export const replaceTempMessage = (
  realMessage: Message,
  messages: Message[]
): Message[] => {
  return messages.map((msg) => {
    if (
      msg.id?.startsWith('temp-') &&
      msg.content === realMessage.content &&
      msg.sender?.id === realMessage.sender?.id
    ) {
      return realMessage;
    }
    return msg;
  });
};

