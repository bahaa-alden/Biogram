import type { RefObject } from 'react';
import { Message } from '../../types/interfaces';
import MessageList from '../Message/MessageList';

interface ScrollableChatProps {
  containerRef: RefObject<HTMLDivElement>;
  messages: Message[];
  loadMoreTriggerRef?: RefObject<HTMLDivElement>;
  loadNewerTriggerRef?: RefObject<HTMLDivElement>;
  isLoadingMore?: boolean;
  isEndOfMessages?: boolean;
  firstUnreadMessageId?: string | null;
  lastReadMessageRef?: RefObject<HTMLDivElement>;
}

function ScrollableChat({ 
  containerRef, 
  messages, 
  loadMoreTriggerRef,
  loadNewerTriggerRef,
  isLoadingMore,
  isEndOfMessages,
  firstUnreadMessageId,
  lastReadMessageRef
}: ScrollableChatProps) {
  // For now, use the existing MessageList component
  // Virtualization can be added later if needed for performance
  return (
    <MessageList
      containerRef={containerRef}
      loadMoreTriggerRef={loadMoreTriggerRef}
      loadNewerTriggerRef={loadNewerTriggerRef}
      isLoadingMore={isLoadingMore}
      isEndOfMessages={isEndOfMessages}
      messages={messages}
      firstUnreadMessageId={firstUnreadMessageId}
      lastReadMessageRef={lastReadMessageRef}
    />
  );
}

export default ScrollableChat;
