import { Query, Schema, model } from 'mongoose';
import { INotification, NotificationDoc, NotificationModel } from '../types/notification.type';
import AppError from '@utils/appError';

const notificationSchema = new Schema<NotificationDoc, NotificationModel, any>(
  {
    message: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    chat: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notification must have user'],
    },
    read: { type: Boolean, default: false },
  },
  {
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true, versionKey: false },
    timestamps: true,
  }
);

notificationSchema.pre<Query<INotification,INotification>>(/^find/, function (next) {
  this.populate({ path: 'user', select: 'name photo email' })
    .populate('message')
    .populate('chat');

  next();
});

// notification.post('save', async function () {
//   await this.populate({ path: 'user', select: 'name photo email' })
//     .populate({
//       path: 'message',
//     })
//     .execPopulate();
// });

const Notification = model<NotificationDoc>('Notification', notificationSchema);
export default Notification;
