import { useCallback, useEffect, useRef, useState } from 'react';
import { Message } from '../types/interfaces';
import { messageService } from '../services/api/message.service';

interface UseScrollManagementOptions {
  messages: Message[];
  selectedChatId: string | undefined;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  firstUnreadMessageId?: string | null;
  onMarkAsRead?: () => void;
  fetchNextPage?: () => Promise<any>;
  hasNextPage?: boolean;
}

/**
 * Hook for managing scroll behavior, last read tracking, and scroll-to-bottom button
 */
export const useScrollManagement = ({
  messages,
  selectedChatId,
  isLoading,
  isFetchingNextPage,
  firstUnreadMessageId,
  onMarkAsRead,
  fetchNextPage,
  hasNextPage,
}: UseScrollManagementOptions) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
  const lastReadMessageRef = useRef<HTMLDivElement>(null);
  const isScrollingToUnread = useRef(false);
  const isRestoringPosition = useRef(false);
  const [lastReadMessageId, setLastReadMessageId] = useState<string | null>(null);
  const [savedScrollPositionMessageId, setSavedScrollPositionMessageId] = useState<string | null>(null);
  const [shouldScrollToUnread, setShouldScrollToUnread] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const previousChatIdRef = useRef<string | undefined>(selectedChatId);
  
  // Track last marked message ID to prevent duplicate calls
  const lastMarkedMessageIdRef = useRef<string | null>(null);
  const markAsReadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScrollTopRef = useRef<number>(0);
  
  // Track if this is initial load and if user has manually scrolled
  const isInitialLoadRef = useRef<boolean>(true);
  const hasUserScrolledRef = useRef<boolean>(false);
  const previousMessagesLengthRef = useRef<number>(0);

  const scrollToBottom = useCallback((force = false) => {
    setTimeout(() => {
      if (!containerRef.current) return;
      
      // Only auto-scroll if user is near bottom or force is true
      // This prevents auto-scroll when user is reading older messages
      if (!force) {
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 150; // 150px threshold
        
        // If user has scrolled away from bottom, don't auto-scroll
        if (!isNearBottom && hasUserScrolledRef.current) {
          return;
        }
      }
      
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
      // Reset scroll tracking when we scroll to bottom
      hasUserScrolledRef.current = false;
    }, 0);
  }, []);

  // Save last visible message position when chat changes or closes
  useEffect(() => {
    // If chat is closing (selectedChatId changed from something to undefined/null)
    if (previousChatIdRef.current && previousChatIdRef.current !== selectedChatId && containerRef.current && messages.length > 0) {
      // Find the message in the center of the viewport
      const container = containerRef.current;
      const containerHeight = container.clientHeight;
      const viewportCenter = container.scrollTop + containerHeight / 2;
      
      let centerMessage: { id: string; distance: number } | null = null;
      
      messages.forEach((message: Message) => {
        const messageId = message.id || message._id;
        if (!messageId) return;
        const element = container.querySelector(`[data-message-id="${messageId}"]`) as HTMLElement;
        if (!element) return;
        
        const elementTop = element.offsetTop;
        const elementHeight = element.offsetHeight;
        const elementCenter = elementTop + elementHeight / 2;
        
        // Calculate distance from viewport center to message center
        const distance = Math.abs(elementCenter - viewportCenter);
        
        // Prefer messages that are visible in viewport
        const rect = element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const isVisible = rect.bottom >= containerRect.top && rect.top <= containerRect.bottom;
        
        if (isVisible && (!centerMessage || distance < centerMessage.distance)) {
          centerMessage = { id: messageId, distance };
        }
      });
      
      // If no visible message found, find the closest one to center
      if (!centerMessage) {
        messages.forEach((message: Message) => {
          const messageId = message.id || message._id;
          if (!messageId) return;
          const element = container.querySelector(`[data-message-id="${messageId}"]`) as HTMLElement;
          if (!element) return;
          
          const elementTop = element.offsetTop;
          const elementHeight = element.offsetHeight;
          const elementCenter = elementTop + elementHeight / 2;
          const distance = Math.abs(elementCenter - viewportCenter);
          
          if (!centerMessage || distance < centerMessage.distance) {
            centerMessage = { id: messageId, distance };
          }
        });
      }
      
      if (centerMessage) {
        // Save the center message as cursor for this chat
        const scrollPositionKey = `scrollPosition_${previousChatIdRef.current}`;
        // Normalize message ID: use _id if id doesn't exist
        const messageId = centerMessage.id;
        if (messageId) {
          localStorage.setItem(scrollPositionKey, messageId);
          
          // Save to backend as center cursor when chat changes
          messageService.saveCenterMessage(previousChatIdRef.current, messageId).catch((error) => {
            console.error('Failed to save center message to backend:', error);
          });
        }
      }
    }
    
    previousChatIdRef.current = selectedChatId;
  }, [selectedChatId, messages]);

  // Get last read message and saved scroll position from backend (preferred) or localStorage
  useEffect(() => {
    if (selectedChatId) {
      const lastReadKey = `lastRead_${selectedChatId}`;
      const scrollPositionKey = `scrollPosition_${selectedChatId}`;
      
      const storedLastRead = localStorage.getItem(lastReadKey);
      const storedScrollPosition = localStorage.getItem(scrollPositionKey);
      
      if (storedLastRead) {
        setLastReadMessageId(storedLastRead);
      } else {
        setLastReadMessageId(null);
      }
      
      // Use stored scroll position from localStorage
      // Backend scroll position can be fetched separately if needed via saveLastVisibleMessage endpoint
      const scrollPositionToUse = storedScrollPosition;
      
      if (scrollPositionToUse) {
        setSavedScrollPositionMessageId(scrollPositionToUse);
        setShouldScrollToUnread(true);
      } else {
        setSavedScrollPositionMessageId(null);
        setShouldScrollToUnread(false);
      }
    }
  }, [selectedChatId]);

  // Track if we're trying to restore and how many attempts
  const restoreAttemptsRef = useRef<number>(0);
  const maxRestoreAttempts = 10; // Maximum attempts to find the message

  // Restore scroll position to last visible message when chat opens
  // DO NOT auto-scroll to first unread message - only restore last seen position
  useEffect(() => {
    if (messages.length === 0 || !containerRef.current || isLoading) return;
    if (isRestoringPosition.current && isFetchingNextPage) return; // Don't interrupt restoration

    // Check if we have a saved scroll position (last visible message when chat was closed)
    if (savedScrollPositionMessageId) {
      // Wait for messages to render and DOM to settle
      const restoreScroll = async () => {
        if (!containerRef.current || !savedScrollPositionMessageId) {
          isRestoringPosition.current = false;
          restoreAttemptsRef.current = 0;
          return;
        }

        // Try to find the message by ID (handle both id and _id formats)
        let targetElement = containerRef.current.querySelector(
          `[data-message-id="${savedScrollPositionMessageId}"]`
        ) as HTMLElement;
        
        // If not found, try to find by matching message ID in messages array
        if (!targetElement && savedScrollPositionMessageId) {
          const matchingMessage = messages.find((m: Message) => {
            const mId = m.id || m._id;
            return mId === savedScrollPositionMessageId;
          });
          
          if (matchingMessage) {
            const normalizedId = matchingMessage.id || matchingMessage._id;
            targetElement = containerRef.current.querySelector(
              `[data-message-id="${normalizedId}"]`
            ) as HTMLElement;
          }
        }
        
        if (targetElement) {
          // Found the message! Restore scroll position
          isRestoringPosition.current = true;
          const elementTop = targetElement.offsetTop;
          const container = containerRef.current;
          
          // Scroll to the saved message position (last seen, not unread)
          container.scrollTop = elementTop - 20; // Offset by 20px for better visibility
          
          // DON'T clear the saved position - keep it for future loads
          // The centerCursor approach handles this better
          
          setTimeout(() => {
            isRestoringPosition.current = false;
            setSavedScrollPositionMessageId(null);
            setShouldScrollToUnread(false);
            restoreAttemptsRef.current = 0;
          }, 200);
        } else {
          // Message not found in current view - try to load more pages if available
          if (fetchNextPage && hasNextPage && restoreAttemptsRef.current < maxRestoreAttempts) {
            restoreAttemptsRef.current++;
            isRestoringPosition.current = true;
            
            // Check if message exists in the messages array (might be in a page we haven't loaded)
            const messageExists = messages.some((m: Message) => {
              const mId = m.id || m._id;
              return mId === savedScrollPositionMessageId;
            });
            
            if (!messageExists) {
              // Message not in loaded pages, try loading more
              try {
                await fetchNextPage();
                // Wait a bit for new messages to render, then try again
                setTimeout(() => {
                  restoreScroll();
                }, 300);
              } catch (error) {
                // Failed to load more, give up
                isRestoringPosition.current = false;
                restoreAttemptsRef.current = 0;
                setSavedScrollPositionMessageId(null);
                if (selectedChatId) {
                  const scrollPositionKey = `scrollPosition_${selectedChatId}`;
                  localStorage.removeItem(scrollPositionKey);
                }
              }
            } else {
              // Message exists but DOM element not found yet, wait and retry
              setTimeout(() => {
                restoreScroll();
              }, 200);
            }
          } else {
            // No more pages to load or max attempts reached, give up
            isRestoringPosition.current = false;
            restoreAttemptsRef.current = 0;
            setSavedScrollPositionMessageId(null);
            if (selectedChatId) {
              const scrollPositionKey = `scrollPosition_${selectedChatId}`;
              localStorage.removeItem(scrollPositionKey);
            }
          }
        }
      };

      // Only start restoration if not already restoring
      if (!isRestoringPosition.current) {
        isRestoringPosition.current = true;
        // Use multiple requestAnimationFrame calls to ensure DOM is ready
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setTimeout(restoreScroll, 100); // Increased delay to ensure all messages rendered
          });
        });
      }
    } else if (
      !isFetchingNextPage && 
      !isRestoringPosition.current && 
      !savedScrollPositionMessageId &&
      isInitialLoadRef.current &&
      !hasUserScrolledRef.current
    ) {
      // Only scroll to bottom on initial load if:
      // 1. No saved position exists
      // 2. User hasn't scrolled
      // 3. This is the first load (no centerCursor was used)
      // Use a small delay to ensure messages are rendered
      const timer = setTimeout(() => {
        if (
          !isRestoringPosition.current && 
          !savedScrollPositionMessageId &&
          isInitialLoadRef.current &&
          !hasUserScrolledRef.current
        ) {
          scrollToBottom(true); // Force scroll on initial load (only when no centerCursor)
          isInitialLoadRef.current = false;
        }
      }, 100);
      return () => clearTimeout(timer);
    }
    
    // Mark initial load as complete after messages are loaded
    if (messages.length > 0 && isLoading === false && !isFetchingNextPage) {
      if (previousMessagesLengthRef.current === 0 && messages.length > 0) {
        // First time messages are loaded
        isInitialLoadRef.current = false;
      }
      previousMessagesLengthRef.current = messages.length;
    }
  }, [messages.length, isLoading, savedScrollPositionMessageId, isFetchingNextPage, scrollToBottom, selectedChatId]);

  // Track which messages have been viewed and update last read (debounced)
  useEffect(() => {
    if (!containerRef.current || messages.length === 0 || !selectedChatId) return;

    const lastReadKey = `lastRead_${selectedChatId}`;
    let updateTimeout: ReturnType<typeof setTimeout>;
    let lastScrollTop = containerRef.current.scrollTop;
    
    const updateLastRead = (messageId: string) => {
      // Only update if this message is later than current last read
      // Normalize message IDs for comparison
      const currentLastReadIndex = messages.findIndex((m: Message) => {
        const mId = m.id || m._id;
        return mId === lastReadMessageId;
      });
      const newMessageIndex = messages.findIndex((m: Message) => {
        const mId = m.id || m._id;
        return mId === messageId;
      });
      
      if (newMessageIndex > currentLastReadIndex || currentLastReadIndex === -1) {
        clearTimeout(updateTimeout);
        
        // Debounce updates by 2 seconds
        updateTimeout = setTimeout(() => {
          localStorage.setItem(lastReadKey, messageId);
          setLastReadMessageId(messageId);
        }, 2000);
      }
    };

    const handleScroll = () => {
      if (!containerRef.current || isScrollingToUnread.current || isFetchingNextPage || isRestoringPosition.current) return;
      
      const currentScrollTop = containerRef.current.scrollTop;
      const { scrollHeight, clientHeight } = containerRef.current;
      const isScrollingDown = currentScrollTop > lastScrollTop;
      const isNearBottom = scrollHeight - currentScrollTop - clientHeight < 100;
      
      // Track if user has manually scrolled away from bottom
      if (!isNearBottom) {
        hasUserScrolledRef.current = true;
      } else if (isNearBottom && isScrollingDown) {
        // User scrolled back to bottom, allow auto-scroll again
        hasUserScrolledRef.current = false;
      }
      
      lastScrollTop = currentScrollTop;
      lastScrollTopRef.current = currentScrollTop;
      
      // Save the current visible message position (for restoring when chat reopens)
      // This ensures we always have the latest scroll position saved
      if (selectedChatId && messages.length > 0 && !isRestoringPosition.current) {
        const container = containerRef.current;
        const containerRect = container.getBoundingClientRect();
        const viewportTop = containerRect.top + container.scrollTop; // Use absolute position
        
        let closestMessage: { id: string; distance: number; top: number } | null = null;
        
        messages.forEach((message: Message) => {
          const messageId = message.id || message._id;
          if (!messageId) return;
          const element = container.querySelector(`[data-message-id="${messageId}"]`) as HTMLElement;
          if (!element) return;
          
          const rect = element.getBoundingClientRect();
          const elementTop = element.offsetTop;
          
          // Check if message is visible in viewport or near the top
          if (rect.bottom >= containerRect.top && rect.top <= containerRect.bottom) {
            const distance = Math.abs(elementTop - container.scrollTop);
            if (!closestMessage || distance < closestMessage.distance) {
              closestMessage = { id: messageId, distance, top: elementTop };
            }
          }
        });
        
        // Find the message in the center of the viewport (not just closest to top)
        const containerHeight = container.clientHeight;
        const viewportCenter = container.scrollTop + containerHeight / 2;
        
        let centerMessage: { id: string; distance: number } | null = null;
        
        messages.forEach((message: Message) => {
          const messageId = message.id || message._id;
          if (!messageId) return;
          const element = container.querySelector(`[data-message-id="${messageId}"]`) as HTMLElement;
          if (!element) return;
          
          const elementTop = element.offsetTop;
          const elementHeight = element.offsetHeight;
          const elementCenter = elementTop + elementHeight / 2;
          
          // Calculate distance from viewport center to message center
          const distance = Math.abs(elementCenter - viewportCenter);
          
          // Prefer messages that are visible in viewport
          const rect = element.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          const isVisible = rect.bottom >= containerRect.top && rect.top <= containerRect.bottom;
          
          if (isVisible && (!centerMessage || distance < centerMessage.distance)) {
            centerMessage = { id: messageId, distance };
          }
        });
        
        // If no visible message found, use the closest one to center
        if (!centerMessage && closestMessage) {
          centerMessage = { id: closestMessage.id, distance: closestMessage.distance };
        }
        
        // Save the center message as cursor (debounced to avoid excessive writes)
        // Save to both localStorage and backend after 1 second of no scrolling
        if (centerMessage) {
          clearTimeout((handleScroll as any).saveTimeout);
          (handleScroll as any).saveTimeout = setTimeout(async () => {
            if (selectedChatId && !isRestoringPosition.current) {
              const scrollPositionKey = `scrollPosition_${selectedChatId}`;
              // Normalize message ID: use id or _id
              const messageId = centerMessage!.id || (messages.find(m => (m.id || m._id) === centerMessage!.id)?._id);
              if (messageId) {
                // Save to localStorage for quick access
                localStorage.setItem(scrollPositionKey, messageId);
                
                // Save to backend as center cursor for persistence across devices/sessions
                try {
                  await messageService.saveCenterMessage(selectedChatId, messageId);
                } catch (error) {
                  // Silently fail - localStorage backup is still there
                  console.error('Failed to save center message to backend:', error);
                }
              }
            }
          }, 1000); // Save position after 1 second of no scrolling
        }
      }
      
      // Only update last read when scrolling down (reading messages)
      if (!isScrollingDown) return;
      
      // Find the last message that's fully visible
      const visibleMessages = messages.filter((message: Message) => {
        const messageId = message.id || message._id;
        if (!messageId) return false;
        const element = containerRef.current?.querySelector(`[data-message-id="${messageId}"]`);
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        const containerRect = containerRef.current!.getBoundingClientRect();
        
        return rect.bottom <= containerRect.bottom && rect.top >= containerRect.top;
      });
      
      if (visibleMessages.length > 0) {
        const lastVisibleMessage = visibleMessages[visibleMessages.length - 1];
        const messageId = lastVisibleMessage?.id || lastVisibleMessage?._id;
        if (messageId) {
          updateLastRead(messageId);
        }
      }
    };

    const container = containerRef.current;
    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(updateTimeout);
      if ((handleScroll as any).saveTimeout) {
        clearTimeout((handleScroll as any).saveTimeout);
      }
    };
  }, [messages, selectedChatId, lastReadMessageId, isScrollingToUnread, isFetchingNextPage]);

  // Reset tracking refs when chat changes
  useEffect(() => {
    lastMarkedMessageIdRef.current = null;
    lastScrollTopRef.current = 0;
    isInitialLoadRef.current = true;
    hasUserScrolledRef.current = false;
    previousMessagesLengthRef.current = 0;
    if (markAsReadTimeoutRef.current) {
      clearTimeout(markAsReadTimeoutRef.current);
      markAsReadTimeoutRef.current = null;
    }
  }, [selectedChatId]);

  // Show/hide scroll to bottom button based on scroll position
  useEffect(() => {
    if (!containerRef.current || messages.length === 0) return;

    const container = containerRef.current;
    
    const checkScrollPosition = () => {
      if (!container) return;
      
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100; // 100px threshold
      setShowScrollButton(!isNearBottom);
      
      // Only mark as read when user is near bottom AND scrolling down
      const isScrollingDown = scrollTop > lastScrollTopRef.current;
      lastScrollTopRef.current = scrollTop;
      
      // Get the last message ID to check if we've already marked it
      const lastMessage = messages[messages.length - 1];
      const lastMessageId = lastMessage?.id || lastMessage?._id || null;
      
      // Mark messages as read when user scrolls to bottom AND scrolling down
      if (isNearBottom && isScrollingDown && onMarkAsRead && messages.length > 0 && lastMessageId) {
        // Prevent duplicate calls for the same message
        if (lastMarkedMessageIdRef.current === lastMessageId) {
          return;
        }
        
        // Clear any existing timeout
        if (markAsReadTimeoutRef.current) {
          clearTimeout(markAsReadTimeoutRef.current);
        }
        
        // Debounce to 2 seconds to avoid excessive calls
        markAsReadTimeoutRef.current = setTimeout(() => {
          // Double-check we haven't already marked this message
          if (lastMarkedMessageIdRef.current !== lastMessageId) {
            lastMarkedMessageIdRef.current = lastMessageId;
            onMarkAsRead();
          }
        }, 2000);
      }
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
      if (markAsReadTimeoutRef.current) {
        clearTimeout(markAsReadTimeoutRef.current);
        markAsReadTimeoutRef.current = null;
      }
    };
  }, [messages.length, onMarkAsRead, messages]);

  return {
    containerRef,
    loadMoreTriggerRef,
    lastReadMessageRef,
    isScrollingToUnread,
    lastReadMessageId,
    showScrollButton,
    scrollToBottom,
  };
};

