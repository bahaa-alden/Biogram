import { useEffect, useRef, useState } from 'react';
import { chatState } from '../../Context/ChatProvider';
import { Fragment } from 'react';
import {
  Box,
  Button,
  FormControl,
  IconButton,
  Input,
  Spinner,
  Text,
} from '@chakra-ui/react';
import { ArrowBackIcon, ArrowForwardIcon } from '@chakra-ui/icons';
import UpdateGroupChatModel from '../miscellaneous/UpdateGroupChatModel';
import { getSender, getSenderFull } from '../../config/chatLogics';
import ProfileModel from '../miscellaneous/ProfileModel';
import { storage } from '../../utils/storage';
import axios, { AxiosRequestConfig } from 'axios';
import { useToast } from '@chakra-ui/react';
import { Chat, Message } from '../../types/interfaces';
import ScrollableChat from './ScrollableChat';
import io, { Socket } from 'socket.io-client';
import Lottie from 'lottie-react';
import animationData from './../../assets/132124-hands-typing-on-keyboard.json';

const ENDPOINT = 'https://biogram.onrender.com/';

let socket: Socket, selectedChatCompare: any;
function SingleChat({
  fetchAgain,
  setFetchAgain,
  color,
  bg,
  fetchNotificationsAgain,
  setFetchNotificationsAgain,
}: any) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const toast = useToast();
  const { user, selectedChat, setSelectedChat } = chatState();
  const [isTyping, setIsTyping] = useState(false);
  const [userTyping, setUserTyping] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 14;
  const [previousSelectedChat, setPreviousSelectedChat] = useState<Chat>();
  const [isEndOfMessages, setIsEndOfMessages] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [socketConnected, setSocketConnected] = useState(false);

  // Join the socket to the chat room
  useEffect(() => {
    socket = io(ENDPOINT);
    socket.emit('setup', user);
    socket.on('connected', () => setSocketConnected(true));
  }, []);

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

      if (page === 1) {
        setTimeout(function () {
          scrollToBottom();
        }, 0);
      }

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

  const handleScroll = async () => {
    if (!containerRef.current || loading || isEndOfMessages) return;
    const { scrollTop, scrollHeight } = containerRef.current;
    if (scrollTop <= 0) {
      await fetchMessages();
      setTimeout(function () {
        if (containerRef.current) {
          const newScrollHeight = containerRef.current.scrollHeight;
          containerRef.current.scrollTop =
            newScrollHeight - scrollHeight + scrollTop;
        }
      }, 0);
    }
  };

  const scrollToBottom = () => {
    setTimeout(function () {
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    }, 0);
  };

  useEffect(() => {
    if (selectedChat !== previousSelectedChat) {
      setPage(1);
      setIsEndOfMessages(false);
      setMessages([]);
      fetchMessages();
      setPreviousSelectedChat(selectedChat);
    }
    selectedChatCompare = selectedChat;
    // Listen for isTyping events from the server
    socket.on('isTyping', ({ chatId, userId, userName }: any) => {
      if (chatId === selectedChatCompare.id && userId !== user.id) {
        setIsTyping(true);
        setUserTyping(() => {
          const name = userName.split(' ')[0];
          return name;
        });
      }
    });
    socket.on('stop typing', ({ chatId, userId }: any) => {
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

  const sendMessage = async (e: any, send: boolean) => {
    if (e.key === 'Enter' || send) {
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
        scrollToBottom();
        socket.emit('new message', data);
        setMessages([...messages, data]);
        setFetchAgain(!fetchAgain);
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
      scrollToBottom();
      socket.emit('stop typing', { chatId: selectedChat.id, userId: user.id });
    }
  };

  useEffect(() => {
    socket.on('message received', (newMessageReceived: any) => {
      if (
        !selectedChatCompare.id ||
        selectedChatCompare.id !== newMessageReceived.chat.id
      ) {
        setFetchAgain(!fetchAgain);
        setFetchNotificationsAgain(!fetchNotificationsAgain);
      } else {
        setMessages([...messages, newMessageReceived]);
      }
    });
    socket.on('group rename', () => {
      setFetchAgain(!fetchAgain);
    });
    socket.on('group remove', () => {
      setFetchAgain(!fetchAgain);
    });
    socket.on('group add', () => {
      setFetchAgain(!fetchAgain);
      setFetchNotificationsAgain(!fetchNotificationsAgain);
    });
  });
  return (
    <Fragment>
      {selectedChat.users.length ? (
        <>
          <Text
            bg={bg}
            fontSize={{ base: '25px', md: '30px', sm: '28px' }}
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
            <Box
              display={'flex'}
              justifyContent={'space-between'}
              alignItems={'center'}
              gap="10px"
              mt="1"
            >
              <FormControl
                onKeyDown={(e) => {
                  sendMessage(e, false);
                }}
              >
                {isTyping && (
                  <Box color="black">
                    <Lottie
                      style={{
                        width: 40,
                        height: 20,
                      }}
                      animationData={animationData}
                      autoPlay={true}
                      loop={true}
                      rendererSettings={{
                        preserveAspectRatio: 'xMidYMid slice',
                      }}
                    />
                  </Box>
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
              <IconButton
                aria-label="send message"
                icon={<ArrowForwardIcon />}
                bg="rgb(10 85 135)"
                _hover={{ opacity: '0.8' }}
                size="lg"
                borderRadius={'full'}
                onClick={(e) => {
                  sendMessage(e, true);
                }}
              />
            </Box>
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
