import { ArrowForwardIcon } from '@chakra-ui/icons';
import {
  Box,
  FormControl,
  IconButton,
  Input,
  Spinner,
  useColorModeValue,
} from '@chakra-ui/react';
import { FormEvent } from 'react';

interface MessageInputProps {
  newMessage: string;
  setNewMessage: (value: string) => void;
  isSending: boolean;
  onSend: (e: FormEvent<HTMLFormElement>) => void;
}

export function MessageInput({
  newMessage,
  setNewMessage,
  isSending,
  onSend,
}: MessageInputProps) {
  const inputBg = useColorModeValue('white', 'gray.800');
  const inputBorderTop = useColorModeValue('gray.200', 'gray.700');
  const inputFieldBg = useColorModeValue('gray.50', 'gray.700');
  const inputFieldColor = useColorModeValue('gray.900', 'white');
  const inputBorderColor = useColorModeValue('gray.200', 'gray.600');
  const inputBorderHover = useColorModeValue('gray.300', 'gray.500');
  const inputFocusBg = useColorModeValue('white', 'gray.600');
  const inputPlaceholderColor = useColorModeValue('gray.400', 'gray.500');

  return (
    <Box
      as="form"
      onSubmit={onSend}
      display="flex"
      flexDirection="column"
      bg={inputBg}
      borderTopWidth="1px"
      borderTopColor={inputBorderTop}
      pt={{ base: 2.5, md: 2.5, lg: 3 }}
      pb={{ base: 2.5, md: 2.5, lg: 3 }}
      px={{ base: 3, md: 4, lg: 5 }}
      flexShrink={0}
      position="relative"
      zIndex={10}
    >
      <FormControl
        display="flex"
        gap={{ base: 3, md: 4 }}
        alignItems="center"
        width="100%"
      >
        <Input
          bg={inputFieldBg}
          borderRadius="xl"
          color={inputFieldColor}
          placeholder="Type your message here..."
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            if (isSending) return;
            setNewMessage(e.target.value);
          }}
          value={newMessage}
          border="2px solid"
          borderColor={inputBorderColor}
          _hover={{
            borderColor: inputBorderHover,
          }}
          _focus={{
            borderColor: 'brand.500',
            boxShadow: '0 0 0 2px rgba(66, 153, 225, 0.1)',
            bg: inputFocusBg,
          }}
          _placeholder={{
            color: inputPlaceholderColor,
          }}
          height={{ base: '48px', md: '50px', lg: '52px' }}
          fontSize={{ base: '15px', md: '16px', lg: '16px' }}
          aria-label="Message input"
          aria-required="false"
          aria-describedby="typing-indicator"
          px={{ base: 4, md: 5, lg: 6 }}
          fontWeight="500"
          boxShadow="sm"
          transition="all 0.2s"
        />
        <IconButton
          type="submit"
          aria-label="Send message"
          icon={isSending ? <Spinner size="sm" thickness="2px" /> : <ArrowForwardIcon boxSize={{ base: 5, md: 5, lg: 6 }} />}
          bg="brand.500"
          color="white"
          borderRadius="xl"
          _hover={{
            bg: 'brand.600',
            transform: 'translateY(-2px)',
            boxShadow: 'lg',
          }}
          _active={{
            transform: 'translateY(0)',
            boxShadow: 'md',
          }}
          size="md"
          width={{ base: '48px', md: '50px', lg: '52px' }}
          height={{ base: '48px', md: '50px', lg: '52px' }}
          minW={{ base: '48px', md: '50px', lg: '52px' }}
          minH={{ base: '48px', md: '50px', lg: '52px' }}
          isDisabled={isSending || !newMessage.trim()}
          transition="all 0.2s"
          flexShrink={0}
          boxShadow="md"
          _disabled={{
            opacity: 0.6,
            cursor: 'not-allowed',
          }}
        />
      </FormControl>
    </Box>
  );
}

