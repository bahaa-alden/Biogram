import { useState, useRef, useEffect } from 'react';
import { Box, useColorModeValue } from '@chakra-ui/react';
import SideDrawer from '../components/miscellaneous/SideDrawer';
import MyChat from '../components/Chat/MyChats';
import ChatBox from '../components/Chat/ChatBox';
import ResizableChatLayout from '../components/Chat/ResizableChatLayout';
import { chatState } from '../Context/ChatProvider';

function ChatPage() {
  const { user, selectedChat } = chatState();
  const [fetchAgain, setFetchAgain] = useState(false);
  const [fetchNotificationsAgain, setFetchNotificationsAgain] = useState(false);
  const [chatListWidth, setChatListWidth] = useState<number | undefined>();
  const chatListRef = useRef<HTMLDivElement>(null);
  const bg = useColorModeValue('white', 'gray.800');
  const color = useColorModeValue('gray.800', 'white');

  // Track chat list width for responsive display
  useEffect(() => {
    if (!chatListRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setChatListWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(chatListRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Check if chat is selected for responsive behavior
  const hasSelectedChat = selectedChat && selectedChat.users && selectedChat.users.length > 0;

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
              <Box ref={chatListRef} w="100%" h="100%">
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
