import { useQuery } from '@tanstack/react-query';
import { userService } from '../../services/api/user.service';
import { User } from '../../types/interfaces';
import { SearchUsersParams } from '../../services/api/types';

export const useUsers = (params?: SearchUsersParams) => {
  return useQuery<User[]>({
    queryKey: ['users', 'search', params],
    queryFn: async () => {
      const response = await userService.getUsers(params);
      return response.data.data;
    },
    enabled: false, // Only fetch when explicitly called
    staleTime: 1000 * 30, // 30 seconds
  });
};

