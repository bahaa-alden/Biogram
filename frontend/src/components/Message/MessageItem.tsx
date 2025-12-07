import React, { useState } from 'react';
import styles from './../Chat/chat.module.css';
import { chatState } from '../../Context/ChatProvider';
import {
  isSameSender,
  isLastMessage,
  isSameSenderMargin,
  isSameUser,
  showSenderName,
  getMessageTime,
} from '../../config/chatLogics';
import ProfileModel from '../miscellaneous/ProfileModel';
import { Avatar, Box, Tooltip, useToast } from '@chakra-ui/react';
import colors from '../../utils/colors';
import { franc } from 'franc';
import { Message } from '../../types/interfaces';

function getBackgroundColor(userName: string | undefined): string {
  if (!userName) return colors[0];
  const index =
    Math.abs(
      userName.split('').reduce((acc: number, val: string) => acc + val.charCodeAt(0), 0)
    ) % colors.length;
  return colors[index];
}

const getDateFormatted = (date: string): string => {
  const diffTime = Math.abs(new Date().valueOf() - new Date(date).valueOf());
  let days = diffTime / (24 * 60 * 60 * 1000);
  let hours = (days % 1) * 24;
  let minutes = (hours % 1) * 60;
  let secs = (minutes % 1) * 60;
  [days, hours, minutes, secs] = [
    Math.floor(days),
    Math.floor(hours),
    Math.floor(minutes),
    Math.floor(secs),
  ];
  let timeElapsed: string = '';

  if (days > 7) return new Date(date).toLocaleDateString();
  else if (days > 0) timeElapsed = days + ' days';
  else if (hours > 0) timeElapsed = hours + ' hours';
  else if (minutes > 0) timeElapsed = minutes + ' minutes';
  else timeElapsed = secs + ' seconds';

  return timeElapsed + ' ago';
};

interface MessageItemProps {
  message: Message;
  messages: Message[];
  index: number;
}

function MessageItemComponent({ message, messages, index }: MessageItemProps) {
  const { user, selectedChat } = chatState();
  const toast = useToast();
  const [isCopied, setIsCopied] = useState(false);
  
  // Early return if message is invalid
  if (!message || !message.sender) {
    return null;
  }
  
  const isSender = user.id === message.sender.id;
  const showAvatar = ((isSameSender(messages, message, index, user.id) &&
    selectedChat.isGroup) ||
    (isLastMessage(messages, index, user.id) && selectedChat.isGroup));
  const marginLeft = isSameSenderMargin(messages, message, index, user.id, selectedChat.isGroup);
  const isSameUserMsg = isSameUser(messages, message, index);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setIsCopied(true);
      toast({
        title: 'Copied!',
        status: 'success',
        duration: 1500,
        isClosable: false,
        position: 'bottom',
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast({
        title: 'Failed to copy',
        status: 'error',
        duration: 2000,
        isClosable: true,
        position: 'bottom',
      });
    }
  };
  
  return (
    <Box
      className={`${styles.message} ${
        isSender ? styles.sender : styles.receiver
      }`}
      display="flex"
      alignItems="flex-end"
      w="100%"
      minH="auto"
      overflow="visible"
      mb={isSameUserMsg ? '2px' : '8px'}
      sx={{
        '&:last-child': {
          mb: 0,
        },
      }}
    >
      {/* Avatar for group chats - only on left side for receiver messages */}
      {!isSender && showAvatar && (
        <Box
          flexShrink={0}
          mr={2}
          mb="2px"
          alignSelf="flex-end"
          w="32px"
          h="32px"
          position="relative"
          overflow="visible"
        >
          <ProfileModel userInfo={message.sender}>
            <Tooltip
              label={message.sender?.name || 'Unknown'}
              placement="bottom-start"
              hasArrow
            >
              <Avatar
                cursor="pointer"
                name={message.sender?.name || 'Unknown'}
                src={message.sender?.photo}
                size="sm"
                border="2px solid"
                borderColor="transparent"
                _hover={{ borderColor: 'brand.400' }}
                transition="all 0.2s"
                w="32px"
                h="32px"
                flexShrink={0}
              />
            </Tooltip>
          </ProfileModel>
        </Box>
      )}

      {/* Message Content */}
      <Box
        className={`${styles.content} ${
          isSender ? styles.sender : styles.receiver
        } ${isCopied ? styles.copied : ''}`}
        pos="relative"
        ml={!isSender ? `${marginLeft}px` : '0'}
        mr={isSender ? '0' : '0'}
        maxW={{ base: '75%', md: '70%', lg: '65%' }}
        minW="60px"
        flexShrink={0}
        overflow="visible"
        w="fit-content"
        cursor="pointer"
        onClick={handleCopy}
        title="Click to copy"
        transition="all 0.2s ease"
        _active={{
          transform: 'scale(0.98)',
        }}
      >
        {/* Sender name for group chats */}
        {showSenderName(messages, message, index, user.id) &&
          selectedChat.isGroup && message.sender && (
            <Box
              mb={1}
              fontSize="xs"
              fontWeight="600"
              color={getBackgroundColor(message.sender?.name)}
              lineHeight="1.2"
            >
              {message.sender?.name || 'Unknown'}
            </Box>
          )}
        
        {/* Message content */}
        <Box
          w="100%"
          display="flex"
          flexDirection="column"
          gap="2px"
        >
          <Box
            as="span"
            wordBreak="break-word"
            overflowWrap="break-word"
            whiteSpace="pre-wrap"
            direction={message.content && franc(message.content) === 'arb' ? 'rtl' : 'ltr'}
            lineHeight="1.4"
          >
            {message.content}
          </Box>
          {/* Time below message - Telegram style */}
          <Box
            as="span"
            fontSize="11px"
            opacity={0.6}
            whiteSpace="nowrap"
            alignSelf={isSender ? 'flex-end' : 'flex-start'}
            mt="2px"
          >
            {getMessageTime(new Date(message.createdAt))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

MessageItemComponent.displayName = 'MessageItem';

// Custom comparison function for React.memo to prevent unnecessary re-renders
const areEqual = (prevProps: MessageItemProps, nextProps: MessageItemProps) => {
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.sender?.id === nextProps.message.sender?.id &&
    prevProps.index === nextProps.index &&
    prevProps.messages.length === nextProps.messages.length
  );
};

const MessageItem = React.memo(MessageItemComponent, areEqual);

export default MessageItem;
