import { ViewIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Divider,
  HStack,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
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
import logger from '../../utils/logger';
import { AddMembersSection } from './AddMembersSection';
import { GroupMembersSection } from './GroupMembersSection';
import { RenameGroupSection } from './RenameGroupSection';

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

    // Check if user is already in the chat by comparing IDs
    const userAlreadyExists = selectedChat?.users?.some(
      (u) => (u.id || u._id) === (userInfo.id || userInfo._id)
    );

    if (userAlreadyExists) {
      toast({
        title: 'User already in group',
        description: 'This user is already a member of the group',
        status: 'warning',
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
          description: `${userInfo.name} has been added to the group`,
          status: 'success',
          duration: 2000,
          isClosable: true,
          position: 'top',
        });

        // Update the selected chat without clearing it to prevent modal from closing
        setSelectedChat(data);
        setFetchAgain(!fetchAgain);
        socket.emit('group add', data);
      }
    } catch (err: unknown) {
      logger.error('Error adding user to group', err as Error);
      toast({
        title: 'Error Occurred',
        description: (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to add user to group',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
      });
    }
    setLoadingChat(false);
    setIsClicked(-1);
    setLoading(false);
  };

  const handleSearch = async () => {
    if (!search) return;
    try {
      setLoading(true);
      const response = await userService.getUsers({ search: search.trim() });
      const data = response.data.data;
      setSearchResult(data);
    } catch (err: unknown) {
      logger.error('Error searching users', err as Error);
      toast({
        title: 'Error Occurred',
        description: (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load the search result',
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
          description: `Group name changed to "${trimmedName}"`,
          status: 'success',
          duration: 2000,
          isClosable: true,
          position: 'top',
        });
        
        // Update the selected chat without clearing to keep modal open
        setSelectedChat(data);
        setFetchAgain(!fetchAgain);
        
        socket.emit('group rename', {
          chat: data,
          userId: user.id,
        });
        
        // Update form with the new name
        setGroupName(data.name || trimmedName);
      }
    } catch (err: unknown) {
      logger.error('Error renaming group chat', err as Error);
      toast({
        title: 'Failed to rename the chat',
        description: (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'An error occurred',
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
          description: `${userInfo.name} has been removed from the group`,
          status: 'success',
          duration: 2000,
          isClosable: true,
          position: 'top',
        });
        
        // If user is removing themselves, close the modal
        if (userInfo.id === user.id) {
          setSelectedChat({ users: [], groupAdmin: {} });
        } else {
          // For removing other users, update without clearing to keep modal open
          setSelectedChat(data);
        }
        
        setFetchAgain(!fetchAgain);
        socket.emit('group remove', {
          chat: data,
          userId: user.id,
          removedUser: userInfo.id,
        });
      }
    } catch (err: unknown) {
      logger.error('Error removing user from group', err as Error);
      toast({
        title: 'Error Occurred',
        description: (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to remove user from group',
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
  const headerGradient = useColorModeValue(
    'linear(to-r, brand.500, brand.600)',
    'linear(to-r, brand.600, brand.700)'
  );
  const hoverBg = useColorModeValue('gray.100', 'gray.600');
  const inputFocusBorder = useColorModeValue('brand.500', 'brand.400');

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
        <ModalContent 
          bg={bgColor} 
          mx={4} 
          maxH="90vh"
          borderRadius="xl"
          overflow="hidden"
          boxShadow="xl"
        >
          <ModalHeader
            bgGradient={headerGradient}
            color="white"
            pb={4}
            pt={6}
            pr={14}
          >
            <VStack spacing={2} align="stretch">
              <HStack spacing={3} align="center">
                <Box
                  bg="whiteAlpha.200"
                  p={2}
                  borderRadius="lg"
                  backdropFilter="blur(10px)"
                >
                  <ViewIcon boxSize={5} />
                </Box>
                <VStack spacing={0} align="start" flex={1} minW={0}>
                  <Text
                    fontSize={{ base: 'lg', md: 'xl' }}
                    fontWeight="700"
                    fontFamily="work sans"
                    isTruncated
                    maxW="full"
                  >
                    {selectedChat?.name}
                  </Text>
                  <Text
                    fontSize="sm"
                    color="whiteAlpha.900"
                    fontWeight="500"
                  >
                    Group Settings
                  </Text>
                </VStack>
              </HStack>
              </VStack>
          </ModalHeader>
          <ModalCloseButton 
            top={4} 
            right={4} 
            p={2}
            color="white"
            bg="whiteAlpha.200"
            _hover={{ bg: 'whiteAlpha.300' }}
            borderRadius="lg"
          />

          <ModalBody py={6} px={{ base: 4, md: 6 }}>
            <VStack spacing={6} align="stretch">
              <GroupMembersSection
                selectedChat={selectedChat!}
                onRemoveUser={handleRemove}
                isCreate={isCreate}
              />

              <Divider />

              <RenameGroupSection
                groupName={groupName}
                setGroupName={setGroupName}
                selectedChat={selectedChat}
                onRename={handleRename}
                renameLoading={renameLoading}
              />

              {selectedChat?.isGroup && user?.id === selectedChat?.groupAdmin?.id && (
                <Fragment>
                  <Divider />

                  <AddMembersSection
                    search={search}
                    setSearch={setSearch}
                    searchResult={searchResult}
                    loading={loading}
                    onAddUser={handleAddUser}
                    loadingChat={loadingChat}
                    isClicked={isClicked}
                    setIsClicked={setIsClicked}
                  />
                </Fragment>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter
            borderTop="1px solid"
            borderColor={borderColor}
            pt={4}
            pb={4}
            bg={useColorModeValue('white', 'gray.800')}
          >
            <HStack spacing={3} w="full" justify="flex-end">
              <Button
                variant="outline"
                colorScheme="red"
                onClick={() => handleRemove(user)}
                fontWeight="600"
                size="md"
                borderRadius="lg"
                px={6}
                _hover={{
                  bg: useColorModeValue('red.50', 'red.900'),
                  transform: 'translateY(-1px)',
                  shadow: 'sm',
                }}
                transition="all 0.2s"
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
