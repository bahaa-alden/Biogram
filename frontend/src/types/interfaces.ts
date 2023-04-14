import { ReactNode } from 'react';

export interface User {
  name?: string;
  photo?: string;
  email?: string;
  role?: string;
  id?: string;
}
export interface Chat {
  id?: string;
  name?: string;
  users: User[];
  lastMessage?: Message;
  isGroup?: boolean;
  groupAdmin: User;
}

export interface Message {
  id?: string;
  chat?: any;
  content?: string;
  sender: User;
}

export type props = {
  children: ReactNode;
};
