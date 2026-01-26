import { settings } from '@config/settings';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: any;
}

/**
 * Simple logger utility for structured logging
 * In production, this can be extended to use Winston, Pino, or other logging libraries
 */
class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = settings.NODE_ENV === 'development';
  }

  /**
   * Format log message with context
   */
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage('info', message, context));
    }
    // In production, send to logging service
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.warn(this.formatMessage('warn', message, context));
    } else {
      console.warn(this.formatMessage('warn', message, context));
    }
    // In production, send to logging service
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
    };

    if (this.isDevelopment) {
      console.error(this.formatMessage('error', message, errorContext));
      if (error instanceof Error) {
        console.error(error.stack);
      }
    } else {
      console.error(this.formatMessage('error', message, errorContext));
    }
    // In production, send to error tracking service (e.g., Sentry)
  }

  /**
   * Log debug message (only in development)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }
}

// Export singleton instance
const logger = new Logger();
export default logger;

