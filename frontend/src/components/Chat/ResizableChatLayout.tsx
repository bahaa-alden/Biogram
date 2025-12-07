import { ReactNode, useEffect, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Box, useColorModeValue } from '@chakra-ui/react';

interface ResizableChatLayoutProps {
  chatList: ReactNode;
  chatBox: ReactNode;
  defaultChatListWidth?: number;
  minChatListWidth?: number;
  maxChatListWidth?: number;
}

const STORAGE_KEY = 'biogram_chat_list_width';

export default function ResizableChatLayout({
  chatList,
  chatBox,
  defaultChatListWidth = 35,
  minChatListWidth = 200,
  maxChatListWidth = 500,
}: ResizableChatLayoutProps) {
  const [chatListWidth, setChatListWidth] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? parseInt(saved, 10) : defaultChatListWidth;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, chatListWidth.toString());
  }, [chatListWidth]);

  const handleResize = (sizes: number[]) => {
    if (sizes[0]) {
      setChatListWidth(sizes[0]);
    }
  };

  const borderColor = useColorModeValue('gray.300', 'gray.600');
  const borderHoverColor = useColorModeValue('brand.500', 'brand.400');
  const shadowColor = useColorModeValue('rgba(0, 0, 0, 0.1)', 'rgba(0, 0, 0, 0.3)');

  return (
    <PanelGroup 
      direction="horizontal" 
      onLayout={handleResize}
      style={{ height: '100%', width: '100%', display: 'flex' }}
    >
      <Panel
        defaultSize={chatListWidth}
        minSize={28}
        maxSize={60}
        collapsible={false}
        style={{ height: '100%', overflow: 'hidden' }}
      >
        {chatList}
      </Panel>
      <PanelResizeHandle
        style={{
          width: '3px',
          backgroundColor: borderColor,
          cursor: 'col-resize',
          transition: 'all 0.2s ease',
          flexShrink: 0,
          boxShadow: `0 0 8px ${shadowColor}`,
          position: 'relative',
        }}
        onMouseEnter={(e) => {
          const target = e.currentTarget as HTMLElement;
          target.style.backgroundColor = borderHoverColor;
          target.style.width = '5px';
          target.style.boxShadow = `0 0 12px ${shadowColor}`;
          document.body.style.cursor = 'col-resize';
        }}
        onMouseLeave={(e) => {
          const target = e.currentTarget as HTMLElement;
          target.style.backgroundColor = borderColor;
          target.style.width = '3px';
          target.style.boxShadow = `0 0 8px ${shadowColor}`;
          document.body.style.cursor = 'default';
        }}
      />
      <Panel 
        defaultSize={100 - chatListWidth} 
        minSize={40}
        style={{ height: '100%', overflow: 'hidden' }}
      >
        {chatBox}
      </Panel>
    </PanelGroup>
  );
}

