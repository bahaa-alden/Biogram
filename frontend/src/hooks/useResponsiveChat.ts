import { useEffect, useState, RefObject } from 'react';

interface UseResponsiveChatReturn {
  chatListWidth: number | undefined;
  chatListRef: RefObject<HTMLDivElement>;
}

/**
 * Hook to track chat list width for responsive display
 */
export const useResponsiveChat = (): UseResponsiveChatReturn => {
  const [chatListWidth, setChatListWidth] = useState<number | undefined>();
  const chatListRef = useState<RefObject<HTMLDivElement>>({ current: null })[0];

  useEffect(() => {
    if (!chatListRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setChatListWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(chatListRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [chatListRef]);

  return { chatListWidth, chatListRef };
};

