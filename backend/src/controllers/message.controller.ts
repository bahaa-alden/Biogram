import Message from '@models/message.model';
import Chat from '@models/chat.model';
import UserChatPreference from '@models/userChatPreference.model';
import { NextFunction, Request, Response } from 'express';
import catchAsync from '@utils/catchAsync';
import APIFeatures from '@utils/apiFeatures';
import AppError from '@utils/appError';
import { Types } from 'mongoose';
import { encodeCursor, decodeCursor, isValidCursor } from '@utils/cursorUtils';
import {
  deleteOne,
  getAll,
  getOne,
  updateOne,
} from '@controllers/handlerFactory';

/**
 * Middleware to set sender and chat from request params/body
 */
export const setSenderAndChat = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.body.chat) req.body.chat = req.params.chatId;
  req.body.sender = req.user?.id;

  next();
};

/**
 * Get all messages with offset-based pagination (legacy support)
 */
export const getAllMessages = getAll(Message);

/**
 * Get messages with bidirectional cursor-based pagination
 * Supports:
 * - 'before': Load older messages (scroll up)
 * - 'after': Load newer messages (scroll down)
 * - 'around': Load messages around a center cursor (initial load with saved position)
 * Returns messages in chronological order (oldest first)
 */
export const getMessagesWithCursor = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { chatId } = req.params;
    const { cursor, limit, direction, centerCursor, before, after } = req.query;

    if (!chatId) {
      return next(new AppError(400, 'Chat ID is required'));
    }

    // Verify user has access to this chat
    const chat = await Chat.findById(chatId).select('users');
    if (!chat) {
      return next(new AppError(404, 'Chat not found'));
    }

    const chatUsers = chat.users || [];
    const hasAccess = chatUsers.some(
      (user: any) => user._id?.toString() === req.user?.id?.toString() || user.toString() === req.user?.id?.toString()
    );

    if (!hasAccess) {
      return next(new AppError(403, 'You do not have access to this chat'));
    }

    const userId = req.user?.id;
    if (!userId) {
      return next(new AppError(401, 'User not authenticated'));
    }

    const limitNum = Number(limit || 20);
    const beforeNum = before ? Number(before) : 50; // Default to 50 messages before center
    const afterNum = after ? Number(after) : 50; // Default to 50 messages after center
    const paginationDirection = (direction as 'before' | 'after' | 'around') || 'before';

    let messages: any[] = [];
    let hasMoreBefore = false;
    let hasMoreAfter = false;
    let oldestCursor: string | null = null;
    let newestCursor: string | null = null;
    let centerMessageIdUsed: string | null = null;

    // Handle 'around' direction - load messages around center cursor
    if (paginationDirection === 'around' && centerCursor) {
      try {
        let centerMessage: any = null;
        let centerObjectId: Types.ObjectId | null = null;
        
        // Try to decode cursor if it's base64 encoded, otherwise treat as ObjectId
        let centerMessageId: string = centerCursor as string;
        try {
          if (isValidCursor(centerCursor as string)) {
            const decoded = decodeCursor(centerCursor as string);
            centerMessageId = decoded.id;
          }
        } catch {
          // Not a base64 cursor, treat as ObjectId
        }
        
        // Verify center message exists
        if (Types.ObjectId.isValid(centerMessageId)) {
          centerObjectId = new Types.ObjectId(centerMessageId);
          centerMessage = await Message.findOne({
            _id: centerObjectId,
            chat: chatId,
          }).lean();
        }
        
        if (!centerMessage) {
          // Center message doesn't exist, try to find nearest neighbor or fallback to latest
          // Get user's preference to check for lastSeenMessageId
          const preference = await UserChatPreference.findOne({
            user: userId,
            chat: chatId,
          }).lean();
          
          let fallbackMessageId: string | null = null;
          if (preference?.lastSeenMessageId) {
            fallbackMessageId = preference.lastSeenMessageId.toString();
          } else {
            // Get latest message as fallback
            const latestMessage = await Message.findOne({ chat: chatId })
              .sort({ _id: -1 })
              .select('_id')
              .lean();
            if (latestMessage) {
              fallbackMessageId = latestMessage._id.toString();
            }
          }
          
          if (fallbackMessageId) {
            centerObjectId = new Types.ObjectId(fallbackMessageId);
            centerMessage = await Message.findOne({
              _id: centerObjectId,
              chat: chatId,
            }).lean();
            centerMessageIdUsed = fallbackMessageId;
          }
          
          if (!centerMessage) {
            // No fallback available, load most recent messages
            const query = Message.find({ chat: chatId });
            const queryParams = {
              limit: limitNum.toString(),
              direction: 'before' as 'before',
            };
            const features = new APIFeatures(query, queryParams);
            features.cursorPaginate();
            let fetchedMessages = await features.query.populate('sender', 'name photo email');
            const hasMore = fetchedMessages.length > limitNum;
            if (hasMore) {
              fetchedMessages = fetchedMessages.slice(0, limitNum);
            }
            
            // Convert to plain objects and ensure id field exists
            fetchedMessages = fetchedMessages.map((msg: any) => ({
              ...msg.toObject ? msg.toObject() : msg,
              id: msg._id?.toString() || msg.id,
            }));
            
            fetchedMessages.reverse();
            messages = fetchedMessages;
            hasMoreBefore = hasMore;
            if (messages.length > 0) {
              const oldest = messages[0];
              const newest = messages[messages.length - 1];
              oldestCursor = encodeCursor(oldest.id || oldest._id.toString(), oldest.createdAt);
              newestCursor = encodeCursor(newest.id || newest._id.toString(), newest.createdAt);
            }
          }
        }
        
        if (centerMessage && centerObjectId) {
          centerMessageIdUsed = centerMessage._id.toString();
          const centerCreatedAt = centerMessage.createdAt || new Date(centerMessage._id.getTimestamp());

          // Load older messages (before center) using createdAt + id comparison
        const olderMessages = await Message.find({
          chat: chatId,
            $or: [
              { createdAt: { $lt: centerCreatedAt } },
              {
                createdAt: centerCreatedAt,
          _id: { $lt: centerObjectId },
              },
            ],
        })
            .sort({ createdAt: -1, _id: -1 })
            .limit(beforeNum + 1) // +1 to check if there are more
            .populate('sender', 'name photo email')
          .lean();

          hasMoreBefore = olderMessages.length > beforeNum;
          const olderMessagesFinal = hasMoreBefore ? olderMessages.slice(0, beforeNum) : olderMessages;
        olderMessagesFinal.reverse(); // Reverse to get oldest first

        // Load newer messages (after and including center)
        const newerMessages = await Message.find({
          chat: chatId,
            $or: [
              { createdAt: { $gt: centerCreatedAt } },
              {
                createdAt: centerCreatedAt,
          _id: { $gte: centerObjectId },
              },
            ],
        })
            .sort({ createdAt: 1, _id: 1 })
            .limit(afterNum + 1) // +1 to check if there are more
            .populate('sender', 'name photo email')
          .lean();

          hasMoreAfter = newerMessages.length > afterNum;
          const newerMessagesFinal = hasMoreAfter 
            ? newerMessages.slice(0, afterNum) 
            : newerMessages;

        // Combine: older messages (oldest first) + newer messages (including center)
        messages = [...olderMessagesFinal, ...newerMessagesFinal];

          // Ensure messages have id field (for frontend compatibility)
          messages = messages.map((msg: any) => ({
            ...msg,
            id: msg._id?.toString() || msg.id,
          }));

          // Set cursors using new encoding format
          if (messages.length > 0) {
            const oldest = messages[0];
            const newest = messages[messages.length - 1];
            oldestCursor = encodeCursor(oldest.id || oldest._id.toString(), oldest.createdAt);
            newestCursor = encodeCursor(newest.id || newest._id.toString(), newest.createdAt);
          }
        }
      } catch (error) {
        return next(new AppError(400, `Invalid center cursor: ${error instanceof Error ? error.message : 'unknown error'}`));
      }
    } else {
      // Handle 'before' or 'after' direction
      let decodedCursor: { id: string; createdAt: string } | null = null;
      let cursorObjectId: Types.ObjectId | null = null;
      
      // Decode cursor if provided
      if (cursor) {
        try {
          if (isValidCursor(cursor as string)) {
            decodedCursor = decodeCursor(cursor as string);
            if (Types.ObjectId.isValid(decodedCursor.id)) {
              cursorObjectId = new Types.ObjectId(decodedCursor.id);
            }
          } else if (Types.ObjectId.isValid(cursor as string)) {
            // Fallback: treat as ObjectId and fetch createdAt
            cursorObjectId = new Types.ObjectId(cursor as string);
            const cursorMessage = await Message.findById(cursorObjectId).select('createdAt').lean() as any;
            if (cursorMessage) {
              decodedCursor = {
                id: cursorObjectId.toString(),
                createdAt: cursorMessage.createdAt?.toISOString() || new Date(cursorObjectId.getTimestamp()).toISOString(),
              };
            }
          }
        } catch (error) {
          // Invalid cursor, will proceed without it
        }
      }
      
      let fetchedMessages: any[] = [];
      
      if (paginationDirection === 'before') {
        // Load older messages (scroll up)
        if (decodedCursor && cursorObjectId) {
          const cursorCreatedAt = new Date(decodedCursor.createdAt);
          fetchedMessages = await Message.find({
            chat: chatId,
            $or: [
              { createdAt: { $lt: cursorCreatedAt } },
              {
                createdAt: cursorCreatedAt,
                _id: { $lt: cursorObjectId },
              },
            ],
          })
            .sort({ createdAt: -1, _id: -1 })
            .limit(limitNum + 1)
            .populate('sender', 'name photo email')
            .lean();
        } else {
          // No cursor: get newest messages
          fetchedMessages = await Message.find({ chat: chatId })
            .sort({ createdAt: -1, _id: -1 })
            .limit(limitNum + 1)
            .populate('sender', 'name photo email')
            .lean();
        }
        
        hasMoreBefore = fetchedMessages.length > limitNum;
        if (hasMoreBefore) {
        fetchedMessages = fetchedMessages.slice(0, limitNum);
      }

        // Reverse to get oldest first
        fetchedMessages.reverse();
        messages = fetchedMessages;
        
        if (messages.length > 0) {
          const oldest = messages[0];
          const newest = messages[messages.length - 1];
          oldestCursor = encodeCursor(oldest.id || oldest._id.toString(), oldest.createdAt);
          newestCursor = encodeCursor(newest.id || newest._id.toString(), newest.createdAt);
        }
      } else {
        // Load newer messages (scroll down)
        if (decodedCursor && cursorObjectId) {
          const cursorCreatedAt = new Date(decodedCursor.createdAt);
          fetchedMessages = await Message.find({
            chat: chatId,
            $or: [
              { createdAt: { $gt: cursorCreatedAt } },
              {
                createdAt: cursorCreatedAt,
                _id: { $gt: cursorObjectId },
              },
            ],
          })
            .sort({ createdAt: 1, _id: 1 })
            .limit(limitNum + 1)
            .populate('sender', 'name photo email')
            .lean();
        } else {
          // No cursor: get oldest messages
          fetchedMessages = await Message.find({ chat: chatId })
            .sort({ createdAt: 1, _id: 1 })
            .limit(limitNum + 1)
            .populate('sender', 'name photo email')
            .lean();
        }
        
        hasMoreAfter = fetchedMessages.length > limitNum;
        if (hasMoreAfter) {
          fetchedMessages = fetchedMessages.slice(0, limitNum);
        }
        
        messages = fetchedMessages;
        
        if (messages.length > 0) {
          const oldest = messages[0];
          const newest = messages[messages.length - 1];
          oldestCursor = encodeCursor(oldest.id || oldest._id.toString(), oldest.createdAt);
          newestCursor = encodeCursor(newest.id || newest._id.toString(), newest.createdAt);
        }
      }
      
      // Ensure messages have id field
      messages = messages.map((msg: any) => ({
        ...msg,
        id: msg._id?.toString() || msg.id,
      }));
    }

    // Calculate unread count and first unread message ID
    let unreadCount = 0;
    let firstUnreadMessageId: string | null = null;

    for (const message of messages) {
      const readers = message.readers || [];
      const isRead = readers.some((reader: any) => {
        const readerId = reader?._id?.toString() || reader?.toString();
        return readerId === userId;
      });

            if (!isRead) {
              unreadCount++;
              if (!firstUnreadMessageId) {
          firstUnreadMessageId = message._id.toString();
        }
      }
    }

    // Build pagination response
    const paginationResponse: any = {
      hasNextPage: false,
      hasPreviousPage: false,
    };

    if (paginationDirection === 'around') {
      paginationResponse.nextCursor = oldestCursor;
      paginationResponse.previousCursor = newestCursor;
      paginationResponse.hasNextPage = hasMoreBefore;
      paginationResponse.hasPreviousPage = hasMoreAfter;
      paginationResponse.hasMoreBefore = hasMoreBefore;
      paginationResponse.hasMoreAfter = hasMoreAfter;
    } else if (paginationDirection === 'before') {
      paginationResponse.nextCursor = oldestCursor;
      paginationResponse.hasNextPage = hasMoreBefore;
    } else {
      paginationResponse.previousCursor = newestCursor;
      paginationResponse.hasPreviousPage = hasMoreAfter;
    }

    res.status(200).json({
      status: 'success',
      data: {
        messages,
        unreadCount,
        firstUnreadMessageId,
        centerMessageIdUsed: centerMessageIdUsed || undefined,
        pagination: paginationResponse,
      },
    });
  }
);

