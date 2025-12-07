import { EditIcon, SearchIcon, ViewIcon } from '@chakra-ui/icons';
import {
  Badge,
  Box,
  Button,
  Divider,
  HStack,
  IconButton,
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
  Tooltip,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack
} from '@chakra-ui/react';
import { Fragment, useEffect, useState } from 'react';
import { chatState } from '../../Context/ChatProvider';
import { chatService } from '../../services/api/chat.service';
import { userService } from '../../services/api/user.service';
import { User } from '../../types/interfaces';
import UserListItem from '../UserAvatar/UserListItems';
import UserBadgeList from '../UserBadge/UserBadgeList';

function UpdateGroupChatModel({
  fetchAgain,
  setFetchAgain,
  fetchMessages,
  socket,
}: any) {
  const isCreate = false;
  const { user, selectedChat, setSelectedChat, chats, setChats } = chatState();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<User[]>(
    selectedChat?.users || []
  );
  const [search, setSearch] = useState('');
  const [searchResult, setSearchResult] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [renameLoading, setRenameLoading] = useState(false);
  const [isClicked, setIsClicked] = useState<number>();
  const [loadingChat, setLoadingChat] = useState(false);
  const toast = useToast();

  // Initialize form data when modal opens or chat changes
  useEffect(() => {
    if (isOpen && selectedChat) {
      if (selectedChat?.name) {
        setGroupName(selectedChat?.name);
      }
      if (selectedChat?.users) {
        setSelectedUsers(selectedChat?.users);
      }
    }
  }, [isOpen, selectedChat?.name, selectedChat?.users]);
  const handleDelete = (delUser: User) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== delUser.id));
  };

  const handleAddUser = async (userInfo: User) => {
    setLoadingChat(true);

    if (selectedChat?.users?.includes(userInfo)) {
      toast({
        title: 'User already in group',
        description: 'User already exist',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
      setLoadingChat(false);
      setIsClicked(-1);
      return;
    }
    try {
      setLoading(true);

      if (!selectedChat?.id || !userInfo?.id) return;
      const response = await chatService.addToGroup(selectedChat.id, userInfo.id);
      const data = response.data.data;
      if (response.status === 'success') {
        toast({
          title: 'Added Successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'top',
        });

        setSelectedChat({ users: [], groupAdmin: {} });
        setTimeout(function () {
          setSelectedChat(data);
        }, 10);
        setFetchAgain(!fetchAgain);
        socket.emit('group add', data);
      }
    } catch (err: any) {
      toast({
        title: 'Error Occurred',
        description: err.response.data.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
      });
    }
    setLoadingChat(false);
    setIsClicked(-1);
    setSearchResult([]);
    setSearch('');
    setLoading(false);
  };

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

  useEffect(() => {
    const h = setTimeout(function () {
      handleSearch();
    }, 100);
    return () => clearTimeout(h);
  }, [search]);

  const handleRename = async () => {
    const trimmedName = groupName.trim();
    
    // Validate input
    if (!trimmedName) {
      toast({
        title: 'Please enter a group name',
        description: 'Group name cannot be empty',
        status: 'warning',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
      return;
    }

    // Check if name has actually changed
    if (trimmedName === selectedChat?.name) {
      toast({
        title: 'No changes detected',
        description: 'Please enter a different group name',
        status: 'info',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
      return;
    }

    // Validate length
    if (trimmedName.length > 50) {
      toast({
        title: 'Name too long',
        description: 'Group name must be less than 50 characters',
        status: 'warning',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
      return;
    }

    try {
      setRenameLoading(true);
      if (!selectedChat?.id) return;
      const response = await chatService.renameGroup(selectedChat.id, trimmedName);
      const data = response.data.data;
      if (response.status === 'success') {
        toast({
          title: 'Renamed Successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'top',
        });
        setFetchAgain(!fetchAgain);
        setSelectedChat({ users: [], groupAdmin: {} });
        setTimeout(function () {
          setSelectedChat(data);
        }, 10);
        socket.emit('group rename', {
          chat: data,
          userId: user.id,
        });
        // Reset form after successful rename
        setGroupName(data.name || trimmedName);
      }
    } catch (err: any) {
      toast({
        title: 'Failed to rename the chat',
        description: err?.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    }
    setRenameLoading(false);
  };

  const handleRemove = async (userInfo: User) => {
    try {
      setLoading(true);
      if (!selectedChat?.id || !userInfo?.id) return;
      const response = await chatService.removeFromGroup(selectedChat.id, userInfo.id);
      const data = response.data.data;
      if (response.status === 'success') {
        toast({
          title: 'Removed Successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'top',
        });
        if (userInfo.id === user.id)
          setSelectedChat({ users: [], groupAdmin: {} });
        else {
          setSelectedChat({ users: [], groupAdmin: {} });
          setTimeout(function () {
            setSelectedChat(data);
          }, 10);
        }
        setFetchAgain(!fetchAgain);
        socket.emit('group remove', {
          chat: data,
          userId: user.id,
          removedUser: userInfo.id,
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error Occurred',
        description: err.response.data.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
      });
    }
    setLoading(false);
  };
  // Always render component (hooks must always be called), but conditionally show UI
  if (!selectedChat?.isGroup || !selectedChat?.users?.length) {
    return null;
  }

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');
  const cardBg = useColorModeValue('gray.50', 'gray.700');

  return (
    <Fragment>
      <Tooltip label="Group Settings" placement="bottom">
        <IconButton
          aria-label="Group Settings"
          display={{ base: 'flex' }}
          icon={<ViewIcon />}
          onClick={onOpen}
          variant="ghost"
          colorScheme="brand"
          size={{ base: 'sm', md: 'md' }}
        />
      </Tooltip>
      <Modal
        size={{ base: 'sm', md: 'lg', lg: 'xl' }}
        isOpen={isOpen}
        isCentered
        onClose={() => {
          setSelectedUsers([]);
          setSearchResult([]);
          setSearch('');
          // Reset group name to current chat name when closing
          if (selectedChat?.name) {
            setGroupName(selectedChat?.name);
          }
          onClose();
        }}
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
                <Text
                  fontSize={{ base: 'xl', md: '2xl' }}
                  fontWeight="700"
                  color={textColor}
                  fontFamily="work sans"
                  flex={1}
                  isTruncated
                >
                  {selectedChat?.name}
                </Text>
                <Badge 
                  colorScheme="brand" 
                  px={2} 
                  py={1} 
                  borderRadius="md"
                  fontSize="xs"
                >
                  {selectedChat.users?.length} Members
                </Badge>
              </HStack>
              <Text
                fontSize="sm"
                color={secondaryTextColor}
                fontWeight="normal"
              >
                Manage group settings and members
              </Text>
            </VStack>
          </ModalHeader>
          <ModalCloseButton top={4} right={4} />

          <ModalBody py={4}>
            <VStack spacing={5} align="stretch">
              {/* Members Section */}
              <Box>
                <Text
                  fontSize="sm"
                  fontWeight="700"
                  color={textColor}
                  mb={3}
                  textTransform="uppercase"
                  letterSpacing="wide"
                >
                  Group Members
                </Text>
                <Box
                  bg={cardBg}
                  p={3}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor={borderColor}
                  minH="60px"
                >
                  <UserBadgeList
                    users={selectedChat?.users || []}
                    handleFunction={handleRemove}
                    isCreate={isCreate}
                  />
                </Box>
              </Box>

              <Divider />

              {/* Rename Group Section */}
              <Box>
                <HStack justify="space-between" mb={3}>
                  <Text
                    fontSize="sm"
                    fontWeight="700"
                    color={textColor}
                    textTransform="uppercase"
                    letterSpacing="wide"
                  >
                    Group Name
                  </Text>
                  <Text
                    fontSize="xs"
                    color={groupName.length > 45 ? 'red.500' : secondaryTextColor}
                    fontWeight="500"
                  >
                    {groupName.length}/50
                  </Text>
                </HStack>
                <HStack spacing={2}>
                  <InputGroup flex={1}>
                    <InputLeftElement pointerEvents="none">
                      <EditIcon color={secondaryTextColor} />
                    </InputLeftElement>
                    <Input
                      value={groupName}
                      placeholder={selectedChat?.name || 'Enter group name...'}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.length <= 50) {
                          setGroupName(value);
                        }
                      }}
                      bg={cardBg}
                      border="1px solid"
                      borderColor={
                        groupName.length > 45 
                          ? useColorModeValue('red.300', 'red.600')
                          : borderColor
                      }
                      _hover={{ 
                        borderColor: groupName.length > 45
                          ? useColorModeValue('red.400', 'red.500')
                          : useColorModeValue('brand.400', 'brand.500')
                      }}
                      _focus={{ 
                        borderColor: groupName.length > 45
                          ? useColorModeValue('red.500', 'red.400')
                          : 'brand.500', 
                        boxShadow: '0 0 0 1px'
                      }}
                      maxLength={50}
                      isDisabled={renameLoading}
                    />
                  </InputGroup>
                  <Button
                    colorScheme="brand"
                    isLoading={renameLoading}
                    onClick={handleRename}
                    px={6}
                    fontWeight="600"
                    isDisabled={
                      !groupName.trim() || 
                      groupName.trim() === selectedChat?.name ||
                      groupName.length > 50
                    }
                  >
                    Update
                  </Button>
                </HStack>
              </Box>

              {selectedChat?.isGroup && user?.id === selectedChat?.groupAdmin?.id && (
                <Fragment>
                  <Divider />

                  {/* Add Members Section */}
                  <Box>
                    <Text
                      fontSize="sm"
                      fontWeight="700"
                      color={textColor}
                      mb={3}
                      textTransform="uppercase"
                      letterSpacing="wide"
                    >
                      Add Members
                    </Text>
                    <InputGroup mb={3}>
                      <InputLeftElement pointerEvents="none">
                        <SearchIcon color={secondaryTextColor} />
                      </InputLeftElement>
                      <Input
                        value={search}
                        placeholder="Search users to add..."
                        onChange={(e) => setSearch(e.target.value)}
                        bg={cardBg}
                        border="1px solid"
                        borderColor={borderColor}
                        _hover={{ borderColor: useColorModeValue('brand.400', 'brand.500') }}
                        _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px' }}
                      />
                    </InputGroup>

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
                    ) : (
                      <Box
                        bg={cardBg}
                        borderRadius="lg"
                        border="1px solid"
                        borderColor={borderColor}
                        maxH="250px"
                        overflowY="auto"
                      >
                        <UserListItem
                          users={searchResult.slice(0, 4)}
                          handleFunction={handleAddUser}
                          loadingChat={loadingChat}
                          isClicked={isClicked}
                          setIsClicked={setIsClicked}
                        />
                      </Box>
                    )}
                  </Box>
                </Fragment>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter
            borderTop="1px solid"
            borderColor={borderColor}
            pt={4}
          >
            <HStack spacing={3} w="full" justify={{ base: 'stretch', md: 'flex-end' }}>
              <Button
                colorScheme="red"
                onClick={() => handleRemove(user)}
                fontWeight="600"
                flex={{ base: 1, md: 0 }}
              >
                Leave Group
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Fragment>
  );
}

export default UpdateGroupChatModel;
