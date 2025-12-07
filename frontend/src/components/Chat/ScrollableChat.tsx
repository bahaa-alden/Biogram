import { Message } from '../../types/interfaces';
import MessageList from '../Message/MessageList';

interface ScrollableChatProps {
  containerRef: React.RefObject<HTMLDivElement>;
  messages: Message[];
  loadMoreTriggerRef?: React.RefObject<HTMLDivElement>;
  isLoadingMore?: boolean;
  isEndOfMessages?: boolean;
  lastReadMessageId?: string | null;
  lastReadMessageRef?: React.RefObject<HTMLDivElement>;
}

function ScrollableChat({ 
  containerRef, 
  messages, 
  loadMoreTriggerRef, 
  isLoadingMore,
  isEndOfMessages,
  lastReadMessageId,
  lastReadMessageRef
}: ScrollableChatProps) {
  // For now, use the existing MessageList component
  // Virtualization can be added later if needed for performance
  return (
    <MessageList
      containerRef={containerRef}
      loadMoreTriggerRef={loadMoreTriggerRef}
      isLoadingMore={isLoadingMore}
      isEndOfMessages={isEndOfMessages}
      messages={messages}
      lastReadMessageId={lastReadMessageId}
      lastReadMessageRef={lastReadMessageRef}
    />
  );
}

export default ScrollableChat;
