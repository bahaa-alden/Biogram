import React from 'react';
import MessageItem from './MessageItem';
import { Message } from '../../types/interfaces';
import { Box, Slide } from '@chakra-ui/react';

function MessageList({ messages, containerRef, handleScroll }: any) {
  return (
    <Box
      ref={containerRef}
      display="flex"
      flexDir="column"
      /* align-items= flex-start; */
      overflowY="scroll"
      width="100%"
      height="100%"
      mb="10px"
      borderRadius="8px"
      transition={'all 0.3s linear'}
      onScroll={handleScroll}
    >
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
    </Box>
  );
}
//
export default MessageList;
//
