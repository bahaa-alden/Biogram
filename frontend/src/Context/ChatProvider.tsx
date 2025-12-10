import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../hooks/queries/useAuth';
import { GlobalContextType, INITIAL_VALUE } from '../types/context';
import { Chat, Notification, User, props } from '../types/interfaces';

const ChatContext = createContext<GlobalContextType>(INITIAL_VALUE);

const ChatProvider = ({ children }: props) => {
  // Get user from React Query
  const { data: userData, isLoading: userLoading } = useAuth();
  const [user, setUser] = useState<User>({});
  const [selectedChat, setSelectedChat] = useState<Chat|null>(null);
  const [notification, setNotification] = useState<Notification[]>([]);
  const [lo, setLo] = useState(true);

  // Update user when query data changes
  useEffect(() => {
    if (userData) {
      setUser(userData);
    }
    if (!userLoading) {
      setTimeout(() => {
        setLo(false);
      }, 500);
    }
  }, [userData, userLoading]);

  return (
    <ChatContext.Provider
      value={{
        lo: lo || userLoading,
        setLo,
        user: userData || user,
        setUser,
        selectedChat,
        setSelectedChat,
        chats: [], // Removed - use useChats hook instead
        setChats: () => {}, // Removed - use useChats hook instead
        setNotification,
        notification,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const chatState = () => useContext(ChatContext);

export default ChatProvider;
