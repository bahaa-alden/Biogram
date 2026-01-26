import { ArrowBackIcon } from '@chakra-ui/icons';
import {
  Badge,
  Box,
  IconButton,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { KeyboardEvent } from 'react';
import { getSender, getSenderFull } from '../../config/chatLogics';
import { Chat, User } from '../../types/interfaces';
import ProfileModel from '../miscellaneous/ProfileModel';
import UpdateGroupChatModel from '../miscellaneous/UpdateGroupChatModel';
import { TypingIndicator } from './TypingIndicator';

interface ChatHeaderProps {
  selectedChat: Chat | null;
  user: User;
  color: string;
  typingUser: { name: string; id: string } | null;
  socket: any;
  fetchAgain: boolean;
  setFetchAgain: (value: boolean) => void;
  refetchMessages: () => void;
  setSelectedChat: (chat: Chat | null) => void;
  unreadCount?: number;
}

export function ChatHeader({
  selectedChat,
  user,
  color,
  typingUser,
  socket,
  fetchAgain,
  setFetchAgain,
  refetchMessages,
  setSelectedChat,
  unreadCount = 0,
}: ChatHeaderProps) {
  const headerBg = useColorModeValue('white', 'gray.800');
  const headerBorderColor = useColorModeValue('gray.200', 'gray.700');
  const backButtonHover = useColorModeValue('gray.100', 'gray.700');
  const avatarBorder = useColorModeValue('white', 'gray.800');
  const groupAvatarBg = useColorModeValue('brand.500', 'brand.600');
  const groupAvatarBorder = useColorModeValue('white', 'gray.800');
  const groupTextColor = useColorModeValue('gray.600', 'gray.400');
  const typingColor = useColorModeValue('brand.600', 'brand.400');
  const activeColor = useColorModeValue('green.600', 'green.400');

  return (
    <Box
      as="header"
      bg={headerBg}
      w="100%"
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      px={{ base: 3, md: 4, lg: 5 }}
      py={{ base: 3, md: 3, lg: 3.5 }}
      borderBottomWidth="1px"
      borderBottomColor={headerBorderColor}
      height={{ base: '64px', md: '68px', lg: '72px' }}
      minH={{ base: '64px', md: '68px', lg: '72px' }}
      maxH={{ base: '64px', md: '68px', lg: '72px' }}
      role="banner"
      flexShrink={0}
      boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
      position="relative"
      zIndex={10}
      backdropFilter="blur(10px)"
      overflow="hidden"
    >
      <Box display="flex" alignItems="center" gap={{ base: 3, md: 4 }} flex="1" minW="0">
        <IconButton
          aria-label="Go back to chat list"
          display={{ base: 'flex', md: 'none' }}
          icon={<ArrowBackIcon boxSize={6} />}
          onClick={() => setSelectedChat(null)}
          size="lg"
          variant="ghost"
          colorScheme="gray"
          minW="48px"
          minH="48px"
          borderRadius="xl"
          tabIndex={0}
          _hover={{
            bg: backButtonHover,
          }}
          transition="all 0.15s"
          onKeyDown={(e: KeyboardEvent<HTMLButtonElement>) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setSelectedChat(null);
            }
          }}
        />
        
        {!selectedChat?.isGroup ? (
          <>
            <Box display="flex" alignItems="center" gap={{ base: 3, md: 4 }} flex="1" minW="0" overflow="hidden">
              <Box 
                position="relative"
                flexShrink={0}
              >
                <Box
                  as="img"
                  src={getSenderFull(user, selectedChat?.users || [])?.photo}
                  alt={getSender(user, selectedChat?.users || [])}
                  w={{ base: '44px', md: '46px', lg: '48px' }}
                  h={{ base: '44px', md: '46px', lg: '48px' }}
                  borderRadius="full"
                  objectFit="cover"
                  border="2px solid"
                  borderColor={avatarBorder}
                  boxShadow="sm"
                />
                <Box
                  position="absolute"
                  bottom="0"
                  right="0"
                  w={{ base: '12px', md: '12px', lg: '14px' }}
                  h={{ base: '12px', md: '12px', lg: '14px' }}
                  bg="green.400"
                  borderRadius="full"
                  border="2px solid"
                  borderColor={avatarBorder}
                />
              </Box>
              <Box flex="1" minW="0" overflow="hidden">
                <Box display="flex" alignItems="center" gap={2} minW="0">
                  <Text 
                    as="h2" 
                    fontSize={{ base: '17px', md: '18px', lg: '19px' }}
                    fontWeight="700"
                    color={color}
                    fontFamily="work sans"
                    isTruncated
                    lineHeight="1.3"
                    flex="1"
                    minW="0"
                  >
                    {getSender(user, selectedChat?.users || [])}
                  </Text>
                  {unreadCount > 0 && (
                    <Badge
                      bg="brand.500"
                      color="white"
                      borderRadius="full"
                      px={2}
                      py={0.5}
                      fontSize="xs"
                      fontWeight="bold"
                      flexShrink={0}
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                </Box>
                <Box
                  key={`typing-status-${typingUser?.id || 'none'}-${selectedChat?.id}`}
                  fontSize={{ base: '11px', md: '12px', lg: '13px' }}
                  color={typingUser ? typingColor : activeColor}
                  fontWeight="600"
                  display="flex"
                  alignItems="center"
                  gap={1}
                  minW="0"
                  flex="1"
                  overflow="hidden"
                >
                  {typingUser ? (
                    <>
                      <Box
                        as="span"
                        display="inline-block"
                        w="6px"
                        h="6px"
                        bg="currentColor"
                        borderRadius="full"
                        animation="pulse 1.4s ease-in-out infinite"
                        flexShrink={0}
                      />
                      <Box 
                        as="span" 
                        flex="1"
                        minW="0"
                        whiteSpace="nowrap"
                        overflow="hidden"
                        textOverflow="ellipsis"
                      >
                        <Box as="span" display={{ base: 'none', sm: 'inline' }}>
                          {typingUser.name} is typing...
                        </Box>
                        <Box as="span" display={{ base: 'inline', sm: 'none' }}>
                          typing...
                        </Box>
                      </Box>
                    </>
                  ) : (
                    <>
                      <Box
                        as="span"
                        display="inline-block"
                        w="8px"
                        h="8px"
                        bg="green.400"
                        borderRadius="full"
                        flexShrink={0}
                      />
                      <Text as="span" whiteSpace="nowrap">Active now</Text>
                    </>
                  )}
                </Box>
              </Box>
            </Box>
            {getSenderFull(user, selectedChat?.users || []) && (
              <ProfileModel
                userInfo={getSenderFull(user, selectedChat?.users || [])!}
              />
            )}
          </>
        ) : (
          <>
            <Box display="flex" alignItems="center" gap={{ base: 3, md: 4 }} flex="1" minW="0" overflow="hidden">
              <Box
                flexShrink={0}
                w={{ base: '44px', md: '46px', lg: '48px' }}
                h={{ base: '44px', md: '46px', lg: '48px' }}
                borderRadius="full"
                bg={groupAvatarBg}
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontSize={{ base: '20px', md: '22px', lg: '24px' }}
                fontWeight="bold"
                color="white"
                boxShadow="sm"
                border="2px solid"
                borderColor={groupAvatarBorder}
                overflow="hidden"
              >
                {selectedChat.name?.charAt(0).toUpperCase() || 'G'}
              </Box>
              <Box flex="1" minW="0" overflow="hidden">
                <Box display="flex" alignItems="center" gap={2} minW="0">
                  <Text 
                    as="h2" 
                    fontSize={{ base: '17px', md: '18px', lg: '19px' }}
                    fontWeight="700"
                    color={color}
                    fontFamily="work sans"
                    isTruncated
                    lineHeight="1.3"
                    flex="1"
                    minW="0"
                  >
                    {selectedChat?.name}
                  </Text>
                  {unreadCount > 0 && (
                    <Badge
                      bg="brand.500"
                      color="white"
                      borderRadius="full"
                      px={2}
                      py={0.5}
                      fontSize="xs"
                      fontWeight="bold"
                      flexShrink={0}
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                </Box>
                <Text
                  fontSize={{ base: '12px', md: '13px', lg: '14px' }}
                  color={groupTextColor}
                  fontWeight="600"
                  display="flex"
                  alignItems="center"
                  gap={1}
                  isTruncated
                >
                  <Box
                    as="span"
                    display="inline-block"
                    w="4px"
                    h="4px"
                    bg="currentColor"
                    borderRadius="full"
                    flexShrink={0}
                  />
                  {selectedChat.users?.length} members
                </Text>
              </Box>
            </Box>
            <UpdateGroupChatModel
              socket={socket}
              fetchAgain={fetchAgain}
              setFetchAgain={setFetchAgain}
              fetchMessages={refetchMessages}
            />
          </>
        )}
      </Box>
    </Box>
  );
}

