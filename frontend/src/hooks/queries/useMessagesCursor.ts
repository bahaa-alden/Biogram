import { useInfiniteQuery } from '@tanstack/react-query';
import { messageService } from '../../services/api/message.service';
import { Message, CursorPaginationResponse } from '../../services/api/types';

const DEFAULT_LIMIT = 20;

interface UseMessagesCursorOptions {
  chatId: string | undefined;
  enabled?: boolean;
  centerCursor?: string | null;
}

interface MessagesPage {
  messages: Message[];
  unreadCount: number;
  firstUnreadMessageId: string | null;
  pagination: CursorPaginationResponse;
}

/**
 * Hook for bidirectional cursor-based pagination
 * Supports:
 * - Initial load with centerCursor (around direction)
 * - Loading older messages (before direction) - scroll up
 * - Loading newer messages (after direction) - scroll down
 */
export const useMessagesCursor = ({
  chatId,
  enabled = true,
  centerCursor,
}: UseMessagesCursorOptions) => {
  const query = useInfiniteQuery({
    queryKey: ['messages', 'cursor', chatId, centerCursor],
    queryFn: async ({ pageParam }: { pageParam?: { cursor?: string; direction: 'before' | 'after' | 'around' } }): Promise<MessagesPage> => {
      if (!chatId) {
        throw new Error('Chat ID is required');
      }

      // Handle 'around' direction (initial load with centerCursor)
      if (pageParam?.direction === 'around') {
        const response = await messageService.getMessagesWithCursor(chatId, {
          centerCursor: pageParam.cursor || centerCursor || undefined,
          limit: DEFAULT_LIMIT,
          direction: 'around',
          before: 50, // Load 50 messages before center
          after: 50, // Load 50 messages after center
        });
        return response.data;
      }

      // Handle 'before' direction (load older messages)
      if (pageParam?.direction === 'before') {
        const response = await messageService.getMessagesWithCursor(chatId, {
          cursor: pageParam.cursor,
          limit: DEFAULT_LIMIT,
          direction: 'before',
        });
        return response.data;
      }

      // Handle 'after' direction (load newer messages)
      if (pageParam?.direction === 'after') {
        const response = await messageService.getMessagesWithCursor(chatId, {
          cursor: pageParam.cursor,
          limit: DEFAULT_LIMIT,
          direction: 'after',
        });
        return response.data;
      }

      // No pageParam or unknown direction - initial load
      // Use centerCursor if available, otherwise load most recent
      if (centerCursor) {
        const response = await messageService.getMessagesWithCursor(chatId, {
          centerCursor: centerCursor,
          limit: DEFAULT_LIMIT,
          direction: 'around',
          before: 50, // Load 50 messages before center
          after: 50, // Load 50 messages after center
        });
        return response.data;
      } else {
        // No center cursor - load most recent messages
        const response = await messageService.getMessagesWithCursor(chatId, {
          limit: DEFAULT_LIMIT,
          direction: 'before',
        });
        return response.data;
      }
    },
    enabled: enabled && !!chatId,
    initialPageParam: centerCursor 
      ? { direction: 'around' as const, cursor: centerCursor } 
      : undefined,
    getNextPageParam: (lastPage: MessagesPage, allPages: MessagesPage[], lastPageParam: { cursor?: string; direction: 'before' | 'after' | 'around' } | undefined) => {
      // For 'around' direction, load older messages (before)
      if (lastPageParam?.direction === 'around') {
        if (lastPage.pagination.hasNextPage && lastPage.pagination.nextCursor) {
          return {
            cursor: lastPage.pagination.nextCursor,
            direction: 'before' as const,
          };
        }
        return undefined;
      }

      // For 'before' direction, continue loading older messages
      if (lastPageParam?.direction === 'before') {
        return lastPage.pagination.hasNextPage && lastPage.pagination.nextCursor
          ? {
              cursor: lastPage.pagination.nextCursor,
              direction: 'before' as const,
            }
          : undefined;
      }

      // For 'after' direction, continue loading newer messages
      if (lastPageParam?.direction === 'after') {
        return lastPage.pagination.hasPreviousPage && lastPage.pagination.previousCursor
          ? {
              cursor: lastPage.pagination.previousCursor,
              direction: 'after' as const,
            }
          : undefined;
      }

      return undefined;
    },
    getPreviousPageParam: (firstPage: MessagesPage, allPages: MessagesPage[], firstPageParam: { cursor?: string; direction: 'before' | 'after' | 'around' } | undefined) => {
      // Always check the LAST page (newest messages) to see if there are more newer messages
      const lastPage = allPages[allPages.length - 1];
      
      if (!lastPage || !lastPage.messages || lastPage.messages.length === 0) {
        return undefined;
      }

      // Get the newest message from the last page (last message in array)
      const newestMessage = lastPage.messages[lastPage.messages.length - 1];
      const newestMessageId = newestMessage?.id || newestMessage?._id;
      
      if (!newestMessageId) {
        return undefined;
      }

      // For 'around' direction, load newer messages (after)
      if (firstPageParam?.direction === 'around') {
        const canLoadMore = lastPage?.pagination.hasPreviousPage || lastPage?.pagination.hasMoreAfter;
        if (canLoadMore) {
          return {
            cursor: newestMessageId,
            direction: 'after' as const,
          };
        }
        return undefined;
      }

      // For 'after' direction, continue loading newer messages
      // Check both hasPreviousPage and hasMoreAfter to ensure we can load more
      if (firstPageParam?.direction === 'after') {
        const canLoadMore = lastPage?.pagination.hasPreviousPage || lastPage?.pagination.hasMoreAfter;
        return canLoadMore
          ? {
              cursor: newestMessageId,
              direction: 'after' as const,
            }
          : undefined;
      }

      // For 'before' direction, check if we can load newer messages
      // Look at the last page to see if there are newer messages
      if (firstPageParam?.direction === 'before') {
        const canLoadMore = lastPage?.pagination.hasPreviousPage || lastPage?.pagination.hasMoreAfter;
        if (canLoadMore) {
          return {
            cursor: newestMessageId,
            direction: 'after' as const,
          };
        }
      }

      return undefined;
    },
    staleTime: 1000 * 60 * 3, // 3 minutes - messages don't change often, but keep centerCursor in key
    gcTime: 1000 * 60 * 60, // 1 hour - keep messages in cache longer
    // Prevent auto-fetching multiple pages
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false, // Don't refetch on reconnect, use socket updates instead
    // Structural sharing for better performance
    structuralSharing: true,
  });

  // Calculate total unread count and first unread message ID
  let unreadCount = 0;
  let firstUnreadMessageId: string | null = null;

  for (const page of query.data?.pages || []) {
    if (page.firstUnreadMessageId && !firstUnreadMessageId) {
      firstUnreadMessageId = page.firstUnreadMessageId;
    }
    unreadCount += page.unreadCount;
  }

  return {
    ...query,
    unreadCount,
    firstUnreadMessageId,
  };
};
