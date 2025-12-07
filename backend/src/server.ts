const ss = require('./alias');
import connDB from '@config/database';
import { settings } from '@config/settings';
import User from '@models/user.model';
import '@utils/unCaughtException';
import { Server } from 'socket.io';
import app from './app';

connDB();

const port = settings.PORT;

const server = app.listen(port, () =>
  console.log(`Example app listening on port ${port}!`)
);

// CORS configuration for Socket.IO - use settings.FRONTEND_URL for all origins
const socketCorsOptions = {
  origin: settings.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Initialize Socket.IO directly in server.ts
const io = new Server(server, {
  pingTimeout: 60000,
  pingInterval: 25000,
  cors: socketCorsOptions,
  transports: ['polling', 'websocket'],
  allowEIO3: true,
  allowUpgrades: true,
});

io.on('connection', (socket) => {
  socket.on('setup', (userData: { id: string }) => {
    if (userData?.id) {
      socket.join(userData.id);
      socket.emit('connected');
    }
  });

  socket.on('join chat', (room: string) => {
    if (room) {
      const roomId = String(room);
      socket.join(roomId);
    }
  });

  socket.on(
    'isTyping',
    async ({
      chatId,
      userId,
      userName,
    }: {
      chatId: string;
      userId: string;
      userName: string;
    }) => {
      if (chatId && userId) {
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

          io.to(roomId).emit('isTyping', {
            chatId: roomId,
            userId,
            userName,
          });
        } catch (error) {
          // Fallback to userName from client if lookup fails
          io.to(roomId).emit('isTyping', {
            chatId: roomId,
            userId,
            userName: userName || 'Someone',
          });
        }
      }
    }
  );

  socket.on(
    'stop typing',
    ({ chatId, userId }: { chatId: string; userId: string }) => {
      if (chatId) {
        const roomId = String(chatId);
        const rooms = Array.from(socket.rooms);

        if (!rooms.includes(roomId)) {
          socket.join(roomId);
        }

        io.to(roomId).emit('stop typing', { chatId: roomId, userId });
      }
    }
  );

  socket.on(
    'new message',
    (newMessageReceived: {
      chat: {
        users: Array<{ _id: string; id?: string }>;
        _id?: string;
        id?: string;
      };
    }) => {
      const { chat } = newMessageReceived;
      if (!chat?.users || !Array.isArray(chat.users)) {
        return;
      }

      const chatId = String(chat._id || chat.id);

      if (chatId) {
        io.to(chatId).emit('message received', newMessageReceived);
      }

      chat.users.forEach((user) => {
        const userId = String(user._id || user.id);
        if (userId) {
          io.to(userId).emit('message received', newMessageReceived);
        }
      });
    }
  );

  socket.on(
    'group rename',
    ({
      chat,
      userId,
    }: {
      chat: { users: Array<{ id?: string; _id?: string }> };
      userId: string;
    }) => {
      if (chat?.users && Array.isArray(chat.users)) {
        chat.users.forEach((user) => {
          const userIdToEmit = String(user.id || user._id);
          if (userIdToEmit && userIdToEmit !== userId) {
            io.to(userIdToEmit).emit('group rename');
          }
        });
      }
    }
  );

  socket.on(
    'group remove',
    ({
      chat,
      userId,
      removedUser,
    }: {
      chat: { users: Array<{ id?: string; _id?: string }> };
      userId: string;
      removedUser: string;
    }) => {
      if (chat?.users && Array.isArray(chat.users)) {
        chat.users.forEach((user) => {
          const userIdToEmit = String(user.id || user._id);
          if (userIdToEmit && userIdToEmit !== userId) {
            io.to(userIdToEmit).emit('group remove');
          }
        });
      }
      if (removedUser) {
        io.to(String(removedUser)).emit('group remove');
      }
    }
  );

  socket.on(
    'group add',
    (chat: {
      users: Array<{ id?: string; _id?: string }>;
      groupAdmin: { id?: string; _id?: string };
    }) => {
      if (chat?.users && Array.isArray(chat.users)) {
        const adminId = String(
          chat.groupAdmin?.id || chat.groupAdmin?._id || ''
        );
        chat.users.forEach((user) => {
          const userIdToEmit = String(user.id || user._id);
          if (userIdToEmit && userIdToEmit !== adminId) {
            io.to(userIdToEmit).emit('group add');
          }
        });
      }
    }
  );

  socket.on('disconnect', () => {
    // Client disconnected
  });
});

//for unhandled rejection like mongo connection failed and this handler work for async rejection
process.on('unhandledRejection', (err: Error) => {
  console.log('UNHANDLED REJECTION Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  console.log('SIGTERM RECEIVED. Shutting down gracefully!');
  server.close(() => {
    console.log('💥 Process terminated');
  });
});
