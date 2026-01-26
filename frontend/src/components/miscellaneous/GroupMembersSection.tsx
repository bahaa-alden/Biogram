import { Badge, Box, HStack, Text, useColorModeValue } from '@chakra-ui/react';
import { Chat } from '../../types/interfaces';
import UserBadgeList from '../UserBadge/UserBadgeList';

interface GroupMembersSectionProps {
  selectedChat: Chat;
  onRemoveUser: (user: any) => void;
  isCreate: boolean;
}

export function GroupMembersSection({
  selectedChat,
  onRemoveUser,
  isCreate,
}: GroupMembersSectionProps) {
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');

  return (
    <Box>
      <HStack mb={3} justify="space-between" align="center">
        <HStack spacing={2}>
          <Box
            bg={useColorModeValue('brand.50', 'brand.900')}
            p={1.5}
            borderRadius="md"
          >
            <Text fontSize="sm">👥</Text>
          </Box>
          <Text
            fontSize="sm"
            fontWeight="700"
            color={textColor}
            textTransform="uppercase"
            letterSpacing="wide"
          >
            Group Members
          </Text>
        </HStack>
        <Badge
          bg={useColorModeValue('brand.100', 'brand.900')}
          color={useColorModeValue('brand.700', 'brand.200')}
          borderRadius="full"
          px={3}
          py={1}
          fontSize="xs"
          fontWeight="600"
        >
          {selectedChat?.users?.length} {selectedChat?.users?.length === 1 ? 'Member' : 'Members'}
        </Badge>
      </HStack>
      <Box
        bg={cardBg}
        p={4}
        borderRadius="lg"
        border="1px solid"
        borderColor={borderColor}
        minH="80px"
        transition="all 0.2s"
        _hover={{
          borderColor: useColorModeValue('brand.300', 'brand.500'),
          shadow: 'sm',
        }}
      >
        {selectedChat?.users && selectedChat.users.length > 0 ? (
          <UserBadgeList
            users={selectedChat.users}
            handleFunction={onRemoveUser}
            isCreate={isCreate}
          />
        ) : (
          <Text color={secondaryTextColor} textAlign="center" py={2}>
            No members in this group
          </Text>
        )}
      </Box>
    </Box>
  );
}

