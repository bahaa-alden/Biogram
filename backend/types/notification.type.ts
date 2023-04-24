import { Document, Model, Schema } from 'mongoose';

export interface INotification {
  user: Schema.Types.ObjectId;
  message: Schema.Types.ObjectId | string;
  chat: Schema.Types.ObjectId | string;
  read: boolean;
}

export type NotificationDoc = INotification & Document;

export type NotificationModel = Model<INotification, {}, any>;
