import MessageItem from './MessageItem';
import { Message } from '../../types/interfaces';
import { Box, Text } from '@chakra-ui/react';
import moment from 'moment';
function MessageList({ messages, containerRef, handleScroll }: any) {
  const groupedMessages = messages.reduce((groups: any, message: any) => {
    const date = moment(message.createdAt).format('YYYY-MM-DD');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});
  return (
    <Box
      ref={containerRef}
      display="flex"
      flexDir="column"
      overflowY="scroll"
      width="100%"
      height="100%"
      px="2"
      borderRadius="8px"
      onScroll={handleScroll}
    >
      {Object.entries(groupedMessages).map(([date, messages]: any) => (
        <div key={date}>
          <Box mt="2px" width={'100%'}>
            <Text
              margin={'auto'}
              py="1"
              px="2"
              borderRadius={'lg'}
              width={'fit-content'}
              fontWeight={'bold'}
              bg="rgb(1, 12, 20)"
            >
              {moment(date).format('MMMM DD')}
            </Text>
          </Box>
          {messages.map((message: Message, index: number) => {
            return (
              // <Slide direction='bottom'>
              <MessageItem
                key={index}
                message={message}
                messages={messages}
                index={index}
              />
            );
          })}
        </div>
      ))}
    </Box>
  );
}
//
export default MessageList;
//
