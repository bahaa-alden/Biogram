import { Skeleton, Stack } from '@chakra-ui/react';
import React from 'react';

function ChatLoading({ num }: any) {
  let loading = [];
  for (let index = 0; index < num; index++) {
    loading.push(<Skeleton key={index} h="45px" borderRadius={4} />);
  }
  return (
    <Stack w="100%" overflowY="scroll" pt="2">
      {loading}
    </Stack>
  );
}



export default ChatLoading;
