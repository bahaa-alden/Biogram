import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@chakra-ui/react';
import { messageService } from '../../services/api/message.service';
import { Message, User } from '../../types/interfaces';
import { Socket } from 'socket.io-client';

export const useSendMessage = (currentUser: User) => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ chatId, content }: { chatId: string; content: string }) =>
      messageService.sendMessage(chatId, { content }),
    onMutate: async ({ chatId, content }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['messages', chatId] });

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData(['messages', chatId]);

      // Optimistically update cache with current user as sender
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        content,
        sender: {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          photo: currentUser.photo,
        } as User,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData(['messages', chatId], (old: any) => {
        if (!old) return { pages: [[optimisticMessage]], pageParams: [1] };
        const newPages = [...old.pages];
        newPages[newPages.length - 1] = [...newPages[newPages.length - 1], optimisticMessage];
        return { ...old, pages: newPages };
      });

      return { previousMessages };
    },
    onSuccess: (response, variables) => {
      const realMessage = response.data.data;
      // Update with real message from server, replacing temp message or avoiding duplicates
      queryClient.setQueryData(['messages', variables.chatId], (old: any) => {
        if (!old) return { pages: [[realMessage]], pageParams: [1] };
        const newPages = [...old.pages];
        const lastPage = newPages[newPages.length - 1];
        
        // Check if message already exists (from socket)
        const messageExists = lastPage.some(
          (msg: Message) => 
            msg.id === realMessage.id || 
            msg._id === realMessage._id ||
            (msg.id?.startsWith('temp-') && msg.content === realMessage.content)
        );
        
        if (messageExists) {
          // Replace temp message with real one, or update existing real message
          const updatedLastPage = lastPage.map((msg: Message) => {
            if (msg.id?.startsWith('temp-') && msg.content === realMessage.content) {
              return realMessage;
            }
            if (msg.id === realMessage.id || msg._id === realMessage._id) {
              return realMessage;
            }
            return msg;
          });
          newPages[newPages.length - 1] = updatedLastPage;
        } else {
          // Remove temp message if exists, then add real one
          const filteredLastPage = lastPage.filter(
            (msg: Message) => !(msg.id?.startsWith('temp-') && msg.content === realMessage.content)
          );
          newPages[newPages.length - 1] = [...filteredLastPage, realMessage];
        }
        
        return { ...old, pages: newPages };
      });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
    onError: (error: any, variables, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', variables.chatId], context.previousMessages);
      }
      toast({
        status: 'error',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to send message',
        duration: 2500,
        isClosable: true,
        position: 'bottom',
      });
    },
  });
};

export const useUpdateMessage = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ chatId, messageId, content }: { chatId: string; messageId: string; content: string }) =>
      messageService.updateMessage(chatId, messageId, content),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.chatId] });
      toast({
        title: 'Message updated',
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'bottom',
      });
    },
    onError: (error: any) => {
      toast({
        status: 'error',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update message',
        duration: 2500,
        isClosable: true,
        position: 'bottom',
      });
    },
  });
};

export const useDeleteMessage = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ chatId, messageId }: { chatId: string; messageId: string }) =>
      messageService.deleteMessage(chatId, messageId),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.chatId] });
      toast({
        title: 'Message deleted',
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'bottom',
      });
    },
    onError: (error: any) => {
      toast({
        status: 'error',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete message',
        duration: 2500,
        isClosable: true,
        position: 'bottom',
      });
    },
  });
};

