import { useQuery } from '@tanstack/react-query';
import { userService } from '../../services/api/user.service';
import { User } from '../../types/interfaces';
import { storage } from '../../utils/storage';

export const useAuth = () => {
  const token = storage.getToken();
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const response = await userService.getMe();
      return response.data.data;
    },
    enabled: !!token, // Only fetch if token exists
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
};

export const useUser = (id: string | undefined) => {
  return useQuery({
    queryKey: ['users', id],
    queryFn: async () => {
      if (!id) throw new Error('User ID is required');
      const response = await userService.getUser(id);
      return response.data.data;
    },
    enabled: !!id,
  });
};

