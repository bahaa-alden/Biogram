import { createContext, useContext, useState, useEffect } from 'react';
import { GlobalContextType, INITIAL_VALUE } from '../types/context';
import { Chat, User, props, Notification } from '../types/interfaces';
import { useAuth } from '../hooks/queries/useAuth';

const ChatContext = createContext<GlobalContextType>(INITIAL_VALUE);

const ChatProvider = ({ children }: props) => {
  // Get user from React Query
  const { data: userData, isLoading: userLoading } = useAuth();
  const [user, setUser] = useState<User>({});
  const [selectedChat, setSelectedChat] = useState<Chat>({
    users: [],
    groupAdmin: {},
  });
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
