import { Server, Socket } from 'socket.io';
import Message from '@models/message.model';
import User from '@models/user.model';
import logger from '@utils/logger';

interface UserData {
  id: string;
}

interface TypingData {
  chatId: string;
  userId: string;
  userName: string;
}

interface NewMessageData {
  content: string;
  sender: string;
  chat: string;
}

interface GroupRenameData {
  chat: { users: Array<{ id?: string; _id?: string }> };
  userId: string;
}

interface GroupRemoveData {
  chat: { users: Array<{ id?: string; _id?: string }> };
  userId: string;
  removedUser: string;
}

interface GroupAddData {
  chat: {
    users: Array<{ id?: string; _id?: string }>;
    groupAdmin: { id?: string; _id?: string };
  };
}

interface MessageReceivedData {
  chat: {
    users: Array<{ _id: string; id?: string }>;
    _id?: string;
    id?: string;
  };
}

/**
 * Socket Service for managing Socket.IO connections and events
 * Handles message broadcasting, typing indicators, and group operations
 */
class SocketService {
  private io: Server;
  private messageCache: Map<string, Set<string>>; // Track sent messages to prevent duplicates
  private readonly CACHE_TTL = 60000; // 1 minute cache TTL

  constructor(io: Server) {
    this.io = io;
    this.messageCache = new Map();
    this.setupCleanup();
  }

  /**
   * Setup periodic cleanup of message cache
   */
  private setupCleanup(): void {
    setInterval(() => {
      this.messageCache.clear();
    }, this.CACHE_TTL);
  }

  /**
   * Check if message was already sent (deduplication)
   */
  private isMessageDuplicate(messageId: string, chatId: string): boolean {
    const key = `${chatId}:${messageId}`;
    if (this.messageCache.has(key)) {
      return true;
    }
    this.messageCache.set(key, new Set());
    return false;
  }

  /**
   * Get user ID from socket data
   */
  private getUserId(user: any): string | null {
    if (!user) return null;
    return String(user._id || user.id || '');
  }

  /**
   * Get chat ID from chat object
   */
  private getChatId(chat: any): string | null {
    if (!chat) return null;
    return String(chat._id || chat.id || '');
  }

  /**
   * Setup socket connection handlers
   */
  public setupSocketHandlers(socket: Socket): void {
    // User setup - join user's personal room
    socket.on('setup', (userData: UserData) => {
      this.handleSetup(socket, userData);
    });

    // Join chat room
    socket.on('join chat', (room: string) => {
      this.handleJoinChat(socket, room);
    });

    // Typing indicators
    socket.on('isTyping', (data: TypingData) => {
      this.handleTyping(socket, data);
    });

    socket.on('stop typing', (data: { chatId: string; userId: string }) => {
      this.handleStopTyping(socket, data);
    });

    // Message events
    socket.on('new-message', (body: NewMessageData) => {
      this.handleNewMessage(socket, body);
    });

    socket.on('new message', (data: MessageReceivedData) => {
      this.handleNewMessageReceived(socket, data);
    });

    // Group operations
    socket.on('group rename', (data: GroupRenameData) => {
      this.handleGroupRename(data);
    });

    socket.on('group remove', (data: GroupRemoveData) => {
      this.handleGroupRemove(data);
    });

    socket.on('group add', (data: GroupAddData) => {
      this.handleGroupAdd(data);
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });
  }

  /**
   * Handle user setup - join user's personal room
   */
  private handleSetup(socket: Socket, userData: UserData): void {
    if (userData?.id) {
      socket.join(userData.id);
      socket.emit('connected');
    }
  }

  /**
   * Handle joining a chat room
   */
  private handleJoinChat(socket: Socket, room: string): void {
    if (room) {
      const roomId = String(room);
      socket.join(roomId);
    }
  }

  /**
   * Handle typing indicator
   */
  private async handleTyping(
    socket: Socket,
    data: TypingData
  ): Promise<void> {
    const { chatId, userId, userName } = data;

    if (!chatId || !userId) {
      return;
    }

    const roomId = String(chatId);
    const rooms = Array.from(socket.rooms);

    if (!rooms.includes(roomId)) {
      socket.join(roomId);
    }

    // Look up the actual user who is typing to get the correct name
    // Don't trust userName from client as it might be wrong
    try {
      const user = await User.findById(userId).select('name');
      const correctUserName = user?.name || userName || 'Someone';

      this.io.to(roomId).emit('isTyping', {
        chatId: roomId,
        userId,
        userName: correctUserName,
      });
    } catch (error) {
      // Fallback to userName from client if lookup fails
      this.io.to(roomId).emit('isTyping', {
        chatId: roomId,
        userId,
        userName: userName || 'Someone',
      });
    }
  }

