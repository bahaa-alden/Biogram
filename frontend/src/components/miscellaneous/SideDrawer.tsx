import { Fragment, useEffect } from 'react';
import { useState } from 'react';
import {
  useToast,
  Avatar,
  Box,
  Button,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Text,
  Tooltip,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  useDisclosure,
  Input,
  Spinner,
  useColorModeValue,
  useColorMode,
  Badge,
  FormControl,
} from '@chakra-ui/react';

import {
  BellIcon,
  ChevronDownIcon,
  MoonIcon,
  Search2Icon,
  SunIcon,
} from '@chakra-ui/icons';
import { chatState } from '../../Context/ChatProvider';
import ProfileModel from './ProfileModel';
import { useNavigate } from 'react-router-dom';
import axios, { AxiosRequestConfig } from 'axios';
import { storage } from '../../utils/storage';
import ChatLoading from '../../utils/ChatLoading';
import UserListItem from '../UserAvatar/UserListItems';
import { Chat, User } from '../../types/interfaces';
import { getSender } from '../../config/chatLogics';

function SideDrawer({
  bg,
  fetchNotificationsAgain,
  setFetchNotificationsAgain,
}: any) {
  const {
    user,
    selectedChat,
    setSelectedChat,
    setChats,
    chats,
    notification,
    setNotification,
  } = chatState();

  const [search, setSearch] = useState('');
  const [searchResult, setSearchResult] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigator = useNavigate();

  const toast = useToast();
  const { colorMode, toggleColorMode } = useColorMode();

  const fetchNotifications = async () => {
    try {
      const token = storage.getToken();
      const config: AxiosRequestConfig = {
        url: `/api/v1/users/${user.id}/notifications?read=false&limit=10`,
        headers: { Authorization: `Bearer ${token}` },
        method: 'GET',
      };
      const { data } = await (await axios(config)).data.data;
      setNotification(data);
    } catch (error) {}
  };
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotificationsAgain]);

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
      const token = storage.getToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await (
        await axios.get(`/api/v1/users?search=${search}`, config)
      ).data.data;
      setSearchResult(data);
    } catch (err: any) {
      toast({
        title: 'Failed to load the search result',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'bottom-left',
      });
    }
    setLoading(false);
  };

  const handleAccess = async (userInfo: User) => {
    try {
      setLoadingChat(true);
      const token = storage.getToken();
      const config: AxiosRequestConfig = {
        url: '/api/v1/chats',
        headers: { Authorization: `Bearer ${token}` },
        method: 'POST',
        data: { userId: userInfo.id },
      };

      const { data } = await (await axios(config)).data;

      if (!chats.find((c: any) => c.id === data.id)) setChats([data, ...chats]);

      setSelectedChat(data);
      onClose();
      setSearchResult([]);
      setSearch('');
    } catch (err: any) {
      toast({
        title: 'Error fetching the chat',
        description: err.response.data.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'bottom-left',
      });
    }
    setLoadingChat(false);
  };

  useEffect(() => {
    const h = setTimeout(function () {
      handleSearch();
    }, 100);
    return () => clearTimeout(h);
  }, [search]);
  return (
    <Fragment>
      <Box
        display={'flex'}
        justifyContent="space-between"
        alignItems="center"
        w="100%"
        background="white"
        p={{ base: '2px 5px 2px 5px' }}
        borderWidth="5px"
        bg={bg}
      >
        <Tooltip label="Search Users To Chat" placement="bottom-end">
          <Button variant="ghost" onClick={onOpen}>
            <Search2Icon />
            <Text display={{ base: 'none', md: 'flex' }} px="4">
              Search User
            </Text>
          </Button>
        </Tooltip>
        <Text fontSize={'2xl'} fontFamily={'work sans'}>
          Bio-Gram
        </Text>
        <div>
          <Menu>
            <MenuButton p={1}>
              <Badge
                bg={notification.length ? 'red' : 'white'}
                color={notification.length ? 'white' : 'black'}
                borderRadius={'3'}
              >
                {notification.length}
              </Badge>
              <BellIcon fontSize={'2xl'} m="1" />
            </MenuButton>
            <MenuList pl="2">
              {!notification.length && 'NO New Messages'}
              {notification.map((notif: any) => (
                <MenuItem
                  onClick={() => {
                    if (
                      notif.message &&
                      notif.message.chat.id !== selectedChat.id
                    ) {
                      setSelectedChat({ users: [], groupAdmin: {} });
                      setTimeout(function () {
                        setSelectedChat(notif.message.chat);
                      }, 100);
                    } else {
                      if (notif.chat.id !== selectedChat.id) {
                        setSelectedChat({ users: [], groupAdmin: {} });
                        setTimeout(function () {
                          setSelectedChat(notif.chat);
                        }, 100);
                      }
                    }
                  }}
                  key={notif.id}
                >
                  {notif.message ? (
                    <>
                      {notif.message.chat.isGroup
                        ? `New Message in ${notif.message.chat.name}`
                        : `New Message from ${getSender(
                            user,
                            notif.message.chat.users
                          )}`}
                    </>
                  ) : (
                    `${notif.chat.groupAdmin.name.split(' ')[0]} Added You To ${
                      notif.chat.name
                    } Group`
                  )}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
          <Menu>
            <MenuButton
              px={{ base: '10px', md: '15px', lg: '15px' }}
              as={Button}
              rightIcon={<ChevronDownIcon />}
            >
              {user.photo && (
                <Avatar
                  size="sm"
                  cursor="pointer"
                  name={user.name}
                  src={`/img/users/${user.photo}`}
                />
              )}
            </MenuButton>
            <MenuList>
              <ProfileModel userInfo={user}>
                <MenuItem>My Profile</MenuItem>
              </ProfileModel>
              <MenuDivider />
              <MenuItem onClick={toggleColorMode}>
                {colorMode === 'light' ? (
                  <>
                    <MoonIcon />
                    <Text lineHeight="0" px="2">
                      Dark
                    </Text>
                  </>
                ) : (
                  <>
                    <SunIcon />
                    <Text lineHeight="0" px="2">
                      Light
                    </Text>
                  </>
                )}
              </MenuItem>
              <MenuItem onClick={logoutHandler}> Logout</MenuItem>
            </MenuList>
          </Menu>
        </div>
      </Box>

      <Drawer
        isOpen={isOpen}
        placement="left"
        onClose={() => {
          onClose();
          setSearchResult([]);
          setSearch('');
        }}
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHeader borderBottomWidth="1px">Search Users</DrawerHeader>
          <DrawerBody>
            <Box display="flex" pb="2">
              <FormControl>
                <Input
                  placeholder="Search by name or email"
                  mr="2"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </FormControl>
            </Box>
            {loading ? (
              <ChatLoading num={10} />
            ) : (
              <UserListItem
                users={searchResult}
                handleFunction={handleAccess}
              />
            )}
            {loadingChat && <Spinner ml="auto" display="flex" />}
          </DrawerBody>
          <DrawerFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Cancel
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Fragment>
  );
}
export default SideDrawer;
