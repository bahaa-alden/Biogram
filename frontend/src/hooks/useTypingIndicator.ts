import { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';

interface TypingUser {
  name: string;
  id: string;
}

interface UseTypingIndicatorOptions {
  socket: Socket | null;
  chatId: string | undefined;
  userId: string | undefined;
  userName: string | undefined;
  isTyping: boolean;
}

/**
 * Hook for managing typing indicators
 */
export const useTypingIndicator = ({
  socket,
  chatId,
  userId,
  userName,
  isTyping,
}: UseTypingIndicatorOptions) => {
  const [typingUser, setTypingUser] = useState<TypingUser | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emitTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emitStopTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Emit typing indicators when user types
  useEffect(() => {
    if (!socket?.connected || !chatId || !userId) {
      return;
    }

    // Clear any existing timeouts
    if (emitTypingTimeoutRef.current) {
      clearTimeout(emitTypingTimeoutRef.current);
    }
    if (emitStopTypingTimeoutRef.current) {
      clearTimeout(emitStopTypingTimeoutRef.current);
    }

    if (isTyping) {
      // Emit typing after 500ms of typing
      emitTypingTimeoutRef.current = setTimeout(() => {
        if (socket?.connected && chatId && userId) {
          socket.emit('isTyping', {
            chatId,
            userId,
            userName: userName || 'User',
          });
        }
      }, 500);

      // Auto-stop typing after 3 seconds
      emitStopTypingTimeoutRef.current = setTimeout(() => {
        if (socket?.connected && chatId && userId) {
          socket.emit('stop typing', {
            chatId,
            userId,
          });
        }
      }, 3000);
    } else {
      // Message cleared - stop typing immediately
      if (socket?.connected && chatId && userId) {
        socket.emit('stop typing', {
          chatId,
          userId,
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
  }, [isTyping, socket, chatId, userId, userName]);

  // Listen for typing events
  useEffect(() => {
    if (!socket || !chatId || !userId) return;

    const handleTyping = ({ chatId: eventChatId, userId: eventUserId, userName: eventUserName }: { chatId: string; userId: string; userName: string }) => {
      // Only show typing for current chat and not for self
      if (eventChatId === chatId && eventUserId !== userId) {
        // Clear existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        // Set typing user
        const firstName = eventUserName?.split(' ')[0] || eventUserName || 'Someone';
        setTypingUser({ name: firstName, id: eventUserId });
        
        // Auto-hide after 3 seconds of no typing
        typingTimeoutRef.current = setTimeout(() => {
          setTypingUser(null);
        }, 3000);
      }
    };
    
    const handleStopTyping = ({ chatId: eventChatId, userId: eventUserId }: { chatId: string; userId: string }) => {
      // Only handle stop typing for current chat and not for self
      if (eventChatId === chatId && eventUserId !== userId) {
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
    
    socket.on('isTyping', handleTyping);
    socket.on('stop typing', handleStopTyping);
    
    return () => {
      socket.off('isTyping', handleTyping);
      socket.off('stop typing', handleStopTyping);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      setTypingUser(null);
    };
  }, [socket, chatId, userId]);

  return typingUser;
};

