import { ArrowDownIcon } from '@chakra-ui/icons';
import {
  Box,
  IconButton,
  Spinner,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import type { RefObject } from 'react';
import { Message } from '../../types/interfaces';
import { MessageSkeleton } from '../Message/MessageSkeleton';
import ScrollableChat from './ScrollableChat';
import { TypingIndicator } from './TypingIndicator';

interface MessagesContainerProps {
  messages: Message[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  isScrollingToCenter?: boolean;
  containerRef: RefObject<HTMLDivElement>;
  loadMoreTriggerRef: RefObject<HTMLDivElement>;
  loadNewerTriggerRef?: RefObject<HTMLDivElement>;
  firstUnreadMessageId: string | null;
  lastReadMessageRef: RefObject<HTMLDivElement>;
  hasNextPage: boolean;
  typingUser: { name: string; id: string } | null;
  showScrollButton: boolean;
  scrollToBottom: (force?: boolean) => void;
}

export function MessagesContainer({
  messages,
  isLoading,
  isFetchingNextPage,
  isScrollingToCenter = false,
  containerRef,
  loadMoreTriggerRef,
  loadNewerTriggerRef,
  firstUnreadMessageId,
  lastReadMessageRef,
  hasNextPage,
  typingUser,
  showScrollButton,
  scrollToBottom,
}: MessagesContainerProps) {
  const messagesBgGradient = useColorModeValue(
    'linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%), url(pattern-12.svg) center center',
    'linear-gradient(180deg, #1a1d24 0%, #0f1115 100%), url(pattern-12.svg) center center'
  );
  const messagesBgColor = useColorModeValue('#f8f9fa', '#1a1d24');
  const loadingBg = useColorModeValue('white', 'gray.800');
  const loadingTextColor = useColorModeValue('gray.700', 'gray.300');

  return (
    <Box
      as="main"
      display="flex"
      flexDir="column"
      background={messagesBgGradient}
      backgroundSize="cover, contain"
      bgColor={messagesBgColor}
      w="100%"
      flex="1"
      minH="0"
      position="relative"
      role="log"
      aria-label="Chat messages"
      aria-live="polite"
      sx={{
        overflowY: 'auto',
        overflowX: 'hidden',
        position: 'relative',
      }}
    >
      {/* Typing Indicator Popup */}
      {typingUser && <TypingIndicator typingUser={typingUser} />}

      {/* Loading overlay when scrolling to center cursor */}
      {isScrollingToCenter && (
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg={useColorModeValue('rgba(255, 255, 255, 0.9)', 'rgba(26, 32, 44, 0.9)')}
          zIndex="100"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          gap={4}
          backdropFilter="blur(4px)"
        >
          <Spinner 
            size="lg" 
            color="brand.500" 
            thickness="3px" 
            speed="0.65s"
          />
          <Text fontSize="md" fontWeight="500" color={loadingTextColor}>
            Restoring position...
          </Text>
        </Box>
      )}

      {isLoading && messages.length > 0 && (
        <Box
          position="absolute"
          top="10px"
          left="50%"
          transform="translateX(-50%)"
          zIndex="10"
          bg={loadingBg}
          px={4}
          py={2}
          borderRadius="full"
          boxShadow="lg"
          display="flex"
          alignItems="center"
          gap={2}
        >
          <Spinner size="sm" color="brand.500" thickness="2px" speed="0.65s" />
          <Text fontSize="sm" fontWeight="500" color={loadingTextColor}>
            Loading more...
          </Text>
        </Box>
      )}
      
      {isLoading ? (
        <MessageSkeleton count={8} />
      ) : (
        <ScrollableChat
          messages={messages}
          containerRef={containerRef}
          loadMoreTriggerRef={loadMoreTriggerRef}
          loadNewerTriggerRef={loadNewerTriggerRef}
          isLoadingMore={isFetchingNextPage}
          isEndOfMessages={!hasNextPage}
          firstUnreadMessageId={firstUnreadMessageId}
          lastReadMessageRef={lastReadMessageRef}
        />
      )}

      {/* Floating Scroll to Bottom Button */}
      {showScrollButton && (
        <IconButton
          aria-label="Scroll to bottom"
          icon={<ArrowDownIcon />}
          position="absolute"
          bottom={{ base: '20px', md: '24px' }}
          right={{ base: '16px', md: '24px' }}
          zIndex={1000}
          size="md"
          borderRadius="full"
          bg="brand.500"
          color="white"
          boxShadow="0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)"
          _hover={{
            bg: 'brand.600',
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2), 0 4px 8px rgba(0, 0, 0, 0.15)',
          }}
          _active={{
            transform: 'translateY(0)',
            bg: 'brand.700',
          }}
          onClick={() => scrollToBottom(true)}
          transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
          animation="fadeIn 0.2s ease-out"
          sx={{
            '@keyframes fadeIn': {
              from: {
                opacity: 0,
                transform: 'scale(0.8) translateY(10px)',
              },
              to: {
                opacity: 1,
                transform: 'scale(1) translateY(0)',
              },
            },
          }}
        />
      )}
    </Box>
  );
}

