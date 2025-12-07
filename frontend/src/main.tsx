import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App/App';
import ChatProvider from './Context/ChatProvider';
import { QueryProvider } from './providers/QueryProvider';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';
import theme from './config/theme';
import LoadingUser from './utils/LoadingUser';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <ErrorBoundary>
    <Router>
      <QueryProvider>
        <ChatProvider>
          <ChakraProvider theme={theme}>
            <LoadingUser>
              <ColorModeScript initialColorMode={theme.config.initialColorMode} />
              <App />
            </LoadingUser>
          </ChakraProvider>
        </ChatProvider>
      </QueryProvider>
    </Router>
  </ErrorBoundary>
);
