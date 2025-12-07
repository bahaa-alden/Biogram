import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';
import { settings } from './settings';

// Determine the source directory - always point to src, not build
// If running from build/config, go up to src/config, then to src
const isBuilt = __dirname.includes('build');
const srcDir = isBuilt
  ? path.join(__dirname, '..', '..', 'src')
  : path.join(__dirname, '..');
const routesPath = path.join(srcDir, 'ro{at,js}es');

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
  apis: [`${routesPath}/*.{ts,js}`, `${srcDir}/app.{ts,js}`, `${srcDir}/routes/**/*.{ts,js}`],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
