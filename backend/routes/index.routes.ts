import { NextFunction, Response, Router } from 'express';
import userRouter from '@routes/user.routes';
import chatRouter from '@routes/chat.routes';
import messageRouter from '@routes/message.routes';
import notificationRouter from '@routes/notification.routes';
import { settings } from '@config/settings';

const router = Router();

router.get(
  '/create-store/auth/woo/callback',
  async (req, res: Response, next: NextFunction) => {
    const { key_id, user_id, consumer_key, consumer_secret } = req.body;
    return res.json({
      success: true,
      key_id,
      user_id,
      consumer_key,
      consumer_secret,
    });
  }
);

router.use('/api/v1/users', userRouter);
router.use('/api/v1/chats', chatRouter);
router.use('/api/v1/messages', messageRouter);
router.use('/api/v1/notifications', notificationRouter);
if (settings.NODE_ENV === 'production') {
  router.get('/health', async (req, res, next) => {
    res.status(200).send({ status: 'success' });
  });

  router.get('*', (req, res: Response, next) => {
    res.redirect('/');
    res.sendFile('index.html');
  });
} else {
  router.get('/', (req, res, next) => {
    res.send('API work successfully');
  });
}

export default router;