/**
 * Save or update center message for a user in a chat (for scroll position)
 */
export const saveCenterMessage = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { chatId } = req.params;
    const { messageId } = req.body;
    const userId = req.user?.id;

    if (!chatId) {
      return next(new AppError(400, 'Chat ID is required'));
    }

    if (!messageId) {
      return next(new AppError(400, 'Message ID is required'));
    }

    if (!userId) {
      return next(new AppError(401, 'User not authenticated'));
    }

    // Verify user has access to this chat
    const chat = await Chat.findById(chatId).select('users');
    if (!chat) {
      return next(new AppError(404, 'Chat not found'));
    }

    const chatUsers = chat.users || [];
    const hasAccess = chatUsers.some(
      (user: any) => user._id?.toString() === userId?.toString() || user.toString() === userId?.toString()
    );

    if (!hasAccess) {
      return next(new AppError(403, 'You do not have access to this chat'));
    }

    // Verify message ID format is valid
    if (!Types.ObjectId.isValid(messageId)) {
      return next(new AppError(400, 'Invalid message ID format'));
    }

    // Save or update the preference (upsert) - only update centerMessageId
    const preference = await UserChatPreference.findOneAndUpdate(
      { user: userId, chat: chatId },
      { centerMessageId: messageId },
      { upsert: true, new: true }
    );

    res.status(200).json({
      status: 'success',
      data: {
        centerMessageId: preference.centerMessageId?.toString() || null,
      },
    });
  }
);

