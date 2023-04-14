import { Schema, model, Types } from 'mongoose';
import { MessageModel, MessageDoc } from '../types/message.type';
import Chat from './chat.model';
import { IUser } from '../types/user.type';

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

messageSchema.post('save', async function (doc) {
  await this.populate({
    path: 'sender',
    select: 'name photo email ',
  })
    .populate('chat')
    .execPopulate();
  await Chat.findByIdAndUpdate(this.chat, { lastMessage: doc });
});

messageSchema.pre(/^find/, function (next) {
  this.populate({ path: 'sender', select: 'name photo email ' });
  // this.populate('chat').execPopulate();
  next();
});
const Message = model<MessageDoc>('Message', messageSchema);
export default Message;
