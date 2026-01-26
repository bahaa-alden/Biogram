import { useEffect, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { queryClient } from '../providers/QueryProvider';
import { Message, User } from '../types/interfaces';
import socketService from '../services/socket.service';

/**
 * Hook for managing Socket.IO connection
 * Uses the socket service for connection management and deduplication
 */
export const useSocket = (user: User | undefined) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Handle message received and update React Query cache
  const handleMessageReceived = useCallback((newMessageReceived: Message) => {
    // Normalize message structure
    const normalizedMessage: Message = {
      ...newMessageReceived,
      id: newMessageReceived.id || newMessageReceived._id,
      createdAt: newMessageReceived.createdAt,
    };

    const chatId = newMessageReceived.chat?.id || newMessageReceived.chat?._id;
    if (!chatId) return;

    queryClient.setQueryData(['messages', chatId], (old: unknown) => {
      if (!old) {
        return {
          pages: [{ messages: [normalizedMessage], currentPage: 1 }],
          pageParams: [1],
        };
      }

      const oldData = old as {
        pages: Array<{ messages?: Message[] } | Message[]>;
        pageParams: unknown[];
      };

      const newPages = [...oldData.pages];
      const lastPage = newPages[newPages.length - 1];

      // Handle different page structures
      let messagesArray: Message[] = [];
      if (Array.isArray(lastPage)) {
        messagesArray = lastPage;
      } else if (
        lastPage &&
        typeof lastPage === 'object' &&
        Array.isArray(lastPage.messages)
      ) {
        messagesArray = lastPage.messages;
      } else {
        return old;
      }

      const newMsgId = normalizedMessage.id || normalizedMessage._id;

      // Check if message already exists (deduplication)
      const realMessageExists = messagesArray.some((msg: Message) => {
        if (!msg || typeof msg !== 'object') return false;
        const msgId = msg.id || msg._id;
        return (
          msgId &&
          newMsgId &&
          msgId === newMsgId &&
          !msg.id?.startsWith('temp-')
        );
      });

      if (realMessageExists) {
        return old;
      }

      // Check if there's a temp message to replace
      const hasTempMessage = messagesArray.some(
        (msg: Message) =>
          msg &&
          typeof msg === 'object' &&
          msg.id?.startsWith('temp-') &&
          msg.content === normalizedMessage.content
      );

      if (hasTempMessage) {
        const updatedMessages = messagesArray.map((msg: Message) => {
          if (
            msg &&
            typeof msg === 'object' &&
            msg.id?.startsWith('temp-') &&
            msg.content === normalizedMessage.content
          ) {
            return normalizedMessage;
          }
          return msg;
        });

        if (Array.isArray(lastPage)) {
          newPages[newPages.length - 1] = updatedMessages;
        } else {
          newPages[newPages.length - 1] = {
            ...lastPage,
            messages: updatedMessages,
          };
        }
      } else {
        const updatedMessages = [...messagesArray, normalizedMessage];

        if (Array.isArray(lastPage)) {
          newPages[newPages.length - 1] = updatedMessages;
        } else {
          newPages[newPages.length - 1] = {
            ...lastPage,
            messages: updatedMessages,
          };
        }
      }

      return { ...oldData, pages: newPages };
    });

    // Invalidate chats to update last message
    queryClient.invalidateQueries({ queryKey: ['chats'] });
  }, []);

  // Handle group events
  const handleGroupRename = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['chats'] });
  }, []);

  const handleGroupRemove = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['chats'] });
  }, []);

  const handleGroupAdd = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['chats'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }, []);

  useEffect(() => {
    if (!user?.id) {
      socketService.disconnect();
      setSocket(null);
      setIsConnected(false);
      return;
    }

    // Connect using socket service
    const socketInstance = socketService.connect({
      userId: user.id,
      onConnect: () => {
        setIsConnected(true);
        setSocket(socketInstance);
      },
      onDisconnect: () => {
        setIsConnected(false);
      },
      onMessageReceived: handleMessageReceived,
      onGroupRename: handleGroupRename,
      onGroupRemove: handleGroupRemove,
      onGroupAdd: handleGroupAdd,
    });

    if (socketInstance) {
      setSocket(socketInstance);
      setIsConnected(socketInstance.connected);
    }

    return () => {
      // Only disconnect if user changes, not on unmount
      if (!user?.id) {
        socketService.disconnect();
      }
    };
  }, [
    user?.id,
    handleMessageReceived,
    handleGroupRename,
    handleGroupRemove,
    handleGroupAdd,
  ]);

  return { socket, isConnected };
};
