import { EditIcon, EmailIcon, ViewIcon } from '@chakra-ui/icons';
import {
  Badge,
  Box,
  Button,
  Divider,
  FormControl,
  FormLabel,
  HStack,
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
  Tooltip,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack,
} from '@chakra-ui/react';
import axios from 'axios';
import { Fragment, useEffect, useState } from 'react';
import { chatState } from '../../Context/ChatProvider';
import { storage } from '../../utils/storage';

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
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');
  const cardBg = useColorModeValue('gray.50', 'gray.700');

  return (
    <Fragment>
      {children ? (
        <span onClick={onOpen}>{children}</span>
      ) : (
        <Tooltip label="View Profile" placement="bottom">
          <IconButton 
            icon={<ViewIcon />} 
            onClick={onOpen} 
            aria-label="View Profile"
            variant="ghost"
            colorScheme="brand"
            size={{ base: 'sm', md: 'md' }}
          />
        </Tooltip>
      )}
      <Modal
        size={{ base: 'sm', md: 'md', lg: 'lg' }}
        isOpen={isOpen}
        onClose={onClose}
        isCentered
        motionPreset="slideInBottom"
      >
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent bg={bgColor} mx={4}>
          <ModalHeader 
            borderBottom="1px solid"
            borderColor={borderColor}
            pb={4}
          >
            <VStack spacing={0} align="stretch">
              <Text 
                fontSize={{ base: 'xl', md: '2xl' }}
                fontWeight="700"
                color={textColor}
                fontFamily="work sans"
              >
                Profile Information
              </Text>
              <Text 
                fontSize="sm" 
                color={secondaryTextColor}
                fontWeight="normal"
              >
                View user details and information
              </Text>
            </VStack>
          </ModalHeader>
          <ModalCloseButton top={4} right={4} />
          
          <ModalBody py={6}>
            <VStack spacing={6} align="stretch">
              {/* Avatar Section */}
              <Box display="flex" justifyContent="center">
                <Box
                  pos="relative"
                  borderRadius="full"
                  overflow="hidden"
                  boxSize={{ base: '140px', md: '160px' }}
                  border="4px solid"
                  borderColor={useColorModeValue('brand.100', 'brand.900')}
                  boxShadow="xl"
                >
                  <Image
                    width="100%"
                    height="100%"
                    objectFit="cover"
                    src={userInfo?.photo}
                    alt={userInfo?.name}
                  />
                  {userInfo.id === user.id && (
                    <FormControl
                      pos="absolute"
                      left={0}
                      right={0}
                      bottom={0}
                      bg="blackAlpha.600"
                      backdropFilter="blur(4px)"
                      py={2}
                      cursor="pointer"
                      _hover={{ bg: 'blackAlpha.700' }}
                      transition="all 0.2s"
                    >
                      <FormLabel
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        m={0}
                        cursor="pointer"
                      >
                        <EditIcon color="white" boxSize={4} />
                        <Text ml={2} color="white" fontSize="sm" fontWeight="600">
                          Change Photo
                        </Text>
                      </FormLabel>
                      <Input
                        display="none"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files) setPic(e.target.files[0]);
                        }}
                      />
                    </FormControl>
                  )}
                </Box>
              </Box>

              {/* Name Section */}
              <VStack spacing={2} align="center">
                <Text
                  fontSize={{ base: '2xl', md: '3xl' }}
                  fontWeight="700"
                  color={textColor}
                  fontFamily="work sans"
                  textAlign="center"
                >
                  {userInfo?.name}
                </Text>
                {userInfo.id === user.id && (
                  <Badge 
                    colorScheme="brand" 
                    px={3} 
                    py={1} 
                    borderRadius="full"
                    fontSize="sm"
                  >
                    You
                  </Badge>
                )}
              </VStack>

              <Divider />

              {/* Email Section */}
              <Box
                bg={cardBg}
                p={4}
                borderRadius="lg"
                border="1px solid"
                borderColor={borderColor}
              >
                <HStack spacing={3}>
                  <Box
                    p={2}
                    bg={useColorModeValue('brand.50', 'brand.900')}
                    borderRadius="md"
                  >
                    <EmailIcon 
                      color={useColorModeValue('brand.500', 'brand.300')} 
                      boxSize={5} 
                    />
                  </Box>
                  <VStack spacing={0} align="start" flex={1}>
                    <Text 
                      fontSize="xs" 
                      color={secondaryTextColor}
                      fontWeight="600"
                      textTransform="uppercase"
                    >
                      Email Address
                    </Text>
                    <Text
                      fontSize={{ base: 'sm', md: 'md' }}
                      fontWeight="500"
                      color={textColor}
                      wordBreak="break-all"
                    >
                      {userInfo?.email}
                    </Text>
                  </VStack>
                </HStack>
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter 
            borderTop="1px solid" 
            borderColor={borderColor}
            pt={4}
          >
            <Button 
              colorScheme="brand" 
              onClick={onClose}
              size={{ base: 'md', md: 'lg' }}
              w={{ base: 'full', md: 'auto' }}
              fontWeight="600"
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Fragment>
  );
}

export default ProfileModel;
