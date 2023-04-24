import { Document, Types, Model } from 'mongoose';
import { IUser } from './user.type';
import { ChatDoc, IChat } from './chat.type';

export interface IMessage {
  content: string;
  sender: IUser | Types.ObjectId;
  chat: IChat;
}

export type MessageDoc = IMessage & Document;

export type MessageModel = Model<IMessage, {}, any>;
