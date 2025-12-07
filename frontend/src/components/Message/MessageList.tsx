import { Box, Divider, Spinner, Text, useColorModeValue } from '@chakra-ui/react';
import moment from 'moment';
import { useEffect } from 'react';
import { Message } from '../../types/interfaces';
import MessageItem from './MessageItem';

function MessageList({
  messages,
  containerRef,
  loadMoreTriggerRef,
  isLoadingMore,
  isEndOfMessages,
  lastReadMessageId,
  lastReadMessageRef,
}: {
  messages: Message[];
  containerRef: any;
  loadMoreTriggerRef?: any;
  isLoadingMore?: boolean;
  isEndOfMessages?: boolean;
  lastReadMessageId?: string | null;
  lastReadMessageRef?: React.RefObject<HTMLDivElement>;
}) {
  // All hooks must be called unconditionally at the top
  const dateBg = useColorModeValue('rgba(0, 0, 0, 0.6)', 'rgba(255, 255, 255, 0.15)');
  const dateColor = useColorModeValue('white', 'white');
  const spinnerColor = useColorModeValue('brand.500', 'brand.300');
  const scrollbarBg = useColorModeValue('rgba(0,0,0,0.2)', 'rgba(255,255,255,0.2)');
  const scrollbarBgHover = useColorModeValue('rgba(0,0,0,0.3)', 'rgba(255,255,255,0.3)');
  const loadingBg = useColorModeValue('white', 'gray.800');
  const loadingBorder = useColorModeValue('gray.200', 'gray.600');
  const dividerColor = useColorModeValue('blue.400', 'blue.300');
  const newMessagesTextColor = useColorModeValue('blue.500', 'blue.300');
  const newMessagesBg = useColorModeValue('blue.50', 'blue.900');
  
  const groupedMessages = messages.reduce((groups: any, message: Message) => {
    const date = moment(message.createdAt).format('YYYY-MM-DD');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  // Handle wheel event with non-passive listener to control scroll speed
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Smooth controlled scrolling
      e.preventDefault();
      const delta = e.deltaY * 0.6; // Gentle scroll speed
      const currentScroll = container.scrollTop;
      container.scrollTo({
        top: currentScroll + delta,
        behavior: 'auto', // Instant for responsiveness
      });
    };

    // Add event listener with { passive: false } to allow preventDefault
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [containerRef]);
  
  return (
    <Box
      ref={containerRef}
      display="flex"
      flexDir="column"
      overflowY="auto"
      overflowX="hidden"
      width="100%"
      height="100%"
      flex="1"
      minH="0"
      px={{ base: 2, md: 3, lg: 4 }}
      py={{ base: 3, md: 4 }}
      sx={{
        overflowAnchor: 'none', // Disable native anchoring, we handle it manually
        willChange: 'scroll-position', // Only optimize scroll, not contents to prevent crashes
        transform: 'translateZ(0)', // Force hardware acceleration
        scrollBehavior: 'auto', // Instant scroll for manual adjustments
        backfaceVisibility: 'hidden', // Prevent rendering glitches
        // Smooth native scrolling for user interactions
        '@supports (scroll-behavior: smooth)': {
          scrollPaddingTop: '20px',
          scrollPaddingBottom: '20px',
        },
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: scrollbarBg,
          borderRadius: 'full',
          transition: 'background 0.2s',
          '&:hover': {
            background: scrollbarBgHover,
          },
        },
      }}
    >
      {/* Invisible trigger for pagination - placed at top */}
      {!isEndOfMessages && (
        <Box 
          ref={loadMoreTriggerRef} 
          height="1px"
          width="100%"
          flexShrink={0}
          sx={{
            overflowAnchor: 'none', // Don't use this element as anchor
            pointerEvents: 'none', // Don't interfere with interactions
          }}
        />
      )}
      
      {/* Subtle loading indicator - only shows during fetch */}
      {isLoadingMore && (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          py={2}
          position="sticky"
          top={2}
          zIndex={10}
          opacity={0.8}
          animation="fadeIn 0.3s ease-in"
          sx={{
            '@keyframes fadeIn': {
              from: { opacity: 0, transform: 'translateY(-10px)' },
              to: { opacity: 0.8, transform: 'translateY(0)' },
            },
          }}
        >
          <Box
            display="flex"
            alignItems="center"
            gap={2}
            bg={loadingBg}
            px={4}
            py={1.5}
            borderRadius="full"
            boxShadow="sm"
            border="1px solid"
            borderColor={loadingBorder}
          >
            <Spinner 
              size="xs" 
              color={spinnerColor}
              thickness="2px"
              speed="0.8s"
            />
            <Text fontSize="xs" fontWeight="500" color={spinnerColor}>
              Loading messages
            </Text>
          </Box>
        </Box>
      )}
      
      {Object.entries(groupedMessages).map(([date, messages]: any) => (
        <Box 
          key={date} 
          mb={{ base: 3, md: 4 }}
          w="100%"
          overflow="visible"
        >
          <Box 
            display="flex" 
            justifyContent="center" 
            width="100%" 
            my={{ base: 4, md: 5 }}
            position="relative"
            zIndex={1}
          >
            <Text
              py={{ base: 1, md: 1.5 }}
              px={{ base: 3, md: 4 }}
              borderRadius="full"
              fontWeight="600"
              fontSize={{ base: '12px', md: '13px' }}
              bg={dateBg}
              color={dateColor}
              boxShadow="sm"
              backdropFilter="blur(10px)"
            >
              {moment(date).format('MMMM DD')}
            </Text>
          </Box>
          <Box 
            display="flex" 
            flexDir="column" 
            gap={0}
            w="100%"
            overflow="visible"
          >
            {(() => {
              const sortedMessages = messages
                .filter(
                  (value: Message, index: number, self: Message[]) =>
                    index === self.findIndex((t) => t.id === value.id)
                )
                .sort((a: any, b: any) => (a.createdAt < b.createdAt ? -1 : 1));
              
              const lastReadIndex = sortedMessages.findIndex(m => m.id === lastReadMessageId);
              const hasUnreadMessages = lastReadIndex >= 0 && lastReadIndex < sortedMessages.length - 1;
              
              return sortedMessages.map((message: Message, index: number) => {
                const isLastRead = message.id === lastReadMessageId && hasUnreadMessages;
                return (
                  <Box 
                    key={message.id || `msg-${index}`} 
                    data-message-id={message.id}
                    w="100%"
                    minH="auto"
                    overflow="visible"
                    sx={{ 
                      contain: 'layout style', // Less aggressive containment to prevent cutoffs
                      willChange: isLastRead ? 'transform' : 'auto',
                      backfaceVisibility: 'hidden',
                    }}
                  >
                    <MessageItem
                      message={message}
                      messages={sortedMessages}
                      index={index}
                    />
                    {isLastRead && (
                      <Box
                        ref={lastReadMessageRef}
                        position="relative"
                        my={3}
                        display="flex"
                        alignItems="center"
                        gap={2}
                        animation="slideIn 0.4s ease-out"
                        w="100%"
                        overflow="visible"
                        sx={{
                          '@keyframes slideIn': {
                            from: { 
                              opacity: 0, 
                              transform: 'scaleX(0.8)',
                            },
                            to: { 
                              opacity: 1, 
                              transform: 'scaleX(1)',
                            },
                          },
                        }}
                      >
                        <Divider 
                          borderColor={dividerColor} 
                          borderWidth="1.5px"
                          flex="1"
                        />
                        <Text
                          fontSize="xs"
                          fontWeight="600"
                          color={newMessagesTextColor}
                          px={2}
                          py={0.5}
                          bg={newMessagesBg}
                          borderRadius="md"
                          whiteSpace="nowrap"
                          flexShrink={0}
                        >
                          New Messages
                        </Text>
                        <Divider 
                          borderColor={dividerColor} 
                          borderWidth="1.5px"
                          flex="1"
                        />
                      </Box>
                    )}
                  </Box>
                );
              });
            })()}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
//
export default MessageList;
//
