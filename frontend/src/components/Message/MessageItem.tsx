import styles from './../Chat/chat.module.css';
import { chatState } from '../../Context/ChatProvider';
import {
  isSameSender,
  isLastMessage,
  isSameSenderMargin,
  isSameUser,
  showSenderName,
} from '../../config/chatLogics';
import ProfileModel from '../miscellaneous/ProfileModel';
import { Avatar, Box, Tooltip } from '@chakra-ui/react';
import colors from '../../utils/colors';
import { motion } from 'framer-motion';

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      title={getDateFormatted(message.createdAt)}
      className={`${styles.message} ${
        user.id === message.sender.id ? styles.sender : styles.receiver
      }  }`}
    >
      {((isSameSender(messages, message, index, user.id) &&
        selectedChat.isGroup) ||
        (isLastMessage(messages, index, user.id) && selectedChat.isGroup)) && (
        <ProfileModel user={message.sender}>
          <Tooltip
            label={message.sender.name}
            placement="bottom-start"
            hasArrow
          >
            <Avatar
              mr="1"
              cursor="pointer"
              name={message.sender.name}
              src={`/img/users/${message.sender.photo}`}
              size="sm"
              mt="0"
              position="relative"
              top="12px"
            />
          </Tooltip>
        </ProfileModel>
      )}
      <span
        className={`${styles.content} ${
          user.id === message.sender.id ? styles.sender : styles.receiver
        }  }`}
        style={{
          marginLeft: isSameSenderMargin(
            messages,
            message,
            index,
            user.id,
            selectedChat.isGroup
          ),
          marginTop: isSameUser(messages, message, index) ? 1 : 10,
        }}
      >
        {showSenderName(messages, message, index, user.id) &&
          selectedChat.isGroup && (
            <p
              style={{
                color: `${getBackgroundColor(message.sender.name)}`,
              }}
            >
              {message.sender.name}
            </p>
          )}
        {message.content}
      </span>
    </motion.div>
  );
}

export default MessageItem;
