import {
  CreateMessage,
  deleteMessage,
  getAllMessages,
  getMessage,
  getMessagesWithCursor,
  getReadState,
  markMessagesAsRead,
  saveCenterMessage,
  saveLastVisibleMessage,
  setSenderAndChat,
  updateMessage,
  updateReadState,
} from '@controllers/message.controller';
import { validate } from '@middlewares/validation.middleware';
import {
  createMessageSchema,
  deleteMessageSchema,
  getAllMessagesSchema,
  getMessageSchema,
  markMessagesAsReadSchema,
  updateMessageSchema,
} from '@utils/validation.schemas';
import { Router } from 'express';
import passport from 'passport';

const router = Router({ mergeParams: true });

router.use(
  passport.authenticate('jwt', { session: false, failWithError: true })
);

/**
 * @swagger
 * /api/v1/chats/{chatId}/messages:
 *   get:
 *     summary: Get all messages in a chat
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: List of messages
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   post:
 *     summary: Create a new message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 5000
 *                 example: Hello, how are you?
 *     responses:
 *       201:
 *         description: Message created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Message'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
/**
 * @swagger
 * /api/v1/chats/{chatId}/messages/cursor:
 *   get:
 *     summary: Get messages with bidirectional cursor-based pagination
 *     description: |
 *       Supports three pagination directions:
 *       - **before**: Load older messages (scroll up) - requires `cursor` parameter
 *       - **after**: Load newer messages (scroll down) - requires `cursor` parameter
 *       - **around**: Load messages around a center cursor (initial load) - requires `centerCursor` parameter
 *       
 *       Messages are returned in chronological order (oldest first).
 *       The cursor can be either a base64-encoded cursor or a plain message ID (ObjectId).
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: |
 *           Message ID cursor for pagination (used with 'before' or 'after' direction).
 *           Can be a base64-encoded cursor or plain ObjectId string.
 *         example: "507f1f77bcf86cd799439011"
 *       - in: query
 *         name: centerCursor
 *         schema:
 *           type: string
 *         description: |
 *           Center message ID for 'around' direction (initial load with saved scroll position).
 *           Can be a base64-encoded cursor or plain ObjectId string.
 *         example: "507f1f77bcf86cd799439011"
 *       - in: query
 *         name: direction
 *         schema:
 *           type: string
 *           enum: [before, after, around]
 *           default: before
 *         description: |
 *           Pagination direction:
 *           - **before**: Load older messages (scroll up) - requires `cursor`
 *           - **after**: Load newer messages (scroll down) - requires `cursor`
 *           - **around**: Load messages around center cursor (initial load) - requires `centerCursor`
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Number of messages per page (for 'before' and 'after' directions)
 *       - in: query
 *         name: before
 *         schema:
 *           type: integer
 *           default: 50
 *           minimum: 1
 *           maximum: 100
 *         description: Number of messages to load before center cursor (only for 'around' direction)
 *       - in: query
 *         name: after
 *         schema:
 *           type: integer
 *           default: 50
 *           minimum: 1
 *           maximum: 100
 *         description: Number of messages to load after center cursor (only for 'around' direction)
 *     responses:
 *       200:
 *         description: List of messages with pagination metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     messages:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Message'
 *                       description: Array of messages in chronological order (oldest first)
 *                     unreadCount:
 *                       type: integer
 *                       description: Number of unread messages in the returned set
 *                       example: 5
 *                     firstUnreadMessageId:
 *                       type: string
 *                       nullable: true
 *                       description: ID of the first unread message in the returned set
 *                       example: "507f1f77bcf86cd799439011"
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         nextCursor:
 *                           type: string
 *                           nullable: true
 *                           description: Cursor for loading older messages (scroll up)
 *                           example: "507f1f77bcf86cd799439011"
 *                         previousCursor:
 *                           type: string
 *                           nullable: true
 *                           description: Cursor for loading newer messages (scroll down)
 *                           example: "507f1f77bcf86cd799439011"
 *                         hasNextPage:
 *                           type: boolean
 *                           description: Whether there are more older messages available
 *                           example: true
 *                         hasPreviousPage:
 *                           type: boolean
 *                           description: Whether there are more newer messages available
 *                           example: false
 *                         hasMoreBefore:
 *                           type: boolean
 *                           description: Whether there are more messages before the loaded range (for 'around' direction)
 *                           example: true
 *                         hasMoreAfter:
 *                           type: boolean
 *                           description: Whether there are more messages after the loaded range (for 'around' direction)
 *                           example: false
 *                         oldestCursor:
 *                           type: string
 *                           nullable: true
 *                           description: Cursor for the oldest message in the returned set
 *                           example: "507f1f77bcf86cd799439011"
 *                         newestCursor:
 *                           type: string
 *                           nullable: true
 *                           description: Cursor for the newest message in the returned set
 *                           example: "507f1f77bcf86cd799439011"
 *       400:
 *         description: Bad request - Invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - No access to chat
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Chat not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/cursor', getMessagesWithCursor);

/**
 * @swagger
 * /api/v1/chats/{chatId}/messages/read:
 *   patch:
 *     summary: Mark messages as read
 *     description: Marks all messages in a chat as read, optionally up to a specific message ID
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               lastMessageId:
 *                 type: string
 *                 description: ID of the last message to mark as read (optional, marks all if not provided)
 *                 example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Messages marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     modifiedCount:
 *                       type: integer
 *                       description: Number of messages marked as read
 *                       example: 15
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Chat not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch('/read', validate(markMessagesAsReadSchema), markMessagesAsRead);

/**
 * @swagger
 * /api/v1/chats/{chatId}/messages/center-message:
 *   patch:
 *     summary: Save center message (scroll position)
 *     description: |
 *       Saves the message ID that is currently in the center of the user's viewport.
 *       This is used to restore the scroll position when the user reopens the chat.
 *       The center message is the message closest to the center of the viewport.
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - messageId
 *             properties:
 *               messageId:
 *                 type: string
 *                 description: ID of the message in the center of the viewport
 *                 example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Center message saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     centerMessageId:
 *                       type: string
 *                       description: The saved center message ID
 *                       example: "507f1f77bcf86cd799439011"
 *       400:
 *         description: Bad request - Invalid message ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Chat or message not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch('/center-message', saveCenterMessage);

/**
 * @swagger
 * /api/v1/chats/{chatId}/messages/last-visible:
 *   patch:
 *     summary: Save last visible message (deprecated)
 *     description: |
 *       **Deprecated**: Use `/center-message` instead.
 *       Saves the last visible message ID for backward compatibility.
 *     tags: [Messages]
 *     deprecated: true
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - messageId
 *             properties:
 *               messageId:
 *                 type: string
 *                 description: ID of the last visible message
 *                 example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Last visible message saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     lastVisibleMessageId:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch('/last-visible', saveLastVisibleMessage);

/**
 * @swagger
 * /api/v1/chats/{chatId}/messages/read-state:
 *   get:
 *     summary: Get read state for a chat
 *     description: |
 *       Retrieves the read state for the current user in a chat, including:
 *       - Last seen message ID (for unread tracking)
 *       - Last seen timestamp
 *       - Center message ID (for scroll position restoration)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID
 *     responses:
 *       200:
 *         description: Read state retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     lastSeenMessageId:
 *                       type: string
 *                       nullable: true
 *                       description: ID of the last message the user has read
 *                       example: "507f1f77bcf86cd799439011"
 *                     lastSeenAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                       description: Timestamp when the user last read messages
 *                       example: "2024-01-15T10:30:00.000Z"
 *                     centerMessageId:
 *                       type: string
 *                       nullable: true
 *                       description: ID of the message in the center of the viewport (for scroll restoration)
 *                       example: "507f1f77bcf86cd799439011"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Chat not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   patch:
 *     summary: Update read state for a chat
 *     description: |
 *       Updates the read state for the current user in a chat.
 *       Updates the last seen message ID and timestamp.
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - messageId
 *             properties:
 *               messageId:
 *                 type: string
 *                 description: ID of the message to mark as last seen
 *                 example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Read state updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     lastSeenMessageId:
 *                       type: string
 *                       description: Updated last seen message ID
 *                       example: "507f1f77bcf86cd799439011"
 *                     lastSeenAt:
 *                       type: string
 *                       format: date-time
 *                       description: Updated last seen timestamp
 *                       example: "2024-01-15T10:30:00.000Z"
 *                     centerMessageId:
 *                       type: string
 *                       nullable: true
 *                       description: Center message ID (unchanged)
 *                       example: "507f1f77bcf86cd799439011"
 *       400:
 *         description: Bad request - Invalid message ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Chat or message not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/read-state', getReadState);
router.patch('/read-state', updateReadState);

router
  .route('/')
  .get(validate(getAllMessagesSchema), getAllMessages)
  .post(validate(createMessageSchema), setSenderAndChat, CreateMessage);

/**
 * @swagger
 * /api/v1/chats/{chatId}/messages/{id}:
 *   get:
 *     summary: Get message by ID
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *     responses:
 *       200:
 *         description: Message data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Message'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Message not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   patch:
 *     summary: Update message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 5000
 *                 example: Updated message content
 *     responses:
 *       200:
 *         description: Message updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Message'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Message not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     summary: Delete message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *     responses:
 *       204:
 *         description: Message deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   nullable: true
 *       404:
 *         description: Message not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router
  .route('/:id')
  .get(validate(getMessageSchema), getMessage)
  .patch(validate(updateMessageSchema), updateMessage)
  .delete(validate(deleteMessageSchema), deleteMessage);

export default router;
