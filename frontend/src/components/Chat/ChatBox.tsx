import type { Dispatch, SetStateAction } from 'react';
import { Box, useColorModeValue } from '@chakra-ui/react';
import { useParams } from 'react-router-dom';
import { chatState } from '../../Context/ChatProvider';
import SingleChat from './SingleChat';

interface ChatBoxProps {
  fetchAgain: boolean;
  setFetchAgain: Dispatch<SetStateAction<boolean>>;
  color: string;
  bg: string;
  fetchNotificationsAgain: boolean;
  setFetchNotificationsAgain: Dispatch<SetStateAction<boolean>>;
  display?: Record<string, string>;
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
  const { chatId } = useParams<{ chatId?: string }>();
  const { selectedChat } = chatState();

  return (
    <Box
      display={display || {
        base: chatId || selectedChat?.users?.length ? 'flex' : 'none',
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
