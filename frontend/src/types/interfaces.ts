import { ReactNode } from 'react';

export interface User {
  name?: string;
  photo?: string;
  email?: string;
  role?: string;
  id?: string;
  _id?: string;
}

export interface Chat {
  id?: string;
  _id?: string;
  name?: string;
  users: User[];
  lastMessage?: Message;
  isGroup?: boolean;
  groupAdmin: User;
}

export interface Message {
  id?: string;
  _id?: string;
  chat?: Chat;
  content?: string;
  sender: User;
  createdAt: string | Date;
}

export interface Notification {
  id?: string;
  _id?: string;
  chat?: Chat;
  message?: Message;
  read?: boolean;
  createdAt?: string | Date;
}

export type props = {
  children: ReactNode;
};
