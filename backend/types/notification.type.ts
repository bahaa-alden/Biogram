import { Document, Model, Schema } from 'mongoose';

export interface INotification {
  user: Schema.Types.ObjectId;
  message: Schema.Types.ObjectId;
  chat: Schema.Types.ObjectId;
  read: boolean;
}

export type NotificationDoc = INotification & Document;

export type NotificationModel = Model<INotification, {}, any>;
