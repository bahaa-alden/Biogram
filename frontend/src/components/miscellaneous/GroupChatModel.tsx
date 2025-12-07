import { AddIcon, SearchIcon } from '@chakra-ui/icons';
import {
  Badge,
  Box,
  Button,
  Divider,
  FormControl,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack
} from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import { Fragment, useEffect, useState } from 'react';
import { chatState } from '../../Context/ChatProvider';
import { chatService } from '../../services/api/chat.service';
import { userService } from '../../services/api/user.service';
import { User } from '../../types/interfaces';
import UserListItem from '../UserAvatar/UserListItems';
import UserBadgeList from '../UserBadge/UserBadgeList';

function GroupChatModel({ children, socket }: any) {
  const isCreate = true;
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { setSelectedChat } = chatState();
  const queryClient = useQueryClient();
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [searchResult, setSearchResult] = useState<User[]>([]);
  const [isClicked, setIsClicked] = useState<number>();
  const [loadingChat, setLoadingChat] = useState(false);

  const [loading, setLoading] = useState(false);
  const toast = useToast();
  useEffect(() => {
    const h = setTimeout(function () {
      handleSearch();
    }, 100);
    return () => clearTimeout(h);
  }, [search]);
  const handleSearch = async () => {
    if (!search) return;
    try {
      setLoading(true);
      const response = await userService.getUsers({ search: search.trim() });
      const data = response.data.data;
      setSearchResult(data);
    } catch (err: any) {
      toast({
        title: 'Error Occurred',
        description: err.response?.data?.message || 'Failed to load the search result',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
      });
    }

    setLoading(false);
  };
  const handleGroup = (userInfo: User) => {
    setLoadingChat(true);
    if (!selectedUsers.includes(userInfo)) {
      setSelectedUsers([userInfo, ...selectedUsers]);
      setIsClicked(-1);
      setLoadingChat(false);
      return;
    }
    toast({
      title: 'Already Exist',
      description: 'User already exist',
      status: 'error',
      duration: 3000,
      isClosable: true,
      position: 'top',
    });
    setIsClicked(-1);
    setLoadingChat(false);
  };

  const handleDelete = (delUser: User) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== delUser.id));
  };
  const handleSubmit = async () => {
    if (!groupName || !selectedUsers) {
      toast({
        title: 'Please fill all the fields',
        status: 'warning',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
      return;
    }
    if (selectedUsers.length < 2) {
      toast({
        title: 'Group must contain at least 2 users',
        status: 'warning',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
      return;
    }
    try {
      setLoading(true);
      const response = await chatService.createGroupChat({ 
        users: selectedUsers.map((u) => u.id).filter((id): id is string => id !== undefined), 
        name: groupName.trim() 
      });
      const data = response.data.data;
      if (response.status === 'success') {
        // Invalidate and refetch chats list
        queryClient.invalidateQueries({ queryKey: ['chats'] });
        
        // Select the newly created chat - set it directly without clearing first
        setSelectedChat(data);
        
        onClose();
        toast({
          title: 'New Group Chat Created',
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'top',
        });
        socket.emit('group add', data);
      }
    } catch (err) {
      toast({
        title: 'Failed to create the chat',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    }
    setLoading(false);
    setSelectedUsers([]);
    setSearchResult([]);
    setSearch('');
  };

  const { user } = chatState();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');
  const cardBg = useColorModeValue('gray.50', 'gray.700');

  return (
    <Fragment>
      <span onClick={onOpen}>{children}</span>
      <Modal
        size={{ base: 'sm', md: 'lg', lg: 'xl' }}
        isOpen={isOpen}
        onClose={() => {
          setSelectedUsers([]);
          setSearchResult([]);
          setSearch('');
          setGroupName('');
          onClose();
        }}
        isCentered
        motionPreset="slideInBottom"
        scrollBehavior="inside"
      >
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent bg={bgColor} mx={4} maxH="90vh">
          <ModalHeader
            borderBottom="1px solid"
            borderColor={borderColor}
            pb={4}
          >
            <VStack spacing={0} align="stretch">
              <HStack>
                <AddIcon boxSize={5} color="brand.500" />
                <Text
                  fontSize={{ base: 'xl', md: '2xl' }}
                  fontWeight="700"
                  color={textColor}
                  fontFamily="work sans"
                  flex={1}
                >
                  Create Group Chat
                </Text>
              </HStack>
              <Text
                fontSize="sm"
                color={secondaryTextColor}
                fontWeight="normal"
              >
                Add members and start a group conversation
              </Text>
            </VStack>
          </ModalHeader>
          <ModalCloseButton top={4} right={4} />

          <ModalBody py={4}>
            <VStack spacing={5} align="stretch">
              {/* Group Name Section */}
              <Box>
                <Text
                  fontSize="sm"
                  fontWeight="700"
                  color={textColor}
                  mb={2}
                  textTransform="uppercase"
                  letterSpacing="wide"
                >
                  Group Name
                </Text>
                <FormControl>
                  <Input
                    placeholder="Enter group name..."
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    size="lg"
                    bg={cardBg}
                    border="1px solid"
                    borderColor={borderColor}
                    _hover={{ borderColor: useColorModeValue('brand.400', 'brand.500') }}
                    _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px' }}
                  />
                </FormControl>
              </Box>

              <Divider />

              {/* Selected Members Section */}
              {selectedUsers.length > 0 && (
                <Box>
                  <HStack justify="space-between" mb={2}>
                    <Text
                      fontSize="sm"
                      fontWeight="700"
                      color={textColor}
                      textTransform="uppercase"
                      letterSpacing="wide"
                    >
                      Selected Members
                    </Text>
                    <Badge colorScheme="brand" px={2} py={1} borderRadius="md">
                      {selectedUsers.length} {selectedUsers.length === 1 ? 'Member' : 'Members'}
                    </Badge>
                  </HStack>
                  <Box
                    bg={cardBg}
                    p={3}
                    borderRadius="lg"
                    border="1px solid"
                    borderColor={borderColor}
                    minH="60px"
                  >
                    <UserBadgeList
                      users={selectedUsers}
                      handleFunction={handleDelete}
                      isCreate={isCreate}
                    />
                  </Box>
                </Box>
              )}

              <Divider />

              {/* Search Users Section */}
              <Box>
                <Text
                  fontSize="sm"
                  fontWeight="700"
                  color={textColor}
                  mb={2}
                  textTransform="uppercase"
                  letterSpacing="wide"
                >
                  Add Members
                </Text>
                <FormControl mb={3}>
                  <InputGroup size="lg">
                    <InputLeftElement pointerEvents="none">
                      <SearchIcon color={secondaryTextColor} />
                    </InputLeftElement>
                    <Input
                      placeholder="Search users by name or email..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      bg={cardBg}
                      border="1px solid"
                      borderColor={borderColor}
                      _hover={{ borderColor: useColorModeValue('brand.400', 'brand.500') }}
                      _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px' }}
                    />
                  </InputGroup>
                </FormControl>

                {loading ? (
                  <Box display="flex" justifyContent="center" py={6}>
                    <VStack spacing={3}>
                      <Spinner
                        size="lg"
                        color="brand.500"
                        thickness="3px"
                      />
                      <Text fontSize="sm" color={secondaryTextColor}>
                        Searching...
                      </Text>
                    </VStack>
                  </Box>
                ) : searchResult.length > 0 ? (
                  <Box
                    bg={cardBg}
                    borderRadius="lg"
                    border="1px solid"
                    borderColor={borderColor}
                    maxH="250px"
                    overflowY="auto"
                  >
                    <UserListItem
                      users={searchResult.slice(0, 6)}
                      handleFunction={handleGroup}
                      loadingChat={loadingChat}
                      isClicked={isClicked}
                      setIsClicked={setIsClicked}
                    />
                  </Box>
                ) : search ? (
                  <Box
                    py={6}
                    textAlign="center"
                    border="1px dashed"
                    borderColor={borderColor}
                    borderRadius="lg"
                    bg={cardBg}
                  >
                    <SearchIcon boxSize={8} color={secondaryTextColor} mb={2} />
                    <Text color={secondaryTextColor} fontSize="sm" fontWeight="500">
                      No users found
                    </Text>
                  </Box>
                ) : (
                  <Box
                    py={6}
                    textAlign="center"
                    border="1px dashed"
                    borderColor={borderColor}
                    borderRadius="lg"
                    bg={cardBg}
                  >
                    <SearchIcon boxSize={8} color={secondaryTextColor} mb={2} />
                    <Text color={secondaryTextColor} fontSize="sm" fontWeight="500">
                      Search for users to add
                    </Text>
                    <Text color={secondaryTextColor} fontSize="xs" mt={1}>
                      Group requires at least 2 members
                    </Text>
                  </Box>
                )}
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter
            borderTop="1px solid"
            borderColor={borderColor}
            pt={4}
          >
            <HStack spacing={3} w="full" justify="flex-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedUsers([]);
                  setSearchResult([]);
                  setSearch('');
                  setGroupName('');
                  onClose();
                }}
                fontWeight="600"
              >
                Cancel
              </Button>
              <Button
                colorScheme="brand"
                onClick={handleSubmit}
                isDisabled={!groupName || selectedUsers.length < 2}
                leftIcon={<AddIcon />}
                fontWeight="600"
                px={6}
              >
                Create Group
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Fragment>
  );
}

export default GroupChatModel;
