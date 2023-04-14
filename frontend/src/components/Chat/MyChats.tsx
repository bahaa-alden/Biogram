import { useState, useEffect } from 'react';
import { chatState } from '../../Context/ChatProvider';
import {
  Box,
  Button,
  useToast,
  Stack,
  Avatar,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import axios, { AxiosRequestConfig } from 'axios';
import { storage } from '../../utils/storage';
import { AddIcon } from '@chakra-ui/icons';
import ChatLoading from '../../utils/ChatLoading';
import { getSender, isLastMessage } from '../../config/chatLogics';
import GroupChatModel from '../miscellaneous/GroupChatModel';
import { Chat } from '../../types/interfaces';

function MyChat({ fetchAgain, bg, color }: any) {
  const { selectedChat, setSelectedChat, user, chats, setChats } = chatState();
  const toast = useToast();
  const fetchChats = async () => {
    try {
      const token = storage.getToken();
      const config: AxiosRequestConfig = {
        url: '/api/v1/chats',
        headers: { Authorization: `Bearer ${token}` },
        method: 'GET',
      };

      const { data } = await (await axios(config)).data;
      setChats(data);
    } catch (err: any) {
      toast({
        title: 'Error  Occurred!',
        description: 'Failed to load the chats',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'bottom-left',
      });
    }
  };

  useEffect(() => {
    fetchChats();
  }, [fetchAgain]);
  return (
    <Box
      bg={bg}
      display={{
        base: selectedChat.users.length ? 'none' : 'flex',
        md: 'flex',
      }}
      flexDir="column"
      alignItems="center"
      py="3"
      px={{ base: '3', md: '1', lg: '3' }}
      // bg="white"
      w={{ base: '100%', md: '31%' }}
      borderRadius="lg"
      borderWidth="1px"
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        w="100%"
        pb="3"
        px={{ base: '3', md: '8px', lg: '1' }}
        fontSize={{ base: '25px', md: '20px', lg: '22px' }}
        fontFamily="work sans"
      >
        <b> My Chats</b>
        <GroupChatModel>
          <Button
            display="flex"
            px={{ base: '3', md: '1', lg: '3' }}
            fontSize={{ base: '18px', md: '15px', lg: '16px' }}
            rightIcon={<AddIcon />}
          >
            New Group Chat
          </Button>
        </GroupChatModel>
      </Box>
      <Box
        display="flex"
        flexDir="column"
        p="3"
        bg={bg}
        w="100%"
        h="100%"
        borderRadius="lg"
        overflow="hidden"
      >
        {chats ? (
          <Stack overflowY="scroll">
            {chats.map((chat: Chat) => (
              <Box
                onClick={() => setSelectedChat(chat)}
                cursor="pointer"
                bg={selectedChat === chat ? '#38b2ac' : '#e8e8e8'}
                color={selectedChat === chat ? 'white' : 'black'}
                px="3"
                py="2"
                borderRadius="lg"
                key={chat.id}
              >
                <Text fontSize={'18px'}>
                  {!chat.isGroup ? getSender(user, chat.users) : chat.name}
                </Text>
                <span style={{ fontWeight: 'bold' }}>
                  {chat.lastMessage?.sender.name?.split(' ')[0]}:
                </span>{' '}
                {chat.lastMessage?.content?.length &&
                chat.lastMessage?.content?.length > 18
                  ? `${chat.lastMessage?.content?.slice(0, 18)}...`
                  : chat.lastMessage?.content}
              </Box>
            ))}
          </Stack>
        ) : (
          <ChatLoading />
        )}
      </Box>
    </Box>
  );
}

export default MyChat;
