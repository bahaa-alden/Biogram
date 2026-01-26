import type { RefObject } from 'react';
import { useState, useMemo, useEffect } from 'react';
import { Box, useColorModeValue } from '@chakra-ui/react';
import { useParams, useNavigate } from 'react-router-dom';
import SideDrawer from '../components/miscellaneous/SideDrawer';
import MyChat from '../components/Chat/MyChats';
import ChatBox from '../components/Chat/ChatBox';
import ResizableChatLayout from '../components/Chat/ResizableChatLayout';
import { chatState } from '../Context/ChatProvider';
import { useResponsiveChat } from '../hooks/useResponsiveChat';
import { useChats } from '../hooks/queries/useChats';

function ChatPage() {
  const { chatId } = useParams<{ chatId?: string }>();
  const navigate = useNavigate();
  const { user, selectedChat, setSelectedChat } = chatState();
  const { data: chats } = useChats();
  
  // Sync URL chatId with selectedChat
  useEffect(() => {
    if (chatId && chats) {
      const chat = chats.find((c) => c.id === chatId || c._id === chatId);
      if (chat && chat.id !== selectedChat?.id && chat._id !== selectedChat?.id) {
        setSelectedChat(chat);
      } else if (!chat && chatId) {
        // Chat not found, redirect to chats list
        navigate('/chats', { replace: true });
      }
    } else if (!chatId && selectedChat) {
      // No chatId in URL but selectedChat exists - sync URL
      navigate(`/chats/${selectedChat.id || selectedChat._id}`, { replace: true });
    }
  }, [chatId, chats, selectedChat, setSelectedChat, navigate]);
  const [fetchAgain, setFetchAgain] = useState(false);
  const [fetchNotificationsAgain, setFetchNotificationsAgain] = useState(false);
  const { chatListWidth, chatListRef } = useResponsiveChat();
  const bg = useColorModeValue('white', 'gray.800');
  const color = useColorModeValue('gray.800', 'white');

  // Check if chat is selected for responsive behavior (use chatId from URL)
  const hasSelectedChat = useMemo(
    () => !!chatId || (selectedChat && selectedChat.users && selectedChat.users.length > 0),
    [chatId, selectedChat]
  );

  return (
    <Box width="100%" height="100vh" display="flex" flexDirection="column" overflow="hidden" bg={useColorModeValue('white', 'gray.900')}>
      {user.id && (
        <SideDrawer
          color={color}
          bg={bg}
          fetchNotificationsAgain={fetchNotificationsAgain}
          setFetchNotificationsAgain={setFetchNotificationsAgain}
        />
      )}
      <Box
        display={{ base: 'flex', md: 'none' }}
        flexDirection="column"
        justifyContent="space-between"
        w="100%"
        flex="1"
        minH="0"
        p={0}
        gap={0}
      >
        {user.id && (
          <MyChat
            color={color}
            bg={bg}
            fetchAgain={fetchAgain}
            display={{ base: hasSelectedChat ? 'none' : 'flex', md: 'flex' }}
          />
        )}
        {user.id && (
          <ChatBox
            bg={bg}
            fetchAgain={fetchAgain}
            setFetchAgain={setFetchAgain}
            fetchNotificationsAgain={fetchNotificationsAgain}
            setFetchNotificationsAgain={setFetchNotificationsAgain}
            color={color}
            display={{ base: hasSelectedChat ? 'flex' : 'none', md: 'flex' }}
          />
        )}
      </Box>
      <Box
        display={{ base: 'none', md: 'flex' }}
        flex="1"
        minH="0"
        p={0}
        gap={0}
        h="100%"
        overflow="hidden"
      >
        {user.id && (
          <ResizableChatLayout
            chatList={
              <Box ref={chatListRef as RefObject<HTMLDivElement>} w="100%" h="100%">
                <MyChat
                  color={color}
                  bg={bg}
                  fetchAgain={fetchAgain}
                  width={chatListWidth}
                />
              </Box>
            }
            chatBox={
              <ChatBox
                bg={bg}
                fetchAgain={fetchAgain}
                setFetchAgain={setFetchAgain}
                fetchNotificationsAgain={fetchNotificationsAgain}
                setFetchNotificationsAgain={setFetchNotificationsAgain}
                color={color}
              />
            }
          />
        )}
      </Box>
    </Box>
  );
}

export default ChatPage;
