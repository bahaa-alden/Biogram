import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { storage } from '../utils/storage';
import { GlobalContextType, INITIAL_VALUE } from '../types/context';
import { Chat, User, props } from '../types/interfaces';

const ChatContext = createContext<GlobalContextType>(INITIAL_VALUE);
const ChatProvider = ({ children }: props) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User>({});
  const [selectedChat, setSelectedChat] = useState<Chat>({
    users: [],
    groupAdmin: {},
  });
  const [chats, setChats] = useState<Chat[]>([]);
  const [notification, setNotification] = useState<any>([]);

  const fetchUserData = () => {
    const token = storage.getToken();
    if (!token) return;

    const res = axios
      .get(`/api/v1/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      .then((res) => {
        setUser(res.data.data.data);
        return res.data.data.data;
      })
      .catch((err) => console.log(err));
    return res;
  };

  useEffect(() => {
    fetchUserData()?.then((res) => {
      let userD: any = res;
      if (userD) {
        navigate('/chats');
      }
    });
  }, []);
  return (
    <ChatContext.Provider
      value={{
        user,
        setUser,
        selectedChat,
        setSelectedChat,
        chats,
        setChats,
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