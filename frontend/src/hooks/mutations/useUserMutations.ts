import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@chakra-ui/react';
import { userService } from '../../services/api/user.service';
import { User } from '../../types/interfaces';

export const useUpdateMe = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: Partial<User> | FormData) => userService.updateMe(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      queryClient.setQueryData(['auth', 'me'], response.data.data);
      toast({
        title: 'Profile updated',
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
        description: error.response?.data?.message || 'Failed to update profile',
        duration: 2500,
        isClosable: true,
        position: 'bottom',
      });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) => userService.updateUser(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['users', 'search'] });
      toast({
        title: 'User updated',
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
        description: error.response?.data?.message || 'Failed to update user',
        duration: 2500,
        isClosable: true,
        position: 'bottom',
      });
    },
  });
};

export const useDeleteMe = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: () => userService.deleteMe(),
    onSuccess: () => {
      queryClient.clear();
      toast({
        title: 'Account deleted',
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'bottom',
      });
      window.location.href = '/';
    },
    onError: (error: any) => {
      toast({
        status: 'error',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete account',
        duration: 2500,
        isClosable: true,
        position: 'bottom',
      });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => userService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'search'] });
      toast({
        title: 'User deleted',
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
        description: error.response?.data?.message || 'Failed to delete user',
        duration: 2500,
        isClosable: true,
        position: 'bottom',
      });
    },
  });
};

