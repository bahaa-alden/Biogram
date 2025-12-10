import {
  Avatar,
  Badge,
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  FormControl,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Spinner,
  Text,
  Tooltip,
  useColorMode,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack
} from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import { Fragment, useEffect, useState } from 'react';

import {
  BellIcon,
  ChevronDownIcon,
  MoonIcon,
  Search2Icon,
  SearchIcon,
  SunIcon,
} from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { chatState } from '../../Context/ChatProvider';
import { useNotifications } from '../../hooks/queries/useNotifications';
import { useSocket } from '../../hooks/useSocket';
import { chatService } from '../../services/api/chat.service';
import { notificationService } from '../../services/api/notification.service';
import { userService } from '../../services/api/user.service';
import { Notification, User } from '../../types/interfaces';
import { storage } from '../../utils/storage';
import UserListItem from '../UserAvatar/UserListItems';
import ProfileModel from './ProfileModel';

interface SideDrawerProps {
  bg: string;
  color?: string;
  fetchNotificationsAgain: boolean;
  setFetchNotificationsAgain: (value: boolean) => void;
}

function SideDrawer({
  bg,
  fetchNotificationsAgain,
  setFetchNotificationsAgain,
}: SideDrawerProps) {
  const {
    user,
    selectedChat,
    setSelectedChat,
  } = chatState();
  const queryClient = useQueryClient();
  const { socket } = useSocket(user);

  const [search, setSearch] = useState('');
  const [searchResult, setSearchResult] = useState<User[]>([]);

  const [isClicked, setIsClicked] = useState<number>();
  const [loading, setLoading] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigator = useNavigate();
  const { data: notifications, isLoading, refetch } = useNotifications(user?.id, { read: false });
  const toast = useToast();
  const { colorMode, toggleColorMode } = useColorMode();

  const fetchNotifications = async () => {
    try {
      refetch();
    } catch (error) {}
  };
  
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotificationsAgain]);

  // Listen for real-time notification updates via socket
  useEffect(() => {
    if (!socket || !user?.id) return;

    const handleNewNotification = () => {
      // Refetch notifications when a new notification is received
      fetchNotifications();
    };

    const handleMessageReceived =async (newMessage: any) => {
      // Check if message is for a chat that's not currently selected
      if(selectedChat?.id === newMessage.chat.id) {
        await notificationService.markNotificationRead(newMessage.chat.id);
      }
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    socket.on('notification', handleNewNotification);
    socket.on('message received', handleMessageReceived);

    return () => {
      socket.off('notification', handleNewNotification);
      socket.off('message received', handleMessageReceived);
    };
  }, [socket, user?.id, selectedChat?.id]);

  const handleMarkAllAsRead = async () => {
    if (!user?.id || !notifications?.length) return;
    
    try {
      const notificationIds = notifications
        .map((notif) => notif.id || notif._id)
        .filter((id): id is string => !!id);
      
      if (notificationIds.length === 0) return;
      
      await notificationService.markAllNotificationsRead(user.id);
      
      toast({
        title: 'All notifications marked as read',
        status: 'success',
        duration: 2000,
        position: 'bottom',
      });
      
      // Refresh notifications
      setFetchNotificationsAgain(!fetchNotificationsAgain);
    } catch (error: any) {
      toast({
        title: 'Failed to mark notifications as read',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 3000,
        position: 'bottom',
      });
    }
  };

  const logoutHandler = () => {
    storage.clearToken();
    toast({
      title: 'Logged out successfully',
      status: 'success',
      duration: 2000,
      position: 'bottom',
    });
    navigator('/');
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
        title: 'Failed to load the search result',
        description: err.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'bottom-left',
      });
    }
    setLoading(false);
  };

  const handleAccess = async (userInfo: User) => {
    if (!userInfo?.id) return;
    try {
      setLoadingChat(true);
      const response = await chatService.createChat({ userId: userInfo.id });
      
      // Handle both response structures from backend:
      // - New chat (201): { status: 'success', data: chat }
      // - Existing chat (200): { data: chat }
      // chatService.createChat returns response.data from axios, which could be either structure
      let chatData: any;
      
      // Check if response has status field (new chat)
      if (response.status === 'success' && response.data) {
        // New chat: { status: 'success', data: chat }
        chatData = response.data;
      } else if (response.data) {
        // Existing chat: { data: chat }
        chatData = response.data;
      } else {
        throw new Error('Invalid chat data received');
      }

      if (!chatData || !chatData.id) {
        throw new Error('Invalid chat data: missing id');
      }

      if (chatData.id === selectedChat?.id) {
        setLoadingChat(false);
        return;
      }

      // Invalidate and refetch chats list
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      
      // Set the selected chat directly (no intermediate empty state)
      setSelectedChat(chatData);
      
      onClose();
      setSearchResult([]);
      setSearch('');
    } catch (err: any) {
      console.error('Error creating/accessing chat:', err);
      toast({
        title: 'Error fetching the chat',
        description: err.response?.data?.message || err.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'bottom-left',
      });
    } finally {
      setIsClicked(-1);
      setLoadingChat(false);
    }
  };

  useEffect(() => {
    const h = setTimeout(function () {
      handleSearch();
    }, 100);
    return () => clearTimeout(h);
  }, [search]);

  const headerBg = useColorModeValue('white', 'gray.800');
  const headerBorderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const brandGradient = useColorModeValue(
    'linear(to-r, brand.500, brand.600)',
    'linear(to-r, brand.400, brand.500)'
  );

  return (
    <Fragment>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        w="100%"
        bg={headerBg}
        px={{ base: 3, md: 4, lg: 5 }}
        py={{ base: 2.5, md: 3 }}
        borderBottomWidth="1px"
        borderBottomColor={headerBorderColor}
        boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
        position="sticky"
        top={0}
        zIndex={100}
        backdropFilter="blur(10px)"
      >
        {/* Search Button */}
        <Tooltip label="Search Users To Chat" placement="bottom">
          <Button
            onClick={onOpen}
            aria-label="Search users to chat"
            leftIcon={<Search2Icon />}
            variant="ghost"
            colorScheme="brand"
            size={{ base: 'sm', md: 'md' }}
            fontWeight="600"
          >
            <Text display={{ base: 'none', md: 'flex' }}>
              Search
            </Text>
          </Button>
        </Tooltip>

        {/* Logo/Title */}
        <Text
          as="h1"
          fontSize={{ base: 'xl', md: '2xl' }}
          fontFamily="work sans"
          fontWeight="800"
          bgGradient={brandGradient}
          bgClip="text"
          letterSpacing="-0.5px"
        >
          Bio-Gram
        </Text>

        {/* Right Side Menu */}
        <HStack spacing={{ base: 1, md: 2 }}>
          {/* Notifications */}
          <Menu>
            <Tooltip label="Notifications" placement="bottom">
              <MenuButton
                as={Box}
                cursor="pointer"
                position="relative"
                aria-label={`Notifications${notifications?.length ? `: ${notifications?.length} unread` : ''}`}
                px={{ base: 2, md: 3 }}
                py={{ base: 2, md: 2 }}
                borderRadius="md"
                transition="all 0.2s"
                _hover={{
                  bg: useColorModeValue('gray.100', 'gray.700'),
                }}
              >
                <Box position="relative" display="inline-block">
                  <BellIcon boxSize={{ base: 6, md: 7 }} color={useColorModeValue('gray.600', 'gray.300')} />
                  {notifications?.length! > 0 && (
                    <Badge
                      position="absolute"
                      top="-8px"
                      right="-8px"
                      bg="red.500"
                      color="white"
                      borderRadius="full"
                      minW="20px"
                      minH="20px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      fontSize="xs"
                      fontWeight="bold"
                      boxShadow="lg"
                      border="2px solid"
                      borderColor={headerBg}
                      px={notifications?.length! > 9 ? 1 : 0}
                    >
                      {notifications?.length! > 99 ? '99+' : notifications?.length}
                    </Badge>
                  )}
                </Box>
              </MenuButton>
            </Tooltip>
            <MenuList
              maxH="400px"
              overflowY="auto"
              minW="280px"
              py={2}
              boxShadow="xl"
              border="1px solid"
              borderColor={headerBorderColor}
            >
              <Box px={4} py={2} borderBottom="1px solid" borderColor={headerBorderColor}>
                <HStack justify="space-between" align="center" mb={1}>
                  <Text fontWeight="700" fontSize="md" color={textColor}>
                    Notifications
                  </Text>
                  { notifications?.length! > 0 && (
                    <Button
                      size="xs"
                      variant="ghost"
                      colorScheme="blue"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAllAsRead();
                      }}
                    >
                      Mark all read
                    </Button>
                  )}
                </HStack>
                <Text fontSize="xs" color={secondaryTextColor}>
                  {notifications?.length} unread messages
                </Text>
              </Box>
              
              {!notifications?.length ? (
                <Box py={8} textAlign="center">
                  <BellIcon boxSize={10} color={secondaryTextColor} mb={2} />
                  <Text color={secondaryTextColor} fontSize="sm">
                    No new notifications
                  </Text>
                </Box>
              ) : (
                notifications?.map((notif: Notification, index: number) => (
                  <MenuItem
                    key={notif.id || notif._id || `notif-${index}`}
                    onClick={async () => {
                      // Mark notification as read
                      const notifId = notif.id || notif._id;
                      if (notifId && user?.id) {
                        try {
                          await notificationService.markNotificationRead(notif.chat?.id!);
                          // Refresh notifications
                          setFetchNotificationsAgain(!fetchNotificationsAgain);
                        } catch (error) {
                          console.error('Failed to mark notification as read:', error);
                        }
                      }

                      // Navigate to chat
                      if (
                        notif.message &&
                        notif.chat &&
                        notif.chat.id !== selectedChat?.id
                      ) {
                        if (notif.chat) {
                          setSelectedChat(notif.chat);
                        }
                      } else {
                        if (notif.chat && notif.chat.id !== selectedChat?.id) {
                          if (notif.chat) {
                            setSelectedChat(notif.chat);
                          }
                        }
                      }
                    }}
                    py={3}
                    px={4}
                    _hover={{ bg: cardBg }}
                  >
                    <VStack align="start" spacing={1} w="full">
                      <Text fontSize="sm" fontWeight="600" color={textColor} noOfLines={1}>
                        {notif.message && notif.chat ? (
                          <>
                            {notif.chat.isGroup
                              ? notif.chat.name
                              : notif.receiverName}
                          </>
                        ) : notif.chat ? (
                          notif.chat.name || 'Group'
                        ) : (
                          'Notification'
                        )}
                      </Text>
                      <Text fontSize="xs" color={secondaryTextColor} noOfLines={2}>
                        {notif.message && notif.chat ? (
                          <>
                            {notif.chat.isGroup
                              ? `New message in group`
                              : `New message`}
                          </>
                        ) : notif.chat ? (
                          `${notif.chatAdmin || 'Someone'} added you to the group`
                        ) : (
                          'New notification'
                        )}
                      </Text>
                    </VStack>
                  </MenuItem>
                ))
              )}
            </MenuList>
          </Menu>

          {/* User Menu */}
          <Menu>
            <MenuButton
              as={Button}
              variant="ghost"
              rightIcon={<ChevronDownIcon />}
              px={{ base: 2, md: 3 }}
              size={{ base: 'sm', md: 'md' }}
            >
              <Avatar
                size="sm"
                name={user.name}
                src={user.photo}
              />
            </MenuButton>
            <MenuList
              minW="200px"
              boxShadow="xl"
              border="1px solid"
              borderColor={headerBorderColor}
              py={2}
            >
              <Box px={4} py={2} borderBottom="1px solid" borderColor={headerBorderColor}>
                <Text fontWeight="700" fontSize="sm" color={textColor} isTruncated>
                  {user.name}
                </Text>
                <Text fontSize="xs" color={secondaryTextColor} isTruncated>
                  {user.email}
                </Text>
              </Box>
              
              <ProfileModel userInfo={user}>
                <MenuItem py={3} _hover={{ bg: cardBg }}>
                  <HStack spacing={3}>
                    <Avatar size="xs" name={user.name} src={user.photo} />
                    <Text fontWeight="500">My Profile</Text>
                  </HStack>
                </MenuItem>
              </ProfileModel>
              
              <MenuDivider />
              
              <MenuItem
                onClick={toggleColorMode}
                aria-label={`Switch to ${colorMode === 'light' ? 'dark' : 'light'} mode`}
                py={3}
                _hover={{ bg: cardBg }}
              >
                <HStack spacing={3}>
                  {colorMode === 'light' ? (
                    <>
                      <MoonIcon boxSize={4} />
                      <Text fontWeight="500">Dark Mode</Text>
                    </>
                  ) : (
                    <>
                      <SunIcon boxSize={4} />
                      <Text fontWeight="500">Light Mode</Text>
                    </>
                  )}
                </HStack>
              </MenuItem>
              
              <MenuDivider />
              
              <MenuItem
                onClick={logoutHandler}
                aria-label="Logout"
                py={3}
                _hover={{ bg: 'red.50', color: 'red.600' }}
                color="red.500"
              >
                <Text fontWeight="600">Logout</Text>
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Box>

      <Drawer
        isOpen={isOpen}
        placement="left"
        onClose={() => {
          onClose();
          setSearchResult([]);
          setSearch('');
        }}
        size="md"
      >
        <DrawerOverlay backdropFilter="blur(4px)" />
        <DrawerContent bg={headerBg}>
          <DrawerHeader
            borderBottomWidth="1px"
            borderBottomColor={headerBorderColor}
            pb={4}
          >
            <VStack spacing={0} align="stretch">
              <Text
                fontSize={{ base: 'xl', md: '2xl' }}
                fontWeight="700"
                color={textColor}
                fontFamily="work sans"
              >
                Search Users
              </Text>
              <Text
                fontSize="sm"
                color={secondaryTextColor}
                fontWeight="normal"
              >
                Find people to start a conversation
              </Text>
            </VStack>
          </DrawerHeader>
          <DrawerCloseButton top={4} right={4} />
          
          <DrawerBody pt={4}>
            <VStack spacing={4} align="stretch">
              {/* Search Input */}
              <FormControl>
                <InputGroup size="lg">
                  <InputLeftElement pointerEvents="none">
                    <SearchIcon color={secondaryTextColor} />
                  </InputLeftElement>
                  <Input
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    aria-label="Search users by name or email"
                    bg={cardBg}
                    border="1px solid"
                    borderColor={headerBorderColor}
                    _hover={{ borderColor: useColorModeValue('brand.400', 'brand.500') }}
                    _focus={{ 
                      borderColor: 'brand.500', 
                      boxShadow: '0 0 0 1px',
                      bg: headerBg
                    }}
                    fontSize="md"
                  />
                </InputGroup>
              </FormControl>

              {/* Results Section */}
              <Box>
                {search && (
                  <Text
                    fontSize="xs"
                    fontWeight="700"
                    color={secondaryTextColor}
                    textTransform="uppercase"
                    letterSpacing="wide"
                    mb={3}
                  >
                    {loading ? 'Searching...' : `${searchResult.length} Results`}
                  </Text>
                )}
                
                {loading ? (
                  <Box py={6}>
                    <VStack spacing={3}>
                      <Spinner
                        size="lg"
                        color="brand.500"
                        thickness="3px"
                      />
                      <Text fontSize="sm" color={secondaryTextColor}>
                        Searching for users...
                      </Text>
                    </VStack>
                  </Box>
                ) : searchResult.length > 0 ? (
                  <Box
                    border="1px solid"
                    borderColor={headerBorderColor}
                    borderRadius="lg"
                    overflow="hidden"
                  >
                    <UserListItem
                      users={searchResult}
                      handleFunction={handleAccess}
                      loadingChat={loadingChat}
                      isClicked={isClicked}
                      setIsClicked={setIsClicked}
                    />
                  </Box>
                ) : search ? (
                  <Box
                    py={8}
                    textAlign="center"
                    border="1px dashed"
                    borderColor={headerBorderColor}
                    borderRadius="lg"
                    bg={cardBg}
                  >
                    <SearchIcon boxSize={10} color={secondaryTextColor} mb={2} />
                    <Text color={secondaryTextColor} fontSize="sm" fontWeight="500">
                      No users found
                    </Text>
                    <Text color={secondaryTextColor} fontSize="xs" mt={1}>
                      Try searching with a different name or email
                    </Text>
                  </Box>
                ) : (
                  <Box
                    py={8}
                    textAlign="center"
                    border="1px dashed"
                    borderColor={headerBorderColor}
                    borderRadius="lg"
                    bg={cardBg}
                  >
                    <SearchIcon boxSize={10} color={secondaryTextColor} mb={2} />
                    <Text color={secondaryTextColor} fontSize="sm" fontWeight="500">
                      Start searching
                    </Text>
                    <Text color={secondaryTextColor} fontSize="xs" mt={1}>
                      Enter a name or email to find users
                    </Text>
                  </Box>
                )}
              </Box>
            </VStack>
          </DrawerBody>
          
          <DrawerFooter
            borderTopWidth="1px"
            borderTopColor={headerBorderColor}
            pt={4}
          >
            <Button
              colorScheme="brand"
              onClick={() => {
                onClose();
                setSearchResult([]);
                setSearch('');
              }}
              w="full"
              size="lg"
              fontWeight="600"
            >
              Close
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Fragment>
  );
}
export default SideDrawer;
