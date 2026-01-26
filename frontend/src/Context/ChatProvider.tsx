import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/queries/useAuth';
import { useChats } from '../hooks/queries/useChats';
import { GlobalContextType, INITIAL_VALUE } from '../types/context';
import { Chat, Notification, User, props } from '../types/interfaces';

const ChatContext = createContext<GlobalContextType>(INITIAL_VALUE);

const ChatProvider = ({ children }: props) => {
  const location = useLocation();
  // Get user from React Query
  const { data: userData, isLoading: userLoading } = useAuth();
  const { data: chats } = useChats();
  const [user, setUser] = useState<User>({});
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [notification, setNotification] = useState<Notification[]>([]);
  const [lo, setLo] = useState(true);
  
  // Sync selectedChat with URL chatId
  useEffect(() => {
    const pathMatch = location.pathname.match(/\/chats\/([^/]+)/);
    const chatIdFromUrl = pathMatch ? pathMatch[1] : null;
    
    if (chatIdFromUrl && chats) {
      const chat = chats.find((c) => c.id === chatIdFromUrl || c._id === chatIdFromUrl);
      if (chat && (chat.id !== selectedChat?.id && chat._id !== selectedChat?._id)) {
        setSelectedChat(chat);
      } else if (!chat) {
        // Chat not found in list, clear selection
        setSelectedChat(null);
      }
    } else if (!chatIdFromUrl && selectedChat) {
      // No chatId in URL but selectedChat exists - keep it for backward compatibility
      // Don't clear it, let the URL sync handle it
    }
  }, [location.pathname, chats, selectedChat]);

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

  // Empty callback for setChats (removed - use useChats hook instead)
  const emptySetChats = useCallback(() => {}, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<GlobalContextType>(
    () => ({
      lo: lo || userLoading,
      setLo,
      user: userData || user,
      setUser,
      selectedChat,
      setSelectedChat,
      chats: [], // Removed - use useChats hook instead
      setChats: emptySetChats, // Removed - use useChats hook instead
      setNotification,
      notification,
    }),
    [lo, userLoading, userData, user, selectedChat, notification, emptySetChats]
  );

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

export const chatState = () => useContext(ChatContext);

export default ChatProvider;
