import { Schema, model } from 'mongoose';
import { ChatModel, ChatDoc } from '../types/chat.type';
import AppError from '@utils/appError';
import Notification from '@models/notification.model';

const chatSchema = new Schema<ChatDoc, ChatModel, any>(
  {
    name: {
      type: String,
      required: [true, 'Chat must have a name'],
      minlength: 1,
      maxlength: 16,
    },
    users: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      required: [true, 'Chat must have users'],
    },
    lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
    isGroup: { type: Boolean, default: false },
    groupAdmin: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true, versionKey: false },
    timestamps: true,
  }
);

chatSchema.pre('save', function (next) {
  if (!this.isModified('users')) return next();
  if (this.users.length < 3 && this.isGroup) {
    return next(new AppError(400, 'Group must contain 3 users including you'));
  }
  next();
});

chatSchema.post('save', async function () {
  await this.populate({ path: 'users', select: 'name photo email' });
  await this.populate({ path: 'groupAdmin', select: 'name photo email' });
});

chatSchema.pre(/^find/, function (next) {
  this.populate('users', 'name photo email')
    .populate('groupAdmin', 'name photo email')
    .populate('lastMessage');
  next();
});

chatSchema.methods.createNotification = async function (users: any) {
  if (!this.isGroup) return;
  users.forEach(async (user: any) => {
    if (user === this.groupAdmin.id) return;
    await Notification.create({
      chat: this.id,
      user,
    });
  });
};
const Chat = model<ChatDoc>('Chat', chatSchema);
export default Chat;
