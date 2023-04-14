import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App/App';
import ChatProvider from './Context/ChatProvider';
import './index.css';
import theme from './config/theme';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <Router>
    <ChatProvider>
      <ChakraProvider>
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
        <App />
      </ChakraProvider>
    </ChatProvider>
  </Router>
);
