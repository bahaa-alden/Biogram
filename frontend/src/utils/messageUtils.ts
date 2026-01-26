import { Message } from '../types/interfaces';

/**
 * Validate if a message object is valid
 */
export const isValidMessage = (message: unknown): message is Message => {
  if (!message || typeof message !== 'object') return false;
  const msg = message as Partial<Message>;
  return !!(msg.id || msg._id) && !!msg.createdAt;
};

/**
 * Normalize message structure to ensure consistency
 */
export const normalizeMessage = (message: Partial<Message>): Message | null => {
  if (!isValidMessage(message)) return null;

  return {
    ...message,
    id: message.id || message._id || '',
    createdAt: message.createdAt!,
  } as Message;
};

/**
 * Check if two messages are the same
 */
export const isSameMessage = (msg1: Message, msg2: Message): boolean => {
  const id1 = msg1.id || msg1._id;
  const id2 = msg2.id || msg2._id;
  return !!(id1 && id2 && id1 === id2);
};

/**
 * Check if message is a temporary message (optimistic update)
 */
export const isTempMessage = (message: Message): boolean => {
  const id = message.id || message._id;
  return !!(id && typeof id === 'string' && id.startsWith('temp-'));
};

/**
 * Filter and validate messages array
 */
export const filterValidMessages = (messages: unknown[]): Message[] => {
  return messages
    .map((msg) => normalizeMessage(msg as Partial<Message>))
    .filter((msg): msg is Message => msg !== null);
};

/**
 * Deduplicate messages by ID
 */
export const deduplicateMessages = (messages: Message[]): Message[] => {
  const seen = new Set<string>();
  return messages.filter((msg) => {
    const id = msg.id || msg._id;
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

