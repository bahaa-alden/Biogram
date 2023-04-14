import React, { useEffect, useRef, useState } from 'react';
import { chatState } from '../../Context/ChatProvider';
import { Fragment } from 'react';
import {
  Box,
  FormControl,
  IconButton,
  Input,
  Spinner,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import UpdateGroupChatModel from '../miscellaneous/UpdateGroupChatModel';
import { getSender, getSenderFull } from '../../config/chatLogics';
import ProfileModel from '../miscellaneous/ProfileModel';
import { storage } from '../../utils/storage';
import axios, { AxiosRequestConfig } from 'axios';
import { useToast } from '@chakra-ui/react';
import { Chat, Message } from '../../types/interfaces';
import Styles from './chat.module.css';
import ScrollableChat from './ScrollableChat';
import io, { Socket } from 'socket.io-client';
import Lottie from 'lottie-react';
import animationData from './../../assets/132124-hands-typing-on-keyboard.json';

const ENDPOINT = 'http://127.0.0.1:5000/';
let socket: Socket, selectedChatCompare: Chat;

function SingleChat({ fetchAgain, setFetchAgain, color, bg }: any) {
  const [messages, setMessages] = useState<Message[]>([]);

  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const toast = useToast();
  const { notification, setNotification, user, selectedChat, setSelectedChat } =
    chatState();
  const [socketConnected, setSocketConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [userTyping, setUserTyping] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 14;
  const [isEndOfMessages, setIsEndOfMessages] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socket = io(ENDPOINT);
    socket.emit('setup', user);
    socket.on('connected', () => setSocketConnected(true));
  }, []);

  const fetchMessages = async () => {
    if (!selectedChat.users.length) return;
    try {
      setLoading(true);
      const token = storage.getToken();
      const config: AxiosRequestConfig = {
        url: `/api/v1/chats/${selectedChat.id}/messages?page=${page}&limit=${pageSize}`,
        headers: { Authorization: `Bearer ${token}` },
        method: 'GET',
      };
      const { data } = await (await axios(config)).data.data;
      data.forEach((message: any, index: number) => {
        setMessages((prevMessages) => {
          return [message, ...prevMessages];
        });
      });
      setPage(page + 1);
      setIsEndOfMessages(data.length < pageSize);
      socket.emit('join chat', selectedChat.id);
    } catch (error) {
      toast({
        title: 'Failed to load the messages!',
        status: 'error',
        duration: 2000,
        isClosable: true,
        position: 'bottom',
      });
    }
    setLoading(false);
  };

  const handleScroll = () => {
    if (
      containerRef.current &&
      containerRef.current.scrollTop === 0 &&
      !loading &&
      !isEndOfMessages
    ) {
      fetchMessages();
    }
  };

  useEffect(() => {
    fetchMessages();
    selectedChatCompare = selectedChat;
    // Listen for isTyping events from the server
    socket.on('isTyping', ({ chatId, userId, userName }) => {
      if (chatId === selectedChatCompare.id && userId !== user.id) {
        setIsTyping(true);
        setUserTyping(() => {
          const name = userName.split(' ')[0];
          return name;
        });
      }
    });
    socket.on('stop typing', ({ chatId, userId }) => {
      if (chatId === selectedChatCompare.id && userId !== user.id) {
        setIsTyping(false);
      }
    });

    // Join the socket to the chat room
    // socket.emit('joinChatRoom', selectedChatCompare.id);

    // return () => {
    //   // Leave the socket from the chat room
    //   socket.emit('leaveChatRoom', selectedChatCompare.id);

    // };
  }, [selectedChat]);

  const sendMessage = async (e: any) => {
    if (e.key === 'Enter') {
      if (!newMessage) {
        toast({
          title: 'Please write a message!',
          status: 'warning',
          duration: 2000,
          isClosable: true,
          position: 'bottom',
        });
        return;
      }
      try {
        const token = storage.getToken();
        const config: AxiosRequestConfig = {
          url: `/api/v1/chats/${selectedChat.id}/messages`,
          headers: { Authorization: `Bearer ${token}` },
          method: 'POST',
          data: { content: newMessage },
        };

        setNewMessage('');
        const { data } = await (await axios(config)).data.data;
        socket.emit('new message', data);
        setMessages([...messages, data]);
      } catch (err: any) {
        toast({
          title: 'Error  Occurred!',
          description: 'Failed to send the message',
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: 'bottom',
        });
      }
      socket.emit('stop typing', { chatId: selectedChat.id, userId: user.id });
    }
  };

  useEffect(() => {
    socket.on('message received', (newMessageReceived: any) => {
      if (
        !selectedChatCompare.id ||
        selectedChatCompare.id !== newMessageReceived.chat.id
      ) {
        if (!notification.includes(newMessageReceived)) {
          setNotification([newMessageReceived, ...notification]);
          setFetchAgain(!fetchAgain);
        }
      } else {
        setMessages([...messages, newMessageReceived]);
      }
    });
    socket.on('group rename', () => {
      setFetchAgain(!fetchAgain);
    });
  });
  // Join the socket to the chat room
  useEffect(() => {
    if (!socketConnected) return;

    socket.emit('isTyping', {
      chatId: selectedChat.id,
      userId: user.id,
      userName: user.name,
    });
    const timeout = setTimeout(() => {
      socket.emit('stop typing', { chatId: selectedChat.id, userId: user.id });
    }, 3000);

    return () => clearTimeout(timeout);
  }, [newMessage]);

  return (
    <Fragment>
      {selectedChat.users.length ? (
        <>
          <Text
            bg={bg}
            fontSize={{ base: '28px', md: '30px' }}
            pb="3"
            px="2"
            w="100%"
            fontFamily="work sans"
            display="flex"
            justifyContent={{ base: 'space-between' }}
            alignItems="center"
            color={color}
          >
            <IconButton
              aria-label="icon"
              display={{ base: 'flex', md: 'none' }}
              icon={<ArrowBackIcon />}
              onClick={() => setSelectedChat({ users: [], groupAdmin: {} })}
            />
            {!selectedChat.isGroup ? (
              <>
                {getSender(user, selectedChat.users)}
                <ProfileModel user={getSenderFull(user, selectedChat.users)} />
              </>
            ) : (
              <>
                {selectedChat.name?.toUpperCase()}
                <UpdateGroupChatModel
                  socket={socket}
                  fetchAgain={fetchAgain}
                  setFetchAgain={setFetchAgain}
                  fetchMessages={fetchMessages}
                />
              </>
            )}
          </Text>
          <Box
            display="flex"
            justifyContent="flex-end"
            flexDir="column"
            p="3"
            bg="#e8e8e8"
            w="100%"
            h="100%"
            borderRadius="lg"
            overflowY="hidden"
          >
            {loading ? (
              <Spinner
                w="20"
                h="20"
                size={'xl'}
                alignSelf="center"
                margin="auto"
              />
            ) : (
              <ScrollableChat
                messages={messages}
                containerRef={containerRef}
                handleScroll={handleScroll}
              />
            )}
            <FormControl onKeyDown={sendMessage}>
              {isTyping && (
                <div style={{ color: 'black' }}>
                  <Lottie
                    // height={70}
                    style={{
                      marginBottom: 0,
                      marginLeft: 0,
                      width: 40,
                      height: 30,
                    }}
                    animationData={animationData}
                    autoPlay={true}
                    loop={true}
                    rendererSettings={{ preserveAspectRatio: 'xMidYMid slice' }}
                  />
                </div>
              )}
              <Input
                variant="filled"
                bg="e0e0e0"
                color="black"
                placeholder="Enter a message"
                onChange={(e) => {
                  setNewMessage(e.target.value);
                }}
                value={newMessage}
                border="1px solid gray"
              />
            </FormControl>
          </Box>
        </>
      ) : (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          h="100%"
        >
          <Text color={color} fontSize="3xl" pb="3" fontFamily="work sans">
            Click on a user to start chatting
          </Text>
        </Box>
      )}
    </Fragment>
  );
}

export default SingleChat;
