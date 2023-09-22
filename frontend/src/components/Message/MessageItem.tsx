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
import { Avatar, Box, Tooltip } from '@chakra-ui/react';
import colors from '../../utils/colors';
import { franc } from 'franc';

function getBackgroundColor(user: any) {
  const index =
    Math.abs(
      user.split('').reduce((acc: any, val: any) => acc + val.charCodeAt(0), 0)
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

function MessageItem({ message, messages, index }: any) {
  const { user, selectedChat } = chatState();
  return (
    <Box
      className={`${styles.message} ${
        user.id === message.sender.id ? styles.sender : styles.receiver
      }  }`}
    >
      {((isSameSender(messages, message, index, user.id) &&
        selectedChat.isGroup) ||
        (isLastMessage(messages, index, user.id) && selectedChat.isGroup)) && (
        <ProfileModel userInfo={message.sender}>
          <Tooltip
            label={message.sender.name}
            placement="bottom-start"
            hasArrow
          >
            <Avatar
              mr="1"
              cursor="pointer"
              name={message.sender.name}
              src={message.sender.photo}
              size="sm"
              mt="0"
              position="relative"
              top="12px"
            />
          </Tooltip>
        </ProfileModel>
      )}

      <Box
        className={`${styles.content} ${
          user.id === message.sender.id ? styles.sender : styles.receiver
        }  }`}
        pos="relative"
        ml={`${isSameSenderMargin(
          messages,
          message,
          index,
          user.id,
          selectedChat.isGroup
        )}px`}
        mt={isSameUser(messages, message, index) ? '1px' : '10px'}
      >
        {showSenderName(messages, message, index, user.id) &&
          selectedChat.isGroup && (
            <span
              style={{ color: `${getBackgroundColor(message.sender.name)}` }}
            >
              {message.sender.name}
            </span>
          )}
        <Box
          display={'flex'}
          gap="3px"
          justifyContent={'flex-end'}
          alignItems={'end'}
          flexWrap={'wrap'}
        >
          <span
            style={{
              wordBreak: 'break-all',
              direction: `${franc(message.content) === 'arb' ? 'rtl' : 'ltr'}`,
            }}
          >
            {message.content}
          </span>
          <span style={{ fontSize: ' 12px', position: 'relative', top: '5px' }}>
            {getMessageTime(new Date(message.createdAt))}
          </span>
        </Box>
      </Box>
    </Box>
  );
}

export default MessageItem;
