const ss = require('./alias');
import connDB from '@config/database';
import { settings } from '@config/settings';
import '@utils/unCaughtException';
import logger from '@utils/logger';
import { Server } from 'socket.io';
import app from './app';
import SocketService from './services/socket.service';

connDB();

const port = settings.PORT;

const server = app.listen(port, () =>
  logger.info(`Server listening on port ${port}`, { port })
);

// CORS configuration for Socket.IO
const io = new Server(server, {
  pingTimeout: 60000,
  pingInterval: 25000,
  cors: {
    origin: true, // Allow all origins (must use true when credentials: true)
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
  transports: ['polling', 'websocket'],
  allowEIO3: true,
  allowUpgrades: true,
});

// Initialize Socket Service
const socketService = new SocketService(io);

// Setup socket connection handlers
io.on('connection', (socket) => {
  socketService.setupSocketHandlers(socket);
});

//for unhandled rejection like mongo connection failed and this handler work for async rejection
process.on('unhandledRejection', (err: Error) => {
  logger.error('UNHANDLED REJECTION Shutting down...', err, {
    name: err.name,
    message: err.message,
  });
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM RECEIVED. Shutting down gracefully!');
  server.close(() => {
    logger.info('Process terminated');
  });
});
