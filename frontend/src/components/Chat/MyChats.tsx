import { AddIcon } from '@chakra-ui/icons';
import {
  Avatar,
  Box,
  Button,
  IconButton,
  Stack,
  Text,
  useColorModeValue
} from '@chakra-ui/react';
import { useEffect, useRef } from 'react';
import { getSender, getSenderFull } from '../../config/chatLogics';
import { chatState } from '../../Context/ChatProvider';
import { useChats } from '../../hooks/queries/useChats';
import { useSocket } from '../../hooks/useSocket';
import { queryClient } from '../../providers/QueryProvider';
import { Chat } from '../../types/interfaces';
import GroupChatModel from '../miscellaneous/GroupChatModel';
import { ChatListSkeleton } from './ChatListSkeleton';

interface MyChatProps {
  fetchAgain: boolean;
  bg: string;
  color: string;
  display?: any;
  width?: number; // Width in pixels for responsive mode
}

type DisplayMode = 'compact' | 'medium' | 'full';

function MyChat({ fetchAgain, bg, color, display, width }: MyChatProps) {
  const { selectedChat, setSelectedChat, user } = chatState();
  
  // Always call hooks in the same order - don't conditionally call hooks
  const { data: chats, isLoading, refetch } = useChats();
  const { socket } = useSocket(user);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // All hooks must be called unconditionally at the top
  const bgCS = useColorModeValue('brand.500', 'brand.600');
  const bgC = useColorModeValue('gray.100', 'gray.700');
  const bgCHover = useColorModeValue('gray.200', 'gray.600');
  const boxBg = useColorModeValue('white', 'gray.800');
  const borderRightColor = useColorModeValue('gray.200', 'gray.700');
  const borderBottomColor = useColorModeValue('gray.100', 'gray.700');
  const textColorSecondary = useColorModeValue('gray.600', 'gray.400');
  const scrollbarBg = useColorModeValue('gray.300', 'gray.600');
  const scrollbarBgHover = useColorModeValue('gray.400', 'gray.500');
  const selectedBg = useColorModeValue('brand.500', 'brand.600');
  const unselectedBg = useColorModeValue('gray.50', 'gray.700');
  const selectedBgHover = useColorModeValue('brand.600', 'brand.700');
  const unselectedBgHover = useColorModeValue('gray.100', 'gray.600');
  const borderColor = useColorModeValue('gray.100', 'gray.600');
  const avatarBorderSelected = useColorModeValue('brand.400', 'brand.500');
  const avatarBorderUnselected = useColorModeValue('white', 'gray.800');
  const statusBorderSelected = useColorModeValue('brand.500', 'brand.600');
  const statusBorderUnselected = useColorModeValue('gray.50', 'gray.700');

  // Determine display mode based on width - use useMemo to ensure consistent hook order
  const displayMode: DisplayMode = width 
    ? (width < 250 ? 'compact' : width < 350 ? 'medium' : 'full')
    : 'full';

  // Refetch when fetchAgain changes
  useEffect(() => {
    if (fetchAgain) {
      refetch();
    }
  }, [fetchAgain, refetch]);

  // Listen for socket updates to invalidate chats
  useEffect(() => {
    if (!socket) return;

    const handleGroupRename = () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    };

    const handleGroupRemove = () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    };

    const handleGroupAdd = () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    };

    socket.on('group rename', handleGroupRename);
    socket.on('group remove', handleGroupRemove);
    socket.on('group add', handleGroupAdd);

    return () => {
      socket.off('group rename', handleGroupRename);
      socket.off('group remove', handleGroupRemove);
      socket.off('group add', handleGroupAdd);
    };
  }, [socket]);

  const handleChatClick = (chat: Chat) => {
    if (chat.id !== selectedChat?.id) {
      // Directly set the chat without intermediate empty state
      // This prevents unnecessary query refetches
      setSelectedChat(chat);
    }
  };

  return (
    <Box
      ref={containerRef}
      bg={boxBg}
      display={display || {
        base: selectedChat?.users?.length ? 'none' : 'flex',
        md: 'flex',
      }}
      flexDir="column"
      w="100%"
      h="100%"
      overflow="hidden"
      position="relative"
      borderRightWidth={{ base: '0', md: '1px' }}
      borderRightColor={borderRightColor}
    >
      {displayMode !== 'compact' && (
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          w="100%"
          py={{ base: 3, md: 3, lg: 4 }}
          px={{ base: 3, md: 3, lg: 4 }}
          flexShrink={0}
          borderBottom="1px solid"
          borderBottomColor={borderBottomColor}
        >
          <Box>
            <Text 
              as="h1" 
              fontSize={{ base: '22px', md: '24px', lg: '26px' }}
              fontFamily="work sans"
              fontWeight="800"
              color={color}
              mb={0.5}
              letterSpacing="-0.3px"
            >
              Messages
            </Text>
            <Text
              fontSize={{ base: '12px', md: '13px', lg: '14px' }}
              color={textColorSecondary}
              fontWeight="600"
            >
              {chats?.length || 0} conversations
            </Text>
          </Box>
          {socket && (
            <GroupChatModel socket={socket}>
              <IconButton
                aria-label="Create new group chat"
                icon={<AddIcon boxSize={{ base: 4, md: 4 }} />}
                size="md"
                colorScheme="brand"
                variant="solid"
                borderRadius="lg"
                width={{ base: '40px', md: '44px', lg: '48px' }}
                height={{ base: '40px', md: '44px', lg: '48px' }}
                _hover={{
                  transform: 'rotate(90deg) scale(1.1)',
                  boxShadow: 'lg',
                }}
                _active={{
                  transform: 'rotate(90deg) scale(0.95)',
                }}
                transition="all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
                boxShadow="md"
              />
            </GroupChatModel>
          )}
        </Box>
      )}
      <Box
        display="flex"
        flexDir="column"
        p={{ base: 3, md: 3, lg: 4 }}
        bg="transparent"
        w="100%"
        h="100%"
        overflowY="auto"
        overflowX="hidden"
        flex="1"
        minH="0"
        sx={{
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: scrollbarBg,
            borderRadius: 'full',
            '&:hover': {
              background: scrollbarBgHover,
            },
          },
        }}
      >
        {isLoading ? (
          <ChatListSkeleton count={5} compact={displayMode === 'compact'} />
        ) : chats && chats.length > 0 ? (
          <Stack spacing={{ base: 1.5, md: 1.5, lg: 2 }}>
            {chats.map((chat: Chat) => {
              const isSelected = selectedChat?.id === chat.id;
              const sender = getSenderFull(user, chat.users || []);
              const chatName = !chat.isGroup ? getSender(user, chat.users || []) : (chat.name || 'Unnamed Group');

              return (
                <Box
                  key={chat.id || chat._id}
                  display="flex"
                  justifyContent={displayMode === 'compact' ? 'center' : 'flex-start'}
                  alignItems="center"
                  gap={displayMode === 'compact' ? 0 : { base: '14px', md: '16px', lg: '18px' }}
                  cursor="pointer"
                  bg={isSelected ? selectedBg : unselectedBg}
                  color={isSelected ? 'white' : color}
                  px={displayMode === 'compact' ? 2 : { base: 3, md: 4, lg: 4 }}
                  py={displayMode === 'compact' ? 2 : { base: 3, md: 3, lg: 4 }}
                  borderRadius="lg"
                  minH={displayMode === 'compact' ? 'auto' : { base: '70px', md: '74px', lg: '78px' }}
                  _hover={{
                    bg: isSelected ? selectedBgHover : unselectedBgHover,
                    transform: 'translateX(-4px)',
                    boxShadow: 'xl',
                  }}
                  transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                  onClick={() => handleChatClick(chat)}
                  title={displayMode === 'compact' ? chatName : undefined}
                  position="relative"
                  boxShadow={isSelected ? 'lg' : 'none'}
                  border="1px solid"
                  borderColor={isSelected ? 'transparent' : borderColor}
                  overflow="hidden"
                  _before={isSelected ? {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '4px',
                    bg: 'white',
                    opacity: 0.8,
                  } : {}}
                >
                  <Box position="relative" flexShrink={0}>
                    <Avatar
                      src={sender?.photo}
                      size={displayMode === 'compact' ? 'md' : { base: 'md', md: 'lg', lg: 'lg' }}
                      name={chatName}
                      border="2px solid"
                      borderColor={isSelected ? avatarBorderSelected : avatarBorderUnselected}
                      boxShadow="sm"
                    />
                    {!chat.isGroup && displayMode !== 'compact' && (
                      <Box
                        position="absolute"
                        bottom="2px"
                        right="2px"
                        w={{ base: '14px', md: '16px', lg: '16px' }}
                        h={{ base: '14px', md: '16px', lg: '16px' }}
                        bg="green.400"
                        borderRadius="full"
                        border="3px solid"
                        borderColor={isSelected ? statusBorderSelected : statusBorderUnselected}
                        boxShadow="sm"
                      />
                    )}
                  </Box>
                  {displayMode !== 'compact' && (
                    <Box flex="1" minW={0} overflow="hidden">
                      <Text
                        fontSize={displayMode === 'medium' ? '18px' : { base: '18px', md: '19px', lg: '20px' }}
                        fontWeight="800"
                        isTruncated
                        lineHeight="1.3"
                        mb={displayMode === 'full' && chat.lastMessage ? 2 : 0}
                        letterSpacing="-0.3px"
                      >
                        {chatName}
                      </Text>
                      {displayMode === 'full' && chat.lastMessage && (
                        <Text
                          fontSize={{ base: '14px', md: '15px', lg: '15px' }}
                          opacity={isSelected ? 0.85 : 0.65}
                          isTruncated
                          lineHeight="1.5"
                          fontWeight="500"
                        >
                          <Text as="span" fontWeight="700">
                            {chat.lastMessage?.sender?.id && chat.lastMessage.sender.id !== user.id
                              ? `${chat.lastMessage.sender.name?.split(' ')[0] || 'Someone'}: `
                              : 'You: '}
                          </Text>
                          {chat.lastMessage?.content && chat.lastMessage.content.length > 28
                            ? `${chat.lastMessage.content.slice(0, 28)}...`
                            : chat.lastMessage?.content || 'No messages'}
                        </Text>
                      )}
                    </Box>
                  )}
                  {isSelected && displayMode === 'compact' && (
                    <Box
                      position="absolute"
                      right="2px"
                      top="2px"
                      w="8px"
                      h="8px"
                      bg="white"
                      borderRadius="full"
                      border="2px solid"
                      borderColor={bgCS}
                    />
                  )}
                </Box>
              );
            })}
          </Stack>
        ) : (
          <Box 
            textAlign="center" 
            py={{ base: 12, md: 16, lg: 20 }} 
            px={6}
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap={5}
          >
            <Box 
              fontSize={{ base: '60px', md: '70px', lg: '80px' }}
              filter="grayscale(100%)"
              opacity={0.2}
              animation="pulse 2s ease-in-out infinite"
            >
              💬
            </Box>
            <Box>
              <Text 
                fontSize={{ base: '20px', md: '22px', lg: '24px' }}
                fontWeight="800"
                color={color}
                mb={2}
              >
                No conversations yet
              </Text>
              <Text
                fontSize={{ base: '14px', md: '15px', lg: '16px' }}
                color={textColorSecondary}
                fontWeight="500"
                lineHeight="1.6"
              >
                Create a group to start chatting with others
              </Text>
            </Box>
            {socket && displayMode !== 'compact' && (
              <GroupChatModel socket={socket}>
                <Button 
                  mt={4} 
                  size="lg" 
                  leftIcon={<AddIcon />} 
                  colorScheme="brand"
                  borderRadius="2xl"
                  px={8}
                  py={6}
                  fontSize="16px"
                  fontWeight="700"
                  boxShadow="lg"
                  _hover={{
                    transform: 'translateY(-3px)',
                    boxShadow: 'xl',
                  }}
                  _active={{
                    transform: 'translateY(-1px)',
                  }}
                  transition="all 0.2s"
                >
                  Create New Chat
                </Button>
              </GroupChatModel>
            )}
            
            <style>
              {`
                @keyframes pulse {
                  0%, 100% { transform: scale(1); }
                  50% { transform: scale(1.05); }
                }
              `}
            </style>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default MyChat;
