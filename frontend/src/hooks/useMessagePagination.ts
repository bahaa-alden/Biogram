import { useInfiniteQuery } from '@tanstack/react-query';
import { messageService } from '../services/api/message.service';
import { Message } from '../types/interfaces';

const DEFAULT_PAGE_SIZE = 20;

interface UseMessagePaginationOptions {
  chatId: string | undefined;
  enabled?: boolean;
  pageSize?: number;
}

interface MessagePage {
  messages: Message[];
  nextPage?: number;
  currentPage: number;
}

/**
 * Hook for message pagination with offset-based pagination
 * Can be replaced with cursor-based pagination later
 */
export const useMessagePagination = ({
  chatId,
  enabled = true,
  pageSize = DEFAULT_PAGE_SIZE,
}: UseMessagePaginationOptions) => {
  return useInfiniteQuery({
    queryKey: ['messages', chatId],
    queryFn: async ({ pageParam = 1 }: { pageParam: number }): Promise<MessagePage> => {
      if (!chatId) {
        throw new Error('Chat ID is required');
      }

      const response = await messageService.getMessages(chatId, {
        page: pageParam,
        limit: pageSize,
      });

      const messages = response.data.data || [];
      
      return {
        messages,
        nextPage: messages.length === pageSize ? pageParam + 1 : undefined,
        currentPage: pageParam,
      };
    },
    enabled: enabled && !!chatId,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
};

