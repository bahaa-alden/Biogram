import ScrollableFeed from 'react-scrollable-feed';
import MessageList from '../Message/MessageList';

function ScrollableChat({ containerRef, messages, handleScroll }: any) {
  return (
    <ScrollableFeed>
      <MessageList
        containerRef={containerRef}
        handleScroll={handleScroll}
        messages={messages}
      />
    </ScrollableFeed>
  );
}

export default ScrollableChat;
