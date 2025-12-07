import { settings } from '@config/settings';
import chatRouter from '@routes/chat.routes';
import messageRouter from '@routes/message.routes';
import notificationRouter from '@routes/notification.routes';
import userRouter from '@routes/user.routes';
import { Router } from 'express';

const router = Router();

router.use('/api/v1/users', userRouter);
router.use('/api/v1/chats', chatRouter);
router.use('/api/v1/messages', messageRouter);
router.use('/api/v1/notifications', notificationRouter);

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     description: Returns the health status of the API (production only)
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 */
if (settings.NODE_ENV === 'production') {
  router.get('/health', async (req, res, next) => {
    res.status(200).send({ status: 'success' });
  });
} else {
  /**
   * @swagger
   * /:
   *   get:
   *     summary: API status check
   *     tags: [Health]
   *     description: Returns a success message indicating the API is working (development only)
   *     responses:
   *       200:
   *         description: API is working
   *         content:
   *           text/plain:
   *             schema:
   *               type: string
   *               example: API work successfully
   */
  router.get('/', (req, res, next) => {
    res.send('API work successfully');
  });
}

export default router;