/**
 * Get read state for a user in a chat
 */
export const getReadState = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { chatId } = req.params;
    const userId = req.user?.id;

    if (!chatId) {
      return next(new AppError(400, 'Chat ID is required'));
    }

    if (!userId) {
      return next(new AppError(401, 'User not authenticated'));
    }

    // Verify user has access to this chat
    const chat = await Chat.findById(chatId).select('users');
    if (!chat) {
      return next(new AppError(404, 'Chat not found'));
    }

    const chatUsers = chat.users || [];
    const hasAccess = chatUsers.some(
      (user: any) => user._id?.toString() === userId?.toString() || user.toString() === userId?.toString()
    );

    if (!hasAccess) {
      return next(new AppError(403, 'You do not have access to this chat'));
    }

    // Get user's read state
    const preference = await UserChatPreference.findOne({
      user: userId,
      chat: chatId,
    }).lean();

    res.status(200).json({
      status: 'success',
      data: {
        centerMessageId: preference?.centerMessageId?.toString() || null,
        lastSeenMessageId: preference?.lastSeenMessageId?.toString() || null,
        lastSeenAt: preference?.lastSeenAt || null,
      },
    });
  }
);

/**
 * Update read state for a user in a chat
 */
export const updateReadState = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { chatId } = req.params;
    const { messageId } = req.body;
    const userId = req.user?.id;

    if (!chatId) {
      return next(new AppError(400, 'Chat ID is required'));
    }

    if (!messageId) {
      return next(new AppError(400, 'Message ID is required'));
    }

    if (!userId) {
      return next(new AppError(401, 'User not authenticated'));
    }

    // Verify user has access to this chat
    const chat = await Chat.findById(chatId).select('users');
    if (!chat) {
      return next(new AppError(404, 'Chat not found'));
    }

    const chatUsers = chat.users || [];
    const hasAccess = chatUsers.some(
      (user: any) => user._id?.toString() === userId?.toString() || user.toString() === userId?.toString()
    );

    if (!hasAccess) {
      return next(new AppError(403, 'You do not have access to this chat'));
    }

    // Verify message ID format is valid
    if (!Types.ObjectId.isValid(messageId)) {
      return next(new AppError(400, 'Invalid message ID format'));
    }

    // Update read state (lastSeenMessageId and lastSeenAt)
    const preference = await UserChatPreference.findOneAndUpdate(
      { user: userId, chat: chatId },
      {
        lastSeenMessageId: messageId,
        lastSeenAt: new Date(),
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      status: 'success',
      data: {
        lastSeenMessageId: preference.lastSeenMessageId?.toString() || null,
        lastSeenAt: preference.lastSeenAt || null,
      },
    });
  }
);

