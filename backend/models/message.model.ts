import { Schema, model, Types } from 'mongoose';
import { MessageModel, MessageDoc } from '../types/message.type';
import Chat from './chat.model';
import { IUser, UserDoc } from '../types/user.type';
import Notification from './notification.model';
import AppError from '@utils/appError';

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
});

messageSchema.post('save', async function (doc) {
  await this.populate({
    path: 'sender',
    select: 'name photo email ',
  })
    .populate('chat')
    .execPopulate();
  await Chat.findByIdAndUpdate(this.chat, { lastMessage: doc });
});

messageSchema.post('save', async function (doc) {
  const users: Array<IUser> = doc.chat.users;
  users.forEach(async (user) => {
    if (user.id === doc.sender.id) return;
    await Notification.create({
      message: doc.id,
      chat: doc.chat.id,
      user: user.id,
    });
  });
});
messageSchema.pre(/^find/, function (next) {
  this.populate({ path: 'sender', select: 'name photo email ' }).populate({
    path: 'chat',
    select: '-lastMessage',
  });
  next();
});
const Message = model<MessageDoc>('Message', messageSchema);
export default Message;