  /**
   * Handle stop typing indicator
   */
  private handleStopTyping(
    socket: Socket,
    data: { chatId: string; userId: string }
  ): void {
    const { chatId } = data;

    if (!chatId) {
      return;
    }

    const roomId = String(chatId);
    const rooms = Array.from(socket.rooms);

    if (!rooms.includes(roomId)) {
      socket.join(roomId);
    }

    this.io.to(roomId).emit('stop typing', {
      chatId: roomId,
      userId: data.userId,
    });
  }

  /**
   * Handle new message creation
   */
  private async handleNewMessage(
    socket: Socket,
    body: NewMessageData
  ): Promise<void> {
    try {
      const message = await Message.create(body);
      await message.populate({
        path: 'sender',
        select: 'name photo email _id',
      });
      await message.populate({
        path: 'chat',
        select: { lastMessage: 0 },
        populate: {
          path: 'users',
          select: 'name photo email _id',
        },
      });

      const { chat } = message;

      if (!chat?.users || !Array.isArray(chat.users)) {
        return;
      }

      const chatId = this.getChatId(chat);
      const messageId = message._id.toString();

      // Deduplication check
      if (chatId && this.isMessageDuplicate(messageId, chatId)) {
        return;
      }

      // Convert message to plain object to access timestamps
      const messageObj = message.toObject ? message.toObject() : message;
      
      const messageData = {
        content: message.content,
        sender: message.sender?.id || message.sender?._id,
        chat: message.chat.id || message.chat._id,
        createdAt: (messageObj as any).createdAt || new Date(),
        updatedAt: (messageObj as any).updatedAt || new Date(),
        id: messageId,
      };

      // Emit to chat room
      if (chatId) {
        this.io.to(chatId).emit('message-received', messageData);
      }

      // Emit to individual user rooms
      chat.users.forEach((user: any) => {
        const userId = this.getUserId(user);
        if (userId) {
          this.io.to(userId).emit('message-received', messageData);
        }
      });

    } catch (error) {
      logger.error('Error handling new message', error, { body });
    }
  }

  /**
   * Handle new message received (from client)
   */
  private handleNewMessageReceived(
    socket: Socket,
    data: MessageReceivedData
  ): void {
    const { chat } = data;

    if (!chat?.users || !Array.isArray(chat.users)) {
      return;
    }

    const chatId = this.getChatId(chat);

    if (chatId) {
      this.io.to(chatId).emit('message received', data);
    }

    chat.users.forEach((user) => {
      const userId = this.getUserId(user);
      if (userId) {
        this.io.to(userId).emit('message received', data);
      }
    });
  }

  /**
   * Handle group rename event
   */
  private handleGroupRename(data: GroupRenameData): void {
    const { chat, userId } = data;

    if (!chat?.users || !Array.isArray(chat.users)) {
      return;
    }

    chat.users.forEach((user) => {
      const userIdToEmit = this.getUserId(user);
      if (userIdToEmit && userIdToEmit !== userId) {
        this.io.to(userIdToEmit).emit('group rename');
      }
    });
  }

  /**
   * Handle group remove event
   */
  private handleGroupRemove(data: GroupRemoveData): void {
    const { chat, userId, removedUser } = data;

    if (chat?.users && Array.isArray(chat.users)) {
      chat.users.forEach((user) => {
        const userIdToEmit = this.getUserId(user);
        if (userIdToEmit && userIdToEmit !== userId) {
          this.io.to(userIdToEmit).emit('group remove');
        }
      });
    }

    if (removedUser) {
      this.io.to(String(removedUser)).emit('group remove');
    }
  }

  /**
   * Handle group add event
   */
  private handleGroupAdd(data: GroupAddData): void {
    const { chat } = data;

    if (!chat?.users || !Array.isArray(chat.users)) {
      return;
    }

    const adminId = this.getUserId(chat.groupAdmin);

    chat.users.forEach((user) => {
      const userIdToEmit = this.getUserId(user);
      if (userIdToEmit && userIdToEmit !== adminId) {
        this.io.to(userIdToEmit).emit('group add');
      }
    });
  }

  /**
   * Handle socket disconnect
   */
  private handleDisconnect(socket: Socket): void {
    // Clean up any socket-specific data if needed
    // Rooms are automatically cleaned up by Socket.IO
  }

  /**
   * Get the Socket.IO server instance
   */
  public getIO(): Server {
    return this.io;
  }
}

export default SocketService;

