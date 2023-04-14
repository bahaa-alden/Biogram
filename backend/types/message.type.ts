import { Document, Types, Model } from 'mongoose';

export interface IMessage {
  message: string;
  sender: Types.ObjectId;
  chat: Types.ObjectId;
  cc(): string;
}

export type MessageDoc = IMessage & Document;

export type MessageModel = Model<IMessage, {}, any>;
