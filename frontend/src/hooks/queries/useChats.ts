import { useQuery } from '@tanstack/react-query';
import { chatService } from '../../services/api/chat.service';
import { Chat } from '../../types/interfaces';

export const useChats = () => {
  return useQuery<Chat[]>({
    queryKey: ['chats'],
    queryFn: async () => {
      const response = await chatService.getChats();
      return response.data;
    },
    staleTime: 1000 * 30, // 30 seconds
  });
};

export const useChat = (id: string | undefined) => {
  return useQuery<Chat>({
    queryKey: ['chats', id],
    queryFn: async () => {
      if (!id) throw new Error('Chat ID is required');
      const response = await chatService.getChat(id);
      return response.data.data;
    },
    enabled: !!id,
  });
};

