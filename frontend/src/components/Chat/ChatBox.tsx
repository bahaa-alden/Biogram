import { Box, useColorModeValue } from '@chakra-ui/react';
import { chatState } from '../../Context/ChatProvider';
import SingleChat from './SingleChat';

interface ChatBoxProps {
  fetchAgain: boolean;
  setFetchAgain: React.Dispatch<React.SetStateAction<boolean>>;
  color: string;
  bg: string;
  fetchNotificationsAgain: boolean;
  setFetchNotificationsAgain: React.Dispatch<React.SetStateAction<boolean>>;
  display?: any;
}

function ChatBox({
  fetchAgain,
  setFetchAgain,
  color,
  bg,
  fetchNotificationsAgain,
  setFetchNotificationsAgain,
  display,
}: ChatBoxProps) {
  const { selectedChat } = chatState();

  return (
    <Box
      display={display || {
        base: selectedChat?.users?.length ? 'flex' : 'none',
        md: 'flex',
      }}
      flexDir="column"
      bg={useColorModeValue('white', 'gray.800')}
      w="100%"
      h="100%"
      overflow="hidden"
    >
      <SingleChat
        color={color}
        bg={bg}
        fetchAgain={fetchAgain}
        setFetchAgain={setFetchAgain}
        fetchNotificationsAgain={fetchNotificationsAgain}
        setFetchNotificationsAgain={setFetchNotificationsAgain}
      />
    </Box>
  );
}

export default ChatBox;
