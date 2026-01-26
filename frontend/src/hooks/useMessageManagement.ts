import { useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Socket } from 'socket.io-client';
import { messageService } from '../services/api/message.service';
import { notificationService } from '../services/api/notification.service';
import { Chat, Message } from '../types/interfaces';
import logger from '../utils/logger';

interface UseMessageManagementOptions {
  socket: Socket | null;
  selectedChat: Chat | null | undefined;
  selectedChatCompare: Chat | undefined;
  setFetchAgain: (value: boolean) => void;
  setFetchNotificationsAgain: (value: boolean) => void;
  scrollToBottom: (force?: boolean) => void;
}

/**
 * Hook for managing message sending, receiving, and cache updates
 */
export const useMessageManagement = ({
  socket,
  selectedChat,
  selectedChatCompare,
  setFetchAgain,
  setFetchNotificationsAgain,
  scrollToBottom,
}: UseMessageManagementOptions) => {
  const queryClient = useQueryClient();

  // Listen for socket events (messages, group updates)
  useEffect(() => {
    if (!socket || !selectedChat?.id) return;

    const messageListener = (newMessageReceived: Message) => {
      // Validate message has required properties
      if (!newMessageReceived || typeof newMessageReceived !== 'object') {
        logger.error('[SingleChat] Invalid message received (not an object)', undefined, { message: newMessageReceived });
        return;
      }
      if (!newMessageReceived.createdAt) {
        logger.error('[SingleChat] Invalid message received (missing createdAt)', undefined, { message: newMessageReceived });
        return;
      }
      if (!newMessageReceived.id && !newMessageReceived._id) {
        logger.error('[SingleChat] Invalid message received (missing id)', undefined, { message: newMessageReceived });
        return;
      }
      
      // Normalize message structure to ensure consistency
      const normalizedMessage: Message = {
        ...newMessageReceived,
        id: newMessageReceived.id || newMessageReceived._id,
        createdAt: newMessageReceived.createdAt,
      };
      
      if (!selectedChatCompare?.id || selectedChatCompare.id !== normalizedMessage.chat?.id) {
        setFetchAgain((prev) => !prev);
        setFetchNotificationsAgain((prev) => !prev);
      } else if (selectedChat?.id) {
        // Add received message to the query cache (prevent duplicates)
        queryClient.setQueryData(['messages', 'cursor', selectedChat.id], (old: unknown) => {
          if (!old || typeof old !== 'object' || !('pages' in old) || !Array.isArray((old as { pages: unknown[] }).pages)) return old;
          const oldData = old as { pages: Array<{ messages?: Message[]; pagination?: any }> };
          
          const newPages = [...oldData.pages];
          const lastPage = newPages[newPages.length - 1];
          
          // Handle cursor pagination structure: { messages: Message[], pagination: {...} }
          let messagesArray: Message[] = [];
          if (lastPage && typeof lastPage === 'object' && 'messages' in lastPage && Array.isArray(lastPage.messages)) {
            messagesArray = lastPage.messages;
          } else {
            logger.error('[SingleChat] Unexpected lastPage structure', undefined, { lastPage });
            return old;
          }
          
          // Check if message already exists to prevent duplicates
          const newMsgId = normalizedMessage.id || normalizedMessage._id;
          const messageExists = messagesArray.some((msg: Message) => {
            if (!msg || typeof msg !== 'object') return false;
            const msgId = msg.id || msg._id;
            return msgId && newMsgId && msgId === newMsgId;
          });
          
          if (messageExists) {
            return old; // Don't update if message already exists
          }
          
          // Add new message
          const updatedMessages = [...messagesArray, normalizedMessage];
          
          // Update the last page with the correct structure
          newPages[newPages.length - 1] = {
            ...lastPage,
            messages: updatedMessages,
          };
          
          return {
            ...oldData,
            pages: newPages,
          };
        });
        
        // Smooth scroll to bottom after a brief delay to allow DOM update
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            scrollToBottom();
          });
        });
      }
    };
    
    const groupRenameListener = () => {
      setFetchAgain((prev) => !prev);
    };
    
    const groupRemoveListener = () => {
      setFetchAgain((prev) => !prev);
    };
    
    const groupAddListener = () => {
      setFetchAgain((prev) => !prev);
      setFetchNotificationsAgain((prev) => !prev);
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
  }, [socket, selectedChat?.id, selectedChatCompare, setFetchAgain, setFetchNotificationsAgain, queryClient, scrollToBottom]);

  const sendMessage = useCallback(async (
    messageContent: string,
    setIsSending: (value: boolean) => void,
    setNewMessage: (value: string) => void,
    toast: any
  ) => {
    if (!selectedChat?.id) return;
    
    setIsSending(true);
    
    try {
      const response = await messageService.sendMessage(selectedChat.id, { content: messageContent });
      const data = response.data.data;
      
      // Ensure socket is connected and joined to chat room
      if (socket && socket.connected && selectedChat?.id) {
        socket.emit('join chat', selectedChat.id);
        socket.emit('new message', data);
      }
      
      setNewMessage('');
      
      // Add new message to the query cache
      if (selectedChat?.id && data && data.createdAt) {
        queryClient.setQueryData(['messages', 'cursor', selectedChat.id], (old: unknown) => {
          if (!old || typeof old !== 'object' || !('pages' in old) || !Array.isArray((old as { pages: unknown[] }).pages)) return old;
          const oldData = old as { pages: Array<{ messages?: Message[]; pagination?: any }> };
          
          const newPages = [...oldData.pages];
          const lastPage = newPages[newPages.length - 1];
          
          // Handle cursor pagination structure: { messages: Message[], pagination: {...} }
          let messagesArray: Message[] = [];
          if (lastPage && typeof lastPage === 'object' && 'messages' in lastPage && Array.isArray(lastPage.messages)) {
            messagesArray = lastPage.messages;
          } else {
            logger.error('[sendMessage] Unexpected lastPage structure', undefined, { lastPage });
            return old;
          }
          
          // Check if message already exists
          const msgId = data.id || data._id;
          const messageExists = messagesArray.some((msg: Message) => {
            const existingId = msg.id || msg._id;
            return existingId && msgId && existingId === msgId;
          });
          
          if (messageExists) {
            return old; // Don't add duplicate
          }
          
          // Add new message
          const updatedMessages = [...messagesArray, data];
          
          // Update the last page with the correct structure
          newPages[newPages.length - 1] = {
            ...lastPage,
            messages: updatedMessages,
          };
          
          return {
            ...oldData,
            pages: newPages,
          };
        });
      }
      
      scrollToBottom(true); // Force scroll when user sends message
      setFetchAgain((prev) => !prev);

    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast({
        title: 'Error occurred',
        description: error?.response?.data?.message || 'Failed to send the message',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'bottom',
      });
    }
    setIsSending(false);
    scrollToBottom(true); // Force scroll when user sends message
    
    // Stop typing indicator after sending
    if (socket?.connected && selectedChat?.id) {
      socket.emit('stop typing', {
        chatId: selectedChat?.id!,
        userId: selectedChat?.users?.[0]?.id || '',
      });
    }
  }, [selectedChat, socket, queryClient, scrollToBottom, setFetchAgain]);

  const markAsReadRef = useRef<{ chatId: string | null; timeoutId: ReturnType<typeof setTimeout> | null }>({
    chatId: null,
    timeoutId: null,
  });

  const markAsRead = useCallback(async (id: string | undefined, setFetchNotificationsAgain: (value: boolean) => void) => {
    if (!id) return;
    
    // Clear any existing timeout for this chat
    if (markAsReadRef.current.timeoutId) {
      clearTimeout(markAsReadRef.current.timeoutId);
    }
    
    // If we're already marking this chat as read, skip
    if (markAsReadRef.current.chatId === id) {
      return;
    }
    
    // Set the chat ID to prevent duplicate calls
    markAsReadRef.current.chatId = id;
    
    // Debounce the API call by 500ms to prevent rapid calls
    markAsReadRef.current.timeoutId = setTimeout(async () => {
      try {
        await notificationService.markNotificationRead(id);
        setFetchNotificationsAgain((prev) => !prev);
      } catch (error) {
        // Failed to mark notifications as read
        logger.error('Error marking notifications as read', error as Error);
      } finally {
        // Reset after a delay to allow for the same chat to be marked again if needed
        setTimeout(() => {
          if (markAsReadRef.current.chatId === id) {
            markAsReadRef.current.chatId = null;
          }
        }, 2000);
      }
    }, 500);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (markAsReadRef.current.timeoutId) {
        clearTimeout(markAsReadRef.current.timeoutId);
      }
    };
  }, []);

  const markMessagesAsRead = useCallback(async (chatId: string, lastMessageId?: string) => {
    if (!chatId) return;
    
    try {
      // Call API to mark messages as read
      await messageService.markMessagesAsRead(chatId, lastMessageId);
      
      // Update query cache to clear unread count and first unread message ID
      // Update the first page (most recent messages) since that's what's displayed
      queryClient.setQueryData(['messages', 'cursor', chatId], (old: any) => {
        if (!old || !old.pages || !Array.isArray(old.pages)) return old;
        
        const newPages = [...old.pages];
        
        // Update the first page (most recent) to clear unread info
        // The backend has already updated the readers array, so we just clear the UI indicators
        if (newPages.length > 0 && newPages[0]) {
          newPages[0] = {
            ...newPages[0],
            unreadCount: 0,
            firstUnreadMessageId: null,
          };
        }
        
        return {
          ...old,
          pages: newPages,
        };
      });
      
      // Trigger notification refetch (will be debounced by SideDrawer)
      setFetchNotificationsAgain((prev) => !prev);
    } catch (error) {
      logger.error('Error marking messages as read', error as Error);
    }
  }, [queryClient, setFetchNotificationsAgain]);

  return {
    sendMessage,
    markAsRead,
    markMessagesAsRead,
  };
};

