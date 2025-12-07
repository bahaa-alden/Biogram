import { useInfiniteQuery } from '@tanstack/react-query';
import { messageService } from '../../services/api/message.service';
import { Message } from '../../types/interfaces';

const PAGE_SIZE = 16;

export const useMessages = (chatId: string | undefined) => {
  return useInfiniteQuery({
    queryKey: ['messages', chatId],
    queryFn: async ({ pageParam = 1 }: { pageParam: number }) => {
      if (!chatId) throw new Error('Chat ID is required');
      const response = await messageService.getMessages(chatId, {
        page: pageParam,
        limit: PAGE_SIZE,
      });
      return response.data.data;
    },
    enabled: !!chatId,
    initialPageParam: 1,
    getNextPageParam: (lastPage: Message[], allPages: Message[][]): number | undefined => {
      // If last page has fewer messages than PAGE_SIZE, we've reached the end
      if (lastPage.length < PAGE_SIZE) {
        return undefined;
      }
      return allPages.length + 1;
    },
    staleTime: 1000 * 60, // 1 minute
  });
};

