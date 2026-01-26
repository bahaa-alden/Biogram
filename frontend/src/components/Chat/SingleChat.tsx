import { Box, useToast } from '@chakra-ui/react';
import React, { Fragment, useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import io from 'socket.io-client';
import { useParams } from 'react-router-dom';
import { ENDPOINT } from '../../constants/endpoint';
import { chatState } from '../../Context/ChatProvider';
import { useMessagesCursor } from '../../hooks/queries/useMessagesCursor';
import { useMessageManagement } from '../../hooks/useMessageManagement';
import { useScrollManagement } from '../../hooks/useScrollManagement';
import { useTypingIndicator } from '../../hooks/useTypingIndicator';
import { useSocket } from '../../hooks/useSocket';
import { messageService } from '../../services/api/message.service';
import { Chat, Message } from '../../types/interfaces';
import { ChatHeader } from './ChatHeader';
import { EmptyState } from './EmptyState';
import { MessageInput } from './MessageInput';
import { MessagesContainer } from './MessagesContainer';
import { useChats } from '../../hooks/queries/useChats';

interface SingleChatProps {
  fetchAgain: boolean;
  setFetchAgain: (value: boolean) => void;
  color: string;
  bg: string;
  fetchNotificationsAgain: boolean;
  setFetchNotificationsAgain: (value: boolean) => void;
}

let socket: Socket;
let selectedChatCompare: Chat | undefined;

function SingleChat({
  fetchAgain,
  setFetchAgain,
  color,
  bg,
  fetchNotificationsAgain,
  setFetchNotificationsAgain,
}: SingleChatProps) {
  const { chatId: urlChatId } = useParams<{ chatId?: string }>();
  const { data: chats } = useChats();
  const { user, selectedChat, setSelectedChat } = chatState();
  
  // Get selectedChat from URL or context
  const selectedChatFromUrl = React.useMemo(() => {
    if (urlChatId && chats) {
      return chats.find((c) => c.id === urlChatId || c._id === urlChatId) || null;
    }
    return selectedChat;
  }, [urlChatId, chats, selectedChat]);
  
  const [newMessage, setNewMessage] = useState('');
  const toast = useToast();
  const { socket: socketInstance } = useSocket(user);
  const [isSending, setIsSending] = useState(false);
  const previousChatIdRef = useRef<string | undefined>(selectedChatFromUrl?.id || selectedChatFromUrl?._id);
  const isLoadingMoreRef = useRef(false);
  const lastMarkedAsReadRef = useRef<string | null>(null);
  const lastMarkedMessageIdRef = useRef<string | null>(null);

  // Get saved center message from backend (preferred) or localStorage (fallback)
  const [centerCursor, setCenterCursor] = React.useState<string | null>(null);
  const centerCursorRef = React.useRef<string | null>(null);
  const [isLoadingCenterCursor, setIsLoadingCenterCursor] = React.useState(false);
  
  React.useEffect(() => {
    const currentChatId = selectedChatFromUrl?.id || selectedChatFromUrl?._id;
    if (currentChatId) {
      setIsLoadingCenterCursor(true);
      
      // First try to get from backend (UserChatPreference)
      messageService.getReadState(currentChatId)
        .then((response) => {
          const centerMessageId = response.data.centerMessageId;
          if (centerMessageId) {
            setCenterCursor(centerMessageId);
            centerCursorRef.current = centerMessageId;
            // Also save to localStorage as backup
            const scrollPositionKey = `scrollPosition_${currentChatId}`;
            localStorage.setItem(scrollPositionKey, centerMessageId);
          } else {
            // Fallback to localStorage
            const scrollPositionKey = `scrollPosition_${currentChatId}`;
            const savedPosition = localStorage.getItem(scrollPositionKey);
            if (savedPosition) {
              setCenterCursor(savedPosition);
              centerCursorRef.current = savedPosition;
            } else {
              setCenterCursor(null);
              centerCursorRef.current = null;
            }
          }
          setIsLoadingCenterCursor(false);
        })
        .catch((error) => {
          console.error('Failed to get read state from backend:', error);
          // Fallback to localStorage
          const scrollPositionKey = `scrollPosition_${currentChatId}`;
          const savedPosition = localStorage.getItem(scrollPositionKey);
          if (savedPosition) {
            setCenterCursor(savedPosition);
            centerCursorRef.current = savedPosition;
          } else {
            setCenterCursor(null);
            centerCursorRef.current = null;
          }
          setIsLoadingCenterCursor(false);
        });
    } else {
      setCenterCursor(null);
      centerCursorRef.current = null;
      setIsLoadingCenterCursor(false);
    }
  }, [selectedChatFromUrl?.id, selectedChatFromUrl?._id]);

  // Use bidirectional cursor-based pagination
  const {
    data,
    fetchNextPage,
    fetchPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isFetchingNextPage,
    isFetchingPreviousPage,
    isLoading,
    refetch,
    unreadCount,
    firstUnreadMessageId,
  } = useMessagesCursor({
    chatId: selectedChatFromUrl?.id || selectedChatFromUrl?._id,
    enabled: !!(selectedChatFromUrl?.id || selectedChatFromUrl?._id),
    centerCursor: centerCursor || undefined,
  });

  // Flatten and sort messages from all pages chronologically (oldest first)
  // Optimized with early returns and efficient deduplication
  const messages = React.useMemo(() => {
    if (!data?.pages || data.pages.length === 0) return [];

    // Pre-allocate array with estimated size for better performance
    const estimatedSize = data.pages.reduce((acc, page) => {
      return acc + (page?.messages?.length || 0);
    }, 0);
    
    const allMessages: Message[] = [];
    const seenIds = new Set<string>();

    // Single pass: filter, deduplicate, and collect valid messages
    for (const page of data.pages) {
      if (!page || typeof page !== 'object' || !('messages' in page)) continue;
      if (!Array.isArray(page.messages)) continue;

      for (const msg of page.messages) {
        // Quick validation
        if (!msg || typeof msg !== 'object') continue;
        
        const msgId = msg.id || msg._id;
        if (!msgId || !msg.createdAt) continue;
        
        const idStr = msgId.toString();
        // Skip duplicates
        if (seenIds.has(idStr)) continue;
        
        seenIds.add(idStr);
        allMessages.push(msg);
      }
    }

    // Sort chronologically (oldest first) using createdAt, then _id for stable sorting
    // Use stable sort to preserve order for messages with same timestamp
    return allMessages.sort((a: Message, b: Message) => {
      // First sort by createdAt
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (dateA !== dateB) {
        return dateA - dateB;
      }
      // If createdAt is equal or missing, use _id for stable sorting
      const idA = (a.id || a._id)?.toString() || '';
      const idB = (b.id || b._id)?.toString() || '';
      return idA.localeCompare(idB);
    });
  }, [data?.pages]);

  // Typing indicator
  const typingUser = useTypingIndicator({
    socket: socketInstance,
    chatId: selectedChatFromUrl?.id || selectedChatFromUrl?._id,
    userId: user?.id,
    userName: user?.name,
    isTyping: newMessage.trim().length > 0,
  });

  // Message management
  const { sendMessage, markAsRead, markMessagesAsRead } = useMessageManagement({
    socket: socketInstance,
    selectedChat: selectedChatFromUrl || undefined,
    selectedChatCompare: selectedChatFromUrl || undefined,
    setFetchAgain,
    setFetchNotificationsAgain,
    scrollToBottom: () => {
      // Temporary scroll function, will be replaced by useScrollManagement
    },
  });

  // Callback to mark messages as read when user scrolls to bottom
  const handleMarkAsRead = React.useCallback(() => {
    const currentChatId = selectedChatFromUrl?.id || selectedChatFromUrl?._id;
    if (currentChatId && messages.length > 0) {
      // Get the last message ID to mark up to that point
      const lastMessage = messages[messages.length - 1];
      const lastMessageId = lastMessage?.id || lastMessage?._id;
      
      // Prevent duplicate calls for the same message
      if (lastMessageId && lastMarkedMessageIdRef.current !== lastMessageId) {
        lastMarkedMessageIdRef.current = lastMessageId;
        markMessagesAsRead(currentChatId, lastMessageId);
      }
    }
  }, [selectedChatFromUrl?.id, selectedChatFromUrl?._id, messages, markMessagesAsRead]);
  
  // Reset last marked message ID when chat changes
  React.useEffect(() => {
    lastMarkedMessageIdRef.current = null;
  }, [selectedChatFromUrl?.id, selectedChatFromUrl?._id]);

  // Scroll management - must be after handleMarkAsRead declaration
  const {
    containerRef,
    loadMoreTriggerRef,
    lastReadMessageRef,
    isScrollingToUnread,
    lastReadMessageId,
    showScrollButton,
    scrollToBottom,
  } = useScrollManagement({
    messages,
    selectedChatId: selectedChatFromUrl?.id || selectedChatFromUrl?._id,
    isLoading,
    isFetchingNextPage,
    firstUnreadMessageId: firstUnreadMessageId || null,
    onMarkAsRead: handleMarkAsRead,
    fetchNextPage,
    hasNextPage: hasNextPage ?? false,
  });

  // Track if we're scrolling to center cursor (for loading state)
  const [isScrollingToCenter, setIsScrollingToCenter] = React.useState(false);
  
  // Scroll to center cursor message when it loads (only once on initial load)
  const hasScrolledToCenterRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!centerCursor || !containerRef.current || isLoading || messages.length === 0) {
      setIsScrollingToCenter(false);
      return;
    }
    if (hasScrolledToCenterRef.current === centerCursor) {
      setIsScrollingToCenter(false);
      return; // Already scrolled to this center
    }
    
    // Check if center message is in the loaded messages
    const centerMessage = messages.find((msg: Message) => {
      const msgId = msg.id || msg._id;
      return msgId && msgId.toString() === centerCursor;
    });

    if (centerMessage) {
      hasScrolledToCenterRef.current = centerCursor;
      setIsScrollingToCenter(true); // Show loading while scrolling
      
      // Wait for DOM to render - use longer delay to ensure messages are rendered
      setTimeout(() => {
        if (!containerRef.current) {
          setIsScrollingToCenter(false);
          return;
        }
        
        const messageId = centerMessage.id || centerMessage._id;
        const element = containerRef.current.querySelector(
          `[data-message-id="${messageId}"]`
        ) as HTMLElement;
        
        if (element) {
          const elementTop = element.offsetTop;
          const container = containerRef.current;
          container.scrollTop = elementTop - 100; // Offset for better visibility
          
          // Wait for scroll to complete, then hide loading
          setTimeout(() => {
            setIsScrollingToCenter(false);
          }, 500); // Give time for smooth scroll animation
        } else {
          setIsScrollingToCenter(false);
        }
      }, 300);
    } else {
      setIsScrollingToCenter(false);
    }
  }, [centerCursor, messages.length, isLoading, containerRef]);

  // Reset scroll flag when chat changes
  React.useEffect(() => {
    hasScrolledToCenterRef.current = null;
  }, [selectedChatFromUrl?.id, selectedChatFromUrl?._id]);

  // Reset when chat changes - don't refetch, let the query handle initial load
  useEffect(() => {
    const currentChatId = selectedChatFromUrl?.id || selectedChatFromUrl?._id;
    if (currentChatId) {
      const chatChanged = currentChatId !== previousChatIdRef.current;
      if (chatChanged) {
        previousChatIdRef.current = currentChatId;
        // Don't refetch - the query will handle initial load with centerCursor if available
      }
    }
  }, [selectedChatFromUrl?.id, selectedChatFromUrl?._id]);

  // Initialize socket connection
  useEffect(() => {
    if (!user?.id) return;

    if (!socket) {
      socket = io(ENDPOINT, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        withCredentials: true,
      });
    }

    if (socket) {
      socket.emit('setup', { id: user.id });
    }
  }, [user?.id]);

  // Handle chat selection changes
  useEffect(() => {
    const currentChatId = selectedChatFromUrl?.id || selectedChatFromUrl?._id;
    if (!currentChatId || !user?.id) return;
    
    selectedChatCompare = selectedChatFromUrl || undefined;
    setNewMessage('');
    
    // Only mark as read if this is a different chat or we haven't marked it yet
    if (currentChatId && lastMarkedAsReadRef.current !== currentChatId) {
      lastMarkedAsReadRef.current = currentChatId;
      markAsRead(currentChatId, setFetchNotificationsAgain);
    }

    if (socketInstance?.connected && currentChatId) {
      socketInstance.emit('join chat', currentChatId);
    }
  }, [selectedChatFromUrl?.id, selectedChatFromUrl?._id, user?.id, socketInstance, markAsRead, setFetchNotificationsAgain]);

  // Load newer messages when scrolling down (fetchPreviousPage = after direction)
  const loadNewerTriggerRef = React.useRef<HTMLDivElement>(null);
  const isLoadingNewerRef = React.useRef(false);
  
  useEffect(() => {
    const currentChatId = selectedChatFromUrl?.id || selectedChatFromUrl?._id;
    if (!containerRef.current || !loadNewerTriggerRef.current || !currentChatId || messages.length === 0) return;
    // Only set up observer if there might be more pages and we're not already fetching
    if (isFetchingPreviousPage) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const observer = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0];
        
        if (entry.isIntersecting && !isLoadingNewerRef.current && !isScrollingToUnread.current) {
          // Check again if we have more pages before fetching
          if (!hasPreviousPage) {
            observer.disconnect();
            return;
          }
          
          if (debounceTimer) {
            clearTimeout(debounceTimer);
          }
          
          debounceTimer = setTimeout(async () => {
            if (isLoadingNewerRef.current || isFetchingPreviousPage) return;
            
            isLoadingNewerRef.current = true;
            
            try {
              // Use fetchPreviousPage to load newer messages (after direction)
              // React Query will use getPreviousPageParam which uses the newest message cursor
              await fetchPreviousPage();
            } catch (error) {
              console.error('Error loading newer messages:', error);
            } finally {
              isLoadingNewerRef.current = false;
            }
          }, 150);
        }
      },
      {
        root: containerRef.current,
        rootMargin: '0px 0px 300px 0px', // Trigger 300px before bottom for better detection
        threshold: 0.1, // Trigger when 10% visible
      }
    );

    observer.observe(loadNewerTriggerRef.current);

    return () => {
      observer.disconnect();
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [selectedChatFromUrl?.id, selectedChatFromUrl?._id, messages.length, fetchPreviousPage, hasPreviousPage, isFetchingPreviousPage, containerRef, isScrollingToUnread]);

  // Load older messages when scrolling up (fetchNextPage = before direction)
  useEffect(() => {
    const currentChatId = selectedChatFromUrl?.id || selectedChatFromUrl?._id;
    if (!containerRef.current || !loadMoreTriggerRef.current || !currentChatId || messages.length === 0) return;
    if (!hasNextPage || isFetchingNextPage) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const observer = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0];
        
        if (entry.isIntersecting && !isLoadingMoreRef.current && !isScrollingToUnread.current) {
          if (debounceTimer) {
            clearTimeout(debounceTimer);
          }
          
          debounceTimer = setTimeout(async () => {
            isLoadingMoreRef.current = true;
            
            if (!containerRef.current) {
              isLoadingMoreRef.current = false;
              return;
            }

            const scrollHeightBefore = containerRef.current.scrollHeight;
            const scrollTopBefore = containerRef.current.scrollTop;
            
            const containerRect = containerRef.current.getBoundingClientRect();
            const centerY = containerRect.top + containerRect.height / 2;
            
            let anchorElement: HTMLElement | null = null;
            let minDistance = Infinity;
            
            const messageElements = Array.from(containerRef.current.querySelectorAll('[data-message-id]')) as HTMLElement[];
            messageElements.forEach((el: HTMLElement) => {
              const rect = el.getBoundingClientRect();
              const elementCenterY = rect.top + rect.height / 2;
              const distance = Math.abs(elementCenterY - centerY);
              
              if (distance < minDistance && rect.top < containerRect.bottom && rect.bottom > containerRect.top) {
                minDistance = distance;
                anchorElement = el;
              }
            });
            
            const anchorId: string | null = anchorElement !== null ? (anchorElement as HTMLElement).getAttribute('data-message-id') : null;
            const anchorTopBefore: number = anchorElement !== null ? (anchorElement as HTMLElement).offsetTop : 0;
            
            try {
              await fetchNextPage();
              
              await new Promise(resolve => setTimeout(resolve, 0));
              
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  if (!containerRef.current || !anchorId) {
                    isLoadingMoreRef.current = false;
                    return;
                  }
                  
                  const anchorElementAfter = containerRef.current.querySelector(
                    `[data-message-id="${anchorId}"]`
                  ) as HTMLElement;
                  
                  if (anchorElementAfter) {
                    const anchorTopAfter = anchorElementAfter.offsetTop;
                    const heightDifference = anchorTopAfter - anchorTopBefore;
                    containerRef.current.scrollTop = scrollTopBefore + heightDifference;
                  } else {
                    const scrollHeightAfter = containerRef.current.scrollHeight;
                    const heightDifference = scrollHeightAfter - scrollHeightBefore;
                    containerRef.current.scrollTop = scrollTopBefore + heightDifference;
                  }
                  
                  setTimeout(() => {
                    isLoadingMoreRef.current = false;
                  }, 100);
                });
              });
            } catch (error) {
              isLoadingMoreRef.current = false;
            }
          }, 100);
        }
      },
      {
        root: containerRef.current,
        rootMargin: '150px 0px 0px 0px',
        threshold: 0,
      }
    );

    observer.observe(loadMoreTriggerRef.current);

    return () => {
      observer.disconnect();
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [selectedChatFromUrl?.id, selectedChatFromUrl?._id, messages.length, fetchNextPage, hasNextPage, isFetchingNextPage, containerRef, loadMoreTriggerRef, isScrollingToUnread]);

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const currentChatId = selectedChatFromUrl?.id || selectedChatFromUrl?._id;
    
    if (isSending || !newMessage.trim() || !currentChatId) {
      if (!newMessage.trim()) {
        toast({
          title: 'Please write a message!',
          status: 'warning',
          duration: 2000,
          isClosable: true,
          position: 'bottom',
        });
      }
      return;
    }

    await sendMessage(newMessage.trim(), setIsSending, setNewMessage, toast);
    
    // Mark messages as read when user sends a message
    if (currentChatId) {
      markMessagesAsRead(currentChatId);
    }
  };

  const refetchMessages = () => {
    refetch();
  };

  return (
    <Fragment>
      {selectedChatFromUrl?.users?.length ? (
        <Box 
          display="flex" 
          flexDirection="column" 
          height="100%" 
          width="100%"
          minH="0"
          position="relative"
        >
          {selectedChatFromUrl && (
            <ChatHeader
              selectedChat={selectedChatFromUrl}
              user={user}
              color={color}
              typingUser={typingUser}
              socket={socketInstance}
              fetchAgain={fetchAgain}
              setFetchAgain={setFetchAgain}
              refetchMessages={refetchMessages}
              setSelectedChat={setSelectedChat}
              unreadCount={unreadCount}
            />
          )}
          
          <MessagesContainer
            messages={messages}
            isLoading={isLoading}
            isFetchingNextPage={isFetchingNextPage}
            isScrollingToCenter={isScrollingToCenter}
            containerRef={containerRef}
            loadMoreTriggerRef={loadMoreTriggerRef}
            loadNewerTriggerRef={loadNewerTriggerRef}
            firstUnreadMessageId={firstUnreadMessageId || null}
            lastReadMessageRef={lastReadMessageRef}
            hasNextPage={hasNextPage ?? false}
            typingUser={typingUser}
            showScrollButton={showScrollButton}
            scrollToBottom={scrollToBottom}
          />
          
          <MessageInput
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            isSending={isSending}
            onSend={handleSendMessage}
          />
        </Box>
      ) : (
        <EmptyState color={color} />
      )}
    </Fragment>
  );
}

export default SingleChat;

