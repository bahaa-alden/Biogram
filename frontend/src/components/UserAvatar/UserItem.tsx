import React, { useState } from 'react';
import { Box, Avatar, Text, Spinner } from '@chakra-ui/react';

function UserItem({
  user,
  handleFunction,
  loadingChat,
  setIsClicked,
  isClicked,
  index,
}: any) {
  return (
    <Box
      onClick={() => {
        setIsClicked(index);
        handleFunction(user);
      }}
      bg="#e8e8e8"
      _hover={{ bg: '#38b2ac', color: 'white' }}
      w="100%"
      display="flex"
      alignItems="center"
      color="black"
      px="2"
      py="2"
      mb="2"
      borderRadius="lg"
      overflow={'hidden'}
      position={'relative'}
    >
      <Avatar
        mr="2"
        size="sm"
        cursor="pointer"
        name={user.name}
        src={user.photo}
      />
      <Box>
        <Text fontSize={{ md: 'sm', lg: 'sm', base: 'xs' }}>{user.name}</Text>
        <Text fontSize={{ md: 'sm', lg: 'sm', base: 'xs' }} fontWeight={'bold'}>
          {user.email}
        </Text>
      </Box>
      {loadingChat && isClicked === index && (
        <Spinner
          ml="auto"
          display="flex"
          size="sm"
          position={'absolute'}
          right={'1.5'}
        />
      )}
    </Box>
  );
}

export default UserItem;
