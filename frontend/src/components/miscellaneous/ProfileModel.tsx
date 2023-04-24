import { ViewIcon } from '@chakra-ui/icons';
import {
  Button,
  IconButton,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import { Fragment } from 'react';

function ProfileModel({ user, children }: any) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <Fragment>
      {children ? (
        <span onClick={onOpen}>{children}</span>
      ) : (
        <IconButton
          icon={<ViewIcon />}
          display={{ base: 'flex' }}
          onClick={onOpen}
          aria-label={''}
        />
      )}
      <Modal
        size={{ base: "xs", md: 'md', lg: "2xl" }}
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
            {user?.name}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody
            display="flex"
            flexDir="column"
            justifyContent="space-between"
            alignItems="center"
          >
            <Image
              boxSize="150px"
              borderRadius="full"
              src={`/img/users/${user?.photo}`}
              alt={user?.name}
            />
            <Text
              fontSize={{ base: '22px', md: '30px' }}
              fontFamily="work sans"
            >
              {user?.email}
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
