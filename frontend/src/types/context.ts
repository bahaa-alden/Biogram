import { Chat, Notification, User } from './interfaces';

export type GlobalContextType = {
  user: User;
  setUser: (value: User) => void;
  chats: Chat[];
  setChats: (value: Chat[]) => void;
  selectedChat: Chat | null;
  setSelectedChat: (value: Chat | null) => void;
  notification: Notification[];
  setNotification: (value: Notification[]) => void;
  lo: boolean;
  setLo: (value: boolean) => void;
};

export const INITIAL_VALUE: GlobalContextType = {
  user: {},
  setUser: () => {},
  chats: [],
  setChats: () => {},
  selectedChat: { users: [], groupAdmin: {} },
  setSelectedChat: () => {},
  notification: [],
  setNotification: () => {},
  lo: false,
  setLo: () => false,
};
// interface init {}
