import { Document, Model, PopulatedDoc, Types } from 'mongoose';
import { IUser } from './user.type';
import { IChat } from './chat.type';

export interface IMessage {
  content: string;
  sender: PopulatedDoc<IUser> | Types.ObjectId;
  chat: IChat;
}

export type MessageDoc = IMessage & Document;

export type MessageModel = Model<IMessage, {}, any>;
