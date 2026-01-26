/**
 * Logger utility for frontend
 * Provides structured logging with environment-based behavior
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
  }

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
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context));
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

    console.error(this.formatMessage('error', message, errorContext));
    
    if (error instanceof Error && this.isDevelopment) {
      console.error(error.stack);
    }

    // In production, send to error tracking service (e.g., Sentry)
    if (!this.isDevelopment && error) {
      // TODO: Integrate with error tracking service
      // Sentry.captureException(error, { extra: context });
    }
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

