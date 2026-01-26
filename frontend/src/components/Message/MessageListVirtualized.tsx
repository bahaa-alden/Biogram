import type { RefObject } from 'react';
import { Box, Divider, Spinner, Text, useColorModeValue } from '@chakra-ui/react';
import moment from 'moment';
import { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import { VariableSizeList as List } from 'react-window';
import { Message } from '../../types/interfaces';
import logger from '../../utils/logger';
import MessageItem from './MessageItem';

interface MessageListProps {
  messages: Message[];
  containerRef: RefObject<HTMLDivElement>;
  loadMoreTriggerRef?: RefObject<HTMLDivElement>;
  loadNewerTriggerRef?: RefObject<HTMLDivElement>;
  isLoadingMore?: boolean;
  isEndOfMessages?: boolean;
  firstUnreadMessageId?: string | null;
  lastReadMessageRef?: RefObject<HTMLDivElement>;
  centerMessageId?: string | null;
  onScrollToCenter?: () => void;
}

interface ListItem {
  type: 'date' | 'message' | 'unread-divider' | 'loading' | 'trigger';
  data?: Message | string | null;
  messageIndex?: number;
  date?: string;
}

function MessageList({
  messages,
  containerRef,
  loadMoreTriggerRef,
  loadNewerTriggerRef,
  isLoadingMore,
  isEndOfMessages,
  firstUnreadMessageId,
  lastReadMessageRef,
  centerMessageId,
  onScrollToCenter,
}: MessageListProps) {
  const dateBg = useColorModeValue('rgba(0, 0, 0, 0.6)', 'rgba(255, 255, 255, 0.15)');
  const dateColor = useColorModeValue('white', 'white');
  const spinnerColor = useColorModeValue('brand.500', 'brand.300');
  const loadingBg = useColorModeValue('white', 'gray.800');
  const loadingBorder = useColorModeValue('gray.200', 'gray.600');
  const dividerColor = useColorModeValue('blue.400', 'blue.300');
  const newMessagesTextColor = useColorModeValue('blue.500', 'blue.300');
  const newMessagesBg = useColorModeValue('blue.50', 'blue.900');

  const listRef = useRef<List>(null);
  const itemHeightsRef = useRef<Map<number, number>>(new Map());
  const hasScrolledToCenterRef = useRef(false);
  const [listHeight, setListHeight] = useState(600);

  // Flatten messages into list items (date headers + messages)
  const listItems = useMemo(() => {
    const items: ListItem[] = [];
    const groupedMessages = messages.reduce((groups: any, message: Message, index: number) => {
      if (!message || typeof message !== 'object' || !message.createdAt || (!message.id && !message._id)) {
        return groups;
      }
      try {
        const date = moment(message.createdAt).format('YYYY-MM-DD');
        if (!date || date === 'Invalid date') {
          return groups;
        }
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(message);
      } catch (error) {
        return groups;
      }
      return groups;
    }, {});

    const sortedDates = Object.keys(groupedMessages).sort((a, b) => 
      new Date(a).getTime() - new Date(b).getTime()
    );

    sortedDates.forEach((date) => {
      const dateMessages = groupedMessages[date];
      if (!Array.isArray(dateMessages) || dateMessages.length === 0) return;

      // Add date header
      items.push({ type: 'date', date });

      // Add messages for this date
      const sortedMessages = dateMessages
        .filter((msg: Message) => msg && (msg.id || msg._id) && msg.createdAt)
        .sort((a: Message, b: Message) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          if (dateA !== dateB) return dateA - dateB;
          const idA = a.id || a._id;
          const idB = b.id || b._id;
          return idA?.toString().localeCompare(idB?.toString() || '') || 0;
        });

      sortedMessages.forEach((message: Message, index: number) => {
        const messageId = message.id || message._id;
        const isFirstUnread = firstUnreadMessageId && messageId === firstUnreadMessageId;
        
        items.push({
          type: 'message',
          data: message,
          messageIndex: index,
        });

        // Add unread divider after the first unread message
        if (isFirstUnread) {
          items.push({ type: 'unread-divider' });
        }
      });
    });

    // Add loading indicator at top if loading
    if (isLoadingMore) {
      items.unshift({ type: 'loading' });
    }

    // Add trigger at bottom for loading newer messages
    if (!isEndOfMessages && loadNewerTriggerRef) {
      items.push({ type: 'trigger' });
    }

    return items;
  }, [messages, firstUnreadMessageId, isLoadingMore, isEndOfMessages, loadNewerTriggerRef]);

  // Estimate item height (will be measured dynamically)
  const getItemSize = useCallback((index: number) => {
    const item = listItems[index];
    if (!item) return 60;

    // Return cached height if available
    const cached = itemHeightsRef.current.get(index);
    if (cached) return cached;

    // Estimate based on type
    if (item.type === 'date') return 60;
    if (item.type === 'loading') return 60;
    if (item.type === 'unread-divider') return 50;
    if (item.type === 'trigger') return 1;
    if (item.type === 'message') {
      const message = item.data as Message;
      if (!message) return 60;
      // Estimate based on content length (rough approximation)
      const contentLength = message.content?.length || 0;
      const lines = Math.ceil(contentLength / 50); // ~50 chars per line
      return Math.max(60, lines * 25 + 40); // Base height + line height
    }
    return 60;
  }, [listItems]);

  // Measure item height after render
  const setItemSize = useCallback((index: number, size: number) => {
    if (itemHeightsRef.current.get(index) !== size) {
      itemHeightsRef.current.set(index, size);
      listRef.current?.resetAfterIndex(index);
    }
  }, []);

  // Scroll to center message on initial load
  useEffect(() => {
    if (!centerMessageId || hasScrolledToCenterRef.current || listItems.length === 0) return;
    if (!listRef.current) return;

    const centerIndex = listItems.findIndex((item) => {
      if (item.type === 'message' && item.data) {
        const message = item.data as Message;
        const messageId = message.id || message._id;
        return messageId === centerMessageId;
      }
      return false;
    });

    if (centerIndex >= 0) {
      hasScrolledToCenterRef.current = true;
      // Scroll to center the message in viewport
      const itemHeight = getItemSize(centerIndex);
      const containerHeight = listHeight;
      const targetScroll = centerIndex * itemHeight - containerHeight / 2 + itemHeight / 2;
      
      listRef.current.scrollTo(targetScroll);
      if (onScrollToCenter) {
        onScrollToCenter();
      }
    }
  }, [centerMessageId, listItems, listHeight, getItemSize, onScrollToCenter]);

  // Update list height when container resizes
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateHeight = () => {
      if (containerRef.current) {
        setListHeight(containerRef.current.clientHeight);
      }
    };

    updateHeight();
    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [containerRef]);

  // Render individual list item
  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = listItems[index];
    if (!item) return null;

    const itemRef = useRef<HTMLDivElement>(null);

    // Measure height after render
    useEffect(() => {
      if (itemRef.current) {
        const height = itemRef.current.getBoundingClientRect().height;
        setItemSize(index, height);
      }
    }, [index, setItemSize]);

    if (item.type === 'date') {
      return (
        <Box style={style} display="flex" justifyContent="center" my={{ base: 4, md: 5 }}>
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
            {moment(item.date).format('MMMM DD')}
          </Text>
        </Box>
      );
    }

    if (item.type === 'loading') {
      return (
        <Box
          ref={loadMoreTriggerRef as any}
          style={style}
          display="flex"
          justifyContent="center"
          alignItems="center"
          py={2}
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
            <Spinner size="xs" color={spinnerColor} thickness="2px" speed="0.8s" />
            <Text fontSize="xs" fontWeight="500" color={spinnerColor}>
              Loading messages
            </Text>
          </Box>
        </Box>
      );
    }

    if (item.type === 'unread-divider') {
      return (
        <Box
          ref={lastReadMessageRef as any}
          style={style}
          my={3}
          display="flex"
          alignItems="center"
          gap={2}
        >
          <Divider borderColor={dividerColor} borderWidth="1.5px" flex="1" />
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
          <Divider borderColor={dividerColor} borderWidth="1.5px" flex="1" />
        </Box>
      );
    }

    if (item.type === 'trigger') {
      return (
        <Box
          ref={loadNewerTriggerRef as any}
          style={style}
          h="1px"
          w="100%"
        />
      );
    }

    if (item.type === 'message' && item.data) {
      const message = item.data as Message;
      const messageId = message.id || message._id;
      const sortedMessages = messages.filter((m: Message) => m && m.id && m.createdAt);

      return (
        <Box
          ref={itemRef}
          style={style}
          data-message-id={messageId}
          w="100%"
          px={{ base: 2, md: 3, lg: 4 }}
        >
          <MessageItem
            message={message}
            messages={sortedMessages}
            index={item.messageIndex || 0}
          />
        </Box>
      );
    }

    return null;
  }, [listItems, loadMoreTriggerRef, loadNewerTriggerRef, lastReadMessageRef, messages, dateBg, dateColor, spinnerColor, loadingBg, loadingBorder, dividerColor, newMessagesTextColor, newMessagesBg, setItemSize]);

  // Update containerRef to point to the list's outer element
  useEffect(() => {
    if (listRef.current && containerRef) {
      // The list's outer element is accessible via listRef.current
      // We'll attach it to containerRef if needed
      const listElement = (listRef.current as any)?._outerRef;
      if (listElement && containerRef) {
        (containerRef as any).current = listElement;
      }
    }
  }, [containerRef, listRef]);

  return (
    <Box
      width="100%"
      height="100%"
      flex="1"
      minH="0"
      ref={(el) => {
        if (el && containerRef) {
          (containerRef as any).current = el;
        }
      }}
      sx={{
        '& .react-window-list': {
          outline: 'none',
        },
      }}
    >
      {listHeight > 0 && (
        <List
          ref={listRef}
          height={listHeight}
          itemCount={listItems.length}
          itemSize={getItemSize}
          width="100%"
          overscanCount={5}
        >
          {Row}
        </List>
      )}
    </Box>
  );
}

export default MessageList;

