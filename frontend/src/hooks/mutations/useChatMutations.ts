import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@chakra-ui/react';
import { chatService } from '../../services/api/chat.service';
import { CreateChatRequest, CreateGroupChatRequest, UpdateChatRequest } from '../../services/api/types';

export const useCreateChat = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: CreateChatRequest) => chatService.createChat(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      toast({
        title: 'Chat created',
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'bottom',
      });
      return response.data.data;
    },
    onError: (error: any) => {
      toast({
        status: 'error',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create chat',
        duration: 2500,
        isClosable: true,
        position: 'bottom',
      });
    },
  });
};

export const useCreateGroupChat = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: CreateGroupChatRequest) => chatService.createGroupChat(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      toast({
        title: 'Group chat created',
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'bottom',
      });
      return response.data.data;
    },
    onError: (error: any) => {
      toast({
        status: 'error',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create group chat',
        duration: 2500,
        isClosable: true,
        position: 'bottom',
      });
    },
  });
};

export const useUpdateChat = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateChatRequest }) => chatService.updateChat(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      queryClient.invalidateQueries({ queryKey: ['chats', variables.id] });
      toast({
        title: 'Chat updated',
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
        description: error.response?.data?.message || 'Failed to update chat',
        duration: 2500,
        isClosable: true,
        position: 'bottom',
      });
    },
  });
};

export const useDeleteChat = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => chatService.deleteChat(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      toast({
        title: 'Chat deleted',
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
        description: error.response?.data?.message || 'Failed to delete chat',
        duration: 2500,
        isClosable: true,
        position: 'bottom',
      });
    },
  });
};

export const useRenameGroup = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ chatId, chatName }: { chatId: string; chatName: string }) => chatService.renameGroup(chatId, chatName),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      queryClient.invalidateQueries({ queryKey: ['chats', variables.chatId] });
      toast({
        title: 'Group renamed',
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
        description: error.response?.data?.message || 'Failed to rename group',
        duration: 2500,
        isClosable: true,
        position: 'bottom',
      });
    },
  });
};

export const useAddToGroup = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ chatId, userId }: { chatId: string; userId: string }) => chatService.addToGroup(chatId, userId),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      queryClient.invalidateQueries({ queryKey: ['chats', variables.chatId] });
      toast({
        title: 'User added',
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
        description: error.response?.data?.message || 'Failed to add user to group',
        duration: 2500,
        isClosable: true,
        position: 'bottom',
      });
    },
  });
};

export const useRemoveFromGroup = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ chatId, userId }: { chatId: string; userId: string }) => chatService.removeFromGroup(chatId, userId),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      queryClient.invalidateQueries({ queryKey: ['chats', variables.chatId] });
      toast({
        title: 'User removed',
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
        description: error.response?.data?.message || 'Failed to remove user from group',
        duration: 2500,
        isClosable: true,
        position: 'bottom',
      });
    },
  });
};

