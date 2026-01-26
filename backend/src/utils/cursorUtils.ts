/**
 * Cursor encoding/decoding utilities for stable pagination
 * Uses base64-encoded JSON with message id and createdAt for reliable ordering
 */

export interface CursorData {
  id: string;
  createdAt: string; // ISO string
}

/**
 * Encode cursor from message id and createdAt
 * @param id - Message ID (ObjectId string)
 * @param createdAt - Message creation date
 * @returns Base64-encoded JSON string
 */
export function encodeCursor(id: string, createdAt: Date | string): string {
  const createdAtStr = typeof createdAt === 'string' ? createdAt : createdAt.toISOString();
  const data: CursorData = {
    id,
    createdAt: createdAtStr,
  };
  const json = JSON.stringify(data);
  return Buffer.from(json).toString('base64');
}

/**
 * Decode cursor to get message id and createdAt
 * @param cursor - Base64-encoded cursor string
 * @returns Decoded cursor data with id and createdAt
 * @throws Error if cursor is invalid
 */
export function decodeCursor(cursor: string): CursorData {
  try {
    const json = Buffer.from(cursor, 'base64').toString('utf-8');
    const data = JSON.parse(json) as CursorData;
    
    if (!data.id || !data.createdAt) {
      throw new Error('Invalid cursor: missing id or createdAt');
    }
    
    return data;
  } catch (error) {
    throw new Error(`Invalid cursor format: ${error instanceof Error ? error.message : 'unknown error'}`);
  }
}

/**
 * Validate if a cursor string is valid
 * @param cursor - Cursor string to validate
 * @returns True if valid, false otherwise
 */
export function isValidCursor(cursor: string): boolean {
  try {
    decodeCursor(cursor);
    return true;
  } catch {
    return false;
  }
}

