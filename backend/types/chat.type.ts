import { Document, Model, Types } from 'mongoose';
import { IUser } from './user.type';
import { IMessage } from './message.type';

export interface IChat {
  id:string;
  name: string;
  users: IUser[] | Types.ObjectId[];
  lastMessage?: Types.ObjectId | IMessage;
  isGroup: boolean;
  groupAdmin?: Types.ObjectId | IUser;
  createNotification(userId: string): void;
}

export type ChatDoc = IChat & Document;

export type ChatModel = Model<IChat, {}, any>;
