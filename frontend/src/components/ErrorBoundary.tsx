import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Button, Text, VStack } from '@chakra-ui/react';
import logger from '../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Error caught by boundary', error, {
      componentStack: errorInfo.componentStack,
    });
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box p={8} textAlign="center">
          <VStack spacing={4}>
            <Text fontSize="xl" fontWeight="bold">
              Something went wrong
            </Text>
            <Text color="gray.600">
              {this.state.error?.message || 'An unexpected error occurred'}
            </Text>
            <Button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
            >
              Reload Page
            </Button>
          </VStack>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

