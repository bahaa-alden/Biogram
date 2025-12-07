import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { ENDPOINT } from '../constants/endpoint';
import { queryClient } from '../providers/QueryProvider';
import { Message, User } from '../types/interfaces';

let socketInstance: Socket | null = null;
let eventListenersAttached = false;

export const useSocket = (user: User | undefined) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const userRef = useRef(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    if (!user?.id) {
      if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
        setSocket(null);
        setIsConnected(false);
        eventListenersAttached = false;
      }
      return;
    }

    // Create socket if it doesn't exist
    if (!socketInstance) {
      // Use window.location.origin for same-origin or ENDPOINT if different origin
      // Since vite proxy handles /api, we need to connect directly to backend for socket
      const socketUrl = ENDPOINT;
      socketInstance = io(socketUrl, {
        transports: ['polling', 'websocket'], // Try both transports
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: Infinity,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        autoConnect: true,
        withCredentials: true,
        forceNew: false,
      });

      setSocket(socketInstance);
      // Update connection state if already connected
      if (socketInstance.connected) {
        setIsConnected(true);
      }
    } else {
      setSocket(socketInstance);
      setIsConnected(socketInstance.connected);
    }

    // Attach event listeners only once
    if (!eventListenersAttached && socketInstance) {
      const handleConnect = () => {
        setIsConnected(true);
        if (socketInstance) {
          setSocket(socketInstance);
        }
        if (userRef.current?.id) {
          socketInstance?.emit('setup', { id: userRef.current.id });
        }
      };

      const handleConnected = () => {
        setIsConnected(true);
        if (socketInstance) {
          setSocket(socketInstance);
        }
      };

      const handleDisconnect = () => {
        setIsConnected(false);
      };

      const handleConnectError = (error: any) => {
        setIsConnected(false);
        if (socketInstance && !socketInstance.connected) {
          setTimeout(() => {
            if (socketInstance && !socketInstance.connected) {
              socketInstance.connect();
            }
          }, 2000);
        }
      };

      const handleMessageReceived = (newMessageReceived: Message) => {
        // Validate message has required properties
        if (!newMessageReceived || !newMessageReceived.createdAt) {
          console.error(
            '[useSocket] Invalid message received:',
            newMessageReceived
          );
          return;
        }

        const chatId =
          newMessageReceived.chat?.id || newMessageReceived.chat?._id;
        if (chatId) {
          queryClient.setQueryData(['messages', chatId], (old: any) => {
            // If no cache exists, create initial structure
            if (!old) {
              return {
                pages: [{ messages: [newMessageReceived], currentPage: 1 }],
                pageParams: [1],
              };
            }

            const newPages = [...old.pages];
            const lastPage = newPages[newPages.length - 1];

            // Handle different page structures
            // fetchMessagesPage returns: { messages: [...], nextPage: ..., currentPage: ... }
            let messagesArray: Message[] = [];
            if (Array.isArray(lastPage)) {
              // If lastPage is directly an array of messages (legacy format)
              messagesArray = lastPage;
            } else if (
              lastPage &&
              typeof lastPage === 'object' &&
              Array.isArray(lastPage.messages)
            ) {
              // If lastPage has a messages property (current format from fetchMessagesPage)
              messagesArray = lastPage.messages;
            } else {
              console.error(
                '[useSocket] Unexpected lastPage structure:',
                lastPage
              );
              return old;
            }

            const newMsgId = newMessageReceived.id || newMessageReceived._id;

            // Check if message already exists by ID (real message, not temp)
            const realMessageExists = messagesArray.some((msg: Message) => {
              const msgId = msg.id || msg._id;
              return (
                msgId &&
                newMsgId &&
                msgId === newMsgId &&
                !msg.id?.startsWith('temp-')
              );
            });

            if (realMessageExists) {
              // Real message already exists, don't add duplicate
              return old;
            }

            // Check if there's a temp message with same content to replace
            const hasTempMessage = messagesArray.some(
              (msg: Message) =>
                msg.id?.startsWith('temp-') &&
                msg.content === newMessageReceived.content
            );

            if (hasTempMessage) {
              // Replace temp message with real one
              const updatedMessages = messagesArray.map((msg: Message) => {
                if (
                  msg.id?.startsWith('temp-') &&
                  msg.content === newMessageReceived.content
                ) {
                  return newMessageReceived;
                }
                return msg;
              });

              // Update the last page with the correct structure
              if (Array.isArray(lastPage)) {
                // Legacy format: lastPage is directly an array
                newPages[newPages.length - 1] = updatedMessages;
              } else {
                // Current format: lastPage has messages property
                newPages[newPages.length - 1] = {
                  ...lastPage,
                  messages: updatedMessages,
                  // Preserve other properties like nextPage, currentPage
                };
              }
            } else {
              // No temp message, add new message
              const updatedMessages = [...messagesArray, newMessageReceived];

              // Update the last page with the correct structure
              if (Array.isArray(lastPage)) {
                // Legacy format: lastPage is directly an array
                newPages[newPages.length - 1] = updatedMessages;
              } else {
                // Current format: lastPage has messages property
                newPages[newPages.length - 1] = {
                  ...lastPage,
                  messages: updatedMessages,
                  // Preserve other properties like nextPage, currentPage
                };
              }
            }

            return { ...old, pages: newPages };
          });
          // Invalidate chats to update last message
          queryClient.invalidateQueries({ queryKey: ['chats'] });
        }
      };

      const handleGroupRename = () => {
        queryClient.invalidateQueries({ queryKey: ['chats'] });
      };

      const handleGroupRemove = () => {
        queryClient.invalidateQueries({ queryKey: ['chats'] });
      };

      const handleGroupAdd = () => {
        queryClient.invalidateQueries({ queryKey: ['chats'] });
      };

      socketInstance.on('connect', handleConnect);
      socketInstance.on('connected', handleConnected);
      socketInstance.on('disconnect', handleDisconnect);
      socketInstance.on('connect_error', handleConnectError);
      socketInstance.on('message received', handleMessageReceived);
      socketInstance.on('group rename', handleGroupRename);
      socketInstance.on('group remove', handleGroupRemove);
      socketInstance.on('group add', handleGroupAdd);

      eventListenersAttached = true;

      if (socketInstance.connected && userRef.current?.id) {
        socketInstance.emit('setup', { id: userRef.current.id });
        setIsConnected(true);
        setSocket(socketInstance);
      }
    }

    if (socketInstance) {
      const currentConnected = socketInstance.connected;
      setSocket((prevSocket) => {
        if (prevSocket !== socketInstance) {
          return socketInstance;
        }
        return prevSocket;
      });
      setIsConnected((prevConnected) => {
        if (prevConnected !== currentConnected) {
          return currentConnected;
        }
        return prevConnected;
      });
    }

    const syncInterval = setInterval(() => {
      if (socketInstance) {
        const currentConnected = socketInstance.connected;
        setIsConnected((prevConnected) => {
          if (prevConnected !== currentConnected) {
            return currentConnected;
          }
          return prevConnected;
        });
        setSocket((prevSocket) => {
          if (prevSocket !== socketInstance) {
            return socketInstance;
          }
          return prevSocket;
        });
      }
    }, 500);

    return () => {
      clearInterval(syncInterval);
      // Don't disconnect on unmount, only when user changes
      if (!user?.id && socketInstance) {
        socketInstance.removeAllListeners();
        socketInstance.disconnect();
        socketInstance = null;
        setSocket(null);
        setIsConnected(false);
        eventListenersAttached = false;
      }
    };
  }, [user?.id]);

  return { socket, isConnected };
};
