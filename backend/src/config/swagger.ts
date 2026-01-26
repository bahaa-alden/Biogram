import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';
import { settings } from './settings';

// Determine the source directory - always point to src, not build
// In Docker, src is copied alongside build, so we can access it
// If running from build/config, go up to root, then to src
const isBuilt = __dirname.includes('build');
const srcDir = isBuilt
  ? path.join(__dirname, '..', '..', 'src')
  : path.join(__dirname, '..');
const routesPath = path.join(srcDir, 'routes');

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Biogram Chat API',
      version: '1.0.0',
      description: 'API documentation for Biogram chat application',
      contact: {
        name: 'API Support',
        email: 'bahaa.abdo@example.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${settings.PORT}`,
        description: 'Development server',
      },
      {
        url: 'https://biogram-api.kaiali.cloud',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'User ID',
              example: '507f1f77bcf86cd799439011',
            },
            name: {
              type: 'string',
              minLength: 2,
              maxLength: 50,
              example: 'John Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john.doe@example.com',
            },
            photo: {
              type: 'string',
              format: 'uri',
              example: 'https://i.imgur.com/7rlze8l.jpg',
            },
            role: {
              type: 'string',
              enum: ['user', 'admin'],
              default: 'user',
              example: 'user',
            },
            active: {
              type: 'boolean',
              default: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Chat: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Chat ID',
              example: '507f1f77bcf86cd799439011',
            },
            name: {
              type: 'string',
              minLength: 1,
              maxLength: 50,
              example: 'Group Chat',
            },
            users: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/User',
              },
              description: 'Array of users in the chat',
            },
            lastMessage: {
              $ref: '#/components/schemas/Message',
            },
            isGroup: {
              type: 'boolean',
              default: false,
              example: false,
            },
            groupAdmin: {
              $ref: '#/components/schemas/User',
              description: 'Admin of the group (only for group chats)',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Message: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Message ID',
              example: '507f1f77bcf86cd799439011',
            },
            content: {
              type: 'string',
              minLength: 1,
              maxLength: 5000,
              example: 'Hello, how are you?',
            },
            sender: {
              $ref: '#/components/schemas/User',
            },
            chat: {
              $ref: '#/components/schemas/Chat',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Notification ID',
              example: '507f1f77bcf86cd799439011',
            },
            message: {
              $ref: '#/components/schemas/Message',
            },
            chat: {
              $ref: '#/components/schemas/Chat',
            },
            user: {
              $ref: '#/components/schemas/User',
            },
            read: {
              type: 'boolean',
              default: false,
              example: false,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'success',
            },
            token: {
              type: 'string',
              description: 'JWT token',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  $ref: '#/components/schemas/User',
                },
              },
            },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'success',
            },
            data: {
              type: 'object',
            },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'success',
            },
            result: {
              type: 'integer',
              description: 'Number of results',
              example: 10,
            },
            data: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  items: {},
                },
              },
            },
          },
        },
        CursorPaginationResponse: {
          type: 'object',
          properties: {
            messages: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Message',
              },
              description: 'Array of messages in chronological order (oldest first)',
            },
            unreadCount: {
              type: 'integer',
              description: 'Number of unread messages in the returned set',
              example: 5,
            },
            firstUnreadMessageId: {
              type: 'string',
              nullable: true,
              description: 'ID of the first unread message in the returned set',
            },
            pagination: {
              type: 'object',
              properties: {
                nextCursor: {
                  type: 'string',
                  nullable: true,
                  description: 'Cursor for loading older messages (scroll up)',
                },
                previousCursor: {
                  type: 'string',
                  nullable: true,
                  description: 'Cursor for loading newer messages (scroll down)',
                },
                hasNextPage: {
                  type: 'boolean',
                  description: 'Whether there are more older messages available',
                },
                hasPreviousPage: {
                  type: 'boolean',
                  description: 'Whether there are more newer messages available',
                },
                hasMoreBefore: {
                  type: 'boolean',
                  description: 'Whether there are more messages before the loaded range (for around direction)',
                },
                hasMoreAfter: {
                  type: 'boolean',
                  description: 'Whether there are more messages after the loaded range (for around direction)',
                },
                oldestCursor: {
                  type: 'string',
                  nullable: true,
                  description: 'Cursor for the oldest message in the returned set',
                },
                newestCursor: {
                  type: 'string',
                  nullable: true,
                  description: 'Cursor for the newest message in the returned set',
                },
              },
            },
          },
        },
        ReadStateResponse: {
          type: 'object',
          properties: {
            lastSeenMessageId: {
              type: 'string',
              nullable: true,
              description: 'ID of the last message the user has read',
            },
            lastSeenAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Timestamp when the user last read messages',
            },
            centerMessageId: {
              type: 'string',
              nullable: true,
              description: 'ID of the message in the center of the viewport (for scroll restoration)',
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'error',
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication endpoints',
      },
      {
        name: 'Users',
        description: 'User management endpoints',
      },
      {
        name: 'Chats',
        description: 'Chat management endpoints',
      },
      {
        name: 'Messages',
        description: 'Message management endpoints',
      },
      {
        name: 'Notifications',
        description: 'Notification management endpoints',
      },
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
    ],
  },
  apis: [`${routesPath}/*.ts`, `${srcDir}/app.ts`],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
