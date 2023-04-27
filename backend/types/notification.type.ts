import { Document, Model, Schema } from 'mongoose';
import { IUser } from './user.type';
import { IMessage } from './message.type';
import { IChat } from './chat.type';

export interface INotification {
  user: Schema.Types.ObjectId | IUser;
  message: Schema.Types.ObjectId | IMessage;
  chat: Schema.Types.ObjectId | IChat;
  read: boolean;
}

export type NotificationDoc = INotification & Document;

export type NotificationModel = Model<INotification, {}, any>;
