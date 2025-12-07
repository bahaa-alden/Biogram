import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@chakra-ui/react';
import { authService } from '../../services/api/auth.service';
import { storage } from '../../utils/storage';
import { LoginRequest, SignupRequest } from '../../services/api/types';
import { chatState } from '../../Context/ChatProvider';

export const useLogin = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const toast = useToast();
  const { setUser } = chatState();

  return useMutation({
    mutationFn: (data: LoginRequest) => authService.login(data),
    onSuccess: (response: any) => {
      if (response.status === 'success') {
        // Backend sends: { status: 'success', token: '...', data: { user: {...} } }
        const token = response.token;
        const user = response.data?.user;
        if (token) {
          storage.storeToken(token);
        }
        if (user) {
          setUser(user);
          queryClient.setQueryData(['auth', 'me'], user);
        }
        toast({
          title: 'Logged in',
          description: 'You are logged in now',
          status: 'success',
          duration: 1500,
          isClosable: true,
          position: 'bottom',
        });
        setTimeout(() => {
          navigate('/chats');
        }, 100);
      }
    },
    onError: (error: any) => {
      toast({
        status: 'error',
        title: 'Error',
        description: error.response?.data?.message || 'Login failed',
        duration: 2500,
        isClosable: true,
        position: 'bottom',
      });
    },
  });
};

export const useSignup = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const toast = useToast();
  const { setUser } = chatState();

  return useMutation({
    mutationFn: (data: SignupRequest) => authService.signup(data),
    onSuccess: (response: any) => {
      if (response.status === 'success') {
        // Backend sends: { status: 'success', token: '...', data: { user: {...} } }
        const token = response.token;
        const user = response.data?.user;
        if (token) {
          storage.storeToken(token);
        }
        if (user) {
          setUser(user);
          queryClient.setQueryData(['auth', 'me'], user);
        }
        toast({
          title: 'Account created',
          description: 'Your account has been created successfully',
          status: 'success',
          duration: 1500,
          isClosable: true,
          position: 'bottom',
        });
        setTimeout(() => {
          navigate('/chats');
        }, 100);
      }
    },
    onError: (error: any) => {
      toast({
        status: 'error',
        title: 'Error',
        description: error.response?.data?.message || 'Signup failed',
        duration: 2500,
        isClosable: true,
        position: 'bottom',
      });
    },
  });
};

export const useForgotPassword = () => {
  const toast = useToast();

  return useMutation({
    mutationFn: (email: string) => authService.forgotPassword(email),
    onSuccess: () => {
      toast({
        title: 'Email sent',
        description: 'Please check your email for password reset instructions',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'bottom',
      });
    },
    onError: (error: any) => {
      toast({
        status: 'error',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to send reset email',
        duration: 2500,
        isClosable: true,
        position: 'bottom',
      });
    },
  });
};

export const useResetPassword = () => {
  const toast = useToast();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ token, password, passwordConfirm }: { token: string; password: string; passwordConfirm: string }) =>
      authService.resetPassword(token, password, passwordConfirm),
    onSuccess: () => {
      toast({
        title: 'Password reset',
        description: 'Your password has been reset successfully',
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'bottom',
      });
      navigate('/');
    },
    onError: (error: any) => {
      toast({
        status: 'error',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to reset password',
        duration: 2500,
        isClosable: true,
        position: 'bottom',
      });
    },
  });
};

export const useUpdatePassword = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ passwordCurrent, password, passwordConfirm }: { passwordCurrent: string; password: string; passwordConfirm: string }) =>
      authService.updatePassword(passwordCurrent, password, passwordConfirm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      toast({
        title: 'Password updated',
        description: 'Your password has been updated successfully',
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
        description: error.response?.data?.message || 'Failed to update password',
        duration: 2500,
        isClosable: true,
        position: 'bottom',
      });
    },
  });
};

