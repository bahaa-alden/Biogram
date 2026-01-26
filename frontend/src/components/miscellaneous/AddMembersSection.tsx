import { SearchIcon } from '@chakra-ui/icons';
import {
  Box,
  FormControl,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Spinner,
  Text,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react';
import { User } from '../../types/interfaces';
import UserListItem from '../UserAvatar/UserListItems';

interface AddMembersSectionProps {
  search: string;
  setSearch: (value: string) => void;
  searchResult: User[];
  loading: boolean;
  onAddUser: (user: User) => void;
  loadingChat: boolean;
  isClicked: number | undefined;
  setIsClicked: (value: number | undefined) => void;
}

export function AddMembersSection({
  search,
  setSearch,
  searchResult,
  loading,
  onAddUser,
  loadingChat,
  isClicked,
  setIsClicked,
}: AddMembersSectionProps) {
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const hoverBg = useColorModeValue('gray.100', 'gray.600');
  const inputFocusBorder = useColorModeValue('brand.500', 'brand.400');
  const bgColor = useColorModeValue('white', 'gray.800');

  return (
    <Box>
      <HStack spacing={2} mb={3}>
        <Box
          bg={useColorModeValue('brand.50', 'brand.900')}
          p={1.5}
          borderRadius="md"
        >
          <Text fontSize="sm">➕</Text>
        </Box>
        <Text
          fontSize="sm"
          fontWeight="700"
          color={textColor}
          textTransform="uppercase"
          letterSpacing="wide"
        >
          Add New Members
        </Text>
      </HStack>
      <InputGroup mb={4}>
        <InputLeftElement pointerEvents="none" h="full">
          <SearchIcon 
            color={secondaryTextColor} 
            boxSize={4}
          />
        </InputLeftElement>
        <Input
          value={search}
          placeholder="Search users by name or email..."
          onChange={(e) => setSearch(e.target.value)}
          bg={cardBg}
          border="1px solid"
          borderColor={borderColor}
          _hover={{ 
            borderColor: useColorModeValue('brand.400', 'brand.500'),
            bg: hoverBg,
          }}
          _focus={{ 
            borderColor: inputFocusBorder, 
            boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
            bg: bgColor,
          }}
          size="md"
          borderRadius="lg"
        />
      </InputGroup>

      {loading ? (
        <Box 
          display="flex" 
          justifyContent="center" 
          py={8}
          bg={cardBg}
          borderRadius="lg"
          border="1px dashed"
          borderColor={borderColor}
        >
          <VStack spacing={3}>
            <Spinner
              size="xl"
              color="brand.500"
              thickness="4px"
              speed="0.65s"
            />
            <Text fontSize="sm" color={secondaryTextColor} fontWeight="500">
              Searching users...
            </Text>
          </VStack>
        </Box>
      ) : search && searchResult.length > 0 ? (
        <Box
          bg={cardBg}
          borderRadius="lg"
          border="1px solid"
          borderColor={borderColor}
          maxH="280px"
          overflowY="auto"
          transition="all 0.2s"
          _hover={{
            borderColor: useColorModeValue('brand.300', 'brand.500'),
            shadow: 'sm',
          }}
        >
          <UserListItem
            users={searchResult.slice(0, 4)}
            handleFunction={onAddUser}
            loadingChat={loadingChat}
            isClicked={isClicked}
            setIsClicked={setIsClicked}
          />
        </Box>
      ) : search && searchResult.length === 0 ? (
        <Box
          bg={cardBg}
          borderRadius="lg"
          border="1px dashed"
          borderColor={borderColor}
          p={8}
          textAlign="center"
        >
          <Text fontSize="2xl" mb={2}>🔍</Text>
          <Text color={textColor} fontWeight="600" mb={1}>
            No users found
          </Text>
          <Text fontSize="sm" color={secondaryTextColor}>
            Try searching with a different name or email
          </Text>
        </Box>
      ) : (
        <Box
          bg={cardBg}
          borderRadius="lg"
          border="1px dashed"
          borderColor={borderColor}
          p={8}
          textAlign="center"
        >
          <Text fontSize="2xl" mb={2}>👥</Text>
          <Text color={textColor} fontWeight="600" mb={1}>
            Search for users
          </Text>
          <Text fontSize="sm" color={secondaryTextColor}>
            Type a name or email to find users to add
          </Text>
        </Box>
      )}
    </Box>
  );
}

