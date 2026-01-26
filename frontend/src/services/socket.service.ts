import { io, Socket } from 'socket.io-client';
import { ENDPOINT } from '../constants/endpoint';
import logger from '../utils/logger';
import { Message, User } from '../types/interfaces';

interface SocketConfig {
  userId?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMessageReceived?: (message: Message) => void;
  onGroupRename?: () => void;
  onGroupRemove?: () => void;
  onGroupAdd?: () => void;
  onTyping?: (data: { chatId: string; userId: string; userName: string }) => void;
  onStopTyping?: (data: { chatId: string; userId: string }) => void;
}

/**
 * Socket Service for managing Socket.IO connections
 * Handles connection lifecycle, message deduplication, and event management
 */
class SocketService {
  private socket: Socket | null = null;
  private messageCache: Set<string> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private config: SocketConfig = {};
  private isConnecting = false;

  /**
   * Initialize socket connection
   */
  public connect(config: SocketConfig): Socket | null {
    if (this.socket?.connected) {
      logger.debug('Socket already connected');
      return this.socket;
    }

    if (this.isConnecting) {
      logger.debug('Socket connection already in progress');
      return this.socket;
    }

    this.config = config;
    this.isConnecting = true;

    try {
      this.socket = io(ENDPOINT, {
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionDelay: this.reconnectDelay,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        autoConnect: true,
        withCredentials: true,
        forceNew: false,
      });

      this.setupEventHandlers();
      this.isConnecting = false;

      return this.socket;
    } catch (error) {
      logger.error('Error creating socket connection', error as Error);
      this.isConnecting = false;
      return null;
    }
  }

  /**
   * Setup socket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      logger.info('Socket connected', { socketId: this.socket?.id });
      this.reconnectAttempts = 0;

      if (this.config.userId) {
        this.emit('setup', { id: this.config.userId });
      }

      if (this.config.onConnect) {
        this.config.onConnect();
      }
    });

    this.socket.on('connected', () => {
      logger.debug('Socket connection confirmed');
      if (this.config.onConnect) {
        this.config.onConnect();
      }
    });

    this.socket.on('disconnect', (reason) => {
      logger.warn('Socket disconnected', { reason });
      if (this.config.onDisconnect) {
        this.config.onDisconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      logger.error('Socket connection error', error);
      this.handleReconnect();
    });

    this.socket.on('message received', (data: Message) => {
      this.handleMessageReceived(data);
    });

    this.socket.on('message-received', (data: Message) => {
      this.handleMessageReceived(data);
    });

    this.socket.on('group rename', () => {
      if (this.config.onGroupRename) {
        this.config.onGroupRename();
      }
    });

    this.socket.on('group remove', () => {
      if (this.config.onGroupRemove) {
        this.config.onGroupRemove();
      }
    });

    this.socket.on('group add', () => {
      if (this.config.onGroupAdd) {
        this.config.onGroupAdd();
      }
    });

    this.socket.on('isTyping', (data: { chatId: string; userId: string; userName: string }) => {
      if (this.config.onTyping) {
        this.config.onTyping(data);
      }
    });

    this.socket.on('stop typing', (data: { chatId: string; userId: string }) => {
      if (this.config.onStopTyping) {
        this.config.onStopTyping(data);
      }
    });
  }

  /**
   * Handle message received with deduplication
   */
  private handleMessageReceived(message: Message): void {
    if (!message || typeof message !== 'object') {
      logger.warn('Invalid message received', { message });
      return;
    }

    const messageId = message.id || message._id;
    if (!messageId) {
      logger.warn('Message missing id', { message });
      return;
    }

    // Deduplication check
    if (this.messageCache.has(messageId)) {
      logger.debug('Duplicate message ignored', { messageId });
      return;
    }

    // Add to cache
    this.messageCache.add(messageId);

    // Clear cache periodically to prevent memory leak
    if (this.messageCache.size > 1000) {
      this.messageCache.clear();
    }

    if (this.config.onMessageReceived) {
      this.config.onMessageReceived(message);
    }
  }

  /**
   * Handle reconnection with exponential backoff
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      30000
    );

    logger.info(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      if (this.socket && !this.socket.connected) {
        this.socket.connect();
      }
    }, delay);
  }

  /**
   * Emit an event
   */
  public emit(event: string, data?: unknown): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      logger.warn('Cannot emit event, socket not connected', { event });
    }
  }

  /**
   * Join a chat room
   */
  public joinChat(chatId: string): void {
    if (chatId) {
      this.emit('join chat', chatId);
    }
  }

  /**
   * Send typing indicator
   */
  public sendTyping(chatId: string, userId: string, userName: string): void {
    this.emit('isTyping', { chatId, userId, userName });
  }

  /**
   * Send stop typing indicator
   */
  public sendStopTyping(chatId: string, userId: string): void {
    this.emit('stop typing', { chatId, userId });
  }

  /**
   * Disconnect socket
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.messageCache.clear();
      this.reconnectAttempts = 0;
      logger.info('Socket disconnected');
    }
  }

  /**
   * Get socket instance
   */
  public getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Check if socket is connected
   */
  public isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;

