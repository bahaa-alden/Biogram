import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { Box, useColorModeValue } from '@chakra-ui/react';
import SideDrawer from '../components/miscellaneous/SideDrawer';
import MyChat from '../components/Chat/MyChats';
import ChatBox from '../components/Chat/ChatBox';
import { chatState } from '../Context/ChatProvider';

function ChatPage() {
  const { user } = chatState();
  const [fetchAgain, setFetchAgain] = useState(false);
  const [fetchNotificationsAgain, setFetchNotificationsAgain] = useState(false);
  const bg = useColorModeValue('white', 'black');
  const color = useColorModeValue('black', 'white');

  return (
    <div style={{ width: '100%' }}>
      {user.id && (
        <SideDrawer
          color={color}
          bg={bg}
          fetchNotificationsAgain={fetchNotificationsAgain}
          setFetchNotificationsAgain={setFetchNotificationsAgain}
        />
      )}
      <Box
        display="flex"
        justifyContent="space-between"
        w="100%"
        h="92vh"
        p="10px"
      >
        {user.id && <MyChat color={color} bg={bg} fetchAgain={fetchAgain} />}
        {user.id && (
          <ChatBox
            bg={bg}
            fetchAgain={fetchAgain}
            setFetchAgain={setFetchAgain}
            fetchNotificationsAgain={fetchNotificationsAgain}
            setFetchNotificationsAgain={setFetchNotificationsAgain}
          />
        )}
      </Box>
    </div>
  );
}

export default ChatPage;
