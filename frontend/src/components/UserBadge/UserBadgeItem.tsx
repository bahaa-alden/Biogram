import { CloseIcon } from '@chakra-ui/icons';
import { Box } from '@chakra-ui/react';
import { chatState } from '../../Context/ChatProvider';

function UserBadgeItem({ userInfo, handleFunction, isCreate }: any) {
  const { selectedChat, user } = chatState();
  return (
    <Box
      px="2"
      py="1"
      borderRadius="lg"
      m="1"
      mb="2"
      fontSize="17px"
      color="white"
      background={
        selectedChat.isGroup && userInfo.id === selectedChat.groupAdmin.id
          ? 'green.500'
          : 'purple'
      }
      fontWeight="bold"
      cursor="pointer"
      onClick={() => {
        if (selectedChat.isGroup && user.id === selectedChat.groupAdmin.id) {
          handleFunction(userInfo);
        } else if (isCreate) {
          handleFunction(userInfo);
        }
        return;
      }}
    >
      {userInfo.name}
      <CloseIcon pl="1" />
    </Box>
  );
}

export default UserBadgeItem;
