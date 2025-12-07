import { useQuery } from '@tanstack/react-query';
import { notificationService } from '../../services/api/notification.service';
import { Notification } from '../../types/interfaces';

export const useNotifications = (userId: string | undefined, options?: { read?: boolean }) => {
  return useQuery<Notification[]>({
    queryKey: ['notifications', userId, options],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      const response = await notificationService.getNotifications(userId, {
        read: options?.read,
        page: 1,
        limit: 50,
      });
      return response.data.data;
    },
    enabled: !!userId,
    staleTime: 1000 * 30, // 30 seconds
  });
};

