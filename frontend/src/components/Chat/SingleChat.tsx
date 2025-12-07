import { ArrowBackIcon, ArrowDownIcon, ArrowForwardIcon } from '@chakra-ui/icons';
import {
  Box,
  FormControl,
  IconButton,
  Input,
  Spinner,
  Text,
  useColorModeValue,
  useToast
} from '@chakra-ui/react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { getSender, getSenderFull } from '../../config/chatLogics';
import { ENDPOINT } from '../../constants/endpoint';
import { chatState } from '../../Context/ChatProvider';
import { messageService } from '../../services/api/message.service';
import { notificationService } from '../../services/api/notification.service';
import { Chat, Message } from '../../types/interfaces';
import { MessageSkeleton } from '../Message/MessageSkeleton';
import ProfileModel from '../miscellaneous/ProfileModel';
import UpdateGroupChatModel from '../miscellaneous/UpdateGroupChatModel';
import ScrollableChat from './ScrollableChat';

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
  const [newMessage, setNewMessage] = useState('');
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user, selectedChat, setSelectedChat } = chatState();
  // Typing indicator state
  const [typingUser, setTypingUser] = useState<{ name: string; id: string } | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const emitTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const emitStopTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentChatIdRef = useRef<string | undefined>(selectedChat?.id);
  const currentUserIdRef = useRef<string | undefined>(user?.id);
  const socketListenersAttachedRef = useRef(false);
  const pageSize = 20; // Messages per page
  const [isSending, setIsSending] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [lastReadMessageId, setLastReadMessageId] = useState<string | null>(null);
  const [shouldScrollToUnread, setShouldScrollToUnread] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
  const lastReadMessageRef = useRef<HTMLDivElement>(null);
  const isScrollingToUnread = useRef(false);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  const isLoadingMoreRef = useRef(false);
  
  // All hooks must be called unconditionally at the top
  const bgChat = useColorModeValue('brand.50', 'gray.800');
  const headerBg = useColorModeValue('white', 'gray.800');
  const headerBorderColor = useColorModeValue('gray.200', 'gray.700');
  const backButtonHover = useColorModeValue('gray.100', 'gray.700');
  const avatarBorder = useColorModeValue('white', 'gray.800');
  const groupAvatarBg = useColorModeValue('brand.500', 'brand.600');
  const groupAvatarBorder = useColorModeValue('white', 'gray.800');
  const groupTextColor = useColorModeValue('gray.600', 'gray.400');
  const typingColor = useColorModeValue('brand.600', 'brand.400');
  const activeColor = useColorModeValue('green.600', 'green.400');
  const messagesBgGradient = useColorModeValue(
    'linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%), url(pattern-12.svg) center center',
    'linear-gradient(180deg, #1a1d24 0%, #0f1115 100%), url(pattern-12.svg) center center'
  );
  const messagesBgColor = useColorModeValue('#f8f9fa', '#1a1d24');
  const popupBg = useColorModeValue('white', 'gray.800');
  const popupBorderColor = useColorModeValue('brand.200', 'brand.700');
  const popupTextColor = useColorModeValue('gray.700', 'gray.200');
  const popupTextSecondary = useColorModeValue('gray.600', 'gray.400');
  const dotColor = useColorModeValue('brand.500', 'brand.400');
  const loadingBg = useColorModeValue('white', 'gray.800');
  const loadingTextColor = useColorModeValue('gray.700', 'gray.300');
  const inputBg = useColorModeValue('white', 'gray.800');
  const inputBorderTop = useColorModeValue('gray.200', 'gray.700');
  const inputFieldBg = useColorModeValue('gray.50', 'gray.700');
  const inputFieldColor = useColorModeValue('gray.900', 'white');
  const inputBorderColor = useColorModeValue('gray.200', 'gray.600');
  const inputBorderHover = useColorModeValue('gray.300', 'gray.500');
  const inputFocusBg = useColorModeValue('white', 'gray.600');
  const inputPlaceholderColor = useColorModeValue('gray.400', 'gray.500');
  const emptyStateBg = useColorModeValue(
    'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)'
  );
  const emptyStateCircle1 = useColorModeValue('brand.100', 'brand.900');
  const emptyStateCircle2 = useColorModeValue('purple.100', 'purple.900');
  const emptyStateTextColor = useColorModeValue('gray.600', 'gray.300');
  
  // Fetch function for infinite query
  const fetchMessagesPage = async ({ pageParam = 1 }) => {
    if (!selectedChat?.id) {
      throw new Error('No chat selected');
    }
    
    const response = await messageService.getMessages(selectedChat?.id!, { page: pageParam, limit: pageSize });
    const data = response.data.data;
    
    // Ensure data is an array and filter out invalid messages
    const validMessages = Array.isArray(data) 
      ? data.filter((msg: any) => {
          // Strict validation
          if (!msg || typeof msg !== 'object') return false;
          if (!msg.id && !msg._id) return false;
          if (!msg.createdAt) return false;
          return true;
        })
      : [];
    
    return {
      messages: validMessages,
      nextPage: validMessages.length === pageSize ? pageParam + 1 : undefined,
      currentPage: pageParam,
    };
  };

  // Use infinite query for pagination
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['messages', selectedChat?.id],
    queryFn: fetchMessagesPage,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!selectedChat?.id,
    staleTime: 0, // Always consider data stale - refetch on mount to get latest messages
    gcTime: 1000 * 60 * 30, // 30 minutes - keep in cache for 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Always refetch when opening a chat to get new messages
  });

  // Flatten all pages into single messages array and filter out invalid messages
  const messages = (data?.pages
    ?.flatMap((page: any) => {
      // Safely extract messages from page
      if (!page || typeof page !== 'object') return [];
      if (Array.isArray(page.messages)) return page.messages;
      if (Array.isArray(page)) return page; // In case page is directly an array
      return [];
    })
    .reverse() || [])
    .filter((msg: Message) => {
      // Strict validation: ensure message is an object with required properties
      if (!msg || typeof msg !== 'object') return false;
      if (!msg.id && !msg._id) return false;
      if (!msg.createdAt) return false;
      return true;
    });
  
  // Refetch function for components that need it
  const refetchMessages = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['messages', selectedChat?.id] });
  }, [queryClient, selectedChat?.id]);

  // Refetch messages when opening a chat to get new messages
  // This ensures we get any messages that arrived via socket while chat was closed
  const previousChatIdRef = useRef<string | undefined>(selectedChat?.id);
  useEffect(() => {
    // Refetch when chat ID changes (switching to a different chat)
    // Also refetch if chat is opened for the first time
    if (selectedChat?.id) {
      const chatChanged = selectedChat.id !== previousChatIdRef.current;
      if (chatChanged) {
        previousChatIdRef.current = selectedChat.id;
        // Always refetch to ensure we have the latest messages
        // This catches any messages that arrived via socket while chat was closed
        refetch();
      }
    }
  }, [selectedChat?.id, refetch]);

  // Initialize socket connection - only once per user
  useEffect(() => {
    if (!user?.id) return;

    // Create socket only if it doesn't exist
    if (!socket) {
      socket = io(ENDPOINT, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        withCredentials: true,
      });
      socketListenersAttachedRef.current = false;
    }

    // Attach listeners only once
    if (!socketListenersAttachedRef.current) {
      // Handle initial connection - only set up once
      socket.once('connected', () => {
        setSocketConnected(true);
        socket.emit('setup', { id: user.id });
      });

      // Handle reconnection - use ref to get latest chat
      const handleConnect = () => {
        setSocketConnected(true);
        socket.emit('setup', { id: user.id });
        // Join current chat if exists (use ref to get latest value)
        const currentChatId = currentChatIdRef.current;
        if (currentChatId) {
          socket.emit('join chat', currentChatId);
        }
      };

      socket.on('connect', handleConnect);
      socketListenersAttachedRef.current = true;
    }

    // Emit setup if socket exists
    if (socket) {
      socket.emit('setup', { id: user.id });
      setSocketConnected(socket.connected);
    }

    return () => {
      // Don't disconnect on unmount - keep connection alive
    };
  }, [user?.id]); // Only depend on user.id

  // Emit typing indicators when user types
  useEffect(() => {
    if (!socket?.connected || !selectedChat?.id || !user?.id) {
      return;
    }

    // Clear any existing timeouts
    if (emitTypingTimeoutRef.current) {
      clearTimeout(emitTypingTimeoutRef.current);
    }
    if (emitStopTypingTimeoutRef.current) {
      clearTimeout(emitStopTypingTimeoutRef.current);
    }

    if (newMessage.trim()) {
      // Emit typing after 500ms of typing
      emitTypingTimeoutRef.current = setTimeout(() => {
        if (socket?.connected && selectedChat?.id && user?.id) {
          socket.emit('isTyping', {
            chatId: selectedChat?.id!,
            userId: user.id,
            userName: user.name || 'User',
          });
        }
      }, 500);

      // Auto-stop typing after 3 seconds
      emitStopTypingTimeoutRef.current = setTimeout(() => {
        if (socket?.connected && selectedChat?.id && user?.id) {
          socket.emit('stop typing', {
            chatId: selectedChat?.id!,
            userId: user.id,
          });
        }
      }, 3000);
    } else {
      // Message cleared - stop typing immediately
      if (socket?.connected && selectedChat?.id && user?.id) {
        socket.emit('stop typing', {
          chatId: selectedChat?.id!,
          userId: user.id,
        });
      }
    }

    return () => {
      if (emitTypingTimeoutRef.current) {
        clearTimeout(emitTypingTimeoutRef.current);
      }
      if (emitStopTypingTimeoutRef.current) {
        clearTimeout(emitStopTypingTimeoutRef.current);
      }
    };
  }, [newMessage, socket, selectedChat?.id, user?.id, user?.name]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    }, 0);
  }, []);

  // Get last read message from localStorage
  useEffect(() => {
    if (selectedChat?.id) {
      const lastReadKey = `lastRead_${selectedChat?.id}`;
      const stored = localStorage.getItem(lastReadKey);
      if (stored) {
        setLastReadMessageId(stored);
        setShouldScrollToUnread(true);
      } else {
        setLastReadMessageId(null);
        setShouldScrollToUnread(false);
      }
    }
  }, [selectedChat?.id]);

  // Scroll to last read message or bottom
  useEffect(() => {
    if (messages.length === 0 || !containerRef.current || isLoading) return;

    // If we should scroll to unread and we have a last read message
    if (shouldScrollToUnread && lastReadMessageId && lastReadMessageRef.current && !isScrollingToUnread.current) {
      isScrollingToUnread.current = true;
      requestAnimationFrame(() => {
        if (lastReadMessageRef.current) {
          lastReadMessageRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          setTimeout(() => {
            isScrollingToUnread.current = false;
            setShouldScrollToUnread(false);
          }, 1000);
        }
      });
    } else if (!isFetchingNextPage && !shouldScrollToUnread && data?.pages.length === 1) {
      // Scroll to bottom on initial load (no unread marker)
      scrollToBottom();
    }
  }, [messages.length, isFetchingNextPage, data?.pages.length, shouldScrollToUnread, lastReadMessageId, isLoading, scrollToBottom]);

  // Track which messages have been viewed and update last read (debounced)
  useEffect(() => {
    if (!containerRef.current || messages.length === 0 || !selectedChat?.id) return;

    const lastReadKey = `lastRead_${selectedChat?.id}`;
    let updateTimeout: NodeJS.Timeout;
    let lastScrollTop = containerRef.current.scrollTop;
    let pendingUpdate: string | null = null;
    
    const updateLastRead = (messageId: string) => {
      // Only update if this message is later than current last read
      const currentLastReadIndex = messages.findIndex(m => m.id === lastReadMessageId);
      const newMessageIndex = messages.findIndex(m => m.id === messageId);
      
      if (newMessageIndex > currentLastReadIndex || currentLastReadIndex === -1) {
        pendingUpdate = messageId;
        clearTimeout(updateTimeout);
        
        // Debounce updates by 2 seconds
        updateTimeout = setTimeout(() => {
          if (pendingUpdate) {
            localStorage.setItem(lastReadKey, pendingUpdate);
            setLastReadMessageId(pendingUpdate);
            pendingUpdate = null;
          }
        }, 2000);
      }
    };

    const handleScroll = () => {
      if (!containerRef.current || isScrollingToUnread.current || isFetchingNextPage) return;
      
      const currentScrollTop = containerRef.current.scrollTop;
      const isScrollingDown = currentScrollTop > lastScrollTop;
      lastScrollTop = currentScrollTop;
      
      // Only update last read when scrolling down (reading messages)
      if (!isScrollingDown) return;
      
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
      
      // Find the last message that's fully visible
      const visibleMessages = messages.filter((message) => {
        const element = containerRef.current?.querySelector(`[data-message-id="${message.id}"]`);
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        const containerRect = containerRef.current!.getBoundingClientRect();
        
        return rect.bottom <= containerRect.bottom && rect.top >= containerRect.top;
      });
      
      if (visibleMessages.length > 0) {
        const lastVisibleMessage = visibleMessages[visibleMessages.length - 1];
        if (lastVisibleMessage?.id) {
          updateLastRead(lastVisibleMessage.id);
        }
      }
    };

    const container = containerRef.current;
    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(updateTimeout);
    };
  }, [messages, selectedChat?.id, lastReadMessageId, isScrollingToUnread, isFetchingNextPage]);

  // Show/hide scroll to bottom button based on scroll position
  useEffect(() => {
    if (!containerRef.current || messages.length === 0) return;

    const container = containerRef.current;
    
    const checkScrollPosition = () => {
      if (!container) return;
      
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100; // 100px threshold
      setShowScrollButton(!isNearBottom);
    };

    // Check initial position
    checkScrollPosition();

    // Check on scroll
    container.addEventListener('scroll', checkScrollPosition, { passive: true });
    
    // Check when messages change or container resizes
    const resizeObserver = new ResizeObserver(() => {
      setTimeout(checkScrollPosition, 100);
    });
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', checkScrollPosition);
      resizeObserver.disconnect();
    };
  }, [messages.length]);

  // Ultra-smooth seamless pagination like Telegram/WhatsApp
  useEffect(() => {
    if (!containerRef.current || !loadMoreTriggerRef.current || !selectedChat?.id || messages.length === 0) return;
    if (!hasNextPage || isFetchingNextPage) return;

    let debounceTimer: NodeJS.Timeout | null = null;

    // Use IntersectionObserver for more precise trigger
    const observer = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0];
        
        // Debounce to prevent rapid triggers during fast scrolling
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

          // Capture current scroll metrics BEFORE fetching
          const scrollHeightBefore = containerRef.current.scrollHeight;
          const scrollTopBefore = containerRef.current.scrollTop;
          
          // Find a stable anchor message in the middle of viewport
          const containerRect = containerRef.current.getBoundingClientRect();
          const centerY = containerRect.top + containerRect.height / 2;
          
          let anchorElement: HTMLElement | null = null;
          let minDistance = Infinity;
          
          // Find message closest to center of viewport for most stable anchoring
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
            // Fetch new messages
            await fetchNextPage();
            
            // Wait for React to render
            await new Promise(resolve => setTimeout(resolve, 0));
            
            // Use requestAnimationFrame to ensure DOM has updated
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                if (!containerRef.current || !anchorId) {
                  isLoadingMoreRef.current = false;
                  return;
                }
                
                // Find the anchor element after new content loaded
                const anchorElementAfter = containerRef.current.querySelector(
                  `[data-message-id="${anchorId}"]`
                ) as HTMLElement;
                
                if (anchorElementAfter) {
                  // Calculate how much the anchor moved
                  const anchorTopAfter = anchorElementAfter.offsetTop;
                  const heightDifference = anchorTopAfter - anchorTopBefore;
                  
                  // Instantly adjust scroll to compensate for new content
                  // This makes it feel like nothing changed visually
                  containerRef.current.scrollTop = scrollTopBefore + heightDifference;
                } else {
                  // Fallback: adjust by the difference in scroll height
                  const scrollHeightAfter = containerRef.current.scrollHeight;
                  const heightDifference = scrollHeightAfter - scrollHeightBefore;
                  containerRef.current.scrollTop = scrollTopBefore + heightDifference;
                }
                
                // Small delay before allowing next fetch
                setTimeout(() => {
                  isLoadingMoreRef.current = false;
                }, 100);
              });
            });
          } catch (error) {
            console.error('Error loading more messages:', error);
            isLoadingMoreRef.current = false;
          }
          }, 100); // 100ms debounce for smooth triggering
        }
      },
      {
        root: containerRef.current,
        // Trigger slightly before reaching the top for seamless loading
        rootMargin: '150px 0px 0px 0px', // Increased for earlier preloading
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
  }, [selectedChat?.id, messages.length, fetchNextPage, hasNextPage, isFetchingNextPage]);


  const markAsRead = useCallback(async (id: string | undefined) => {
    if (!id) return;
    try {
      await notificationService.markNotificationRead(id);
      setFetchNotificationsAgain(!fetchNotificationsAgain);
    } catch (error) {
      // Failed to mark notifications as read
    }
  }, [setFetchNotificationsAgain]);

  // Handle chat selection changes
  useEffect(() => {
    if (!selectedChat?.id || !user?.id) {
      return;
    }
    
    // Update refs with latest values
    currentChatIdRef.current = selectedChat?.id;
    currentUserIdRef.current = user?.id;
    
    setNewMessage('');
    setTypingUser(null);
    selectedChatCompare = selectedChat;
    
    if (selectedChat?.id) {
      markAsRead(selectedChat.id);
    }

    // Join the chat room
    if (socket?.connected && selectedChat?.id) {
      socket.emit('join chat', selectedChat.id);
    }

    // Listen for typing events - use refs to get latest values
    const handleTyping = ({ chatId, userId, userName }: { chatId: string; userId: string; userName: string }) => {
      const currentChatId = currentChatIdRef.current;
      const currentUserId = currentUserIdRef.current;
      
      // Only show typing for current chat and not for self
      if (chatId === currentChatId && userId !== currentUserId) {
        // Clear existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        // Set typing user - use the userName from the event (the person who is typing)
        const firstName = userName?.split(' ')[0] || userName || 'Someone';
        setTypingUser({ name: firstName, id: userId });
        
        // Auto-hide after 3 seconds of no typing
        typingTimeoutRef.current = setTimeout(() => {
          setTypingUser(null);
        }, 3000);
      }
    };
    
    const handleStopTyping = ({ chatId, userId }: { chatId: string; userId: string }) => {
      const currentChatId = currentChatIdRef.current;
      const currentUserId = currentUserIdRef.current;
      
      // Only handle stop typing for current chat and not for self
      if (chatId === currentChatId && userId !== currentUserId) {
        // Clear timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        // Hide typing indicator after a short delay
        typingTimeoutRef.current = setTimeout(() => {
          setTypingUser(null);
        }, 1000);
      }
    };
    
    if (socket) {
      socket.off('isTyping', handleTyping);
      socket.off('stop typing', handleStopTyping);
      socket.on('isTyping', handleTyping);
      socket.on('stop typing', handleStopTyping);
    }
    
    return () => {
      if (socket) {
        socket.off('isTyping', handleTyping);
        socket.off('stop typing', handleStopTyping);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      setTypingUser(null);
    };
  }, [selectedChat?.id, user?.id, socket]);


  const sendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (isSending || !newMessage.trim() || !selectedChat?.id) {
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

    const messageContent = newMessage.trim();
    setIsSending(true);
    
    try {
      if (!selectedChat?.id) return;
      
      const response = await messageService.sendMessage(selectedChat.id, { content: messageContent });
      const data = response.data.data;
      
      // Ensure socket is connected and joined to chat room
      if (socket && socket.connected && selectedChat?.id) {
        socket.emit('join chat', selectedChat.id);
        socket.emit('new message', data);
      }
      
      setNewMessage('');
      
      // Add new message to the query cache
      if (selectedChat?.id) {
        queryClient.setQueryData(['messages', selectedChat.id], (old: any) => {
          if (!old) return old;
          const lastPage = old.pages[old.pages.length - 1];
          return {
            ...old,
            pages: [
              ...old.pages.slice(0, -1),
              {
                ...lastPage,
                messages: [...lastPage.messages, data],
              },
            ],
          };
        });
      }
      
      scrollToBottom();
      // Only trigger fetchAgain to update chat list, not selectedChat
      setFetchAgain(!fetchAgain);
    } catch (err: any) {
      toast({
        title: 'Error occurred',
        description: err?.response?.data?.message || 'Failed to send the message',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'bottom',
      });
    }
    setIsSending(false);
    scrollToBottom();
    
    // Stop typing indicator after sending
    if (socket?.connected && selectedChat?.id && user?.id) {
      socket.emit('stop typing', {
        chatId: selectedChat?.id!,
        userId: user.id,
      });
    }
  };

  // Listen for socket events (messages, group updates)
  useEffect(() => {
    if (!socket || !selectedChat?.id) return;

    const messageListener = (newMessageReceived: Message) => {
      if (!selectedChatCompare?.id || selectedChatCompare.id !== newMessageReceived.chat?.id) {
        setFetchAgain(!fetchAgain);
        setFetchNotificationsAgain(!fetchNotificationsAgain);
      } else {
        // Add received message to the query cache (prevent duplicates)
        queryClient.setQueryData(['messages', selectedChat?.id!], (old: any) => {
          if (!old) return old;
          const lastPage = old.pages[old.pages.length - 1];
          
          // Check if message already exists to prevent duplicates
          const messageExists = lastPage.messages.some(
            (msg: Message) => msg.id === newMessageReceived.id || 
            (msg._id === newMessageReceived._id && newMessageReceived._id)
          );
          
          if (messageExists) {
            return old; // Don't update if message already exists
          }
          
          return {
            ...old,
            pages: [
              ...old.pages.slice(0, -1),
              {
                ...lastPage,
                messages: [...lastPage.messages, newMessageReceived],
              },
            ],
          };
        });
        
        // Smooth scroll to bottom after a brief delay to allow DOM update
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            scrollToBottom();
          });
        });
        
        // Only update fetchAgain if needed (don't trigger unnecessary re-renders)
        // setFetchAgain(!fetchAgain); // Commented out to prevent layout crashes
      }
    };
    
    const groupRenameListener = () => {
      setFetchAgain(!fetchAgain);
    };
    
    const groupRemoveListener = () => {
      setFetchAgain(!fetchAgain);
    };
    
    const groupAddListener = () => {
      setFetchAgain(!fetchAgain);
      setFetchNotificationsAgain(!fetchNotificationsAgain);
    };
    
    socket.on('message received', messageListener);
    socket.on('group rename', groupRenameListener);
    socket.on('group remove', groupRemoveListener);
    socket.on('group add', groupAddListener);
    
    return () => {
      if (socket) {
        socket.off('message received', messageListener);
        socket.off('group rename', groupRenameListener);
        socket.off('group remove', groupRemoveListener);
        socket.off('group add', groupAddListener);
      }
    };
  }, [selectedChat?.id, socket]);
  return (
    <Fragment>
      {selectedChat?.users?.length ? (
        <Box 
          display="flex" 
          flexDirection="column" 
          height="100%" 
          width="100%"
          minH="0"
          position="relative"
        >
          {/* Modern Header */}
          <Box
            as="header"
            bg={headerBg}
            w="100%"
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            px={{ base: 3, md: 4, lg: 5 }}
            py={{ base: 3, md: 3, lg: 3.5 }}
            borderBottomWidth="1px"
            borderBottomColor={headerBorderColor}
            height={{ base: '64px', md: '68px', lg: '72px' }}
            minH={{ base: '64px', md: '68px', lg: '72px' }}
            maxH={{ base: '64px', md: '68px', lg: '72px' }}
            role="banner"
            flexShrink={0}
            boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
            position="relative"
            zIndex={10}
            backdropFilter="blur(10px)"
            overflow="hidden"
          >
            <Box display="flex" alignItems="center" gap={{ base: 3, md: 4 }} flex="1" minW="0">
              <IconButton
                aria-label="Go back to chat list"
                display={{ base: 'flex', md: 'none' }}
                icon={<ArrowBackIcon boxSize={6} />}
                onClick={() => setSelectedChat({ users: [], groupAdmin: {} })}
                size="lg"
                variant="ghost"
                colorScheme="gray"
                minW="48px"
                minH="48px"
                borderRadius="xl"
                tabIndex={0}
                _hover={{
                  bg: backButtonHover,
                }}
                transition="all 0.15s"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedChat({ users: [], groupAdmin: {} });
                  }
                }}
              />
              
              {!selectedChat?.isGroup ? (
                <>
                  <Box display="flex" alignItems="center" gap={{ base: 3, md: 4 }} flex="1" minW="0" overflow="hidden">
                    <Box 
                      position="relative"
                      flexShrink={0}
                    >
                      <Box
                        as="img"
                        src={getSenderFull(user, selectedChat?.users || [])?.photo}
                        alt={getSender(user, selectedChat?.users || [])}
                        w={{ base: '44px', md: '46px', lg: '48px' }}
                        h={{ base: '44px', md: '46px', lg: '48px' }}
                        borderRadius="full"
                        objectFit="cover"
                        border="2px solid"
                        borderColor={avatarBorder}
                        boxShadow="sm"
                      />
                      <Box
                        position="absolute"
                        bottom="0"
                        right="0"
                        w={{ base: '12px', md: '12px', lg: '14px' }}
                        h={{ base: '12px', md: '12px', lg: '14px' }}
                        bg="green.400"
                        borderRadius="full"
                        border="2px solid"
                        borderColor={avatarBorder}
                      />
                    </Box>
                    <Box flex="1" minW="0" overflow="hidden">
                      <Text 
                        as="h2" 
                        fontSize={{ base: '17px', md: '18px', lg: '19px' }}
                        fontWeight="700"
                        color={color}
                        fontFamily="work sans"
                        isTruncated
                        lineHeight="1.3"
                      >
                        {getSender(user, selectedChat?.users || [])}
                      </Text>
                      <Box
                        key={`typing-status-${typingUser?.id || 'none'}-${selectedChat?.id}`}
                        fontSize={{ base: '11px', md: '12px', lg: '13px' }}
                        color={typingUser ? typingColor : activeColor}
                        fontWeight="600"
                        display="flex"
                        alignItems="center"
                        gap={1}
                        minW="0"
                        flex="1"
                        overflow="hidden"
                      >
                        {typingUser ? (
                          <>
                            <Box
                              as="span"
                              display="inline-block"
                              w="6px"
                              h="6px"
                              bg="currentColor"
                              borderRadius="full"
                              animation="pulse 1.4s ease-in-out infinite"
                              flexShrink={0}
                            />
                            <Box 
                              as="span" 
                              flex="1"
                              minW="0"
                              whiteSpace="nowrap"
                              overflow="hidden"
                              textOverflow="ellipsis"
                            >
                              <Box as="span" display={{ base: 'none', sm: 'inline' }}>
                                {typingUser.name} is typing...
                              </Box>
                              <Box as="span" display={{ base: 'inline', sm: 'none' }}>
                                typing...
                              </Box>
                            </Box>
                          </>
                        ) : (
                          <>
                            <Box
                              as="span"
                              display="inline-block"
                              w="8px"
                              h="8px"
                              bg="green.400"
                              borderRadius="full"
                              flexShrink={0}
                            />
                            <Text as="span" whiteSpace="nowrap">Active now</Text>
                          </>
                        )}
                      </Box>
                    </Box>
                  </Box>
                  {getSenderFull(user, selectedChat?.users || []) && (
                    <ProfileModel
                      userInfo={getSenderFull(user, selectedChat?.users || [])!}
                    />
                  )}
                </>
              ) : (
                <>
                  <Box display="flex" alignItems="center" gap={{ base: 3, md: 4 }} flex="1" minW="0" overflow="hidden">
                    <Box
                      flexShrink={0}
                      w={{ base: '44px', md: '46px', lg: '48px' }}
                      h={{ base: '44px', md: '46px', lg: '48px' }}
                      borderRadius="full"
                      bg={groupAvatarBg}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      fontSize={{ base: '20px', md: '22px', lg: '24px' }}
                      fontWeight="bold"
                      color="white"
                      boxShadow="sm"
                      border="2px solid"
                      borderColor={groupAvatarBorder}
                      overflow="hidden"
                    >
                      {selectedChat.name?.charAt(0).toUpperCase() || 'G'}
                    </Box>
                    <Box flex="1" minW="0" overflow="hidden">
                      <Text 
                        as="h2" 
                        fontSize={{ base: '17px', md: '18px', lg: '19px' }}
                        fontWeight="700"
                        color={color}
                        fontFamily="work sans"
                        isTruncated
                        lineHeight="1.3"
                      >
                        {selectedChat?.name}
                      </Text>
                      <Text
                        fontSize={{ base: '12px', md: '13px', lg: '14px' }}
                        color={groupTextColor}
                        fontWeight="600"
                        display="flex"
                        alignItems="center"
                        gap={1}
                        isTruncated
                      >
                        <Box
                          as="span"
                          display="inline-block"
                          w="4px"
                          h="4px"
                          bg="currentColor"
                          borderRadius="full"
                          flexShrink={0}
                        />
                        {selectedChat.users?.length} members
                      </Text>
                    </Box>
                  </Box>
                  <UpdateGroupChatModel
                    socket={socket}
                    fetchAgain={fetchAgain}
                    setFetchAgain={setFetchAgain}
                    fetchMessages={refetchMessages}
                  />
                </>
              )}
            </Box>
          </Box>
          
          {/* Messages Area */}
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
            {typingUser && (
              <Box
                position="absolute"
                top="12px"
                left="50%"
                transform="translateX(-50%)"
                zIndex={9999}
                bg={popupBg}
                data-testid="typing-popup"
                px={{ base: 3, md: 4 }}
                py={{ base: 2, md: 2.5 }}
                borderRadius="full"
                boxShadow="0 4px 12px rgba(0, 0, 0, 0.15)"
                border="1px solid"
                borderColor={popupBorderColor}
                display="flex"
                alignItems="center"
                gap={{ base: 2, md: 2.5 }}
                animation="slideDown 0.3s ease-out"
                backdropFilter="blur(10px)"
                whiteSpace="nowrap"
                sx={{
                  visibility: 'visible !important',
                  opacity: '1 !important',
                  zIndex: '9999 !important',
                  position: 'absolute !important',
                  pointerEvents: 'none',
                  left: '50% !important',
                  transform: 'translateX(-50%) !important',
                  top: '12px !important',
                  width: 'auto',
                  minWidth: 'fit-content',
                  maxWidth: 'calc(100% - 24px)',
                  // Ensure popup is not clipped - allow overflow
                  clipPath: 'none',
                  overflow: 'visible',
                  // Ensure it's above everything
                  isolation: 'isolate',
                  '@keyframes slideDown': {
                    from: { 
                      opacity: 0, 
                      transform: 'translate(-50%, -15px)',
                    },
                    to: { 
                      opacity: 1, 
                      transform: 'translate(-50%, 0)',
                    },
                  },
                  '@keyframes typingDot': {
                    '0%, 60%, 100%': {
                      transform: 'translateY(0)',
                      opacity: 0.7,
                    },
                    '30%': {
                      transform: 'translateY(-8px)',
                      opacity: 1,
                    },
                  },
                }}
              >
                <Text 
                  fontSize={{ base: 'xs', md: 'sm' }}
                  fontWeight="600" 
                  color={popupTextColor}
                  mr={{ base: 0.5, md: 1 }}
                  isTruncated
                  maxW={{ base: '80px', md: 'none' }}
                >
                  {typingUser.name}
                </Text>
                <Text 
                  fontSize={{ base: 'xs', md: 'sm' }}
                  fontWeight="500" 
                  color={popupTextSecondary}
                  display={{ base: 'none', sm: 'block' }}
                >
                  is typing
                </Text>
                {/* Animated dots */}
                <Box
                  display="flex"
                  alignItems="center"
                  gap={{ base: '3px', md: '4px' }}
                  ml={{ base: 0.5, md: 1 }}
                >
                  <Box
                    as="span"
                    w={{ base: '5px', md: '6px' }}
                    h={{ base: '5px', md: '6px' }}
                    borderRadius="full"
                    bg={dotColor}
                    display="inline-block"
                    sx={{
                      animation: 'typingDot 1.4s ease-in-out infinite',
                      animationDelay: '0s',
                    }}
                  />
                  <Box
                    as="span"
                    w={{ base: '5px', md: '6px' }}
                    h={{ base: '5px', md: '6px' }}
                    borderRadius="full"
                    bg={dotColor}
                    display="inline-block"
                    sx={{
                      animation: 'typingDot 1.4s ease-in-out infinite',
                      animationDelay: '0.2s',
                    }}
                  />
                  <Box
                    as="span"
                    w={{ base: '5px', md: '6px' }}
                    h={{ base: '5px', md: '6px' }}
                    borderRadius="full"
                    bg={dotColor}
                    display="inline-block"
                    sx={{
                      animation: 'typingDot 1.4s ease-in-out infinite',
                      animationDelay: '0.4s',
                    }}
                  />
                </Box>
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
                isLoadingMore={isFetchingNextPage}
                isEndOfMessages={!hasNextPage}
                lastReadMessageId={lastReadMessageId}
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
                onClick={() => {
                  scrollToBottom();
                }}
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
          
          {/* Modern Input Area */}
          <Box
            as="form"
            onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
              sendMessage(e);
            }}
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
                  onChange={(e) => {
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
        </Box>
      ) : (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          h="100%"
          w="100%"
          flexDirection="column"
          gap={{ base: 6, md: 8, lg: 10 }}
          bg={emptyStateBg}
          p={{ base: 6, md: 8, lg: 10 }}
          position="relative"
          overflow="hidden"
        >
          {/* Decorative circles */}
          <Box
            position="absolute"
            top="-50px"
            right="-50px"
            w="200px"
            h="200px"
            borderRadius="full"
            bg={emptyStateCircle1}
            opacity={0.3}
            filter="blur(40px)"
          />
          <Box
            position="absolute"
            bottom="-30px"
            left="-30px"
            w="150px"
            h="150px"
            borderRadius="full"
            bg={emptyStateCircle2}
            opacity={0.3}
            filter="blur(40px)"
          />
          
          <Box
            fontSize={{ base: '80px', md: '100px', lg: '120px' }}
            filter="drop-shadow(0 4px 8px rgba(0,0,0,0.1))"
            animation="float 3s ease-in-out infinite"
          >
            💬
          </Box>
          <Box textAlign="center" maxW="500px" zIndex={1}>
            <Text
              color={color}
              fontSize={{ base: '24px', md: '28px', lg: '32px' }}
              fontFamily="work sans"
              fontWeight="800"
              mb={3}
            >
              Welcome to Bio-Gram
            </Text>
            <Text
              color={emptyStateTextColor}
              fontSize={{ base: '15px', md: '16px', lg: '17px' }}
              fontWeight="500"
              lineHeight="1.6"
            >
              Select a conversation from the sidebar to start chatting or create a new group to connect with others
            </Text>
          </Box>
          
          <style>
            {`
              @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-20px); }
              }
            `}
          </style>
        </Box>
      )}
    </Fragment>
  );
}

export default SingleChat;
