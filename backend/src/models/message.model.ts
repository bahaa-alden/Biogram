import AppError from '@utils/appError';
import logger from '@utils/logger';
import { PopulatedDoc, Query, Schema, Types, model } from 'mongoose';
import { IMessage, MessageDoc, MessageModel } from '../types/message.type';
import { IUser } from '../types/user.type';
import Chat from './chat.model';
import Notification from './notification.model';

const messageSchema = new Schema<MessageDoc, MessageModel, any>(
  {
    content: { type: String, required: [true, 'message must have a content'] },
    sender: {
      type: Types.ObjectId,
      required: [true, 'message must have a sender'],
      ref: 'User',
    },
    chat: {
      type: Types.ObjectId,
      ref: 'Chat',
      required: [true, 'message must belong to a chat'],
    },
    readers: [{
      type: Types.ObjectId,
      ref: 'User',
    }],
  },
  {
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true, versionKey: false },
    timestamps: true,
  }
);
messageSchema.pre('save', async function (next) {
  const chat = await Chat.findOne({
    _id: this.chat,
    users: { $elemMatch: { $eq: this.sender } },
  });
  if (!chat) return next(new AppError(400, 'you do not belong to this chat'));
  
  // Auto-add sender to readers array (sender has read their own message)
  if (this.isNew && this.sender) {
    if (!this.readers) {
      this.readers = [];
    }
    const senderId = this.sender.toString();
    if (!this.readers.some((reader: any) => reader?.toString() === senderId)) {
      this.readers.push(this.sender);
    }
  }
  
  next();
});

// Combined post-save hook for better performance
messageSchema.post('save', async function (doc, next) {
  try {
    // Update chat's lastMessage and populate in parallel
    const [updatedChat] = await Promise.all([
      Chat.findByIdAndUpdate(this.chat, { lastMessage: doc }, { new: true }),
      doc.populate({
        path: 'sender',
        select: 'name photo email',
      }),
      doc.populate({ path: 'chat', select: { lastMessage: 0 } }),
    ]);

    // Create notifications for all users except sender
    if (doc.chat && doc.sender) {
      const users: Array<PopulatedDoc<IUser> | Types.ObjectId> = doc.chat.users;
      const senderId = doc.sender.id || doc.sender._id;

      // Batch notification creation
      const notificationPromises = users
        .filter((user: any) => {
          const userId = user.id || user._id || user.toString();
          return userId && userId !== senderId;
        })
        .map((user: any) => {
          const userId = user.id || user._id || user.toString();
          return Notification.create({
            message: doc.id,
            chat: doc.chat.id,
            user: userId,
          });
        });

      // Don't await notifications - fire and forget for better performance
      Promise.all(notificationPromises).catch((error) => {
        logger.error('Error creating notifications', error, { messageId: doc.id });
      });
    }

    next();
  } catch (error) {
    next(error as Error);
  }
});

messageSchema.pre<Query<IMessage, IMessage>>(/^find/, function (next) {
  this.populate({ path: 'sender', select: 'name photo email' });

  next();
});

// Compound indexes for performance optimization
// Index for cursor pagination: chat + _id (for efficient cursor-based queries)
messageSchema.index({ chat: 1, _id: -1 });
// Index for chat messages sorted by creation date
messageSchema.index({ chat: 1, createdAt: -1 });
// Index for sender queries
messageSchema.index({ sender: 1, createdAt: -1 });
// Index for cursor pagination by date
messageSchema.index({ chat: 1, createdAt: -1, _id: -1 });
// Index for readers array queries (for unread message counting)
messageSchema.index({ readers: 1 });

const Message = model<MessageDoc>('Message', messageSchema);
export default Message;
