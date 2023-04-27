import React from 'react';
import { Box, Avatar, Text } from '@chakra-ui/react';

function UserItem({ user, handleFunction }: any) {
  return (
    <Box
      onClick={() => handleFunction(user)}
      bg="#e8e8e8"
      _hover={{ bg: '#38b2ac', color: 'white' }}
      w="100%"
      display="flex"
      alignItems="center"
      color="black"
      px="3"
      py="2"
      mb="2"
      borderRadius="lg"
    >
      <Avatar
        mr="2"
        size="sm"
        cursor="pointer"
        name={user.name}
        src={user.photo}
      />
      <Box>
        <Text>{user.name}</Text>
        <Text fontSize="sm">
          <b>Email : </b>
          {user.email}
        </Text>
      </Box>
    </Box>
  );
}

export default UserItem;
