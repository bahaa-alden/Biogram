import { ViewIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
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
  Text,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import axios from 'axios';
import { Fragment, useEffect, useState } from 'react';
import { storage } from '../../utils/storage';
import { chatState } from '../../Context/ChatProvider';

function ProfileModel({ userInfo, children }: any) {
  const { user, setUser } = chatState();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [pic, setPic] = useState<any>('');
  const toast = useToast();
  const updatePic = async () => {
    if (pic === '') return;
    const PicData = new FormData();
    PicData.append('photo', pic);
    const token = storage.getToken();
    const res = await axios({
      method: 'PATCH',
      url: '/api/v1/users/updateMe',
      headers: { Authorization: `Bearer ${token}` },
      data: PicData,
    });
    if (res.data.status === 'success') {
      toast({
        title: 'Photo updated',
        status: 'success',
        duration: 1500,
        isClosable: true,
        position: 'top',
      });
      setUser(res.data.data.user);
    }
  };
  useEffect(() => {
    const h = setTimeout(function () {
      updatePic();
    }, 100);
    return () => clearTimeout(h);
  }, [pic]);
  return (
    <Fragment>
      {children ? (
        <span onClick={onOpen}>{children}</span>
      ) : (
        <IconButton icon={<ViewIcon />} onClick={onOpen} aria-label={''} />
      )}
      <Modal
        size={{ base: 'xs', md: 'md', lg: '2xl' }}
        isOpen={isOpen}
        onClose={onClose}
      >
        <ModalOverlay />
        <ModalContent h="410px">
          <ModalHeader
            display="flex"
            justifyContent="center"
            fontSize="40px"
            fontFamily="work sans"
          >
            {userInfo?.name}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody
            display="flex"
            flexDir="column"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box
              pos="relative"
              borderRadius="full"
              overflow={'hidden'}
              boxSize="150px"
            >
              <Image
                width={'100%'}
                height={'100%'}
                src={`/img/users/${userInfo?.photo}`}
                alt={userInfo?.name}
              />
              {userInfo.id === user.id && (
                <FormControl
                  opacity={'0.2'}
                  pos="absolute"
                  left={'1.5'}
                  bottom={'-1'}
                  id="pic"
                  bg="white"
                  _active={{ opacity: '0.7' }}
                >
                  <FormLabel>
                    <ViewIcon color="black" width={'100%'} height={'25px'} />
                  </FormLabel>
                  <Input
                    display={'none'}
                    type="file"
                    accept="image/*"
                    p={2}
                    onChange={(e) => {
                      if (e.target.files) setPic(e.target.files[0]);
                    }}
                  />
                </FormControl>
              )}
            </Box>
            <Text
              fontSize={{ base: '22px', md: '30px' }}
              fontFamily="work sans"
            >
              {userInfo?.email}
            </Text>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Fragment>
  );
}

export default ProfileModel;
