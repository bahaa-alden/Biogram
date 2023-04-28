import { Document, Model, PopulatedDoc, Types } from 'mongoose';
import { IUser } from './user.type';
import { IMessage } from './message.type';
import { IChat } from './chat.type';

export interface INotification {
  user: Types.ObjectId | PopulatedDoc<IUser>;
  message: Types.ObjectId | PopulatedDoc<IMessage>;
  chat: Types.ObjectId | PopulatedDoc<IChat>;
  read: boolean;
}

export type NotificationDoc = INotification & Document;

export type NotificationModel = Model<INotification, {}, any>;
