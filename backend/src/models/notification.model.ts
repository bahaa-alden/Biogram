import { Query, Schema, model } from 'mongoose';
import {
  INotification,
  NotificationDoc,
  NotificationModel,
} from '../types/notification.type';

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
) as Schema<NotificationDoc, NotificationModel, any>;

notificationSchema.pre<Query<INotification, INotification>>(
  /^find/,
  function (next) {
    this.populate({
      path: 'chat',
      select: {
        id: 1,
        isGroup: 1,
        name: 1,
        groupAdmin: 1,
        users: 1,
        lastMessage: 0,
      },
    });

    next();
  }
);

// notification.post('save', async function () {
//   await this.populate({ path: 'user', select: 'name photo email' })
//     .populate({
//       path: 'message',
//     })
//     .execPopulate();
// });

const Notification = model<NotificationDoc>('Notification', notificationSchema);
export default Notification;
