import React, { useState } from 'react';
import { Box, Avatar, Text, Spinner } from '@chakra-ui/react';

import { User } from '../../types/interfaces';

interface UserItemProps {
  user: User;
  handleFunction: (user: User) => void;
  loadingChat: boolean;
  setIsClicked: (index: number) => void;
  isClicked: number | undefined;
  index: number;
}

const UserItem = React.memo(function UserItem({
  user,
  handleFunction,
  loadingChat,
  setIsClicked,
  isClicked,
  index,
}: UserItemProps) {
  return (
    <Box
      onClick={() => {
        setIsClicked(index);
        handleFunction(user);
      }}
      bg="gray.100"
      _dark={{ bg: 'gray.700', color: 'gray.100' }}
      _hover={{ bg: 'brand.500', color: 'white' }}
      w="100%"
      display="flex"
      alignItems="center"
      color="gray.800"
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
});

UserItem.displayName = 'UserItem';

export default UserItem;
