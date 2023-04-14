import { ViewIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  FormControl,
  IconButton,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Skeleton,
  Spinner,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import React, { Fragment, useEffect, useState } from 'react';
import { User, props } from '../../types/interfaces';
import { useToast, Stack } from '@chakra-ui/react';
import { chatState } from '../../Context/ChatProvider';
import { storage } from '../../utils/storage';
import axios, { AxiosRequestConfig } from 'axios';
import UserListItem from '../UserAvatar/UserListItems';
import UserBadgeList from '../UserBadge/UserBadgeList';
import ChatLoading from '../../utils/ChatLoading';

function GroupChatModel({ children }: props) {
  const isCreate = true;
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const handleSearch = async (query: string) => {
    setSearch(query);
    if (!query) return;
    try {
      setLoading(true);
      const token = storage.getToken();
      const config: AxiosRequestConfig = {
        url: `/api/v1/users?search=${search}`,
        headers: { Authorization: `Bearer ${token}` },
        method: 'GET',
      };
      const { data } = await (await axios(config)).data.data;
      setSearchResult(data);
    } catch (err) {
      toast({
        title: 'Error Occurred',
        description: 'Failed to load the search result',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
      });
    }
    setLoading(false);
  };
  const handleGroup = (userInfo: User) => {
    if (!selectedUsers.includes(userInfo)) {
      setSelectedUsers([userInfo, ...selectedUsers]);
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
      const token = storage.getToken();
      const config: AxiosRequestConfig = {
        url: `/api/v1/chats/group`,
        headers: { Authorization: `Bearer ${token}` },
        method: 'POST',
        data: { users: selectedUsers.map((u) => u.id), name: groupName },
      };
      const res = await (await axios(config)).data;
      const { data } = res;
      if (res.status === 'success') {
        setChats([data, ...chats]);
        onClose();
        toast({
          title: 'New Group Chat Created',
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'top',
        });
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

  const { user, chats, setChats, setSelectedChat } = chatState();

  return (
    <Fragment>
      <span onClick={onOpen}>{children}</span>
      <Modal
        isOpen={isOpen}
        onClose={() => {
          setSelectedUsers([]);
          setSearchResult([]);
          setSearch('');
          onClose();
        }}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader
            display="flex"
            justifyContent="center"
            fontSize="40px"
            fontFamily="work sans"
          >
            Create Group Chat
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody
            display="flex"
            flexDir="column"
            justifyContent="space-between"
            alignItems="center"
          >
            <FormControl>
              <Input
                placeholder="Chat Name"
                mb="3"
                onChange={(e) => setGroupName(e.target.value)}
              />
            </FormControl>
            <FormControl>
              <Input
                placeholder="Add Users eg: Bahaa, Ali, Islam"
                mb={1}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </FormControl>

            <Box w="100%" display="flex" flexWrap="wrap">
              <UserBadgeList
                users={selectedUsers}
                handleFunction={handleDelete}
                isCreate={isCreate}
              />
            </Box>
            {loading ? (
              <ChatLoading num={4} />
            ) : (
              <Stack w="100%">
                <UserListItem
                  users={searchResult.slice(0, 4)}
                  handleFunction={handleGroup}
                />
              </Stack>
            )}
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" onClick={handleSubmit}>
              Create Chat
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Fragment>
  );
}

export default GroupChatModel;
