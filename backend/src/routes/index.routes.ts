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
if (settings.NODE_ENV === 'production') {
  router.get('/health', async (req, res, next) => {
    res.status(200).send({ status: 'success' });
  });
} else {
  router.get('/', (req, res, next) => {
    res.send('API work successfully');
  });
}

export default router;