// Keep old function name for backward compatibility (deprecated)
export const saveLastVisibleMessage = saveCenterMessage;

/**
 * Get a single message by ID
 */
export const getMessage = getOne(Message);

/**
 * Create a new message
 */
export const CreateMessage = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const doc = await Message.create(req.body);

    await doc.populate({
      path: 'sender',
      select: 'name photo email _id',
    });
    await doc.populate({
      path: 'chat',
      select: { lastMessage: 0 },
      populate: {
        path: 'users',
        select: 'name photo email _id',
      },
    });

    res.status(201).json({
      status: 'success',
      data: { data: doc },
    });
  }
);

/**
 * Update a message
 */
export const updateMessage = updateOne(Message);

/**
 * Delete a message
 */
export const deleteMessage = deleteOne(Message);

/**
 * Mark messages as read for the current user
 */
export const markMessagesAsRead = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { chatId } = req.params;
    const { lastMessageId } = req.body;
    const userId = req.user?.id;

    if (!chatId) {
      return next(new AppError(400, 'Chat ID is required'));
    }

    if (!userId) {
      return next(new AppError(401, 'User not authenticated'));
    }

    // Verify user has access to this chat
    const chat = await Chat.findById(chatId).select('users');
    if (!chat) {
      return next(new AppError(404, 'Chat not found'));
    }

    const chatUsers = chat.users || [];
    const hasAccess = chatUsers.some(
      (user: any) => user._id?.toString() === userId?.toString() || user.toString() === userId?.toString()
    );

    if (!hasAccess) {
      return next(new AppError(403, 'You do not have access to this chat'));
    }

    // Build query for unread messages
    const query: any = {
      chat: chatId,
      readers: { $nin: [userId] },
    };

    // If lastMessageId is provided, only mark messages up to that message
    if (lastMessageId) {
      try {
        const lastMessageObjectId = new Types.ObjectId(lastMessageId);
        query._id = { $lte: lastMessageObjectId };
      } catch (error) {
        const lastMessage = await Message.findById(lastMessageId).select('createdAt').lean();
        if (lastMessage && (lastMessage as any).createdAt) {
          query.createdAt = { $lte: (lastMessage as any).createdAt };
        }
      }
    }

    // Update all matching messages
    const result = await Message.updateMany(
      query,
      {
        $addToSet: { readers: userId },
      }
    ).maxTimeMS(10000);

    res.status(200).json({
      status: 'success',
      data: {
        modifiedCount: result.modifiedCount,
      },
    });
  }
);
