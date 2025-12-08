import { CloseIcon } from '@chakra-ui/icons';
import { Box, useColorModeValue } from '@chakra-ui/react';
import { chatState } from '../../Context/ChatProvider';

function UserBadgeItem({ userInfo, handleFunction, isCreate }: any) {
  const { selectedChat, user } = chatState();
  
  const isAdmin = selectedChat?.isGroup && userInfo.id === selectedChat?.groupAdmin?.id;
  
  // Admin colors: Gold/amber for admins
  const adminBg = useColorModeValue('orange.500', 'orange.600');
  const adminColor = useColorModeValue('white', 'white');
  
  // Member colors: Brand blue for regular members
  const memberBg = useColorModeValue('brand.500', 'brand.600');
  const memberColor = useColorModeValue('white', 'white');
  
  const hoverBg = isAdmin 
    ? useColorModeValue('orange.600', 'orange.700')
    : useColorModeValue('brand.600', 'brand.700');

  return (
    <Box
      px={3}
      py={1.5}
      borderRadius="lg"
      m={1}
      mb={2}
      fontSize="sm"
      color={isAdmin ? adminColor : memberColor}
      bg={isAdmin ? adminBg : memberBg}
      fontWeight="600"
      cursor="pointer"
      onClick={() => {
        if (selectedChat?.isGroup && user?.id === selectedChat?.groupAdmin?.id) {
          handleFunction(userInfo);
        } else if (isCreate) {
          handleFunction(userInfo);
        }
        return;
      }}
      transition="all 0.2s"
      _hover={{
        bg: hoverBg,
        transform: 'translateY(-1px)',
        shadow: 'sm',
      }}
      display="inline-flex"
      alignItems="center"
      gap={2}
    >
      {isAdmin && <Box as="span">👑</Box>}
      {userInfo.name}
      <CloseIcon boxSize={3} />
    </Box>
  );
}

export default UserBadgeItem;
