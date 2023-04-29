import { Box } from '@chakra-ui/react';
import { chatState } from '../../Context/ChatProvider';
import SingleChat from './SingleChat';

function ChatBox({
  fetchAgain,
  setFetchAgain,
  color,
  bg,
  fetchNotificationsAgain,
  setFetchNotificationsAgain,
  socket,
  socketConnected,
}: any) {
  const { selectedChat } = chatState();

  return (
    <Box
      display={{
        base: selectedChat.users.length ? 'flex' : 'none',
        md: 'flex',
      }}
      alignItems="center"
      flexDir="column"
      p="8px 8px 5px"
      bg={bg}
      w={{ base: '100%', md: '68%' }}
      borderRadius="lg"
      borderWidth="1px"
    >
      <SingleChat
        color={color}
        bg={bg}
        fetchAgain={fetchAgain}
        setFetchAgain={setFetchAgain}
        fetchNotificationsAgain={fetchNotificationsAgain}
        setFetchNotificationsAgain={setFetchNotificationsAgain}
        socket={socket}
        socketConnected={socketConnected}
      />
    </Box>
  );
}

export default ChatBox;
